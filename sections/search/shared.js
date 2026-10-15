/**
 * What the three search drawings share: their measures, paper sizes and small marks. Each
 * drawing (citation.js, semantic.js, database.js) draws itself into a column of the Search
 * picture and returns the reveal that plays it.
 */
import { f, markup, paper as kitPaper, svg, tile } from '../../kit/index.js';

/** The width the three drawings are composed for. */
export const COLW = 368;
/** A drawing's foot. */
export const Y1 = 372;
/** The one corner radius of a ground. */
export const R = 16;
export const TOP = 36; // a column's title: its top
export const TILE = 26; // the size of its tile
export const NOTE = 96; // the baseline of the quiet words above a drawing
export const MID = 242; // the height a drawing's seed stands at
/** Paper sizes, [width, height]. */
export const SEED = [30, 39];
export const NEAR = [22, 29];
export const FAR = [16, 21];
export const SMALL = [14, 18];

/**
 * @typedef {{ x: number, w: number, compact?: boolean }} Column Where a drawing stands; compact:
 *   the narrow frame's shorter drawing.
 * @typedef {import('../../kit/motion.js').Reveal} Reveal
 * @typedef {(rv: Reveal, t: number) => number} Play Lays the reveal over the drawing from time t
 *   and returns when it ends.
 */

/**
 * Returns the centre nearest to c at which a paper of this size has its edges on half pixels.
 *
 * @param {number} c
 * @param {number} size
 */
export const snap = (c, size) => Math.round(c - size / 2) + 0.5 + size / 2;

/**
 * Returns a kit paper of size [w, h] at a snapped centre.
 *
 * @param {number} cx
 * @param {number} cy
 * @param {number[]} size
 * @param {import('../../kit/paper.js').PaperState} [o]
 */
export const paper = (cx, cy, size, o) => kitPaper(snap(cx, size[0]), snap(cy, size[1]), size[0], size[1], o);

/**
 * Draws a line of quiet words.
 *
 * @param {Element} parent
 * @param {number} x
 * @param {number} y
 * @param {string} text
 * @param {'start' | 'end'} [anchor]
 */
export const note = (parent, x, y, text, anchor = 'start') =>
  svg('text', { x: f(x), y, class: 'note', 'text-anchor': anchor }, parent, text);

/**
 * Returns one curve from (x0, y0) to (x1, y1), level where it leaves and where it arrives.
 *
 * @param {number} x0
 * @param {number} y0
 * @param {number} x1
 * @param {number} y1
 */
export function curve(x0, y0, x1, y1) {
  const half = (x1 - x0) / 2;
  return `M${f(x0)},${f(y0)} C${f(x0 + half)},${f(y0)} ${f(x1 - half)},${f(y1)} ${f(x1)},${f(y1)}`;
}

/**
 * Returns a small open arrowhead at (x, y) pointing along side (1 right, -1 left).
 *
 * @param {number} x
 * @param {number} y
 * @param {number} side
 */
export const head = (x, y, side) => `M${f(x - side * 3.4)},${f(y - 3.4)} L${f(x)},${f(y)} L${f(x - side * 3.4)},${f(y + 3.4)}`;

/**
 * Draws a column's title: the search's tile and name.
 *
 * @param {Element} parent
 * @param {number} x
 * @param {{ key: import('../../kit/example.js').SearchKey, name: string }} search
 */
export function title(parent, x, search) {
  const g = markup(parent, tile(x, TOP, TILE, search.key));
  svg('text', { class: 'task', x: x + TILE + 12, y: TOP + 20 }, g, search.name);
  return g;
}
