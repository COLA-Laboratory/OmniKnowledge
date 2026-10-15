/**
 * The first picture's tall composition, read from top to bottom in one column 324 wide, for a
 * column too narrow to read the wide one in.
 *
 * The line runs down beside the question, steps across to the rail and falls through both cards
 * into the first topic. The topics stand in a zigzag, each name over its own ground (the first's
 * at its shoulder, beside the arrowhead), so that the last two are open below. The tasks stand
 * under them in two rows of two, each hanging from a paper straight above its dot; the second
 * row is set left of the first so that its lines pass it.
 */
import { EXAMPLE, between, enclosingCircle, f, markup, paper, svg, tile, token, topics } from '../../kit/index.js';
import { FILTERS, INSET, PAD, ROW, card, cited, clear, dots, hypothesis, plan, reading, review } from './parts.js';

/** The composition's width. */
export const WIDTH = 324;
const S = 0.32; // the map's scale
const LX = 13.5; // the line beside the question
const COL = 34; // the left edge of the question's text
const X0 = 8; // the left edge of the cards
const X1 = 316; // their right edge
const RAIL = 110.5; // the line through the cards and the beads; the middle of the first topic
const CH = 80; // a card's height
const GAP = 48; // card to card along the line, a bead in the middle
const AT = [110.5, 226, 90.5, 217.5]; // the middle of each topic's ground, across
const DROP = 104; // from one row of tasks to the next
/** The tasks, row by row, and the paper each hangs from: [topic, paper]. */
const TASKS = [
  { name: ['Literature', 'review'], p: [2, 9], row: 0, draw: review },
  { name: ['Hypothesis', 'generation'], p: [3, 16], row: 0, draw: hypothesis },
  { name: ['Experiment', 'planning'], p: [2, 26], row: 1, draw: plan },
  { name: ['Results', 'interpretation'], p: [3, 28], row: 1, draw: reading },
];

/**
 * Returns the nearest place on which a 1.5 px upright line is sharp.
 *
 * @param {number} x
 */
const quarter = (x) => Math.round(x * 2 - 0.5) / 2 + 0.25;

/**
 * Places the tall composition from the top down.
 *
 * A ground's height follows from the one above it on its side and the room its name needs
 * between the two. A task's line stands on its paper, moved by at most a quarter pixel to be
 * sharp, and its drawing follows the line.
 */
export function place() {
  const G = topics.map((T) => enclosingCircle(T.nodes));
  const sc = { x: X0, y: 188, w: X1 - X0, h: CH };
  const fc = { x: X0, y: sc.y + CH + GAP, w: sc.w, h: CH + 22 }; // four rows of filters, where the searches take three
  const found = sc.y + CH + GAP / 2;
  const kept = fc.y + fc.h + GAP / 2;
  const top = kept + 48; // the first ground's top, under the arrowhead
  const at = AT.map((cx, t) => ({ cx, cy: 0, r: G[t].r * S + PAD, x: 0, y: 0, base: 0 }));
  at[0].cy = top + at[0].r;
  at[2].cy = at[0].cy + at[0].r + 38 + at[2].r; // a name of two lines between them
  at[1].cy = at[0].cy + 94; // where it meets the first and the third alike
  at[3].cy = at[1].cy + at[1].r + 28.5 + at[3].r; // a name of one line between them
  /** @type {{ t: number, i: number, x: number, y: number, r: number, seed?: string }[]} */
  const papers = [];
  /** @type {[(typeof papers)[number], (typeof papers)[number]][]} */
  const links = [];
  topics.forEach((T, t) => {
    const A = at[t];
    A.x = A.cx - G[t].x * S;
    A.y = A.cy - G[t].y * S;
    A.base = papers.length;
    for (const m of T.nodes)
      papers.push({ t, i: m.i, x: A.x + m.x * S, y: A.y + m.y * S, r: Math.max(1.8, m.r * S * 1.2), seed: m.seed });
    for (const l of T.links) links.push([papers[A.base + l[0]], papers[A.base + l[1]]]);
  });
  for (const c of between(at, S)) links.push([papers[at[c[0]].base + c[1]], papers[at[c[2]].base + c[3]]]);
  // a task: m: its paper; lane: its line; dot: where the line ends; x, cy: its drawing's left edge and middle row
  const foot = at[3].cy + at[3].r + 22;
  const tasks = TASKS.map((T) => {
    const m = papers[at[T.p[0]].base + T.p[1]];
    const lane = quarter(m.x);
    const dot = foot + T.row * DROP;
    return { name: T.name, draw: T.draw, m, lane, dot, x: lane - 3, cy: dot + 15 + ROW + 2.5 };
  });
  const h = Math.ceil(tasks[3].cy + 66.5 + 7); // the last name's second line, and room under it
  return { ask: [40, 66, 92], seeds: 122, shelf: 152.5, sc, fc, found, kept, top, tip: top - 12, at, papers, links, tasks, h };
}

/**
 * Draws a topic's name on one line or two at x, its last baseline at y, the number of its papers after it.
 *
 * @param {SVGElement} parent
 * @param {number} x
 * @param {number} y
 * @param {string[]} lines
 * @param {number} n
 */
function topicName(parent, x, y, lines, n) {
  const tt = svg('text', { class: 'topic', x: f(x), y: f(y - (lines.length - 1) * 17) }, parent);
  lines.forEach((l, i) => svg('tspan', i ? { x: f(x), dy: 17 } : {}, tt, l));
  svg('tspan', { class: 'c', dx: 7 }, tt, String(n));
  return tt;
}

/**
 * Draws a paper on the rail with what is counted there beside it; the line stops short of the
 * paper above and below.
 *
 * @param {number} y
 * @param {boolean} kept
 * @param {string} count
 * @param {string} word
 * @param {SVGElement} parent
 */
function bead(y, kept, count, word, parent) {
  const x = RAIL;
  const tx = x + 22;
  const at = markup(
    parent,
    `<rect x="${x - 5}" y="${y - 13.5}" width="10" height="27" fill="${token('paper')}"/>${paper(x, y, 15, 20, { kept })}`,
  );
  const n = svg('g', {}, parent);
  if (kept) svg('rect', { x: f(tx - 4.65), y: y - 15, width: 32, height: 16, class: 'mark' }, n);
  svg('text', { x: tx, y: y - 2.5, class: 'cnt' }, n, count);
  svg('text', { x: tx, y: y + 12.5, class: 'note' }, n, word);
  return [at, n];
}

/**
 * Draws the tall composition into the picture and returns its parts for the reveal.
 *
 * @param {SVGSVGElement} pic
 * @param {ReturnType<typeof place>} L
 */
export function draw(pic, L) {
  const X = RAIL;
  const SC = L.sc;
  const FC = L.fc;
  clear(pic);
  const [gGround, gEdge, gLine, gNode, gTop] = [0, 1, 2, 3, 4].map(() => svg('g', {}, pic));
  const grounds = L.at.map((A) => svg('circle', { cx: A.cx, cy: f(A.cy), r: f(A.r), class: 'ground' }, gGround));

  // the line, under the cards: down beside the question, across to the rail, then straight through
  const lineA = svg(
    'path',
    {
      d: `M${LX},12.5 V${L.shelf - 16} A16,16 0 0 0 ${LX + 16},${L.shelf} H${X - 16} A16,16 0 0 1 ${X},${L.shelf + 16} V${SC.y + 0.5}`,
      class: 'lead cut',
      pathLength: 1,
    },
    gLine,
  );
  const lineB = svg('path', { d: `M${X},${SC.y + SC.h - 0.5} V${FC.y + 0.5}`, class: 'lead cut', pathLength: 1 }, gLine);
  const lineC = svg('path', { d: `M${X},${FC.y + FC.h - 0.5} V${L.tip}`, class: 'lead cut', pathLength: 1 }, gLine);
  const head = svg('path', { d: `M${X - 5},${L.tip - 5} L${X},${L.tip} L${X + 5},${L.tip - 5}`, class: 'lead' }, gLine);
  const inDot = svg('circle', { cx: LX, cy: 12.5, r: 5.5, class: 'port' }, gLine);

  // 1. the question, and the three seed papers with it
  const gAsk = svg('g', {}, gTop);
  svg('text', { x: COL - 0.9, y: 17, class: 'note' }, gAsk, 'Your research question');
  ['How does microplastic', 'exposure affect', 'freshwater fish?'].forEach((l, i) =>
    svg('text', { x: COL - 1.4, y: L.ask[i], class: 'ask hr-ask' }, gAsk, l),
  );
  const seeds = [0, 1, 2].map((i) => markup(gTop, paper(COL + 8.75 + i * 21, L.seeds, 16, 21, { seed: true })));
  const seedNote = svg('text', { x: COL + 66, y: L.seeds + 4.5, class: 'note' }, gTop, '3 seed papers');

  // 2. the searches: one card, three names side by side, the rail under the first rule
  const sLab = svg('text', { x: SC.x - 0.6, y: SC.y - 11.5, class: 'lab' }, gTop, 'Search');
  const sCard = svg('g', {}, gTop);
  card(SC, sCard);
  const edge = [SC.x, X, SC.x + SC.w - (X - SC.x)];
  const sRows = EXAMPLE.searches.map((s, i) => {
    const tx = edge[i] + INSET;
    const ty = SC.y + INSET;
    if (i) svg('line', { x1: edge[i], x2: edge[i], y1: SC.y + INSET, y2: SC.y + SC.h - INSET, class: 'rule' }, sCard);
    const g = markup(gTop, tile(tx, ty, 22, s.key));
    s.name.split(' ').forEach((l, k) => svg('text', { x: tx - 0.4, y: SC.y + 52 + k * 15.5, class: 'row' }, g, l));
    return g;
  });
  const [found, foundN] = bead(L.found, false, '14,950', 'found', gTop);

  // 3. the filters: one card, the seven names in two runs, four and three
  const fLab = svg('text', { x: FC.x - 0.9, y: FC.y - 11.5, class: 'lab' }, gTop, 'Filter');
  const fCard = svg('g', {}, gTop);
  card(FC, fCard);
  const DX = [FC.x + INSET + 8, FC.x + FC.w / 2 + INSET + 8];
  /** @param {number} i */
  const FY = (i) => FC.y + 18 + (i % 4) * 22;
  const chains = DX.map((x, c) => svg('path', { d: `M${x},${FY(0)} V${FY(c ? 2 : 3)}`, class: 'chain', pathLength: 1 }, gTop));
  const fRows = FILTERS.map((name, i) => {
    const g = svg('g', {}, gTop);
    const x = DX[i < 4 ? 0 : 1];
    svg('circle', { cx: x, cy: FY(i), r: 8, class: 'port' }, g);
    svg('text', { x, y: FY(i) + 4.3, 'text-anchor': 'middle', class: 'no' }, g, String(i + 1));
    svg('text', { x: x + 18.5, y: FY(i) + 4.5, class: 'row' }, g, name);
    return g;
  });
  const [kept, keptN] = bead(L.kept, true, '212', 'kept', gTop);

  // 4. the map of the 212, each topic's name over its own ground
  const gMap = svg('g', {}, gNode);
  for (const [a, b] of L.links) svg('line', { x1: f(a.x), y1: f(a.y), x2: f(b.x), y2: f(b.y), class: 'edge' }, gEdge);
  dots(L.papers, gMap);
  const A = L.at;
  const N = topics.map((T) => T.name.split(' '));
  const labels = [
    topicName(gTop, X0 - 0.9, A[0].cy - A[0].r - 6, [N[0].slice(0, 2).join(' '), N[0][2]], topics[0].n),
    topicName(gTop, A[1].cx, A[1].cy - A[1].r - 6, N[1], topics[1].n),
    topicName(gTop, X0 - 0.9, A[2].cy - A[2].r - 6, [N[2].slice(0, 2).join(' '), N[2][2]], topics[2].n),
    topicName(gTop, A[2].cx + A[2].r + 12, A[3].cy - A[3].r - 6, [topics[3].name], topics[3].n),
  ];

  // 5. the work it feeds: each task under its paper
  const [gHalo, gWire, gMark] = [0, 1, 2].map(() => svg('g', {}, gTop));
  const tasks = L.tasks.map((T) => {
    const mark = cited(T.m);
    const body = svg('g', {}, gTop);
    T.draw(body, T);
    const name = svg('g', {}, gTop);
    T.name.forEach((l, i) => svg('text', { x: f(T.x - 1.1), y: f(T.cy + 44.5 + i * 22), class: 'task' }, name, l));
    return {
      len: T.dot - T.m.y,
      body,
      name,
      wire: svg('path', { d: `M${T.lane},${f(T.m.y + mark.r)} V${T.dot}`, class: 'wire', pathLength: 1 }, gWire),
      src: markup(gMark, mark.ring),
      halo: markup(gHalo, mark.halo),
      dst: svg('circle', { cx: T.lane, cy: T.dot, r: 3, class: 'port' }, gMark),
    };
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
    chains,
    found,
    foundN,
    kept,
    keptN,
    tasks,
  };
}

/**
 * Lays the reveal over the tall composition, in two parts: down to the arrowhead at once (upper);
 * the map and the tasks (lower), to be started when the map has come into the window and the
 * line has reached it.
 *
 * @param {import('../../kit/motion.js').Reveal} upper
 * @param {import('../../kit/motion.js').Reveal} lower
 * @param {ReturnType<typeof draw>} d
 * @returns {number} When, in ms after the upper part starts, the line reaches the map.
 */
export function play(upper, lower, d) {
  // the question
  upper.arrive(d.gAsk, 0, 450);
  upper.fade(d.inDot, 150, 250);
  d.seeds.forEach((s, i) => upper.arrive(s, 300 + i * 80));
  upper.fade(d.seedNote, 540, 320);
  upper.stroke(d.lineA, 450, 760);
  // the searches
  upper.arrive(d.sLab, 1100);
  upper.arrive(d.sCard, 1100);
  d.sRows.forEach((g, i) => upper.arrive(g, 1200 + i * 110));
  upper.stroke(d.lineB, 1650, 320);
  upper.arrive(d.found, 1780);
  upper.fade(d.foundN, 1860, 320);
  // the filters
  upper.arrive(d.fLab, 1980);
  upper.arrive(d.fCard, 1980);
  d.chains.forEach((c, k) => upper.stroke(c, 2080 + k * 240, 300));
  d.fRows.forEach((g, i) => upper.arrive(g, 2080 + i * 80, 360));
  upper.stroke(d.lineC, 2680, 420);
  upper.arrive(d.kept, 2780);
  upper.fade(d.keptN, 2860, 320);
  upper.fade(d.head, 3080, 200);
  const reached = 3200 * upper.fit();
  // the map
  lower.fade(d.gEdge, 0, 480);
  lower.fade(d.gMap, 0, 480);
  d.grounds.forEach((g, i) => lower.fade(g, 300 + i * 130, 400));
  d.labels.forEach((l, i) => lower.fade(l, 300 + i * 130, 400));
  // the tasks, row by row, each line from its paper down to its dot
  d.tasks.forEach((o, i) => {
    const t = 1000 + i * 400;
    const run = 300 + o.len * 1.4;
    lower.fade(o.halo, t, 260);
    lower.fade(o.src, t, 260);
    lower.stroke(o.wire, t + 100, run);
    lower.fade(o.dst, t + run - 20, 220);
    lower.arrive(o.body, t + run + 20);
    lower.arrive(o.name, t + run + 100);
  });
  lower.fit();
  return reached;
}
