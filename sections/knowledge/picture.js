/**
 * The Knowledge picture: the map of the kept papers above (as a citation network or as a
 * semantic map, the same dots moving between the two) and the four task cards below.
 *
 * Choosing a task plays the reading: a front crosses the map once and every paper is read as it
 * passes; the papers that hold something relevant stay ringed; the cited ones, from all four
 * topics, become numbered citation marks, and a copy of each mark travels down into the task,
 * whose drawing is written into an output that carries the same numbers. Paper and citation are
 * tied by number, as a place on a map and its entry in a legend.
 */
import {
  EXAMPLE,
  between,
  centroid,
  easing,
  enclosingCircle,
  f,
  isStill,
  prng,
  reveal,
  setMarkup,
  svg,
  token,
  topics,
} from '../../kit/index.js';
import { PAD } from './arrangements.js';
import { semantic } from './semantic.js';
import { CR, TASKS, markAt0 } from './tasks.js';
import { names } from './names.js';
import { reading } from './reading.js';

const DESCRIPTION =
  'The 212 kept papers as one map, shown as a citation network in four topics or as a semantic map of ten sub-topics. Below it four tasks: literature review, hypothesis generation, experiment planning and results interpretation. For the chosen task every paper on the map is read, the papers that hold relevant passages are ringed, and each statement of the output carries a numbered citation that matches a numbered mark on the paper it rests on.';

/**
 * @typedef {{ x: number, y: number }} Point
 * @typedef {object} Paper A paper as the picture draws it.
 * @property {number} t Its topic.
 * @property {boolean} seed
 * @property {number} r
 * @property {Point} n Its place in the citation network.
 * @property {Point} s Its place in the semantic map.
 * @property {number} x Where it stands now.
 * @property {number} y
 * @property {SVGElement} el
 * @property {SVGElement} [ring]
 * @property {{ halo: SVGElement, g: SVGElement } | null} [mark]
 * @property {number} [room] How far a citation mark on it would stay clear of its neighbours and the names.
 * @property {number} [at] When the reading reaches it.
 * @typedef {object} Card
 * @property {SVGElement} g
 * @property {import('./tasks.js').Cite[]} cites
 * @property {{ el: Element & { land?: number }, key: boolean }[]} words
 * @property {Element[]} late
 * @property {Paper[] | null} cited
 * @property {Paper[] | null} rel
 */

/**
 * Builds the picture for one arrangement.
 *
 * @param {import('./arrangements.js').Arrangement} G
 * @param {'wide' | 'tall'} key The arrangement's key in the semantic map's data.
 * @param {HTMLElement} stage The element the SVG goes into.
 * @param {(waiting: boolean) => void} waiting Tells the frame whether nothing has been read yet.
 * @param {number} first The task chosen from the start, or -1.
 * @returns {{ choose: (k: number) => number, view: (name: 'net' | 'sem', now?: boolean) => void, replay: () => number, point: (x: number, y: number) => void, destroy: () => void }}
 *   choose and replay return how long the reading they start lasts, in ms (0 when nothing plays).
 */
export function Picture(G, key, stage, waiting, first) {
  const M = G.map;
  const pic = svg('svg', { viewBox: `0 0 ${G.W} ${G.H}`, role: 'img', 'aria-labelledby': 'ka-title' }, stage);
  svg('desc', { id: 'ka-title' }, pic, DESCRIPTION);
  const [gGround, gEdge, gDot] = [0, 1, 2].map(() => svg('g', {}, pic));
  const gMark = svg('g', { class: 'ka-marks' }, pic);
  const [gLab, gSub, gCard, gFly] = [0, 1, 2, 3].map(() => svg('g', {}, pic));
  const state = { v: 0, view: 'net', task: 0 };
  const rv = reveal();
  let tw = 0;
  let hot = -1;
  let dead = false;

  /* -- the papers, in both views -- */
  const packed = semantic.arrangements[key];
  const at = G.at.map((A, t) => {
    const g0 = enclosingCircle(topics[t].nodes, centroid(topics[t].nodes));
    return { ...A, r: g0.r * G.S + PAD, x: A.cx - g0.x * G.S, y: A.cy - g0.y * G.S };
  });
  /** @type {Paper[]} */
  const papers = [];
  /** @type {number[]} */
  const base = [];
  /** @type {{ a: Paper, b: Paper, el?: SVGElement }[]} */
  const edges = [];
  topics.forEach((T, t) => {
    const o = at[t];
    base[t] = papers.length;
    for (const m of T.nodes) {
      const [sx, sy] = packed.papers[papers.length];
      papers.push(
        /** @type {Paper} */ ({
          t,
          seed: !!m.seed,
          r: Math.max(G.rmin, m.r * G.S * G.rk),
          n: { x: o.x + m.x * G.S, y: o.y + m.y * G.S },
          s: { x: sx, y: sy },
          x: 0,
          y: 0,
        }),
      );
    }
    for (const l of T.links) edges.push({ a: papers[base[t] + l[0]], b: papers[base[t] + l[1]] });
  });
  for (const c of between(at, G.S)) edges.push({ a: papers[base[c[0]] + c[1]], b: papers[base[c[2]] + c[3]] });
  // the semantic map's sub-topics: each a ground, named on the side G gives or that faces away from the rest of its topic
  const lobes = semantic.lobes.map((L, i) => ({
    ...L,
    g: packed.lobes[i],
    side: G.lobes?.[i]?.[2],
    el: svg('circle', { class: 'ground' }, gGround),
  }));
  for (const e of edges) e.el = svg('line', { class: 'edge' }, gEdge);
  for (const p of papers) {
    if (p.seed) {
      p.ring = svg('circle', { r: f(p.r + 3), class: 'ring' }, gDot);
      p.el = svg('circle', { r: f(p.r), class: 'core' }, gDot);
    } else p.el = svg('circle', { r: f(p.r), class: 'dot' }, gDot);
  }
  const front = svg('line', { x1: M.x - 6, x2: M.x - 6, y1: M.y - 14, y2: M.y + M.h + 14, class: 'ka-front' }, gDot);

  /* -- names: a topic's name moves with its topic; a sub-topic's name shows in the semantic map -- */
  const { topicLabs, named, taken } = names(G, at, lobes, gLab, gSub);

  /**
   * Puts every paper, ground, citation and name where it stands at v: 0 the network, 1 the semantic map.
   *
   * @param {number} v
   */
  function apply(v) {
    state.v = v;
    for (const p of papers) {
      p.x = p.n.x + (p.s.x - p.n.x) * v;
      p.y = p.n.y + (p.s.y - p.n.y) * v;
      const x = String(f(p.x));
      const y = String(f(p.y));
      p.el.setAttribute('cx', x);
      p.el.setAttribute('cy', y);
      if (p.ring) {
        p.ring.setAttribute('cx', x);
        p.ring.setAttribute('cy', y);
      }
      if (p.mark) {
        p.mark.halo.setAttribute('transform', `translate(${x} ${y})`);
        p.mark.g.setAttribute('transform', `translate(${x} ${y})`);
      }
    }
    for (const o of lobes) {
      const A = at[o.t];
      o.el.setAttribute('cx', String(f(A.cx + (o.g.x - A.cx) * v)));
      o.el.setAttribute('cy', String(f(A.cy + (o.g.y - A.cy) * v)));
      o.el.setAttribute('r', String(f(A.r + (o.g.r - A.r) * v)));
    }
    const eo = Math.max(0, 1 - v * 2.6);
    gEdge.style.opacity = String(eo);
    gEdge.style.display = eo ? '' : 'none';
    if (eo)
      for (const e of edges) {
        const el = /** @type {SVGElement} */ (e.el);
        el.setAttribute('x1', String(f(e.a.x)));
        el.setAttribute('y1', String(f(e.a.y)));
        el.setAttribute('x2', String(f(e.b.x)));
        el.setAttribute('y2', String(f(e.b.y)));
      }
    for (const L of topicLabs)
      L.g.setAttribute('transform', `translate(${f(L.n.x + (L.s.x - L.n.x) * v)} ${f(L.n.y + (L.s.y - L.n.y) * v)})`);
    const so = Math.max(0, (v - 0.85) / 0.15);
    gSub.style.opacity = String(so);
    gSub.style.display = so ? '' : 'none';
  }

  /* -- the task cards -- */
  const meter = /** @type {CanvasRenderingContext2D} */ (document.createElement('canvas').getContext('2d'));
  meter.font = `400 12.5px ${token('font-pic')}`;
  /** @param {string} text @param {number} width */
  function wrap(text, width) {
    /** @type {string[]} */
    const out = [];
    let cur = '';
    for (const w of text.split(' ')) {
      if (cur && meter.measureText(`${cur} ${w}`).width > width) {
        out.push(cur);
        cur = w;
      } else cur = cur ? `${cur} ${w}` : w;
    }
    out.push(cur);
    return out;
  }
  /** @type {Card[]} */
  const cards = TASKS.map((T, k) => {
    const R = G.cards[k];
    const g = svg('g', { class: 'ka-task', 'data-k': k, 'data-on': k === first ? '1' : '0' }, gCard);
    const ox = R.x + 23;
    const oy = R.y + 24;
    svg('rect', { x: R.x + 0.5, y: R.y + 0.5, width: R.w - 1, height: R.h - 1, rx: 12.5, class: 'card ka-edge' }, g);
    const body = svg('g', {}, g);
    /** @type {import('./tasks.js').Cite[]} */
    const cites = [];
    T.draw(body, ox, oy, cites);
    const mark = svg('rect', { class: 'mark ka-chosen' }, g);
    const name = /** @type {SVGTextElement} */ (svg('text', { x: ox - 0.8, y: R.y + 171, class: 'task' }, g, EXAMPLE.tasks[k]));
    mark.setAttribute('x', String(f(ox - 6)));
    mark.setAttribute('y', String(R.y + 152));
    mark.setAttribute('width', String(f(name.getComputedTextLength() + 12)));
    mark.setAttribute('height', '25');
    const ask = svg('text', { class: 'note ka-ask' }, g);
    wrap(`“${T.ask}”`, R.w - 46).forEach((l, i) => svg('tspan', { x: ox - (i ? 0.2 : 5.4), y: R.y + 194 + i * 17 }, ask, l));
    const words = [...body.querySelectorAll('.ka-b:not(.ka-ph)')].map((e) => ({
      el: e,
      key: /ka-k|ka-s/.test(e.getAttribute('class') ?? ''),
    }));
    const late = [...body.querySelectorAll('.ka-t, .ka-late, .ka-ph')];
    return { g, cites, words, late, cited: null, rel: null };
  });

  /* -- the papers a task rests on -- */
  /** @param {Paper} p */
  const ringR = (p) => Math.max(p.r + 1.6, 4.8);
  // how far a citation mark standing on a paper would stay clear of the papers round it and of
  // the names, in the worse of the two views
  for (const p of papers) {
    let room = 1e9;
    for (const v of /** @type {const} */ (['n', 's'])) {
      for (const q of papers)
        if (q !== p) room = Math.min(room, Math.hypot(q[v].x - p[v].x, q[v].y - p[v].y) - (q.seed ? q.r + 3 : q.r) - CR);
      for (const b of v === 'n' ? named : taken)
        room = Math.min(
          room,
          Math.hypot(Math.max(b.x - p[v].x, 0, p[v].x - b.x - b.w), Math.max(b.y - p[v].y, 0, p[v].y - b.y - b.h)) - CR,
        );
    }
    p.room = room;
  }

  /**
   * Gives every citation mark of task k its paper, the same in both views, and returns the
   * papers: from all four topics, each a paper with room for a mark (never a seed or a hub),
   * apart from one another, numbered across the network (down it in the tall arrangement).
   *
   * @param {number} k
   * @returns {Paper[]}
   */
  function cited(k) {
    const C = cards[k];
    if (C.cited) return C.cited;
    const R = prng(911 + k * 37);
    /** @type {Paper[]} */
    const out = [];
    /** @param {Paper} p */
    const apart = (p) => {
      let d = 1e9;
      for (const q of out) d = Math.min(d, Math.hypot(p.n.x - q.n.x, p.n.y - q.n.y), Math.hypot(p.s.x - q.s.x, p.s.y - q.s.y));
      return d;
    };
    TASKS[k].from.forEach((n, t) => {
      for (let i = 0; i < n; i++) {
        /** @type {Paper | null} */
        let best = null;
        let score = -1e9;
        for (const p of papers) {
          if (p.t !== t || p.seed || p.r > 6 || out.includes(p)) continue;
          const s = Math.min(/** @type {number} */ (p.room), 6) * 24 + Math.min(apart(p), 120) * 0.4 + R() * 14;
          if (s > score) {
            score = s;
            best = p;
          }
        }
        out.push(/** @type {Paper} */ (best));
      }
    });
    out.sort((p, q) => (G.tall ? p.n.y - q.n.y : p.n.x - q.n.x));
    C.cites.forEach((m, i) => (m.p = out[i]));
    return (C.cited = out);
  }

  /**
   * Returns the papers that hold something relevant to task k: the cited ones, and others
   * across the whole map.
   *
   * @param {number} k
   * @returns {Paper[]}
   */
  function relevant(k) {
    const C = cards[k];
    if (C.rel) return C.rel;
    const R = prng(700 + k * 53);
    const set = cited(k).slice();
    let tries = 0;
    /** @param {Paper} p */
    const reach = (p) => (set.indexOf(p) < C.cites.length && set.indexOf(p) >= 0 ? CR : ringR(p));
    /** @param {Paper} p @param {Paper} q */
    const near = (p, q) => {
      const need = ringR(p) + reach(q) + 5;
      return Math.hypot(p.n.x - q.n.x, p.n.y - q.n.y) < need || Math.hypot(p.s.x - q.s.x, p.s.y - q.s.y) < need;
    };
    const pool = papers.filter((p) => !p.seed && !set.includes(p));
    while (set.length < TASKS[k].hold && pool.length) {
      const p = pool.splice(Math.floor(R() * pool.length), 1)[0];
      if (++tries < 400 && set.some((q) => near(p, q))) continue;
      set.push(p);
    }
    return (C.rel = set);
  }

  /**
   * Marks the papers of task k on the map: a ring on each that holds something relevant, the
   * numbered mark on each cited one.
   *
   * @param {number} k
   */
  function marks(k) {
    gMark.replaceChildren();
    for (const p of papers) p.mark = null;
    const C = cards[k];
    const set = relevant(k);
    const halos = svg('g', {}, gMark);
    const tops = svg('g', {}, gMark);
    const list = /** @type {Paper[]} */ (C.cited);
    for (const p of set) {
      const n = list.indexOf(p);
      const to = `translate(${f(p.x)} ${f(p.y)})`;
      const h = svg('circle', { r: f((n < 0 ? ringR(p) : CR) + 2.2), class: 'ka-halo', transform: to }, halos);
      const g = svg('g', { transform: to }, tops);
      if (n < 0) svg('circle', { r: f(ringR(p)), class: 'ka-ring' }, g);
      else {
        setMarkup(g, markAt0(n + 1));
        C.cites[n].twin = g;
      }
      p.mark = { halo: h, g };
    }
  }

  /**
   * Brings out the citation whose mark stands under the point (x, y) of the picture, on the map
   * or in the card: both its marks take a heavier outline. None when no mark stands there.
   *
   * @param {number} x
   * @param {number} y
   */
  function point(x, y) {
    const C = cards[state.task];
    let hit = -1;
    C.cites.forEach((m, i) => {
      if (m.twin && (Math.hypot(x - m.x, y - m.y) <= m.r + 2 || Math.hypot(x - m.p.x, y - m.p.y) <= m.r + 2)) hit = i;
    });
    if (hit === hot) return;
    hot = hit;
    C.cites.forEach((m, i) => {
      m.full.classList.toggle('ka-hot', i === hit);
      m.twin?.classList.toggle('ka-hot', i === hit);
    });
  }

  /* -- the reading -- */
  function stop() {
    rv.cancel();
    gFly.replaceChildren();
  }
  /** Plays the reading for the chosen task over the finished picture; returns how long it lasts, in ms. */
  function play() {
    stop();
    if (isStill()) return 0;
    return reading(rv, front, M, papers, cards[state.task], gFly);
  }

  /** Ends a move between the two views at once, every paper where it was going. */
  function rest() {
    if (!tw) return;
    cancelAnimationFrame(tw);
    tw = 0;
    apply(state.view === 'sem' ? 1 : 0);
  }
  /**
   * Chooses task k: its relevant and its cited papers are marked, and the reading plays.
   *
   * @param {number} k
   */
  function choose(k) {
    stop();
    rest();
    point(-1e9, -1e9);
    state.task = k;
    cards.forEach((c, i) => c.g.setAttribute('data-on', i === k ? '1' : '0'));
    marks(k);
    waiting(false);
    return play();
  }
  /**
   * Shows the map as a citation network or a semantic map; every paper moves to its place,
   * marked papers stay marked.
   *
   * @param {'net' | 'sem'} name
   * @param {boolean} [now] Without the move.
   */
  function view(name, now = false) {
    const to = name === 'sem' ? 1 : 0;
    const from = state.v;
    const t0 = performance.now();
    const ease = easing();
    state.view = name;
    stop();
    cancelAnimationFrame(tw);
    tw = 0;
    if (now || isStill()) {
      apply(to);
      return;
    }
    const step = () => {
      const u = Math.min(1, (performance.now() - t0) / 900);
      apply(from + (to - from) * ease(u));
      tw = u < 1 && !dead ? requestAnimationFrame(step) : 0;
    };
    step();
  }

  apply(0);
  marks(0);
  return {
    choose,
    view,
    replay: play,
    point,
    destroy() {
      dead = true;
      stop();
      cancelAnimationFrame(tw);
      pic.remove();
    },
  };
}
