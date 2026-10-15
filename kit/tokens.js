/**
 * The design tokens drawing code writes into markup (a colour in a fill, an easing in an
 * animation), read from the custom properties of styles/tokens.css on :root.
 *
 * A token is read once, at its first use, and kept. A value read here cannot be overridden on one
 * element the way a class can; where a picture must restyle a mark, give the mark a class.
 */

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
