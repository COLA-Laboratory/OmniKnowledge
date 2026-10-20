// The sign-in page's logic: the flow's every transition and its countdown, the words a state
// shows, where a signed-in reader goes, and the demo client's rules.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createFlow, destination, resendIn } from '../../sign-in/flow.js';
import { clock, errorText, minutes } from '../../sign-in/view.js';
import { demoClient, DEMO_CODE } from '../../sign-in/auth-demo.js';

/**
 * A client whose answers the test gives by hand.
 */
function handClient() {
  /** @type {((answer: any) => void)[]} */
  const pending = [];
  /** @type {string[]} */
  const calls = [];
  const wait = () => new Promise((resolve) => pending.push(resolve));
  return {
    calls,
    /** @param {any} answer */
    answer: async (answer) => {
      const resolve = pending.shift();
      if (!resolve) throw new Error('no request is waiting');
      resolve(answer);
      await Promise.resolve();
      await Promise.resolve();
    },
    /** @type {import('../../sign-in/auth.js').AuthClient} */
    client: {
      requestCode: (email) => {
        calls.push(`request ${email}`);
        return /** @type {any} */ (wait());
      },
      verifyCode: (email, code) => {
        calls.push(`verify ${email} ${code}`);
        return /** @type {any} */ (wait());
      },
    },
  };
}

const SENT = { ok: true, resendAfterS: 30, expiresInS: 600 };

/** Starts a flow on a hand client and records every state it shows. */
function start() {
  const hand = handClient();
  const flow = createFlow(hand.client);
  /** @type {import('../../sign-in/flow.js').State[]} */
  const seen = [];
  flow.subscribe((s) => seen.push(s));
  const state = () => seen[seen.length - 1];
  return { hand, flow, seen, state };
}

/** Starts a flow and brings it to the code form. */
async function atCode() {
  const t = start();
  const sent = t.flow.sendCode('a@b.org');
  await t.hand.answer(SENT);
  await sent;
  return t;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-15T12:00:00Z'));
});
afterEach(() => vi.useRealTimers());

describe('the flow', () => {
  it('starts at the email form', () => {
    const { state } = start();
    expect(state()).toMatchObject({ step: 'email', form: 'email', email: '' });
  });

  it('email -> sending -> code, with the numbers the client gave', async () => {
    const { hand, flow, state } = start();
    const sent = flow.sendCode('a@b.org');
    expect(state()).toMatchObject({ step: 'sending', form: 'email', email: 'a@b.org' });
    await hand.answer({ ok: true, resendAfterS: 45, expiresInS: 900 });
    await sent;
    expect(state()).toMatchObject({ step: 'code', form: 'code', expiresInS: 900 });
    expect(resendIn(state(), Date.now())).toBe(45);
  });

  it('sending -> limited on the email form when the client refuses', async () => {
    const { hand, flow, state } = start();
    const sent = flow.sendCode('a@b.org');
    await hand.answer({ ok: false, reason: 'rateLimited', retryAfterS: 1800 });
    await sent;
    expect(state()).toMatchObject({ step: 'limited', form: 'email', retryAfterS: 1800 });
  });

  it('limited -> sending again from the email form', async () => {
    const { hand, flow, state } = start();
    const first = flow.sendCode('a@b.org');
    await hand.answer({ ok: false, reason: 'rateLimited', retryAfterS: 60 });
    await first;
    const again = flow.sendCode('a@b.org');
    expect(state().step).toBe('sending');
    await hand.answer(SENT);
    await again;
    expect(state().step).toBe('code');
  });

  it('code -> verifying -> wrong, with the tries left', async () => {
    const { hand, flow, state } = await atCode();
    const tried = flow.verify('111111');
    expect(state()).toMatchObject({ step: 'verifying', form: 'code' });
    await hand.answer({ ok: false, reason: 'mismatch', triesLeft: 3 });
    await tried;
    expect(state()).toMatchObject({ step: 'wrong', triesLeft: 3 });
    expect(hand.calls).toContain('verify a@b.org 111111');
  });

  it('wrong -> code when the reader edits the code', async () => {
    const { hand, flow, state } = await atCode();
    const tried = flow.verify('111111');
    await hand.answer({ ok: false, reason: 'mismatch', triesLeft: 4 });
    await tried;
    flow.edit();
    expect(state().step).toBe('code');
  });

  it('verifying -> expired, -> limited, -> done', async () => {
    for (const [answer, step] of /** @type {const} */ ([
      [{ ok: false, reason: 'expired' }, 'expired'],
      [{ ok: false, reason: 'rateLimited', retryAfterS: 120 }, 'limited'],
      [{ ok: true }, 'done'],
    ])) {
      const { hand, flow, state } = await atCode();
      const tried = flow.verify('123456');
      await hand.answer(answer);
      await tried;
      expect(state()).toMatchObject({ step, form: 'code' });
    }
  });

  it('takes no action while it waits for the client', async () => {
    const { hand, flow, state } = await atCode();
    const tried = flow.verify('111111');
    await flow.verify('222222');
    flow.changeEmail();
    await flow.resend();
    expect(state().step).toBe('verifying');
    expect(hand.calls.filter((c) => c.startsWith('verify'))).toHaveLength(1);
    await hand.answer({ ok: true });
    await tried;
    flow.changeEmail();
    expect(state().step).toBe('done');
  });

  it('code -> email when the reader uses a different email, keeping the address', async () => {
    const { flow, state } = await atCode();
    flow.changeEmail();
    expect(state()).toMatchObject({ step: 'email', form: 'email', email: 'a@b.org' });
  });

  it('after destroy, shows nothing more: no late answer, no tick', async () => {
    const { hand, flow, seen } = await atCode();
    vi.advanceTimersByTime(30_000);
    const resent = flow.resend();
    const shown = seen.length;
    flow.destroy();
    await hand.answer(SENT);
    await resent;
    vi.advanceTimersByTime(60_000);
    expect(seen.length).toBe(shown);
  });

  it('counts down to the next code each second, then lets a new one be asked for', async () => {
    const { hand, flow, seen, state } = await atCode();
    await flow.resend();
    expect(hand.calls.filter((c) => c.startsWith('request'))).toHaveLength(1);
    const shown = () => resendIn(state(), Date.now());
    expect(shown()).toBe(30);
    const before = seen.length;
    vi.advanceTimersByTime(1000);
    expect(seen.length).toBe(before + 1);
    expect(shown()).toBe(29);
    vi.advanceTimersByTime(29_000);
    expect(shown()).toBe(0);
    const ticks = seen.length;
    vi.advanceTimersByTime(5000);
    expect(seen.length, 'no tick once the countdown has ended').toBe(ticks);
    const resent = flow.resend();
    expect(state()).toMatchObject({ step: 'sending', form: 'code' });
    await hand.answer({ ok: true, resendAfterS: 60, expiresInS: 600 });
    await resent;
    expect(state().step).toBe('code');
    expect(shown()).toBe(60);
  });

  it('resend after a mismatch clears it; a refused resend shows limited on the code form', async () => {
    const { hand, flow, state } = await atCode();
    const tried = flow.verify('111111');
    await hand.answer({ ok: false, reason: 'mismatch', triesLeft: 4 });
    await tried;
    vi.advanceTimersByTime(30_000);
    const resent = flow.resend();
    await hand.answer(SENT);
    await resent;
    expect(state().step).toBe('code');
    vi.advanceTimersByTime(30_000);
    const refused = flow.resend();
    await hand.answer({ ok: false, reason: 'rateLimited', retryAfterS: 600 });
    await refused;
    expect(state()).toMatchObject({ step: 'limited', form: 'code' });
  });

  it('returns to the step it left when the client fails, and passes the failure on', async () => {
    const flow = createFlow({
      requestCode: () => Promise.reject(new Error('offline')),
      verifyCode: () => Promise.reject(new Error('offline')),
    });
    /** @type {string[]} */
    const steps = [];
    flow.subscribe((s) => steps.push(s.step));
    await expect(flow.sendCode('a@b.org')).rejects.toThrow('offline');
    expect(steps).toEqual(['email', 'sending', 'email']);
  });
});

describe('the words a state shows', () => {
  /** @param {Partial<import('../../sign-in/flow.js').State>} s */
  const state = (s) => /** @type {import('../../sign-in/flow.js').State} */ ({ triesLeft: 0, retryAfterS: 0, ...s });
  it('counts tries, with one try in the singular', () => {
    expect(errorText(state({ step: 'wrong', triesLeft: 4 }))).toBe("That code doesn't match. You have 4 tries left.");
    expect(errorText(state({ step: 'wrong', triesLeft: 1 }))).toBe("That code doesn't match. You have 1 try left.");
  });
  it('says an expired code and a limit in words', () => {
    expect(errorText(state({ step: 'expired' }))).toBe('That code has expired. Ask for a new one.');
    expect(errorText(state({ step: 'limited', retryAfterS: 3540 }))).toBe('Too many attempts. Try again in 59 minutes.');
    expect(errorText(state({ step: 'limited', retryAfterS: 20 }))).toBe('Too many attempts. Try again in 1 minute.');
    expect(errorText(state({ step: 'code' }))).toBe('');
  });
  it('writes minutes rounded up and the countdown as m:ss', () => {
    expect(minutes(600)).toBe('10 minutes');
    expect(minutes(61)).toBe('2 minutes');
    expect(minutes(60)).toBe('1 minute');
    expect(clock(30)).toBe('0:30');
    expect(clock(5)).toBe('0:05');
    expect(clock(75)).toBe('1:15');
  });
});

describe('where a signed-in reader goes', () => {
  const origin = 'https://colalab.ai';
  it('follows a path on this origin, keeping its query and fragment', () => {
    expect(destination('/OmniKnowledge/app/', origin)).toBe('/OmniKnowledge/app/');
    expect(destination('/app?run=3#map', origin)).toBe('/app?run=3#map');
    expect(destination('/a/../b', origin)).toBe('/b');
  });
  it('refuses anything else and goes to the root', () => {
    for (const next of [
      null,
      '',
      'app',
      'https://colalab.ai/app',
      'https://evil.example/',
      '//evil.example/x',
      '/\\evil.example',
      '/\t/evil.example',
      'javascript:alert(1)',
      ' /app',
    ])
      expect(destination(next, origin), String(next)).toBe('/');
  });
});

describe('the demo client', () => {
  let t = 0;
  const client = () => demoClient({ latencyMs: 0, now: () => t });
  beforeEach(() => {
    vi.useRealTimers();
    t = 0;
  });

  it('signs in with the demo code', async () => {
    const c = client();
    await expect(c.requestCode('a@b.org')).resolves.toEqual({ ok: true, resendAfterS: 30, expiresInS: 600 });
    await expect(c.verifyCode('a@b.org', DEMO_CODE)).resolves.toEqual({ ok: true });
  });
  it('counts misses down, and the fifth ends the code', async () => {
    const c = client();
    await c.requestCode('a@b.org');
    /** @type {unknown[]} */
    const answers = [];
    for (let i = 0; i < 6; i++) answers.push(await c.verifyCode('a@b.org', '000000'));
    expect(answers).toEqual([
      { ok: false, reason: 'mismatch', triesLeft: 4 },
      { ok: false, reason: 'mismatch', triesLeft: 3 },
      { ok: false, reason: 'mismatch', triesLeft: 2 },
      { ok: false, reason: 'mismatch', triesLeft: 1 },
      { ok: false, reason: 'expired' },
      { ok: false, reason: 'expired' },
    ]);
  });
  it('lets a code expire after its time, and knows only the latest address', async () => {
    const c = client();
    await c.requestCode('a@b.org');
    await expect(c.verifyCode('c@d.org', DEMO_CODE)).resolves.toEqual({ ok: false, reason: 'expired' });
    t += 600_000;
    await expect(c.verifyCode('a@b.org', DEMO_CODE)).resolves.toEqual({ ok: false, reason: 'expired' });
  });
  it('limits the sixth request within the hour, and takes requests again after it', async () => {
    const c = client();
    for (let i = 0; i < 5; i++) {
      expect((await c.requestCode('a@b.org')).ok).toBe(true);
      t += 60_000;
    }
    expect(await c.requestCode('a@b.org')).toEqual({ ok: false, reason: 'rateLimited', retryAfterS: 3300 });
    t += 3_300_000;
    expect((await c.requestCode('a@b.org')).ok).toBe(true);
  });
});
