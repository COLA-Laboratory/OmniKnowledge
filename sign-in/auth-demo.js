/**
 * The demo auth client: in memory, with a short simulated wait, so that every state of the
 * sign-in form can be reached by hand. 123456 signs in; any other code is a mismatch, and the
 * fifth miss ends the code (expired); a sixth code asked for within an hour is rate limited.
 * Nothing leaves the page.
 */

/** The code that signs in. */
export const DEMO_CODE = '123456';
/** How many codes may be asked for in WINDOW_S. */
const REQUESTS = 5;
const WINDOW_S = 3600;
/** How many wrong codes end a code. */
const TRIES = 5;
const RESEND_AFTER_S = 30;
const EXPIRES_IN_S = 600;

/**
 * Returns a demo client.
 *
 * @param {{ latencyMs?: number, now?: () => number }} [options] latencyMs: how long each answer
 *   takes; now: the clock, in ms.
 * @returns {import('./auth.js').AuthClient}
 */
export function demoClient({ latencyMs = 600, now = Date.now } = {}) {
  /** @type {number[]} */
  let asked = [];
  /** @type {{ email: string, issued: number, misses: number } | null} */
  let current = null;
  /** @type {<T>(value: T) => Promise<T>} */
  const later = (value) => new Promise((resolve) => setTimeout(() => resolve(value), latencyMs));

  return {
    requestCode(email) {
      const t = now();
      asked = asked.filter((at) => t - at < WINDOW_S * 1000);
      if (asked.length >= REQUESTS)
        return later({ ok: false, reason: 'rateLimited', retryAfterS: Math.ceil((asked[0] + WINDOW_S * 1000 - t) / 1000) });
      asked.push(t);
      current = { email, issued: t, misses: 0 };
      return later({ ok: true, resendAfterS: RESEND_AFTER_S, expiresInS: EXPIRES_IN_S });
    },
    verifyCode(email, code) {
      const c = current;
      if (!c || c.email !== email || c.misses >= TRIES || now() - c.issued >= EXPIRES_IN_S * 1000)
        return later({ ok: false, reason: 'expired' });
      if (code === DEMO_CODE) {
        current = null;
        return later({ ok: true });
      }
      c.misses++;
      if (c.misses >= TRIES) return later({ ok: false, reason: 'expired' });
      return later({ ok: false, reason: 'mismatch', triesLeft: TRIES - c.misses });
    },
  };
}
