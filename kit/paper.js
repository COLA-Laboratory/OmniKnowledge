/**
 * The two small marks of text: the paper icon, and a line of words that cannot be quoted.
 *
 * Both return SVG markup. A paper is drawn wherever a paper is large enough to be one (about
 * 14 px wide and up); smaller papers, and papers in number, are the network's dots.
 */
import { f } from './format.js';
import { prng } from './random.js';
import { token } from './tokens.js';

/**
 * @typedef {object} PaperState Default: a found paper, white with an ink outline.
 * @property {boolean} [seed] A seed paper, black.
 * @property {boolean} [kept] A kept paper, yellow.
 * @property {boolean} [dim] A paper one hop further out.
 * @property {boolean} [pale] A paper that was not taken, or was removed.
 */

/**
 * Returns a paper: a sheet with a folded corner and lines for its text.
 *
 * @param {number} cx Its centre.
 * @param {number} cy
 * @param {number} w Its width.
 * @param {number} h Its height, about 1.3 times the width.
 * @param {PaperState | null} [o]
 * @returns {string} SVG markup.
 */
export function paper(cx, cy, w, h, o) {
  const s = o ?? {};
  const ink = token('ink');
  const white = token('paper');
  const x = cx - w / 2;
  const y = cy - h / 2;
  const e = Math.max(4, Math.min(w * 0.3, 11));
  const r = 1.6;
  const stroke = s.seed ? ink : s.pale ? token('out') : s.dim ? token('q') : ink;
  const sw = s.seed ? 1.5 : s.pale ? 1 : 1.15;
  let m = `<path d="M${f(x + r)},${f(y)} H${f(x + w - e)} L${f(x + w)},${f(y + e)} V${f(y + h - r)} Q${f(x + w)},${f(y + h)} ${f(x + w - r)},${f(y + h)} H${f(x + r)} Q${f(x)},${f(y + h)} ${f(x)},${f(y + h - r)} V${f(y + r)} Q${f(x)},${f(y)} ${f(x + r)},${f(y)} Z" fill="${s.seed ? ink : s.kept ? token('y') : white}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>`;
  m += `<path d="M${f(x + w - e)},${f(y)} V${f(y + e)} H${f(x + w)}" fill="none" stroke="${s.seed ? white : stroke}" stroke-width="${s.seed ? 1 : sw * 0.85}" stroke-linejoin="round"${s.seed ? ' opacity=".5"' : ''}/>`;
  const tiny = h < 20;
  const pad = w * (tiny ? 0.22 : 0.17);
  const lh = tiny ? 1.1 : Math.max(1.4, h * 0.042);
  const gap = h * (tiny ? 0.21 : 0.125);
  const n = tiny ? 3 : Math.floor((h * 0.7) / gap);
  const line = s.seed
    ? white
    : token(s.kept ? 'paper-line-kept' : s.pale ? 'paper-line-pale' : s.dim ? 'paper-line-dim' : 'paper-line');
  const head = s.seed ? white : s.kept ? ink : token(s.pale ? 'paper-head-pale' : s.dim ? 'paper-head-dim' : 'paper-head');
  let yy = y + h * (tiny ? 0.36 : 0.21);
  for (let i = 0; i < n; i++) {
    const lw = (w - 2 * pad) * (tiny ? (i === n - 1 ? 0.6 : 1) : i === 0 ? 0.6 : i === n - 1 ? 0.55 : 1);
    const hh = i === 0 && !tiny ? lh * 1.7 : lh;
    m += `<rect x="${f(x + pad)}" y="${f(yy - hh / 2)}" width="${f(lw)}" height="${f(hh)}" rx="${f(hh / 2)}" fill="${i === 0 || tiny ? head : line}"${s.seed && i > 0 ? ' opacity=".62"' : ''}/>`;
    yy += gap;
  }
  return m;
}

/**
 * Returns a line of text that cannot be quoted, as word-sized bars.
 *
 * @param {number} x The line's left end.
 * @param {number} y Its middle height.
 * @param {number} w Its length.
 * @param {number} seed Any integer; the same seed gives the same words.
 * @param {number} [ink] How many of the first words are set in ink.
 * @param {number} [h] The bars' height.
 * @returns {string} SVG markup.
 */
export function words(x, y, w, seed, ink = 0, h = 5) {
  const R = prng(seed);
  const x1 = x + w;
  let at = x;
  let m = '';
  for (let k = 0; at < x1 - 6; k++) {
    let ww = Math.min(10 + R() * 16, x1 - at);
    if (x1 - (at + ww) < 9) ww = x1 - at;
    m += `<rect x="${f(at)}" y="${f(y - h / 2)}" width="${f(ww)}" height="${h}" rx="${f(h / 2)}" fill="${k < ink ? token('ink') : token('bar')}"/>`;
    at += ww + h * 0.85;
  }
  return m;
}
