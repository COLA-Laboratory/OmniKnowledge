/**
 * Creating elements. Text is always inserted as text; markup is inserted only through
 * `markup()` and `setMarkup()`, whose names say the caller vouches for it (ESLint forbids
 * innerHTML anywhere else).
 */

const NS = 'http://www.w3.org/2000/svg';

/** @typedef {Record<string, string | number>} Attrs */

/**
 * Sets attributes on an element.
 *
 * @param {Element} e
 * @param {Attrs} attrs
 */
function set(e, attrs) {
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
}

/**
 * Creates an SVG element.
 *
 * @param {string} tag
 * @param {Attrs} [attrs]
 * @param {Element | null} [parent] Appended to when given.
 * @param {string | null} [text] Its text content.
 * @returns {SVGElement}
 */
export function svg(tag, attrs = {}, parent = null, text = null) {
  const e = /** @type {SVGElement} */ (document.createElementNS(NS, tag));
  set(e, attrs);
  if (text != null) e.textContent = text;
  if (parent) parent.appendChild(e);
  return e;
}

/**
 * Creates an HTML element.
 *
 * @param {string} tag
 * @param {Attrs} [attrs]
 * @param {Element | null} [parent] Appended to when given.
 * @param {string | null} [text] Its text content.
 * @returns {HTMLElement}
 */
export function html(tag, attrs = {}, parent = null, text = null) {
  const e = document.createElement(tag);
  set(e, attrs);
  if (text != null) e.textContent = text;
  if (parent) parent.appendChild(e);
  return e;
}

/**
 * Replaces an element's content with markup the drawing code composed from its own constants.
 *
 * Never pass text that came from outside the page's own code: it is parsed as markup.
 *
 * @param {Element} el
 * @param {string} trusted SVG or HTML markup.
 */
export function setMarkup(el, trusted) {
  el.innerHTML = trusted;
}

/**
 * Creates an SVG group holding markup the drawing code composed from its own constants.
 *
 * Never pass text that came from outside the page's own code: it is parsed as markup.
 *
 * @param {Element} parent
 * @param {string} [trusted] SVG markup.
 * @returns {SVGGElement}
 */
export function markup(parent, trusted = '') {
  const g = /** @type {SVGGElement} */ (svg('g', {}, parent));
  if (trusted) setMarkup(g, trusted);
  return g;
}
