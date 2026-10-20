/**
 * The auth client: the one interface through which the sign-in page talks to whatever sends and
 * checks codes. The page's entry (sign-in/main.js) chooses the client; nothing else knows which
 * one it has. sign-in/auth-demo.js is the in-memory client the page ships with until the app's
 * own client replaces it.
 */

/**
 * @typedef {{ ok: true, resendAfterS: number, expiresInS: number }} CodeSent A code is on its way:
 *   a new one may be asked for after resendAfterS seconds, and it lasts expiresInS seconds.
 */
/**
 * @typedef {{ ok: false, reason: 'rateLimited', retryAfterS: number }} RateLimited Too many
 *   attempts; the client takes another after retryAfterS seconds.
 */
/** @typedef {{ ok: true }} SignedIn */
/** @typedef {{ ok: false, reason: 'mismatch', triesLeft: number }} Mismatch */
/** @typedef {{ ok: false, reason: 'expired' }} Expired The code can no longer be used. */

/**
 * @typedef {object} AuthClient
 * @property {(email: string) => Promise<CodeSent | RateLimited>} requestCode Sends a sign-in code
 *   to the address.
 * @property {(email: string, code: string) => Promise<SignedIn | Mismatch | Expired | RateLimited>} verifyCode
 *   Checks a code sent to the address; on success the reader is signed in.
 */

export {};
