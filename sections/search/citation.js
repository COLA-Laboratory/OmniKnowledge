/** Citation tracing at work: from a seed paper, the papers it cites to the left and the papers that cite it to the right, over two generations. */
import { markup, svg } from '../../kit/index.js';
import { COLW, FAR, MID, NEAR, NOTE, SEED, curve, head, note, paper, snap } from './shared.js';

/** @typedef {import('./shared.js').Column} Column */
/** @typedef {import('./shared.js').Play} Play */

/**
 * Each side's papers as [x, y] from the seed; a second-generation paper also names the
 * first-generation paper it hangs on.
 */
const TREE = [
  {
    side: -1,
    word: 'References',
    near: [
      [-90, -54],
      [-84, 50],
    ],
    far: [
      [-174, -108, 0],
      [-176, -34, 0],
      [-171, 30, 1],
      [-175, 104, 1],
    ],
  },
  {
    side: 1,
    word: 'Cited by',
    near: [
      [86, -80],
      [94, 0],
      [82, 76],
    ],
    far: [
      [173, -112, 0],
      [176, -60, 0],
      [171, -18, 1],
      [175, 38, 1],
      [172, 104, 2],
    ],
  },
];

/**
 * Draws citation tracing into host, in the column B.
 *
 * @param {SVGElement} host
 * @param {Column} B
 * @returns {Play}
 */
export function cite(host, B) {
  const cx = snap(B.x + B.w / 2, SEED[0]);
  const cy = snap(B.compact ? 182 : MID, SEED[1]);
  const s = B.w / COLW;
  const gArc = markup(host);
  const gPap = markup(host);
  /** @typedef {{ line: SVGElement, head: SVGElement, paper: SVGElement, k: number }} Step */
  /** @type {{ near: Step[], far: Step[] }} */
  const d = { near: [], far: [] };
  /** @param {number[]} p @param {number[]} size */
  const place = (p, size) => ({ x: snap(cx + p[0] * s, size[0]), y: snap(cy + p[1] * (B.compact ? 0.7 : 1), size[1]) });
  /**
   * @param {{ x: number, y: number }} from @param {number[]} fromSize @param {number} off
   * @param {{ x: number, y: number }} to @param {number[]} toSize @param {number} side @param {string} cls
   */
  function arc(from, fromSize, off, to, toSize, side, cls) {
    // a paper that stands at the height the line leaves at is reached by a level line
    const x0 = from.x + side * (fromSize[0] / 2 + 4);
    const x1 = to.x - side * (toSize[0] / 2 + 5.5);
    const y0 = from.y + off;
    const y1 = Math.abs(to.y - y0) < 1.5 ? y0 : to.y;
    return {
      line: svg('path', { d: curve(x0, y0, x1, y1), class: `sr-arc${cls}`, pathLength: 1 }, gArc),
      head: svg('path', { d: head(x1, y1, side), class: `sr-head${cls}` }, gArc),
    };
  }
  const words = TREE.map((T) =>
    note(host, T.side < 0 ? B.x : B.x + B.w, B.compact ? 66 : NOTE, T.word, T.side < 0 ? 'start' : 'end'),
  );
  for (const T of TREE) {
    const seed = { x: cx, y: cy };
    const near = T.near.map((p) => place(p, NEAR));
    /** @type {{ x: number, y: number }[][]} */
    const kids = near.map(() => []);
    for (const p of T.far) kids[p[2]].push(place(p, FAR));
    near.forEach((p, i) => {
      const a = arc(seed, SEED, (i - (near.length - 1) / 2) * 9, p, NEAR, T.side, '');
      d.near.push({ ...a, paper: markup(gPap, paper(p.x, p.y, NEAR)), k: i });
      kids[i].forEach((q, j) => {
        const b = arc(p, NEAR, (j - (kids[i].length - 1) / 2) * 7, q, FAR, T.side, ' sr-out');
        d.far.push({ ...b, paper: markup(gPap, paper(q.x, q.y, FAR, { dim: true })), k: i + j });
      });
    });
  }
  const seedPaper = markup(gPap, paper(cx, cy, SEED, { seed: true }));
  return (rv, t) => {
    rv.arrive(seedPaper, t);
    for (const w of words) rv.fade(w, t + 250, 320);
    for (const [gen, start, each] of /** @type {[Step[], number, number][]} */ ([
      [d.near, t + 380, 90],
      [d.far, t + 1180, 70],
    ])) {
      for (const o of gen) {
        const at = start + o.k * each;
        rv.stroke(o.line, at, 460);
        rv.fade(o.head, at + 380, 160);
        rv.arrive(o.paper, at + 330, 360);
      }
    }
    return t + 2100;
  };
}
