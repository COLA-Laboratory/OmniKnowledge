/**
 * The sign-in flow: the step the form is at, what moves it on, and the countdown to the next code.
 * It knows no words and no DOM: sign-in/view.js renders its state, and an auth client
 * (sign-in/auth.js) does the talking. Also the rule for where a signed-in reader goes.
 */

/** @typedef {'email' | 'sending' | 'code' | 'verifying' | 'wrong' | 'expired' | 'limited' | 'done'} Step */
/**
 * @typedef {object} State
 * @property {Step} step
 * @property {'email' | 'code'} form The form on screen.
 * @property {string} email The address the code goes, or went, to.
 * @property {number} expiresInS How long the code lasts, as the client said when it sent it.
 * @property {number} resendAt When a new code may be asked for, in ms on the flow's clock.
 * @property {number} triesLeft After a mismatch, how many more codes may be tried.
 * @property {number} retryAfterS When limited, how long until the client takes another attempt.
 */
/**
 * @typedef {object} Flow
 * @property {(fn: (state: State, now: number) => void) => () => void} subscribe Calls fn now, on
 *   every change and on every second of the countdown; returns the way to stop.
 * @property {(email: string) => Promise<void>} sendCode Asks for a code from the email form.
 * @property {() => Promise<void>} resend Asks for a new code from the code form, once the
 *   countdown has ended.
 * @property {(code: string) => Promise<void>} verify Tries a code.
 * @property {() => void} changeEmail Returns to the email form, keeping the address.
 * @property {() => void} edit The reader changed the code: a mismatch is no longer shown.
 * @property {() => void} destroy Stops the countdown and drops any answer still awaited.
 */

/** The steps in which the flow waits for the client and takes no action. */
export const BUSY = /** @type {readonly Step[]} */ (['sending', 'verifying', 'done']);

/**
 * Returns the seconds until a new code may be asked for, rounded up; 0 once it may.
 *
 * @param {State} state
 * @param {number} now
 */
export const resendIn = (state, now) => Math.max(0, Math.ceil((state.resendAt - now) / 1000));

/**
 * Starts a flow at the email form.
 *
 * @param {import('./auth.js').AuthClient} client
 * @param {{ now?: () => number }} [options] now: the clock, in ms.
 * @returns {Flow}
 */
export function createFlow(client, { now = Date.now } = {}) {
  /** @type {State} */
  let state = { step: 'email', form: 'email', email: '', expiresInS: 0, resendAt: 0, triesLeft: 0, retryAfterS: 0 };
  /** The request whose answer is awaited; an answer to an older one is dropped. */
  let turn = 0;
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timer;
  /** @type {Set<(state: State, now: number) => void>} */
  const listeners = new Set();

  const emit = () => {
    const t = now();
    for (const fn of listeners) fn(state, t);
  };
  // wakes on each whole second of the countdown while the code form shows it
  const tick = () => {
    clearTimeout(timer);
    const left = state.resendAt - now();
    if (state.form === 'code' && left > 0)
      timer = setTimeout(
        () => {
          emit();
          tick();
        },
        left % 1000 || 1000,
      );
  };
  /** @param {Partial<State>} change */
  const set = (change) => {
    state = { ...state, ...change };
    emit();
    tick();
  };
  const busy = () => BUSY.includes(state.step);

  /**
   * Asks the client for a code and moves on with its answer.
   *
   * @param {string} email
   */
  async function send(email) {
    const mine = ++turn;
    const before = state.step;
    set({ step: 'sending', email });
    let answer;
    try {
      answer = await client.requestCode(email);
    } catch (error) {
      if (mine === turn) set({ step: before });
      throw error;
    }
    if (mine !== turn) return;
    if (answer.ok)
      set({ step: 'code', form: 'code', expiresInS: answer.expiresInS, resendAt: now() + answer.resendAfterS * 1000 });
    else set({ step: 'limited', retryAfterS: answer.retryAfterS });
  }

  return {
    subscribe(fn) {
      listeners.add(fn);
      fn(state, now());
      return () => listeners.delete(fn);
    },
    async sendCode(email) {
      if (state.form !== 'email' || busy()) return;
      await send(email);
    },
    async resend() {
      if (state.form !== 'code' || busy() || resendIn(state, now()) > 0) return;
      await send(state.email);
    },
    async verify(code) {
      if (state.form !== 'code' || busy()) return;
      const mine = ++turn;
      const before = state.step;
      set({ step: 'verifying' });
      let answer;
      try {
        answer = await client.verifyCode(state.email, code);
      } catch (error) {
        if (mine === turn) set({ step: before });
        throw error;
      }
      if (mine !== turn) return;
      if (answer.ok) set({ step: 'done' });
      else if (answer.reason === 'mismatch') set({ step: 'wrong', triesLeft: answer.triesLeft });
      else if (answer.reason === 'expired') set({ step: 'expired' });
      else set({ step: 'limited', retryAfterS: answer.retryAfterS });
    },
    changeEmail() {
      if (state.form !== 'code' || busy()) return;
      turn++;
      set({ step: 'email', form: 'email' });
    },
    edit() {
      if (state.step === 'wrong') set({ step: 'code' });
    },
    destroy() {
      turn++;
      clearTimeout(timer);
      listeners.clear();
    },
  };
}

/**
 * Returns where to go once signed in: the `next` parameter when it is a path on this origin,
 * otherwise the origin's root.
 *
 * @param {string | null} next The raw `next` query parameter.
 * @param {string} origin This page's origin, e.g. "https://colalab.ai".
 * @returns {string} A path, with its query and fragment.
 */
export function destination(next, origin) {
  if (!next || !next.startsWith('/')) return '/';
  try {
    const url = new URL(next, origin);
    return url.origin === origin ? url.pathname + url.search + url.hash : '/';
  } catch {
    return '/';
  }
}
