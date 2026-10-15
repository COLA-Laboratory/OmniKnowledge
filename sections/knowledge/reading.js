/**
 * The reading the Knowledge picture plays when a task is chosen: a front crosses the map and
 * every paper is read as it passes; the cited papers become numbered marks, a copy of each
 * travels down into the task's output, and the output is written.
 */
import { f, setMarkup, svg, token } from '../../kit/index.js';
import { markAt0 } from './tasks.js';

const FLY = 'cubic-bezier(.5,0,.3,1)'; // how a citation mark travels from its paper into the text
const T_SWEEP = 2400; // the time the front takes to cross the map, ms

/** @typedef {{ x: number, y: number }} Point */

/**
 * Returns the way a mark takes from a down to b: one curve, upright where it leaves and where it arrives.
 *
 * @param {Point} a
 * @param {Point} b
 * @returns {(u: number) => Point}
 */
function curve(a, b) {
  const h = (b.y - a.y) / 2;
  return (u) => {
    const v = 1 - u;
    const bx = 3 * v * u * u + u * u * u;
    const by = 3 * v * v * u * h + 3 * v * u * u * h + u * u * u * 2 * h;
    return { x: a.x + (b.x - a.x) * bx, y: a.y + by };
  };
}
/**
 * Returns n + 1 points at equal steps along a curve, and its length.
 *
 * @param {(u: number) => Point} c
 * @param {number} n
 */
function along(c, n) {
  /** @type {Point[]} */
  const P = [];
  const L = [0];
  /** @type {Point[]} */
  const out = [];
  let j = 0;
  for (let i = 0; i <= 60; i++) {
    P.push(c(i / 60));
    if (i) L.push(L[i - 1] + Math.hypot(P[i].x - P[i - 1].x, P[i].y - P[i - 1].y));
  }
  for (let i = 0; i <= n; i++) {
    const d = (L[60] * i) / n;
    while (j < 59 && L[j + 1] < d) j++;
    const u = (d - L[j]) / (L[j + 1] - L[j] || 1);
    out.push({ x: P[j].x + (P[j + 1].x - P[j].x) * u, y: P[j].y + (P[j + 1].y - P[j].y) * u });
  }
  return { pts: out, len: L[60] };
}

/**
 * Lays the reading for one task card over the finished picture.
 *
 * @param {import('../../kit/motion.js').Reveal} rv Takes every animation, so that cancelling it ends the reading.
 * @param {SVGElement} front The line that crosses the map.
 * @param {{ x: number, w: number }} M The map's box.
 * @param {import('./picture.js').Paper[]} papers
 * @param {import('./picture.js').Card} C The chosen task's card.
 * @param {SVGElement} gFly The layer the travelling marks are drawn in.
 * @returns {number} How long the reading lasts, in ms.
 */
export function reading(rv, front, M, papers, C, gFly) {
  const ink = token('ink');
  const bar = token('bar');
  const pale = token('quiet-2');
  const X0 = M.x - 6;
  const span = M.w + 12;
  rv.add(
    front.animate(
      [
        { opacity: 1, transform: 'translateX(0px)' },
        { opacity: 1, transform: `translateX(${span}px)` },
      ],
      { duration: T_SWEEP, easing: 'linear' },
    ),
  );
  for (const p of papers) {
    p.at = ((p.x - X0) / span) * T_SWEEP;
    rv.add((p.ring ?? p.el).animate([{ fill: ink }, { fill: ink }], { delay: p.at, duration: 300 }));
    if (!p.mark) continue;
    rv.fade(p.mark.halo, p.at + 150, 220);
    rv.fade(p.mark.g, p.at + 150, 220);
  }
  // a cited paper becomes its mark once it is read; a copy of the mark then leaves it and
  // travels to its place in the text
  let last = T_SWEEP + 300;
  C.cites.forEach((m, i) => {
    const { pts, len } = along(curve(m.p, m), 24);
    const t = m.p.at + 420;
    const dur = 640 + len * 0.55;
    const e = svg('g', { class: 'ka-fly' }, gFly);
    setMarkup(e, markAt0(i + 1));
    rv.add(
      e.animate(
        pts.map((q) => ({ opacity: 1, transform: `translate(${f(q.x)}px,${f(q.y)}px)` })),
        { delay: t, duration: dur, easing: FLY },
      ),
    );
    rv.fade(m.full, t + dur - 30, 90);
    for (const b of m.stmt) /** @type {Element & { land?: number }} */ (b).land = t + dur - 80;
    last = Math.max(last, t + dur);
  });
  // the text is written as the front crosses the map; the words a mark supports, as it arrives
  const tK = last + 260;
  let over = tK;
  C.words.forEach((W, i) => {
    const t = W.el.land || 250 + (i / Math.max(1, C.words.length - 1)) * (T_SWEEP + 300);
    if (!W.key) {
      rv.from(W.el, [{ fill: pale }, { fill: bar }], t, 160);
      return;
    }
    const end = tK + 320 + (i % 5) * 30;
    const a = t / end;
    over = Math.max(over, end);
    rv.from(
      W.el,
      [
        { fill: pale, offset: 0 },
        { fill: pale, offset: a },
        { fill: bar, offset: Math.min(a + 0.03, 0.9) },
        { fill: bar, offset: (end - 320) / end },
        { fill: ink, offset: 1 },
      ],
      0,
      end,
      'linear',
    );
  });
  C.late.forEach((e, i) => {
    const ph = /ka-ph/.test(e.getAttribute('class') ?? '');
    if (ph)
      rv.add(
        e.animate([{ opacity: 1 }, { opacity: 1, offset: 0.9 }, { opacity: 0 }], { duration: tK + i * 20, fill: 'backwards' }),
      );
    else rv.fade(e, tK + i * 20, 320);
    over = Math.max(over, tK + i * 20 + (ph ? 0 : 320));
  });
  return over;
}
