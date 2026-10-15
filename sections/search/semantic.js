/** Semantic search at work: the seed in a field of papers, each line a similarity, the most similar taken. */
import { f, markup, prng, svg } from '../../kit/index.js';
import { FAR, MID, NEAR, NOTE, SEED, Y1, note, paper, snap } from './shared.js';

/** @typedef {import('./shared.js').Column} Column */
/** @typedef {import('./shared.js').Play} Play */

/** [x, y] from the seed and the similarity to it, falling with distance: the papers taken. */
const ALIKE = [
  [-34, -100, 0.93],
  [88, -70, 0.91],
  [-118, -20, 0.89],
  [64, 104, 0.87],
  [138, 12, 0.84],
  [-96, 104, 0.82],
];
/** Two papers just beyond. */
const BEYOND = [
  [-134, -114, 0.58],
  [153, 105, 0.52],
];
const REACH = 150; // every other paper of the field stands further from the seed than this
const PITCH = 4.5; // from dot to dot on the kit's dotted line
let rayN = 0;

/**
 * Returns how far from its middle a line along (ux, uy) leaves a box of half-size hw by hh.
 *
 * @param {number} ux
 * @param {number} uy
 * @param {number} hw
 * @param {number} hh
 */
const leave = (ux, uy, hw, hh) => Math.min(hw / Math.max(1e-6, Math.abs(ux)), hh / Math.max(1e-6, Math.abs(uy)));

/**
 * Returns the distance of (x, y) from the stretch between a and b.
 *
 * @param {number} x
 * @param {number} y
 * @param {{ x: number, y: number }} a
 * @param {{ x: number, y: number }} b
 */
function off(x, y, a, b) {
  const ex = b.x - a.x;
  const ey = b.y - a.y;
  const t = Math.max(0, Math.min(1, ((x - a.x) * ex + (y - a.y) * ey) / (ex * ex + ey * ey)));
  return Math.hypot(a.x + ex * t - x, a.y + ey * t - y);
}

/**
 * Draws a similarity: a straight dotted line from the seed to the paper p, and its number on the
 * line. The dots stop at the number and begin again after it.
 *
 * @param {Element} lines
 * @param {Element} labels
 * @param {{ x: number, y: number }} seed
 * @param {{ x: number, y: number, sim: number }} p
 * @param {number[]} half The half-size the line stops short of at p.
 * @param {number} at Where on the line the number stands, 0 to 1.
 * @param {boolean} low A paper that is not similar enough, drawn pale.
 * @returns {{ line: SVGElement, reach: SVGElement, label: SVGElement }} reach: the circle that
 *   uncovers the line from the seed outward.
 */
function alike(lines, labels, seed, p, half, at, low) {
  const r = Math.hypot(p.x - seed.x, p.y - seed.y);
  const ux = (p.x - seed.x) / r;
  const uy = (p.y - seed.y) / r;
  const id = `sr-ray${++rayN}`;
  let d = '';
  const t0 = leave(ux, uy, SEED[0] / 2 + 5, SEED[1] / 2 + 5);
  const t1 = r - leave(ux, uy, half[0], half[1]);
  const tm = t0 + (t1 - t0) * at;
  const label = svg(
    'text',
    { x: f(seed.x + ux * tm), y: f(seed.y + uy * tm + 4.6), 'text-anchor': 'middle', class: `cnt${low ? ' sr-low' : ''}` },
    labels,
    p.sim.toFixed(2),
  );
  const gap = leave(ux, uy, /** @type {SVGTextElement} */ (label).getComputedTextLength() / 2 + 5, 9.5);
  for (const run of [
    [t0, tm - gap],
    [tm + gap, t1],
  ]) {
    const n = Math.floor((run[1] - run[0]) / PITCH);
    const a = run[0] + (run[1] - run[0] - n * PITCH) / 2;
    const b = a + n * PITCH + 0.1;
    if (n >= 0) d += `M${f(seed.x + ux * a)},${f(seed.y + uy * a)} L${f(seed.x + ux * b)},${f(seed.y + uy * b)} `;
  }
  const reach = svg(
    'circle',
    { cx: seed.x, cy: seed.y, r: f(t1 + 2), style: `transform-origin:${seed.x}px ${seed.y}px` },
    svg('clipPath', { id }, lines),
  );
  return { line: svg('path', { d, class: `maybe${low ? ' sr-faint' : ''}`, 'clip-path': `url(#${id})` }, lines), reach, label };
}

/**
 * Returns where the unnamed papers of the field stand: loosely over the column under its word,
 * further from the seed than any paper with a number, and clear of the lines to the papers beyond.
 *
 * @param {Column} B
 * @param {{ x: number, y: number }} seed
 * @param {{ x: number, y: number }[]} named
 * @param {{ x: number, y: number }[]} beyond
 */
function fieldOf(B, seed, named, beyond) {
  const rnd = prng(57);
  /** @type {{ x: number, y: number }[]} */
  const out = [];
  const cols = Math.max(5, Math.round(B.w / 52));
  const rows = 5;
  const cw = B.w / cols;
  const top = (B.compact ? 66 : NOTE) + 16;
  const bottom = B.compact ? 278 : Y1;
  const ch = (bottom - top) / rows;
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      let x = B.x + (c + 0.5) * cw + (rnd() - 0.5) * cw * 0.56;
      let y = top + (r + 0.5) * ch + (rnd() - 0.5) * ch * 0.56;
      x = Math.max(B.x + FAR[0] / 2, Math.min(B.x + B.w - FAR[0] / 2, x));
      y = Math.max(top + FAR[1] / 2, Math.min(bottom - FAR[1] / 2, y));
      if (Math.hypot(x - seed.x, y - seed.y) < REACH) continue;
      if (named.some((p) => Math.abs(p.x - x) < 36 && Math.abs(p.y - y) < 42)) continue;
      if (beyond.some((p) => off(x, y, seed, p) < 26)) continue;
      if (out.some((p) => Math.hypot(p.x - x, p.y - y) < 42)) continue;
      out.push({ x, y });
    }
  return out;
}

/**
 * Draws semantic search into host, in the column B.
 *
 * @param {SVGElement} host
 * @param {Column} B
 * @returns {Play}
 */
export function sem(host, B) {
  const seed = { x: snap(B.x + B.w / 2, SEED[0]), y: snap(B.compact ? 182 : MID, SEED[1]) };
  const edge = B.w / 2 - FAR[0] / 2 - 1;
  /** @param {number[][]} list @param {number[]} size @param {number} lim */
  const place = (list, size, lim) =>
    list.map((p) => ({
      x: snap(seed.x + Math.max(-lim, Math.min(lim, p[0])), size[0]),
      y: snap(seed.y + p[1] * (B.compact ? 0.7 : 1), size[1]),
      sim: p[2],
    }));
  const taken = place(ALIKE, NEAR, 1e3);
  const beyond = place(BEYOND, FAR, edge); // a narrow column pulls the papers beyond in to its edge
  const word = note(host, B.x, B.compact ? 66 : NOTE, 'Similarity to the seed');
  const field = markup(
    host,
    fieldOf(B, seed, taken.concat(beyond), beyond)
      .concat(beyond)
      .map((p) => paper(p.x, p.y, FAR, { pale: true }))
      .join('') + taken.map((p) => paper(p.x, p.y, NEAR, { pale: true })).join(''),
  );
  const lines = markup(host);
  const labels = markup(host);
  const took = taken.map((p) => {
    const o = alike(lines, labels, seed, p, [NEAR[0] / 2 + 7.5, NEAR[1] / 2 + 7.5], 0.5, false);
    const halo = `<rect class="sr-halo" x="${f(p.x - NEAR[0] / 2 - 4.5)}" y="${f(p.y - NEAR[1] / 2 - 4.5)}" width="${NEAR[0] + 9}" height="${NEAR[1] + 9}" rx="3"/>`;
    return { ...o, paper: markup(host, halo + paper(p.x, p.y, NEAR)) };
  });
  const missed = beyond.map((p) => alike(lines, labels, seed, p, [FAR[0] / 2 + 5, FAR[1] / 2 + 5], 0.76, true));
  const seedPaper = markup(host, paper(seed.x, seed.y, SEED, { seed: true }));
  return (rv, t) => {
    const grow = [{ transform: 'scale(0)' }, { transform: 'scale(1)' }];
    const after = t + 600 + took.length * 230;
    rv.fade(field, t, 520);
    rv.arrive(seedPaper, t + 150);
    rv.fade(word, t + 250, 320);
    // nearest first: the line reaches out, its number arrives with it, then the paper is taken
    took.forEach((o, i) => {
      const at = t + 600 + i * 230;
      rv.from(o.reach, grow, at, 420);
      rv.fade(o.label, at + 240, 260);
      rv.fade(o.paper, at + 400, 300);
    });
    missed.forEach((o, i) => {
      rv.from(o.reach, grow, after + i * 200, 480);
      rv.fade(o.label, after + i * 200 + 320, 260);
    });
    return after + missed.length * 200 + 600;
  };
}
