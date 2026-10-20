/**
 * The design tokens drawing code writes into markup (a colour in a fill, an easing in an
 * animation), read from the custom properties of styles/tokens.css on :root.
 *
 * A token is read once, at its first use, and kept. A value read here cannot be overridden on one
 * element the way a class can; where a picture must restyle a mark, give the mark a class. A
 * module script can run before the page's stylesheets have loaded: an entry waits for
 * stylesReady() before anything reads a token.
 */

/** How long stylesReady() waits for a stylesheet that neither loads nor fails, in ms. */
export const STYLES_WAIT = 2500;

/**
 * Resolves once every stylesheet of the page has loaded or failed, or after STYLES_WAIT. Never
 * rejects.
 *
 * @returns {Promise<void>}
 */
export function stylesReady() {
  const pending = [...document.querySelectorAll('link[rel="stylesheet"]')].filter(
    (link) => link instanceof HTMLLinkElement && !link.sheet,
  );
  const settled = pending.map(
    (link) =>
      new Promise((resolve) => {
        link.addEventListener('load', resolve, { once: true });
        link.addEventListener('error', resolve, { once: true });
      }),
  );
  return Promise.race([Promise.all(settled), new Promise((resolve) => setTimeout(resolve, STYLES_WAIT))]).then(() => {});
}

/** @type {Map<string, string>} */
const cache = new Map();

/**
 * Returns the value of a token.
 *
 * @param {string} name The custom property's name without its leading dashes, e.g. "ink".
 * @returns {string}
 * @throws {Error} When :root defines no such property (styles/tokens.css did not load).
 */
export function token(name) {
  let value = cache.get(name);
  if (value === undefined) {
    value = getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim();
    if (!value) throw new Error(`kit/tokens: :root has no --${name}`);
    cache.set(name, value);
  }
  return value;
}
