/**
 * The Search section's picture: three ways of searching, each drawn at work on the kit's papers
 * (citation.js, semantic.js, database.js), and what each contributes to the papers found, as pale bands as wide as what
 * each search found, standing on one ground. In a wide frame the picture is one drawing; in a
 * narrow one each search is its own drawing and the counts follow.
 */
import { EXAMPLE, f, fitsWide, fmt, markup, onArrive, onLateFonts, onWidthChange, reveal, svg, tile } from '../../kit/index.js';
import { COLW, R, Y1, title } from './shared.js';
import { cite } from './citation.js';
import { sem } from './semantic.js';
import { db } from './database.js';

/** Each search's drawing, by its key. */
const DRAW = { cite, sem, db };

/* ---------- the counts ---------- */

/**
 * Draws the total: the number large, and its word.
 *
 * @param {SVGElement} parent
 * @param {number} x
 * @param {number} y
 */
function total(parent, x, y) {
  const t = svg('text', { x: f(x), y, 'text-anchor': 'middle', class: 'sr-sum' }, parent);
  svg('tspan', {}, t, fmt(EXAMPLE.found));
  svg('tspan', { class: 'sr-unit', dx: 12 }, t, 'papers found in this example');
  return t;
}

/**
 * Draws a count centred on x.
 *
 * @param {SVGElement} parent
 * @param {number} x
 * @param {number} y
 * @param {number} n
 */
function countAt(parent, x, y, n) {
  const g = svg('g', {}, parent);
  svg('text', { class: 'sr-count', x: f(x), y: y - 7, 'text-anchor': 'middle' }, g, fmt(n));
  svg('text', { class: 'note', x: f(x), y: y + 10, 'text-anchor': 'middle' }, g, 'papers');
  return g;
}

/**
 * Returns the outline of the bands' ground: one band per search rising from one ground. Every
 * corner has the radius r; a band on the ground's edge runs straight into it.
 *
 * @param {{ x0: number, x1: number }[]} bands Left to right.
 * @param {number} top The bands' top.
 * @param {number} mid Where they meet the ground.
 * @param {number} x0 The ground's left edge.
 * @param {number} x1 Its right edge.
 * @param {number} bottom Its foot.
 * @param {number} r
 */
function comb(bands, top, mid, x0, x1, bottom, r) {
  const a = ` A${r},${r} 0 0 `;
  const last = bands.length - 1;
  const flushL = bands[0].x0 <= x0;
  const flushR = bands[last].x1 >= x1;
  let d = flushL ? `M${f(x0)},${f(top + r)}` : `M${f(x0)},${f(mid + r)}${a}1 ${f(x0 + r)},${f(mid)}`;
  bands.forEach((b, i) => {
    if (i || !flushL) d += ` H${f(b.x0 - r)}${a}0 ${f(b.x0)},${f(mid - r)} V${f(top + r)}`; // off the ground, up the band's left side
    d += `${a}1 ${f(b.x0 + r)},${f(top)} H${f(b.x1 - r)}${a}1 ${f(b.x1)},${f(top + r)}`; // over its top
    if (i < last || !flushR) d += ` V${f(mid - r)}${a}0 ${f(b.x1 + r)},${f(mid)}`; // down its right side, back onto the ground
  });
  if (!flushR) d += ` H${f(x1 - r)}${a}1 ${f(x1)},${f(mid + r)}`;
  return `${d} V${f(bottom - r)}${a}1 ${f(x1 - r)},${f(bottom)} H${f(x0 + r)}${a}1 ${f(x0)},${f(bottom - r)} Z`;
}

/**
 * Returns the even width of a band for n papers when the largest search is `full` wide.
 *
 * @param {number} n
 * @param {number} full
 */
const bandWidth = (n, full) => Math.round((full * n) / EXAMPLE.searches[0].found / 2) * 2;

/**
 * Draws the counts in a wide frame: under each drawing a band as wide as what its search found,
 * the three standing on one ground that carries the total.
 *
 * @param {SVGSVGElement} pic
 * @param {{ x: number, w: number }[]} cols
 * @param {number} x0
 * @param {number} x1
 * @param {number} top
 * @param {string} uid
 * @returns {{ bottom: number, play: (rv: import('../../kit/motion.js').Reveal, t: number) => void }}
 */
function bands(pic, cols, x0, x1, top, uid) {
  const mid = top + 52;
  const bottom = mid + 72;
  const list = cols.map((B, i) => {
    const w = bandWidth(EXAMPLE.searches[i].found, B.w);
    const c = Math.round(B.x + B.w / 2);
    return { x0: c - w / 2, x1: c + w / 2, c };
  });
  const clip = svg('clipPath', { id: `${uid}-pour` }, pic);
  const pour = svg('rect', { x: x0, y: top, width: x1 - x0, height: bottom - top, class: 'sr-pour' }, clip);
  svg('path', { d: comb(list, top, mid, x0, x1, bottom, R), class: 'ground', 'clip-path': `url(#${uid}-pour)` }, pic);
  const counts = list.map((b, i) => countAt(pic, b.c, top + 33, EXAMPLE.searches[i].found));
  const sum = total(pic, (x0 + x1) / 2, mid + 47);
  return {
    bottom,
    play(rv, t) {
      rv.from(pour, [{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)' }], t, 900, 'cubic-bezier(.45,0,.3,1)');
      counts.forEach((g, i) => rv.arrive(g, t + 120 + i * 110));
      rv.arrive(sum, t + 760, 480);
    },
  };
}

/* ---------- the pictures ---------- */

/** The wide picture's width. */
const WIDE = 1278;
let uidN = 0;

/**
 * Creates one picture in the frame, described by text.
 *
 * @param {Element} frame
 * @param {number} w
 * @param {number} h
 * @param {string} text
 */
function picture(frame, w, h, text) {
  const uid = `sr${++uidN}`;
  const pic = /** @type {SVGSVGElement} */ (
    svg('svg', { viewBox: `0 0 ${w} ${h}`, role: 'img', 'aria-labelledby': `${uid}-t` }, frame)
  );
  svg('desc', { id: `${uid}-t` }, pic, text);
  return { pic, uid };
}

const SAYS = {
  cite: 'Citation tracing: from a seed paper, the papers it cites and the papers that cite it, over two generations',
  sem: 'Semantic Search: a seed paper in a field of papers, the nearest in meaning taken',
  db: 'Database Search: a query, an index of papers, and the papers whose words match it',
};
const sums = () =>
  `Papers found in this example: ${EXAMPLE.searches.map((s) => `${s.name} ${fmt(s.found)}`).join(', ')}. Together ${fmt(EXAMPLE.found)} papers.`;

/**
 * The wide frame: one drawing, three equal columns, the counts under them.
 *
 * @param {Element} frame
 * @param {() => import('../../kit/motion.js').Reveal} fresh Returns a new reveal the section owns.
 * @returns {() => void} Stops waiting for the picture to arrive.
 */
function wide(frame, fresh) {
  const rv = fresh();
  const W = WIDE;
  const X0 = 39;
  const GUT = 48;
  const { pic, uid } = picture(frame, W, 620, `${EXAMPLE.searches.map((s) => SAYS[s.key]).join('. ')}. ${sums()}`);
  const cols = EXAMPLE.searches.map((s, i) => ({ x: X0 + i * (COLW + GUT), w: COLW }));
  /** @type {SVGElement[]} */
  const titles = [];
  /** @type {import('./shared.js').Play[]} */
  const plays = [];
  EXAMPLE.searches.forEach((s, i) => {
    titles.push(title(pic, cols[i].x, s));
    plays.push(DRAW[s.key](markup(pic), cols[i]));
  });
  const low = bands(pic, cols, X0, W - X0, Y1 + 32, uid);
  pic.setAttribute('viewBox', `0 0 ${W} ${low.bottom + X0}`);
  return onArrive(pic, () => {
    let end = 0;
    plays.forEach((play, i) => {
      rv.arrive(titles[i], i * 450);
      end = play(rv, 150 + i * 450);
    });
    low.play(rv, end - 500);
    rv.fit();
  });
}

/**
 * The narrow frame: each search its own drawing; then the counts together.
 *
 * @param {Element} frame
 * @param {() => import('../../kit/motion.js').Reveal} fresh Returns a new reveal the section owns.
 * @returns {() => void} Stops waiting for the pictures to arrive.
 */
function narrow(frame, fresh) {
  const W = 348;
  const X0 = 20;
  const B = { x: X0, w: W - 2 * X0, compact: true };
  const stops = EXAMPLE.searches.map((s) => {
    const { pic } = picture(frame, W, 294, SAYS[s.key]);
    const t = title(pic, B.x, s);
    const play = DRAW[s.key](markup(pic), B);
    t.setAttribute('transform', 'translate(0 -16)');
    const own = fresh();
    return onArrive(pic, () => {
      own.arrive(t, 0);
      play(own, 150);
      own.fit();
    });
  });
  const { pic: last } = picture(frame, W, 100, sums());
  // the first band stands on the ground's left edge, as in a wide frame; the others in the middle of their thirds
  const third = B.w / 3;
  const list = EXAMPLE.searches.map((s, i) => {
    const w = bandWidth(s.found, 100);
    const c = i ? Math.round(B.x + (i + 0.5) * third) : B.x + w / 2;
    return { x0: c - w / 2, x1: c + w / 2, c };
  });
  const heads = list.map((b, i) => {
    const g = markup(last, tile(b.c - 11, 12, 22, EXAMPLE.searches[i].key));
    const t = svg('text', { x: b.c, y: 54, 'text-anchor': 'middle' }, g);
    svg('tspan', { class: 'cnt' }, t, fmt(EXAMPLE.searches[i].found));
    svg('tspan', { class: 'note', dx: 4 }, t, 'papers');
    return g;
  });
  const ground = svg('path', { d: comb(list, 66, 90, B.x, B.x + B.w, 142, R / 2), class: 'ground' }, last);
  const sum = total(last, W / 2, 119);
  last.setAttribute('viewBox', `0 0 ${W} 164`);
  const own = fresh();
  stops.push(
    onArrive(last, () => {
      heads.forEach((g, i) => own.arrive(g, i * 110));
      own.fade(ground, 250, 480);
      own.arrive(sum, 560, 480);
    }),
  );
  return () => stops.forEach((stop) => stop());
}

/**
 * Draws the picture the frame's width asks for, and redraws it when that changes.
 *
 * @param {HTMLElement} root
 */
export function mount(root) {
  const frame = /** @type {HTMLElement} */ (root.querySelector('.sr-pic'));
  /** @type {Set<import('../../kit/motion.js').Reveal>} */
  const reveals = new Set();
  const fresh = () => {
    const rv = reveal();
    reveals.add(rv);
    return rv;
  };
  let narrowNow = !fitsWide(frame, WIDE, 'sr-narrow');
  let stop = () => {};
  function settle() {
    stop();
    for (const rv of reveals) rv.cancel();
    reveals.clear();
  }
  function draw() {
    settle();
    frame.replaceChildren();
    stop = (narrowNow ? narrow : wide)(frame, fresh);
  }
  draw();
  const stopWidth = onWidthChange(frame, () => {
    if (!fitsWide(frame, WIDE, 'sr-narrow') === narrowNow) return;
    narrowNow = !narrowNow;
    draw();
  });
  const stopFonts = onLateFonts(draw);
  return {
    destroy() {
      stopWidth();
      stopFonts();
      settle();
    },
  };
}
