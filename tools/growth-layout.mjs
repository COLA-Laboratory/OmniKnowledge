/**
 * Lays out a citation network grown from seed papers, for kit/network-growth.js to draw.
 *
 * Each cluster starts from one seed paper; every later paper is found from one paper already in
 * its cluster (a tree citation), lands near it and clear of the others, and remembers its
 * generation. Some papers then cite a near neighbour, and a few citations bridge the first two
 * clusters. Deterministic for a given seed; tools/layouts.mjs writes the result as data.
 */
import { prng } from '../kit/random.js';

/**
 * @typedef {object} Cluster
 * @property {number} x The middle of the area its papers may take.
 * @property {number} y
 * @property {number} r The radius of that area.
 * @property {number} n How many papers grow from its seed.
 * @property {number} sx Where its seed paper stands.
 * @property {number} sy
 */

/** @param {number} n */
const one = (n) => Number(n.toFixed(1));

/**
 * Grows and lays out the network.
 *
 * @param {{ seed: number, clusters: Cluster[] }} options
 * @returns {import('../kit/network-growth.js').GrowthLayout}
 */
export function growthLayout({ seed, clusters }) {
  const R = prng(seed);
  /** @typedef {{ i: number, x: number, y: number, c: number, seed: boolean, deg: number, depth: number }} Paper */
  /** @type {Paper[]} */
  const nodes = [];
  /** @type {{ a: number, b: number, tree: boolean }[]} */
  const edges = [];
  /** @type {Set<string>} */
  const linked = new Set();
  /** @type {(a: Paper, b: Paper, tree?: boolean) => boolean} */
  const link = (a, b, tree = false) => {
    const key = a.i < b.i ? `${a.i}-${b.i}` : `${b.i}-${a.i}`;
    if (linked.has(key)) return false;
    linked.add(key);
    edges.push({ a: a.i, b: b.i, tree });
    a.deg++;
    b.deg++;
    return true;
  };

  clusters.forEach((c, ci) => nodes.push({ i: nodes.length, x: c.sx, y: c.sy, c: ci, seed: true, deg: 0, depth: 0 }));

  // The order in which the clusters take turns. A comparator shuffle: its order is the engine's
  // sort's, which is why the result is checked in rather than computed in the page.
  /** @type {number[]} */
  const plan = clusters.flatMap((c, ci) => Array.from({ length: c.n }, () => ci));
  plan.sort(() => R() - 0.5);

  for (const ci of plan) {
    const c = clusters[ci];
    const pool = nodes.filter((n) => n.c === ci);
    for (let tries = 0; tries < 12; tries++) {
      // a seed lends itself to the first papers; later, well-cited papers near the seed find more
      let tot = 0;
      const ws = pool.map((n) => {
        const w = n.seed ? Math.max(0.3, 9 - n.deg) : Math.pow(1 + n.deg, 1.5) * Math.pow(0.8, n.depth);
        tot += w;
        return w;
      });
      let pick = R() * tot;
      let p = pool[0];
      for (let j = 0; j < pool.length; j++) {
        pick -= ws[j];
        if (pick <= 0) {
          p = pool[j];
          break;
        }
      }
      /** @type {{ x: number, y: number } | null} */
      let best = null;
      let bestD = 0;
      for (let k = 0; k < 14; k++) {
        const a = R() * Math.PI * 2;
        const d = p.seed ? 50 + R() * 70 : 24 + R() * 24;
        const x = p.x + Math.cos(a) * d;
        const y = p.y + Math.sin(a) * d;
        if (Math.hypot(x - c.x, y - c.y) > c.r - 14) continue;
        let md = Infinity;
        for (const n of nodes) md = Math.min(md, Math.hypot(n.x - x, n.y - y));
        if (md > bestD) {
          bestD = md;
          best = { x, y };
        }
      }
      if (best && bestD > 15) {
        const n = { i: nodes.length, x: best.x, y: best.y, c: ci, seed: false, deg: 0, depth: p.depth + 1 };
        nodes.push(n);
        link(p, n, true);
        break;
      }
    }
  }

  for (const n of nodes) {
    if (n.seed || R() > 0.45) continue;
    const near = nodes
      .filter((m) => m !== n && m.c === n.c && Math.hypot(m.x - n.x, m.y - n.y) < 52)
      .sort((a, b) => Math.hypot(a.x - n.x, a.y - n.y) - Math.hypot(b.x - n.x, b.y - n.y));
    for (const m of near) if (link(n, m)) break;
  }

  /** @type {[Paper, Paper, number][]} */
  const pairs = [];
  for (const a of nodes)
    if (a.c === 0 && !a.seed)
      for (const b of nodes) if (b.c === 1 && !b.seed) pairs.push([a, b, Math.hypot(a.x - b.x, a.y - b.y)]);
  pairs.sort((p, q) => p[2] - q[2]);
  /** @type {Set<number>} */
  const used = new Set();
  let bridges = 0;
  // the closest free pairs, skipping six candidates after each so the bridges spread out
  for (let k = 0; k < pairs.length && bridges < 3; k++) {
    const [a, b] = pairs[k];
    if (used.has(a.i) || used.has(b.i)) continue;
    used.add(a.i);
    used.add(b.i);
    link(a, b);
    bridges++;
    k += 6;
  }

  return {
    nodes: nodes.map((n) => {
      if (n.seed) return { x: one(n.x), y: one(n.y), depth: 0, lag: 0, seed: true };
      const lag = Number(R().toFixed(2));
      return { x: one(n.x), y: one(n.y), r: one(Math.min(7, 2.7 + 0.8 * (n.deg - 1))), depth: n.depth, lag };
    }),
    edges: edges.map((e) => /** @type {[number, number, 0 | 1]} */ ([e.a, e.b, e.tree ? 1 : 0])),
  };
}
