/**
 * The first picture's wide composition, read from left to right in a 1280 by 400 box: the 3 px
 * line joins the question, a card of the three searches, a card of the seven filters as a
 * numbered pipeline, the map of the 212 kept papers with its four topics packed into one body,
 * and the four tasks, each tied by an evidence line to a paper on the side of the map that faces it.
 */
import { EXAMPLE, between, enclosingCircle, f, markup, paper, svg, tile, token, topics } from '../../kit/index.js';
import { FILTERS, INSET, PAD, ROW, card, cited, clear, dots, hypothesis, plan, reading, review } from './parts.js';

/** The composition's width. */
export const WIDTH = 1280;
/** Its height. */
export const HEIGHT = 400;
const TOP = 3; // the drawing is 394 tall and stands in the middle of the 400
const S = 0.5; // the map's scale
const LX = 7.5; // the line's run down the left edge
const AX = 272.5; // the height at which the line crosses the picture
const COL = 44; // the left edge the question, the seeds and the Search card share
const GAP = 66; // along the line: card to card, and card to arrowhead; a bead stands in the middle of each
const SC = { x: COL, y: 193.5, w: 151, h: 158 }; // the card of searches
const FC = { x: SC.x + SC.w + GAP, y: 193.5, w: 139, h: 158 }; // the card of filters
const TIP = FC.x + FC.w + GAP + 5; // where the line's arrowhead ends, at the map
const CAP = 10.5; // the height of a capital in a topic's name
const XA = 1022; // a task: the dot its line ends in
const X0 = 1038; // the left edge of its drawing
const XN = 1146; // the left edge of its name
/** The papers the tasks rest on, all on the side of the map that faces them: [topic, paper]. */
const CITED = { review: [2, 39], claimA: [2, 53], claimB: [2, 51], plan: [3, 7], result: [3, 19] };

/**
 * @typedef {{ t: number, i: number, x: number, y: number, r: number, seed?: string }} Placed
 * @typedef {{ cx: number, cy: number, r: number, x: number, y: number, base: number }} Spot
 */

/**
 * Places the four topics and the four tasks.
 *
 * Oxidative and Growth stand at one height. The tasks stand at equal steps, at the heights that
 * let three of the five evidence lines run level: the first row of Literature review at its
 * paper, the third row of Hypothesis generation at its second paper, and Trophic lowered until
 * its paper meets the first row of Results interpretation. Rows stand on quarter pixels so that
 * a level 1.5 px line is sharp.
 */
export function place() {
  const G = topics.map((T) => enclosingCircle(T.nodes));
  /** @param {number} t @param {number} i */
  const below = (t, i) => (topics[t].nodes[i].y - G[t].y) * S;
  /** @type {Spot[]} */
  const AT = [{ cx: 583.5, cy: 291.5 }, { cx: 663, cy: 115 }, { cx: 850.5 }, { cx: 752 }].map((A, t) => ({
    cy: 0,
    ...A,
    r: G[t].r * S + PAD,
    x: 0,
    y: 0,
    base: 0,
  }));
  AT[2].cy = AT[1].cy - AT[1].r + AT[2].r;
  const first = Math.round(AT[2].cy + below(2, CITED.review[1]) - 0.75) + 0.75;
  const step = Math.round(AT[2].cy + below(2, CITED.claimB[1]) - 2 * ROW - first);
  AT[3].cy = first + 3 * step - below(3, CITED.result[1]);
  /** @type {Placed[]} */
  const papers = [];
  /** @type {[Placed, Placed][]} */
  const links = [];
  topics.forEach((T, t) => {
    const A = AT[t];
    A.x = A.cx - G[t].x * S;
    A.y = A.cy - G[t].y * S;
    A.base = papers.length;
    for (const m of T.nodes)
      papers.push({ t, i: m.i, x: A.x + m.x * S, y: A.y + m.y * S, r: Math.max(2.1, m.r * S * 1.2), seed: m.seed });
    for (const l of T.links) links.push([papers[A.base + l[0]], papers[A.base + l[1]]]);
  });
  for (const c of between(AT, S)) links.push([papers[AT[c[0]].base + c[1]], papers[AT[c[2]].base + c[3]]]);
  /** @param {number[]} c */
  const paperOf = (c) => papers[AT[c[0]].base + c[1]];
  // a task: x, cy: its drawing's left edge and middle row; from: the papers it rests on and the row each line arrives at
  const tasks = [
    { name: ['Literature', 'review'], from: [{ p: CITED.review, row: 0 }], draw: review },
    {
      name: ['Hypothesis', 'generation'],
      from: [
        { p: CITED.claimA, row: 0 },
        { p: CITED.claimB, row: 2 },
      ],
      draw: hypothesis,
    },
    { name: ['Experiment', 'planning'], from: [{ p: CITED.plan, row: 0 }], draw: plan },
    { name: ['Results', 'interpretation'], from: [{ p: CITED.result, row: 0 }], draw: reading },
  ].map((T, k) => ({ ...T, from: T.from.map((c) => ({ m: paperOf(c.p), row: c.row })), x: X0, cy: first + ROW + k * step }));
  return { AT, papers, links, tasks };
}

/**
 * Draws a paper on the line with what is counted there above it; the line stops short of the
 * paper on both sides.
 *
 * @param {number} x
 * @param {boolean} kept
 * @param {string} count
 * @param {string} word
 * @param {SVGElement} parent
 */
function bead(x, kept, count, word, parent) {
  const at = markup(
    parent,
    `<rect x="${x - 11}" y="${AX - 5}" width="22" height="10" fill="${token('paper')}"/>${paper(x, AX, 15, 20, { kept })}`,
  );
  const n = svg('g', {}, parent);
  if (kept) svg('rect', { x: x - 16, y: AX - 47, width: 32, height: 16, class: 'mark' }, n);
  svg('text', { x, y: AX - 34.5, 'text-anchor': 'middle', class: 'cnt' }, n, count);
  svg('text', { x, y: AX - 19.5, 'text-anchor': 'middle', class: 'note' }, n, word);
  return [at, n];
}

/**
 * Draws the wide composition into the picture and returns its parts for the reveal.
 *
 * @param {SVGSVGElement} pic
 * @param {ReturnType<typeof place>} L
 */
export function draw(pic, L) {
  clear(pic);
  const all = svg('g', { transform: `translate(0 ${TOP})` }, pic);
  const [gGround, gEdge, gLine, gNode, gTop] = [0, 1, 2, 3, 4].map(() => svg('g', {}, all));
  const grounds = L.AT.map((A) => svg('circle', { cx: A.cx, cy: f(A.cy), r: f(A.r), class: 'ground' }, gGround));

  // the line, under the cards: it passes behind each and comes out at the same height
  const lineA = svg(
    'path',
    { d: `M${LX},12.5 V${AX - 16} A16,16 0 0 0 ${LX + 16},${AX} H${SC.x + 0.5}`, class: 'lead cut', pathLength: 1 },
    gLine,
  );
  const lineB = svg('path', { d: `M${SC.x + SC.w - 0.5},${AX} H${FC.x + 0.5}`, class: 'lead cut', pathLength: 1 }, gLine);
  const lineC = svg('path', { d: `M${FC.x + FC.w - 0.5},${AX} H${TIP}`, class: 'lead cut', pathLength: 1 }, gLine);
  const head = svg('path', { d: `M${TIP - 5},${AX - 5} L${TIP},${AX} L${TIP - 5},${AX + 5}`, class: 'lead' }, gLine);
  const inDot = svg('circle', { cx: LX, cy: 12.5, r: 5.5, class: 'port' }, gLine);

  // 1. the question, and the three seed papers with it
  const gAsk = svg('g', {}, gTop);
  svg('text', { x: COL - 0.9, y: 17, class: 'note' }, gAsk, 'Your research question');
  ['How does microplastic exposure', 'affect freshwater fish?'].forEach((l, i) =>
    svg('text', { x: COL - 1.7 + i * 0.9, y: 52 + i * 36, class: 'ask' }, gAsk, l),
  );
  const seeds = [0, 1, 2].map((i) => markup(gTop, paper(COL + 8.75 + i * 21, 128.5, 16, 21, { seed: true })));
  const seedNote = svg('text', { x: COL + 66, y: 133, class: 'note' }, gTop, '3 seed papers');

  // 2. the searches: one card, three names
  const sLab = svg('text', { x: SC.x - 0.6, y: SC.y - 11.5, class: 'lab' }, gTop, 'Search');
  const sCard = svg('g', {}, gTop);
  card(SC, sCard);
  const sRows = EXAMPLE.searches.map((s, i) => {
    const cy = AX + (i - 1) * 44;
    const tx = SC.x + INSET;
    if (i) svg('line', { x1: SC.x + INSET, x2: SC.x + SC.w - INSET, y1: cy - 22, y2: cy - 22, class: 'rule' }, sCard);
    const g = markup(gTop, tile(tx, cy - 11, 22, s.key));
    svg('text', { x: tx + 32, y: cy + 4.5, class: 'row' }, g, s.name);
    return g;
  });

  // what the searches found, on the line between the two cards
  const [found, foundN] = bead(SC.x + SC.w + GAP / 2, false, '14,950', 'found', gTop);

  // 3. the filters: one card, seven names in a row one after another
  const fLab = svg('text', { x: FC.x - 0.9, y: FC.y - 11.5, class: 'lab' }, gTop, 'Filter');
  const fCard = svg('g', {}, gTop);
  card(FC, fCard);
  const DX = FC.x + INSET + 8;
  /** @param {number} i */
  const FY = (i) => AX + (i - 3) * 20.5;
  const chain = svg('path', { d: `M${DX},${FY(0)} V${FY(6)}`, class: 'chain', pathLength: 1 }, gTop);
  const fRows = FILTERS.map((name, i) => {
    const g = svg('g', {}, gTop);
    svg('circle', { cx: DX, cy: FY(i), r: 8, class: 'port' }, g);
    svg('text', { x: DX, y: FY(i) + 4.3, 'text-anchor': 'middle', class: 'no' }, g, String(i + 1));
    svg('text', { x: DX + 18.5, y: FY(i) + 4.5, class: 'row' }, g, name);
    return g;
  });

  // what the filters kept, on the line into the map
  const [kept, keptN] = bead(FC.x + FC.w + GAP / 2, true, '212', 'kept', gTop);

  // 4. the map of the 212
  const gMap = svg('g', {}, gNode);
  for (const [a, b] of L.links) svg('line', { x1: f(a.x), y1: f(a.y), x2: f(b.x), y2: f(b.y), class: 'edge' }, gEdge);
  dots(L.papers, gMap);
  // a topic's name: on one line above or below its ground, 14 in from the ground's left edge
  // and 6 clear of it; Feeding and ingestion, with Oxidative stress over it, on two lines at its shoulder
  const labels = topics.map((T, t) => {
    const A = L.AT[t];
    const parts = T.name.split(' ');
    let tt;
    if (t === 0) {
      tt = svg('text', { class: 'topic', x: f(A.cx - A.r), y: f(A.cy - A.r - 6 - 17) }, gTop);
      svg('tspan', {}, tt, parts.slice(0, 2).join(' '));
      svg('tspan', { x: f(A.cx - A.r), dy: 17 }, tt, parts.slice(2).join(' '));
    } else {
      tt = svg('text', { class: 'topic', x: f(A.cx - A.r + 14), y: f(t === 3 ? A.cy + A.r + 6 + CAP : A.cy - A.r - 6) }, gTop);
      svg('tspan', {}, tt, T.name);
    }
    svg('tspan', { class: 'c', dx: 7 }, tt, String(T.n));
    return tt;
  });

  // 5. the work it feeds
  const [gHalo, gWire, gMark] = [0, 1, 2].map(() => svg('g', {}, gTop));
  const tasks = L.tasks.map((T) => {
    const body = svg('g', {}, gTop);
    T.draw(body, T);
    const name = svg('g', {}, gTop);
    T.name.forEach((l, i) => svg('text', { x: XN, y: f(T.cy - 4.2 + i * 23), class: 'task' }, name, l));
    const lines = T.from.map((c) => {
      // one curve, level where it leaves and where it arrives, each handle half the run;
      // a line whose paper stands at its row is level from end to end
      const mark = cited(c.m);
      const y = T.cy + (c.row - 1) * ROW;
      const y0 = Math.abs(c.m.y - y) < 1 ? y : c.m.y;
      const x0 = c.m.x + mark.r;
      const half = (XA - x0) / 2;
      return {
        wire: svg(
          'path',
          { d: `M${f(x0)},${y0} C${f(x0 + half)},${y0} ${f(XA - half)},${y} ${XA},${y}`, class: 'wire', pathLength: 1 },
          gWire,
        ),
        src: markup(gMark, mark.ring),
        halo: markup(gHalo, mark.halo),
        dst: svg('circle', { cx: XA, cy: y, r: 3, class: 'port' }, gMark),
      };
    });
    return { body, name, lines };
  });
  return {
    grounds,
    labels,
    sRows,
    fRows,
    gEdge,
    gMap,
    lineA,
    lineB,
    lineC,
    head,
    inDot,
    gAsk,
    seeds,
    seedNote,
    sLab,
    sCard,
    fLab,
    fCard,
    chain,
    found,
    foundN,
    kept,
    keptN,
    tasks,
  };
}

/**
 * Lays the reveal over the wide composition, in the order a reader takes it in.
 *
 * @param {import('../../kit/motion.js').Reveal} rv
 * @param {ReturnType<typeof draw>} d
 */
export function play(rv, d) {
  // the question
  rv.arrive(d.gAsk, 0, 450);
  rv.fade(d.inDot, 150, 250);
  d.seeds.forEach((s, i) => rv.arrive(s, 300 + i * 80));
  rv.fade(d.seedNote, 540, 320);
  rv.stroke(d.lineA, 450, 650);
  // the searches
  rv.arrive(d.sLab, 1000);
  rv.arrive(d.sCard, 1000);
  d.sRows.forEach((g, i) => rv.arrive(g, 1100 + i * 110));
  rv.stroke(d.lineB, 1550, 360);
  rv.arrive(d.found, 1700);
  rv.fade(d.foundN, 1780, 320);
  // the filters
  rv.arrive(d.fLab, 1900);
  rv.arrive(d.fCard, 1900);
  rv.stroke(d.chain, 2000, 620);
  d.fRows.forEach((g, i) => rv.arrive(g, 2000 + i * 80, 360));
  rv.stroke(d.lineC, 2600, 360);
  rv.arrive(d.kept, 2740);
  rv.fade(d.keptN, 2820, 320);
  rv.fade(d.head, 2900, 200);
  // the map
  rv.fade(d.gEdge, 3050, 480);
  rv.fade(d.gMap, 3050, 480);
  d.grounds.forEach((g, i) => rv.fade(g, 3350 + i * 130, 400));
  d.labels.forEach((l, i) => rv.fade(l, 3350 + i * 130, 400));
  // the tasks, one after another, each line from its paper to its dot
  d.tasks.forEach((o, i) => {
    const t = 4050 + i * 400;
    o.lines.forEach((w, k) => {
      rv.fade(w.halo, t + k * 110, 260);
      rv.fade(w.src, t + k * 110, 260);
      rv.stroke(w.wire, t + 100 + k * 110, 460);
      rv.fade(w.dst, t + 440 + k * 110, 220);
    });
    rv.arrive(o.body, t + 360);
    rv.arrive(o.name, t + 440);
  });
  rv.fit();
}
