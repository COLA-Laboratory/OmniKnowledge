/**
 * The Screen section's picture: the candidates pass the example's filters in order and the kept
 * papers remain. The pipeline line has a node per filter. Above a node stand the filter's name
 * and setting, the icon of what it reads (icons.js) and, over the icon, what one paper costs
 * there in coins. Under a node the papers that reach the filter are counted in paper icons, one
 * for UNIT papers; the ones it removes stay as pale papers. A frame wide enough (kit/fit.js)
 * shows the filters side by side on a level line; a narrow one, under one another on a line that
 * runs down.
 */
import { EXAMPLE, f, fitsWide, fmt, markup, onArrive, onLateFonts, onWidthChange, paper, reveal, svg } from '../../kit/index.js';
import { coins, icon } from './icons.js';
import { NUDGE, face, widthOf } from './measure.js';
import { COINS, IH, IW, K, N, ROW, SET_LH, UNIT, WIDE, plan } from './plan.js';

/** @typedef {import('./plan.js').Plan} Plan */

/**
 * Returns a line of text.
 *
 * @param {string} cls
 * @param {{ x: number, y: number, mid?: boolean }} at mid: centred on x; otherwise it starts at x, optically aligned.
 * @param {number} dy
 * @param {string | number} s
 */
const text = (cls, at, dy, s) =>
  `<text class="${cls}" x="${f(at.x - (at.mid ? 0 : (NUDGE[cls] ?? 0)))}" y="${f(at.y + dy)}"${at.mid ? ' text-anchor="middle"' : ''}>${s}</text>`;

/**
 * Returns one counted paper centred on x, y.
 *
 * @param {number} x
 * @param {number} y
 * @param {import('../../kit/paper.js').PaperState | null} o
 * @param {number} [scale]
 */
const counted = (x, y, o, scale) =>
  `<g transform="translate(${f(x)} ${f(y)}) scale(${K * (scale || 1)})">${paper(0, 0, IW / K, IH / K, o)}</g>`;

/**
 * Returns names as a phrase: "a, b and c".
 *
 * @param {(string | number)[]} a
 */
const listed = (a) => (a.length < 2 ? a.join('') : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`);

/* ---------- drawing ---------- */

/** Returns what the picture shows, in words. */
function told() {
  const byRule = EXAMPLE.filters.filter((F) => !F.model);
  const byModel = EXAMPLE.filters.filter((F) => F.model);
  /** @param {import('../../kit/example.js').Filter[]} a */
  const names = (a) => listed(a.map((F) => F.name));
  return (
    `The ${fmt(EXAMPLE.deduped)} candidate papers pass ${N} filters in order: ` +
    `${EXAMPLE.filters.map((F) => `${F.name} looks at ${F.reads} (${F.setting}) and ${fmt(F.pass)} pass`).join('; ')}` +
    `. Each filter has an icon of the same size: a view onto a paper, with the part the filter looks at in ink. ${names(byRule)} are checked by rule and cost almost nothing for a paper; ` +
    `${names(byModel)} are screened by LLM and cost ${listed(byModel.map((F) => COINS[F.id] ?? 0))} coins for a paper. ` +
    `${EXAMPLE.kept} are kept. One paper icon stands for ${UNIT} papers.`
  );
}

/**
 * @typedef {{ e: SVGElement, x: number, y: number, row: number }} Slot One counted paper as the
 *   filter leaves it: in ink when it passes, pale when it is removed, yellow when it is kept.
 * @typedef {object} Drawn
 * @property {SVGElement[]} segs
 * @property {{ rows: SVGElement[], slots: Slot[], passed: Slot[], out: SVGElement[], cost: SVGElement[], name: SVGElement, set: SVGElement, icon: SVGElement, read: SVGElement, node: SVGElement, count: SVGElement, slow: boolean }[]} cols
 * @property {{ k: number, says: SVGElement, rule: SVGElement }[]} groups
 * @property {boolean} level The filters stand side by side, so their papers travel from one to the next.
 * @property {SVGElement} [dot]
 * @property {SVGElement} intro
 */

/**
 * Draws a plan into the picture and returns the parts the reveal moves.
 *
 * @param {SVGSVGElement} pic
 * @param {Plan} P
 * @returns {Drawn}
 */
function draw(pic, P) {
  pic.replaceChildren();
  pic.setAttribute('viewBox', `0 0 ${P.W} ${f(P.H)}`);
  pic.style.aspectRatio = `${P.W} / ${f(P.H)}`;
  svg('desc', { id: 'sc-t' }, pic, told());
  const gLine = markup(pic);
  const gTop = markup(pic);
  const gOver = markup(pic);

  // the pipeline line: one stretch to each filter's node
  const from = /** @type {{ x: number, y: number }} */ (P.dot ?? P.start);
  const dot = P.dot ? svg('circle', { class: 'port', cx: P.dot.x, cy: P.dot.y, r: 5.5 }, gLine) : undefined;
  const intro = markup(
    gTop,
    `<text x="${f(P.intro.x - NUDGE['sc-n'])}" y="${P.intro.y}"><tspan class="sc-n">${fmt(EXAMPLE.deduped)}</tspan><tspan class="note" dx="8">after duplicates</tspan></text>`,
  );
  const segs = P.cols.map((c, k) => {
    const a = k ? P.cols[k - 1].node : from;
    const cut = k || P.dot;
    return svg(
      'path',
      {
        class: `lead${cut ? ' cut' : ''}`,
        d: `M${f(a.x + (cut ? 0 : 1.5))},${f(a.y)} L${f(c.node.x)},${f(c.node.y)}`,
        pathLength: 1,
      },
      gLine,
    );
  });

  // the two kinds of filter: each kind's words, and a hairline as far as its filters reach
  const groups = P.groups.map((G) => ({
    k: G.k,
    says: markup(gTop, text('lab', G.at, 0, G.says)),
    rule: svg('path', { class: 'rule', d: `M${f(G.rule[0])},${G.rule[2]} H${f(G.rule[1])}`, pathLength: 1 }, gTop),
  }));

  const cols = P.cols.map((c, k) => {
    const F = EXAMPLE.filters[k];
    const name = markup(gTop, text('task', c.name, 0, F.name));
    const set = markup(gTop, c.lines.map((l, i) => text('sc-set', c.set, i * SET_LH, l)).join(''));
    // the icon: its ticks and the quiet text, then what the filter reads
    const I = icon(F.id, c.box.x, c.box.y);
    const iconG = markup(gTop, I.quiet + I.frame);
    const read = markup(gTop, I.read);
    // what one paper costs here
    const cost = coins(COINS[F.id] ?? 0, c.cost.x, c.cost.foot).map((p) => markup(gTop, p));
    const node = svg('circle', { class: 'port', cx: f(c.node.x), cy: f(c.node.y), r: f(c.node.r) }, gOver);
    // the papers that reach this filter, in rows; over a pale or a yellow one lies the ink paper it arrived as
    const rowCount = Math.ceil(c.n / c.pile.per);
    const last = k === N - 1;
    const lead = c.pile.mid ? Math.floor((c.n - c.pass) / 2) : 0;
    const scale = c.pile.scale || 1;
    const px = c.pile.mid ? c.node.x - ((c.n - 1) * c.pile.dx) / 2 : c.pile.x + (IW / 2) * scale;
    const rows = Array.from({ length: rowCount }, () => markup(gTop));
    /** @type {Slot[]} */
    const slots = [];
    /** @type {Slot[]} */
    const passed = [];
    /** @type {SVGElement[]} */
    const out = [];
    for (let i = 0; i < c.n; i++) {
      const r = Math.floor(i / c.pile.per);
      const x = px + (i % c.pile.per) * c.pile.dx;
      const y = c.pile.y + (IH / 2 + r * ROW) * scale;
      const passes = i >= lead && i < lead + c.pass;
      const slot = { e: markup(rows[r], counted(x, y, passes ? { kept: last } : { pale: true }, scale)), x, y, row: r };
      slots.push(slot);
      if (passes) passed.push(slot);
      if (passes && !last) continue;
      const arrived = markup(slot.e, counted(x, y, null, scale));
      arrived.setAttribute('opacity', '0');
      out.push(arrived);
    }
    // how many pass; after the last filter, the number the picture ends on
    let count;
    if (last) {
      const bw = Math.ceil(widthOf(String(EXAMPLE.kept), () => face('600 34px')) * 0.97) + 14;
      const by = c.count.y;
      const bx = c.count.mid ? c.count.x - (bw + 10 + widthOf('kept', () => face('600 20px'))) / 2 : c.count.x;
      count = markup(
        gTop,
        `<rect class="mark" x="${f(bx)}" y="${f(by - 31)}" width="${bw}" height="38"/>${text('sc-big', { x: bx + 7, y: by }, 0, EXAMPLE.kept)}${text('sc-kept', { x: bx + bw + 10, y: by }, 0, 'kept')}`,
      );
    } else count = markup(gTop, text('sc-n', c.count, 0, fmt(F.pass)));
    return { rows, slots, passed, out, cost, name, set, icon: iconG, read, node, count, slow: F.model };
  });
  return { segs, cols, groups, level: !P.dot, dot, intro };
}

/* ---------- the reveal: left to right, the order a reader takes it in ----------
   A filter's turn begins EVERY after the one before it. SETTLED into its turn its papers stand
   under its node; then it gives its verdict (the removed papers go pale) and its count shows.
   Side by side, the papers that passed travel on to the next filter and are its papers: every
   slot of a filter starts where the paper it holds stood at the filter before, which keeps its
   own copy in ink. Under one another, a filter's papers arrive where they stand. */
const T0 = 350;
const EVERY = 520;
const SETTLED = 480;
const TRAVEL = 300;

/**
 * Lets an SVG element grow from its own middle.
 *
 * @param {import('../../kit/motion.js').Reveal} rv
 * @param {SVGElement} e
 * @param {number} delay
 * @param {number} duration
 */
function pop(rv, e, delay, duration) {
  e.style.transformBox = 'fill-box';
  e.style.transformOrigin = 'center';
  rv.from(
    e,
    [
      { opacity: 0, transform: 'scale(.6)' },
      { opacity: 1, transform: 'scale(1)' },
    ],
    delay,
    duration,
  );
}

/**
 * Lays the reveal over the drawn parts: the line runs to each filter in turn, and the filter
 * shows itself as the line arrives.
 *
 * @param {import('../../kit/motion.js').Reveal} rv
 * @param {Drawn} d
 */
function play(rv, d) {
  rv.cancel();
  if (d.dot) rv.fade(d.dot, 0, 250);
  rv.fade(d.intro, 100, 350);
  d.groups.forEach((G, i) => {
    const t = T0 + G.k * EVERY;
    const next = d.groups[i + 1] ? d.groups[i + 1].k : d.cols.length;
    rv.arrive(G.says, t - 120);
    rv.stroke(G.rule, t, (next - G.k) * EVERY);
  });
  d.cols.forEach((o, k) => {
    const t = T0 + k * EVERY;
    rv.stroke(d.segs[k], k ? t - EVERY * 0.7 : 80, k ? EVERY : T0);
    rv.arrive(o.icon, t);
    rv.arrive(o.name, t + 60);
    rv.arrive(o.set, t + 120);
    // a rule's check lands at once; what an LLM reads is taken in from left to right
    if (o.slow) rv.from(o.read, [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }], t + 260, 700);
    else rv.fade(o.read, t + 280, 300);
    o.cost.forEach((p, i) => rv.arrive(p, t + (o.slow ? 620 : 420) + i * 70, 320));
    pop(rv, o.node, t + 100, 260);
    const from = d.level && k ? d.cols[k - 1].passed : null;
    const each = Math.min(28, (SETTLED - 360) / Math.max(1, o.rows.length - 1));
    if (from)
      o.slots.forEach((s, j) => {
        const there = `translate(${f(from[j].x - s.x)}px,${f(from[j].y - s.y)}px)`;
        // hidden until it leaves, a row a moment after the row above it
        rv.from(
          s.e,
          [
            { opacity: 0, transform: there },
            { opacity: 1, transform: there, offset: 0.01 },
            { opacity: 1, transform: 'translate(0,0)' },
          ],
          t + SETTLED - TRAVEL + s.row * 12,
          TRAVEL,
        );
      });
    else o.rows.forEach((r, i) => rv.arrive(r, t + 60 + i * each, 300));
    o.out.forEach((e, i) => rv.from(e, [{ opacity: 1 }, { opacity: 0 }], t + SETTLED + 20 + (i * 60) / o.out.length, 220));
    if (k < d.cols.length - 1) rv.fade(o.count, t + SETTLED + 120, 320);
    else rv.arrive(o.count, t + 1000, 480);
  });
  rv.fit();
}

/* ---------- the section ---------- */

/**
 * Draws the picture the frame's width asks for and reveals it when it arrives.
 *
 * @param {HTMLElement} root
 */
export function mount(root) {
  const frame = /** @type {HTMLElement} */ (root.querySelector('.sc-pic'));
  const pic = /** @type {SVGSVGElement} */ (frame.querySelector('svg'));
  const rv = reveal();
  let stack = !fitsWide(frame, WIDE, 'sc-stack');
  /** @type {Drawn} */
  let d;
  let arrived = false;
  function render() {
    rv.cancel();
    d = draw(pic, plan(stack));
    if (arrived) play(rv, d);
  }
  render();
  const stopArrive = onArrive(pic, () => {
    arrived = true;
    play(rv, d);
  });
  const stopFonts = onLateFonts(render);
  const stopWidth = onWidthChange(frame, () => {
    if (!fitsWide(frame, WIDE, 'sc-stack') === stack) return;
    stack = !stack;
    render();
  });
  return {
    destroy() {
      stopArrive();
      stopFonts();
      stopWidth();
      rv.cancel();
    },
  };
}
