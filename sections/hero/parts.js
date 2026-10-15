/**
 * What both compositions of the first picture are made of: the four task drawings, the cards,
 * the ringed paper a task rests on, and the measures they share.
 */
import { EXAMPLE, f, markup, setMarkup, svg, token, words } from '../../kit/index.js';

/** The room between a ground's edge and its outermost paper. */
export const PAD = 8;
/** A task drawing has three rows, this far apart. */
export const ROW = 15;
/** The width of a task drawing. */
export const DW = 88;
/** A card's edge to what stands in it. */
export const INSET = 13;
/** The filters' names, in order. */
export const FILTERS = EXAMPLE.filters.map((F) => F.name);

/**
 * @typedef {object} TaskSpot Where a task drawing stands.
 * @property {number} x Its left edge.
 * @property {number} cy Its middle row.
 * @typedef {(g: SVGElement, T: TaskSpot) => void} TaskDrawing
 */

/** @type {TaskDrawing} Written text; the phrase that rests on a paper is in ink. */
export function review(g, T) {
  const w = [DW, 74, 50];
  let s = '';
  for (let i = 0; i < 3; i++) s += words(T.x, T.cy + (i - 1) * ROW, w[i], 11 + i * 7, i ? 0 : 2);
  setMarkup(g, s);
}

/** @type {TaskDrawing} A claim nobody has tested yet, drawn between two papers. */
export function hypothesis(g, T) {
  const X = T.x;
  const ya = T.cy - ROW;
  const yb = T.cy + ROW;
  const xa = X + 1;
  const xm = X + 24;
  svg(
    'path',
    {
      d: `M${xa},${f(ya)} C${xa + 13},${f(ya)} ${xm - 12},${f(T.cy)} ${xm},${f(T.cy)} M${xa},${f(yb)} C${xa + 13},${f(yb)} ${xm - 12},${f(T.cy)} ${xm},${f(T.cy)}`,
      class: 'maybe',
    },
    g,
  );
  markup(g, words(xm + 9, T.cy, 36, 5, 0));
  svg('text', { x: X + DW + 0.5, y: f(T.cy + 6.6), 'text-anchor': 'end', class: 'qm' }, g, '?');
}

/** @type {TaskDrawing} Steps to be done; the one that rests on a paper is ticked. */
export function plan(g, T) {
  const X = T.x;
  const w = [DW - 18, 44, 58];
  let s = '';
  for (let i = 0; i < 3; i++) {
    const y = T.cy + (i - 1) * ROW;
    s += `<rect class="box${i ? '' : ' on'}" x="${X + 0.6}" y="${f(y - 4.5)}" width="9" height="9" rx="2.2"/>`;
    if (!i) s += `<path class="tick" d="M${X + 2.7},${f(y + 0.2)} l1.9,1.9 l3,-3.9"/>`;
    s += words(X + 18, y, w[i], 40 + i * 5, 0);
  }
  setMarkup(g, s);
}

/** @type {TaskDrawing} A result of one's own, read against a paper: a plot as tall as the rows beside it. */
export function reading(g, T) {
  const X = T.x;
  const fx = X + 38;
  const y0 = T.cy - ROW - 1.9;
  const y1 = T.cy + ROW + 1.9;
  const w = [26, 18, 22];
  let s = '';
  for (let i = 0; i < 3; i++) s += words(X, T.cy + (i - 1) * ROW, w[i], 71 + i * 6, 0);
  s += `<path class="axis" d="M${fx},${f(y0)} V${f(y1)} H${X + DW - 0.6}"/>`;
  for (const [dx, dy] of [
    [10, 7],
    [19, 13],
    [28, 11],
    [36, 22],
    [44, 27],
  ])
    s += `<circle class="pt" cx="${fx + dx}" cy="${f(y1 - dy)}" r="2.4"/>`;
  setMarkup(g, s);
}

/**
 * Draws a card whose outer edge is the box given, the hairline inside it.
 *
 * @param {{ x: number, y: number, w: number, h: number }} c
 * @param {SVGElement} parent
 */
export function card(c, parent) {
  return svg('rect', { x: c.x + 0.5, y: c.y + 0.5, width: c.w - 1, height: c.h - 1, rx: 12.5, class: 'card' }, parent);
}

/**
 * Returns a cited paper of the map: ringed in ink on a white halo that clears the citations
 * round it.
 *
 * @param {{ x: number, y: number, r: number }} m
 * @returns {{ r: number, halo: string, ring: string }} How far its ring reaches, and the markup of the halo and the ring.
 */
export function cited(m) {
  const r = Math.max(m.r + 1.7, 5.4);
  const at = `cx="${f(m.x)}" cy="${f(m.y)}"`;
  return {
    r,
    halo: `<circle ${at} r="${f(r + 2.2)}" fill="${token('paper')}"/>`,
    ring: `<circle ${at} r="${f(r)}" fill="${token('y')}" stroke="${token('ink')}" stroke-width="1.8"/>`,
  };
}

/**
 * Draws the citation network's papers: a seed as ring and core, every other paper as a dot.
 *
 * @param {{ x: number, y: number, r: number, seed?: string }[]} papers
 * @param {SVGElement} parent
 */
export function dots(papers, parent) {
  for (const m of papers) {
    if (m.seed) {
      svg('circle', { cx: f(m.x), cy: f(m.y), r: f(m.r + 3), class: 'ring' }, parent);
      svg('circle', { cx: f(m.x), cy: f(m.y), r: f(m.r), class: 'core' }, parent);
    } else svg('circle', { cx: f(m.x), cy: f(m.y), r: f(m.r), class: 'dot' }, parent);
  }
}

/**
 * Removes everything from the picture but its description.
 *
 * @param {SVGSVGElement} pic
 */
export function clear(pic) {
  for (const c of [...pic.children]) if (c.tagName !== 'desc') c.remove();
}

/**
 * @typedef {object} Parts The parts of a drawn composition, in the order its reveal shows them.
 * @property {SVGElement[]} grounds
 * @property {SVGElement[]} labels
 * @property {SVGElement[]} sRows
 * @property {SVGElement[]} fRows
 * @property {SVGElement} gEdge
 * @property {SVGElement} gMap
 * @property {SVGElement} lineA
 * @property {SVGElement} lineB
 * @property {SVGElement} lineC
 * @property {SVGElement} head
 * @property {SVGElement} inDot
 * @property {SVGElement} gAsk
 * @property {SVGElement[]} seeds
 * @property {SVGElement} seedNote
 * @property {SVGElement} sLab
 * @property {SVGElement} sCard
 * @property {SVGElement} fLab
 * @property {SVGElement} fCard
 * @property {Record<'found' | 'foundN' | 'kept' | 'keptN', SVGElement>} beads
 */
