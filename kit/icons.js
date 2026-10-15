/**
 * The glyphs drawn inside pictures, each in a 20 by 20 box and styled by class "ic" (white
 * strokes; class "f" for filled dots), and the black tile they stand on. The page's own icons
 * (brand, arrow, chevron) are in assets/icons.svg.
 */
import { f } from './format.js';

/** @typedef {keyof typeof GLYPHS} Glyph */

/** The glyphs: three searches, the two directions of citation tracing, and a ticked criterion. */
export const GLYPHS = {
  /** citation tracing */
  cite: '<path d="M4 15.5 10 10l6-5.5M10 10l5.5 5"/><circle class="f" cx="4" cy="15.5" r="2.1"/><circle class="f" cx="10" cy="10" r="2.1"/><circle class="f" cx="16" cy="4.5" r="2.1"/><circle class="f" cx="15.5" cy="15" r="2.1"/>',
  /** semantic search */
  sem: '<circle cx="10" cy="10" r="7.6" stroke-dasharray="1.6 2.9"/><circle class="f" cx="10" cy="10" r="2.3"/><circle class="f" cx="13.6" cy="6.9" r="1.2"/><circle class="f" cx="6.3" cy="12.9" r="1.2"/><circle class="f" cx="12.9" cy="13.9" r="1.2"/>',
  /** database search */
  db: '<rect x="2.6" y="2.8" width="14.8" height="4.6" rx="2.3"/><path d="M6.6 11h10.2M6.6 14.2h10.2M6.6 17.4h6.4"/><circle class="f" cx="3.4" cy="11" r="1"/><circle class="f" cx="3.4" cy="14.2" r="1"/><circle class="f" cx="3.4" cy="17.4" r="1"/>',
  /** backward tracing: the papers a paper cites */
  back: '<circle class="f" cx="14.6" cy="10" r="2.6"/><path d="M11 10H3.4M6.9 6.4 3.3 10l3.6 3.6"/>',
  /** forward tracing: the papers that cite it */
  fwd: '<circle class="f" cx="5.4" cy="10" r="2.6"/><path d="M9 10h7.6M13.1 6.4l3.6 3.6-3.6 3.6"/>',
  /** a criterion met */
  check: '<rect x="3" y="3" width="14" height="14" rx="3.4"/><path d="M6.7 10.4l2.4 2.4 4.4-5.4"/>',
};

/**
 * Returns a glyph on a black rounded tile.
 *
 * @param {number} x The tile's top left corner.
 * @param {number} y
 * @param {number} size Its side; 22 is the size the glyph is drawn for.
 * @param {Glyph} key
 * @returns {string} SVG markup.
 */
export function tile(x, y, size, key) {
  const k = size / 22;
  return `<rect class="tile" x="${f(x)}" y="${f(y)}" width="${size}" height="${size}" rx="${f(6.6 * k)}"/><g class="ic" transform="translate(${f(x + 3.7 * k)} ${f(y + 3.7 * k)}) scale(${f(0.73 * k * 100) / 100})">${GLYPHS[key]}</g>`;
}
