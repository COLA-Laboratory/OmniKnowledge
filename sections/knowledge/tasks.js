/**
 * The Knowledge picture's four task drawings, each an output written from the map: a review, two
 * hypotheses, a plan and a reading of one's own result.
 *
 * Each draws into g with its top left corner at (ox, oy) and lists in `cites` the citation
 * marks its output carries, in reading order. Bars are text and only text; a cited paper is a
 * numbered mark after the words it supports. Classes say what a thing is before and after the
 * reading: ka-b a word; ka-k a word that ends in ink; ka-s a word in ink from the start; ka-t and
 * ka-late what only the finished output has; ka-ph what stands in for a real word before; ka-c0
 * a cited paper as a plain dot before, ka-c1 as a numbered mark after.
 */
import { f, setMarkup, svg, words } from '../../kit/index.js';

/** The width of a task's drawing. */
export const DW = 244;
/** The radius of a citation mark. */
export const CR = 8.5;
/** The height of a word of an output, a little over the kit's 5 so that a mark sits well beside it. */
const BH = 6;

/**
 * @typedef {object} Cite A citation mark in an output.
 * @property {number} x
 * @property {number} y
 * @property {number} r
 * @property {SVGElement} full The numbered mark.
 * @property {Element[]} stmt The words it supports.
 * @property {any} [p] The paper on the map it cites, given by the picture.
 * @property {SVGElement} [twin] Its mark on the map, while the task is chosen.
 * @typedef {(g: SVGElement, ox: number, oy: number, cites: Cite[]) => void} TaskDrawing
 */

/**
 * Draws one line of text as words and returns them.
 *
 * @param {SVGElement} g
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} seed
 * @param {number[] | null} keys Which words end in ink, counted from the end when negative (a
 *   line of one or two words keeps only its last).
 * @param {'s' | 'ph' | ''} [kind] 's': those are in ink from the start; 'ph': the whole line only
 *   stands in for a real word.
 * @returns {Element[]}
 */
function line(g, x, y, w, seed, keys, kind = '') {
  const tmp = svg('g');
  setMarkup(tmp, words(x, y, w, seed, 0, BH));
  const bars = [...tmp.children];
  const ink = (keys ?? []).map((k) => (k >= 0 ? k : bars.length > 2 || k === -1 ? bars.length + k : -1));
  bars.forEach((r, k) => {
    r.removeAttribute('fill');
    r.setAttribute('class', `ka-b${kind === 'ph' ? ' ka-ph' : ink.includes(k) ? (kind === 's' ? ' ka-s' : ' ka-k') : ''}`);
    g.appendChild(r);
  });
  return bars;
}

/**
 * Draws a real word and what stands in for it before the reading (a heading's bar, or words).
 *
 * @param {SVGElement} g
 * @param {number} x
 * @param {number} y
 * @param {string} text
 * @param {boolean} [head]
 * @returns {number} The word's width.
 */
function word(g, x, y, text, head) {
  const t = /** @type {SVGTextElement} */ (svg('text', { x: f(x - 0.4), y: f(y + 4.5), class: 'row ka-t' }, g, text));
  const w = t.getComputedTextLength();
  if (head) svg('rect', { x: f(x), y: f(y - 3.5), width: f(w * 0.72), height: 7, rx: 3.5, class: 'ka-b ka-ph' }, g);
  else line(g, x, y, w, text.length * 17, null, 'ph');
  return w;
}

/**
 * Returns the markup of a citation mark standing at the origin: the paper's dot with the
 * citation's number in it.
 *
 * @param {number} n
 */
export const markAt0 = (n) => `<circle r="${CR}" class="dot"/><text y="4.2" text-anchor="middle" class="ka-num">${n}</text>`;

/**
 * Draws a citation mark at (x, y): a plain dot before the reading, the numbered mark once the
 * output is written.
 *
 * @param {SVGElement} g
 * @param {Cite[]} cites
 * @param {number} x
 * @param {number} y
 * @param {Element[]} [stmt] The words it supports.
 */
function cite(g, cites, x, y, stmt) {
  const m = svg('g', { class: 'ka-cite' }, g);
  svg('circle', { cx: f(x), cy: f(y), r: 4, class: 'dot ka-c0' }, m);
  const full = svg('g', { class: 'ka-c1', transform: `translate(${f(x)} ${f(y)})` }, m);
  setMarkup(full, markAt0(cites.length + 1));
  cites.push({ x, y, r: CR, full, stmt: stmt ?? [] });
}

/**
 * A review written under three headings; a mark stands right after each phrase that rests on a
 * paper, and the line may go on after it.
 *
 * @type {TaskDrawing}
 */
function review(g, ox, oy, cites) {
  // per line: the length of its text, and when it ends in a cited phrase, the length up to which the line goes on after the mark (0: it ends there)
  /** @type {[string, number[][]][]} */
  const cols = [
    ['Particle size', [[46, 0], [70], [32, 70], [48]]],
    ['Dose', [[70], [46, 0], [64], [38, 0]]],
    ['Duration', [[66], [30, 70], [70], [46, 0]]],
  ];
  cols.forEach(([head, rows], c) => {
    const x = ox + c * 87;
    word(g, x, oy + 21, head, true);
    rows.forEach((L, i) => {
      const y = oy + 43 + i * 18;
      const has = L.length > 1;
      const bars = line(g, x, y, L[0], 300 + c * 31 + i * 7, has ? [-2, -1] : [], !c && !i ? 's' : '');
      if (!has) return;
      const last = bars[bars.length - 1];
      const mx = Number(last.getAttribute('x')) + Number(last.getAttribute('width')) + 4.5 + CR;
      cite(g, cites, mx, y, bars);
      if (L[1]) line(g, mx + CR + 5.5, y, x + L[1] - (mx + CR + 5.5), 340 + c * 13 + i, []);
    });
  });
}

/** @type {TaskDrawing} Two claims nobody has tested yet, each drawn between the two papers it stands between. */
function hypothesis(g, ox, oy, cites) {
  for (const k of [0, 1]) {
    const xa = ox + CR + k * 136;
    const xb = xa + 88;
    const xm = xa + 44;
    const my = oy + 12;
    const ym = oy + 61;
    cite(g, cites, xa, my);
    cite(g, cites, xb, my);
    svg(
      'path',
      { d: [xa, xb].map((x) => `M${x},${my + 12} C${x},${my + 32} ${xm},${ym - 20} ${xm},${ym}`).join(' '), class: 'maybe' },
      g,
    );
    line(g, xa - CR, oy + 78, 82, 500 + k * 9, [0, 1]);
    line(g, xa - CR, oy + 93, 46, 523 + k * 9, []);
    svg('text', { x: xb + CR, y: oy + 99.6, 'text-anchor': 'end', class: 'qm' }, g, '?');
  }
}

/** @type {TaskDrawing} The steps of a plan; a ticked step rests on a paper, whose mark ends its row. */
function planning(g, ox, oy, cites) {
  /** @type {[string | null, number][]} */
  const steps = [
    ['Control group', 150],
    ['Dose', 122],
    ['Duration', 178],
    ['Endpoints', 144],
    [null, 106],
  ];
  steps.forEach(([name, end], i) => {
    const y = oy + 9 + i * 22;
    let x = ox + 22;
    svg(
      'rect',
      { x: ox + 0.6, y: y - 5.5, width: 11, height: 11, rx: 2.6, class: `box${i ? (name ? ' ka-bx' : '') : ' on'}` },
      g,
    );
    if (name) svg('path', { d: `M${ox + 3.2},${f(y + 0.3)} l2.3,2.3 l3.6,-4.8`, class: `tick${i ? ' ka-late' : ''}` }, g);
    if (name) x += word(g, x, y, name) + 7;
    const bars = line(g, x, y, ox + end - x, 610 + i * 5, []);
    if (name) cite(g, cites, ox + end + 6 + CR, y, bars);
  });
}

/** @type {TaskDrawing} A result of one's own (the ring), read against the results of papers: each point is a cited paper. */
function reading(g, ox, oy, cites) {
  const x0 = ox + 0.6;
  const yb = oy + 96;
  const ux = x0 + 28;
  const uy = yb - 64;
  svg('path', { d: `M${x0},${oy + 17} V${yb} H${ox + DW}`, class: 'axis' }, g);
  svg('text', { x: ox - 0.4, y: oy + 7, class: 'note ka-t' }, g, 'Growth');
  svg('text', { x: ox + DW, y: yb + 16.5, 'text-anchor': 'end', class: 'note ka-t' }, g, 'Food intake');
  for (const [dx, dy] of [
    [34, 20],
    [80, 35],
    [124, 27],
    [170, 53],
    [216, 66],
  ])
    cite(g, cites, x0 + dx, yb - dy);
  svg('circle', { cx: ux, cy: uy, r: 5.5, class: 'ka-own' }, g);
  line(g, ux + 13, uy, 46, 77, null, 'ph');
  svg('text', { x: ux + 12.5, y: uy + 4.5, class: 'row ka-t' }, g, 'Your result');
}

/**
 * The four tasks. ask: the request in the user's words; hold: how many papers hold something
 * relevant; from: how many papers of each topic the output cites (as many in all as the drawing
 * has marks).
 */
export const TASKS = [
  { ask: 'Review the particle sizes and doses tested so far.', hold: 64, from: [2, 1, 2, 1], draw: review },
  { ask: 'What has nobody tested yet?', hold: 41, from: [1, 1, 1, 1], draw: hypothesis },
  { ask: 'Plan an exposure experiment on juvenile carp.', hold: 38, from: [1, 1, 1, 1], draw: planning },
  { ask: 'My fish ate less but grew normally. Is that expected?', hold: 27, from: [2, 1, 1, 1], draw: reading },
];
