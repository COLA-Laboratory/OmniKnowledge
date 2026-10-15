/** Database search at work: a query, the index of papers, the papers whose words match. */
import { f, markup, svg } from '../../kit/index.js';
import { COLW, NEAR, NOTE, SMALL, Y1, note, paper, snap } from './shared.js';

/** @typedef {import('./shared.js').Column} Column */
/** @typedef {import('./shared.js').Play} Play */

const QUERY = ['microplastic', 'AND', 'fish'];
/** The index: small papers on a grid, its top, the baseline of the word over it. */
const GRID = { cols: 5, rows: 7, dx: 28, dy: 33, top: 156, word: 141 };
/**
 * A match: its place in the index [column, row], and its two lines (a number: a word bar that
 * long, cut where the line ends, so 99 runs to the end; a string: a word of the query).
 *
 * @type {{ at: [number, number], lines: (string | number)[][] }[]}
 */
const MATCHES = [
  {
    at: [1, 1],
    lines: [
      ['microplastic', 34, 26, 99],
      [24, 'fish', 38, 20],
    ],
  },
  {
    at: [3, 2],
    lines: [
      [22, 'microplastic', 30, 16],
      ['fish', 44, 26, 99],
    ],
  },
  {
    at: [0, 4],
    lines: [
      [34, 20, 'fish', 30, 99],
      [22, 'microplastic', 18],
    ],
  },
  {
    at: [2, 5],
    lines: [
      ['microplastic', 20, 36],
      [40, 28, 'fish', 99],
    ],
  },
];

/**
 * Draws one line of a matching paper at baseline y from x: word bars, and the query's words on the marker.
 *
 * @param {Element} parent
 * @param {number} x
 * @param {number} y
 * @param {(string | number)[]} tokens
 * @param {number} room
 */
function matchLine(parent, x, y, tokens, room) {
  const x1 = x + room;
  let at = x;
  for (const tk of tokens) {
    if (at >= x1 - 8) return;
    if (typeof tk === 'number') {
      const w = Math.min(tk, x1 - at);
      svg('rect', { x: f(at), y: f(y - 6.8), width: f(w), height: 5, rx: 2.5, class: 'sr-bar' }, parent);
      at += w + 5;
      continue;
    }
    const t = /** @type {SVGTextElement} */ (svg('text', { x: f(at + 3), y, class: 'row' }, parent, tk));
    const tw = t.getComputedTextLength();
    svg('rect', { x: f(at), y: y - 12.5, width: f(tw + 6), height: 16, class: 'mark' }, parent);
    parent.appendChild(t);
    at += tw + 6 + 6;
  }
}

/**
 * Draws database search into host, in the column B.
 *
 * @param {SVGElement} host
 * @param {Column} B
 * @returns {Play}
 */
export function db(host, B) {
  const grid = B.compact ? { cols: 5, rows: 7, dx: 28, dy: 23, top: 112, word: 97 } : GRID;
  const baseline = B.compact ? 66 : NOTE;
  const bottom = B.compact ? 278 : Y1;
  const gx = B.x + SMALL[0] / 2;
  const gy = grid.top + SMALL[1] / 2;
  const gw = (grid.cols - 1) * grid.dx + SMALL[0];
  const mx = B.x + gw + Math.round((40 * B.w) / COLW);
  const room = B.x + B.w - (mx + NEAR[0] + 12);
  // the query: a lens, the words, a hairline under them
  const query = markup(
    host,
    `<circle class="sr-lens" cx="${B.x + 6.5}" cy="${baseline - 5.5}" r="5"/><path class="sr-lens" d="M${B.x + 10.2},${baseline - 1.8} l3.8,3.8"/>`,
  );
  const q = svg('text', { x: B.x + 23, y: baseline, class: 'lab' }, query);
  QUERY.forEach((w, i) => svg('tspan', i === 1 ? { class: 'sr-op', dx: 5 } : i ? { dx: 5 } : {}, q, w));
  const rule = svg(
    'line',
    { x1: B.x, x2: B.x + B.w, y1: baseline + 13.5, y2: baseline + 13.5, class: 'rule sr-rule', pathLength: 1 },
    host,
  );
  const words = [note(host, B.x, grid.word, 'Literature index'), note(host, mx, grid.word, 'Matches')];
  let s = '';
  for (let r = 0; r < grid.rows; r++)
    for (let c = 0; c < grid.cols; c++) s += paper(gx + c * grid.dx, gy + r * grid.dy, SMALL, { pale: true });
  const index = markup(host, s);
  const step = (bottom - grid.top - NEAR[1]) / (MATCHES.length - 1); // the matches stand from the index's top to its foot
  const rows = MATCHES.map((m, i) => {
    const ix = snap(gx + m.at[0] * grid.dx, SMALL[0]);
    const iy = snap(gy + m.at[1] * grid.dy, SMALL[1]);
    const px = snap(mx + NEAR[0] / 2, NEAR[0]);
    const py = snap(grid.top + NEAR[1] / 2 + i * step, NEAR[1]);
    const lit = markup(
      host,
      `<rect class="sr-halo" x="${f(ix - SMALL[0] / 2 - 3.5)}" y="${f(iy - SMALL[1] / 2 - 3.5)}" width="${SMALL[0] + 7}" height="${SMALL[1] + 7}" rx="2.5"/>${paper(ix, iy, SMALL)}`,
    );
    const found = markup(host, paper(px, py, NEAR));
    const text = markup(host);
    m.lines.forEach((line, k) => matchLine(text, mx + NEAR[0] + 12, py + (k ? 13.5 : -4.5), line, room));
    return { dx: ix - px, dy: iy - py, lit, paper: found, text };
  });
  return (rv, t) => {
    rv.fade(query, t, 360);
    rv.stroke(rule, t + 100, 520);
    for (const w of words) rv.fade(w, t + 300, 320);
    rv.fade(index, t + 300, 520);
    rows.forEach((o, i) => {
      const at = t + 900 + i * 360;
      const from = `translate(${o.dx}px,${o.dy}px)`;
      rv.fade(o.lit, at, 280);
      rv.from(
        o.paper,
        [
          { opacity: 0, transform: from },
          { opacity: 1, transform: from, offset: 0.15 },
          { opacity: 1, transform: 'translate(0,0)' },
        ],
        at + 200,
        720,
      );
      rv.fade(o.text, at + 760, 320);
    });
    return t + 900 + rows.length * 360 + 900;
  };
}
