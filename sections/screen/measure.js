/** Measuring the Screen picture's text before it is drawn, in the faces the picture sets it in. */
import { token } from '../../kit/index.js';

/**
 * Returns a CSS font in the pictures' typeface.
 *
 * @param {string} weightAndSize e.g. "500 13.5px".
 */
export const face = (weightAndSize) => `${weightAndSize} ${token('font-pic')}`;

/** A filter's setting (class sc-set). */
export const SET = () => face('500 13.5px');
/** The kit's "lab". */
export const LAB = () => face('600 14px');
/** A word printed in an icon (class sc-word). */
export const WORD = () => face('600 12.5px');

/**
 * How far a face's first letter stands in from where it is set, so that text in different faces
 * shares one left edge.
 *
 * @type {Record<string, number>}
 */
export const NUDGE = { task: 0.8, lab: 0.6, 'sc-set': 0.4, 'sc-n': 1.3, 'sc-word': 0.5 };

/** @type {CanvasRenderingContext2D | null} */
let ruler = null;

/**
 * Returns the width of a string set in a font.
 *
 * @param {string} s
 * @param {() => string} font One of the faces above, or a function returning a CSS font.
 */
export function widthOf(s, font) {
  ruler ??= /** @type {CanvasRenderingContext2D} */ (document.createElement('canvas').getContext('2d'));
  ruler.font = font();
  return ruler.measureText(s).width;
}

/**
 * Splits a setting over at most two lines no longer than max, as evenly as its words allow.
 *
 * @param {string} s
 * @param {number} max
 * @returns {string[]}
 */
export function wrap(s, max) {
  if (widthOf(s, SET) <= max) return [s];
  const w = s.split(' ');
  let best = { m: Infinity, lines: [s] };
  for (let i = 1; i < w.length; i++) {
    const a = w.slice(0, i).join(' ');
    const b = w.slice(i).join(' ');
    const m = Math.max(widthOf(a, SET), widthOf(b, SET));
    if (m < best.m) best = { m, lines: [a, b] };
  }
  return best.lines;
}
