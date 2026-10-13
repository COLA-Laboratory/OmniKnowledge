/* The hero: the 3 px line joins five things. The question; one small card that lists the three
   searches; one small card that lists the seven filters as a numbered pipeline; the map of the 212
   kept papers, its four topics packed into one body; the four tasks, each tied by an evidence
   line to a paper on the side of the map that faces it.
   It has two compositions: the wide one, read from left to right, and the tall one, read from
   top to bottom, for a column too narrow to read the wide one in (TALL.when). The window picks.
   The finished picture is the DOM; the reveal is a set of animations laid over it, so reduced
   motion shows the DOM. README.md owns the kinds of line and the motion. */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg', OK = window.OK, MAP = OK.map, INK = '#0b0b0c', BAR = '#c9c9c2';
  var pic = document.getElementById('hero-pic');
  var reduce = (new URLSearchParams(location.search).has('still') ? {matches:true} : window.matchMedia('(prefers-reduced-motion: reduce)')).matches;
  var TOP = 3;                                      // the drawing is 394 tall and stands in the middle of the 400
  var S = 0.5, PAD = 8;                             // the map's scale here; the room between a ground's edge and its outermost paper
  var LX = 7.5, AX = 272.5;                         // the line: its run down the left edge, and the height at which it crosses the picture
  var COL = 44;                                     // the left edge the question, the seeds and the Search card share
  var GAP = 66;                                     // along the line: card to card, and card to arrowhead; a bead stands in the middle of each
  var SC = { x: COL, y: 193.5, w: 151, h: 158 };    // the card of searches
  var FC = { x: SC.x + SC.w + GAP, y: 193.5, w: 139, h: 158 };   // the card of filters
  var TIP = FC.x + FC.w + GAP + 5;                  // where the line's arrowhead ends, at the map
  var CAP = 10.5;                                   // the height of a capital in a topic's name
  // the middle of each topic's round ground; Growth's height follows from Oxidative's and
  // Trophic's from the tasks (see place)
  var AT = [{ cx: 583.5, cy: 291.5 }, { cx: 663, cy: 115 }, { cx: 850.5 }, { cx: 752 }];
  var XA = 1022, X0 = 1038, DW = 88, XN = 1146;     // a task: the dot its line ends in, its drawing (left edge, width), its name
  var ROW = 15;                                     // a task drawing has three rows, this far apart
  var TITLE = 'From a research question and three seed papers, three searches (citation tracing, semantic search, database search) find 14,950 papers; seven filters in a row (year, citations, venue, keywords, title criteria, abstract criteria, full-text criteria) keep 212. The 212 stand as one citation network in four topics, and four tasks rest on it: literature review, hypothesis generation, experiment planning and results interpretation, each tied by a line to a paper it cites.';

  function el(tag, attrs, parent, text) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }
  function f(n) { return Math.round(n * 10) / 10; }
  function group(parent, html) { var g = el('g', {}, parent); if (html) g.innerHTML = html; return g; }

  /* ---------- the map and the tasks, placed ---------- */
  /** Returns the smallest circle that holds every paper of a topic: { x, y, r } in the topic's own measure. */
  function ground(nodes) {
    var x = 0, y = 0, it, far, reach;
    function farthest() {
      reach = -1;
      nodes.forEach(function (n) { var d = Math.hypot(n.x - x, n.y - y) + n.r; if (d > reach) { reach = d; far = n; } });
    }
    for (it = 1; it <= 600; it++) { farthest(); x += (far.x - x) / (it + 1); y += (far.y - y) / (it + 1); }
    farthest();
    return { x: x, y: y, r: reach };
  }
  // the papers the tasks rest on, all on the side of the map that faces them: [topic, paper]
  var CITED = { review: [2, 39], claimA: [2, 53], claimB: [2, 51], plan: [3, 7], result: [3, 19] };
  var papers = [], links = [], TASKS;
  /**
   * Places the four topics and the four tasks. Oxidative and Growth stand at one height. The
   * tasks stand at equal steps, at the heights that let three of the five evidence lines run
   * level: the first row of Literature review at its paper, the third row of Hypothesis
   * generation at its second paper, and Trophic lowered until its paper meets the first row of
   * Results interpretation. Rows stand on quarter pixels so that a level 1.5 px line is sharp.
   */
  function place() {
    var G = MAP.topics.map(function (T) { return ground(T.nodes); });
    function below(t, i) { return (MAP.topics[t].nodes[i].y - G[t].y) * S; }   // a paper's height under the middle of its ground
    AT.forEach(function (A, t) { A.r = G[t].r * S + PAD; });
    AT[2].cy = AT[1].cy - AT[1].r + AT[2].r;
    var first = Math.round(AT[2].cy + below(2, CITED.review[1]) - 0.75) + 0.75, step = Math.round(AT[2].cy + below(2, CITED.claimB[1]) - 2 * ROW - first);
    AT[3].cy = first + 3 * step - below(3, CITED.result[1]);
    MAP.topics.forEach(function (T, t) {
      var A = AT[t];
      A.x = A.cx - G[t].x * S; A.y = A.cy - G[t].y * S; A.base = papers.length;
      T.nodes.forEach(function (m) { papers.push({ t: t, i: m.i, x: A.x + m.x * S, y: A.y + m.y * S, r: Math.max(2.1, m.r * S * 1.2), seed: m.seed }); });
      T.links.forEach(function (l) { links.push([papers[A.base + l[0]], papers[A.base + l[1]]]); });
    });
    MAP.between(AT, S).forEach(function (c) { links.push([papers[AT[c[0]].base + c[1]], papers[AT[c[2]].base + c[3]]]); });
    // a task: x, cy: its drawing's left edge and middle row; from: the papers it rests on and the row each line arrives at
    TASKS = [
      { name: ['Literature', 'review'], from: [{ p: CITED.review, row: 0 }], draw: review },
      { name: ['Hypothesis', 'generation'], from: [{ p: CITED.claimA, row: 0 }, { p: CITED.claimB, row: 2 }], draw: hypothesis },
      { name: ['Experiment', 'planning'], from: [{ p: CITED.plan, row: 0 }], draw: plan },
      { name: ['Results', 'interpretation'], from: [{ p: CITED.result, row: 0 }], draw: reading }
    ];
    TASKS.forEach(function (T, k) { T.x = X0; T.cy = first + ROW + k * step; });
  }
  function paperOf(c) { return papers[AT[c[0]].base + c[1]]; }

  /* a line of text that cannot be quoted: word-sized bars; ink: how many of the first words are set in ink */
  function words(x, y, w, seed, ink) {
    var R = OK.prng(seed), s = '', k = 0, x1 = x + w, h = 5;
    while (x < x1 - 6) {
      var ww = Math.min(10 + R() * 16, x1 - x);
      if (x1 - (x + ww) < 9) ww = x1 - x;
      s += '<rect x="' + f(x) + '" y="' + f(y - h / 2) + '" width="' + f(ww) + '" height="' + h + '" rx="' + f(h / 2) + '" fill="' + (k < (ink || 0) ? INK : BAR) + '"/>';
      x += ww + h * 0.85; k++;
    }
    return s;
  }
  /* a cited paper in the map: ringed in ink on a white halo that clears the citations round it;
     returns how far its ring reaches and the markup of the halo and of the ring */
  function cited(m) {
    var r = Math.max(m.r + 1.7, 5.4), at = 'cx="' + f(m.x) + '" cy="' + f(m.y) + '"';
    return { r: r, halo: '<circle ' + at + ' r="' + f(r + 2.2) + '" fill="#fff"/>', ring: '<circle ' + at + ' r="' + f(r) + '" fill="#ffe62e" stroke="' + INK + '" stroke-width="1.8"/>' };
  }

  /* The four task drawings share a width and three rows, and stand at T.x, T.cy; ink marks the point of each. */
  /* written text; the phrase that rests on a paper is in ink */
  function review(g, T) {
    var X = T.x, w = [DW, 74, 50], s = '';
    for (var i = 0; i < 3; i++) s += words(X, T.cy + (i - 1) * ROW, w[i], 11 + i * 7, i ? 0 : 2);
    g.innerHTML = s;
  }
  /* a claim nobody has tested yet, drawn between two papers */
  function hypothesis(g, T) {
    var X = T.x, ya = T.cy - ROW, yb = T.cy + ROW, xa = X + 1, xm = X + 24;
    el('path', { d: 'M' + xa + ',' + f(ya) + ' C' + (xa + 13) + ',' + f(ya) + ' ' + (xm - 12) + ',' + f(T.cy) + ' ' + xm + ',' + f(T.cy) + ' M' + xa + ',' + f(yb) + ' C' + (xa + 13) + ',' + f(yb) + ' ' + (xm - 12) + ',' + f(T.cy) + ' ' + xm + ',' + f(T.cy), class: 'maybe' }, g);
    group(g, words(xm + 9, T.cy, 36, 5, 0));
    el('text', { x: X + DW + 0.5, y: f(T.cy + 6.6), 'text-anchor': 'end', class: 'qm' }, g, '?');
  }
  /* steps to be done; the one that rests on a paper is ticked */
  function plan(g, T) {
    var X = T.x, w = [DW - 18, 44, 58], s = '';
    for (var i = 0; i < 3; i++) {
      var y = T.cy + (i - 1) * ROW;
      s += '<rect class="box' + (i ? '' : ' on') + '" x="' + (X + 0.6) + '" y="' + f(y - 4.5) + '" width="9" height="9" rx="2.2"/>';
      if (!i) s += '<path class="tick" d="M' + (X + 2.7) + ',' + f(y + 0.2) + ' l1.9,1.9 l3,-3.9"/>';
      s += words(X + 18, y, w[i], 40 + i * 5, 0);
    }
    g.innerHTML = s;
  }
  /* a result of one's own, read against a paper */
  function reading(g, T) {
    // the plot is as tall as the three rows beside it and ends on the drawing's right edge
    var X = T.x, fx = X + 38, y0 = T.cy - ROW - 1.9, y1 = T.cy + ROW + 1.9, w = [26, 18, 22], s = '';
    for (var i = 0; i < 3; i++) s += words(X, T.cy + (i - 1) * ROW, w[i], 71 + i * 6, 0);
    s += '<path class="axis" d="M' + fx + ',' + f(y0) + ' V' + f(y1) + ' H' + (X + DW - 0.6) + '"/>';
    [[10, 7], [19, 13], [28, 11], [36, 22], [44, 27]].forEach(function (p) { s += '<circle class="pt" cx="' + (fx + p[0]) + '" cy="' + f(y1 - p[1]) + '" r="2.4"/>'; });
    g.innerHTML = s;
  }

  /* the search blocks' icons, as in Built */
  var ICON = {
    cite: '<path d="M4 15.5 10 10l6-5.5M10 10l5.5 5"/><circle class="f" cx="4" cy="15.5" r="2.1"/><circle class="f" cx="10" cy="10" r="2.1"/><circle class="f" cx="16" cy="4.5" r="2.1"/><circle class="f" cx="15.5" cy="15" r="2.1"/>',
    sem: '<circle cx="10" cy="10" r="7.6" stroke-dasharray="1.6 2.9"/><circle class="f" cx="10" cy="10" r="2.3"/><circle class="f" cx="13.6" cy="6.9" r="1.2"/><circle class="f" cx="6.3" cy="12.9" r="1.2"/><circle class="f" cx="12.9" cy="13.9" r="1.2"/>',
    db: '<rect x="2.6" y="2.8" width="14.8" height="4.6" rx="2.3"/><path d="M6.6 11h10.2M6.6 14.2h10.2M6.6 17.4h6.4"/><circle class="f" cx="3.4" cy="11" r="1"/><circle class="f" cx="3.4" cy="14.2" r="1"/><circle class="f" cx="3.4" cy="17.4" r="1"/>'
  };
  var SEARCHES = [['cite', 'Citation tracing'], ['sem', 'Semantic Search'], ['db', 'Database Search']];
  var FILTERS = ['Year', 'Citations', 'Venue', 'Keywords', 'Title criteria', 'Abstract criteria', 'Full-text criteria'];
  var INSET = 13;                                   // a card's edge to what stands in it

  /* a card: its outer edge is the box it is given, the hairline inside it */
  function card(c, parent) { return el('rect', { x: c.x + 0.5, y: c.y + 0.5, width: c.w - 1, height: c.h - 1, rx: 12.5, class: 'card' }, parent); }
  /* a paper on the line, with what is counted there above it; the line stops short of the paper on both sides */
  function bead(x, kept, count, word, d, key, parent) {
    d[key] = group(parent, '<rect x="' + (x - 11) + '" y="' + (AX - 5) + '" width="22" height="10" fill="#fff"/>' + OK.paper(x, AX, 15, 20, { kept: kept }));
    var g = d[key + 'N'] = el('g', {}, parent);
    if (kept) el('rect', { x: x - 16, y: AX - 47, width: 32, height: 16, class: 'mark' }, g);
    el('text', { x: x, y: AX - 34.5, 'text-anchor': 'middle', class: 'cnt' }, g, count);
    el('text', { x: x, y: AX - 19.5, 'text-anchor': 'middle', class: 'note' }, g, word);
  }

  /* ---------- drawing ---------- */
  var anims = [];
  function draw() {
    pic.textContent = '';
    el('title', { id: 'pic-t' }, pic, TITLE);
    var all = el('g', { transform: 'translate(0 ' + TOP + ')' }, pic);
    var gGround = el('g', {}, all), gEdge = el('g', {}, all), gLine = el('g', {}, all), gNode = el('g', {}, all), gTop = el('g', {}, all);
    var d = { grounds: [], labels: [], tasks: [], sRows: [], fRows: [] };
    AT.forEach(function (A) { d.grounds.push(el('circle', { cx: A.cx, cy: f(A.cy), r: f(A.r), class: 'ground' }, gGround)); });

    // the line, under the cards: it passes behind each and comes out at the same height
    d.lineA = el('path', { d: 'M' + LX + ',12.5 V' + (AX - 16) + ' A16,16 0 0 0 ' + (LX + 16) + ',' + AX + ' H' + (SC.x + 0.5), class: 'lead cut', pathLength: 1 }, gLine);
    d.lineB = el('path', { d: 'M' + (SC.x + SC.w - 0.5) + ',' + AX + ' H' + (FC.x + 0.5), class: 'lead cut', pathLength: 1 }, gLine);
    d.lineC = el('path', { d: 'M' + (FC.x + FC.w - 0.5) + ',' + AX + ' H' + TIP, class: 'lead cut', pathLength: 1 }, gLine);
    d.head = el('path', { d: 'M' + (TIP - 5) + ',' + (AX - 5) + ' L' + TIP + ',' + AX + ' L' + (TIP - 5) + ',' + (AX + 5), class: 'lead' }, gLine);
    d.inDot = el('circle', { cx: LX, cy: 12.5, r: 5.5, class: 'port' }, gLine);

    // 1. the question, and the three seed papers with it
    d.gAsk = el('g', {}, gTop);
    el('text', { x: COL - 0.9, y: 17, class: 'note' }, d.gAsk, 'Your research question');
    ['How does microplastic exposure', 'affect freshwater fish?'].forEach(function (l, i) { el('text', { x: COL - 1.7 + i * 0.9, y: 52 + i * 36, class: 'ask' }, d.gAsk, l); });
    d.seeds = [0, 1, 2].map(function (i) { return group(gTop, OK.paper(COL + 8.75 + i * 21, 128.5, 16, 21, { seed: true })); });
    d.seedNote = el('text', { x: COL + 66, y: 133, class: 'note' }, gTop, '3 seed papers');

    // 2. the searches: one card, three names
    d.sLab = el('text', { x: SC.x - 0.6, y: SC.y - 11.5, class: 'lab' }, gTop, 'Search');
    d.sCard = el('g', {}, gTop);
    card(SC, d.sCard);
    SEARCHES.forEach(function (s, i) {
      var cy = AX + (i - 1) * 44, g = el('g', {}, gTop), tx = SC.x + INSET;
      if (i) el('line', { x1: SC.x + INSET, x2: SC.x + SC.w - INSET, y1: cy - 22, y2: cy - 22, class: 'rule' }, d.sCard);
      el('rect', { x: tx, y: cy - 11, width: 22, height: 22, rx: 6.6, class: 'tile' }, g);
      el('g', { transform: 'translate(' + (tx + 3.7) + ' ' + (cy - 7.3) + ') scale(.73)', class: 'ic' }, g).innerHTML = ICON[s[0]];
      el('text', { x: tx + 32, y: cy + 4.5, class: 'row' }, g, s[1]);
      d.sRows.push(g);
    });

    // what the searches found, on the line between the two cards
    bead(SC.x + SC.w + GAP / 2, false, '14,950', 'found', d, 'found', gTop);

    // 3. the filters: one card, seven names in a row one after another
    d.fLab = el('text', { x: FC.x - 0.9, y: FC.y - 11.5, class: 'lab' }, gTop, 'Filter');
    d.fCard = el('g', {}, gTop);
    card(FC, d.fCard);
    var DX = FC.x + INSET + 8, FY = function (i) { return AX + (i - 3) * 20.5; };
    d.chain = el('path', { d: 'M' + DX + ',' + FY(0) + ' V' + FY(6), class: 'chain', pathLength: 1 }, gTop);
    FILTERS.forEach(function (name, i) {
      var g = el('g', {}, gTop);
      el('circle', { cx: DX, cy: FY(i), r: 8, class: 'port' }, g);
      el('text', { x: DX, y: FY(i) + 4.3, 'text-anchor': 'middle', class: 'no' }, g, String(i + 1));
      el('text', { x: DX + 18.5, y: FY(i) + 4.5, class: 'row' }, g, name);
      d.fRows.push(g);
    });

    // what the filters kept, on the line into the map
    bead(FC.x + FC.w + GAP / 2, true, '212', 'kept', d, 'kept', gTop);

    // 4. the map of the 212
    d.gMap = el('g', {}, gNode);
    links.forEach(function (l) { el('line', { x1: f(l[0].x), y1: f(l[0].y), x2: f(l[1].x), y2: f(l[1].y), class: 'edge' }, gEdge); });
    d.gEdge = gEdge;
    papers.forEach(function (m) {
      if (m.seed) {
        el('circle', { cx: f(m.x), cy: f(m.y), r: f(m.r + 3), class: 'ring' }, d.gMap);
        el('circle', { cx: f(m.x), cy: f(m.y), r: f(m.r), class: 'core' }, d.gMap);
      } else el('circle', { cx: f(m.x), cy: f(m.y), r: f(m.r), class: 'dot' }, d.gMap);
    });
    // a topic's name: on one line above or below its ground, 14 in from the ground's left edge
    // and 6 clear of it; Feeding and ingestion, with Oxidative stress over it, on two lines at its shoulder
    MAP.topics.forEach(function (T, t) {
      var A = AT[t], x = f(A.cx - A.r + 14), tt, parts = T.name.split(' ');
      if (t === 0) {
        tt = el('text', { class: 'topic', x: f(A.cx - A.r), y: f(A.cy - A.r - 6 - 17) }, gTop);
        el('tspan', {}, tt, parts.slice(0, 2).join(' '));
        el('tspan', { x: f(A.cx - A.r), dy: 17 }, tt, parts.slice(2).join(' '));
      } else {
        tt = el('text', { class: 'topic', x: x, y: f(t === 3 ? A.cy + A.r + 6 + CAP : A.cy - A.r - 6) }, gTop);
        el('tspan', {}, tt, T.name);
      }
      el('tspan', { class: 'c', dx: 7 }, tt, String(T.n));
      d.labels.push(tt);
    });

    // 5. the work it feeds
    var gHalo = el('g', {}, gTop), gWire = el('g', {}, gTop), gMark = el('g', {}, gTop);
    TASKS.forEach(function (T) {
      var o = { wires: [], halo: [], src: [], dst: [] };
      o.body = el('g', {}, gTop);
      T.draw(o.body, T);
      o.name = el('g', {}, gTop);
      T.name.forEach(function (l, i) { el('text', { x: XN, y: f(T.cy - 4.2 + i * 23), class: 'task' }, o.name, l); });
      T.from.forEach(function (c) {
        // one curve, level where it leaves and where it arrives, each handle half the run;
        // a line whose paper stands at its row is level from end to end
        var m = paperOf(c.p), mark = cited(m), y = T.cy + (c.row - 1) * ROW, y0 = Math.abs(m.y - y) < 1 ? y : m.y, x0 = m.x + mark.r, half = (XA - x0) / 2;
        o.wires.push(el('path', { d: 'M' + f(x0) + ',' + y0 + ' C' + f(x0 + half) + ',' + y0 + ' ' + f(XA - half) + ',' + y + ' ' + XA + ',' + y, class: 'wire', pathLength: 1 }, gWire));
        o.src.push(group(gMark, mark.ring));
        o.halo.push(group(gHalo, mark.halo));
        o.dst.push(el('circle', { cx: XA, cy: y, r: 3, class: 'port' }, gMark));
      });
      d.tasks.push(o);
    });
    return d;
  }

  /* ---------- the tall composition ---------- */
  /* One column, 324 wide at its own size. The line runs down beside the question, steps across
     to the rail and falls through both cards into the first topic. The topics stand in a zigzag,
     each name over its own ground (the first's at its shoulder, beside the arrowhead), so that
     the last two are open below. The tasks stand under them in two rows of two, each hanging
     from a paper straight above its dot; the second row is set left of the first so that its
     lines pass it. */
  var TALL = {
    when: window.matchMedia('(max-width: 880px)'),  // the window in which the wide picture's text can no longer be read
    w: 324, s: 0.42,                                // the picture's width; the map's scale
    lx: 13.5, col: 34,                              // the line beside the question; the left edge of the question's text
    x0: 8, x1: 316,                                 // the left and right edges of the cards
    rail: 110.5,                                    // the line through the cards and the beads; the middle of the first topic
    ch: 80, gap: 62,                                // a card's height; card to card along the line, a bead in the middle
    at: [110.5, 226, 90.5, 217.5],                  // the middle of each topic's ground, across
    drop: 124,                                      // from one row of tasks to the next
    // the tasks, row by row, and the paper each hangs from: [topic, paper]
    tasks: [
      { name: ['Literature', 'review'], p: [2, 9], row: 0, draw: review },
      { name: ['Hypothesis', 'generation'], p: [3, 16], row: 0, draw: hypothesis },
      { name: ['Experiment', 'planning'], p: [2, 26], row: 1, draw: plan },
      { name: ['Results', 'interpretation'], p: [3, 28], row: 1, draw: reading }
    ]
  };
  /* the nearest place on which a 1.5 px upright line is sharp */
  function quarter(x) { return Math.round(x * 2 - 0.5) / 2 + 0.25; }
  /**
   * Places the tall composition from the top down and returns it: where the cards, the beads and
   * the arrowhead stand, the grounds (at), the papers and citations of the map, the tasks and
   * the picture's height (h). A ground's height follows from the one above it on its side and
   * the room its name needs between the two. A task's line stands on its paper, moved by at
   * most a quarter pixel to be sharp, and its drawing follows the line.
   */
  function placeTall() {
    var Z = TALL, S = Z.s, G = MAP.topics.map(function (T) { return ground(T.nodes); });
    var L = { ask: [48, 79, 110], seeds: 147, shelf: 180.5, papers: [], links: [] };
    L.sc = { x: Z.x0, y: 216, w: Z.x1 - Z.x0, h: Z.ch };
    L.fc = { x: Z.x0, y: L.sc.y + Z.ch + Z.gap, w: L.sc.w, h: Z.ch + 22 };   // four rows of filters, where the searches take three
    L.found = L.sc.y + Z.ch + Z.gap / 2;
    L.kept = L.fc.y + L.fc.h + Z.gap / 2;
    L.top = L.kept + 48;                             // the first ground's top, under the arrowhead
    L.tip = L.top - 12;
    var at = L.at = Z.at.map(function (cx, t) { return { cx: cx, r: G[t].r * S + PAD }; });
    at[0].cy = L.top + at[0].r;
    at[2].cy = at[0].cy + at[0].r + 46 + at[2].r;    // a name of two lines between them
    at[1].cy = at[0].cy + 113;                       // where it meets the first and the third alike
    at[3].cy = at[1].cy + at[1].r + 28.5 + at[3].r;  // a name of one line between them
    MAP.topics.forEach(function (T, t) {
      var A = at[t];
      A.x = A.cx - G[t].x * S; A.y = A.cy - G[t].y * S; A.base = L.papers.length;
      T.nodes.forEach(function (m) { L.papers.push({ t: t, i: m.i, x: A.x + m.x * S, y: A.y + m.y * S, r: Math.max(1.8, m.r * S * 1.2), seed: m.seed }); });
      T.links.forEach(function (l) { L.links.push([L.papers[A.base + l[0]], L.papers[A.base + l[1]]]); });
    });
    MAP.between(at, S).forEach(function (c) { L.links.push([L.papers[at[c[0]].base + c[1]], L.papers[at[c[2]].base + c[3]]]); });
    // a task: m: its paper; lane: its line; dot: where the line ends; x, cy: its drawing's left edge and middle row
    var foot = at[3].cy + at[3].r + 22;
    L.tasks = Z.tasks.map(function (T) {
      var m = L.papers[at[T.p[0]].base + T.p[1]], lane = quarter(m.x), dot = foot + T.row * Z.drop;
      return { name: T.name, draw: T.draw, m: m, lane: lane, dot: dot, x: lane - 3, cy: dot + 15 + ROW + 2.5 };
    });
    L.h = Math.ceil(L.tasks[3].cy + 66.5 + 7);       // the last name's second line, and room under it
    return L;
  }
  /* a topic's name on one line or two at x, its last baseline at y, the number of its papers after it */
  function topicName(parent, x, y, lines, n) {
    var tt = el('text', { class: 'topic', x: f(x), y: f(y - (lines.length - 1) * 17) }, parent);
    lines.forEach(function (l, i) { el('tspan', i ? { x: f(x), dy: 17 } : {}, tt, l); });
    el('tspan', { class: 'c', dx: 7 }, tt, String(n));
    return tt;
  }
  /* a paper on the rail, with what is counted there beside it; the line stops short of the paper above and below */
  function beadTall(y, kept, count, word, d, key, parent) {
    var x = TALL.rail, tx = x + 22;
    d[key] = group(parent, '<rect x="' + (x - 5) + '" y="' + (y - 13.5) + '" width="10" height="27" fill="#fff"/>' + OK.paper(x, y, 15, 20, { kept: kept }));
    var g = d[key + 'N'] = el('g', {}, parent);
    if (kept) el('rect', { x: f(tx - 4.65), y: y - 15, width: 32, height: 16, class: 'mark' }, g);
    el('text', { x: tx, y: y - 2.5, class: 'cnt' }, g, count);
    el('text', { x: tx, y: y + 12.5, class: 'note' }, g, word);
  }
  /** Draws the tall composition L into the picture and returns its parts for the reveal. */
  function drawTall(L) {
    var Z = TALL, X = Z.rail, SC = L.sc, FC = L.fc;
    pic.textContent = '';
    el('title', { id: 'pic-t' }, pic, TITLE);
    var gGround = el('g', {}, pic), gEdge = el('g', {}, pic), gLine = el('g', {}, pic), gNode = el('g', {}, pic), gTop = el('g', {}, pic);
    var d = { grounds: [], labels: [], tasks: [], sRows: [], fRows: [], chains: [], gEdge: gEdge };
    L.at.forEach(function (A) { d.grounds.push(el('circle', { cx: A.cx, cy: f(A.cy), r: f(A.r), class: 'ground' }, gGround)); });

    // the line, under the cards: down beside the question, across to the rail, then straight through
    d.lineA = el('path', { d: 'M' + Z.lx + ',12.5 V' + (L.shelf - 16) + ' A16,16 0 0 0 ' + (Z.lx + 16) + ',' + L.shelf + ' H' + (X - 16) + ' A16,16 0 0 1 ' + X + ',' + (L.shelf + 16) + ' V' + (SC.y + 0.5), class: 'lead cut', pathLength: 1 }, gLine);
    d.lineB = el('path', { d: 'M' + X + ',' + (SC.y + SC.h - 0.5) + ' V' + (FC.y + 0.5), class: 'lead cut', pathLength: 1 }, gLine);
    d.lineC = el('path', { d: 'M' + X + ',' + (FC.y + FC.h - 0.5) + ' V' + L.tip, class: 'lead cut', pathLength: 1 }, gLine);
    d.head = el('path', { d: 'M' + (X - 5) + ',' + (L.tip - 5) + ' L' + X + ',' + L.tip + ' L' + (X + 5) + ',' + (L.tip - 5), class: 'lead' }, gLine);
    d.inDot = el('circle', { cx: Z.lx, cy: 12.5, r: 5.5, class: 'port' }, gLine);

    // 1. the question, and the three seed papers with it
    d.gAsk = el('g', {}, gTop);
    el('text', { x: Z.col - 0.9, y: 17, class: 'note' }, d.gAsk, 'Your research question');
    ['How does microplastic', 'exposure affect', 'freshwater fish?'].forEach(function (l, i) { el('text', { x: Z.col - 1.4, y: L.ask[i], class: 'ask hr-ask' }, d.gAsk, l); });
    d.seeds = [0, 1, 2].map(function (i) { return group(gTop, OK.paper(Z.col + 8.75 + i * 21, L.seeds, 16, 21, { seed: true })); });
    d.seedNote = el('text', { x: Z.col + 66, y: L.seeds + 4.5, class: 'note' }, gTop, '3 seed papers');

    // 2. the searches: one card, three names side by side, the rail under the first rule
    d.sLab = el('text', { x: SC.x - 0.6, y: SC.y - 11.5, class: 'lab' }, gTop, 'Search');
    d.sCard = el('g', {}, gTop);
    card(SC, d.sCard);
    var edge = [SC.x, X, SC.x + SC.w - (X - SC.x)];
    SEARCHES.forEach(function (s, i) {
      var g = el('g', {}, gTop), tx = edge[i] + INSET, ty = SC.y + INSET;
      if (i) el('line', { x1: edge[i], x2: edge[i], y1: SC.y + INSET, y2: SC.y + SC.h - INSET, class: 'rule' }, d.sCard);
      el('rect', { x: tx, y: ty, width: 22, height: 22, rx: 6.6, class: 'tile' }, g);
      el('g', { transform: 'translate(' + (tx + 3.7) + ' ' + (ty + 3.7) + ') scale(.73)', class: 'ic' }, g).innerHTML = ICON[s[0]];
      s[1].split(' ').forEach(function (l, k) { el('text', { x: tx - 0.4, y: SC.y + 52 + k * 15.5, class: 'row' }, g, l); });
      d.sRows.push(g);
    });
    beadTall(L.found, false, '14,950', 'found', d, 'found', gTop);

    // 3. the filters: one card, the seven names in two runs, four and three
    d.fLab = el('text', { x: FC.x - 0.9, y: FC.y - 11.5, class: 'lab' }, gTop, 'Filter');
    d.fCard = el('g', {}, gTop);
    card(FC, d.fCard);
    var DX = [FC.x + INSET + 8, FC.x + FC.w / 2 + INSET + 8], FY = function (i) { return FC.y + 18 + (i % 4) * 22; };
    DX.forEach(function (x, c) { d.chains.push(el('path', { d: 'M' + x + ',' + FY(0) + ' V' + FY(c ? 2 : 3), class: 'chain', pathLength: 1 }, gTop)); });
    FILTERS.forEach(function (name, i) {
      var g = el('g', {}, gTop), x = DX[i < 4 ? 0 : 1];
      el('circle', { cx: x, cy: FY(i), r: 8, class: 'port' }, g);
      el('text', { x: x, y: FY(i) + 4.3, 'text-anchor': 'middle', class: 'no' }, g, String(i + 1));
      el('text', { x: x + 18.5, y: FY(i) + 4.5, class: 'row' }, g, name);
      d.fRows.push(g);
    });
    beadTall(L.kept, true, '212', 'kept', d, 'kept', gTop);

    // 4. the map of the 212, each topic's name over its own ground
    d.gMap = el('g', {}, gNode);
    L.links.forEach(function (l) { el('line', { x1: f(l[0].x), y1: f(l[0].y), x2: f(l[1].x), y2: f(l[1].y), class: 'edge' }, gEdge); });
    L.papers.forEach(function (m) {
      if (m.seed) {
        el('circle', { cx: f(m.x), cy: f(m.y), r: f(m.r + 3), class: 'ring' }, d.gMap);
        el('circle', { cx: f(m.x), cy: f(m.y), r: f(m.r), class: 'core' }, d.gMap);
      } else el('circle', { cx: f(m.x), cy: f(m.y), r: f(m.r), class: 'dot' }, d.gMap);
    });
    var A = L.at, N = MAP.topics.map(function (T) { return T.name.split(' '); });
    d.labels.push(topicName(gTop, Z.x0 - 0.9, A[0].cy - A[0].r - 6, [N[0].slice(0, 2).join(' '), N[0][2]], MAP.topics[0].n));
    d.labels.push(topicName(gTop, A[1].cx, A[1].cy - A[1].r - 6, N[1], MAP.topics[1].n));
    d.labels.push(topicName(gTop, Z.x0 - 0.9, A[2].cy - A[2].r - 6, [N[2].slice(0, 2).join(' '), N[2][2]], MAP.topics[2].n));
    d.labels.push(topicName(gTop, A[2].cx + A[2].r + 12, A[3].cy - A[3].r - 6, [MAP.topics[3].name], MAP.topics[3].n));

    // 5. the work it feeds: each task under its paper
    var gHalo = el('g', {}, gTop), gWire = el('g', {}, gTop), gMark = el('g', {}, gTop);
    L.tasks.forEach(function (T) {
      var o = { len: T.dot - T.m.y }, mark = cited(T.m);
      o.body = el('g', {}, gTop);
      T.draw(o.body, T);
      o.name = el('g', {}, gTop);
      T.name.forEach(function (l, i) { el('text', { x: f(T.x - 1.1), y: f(T.cy + 44.5 + i * 22), class: 'task' }, o.name, l); });
      o.wire = el('path', { d: 'M' + T.lane + ',' + f(T.m.y + mark.r) + ' V' + T.dot, class: 'wire', pathLength: 1 }, gWire);
      o.src = group(gMark, mark.ring);
      o.halo = group(gHalo, mark.halo);
      o.dst = el('circle', { cx: T.lane, cy: T.dot, r: 3, class: 'port' }, gMark);
      d.tasks.push(o);
    });
    return d;
  }

  /* ---------- the reveal ---------- */
  var EASE = 'cubic-bezier(.2,.7,.2,1)';
  function from(e, frames, delay, dur) { anims.push(e.animate(frames, { delay: delay, duration: dur, easing: EASE, fill: 'backwards' })); }
  function fade(e, delay, dur) { from(e, [{ opacity: 0 }, { opacity: 1 }], delay, dur || 420); }
  function arrive(e, delay, dur) { from(e, [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'translateY(0)' }], delay, dur || 420); }
  function stroke(e, delay, dur) {
    e.style.strokeDasharray = '1';
    from(e, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], delay, dur);
  }
  var halt = function () {};                        // undoes a wait that is still open
  /* ends every animation and every wait, so that the DOM alone shows */
  function settle() {
    halt(); halt = function () {};
    anims.forEach(function (a) { a.cancel(); });
    anims = [];
  }
  /* calls fn once, when the part of the picture that begins at share of its height has come into the window; returns the way to stop waiting */
  function inView(share, fn) {
    function off() { window.removeEventListener('scroll', check); window.removeEventListener('resize', check); }
    function check() {
      var b = pic.getBoundingClientRect();
      if (b.top + b.height * share < window.innerHeight * 0.8) { off(); fn(); }
    }
    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    check();
    return off;
  }
  function play(d) {
    settle();
    if (reduce) return;
    // the question
    arrive(d.gAsk, 0, 450); fade(d.inDot, 150, 250);
    d.seeds.forEach(function (s, i) { arrive(s, 300 + i * 80); });
    fade(d.seedNote, 540, 320);
    stroke(d.lineA, 450, 650);
    // the searches
    arrive(d.sLab, 1000); arrive(d.sCard, 1000);
    d.sRows.forEach(function (g, i) { arrive(g, 1100 + i * 110); });
    stroke(d.lineB, 1550, 360); arrive(d.found, 1700); fade(d.foundN, 1780, 320);
    // the filters
    arrive(d.fLab, 1900); arrive(d.fCard, 1900); stroke(d.chain, 2000, 620);
    d.fRows.forEach(function (g, i) { arrive(g, 2000 + i * 80, 360); });
    stroke(d.lineC, 2600, 360); arrive(d.kept, 2740); fade(d.keptN, 2820, 320); fade(d.head, 2900, 200);
    // the map
    fade(d.gEdge, 3050, 480); fade(d.gMap, 3050, 480);
    d.grounds.forEach(function (g, i) { fade(g, 3350 + i * 130, 400); });
    d.labels.forEach(function (l, i) { fade(l, 3350 + i * 130, 400); });
    // the tasks, one after another, each line from its paper to its dot
    d.tasks.forEach(function (o, i) {
      var t = 4050 + i * 400;
      o.wires.forEach(function (w, k) {
        fade(o.halo[k], t + k * 110, 260); fade(o.src[k], t + k * 110, 260);
        stroke(w, t + 100 + k * 110, 460);
        fade(o.dst[k], t + 440 + k * 110, 220);
      });
      arrive(o.body, t + 360);
      arrive(o.name, t + 440);
    });
  }

  /* The tall picture reveals in two parts: down to the arrowhead at once; the map and the tasks
     when the map has come into the window, and not before the line has reached it. The second
     part waits as paused animations, which hold their first frame. */
  function playTall(d, L) {
    settle();
    if (reduce) return;
    // the question
    arrive(d.gAsk, 0, 450); fade(d.inDot, 150, 250);
    d.seeds.forEach(function (s, i) { arrive(s, 300 + i * 80); });
    fade(d.seedNote, 540, 320);
    stroke(d.lineA, 450, 760);
    // the searches
    arrive(d.sLab, 1100); arrive(d.sCard, 1100);
    d.sRows.forEach(function (g, i) { arrive(g, 1200 + i * 110); });
    stroke(d.lineB, 1650, 320); arrive(d.found, 1780); fade(d.foundN, 1860, 320);
    // the filters
    arrive(d.fLab, 1980); arrive(d.fCard, 1980);
    d.chains.forEach(function (c, k) { stroke(c, 2080 + k * 240, 300); });
    d.fRows.forEach(function (g, i) { arrive(g, 2080 + i * 80, 360); });
    stroke(d.lineC, 2680, 420); arrive(d.kept, 2780); fade(d.keptN, 2860, 320); fade(d.head, 3080, 200);
    var upper = anims.length, reached = performance.now() + 3200;
    // the map
    fade(d.gEdge, 0, 480); fade(d.gMap, 0, 480);
    d.grounds.forEach(function (g, i) { fade(g, 300 + i * 130, 400); });
    d.labels.forEach(function (l, i) { fade(l, 300 + i * 130, 400); });
    // the tasks, row by row, each line from its paper down to its dot
    d.tasks.forEach(function (o, i) {
      var t = 1000 + i * 400, run = 300 + o.len * 1.4;
      fade(o.halo, t, 260); fade(o.src, t, 260);
      stroke(o.wire, t + 100, run);
      fade(o.dst, t + run - 20, 220);
      arrive(o.body, t + run + 20);
      arrive(o.name, t + run + 100);
    });
    var lower = anims.slice(upper), timer = 0;
    lower.forEach(function (a) { a.pause(); });
    var off = inView(L.top / L.h, function () {
      timer = setTimeout(function () { lower.forEach(function (a) { a.play(); }); }, Math.max(0, reached - performance.now()));
    });
    halt = function () { off(); clearTimeout(timer); };
  }

  /* ---------- the composition the window asks for ---------- */
  var WIDE = pic.getAttribute('viewBox'), placed = null, replay = function () {};
  function tallPlan() { return placed || (placed = placeTall()); }
  /* gives the picture and its frame the box of one composition; the wide one is the page's own */
  function box(tall) {
    pic.parentNode.classList.toggle('hr-tall', tall);
    pic.setAttribute('viewBox', tall ? '0 0 ' + TALL.w + ' ' + tallPlan().h : WIDE);
    if (tall) pic.style.aspectRatio = TALL.w + ' / ' + tallPlan().h;
    else { pic.style.removeProperty('aspect-ratio'); if (!pic.getAttribute('style')) pic.removeAttribute('style'); }
  }
  /* draws the composition the window asks for in place of whatever stands there, and reveals it */
  function render() {
    var tall = TALL.when.matches, d;
    settle();
    box(tall);
    if (tall) { d = drawTall(tallPlan()); replay = function () { playTall(d, tallPlan()); }; }
    else { d = draw(); replay = function () { play(d); }; }
    replay();
  }
  function start() {
    place();
    render();
    if (TALL.when.addEventListener) TALL.when.addEventListener('change', render); else TALL.when.addListener(render);
    window.addEventListener('ok:replay', function () { replay(); });
  }
  /* the faces the picture measures text in must be loaded before anything is placed by measuring */
  function fontsReady() {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    var faces = ['500 20px "Hanken"', '600 20px "Hanken"', '400 20px "Hanken"', '400 12px "SF Mono"', '500 12px "SF Mono"'];
    return Promise.race([Promise.all(faces.map(function (f) { return document.fonts.load(f); })).then(function () { return document.fonts.ready; }), new Promise(function (r) { setTimeout(r, 2500); })]);
  }
  box(TALL.when.matches);                           // the picture's box stands before its faces have loaded
  fontsReady().then(start);
})();
