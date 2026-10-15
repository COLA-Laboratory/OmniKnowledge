/**
 * Generates the fixed coordinates the pictures draw from, and checks them.
 *
 * The map of the 212 kept papers (kit/network.data.js) is grown and laid out by simulation:
 * four topics, each a small citation network. The semantic map of the same papers
 * (sections/knowledge/semantic.data.js) places every paper in a sub-topic, once for each of the
 * Knowledge section's arrangements. Both are illustrative and the same on every visit, so they
 * are computed here, once, and checked in; the page only reads them.
 *
 * Usage: node tools/layouts.mjs          writes both data files
 *        node tools/layouts.mjs --check  exits non-zero when a data file is not what this produces
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prng } from '../kit/random.js';
import { centroid, enclosingCircle } from '../kit/geometry.js';
import { ARRANGEMENTS, PAD } from '../sections/knowledge/arrangements.js';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
export const FILES = {
  network: path.join(root, 'kit', 'network.data.js'),
  semantic: path.join(root, 'sections', 'knowledge', 'semantic.data.js'),
};

/* ---------- the citation network ---------- */

/** The four topics: size, seed paper, hub strengths, how often a paper cites a hub, box, random seed. */
const TOPICS = [
  {
    name: 'Feeding and ingestion',
    n: 68,
    seed: 'Li et al. 2021',
    rank: 1,
    hubs: [5, 3.2, 2.4, 2, 1.5],
    ph: 0.56,
    w: 318,
    h: 388,
    rs: 41,
  },
  { name: 'Oxidative stress', n: 57, seed: 'Chen et al. 2019', rank: 0, hubs: [4, 3.6, 2, 1.6], ph: 0.6, w: 292, h: 356, rs: 19 },
  {
    name: 'Growth and development',
    n: 54,
    seed: 'Park et al. 2018',
    rank: 2,
    hubs: [3.6, 3, 2.6, 2.2, 1.6],
    ph: 0.5,
    w: 284,
    h: 346,
    rs: 7,
  },
  { name: 'Trophic transfer', n: 33, hubs: [4, 2.4, 1.5], ph: 0.58, w: 206, h: 250, rs: 23 },
];

/**
 * Grows one topic: a few papers are hubs; each later paper cites a hub or a paper near one.
 *
 * @param {(typeof TOPICS)[number]} S
 */
function grow(S) {
  const R = prng(S.rs * 7919 + 13);
  const n = S.n;
  const H = S.hubs.length;
  /** @type {number[][]} */
  const adj = [];
  /** @type {number[]} */
  const fit = [];
  /** @type {[number, number][]} */
  const links = [];
  for (let i = 0; i < n; i++) adj[i] = [];
  /** @param {number} a @param {number | null | undefined} b */
  const link = (a, b) => {
    if (b == null || a === b || adj[a].indexOf(b) >= 0) return false;
    adj[a].push(b);
    adj[b].push(a);
    links.push([a, b]);
    return true;
  };
  /** @param {number[]} from @param {number} not */
  const pick = (from, not) => {
    let tot = 0;
    const w = [];
    for (let k = 0; k < from.length; k++) {
      w[k] = from[k] === not ? 0 : from[k] < H ? S.hubs[from[k]] * 1.6 : fit[from[k]] * Math.pow(adj[from[k]].length + 1, 0.6);
      tot += w[k];
    }
    let q = R() * tot;
    for (let k = 0; k < from.length; k++) {
      q -= w[k];
      if (q <= 0) return from[k];
    }
    return from[from.length - 1];
  };
  const hubs = [];
  const rest = [];
  for (let i = 0; i < n; i++) {
    if (i < H) {
      fit[i] = S.hubs[i];
      if (i) link(i, R() < 0.6 ? i - 1 : Math.floor(R() * i));
      hubs.push(i);
      continue;
    }
    fit[i] = R() < 0.24 ? 1.4 : 0.3;
    const t = !rest.length || R() < S.ph ? pick(hubs, -1) : pick(rest, -1);
    link(i, t);
    if (R() < 0.3) link(i, R() < 0.6 && adj[t].length > 1 ? pick(adj[t], i) : R() < 0.5 ? pick(hubs, -1) : pick(rest, -1));
    rest.push(i);
  }
  return { adj, links, R };
}

/**
 * Lays a topic out by springs along citations and repulsion between papers.
 *
 * @param {(typeof TOPICS)[number]} S
 * @param {ReturnType<typeof grow>} G
 */
function settle(S, G) {
  const { R, adj, links } = G;
  const n = S.n;
  /** @type {{ x: number, y: number }[]} */
  const P = [];
  const seen = [0];
  const queue = [0];
  P[0] = { x: 0, y: 0 };
  while (queue.length) {
    const p = /** @type {number} */ (queue.shift());
    adj[p].forEach((c) => {
      if (seen.indexOf(c) >= 0) return;
      const a = R() * 6.2832;
      P[c] = { x: P[p].x + Math.cos(a) * 34, y: P[p].y + Math.sin(a) * 34 };
      seen.push(c);
      queue.push(c);
    });
  }
  const deg = adj.map((a) => a.length);
  const q = deg.map((d) => 1 + 0.55 * Math.sqrt(d - 1));
  const len = links.map((l) => {
    const a = deg[l[0]];
    const b = deg[l[1]];
    const lo = Math.min(a, b);
    const hi = Math.max(a, b);
    return (lo === 1 ? 20 + 3.2 * Math.sqrt(hi) : 30 + 7 * Math.sqrt(lo) + 3 * Math.sqrt(hi)) * (0.7 + 0.75 * R());
  });
  const asp = S.h / S.w;
  const IT = 700;
  for (let it = 0; it < IT; it++) {
    const T = 14 * Math.pow(1 - it / IT, 1.4) + 0.25;
    const D = [];
    let dx, dy, d, f;
    for (let i = 0; i < n; i++) D[i] = { x: -P[i].x * 0.03 * asp, y: (-P[i].y * 0.03) / asp };
    for (let i = 0; i < n; i++)
      for (let j = i + 1; j < n; j++) {
        dx = P[j].x - P[i].x;
        dy = P[j].y - P[i].y;
        d = Math.hypot(dx, dy) + 0.01;
        f = Math.min(40, (620 * q[i] * q[j]) / (d * d)) / d;
        D[i].x -= dx * f;
        D[i].y -= dy * f;
        D[j].x += dx * f;
        D[j].y += dy * f;
      }
    for (let k = 0; k < links.length; k++) {
      const i = links[k][0];
      const j = links[k][1];
      dx = P[j].x - P[i].x;
      dy = P[j].y - P[i].y;
      d = Math.hypot(dx, dy) + 0.01;
      f = (0.16 * (d - len[k])) / d;
      D[i].x += dx * f;
      D[i].y += dy * f;
      D[j].x -= dx * f;
      D[j].y -= dy * f;
    }
    for (let i = 0; i < n; i++) {
      d = Math.hypot(D[i].x, D[i].y) + 0.01;
      f = Math.min(d, T) / d;
      P[i].x += D[i].x * f;
      P[i].y += D[i].y * f;
    }
  }
  return P;
}

/**
 * Returns the citation network: each topic's papers, measured from the middle of its own
 * network, and its citations.
 */
export function network() {
  return TOPICS.map((S) => {
    const G = grow(S);
    const P = settle(S, G);
    const R = G.R;
    const n = S.n;
    /** @type {{ i: number, x: number, y: number, deg: number, r: number, seed?: string }[]} */
    const nodes = P.map((p, ix) => {
      const d = G.adj[ix].length;
      return { i: ix, x: p.x, y: p.y, deg: d, r: 3 + 1.28 * Math.pow(d - 1, 0.74) + (d < 3 ? R() * 0.9 : 0) };
    });
    const byDeg = nodes.slice().sort((a, b) => b.deg - a.deg || a.i - b.i);
    if (S.seed) {
      byDeg[S.rank].seed = S.seed;
      byDeg[S.rank].r = Math.max(byDeg[S.rank].r, 7.5);
    }
    // fit the topic's own box, then keep circles off each other and off lines that are not theirs
    let x0 = 1e9;
    let x1 = -1e9;
    let y0 = 1e9;
    let y1 = -1e9;
    nodes.forEach((m) => {
      x0 = Math.min(x0, m.x);
      x1 = Math.max(x1, m.x);
      y0 = Math.min(y0, m.y);
      y1 = Math.max(y1, m.y);
    });
    let sx = (S.w - 16) / (x1 - x0);
    let sy = (S.h - 16) / (y1 - y0);
    const s = Math.min(sx, sy);
    sx = Math.min(sx, s * 1.12);
    sy = Math.min(sy, s * 1.12);
    nodes.forEach((m) => {
      m.x = (m.x - (x0 + x1) / 2) * sx;
      m.y = (m.y - (y0 + y1) / 2) * sy;
    });
    for (let it = 0; it < 60; it++) {
      for (let i = 0; i < n; i++)
        for (let j = i + 1; j < n; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const d = Math.hypot(dx, dy) || 0.01;
          const want = a.r + b.r + (a.seed || b.seed ? 7 : 3.5);
          if (d >= want) continue;
          const push = ((want - d) / d) * 0.5;
          a.x -= dx * push;
          a.y -= dy * push;
          b.x += dx * push;
          b.y += dy * push;
        }
      // room above a seed for its name
      nodes.forEach((sd) => {
        if (!sd.seed) return;
        const bx0 = sd.x - 49;
        const bx1 = sd.x + 49;
        const by1 = sd.y - sd.r - 5.5;
        const by0 = by1 - 21;
        nodes.forEach((m) => {
          if (m === sd || m.x < bx0 - m.r || m.x > bx1 + m.r || m.y < by0 - m.r || m.y > by1 + m.r) return;
          const up = m.y - (by0 - m.r);
          const left = m.x - (bx0 - m.r);
          const right = bx1 + m.r - m.x;
          const lo = Math.min(up, left, right);
          if (lo === up) m.y -= up * 0.8;
          else if (lo === left) m.x -= left * 0.8;
          else m.x += right * 0.8;
        });
      });
      for (let k = 0; k < G.links.length; k++) {
        const u = nodes[G.links[k][0]];
        const v = nodes[G.links[k][1]];
        const ex = v.x - u.x;
        const ey = v.y - u.y;
        const el = ex * ex + ey * ey;
        for (let i = 0; i < n; i++) {
          const m = nodes[i];
          if (m === u || m === v) continue;
          const t = ((m.x - u.x) * ex + (m.y - u.y) * ey) / el;
          if (t < 0.08 || t > 0.92) continue;
          const px = u.x + ex * t - m.x;
          const py = u.y + ey * t - m.y;
          const pd = Math.hypot(px, py) || 0.01;
          const need = m.r + 2.6;
          if (pd >= need) continue;
          const mv = ((need - pd) / pd) * 0.5;
          m.x -= px * mv;
          m.y -= py * mv;
        }
      }
    }
    x0 = 1e9;
    x1 = -1e9;
    y0 = 1e9;
    y1 = -1e9;
    nodes.forEach((m) => {
      x0 = Math.min(x0, m.x - m.r);
      x1 = Math.max(x1, m.x + m.r);
      y0 = Math.min(y0, m.y - m.r);
      y1 = Math.max(y1, m.y + m.r);
    });
    nodes.forEach((m) => {
      m.x -= (x0 + x1) / 2;
      m.y -= (y0 + y1) / 2;
    });
    return { name: S.name, n: S.n, seed: S.seed, w: x1 - x0, h: y1 - y0, nodes, links: G.links };
  });
}

/* ---------- the semantic map ---------- */

/** Each topic's sub-topics: name, where it stands in a 1000 by 460 box, how many papers it holds. */
const LOBES = [
  [
    ['Particle uptake', 150, 140, 26],
    ['Gut retention', 232, 304, 24],
    ['Feeding rate', 345, 196, 18],
  ],
  [
    ['Antioxidant enzymes', 566, 108, 30],
    ['Lipid peroxidation', 708, 136, 27],
  ],
  [
    ['Body condition', 884, 214, 16],
    ['Larval growth', 800, 344, 20],
    ['Embryo development', 656, 372, 18],
  ],
  [
    ['Prey to predator', 452, 384, 19],
    ['Food web models', 536, 290, 14],
  ],
];

/**
 * Places every paper of the network in a sub-topic of a 1000 by 460 box, by what it is about.
 *
 * @param {ReturnType<typeof network>} topics
 */
function semanticBase(topics) {
  const W = 1000;
  const H = 460;
  /** @type {{ i: number, t: number, lobe: number, x: number, y: number }[]} */
  const all = [];
  const out = topics.map((T, t) => {
    const R = prng(9001 + t * 131);
    /** @type {(typeof all)[number][]} */
    const pts = [];
    const lobes = LOBES[t];
    let k = 0;
    let left = /** @type {number} */ (lobes[0][3]);
    T.nodes.forEach((m, i) => {
      while (left <= 0 && k < lobes.length - 1) {
        k++;
        left = /** @type {number} */ (lobes[k][3]);
      }
      left--;
      const L = /** @type {[string, number, number, number]} */ (lobes[k]);
      const sig = 7.2 * Math.sqrt(L[3]);
      const u = Math.max(1e-6, R());
      const v = R();
      const g = Math.sqrt(-2 * Math.log(u));
      const a = 6.2832 * v;
      const p = { i, t, lobe: k, x: L[1] + Math.cos(a) * g * sig * 1.15, y: L[2] + Math.sin(a) * g * sig * 0.9 };
      pts.push(p);
      all.push(p);
    });
    return {
      name: T.name,
      lobes: lobes.map((L) => ({
        name: /** @type {string} */ (L[0]),
        x: /** @type {number} */ (L[1]),
        y: /** @type {number} */ (L[2]),
      })),
      pts,
    };
  });
  for (let it = 0; it < 80; it++) {
    for (let a = 0; a < all.length; a++)
      for (let b = a + 1; b < all.length; b++) {
        const p = all[a];
        const q = all[b];
        const dx = q.x - p.x;
        const dy = q.y - p.y;
        const d = Math.hypot(dx, dy) || 0.01;
        const want = p.t === q.t ? 13 : 22;
        if (d >= want) continue;
        const mv = ((want - d) / d) * 0.5;
        p.x -= dx * mv;
        p.y -= dy * mv;
        q.x += dx * mv;
        q.y += dy * mv;
      }
    all.forEach((p) => {
      p.x = Math.max(14, Math.min(W - 14, p.x));
      p.y = Math.max(14, Math.min(H - 14, p.y));
    });
  }
  return { w: W, h: H, topics: out };
}

/**
 * Packs the semantic map into one arrangement of the Knowledge section: a sub-topic's papers
 * gather evenly round its middle, the sub-topics of one topic touch, and topics stand apart.
 *
 * @param {ReturnType<typeof network>} topics
 * @param {ReturnType<typeof semanticBase>} SEM
 * @param {import('../sections/knowledge/arrangements.js').Arrangement} G
 * @returns {{ lobes: { x: number, y: number, r: number }[], papers: [number, number][] }} Each
 *   sub-topic's ground, in the order of LOBES; each paper's place, in the network's order.
 */
function pack(topics, SEM, G) {
  const M = G.map;
  /** @type {{ t: number, x: number, y: number, r: number, o: { x: number, y: number }, s?: { x: number, y: number } }[]} */
  const papers = [];
  /** @type {number[]} */
  const base = [];
  topics.forEach((T, t) => {
    base[t] = papers.length;
    T.nodes.forEach((m) => papers.push({ t, x: 0, y: 0, r: Math.max(G.rmin, m.r * G.S * G.rk), o: { x: 0, y: 0 } }));
  });
  /** @param {number} x @param {number} y */
  const toBox = (x, y) =>
    G.flip
      ? { x: M.x + (y / SEM.h) * M.w, y: M.y + (x / SEM.w) * M.h }
      : { x: M.x + (x / SEM.w) * M.w, y: M.y + (y / SEM.h) * M.h };
  /** @type {{ t: number, g: { x: number, y: number, r: number }, pts: typeof papers }[]} */
  const lobes = [];
  /** @type {[(typeof lobes)[number], (typeof lobes)[number]][]} */
  const touch = [];
  SEM.topics.forEach((T, t) => {
    const mine = T.lobes.map((L) => {
      const hand = G.lobes?.[lobes.length];
      /** @type {(typeof lobes)[number]} */
      const o = { t, g: { ...(hand ? { x: hand[0], y: hand[1] } : toBox(L.x, L.y)), r: 0 }, pts: [] };
      lobes.push(o);
      return o;
    });
    T.pts.forEach((p) => {
      const L = T.lobes[p.lobe];
      const P = papers[base[t] + p.i];
      const dx = (p.x - L.x) * 0.4;
      const dy = (p.y - L.y) * 0.4;
      P.o = G.flip ? { x: dy, y: dx } : { x: dx, y: dy };
      mine[p.lobe].pts.push(P);
    });
    // a spanning tree over the topic's sub-topics: each touches its nearest
    const inTree = [mine[0]];
    const rest = mine.slice(1);
    while (rest.length) {
      let bestD = 1e9;
      let pair = /** @type {[(typeof lobes)[number], (typeof lobes)[number]]} */ ([mine[0], mine[0]]);
      inTree.forEach((p) => {
        rest.forEach((q) => {
          const d = Math.hypot(p.g.x - q.g.x, p.g.y - q.g.y);
          if (d < bestD) {
            bestD = d;
            pair = [p, q];
          }
        });
      });
      touch.push(pair);
      inTree.push(pair[1]);
      rest.splice(rest.indexOf(pair[1]), 1);
    }
  });
  lobes.forEach((o) => {
    for (let it = 0; it < 300; it++) {
      o.pts.forEach((P) => {
        P.o.x *= 0.97;
        P.o.y *= 0.97;
      });
      for (let a = 0; a < o.pts.length; a++)
        for (let b = a + 1; b < o.pts.length; b++) {
          const p = o.pts[a];
          const q = o.pts[b];
          const dx = q.o.x - p.o.x;
          const dy = q.o.y - p.o.y;
          const d = Math.hypot(dx, dy) || 0.01;
          const want = p.r + q.r + G.gap;
          if (d >= want) continue;
          const mv = ((want - d) / d) * 0.5;
          p.o.x -= dx * mv;
          p.o.y -= dy * mv;
          q.o.x += dx * mv;
          q.o.y += dy * mv;
        }
    }
    const circles = o.pts.map((P) => ({ x: P.o.x, y: P.o.y, r: P.r }));
    const c = enclosingCircle(circles, centroid(circles));
    o.pts.forEach((P) => {
      P.o.x -= c.x;
      P.o.y -= c.y;
    });
    o.g.r = c.r + PAD;
  });
  /** @param {(typeof lobes)[number]} p @param {(typeof lobes)[number]} q @param {number} want @param {boolean} both */
  const pull = (p, q, want, both) => {
    const dx = q.g.x - p.g.x;
    const dy = q.g.y - p.g.y;
    const d = Math.hypot(dx, dy) || 0.01;
    if (!both && d >= want) return;
    const mv = ((want - d) / d) * 0.25;
    p.g.x -= dx * mv;
    p.g.y -= dy * mv;
    q.g.x += dx * mv;
    q.g.y += dy * mv;
  };
  for (let it = 0; it < 500; it++) {
    touch.forEach((l) => pull(l[0], l[1], l[0].g.r + l[1].g.r - G.over, true));
    for (let a = 0; a < lobes.length; a++)
      for (let b = a + 1; b < lobes.length; b++) {
        const p = lobes[a];
        const q = lobes[b];
        if (touch.some((l) => (l[0] === p && l[1] === q) || (l[0] === q && l[1] === p))) continue;
        pull(p, q, p.g.r + q.g.r + (p.t === q.t ? -G.over : G.apart), false);
      }
    lobes.forEach((o) => {
      o.g.x = Math.max(M.x + o.g.r, Math.min(M.x + M.w - o.g.r, o.g.x));
      o.g.y = Math.max(M.y + o.g.r + G.semTop, Math.min(M.y + M.h - o.g.r, o.g.y));
    });
  }
  lobes.forEach((o) => o.pts.forEach((P) => (P.s = { x: o.g.x + P.o.x, y: o.g.y + P.o.y })));
  return {
    lobes: lobes.map((o) => ({ x: o.g.x, y: o.g.y, r: o.g.r })),
    papers: papers.map((P) => /** @type {[number, number]} */ ([P.s?.x ?? NaN, P.s?.y ?? NaN])),
  };
}

/** Returns the semantic map's names and, for every arrangement, its packed coordinates. */
export function semantic() {
  const topics = network();
  const SEM = semanticBase(topics);
  return {
    lobes: SEM.topics.flatMap((T, t) => T.lobes.map((L) => ({ t, name: L.name }))),
    arrangements: Object.fromEntries(Object.entries(ARRANGEMENTS).map(([key, G]) => [key, pack(topics, SEM, G)])),
  };
}

/* ---------- the data files ---------- */

/**
 * Returns the source of a data module that exports one constant.
 *
 * @param {string} name
 * @param {string} doc What the constant holds, for its comment.
 * @param {unknown} value
 */
function source(name, doc, value) {
  return `/* Generated by tools/layouts.mjs; do not edit. Regenerate with \`pnpm layouts\`. */\n\n/** ${doc} */\nexport const ${name} = ${JSON.stringify(value)};\n`;
}

/** Returns the contents each data file must have. */
export function files() {
  return {
    [FILES.network]: source(
      'TOPICS',
      '@type {import("./network.js").Topic[]} The four topics of the citation network.',
      network(),
    ),
    [FILES.semantic]: source(
      'SEMANTIC',
      '@type {import("./semantic.js").SemanticData} The semantic map, packed for each arrangement.',
      semantic(),
    ),
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const check = process.argv.includes('--check');
  let stale = 0;
  for (const [file, text] of Object.entries(files())) {
    const rel = path.relative(root, file);
    if (check) {
      const now = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
      if (now !== text) {
        stale++;
        console.error(`${rel}:1: not what tools/layouts.mjs produces; run pnpm layouts`);
      }
    } else {
      fs.writeFileSync(file, text);
      console.log(`wrote ${rel}`);
    }
  }
  process.exit(stale ? 1 : 0);
}
