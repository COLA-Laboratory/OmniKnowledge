/* The hero: the 3 px line joins five things. The question; one small card that lists the three
   searches; one small card that lists the six filters as a numbered pipeline; the map of the 212
   kept papers, its four topics packed into one body; the four tasks, each tied by an evidence
   line to a paper on the side of the map that faces it.
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
  var SC = { x: COL, y: 199.5, w: 151, h: 146 };    // the card of searches
  var FC = { x: SC.x + SC.w + GAP, y: 199.5, w: 139, h: 146 };   // the card of filters
  var TIP = FC.x + FC.w + GAP + 5;                  // where the line's arrowhead ends, at the map
  var CAP = 10.5;                                   // the height of a capital in a topic's name
  // the middle of each topic's round ground; Growth's height follows from Oxidative's and
  // Trophic's from the tasks (see place)
  var AT = [{ cx: 583.5, cy: 291.5 }, { cx: 663, cy: 115 }, { cx: 850.5 }, { cx: 752 }];
  var XA = 1022, X0 = 1038, DW = 88, XN = 1146;     // a task: the dot its line ends in, its drawing (left edge, width), its name
  var ROW = 15;                                     // a task drawing has three rows, this far apart

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
    // a task: cy is its middle row; from: the papers it rests on and the row each line arrives at
    TASKS = [
      { name: ['Literature', 'review'], from: [{ p: CITED.review, row: 0 }], draw: review },
      { name: ['Hypothesis', 'generation'], from: [{ p: CITED.claimA, row: 0 }, { p: CITED.claimB, row: 2 }], draw: hypothesis },
      { name: ['Experiment', 'planning'], from: [{ p: CITED.plan, row: 0 }], draw: plan },
      { name: ['Results', 'interpretation'], from: [{ p: CITED.result, row: 0 }], draw: reading }
    ];
    TASKS.forEach(function (T, k) { T.cy = first + ROW + k * step; });
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

  /* The four task drawings share a left edge, a width and three rows; ink marks the point of each. */
  /* written text; the phrase that rests on a paper is in ink */
  function review(g, T) {
    var w = [DW, 74, 50], s = '';
    for (var i = 0; i < 3; i++) s += words(X0, T.cy + (i - 1) * ROW, w[i], 11 + i * 7, i ? 0 : 2);
    g.innerHTML = s;
  }
  /* a claim nobody has tested yet, drawn between two papers */
  function hypothesis(g, T) {
    var ya = T.cy - ROW, yb = T.cy + ROW, xa = X0 + 1, xm = X0 + 24;
    el('path', { d: 'M' + xa + ',' + f(ya) + ' C' + (xa + 13) + ',' + f(ya) + ' ' + (xm - 12) + ',' + f(T.cy) + ' ' + xm + ',' + f(T.cy) + ' M' + xa + ',' + f(yb) + ' C' + (xa + 13) + ',' + f(yb) + ' ' + (xm - 12) + ',' + f(T.cy) + ' ' + xm + ',' + f(T.cy), class: 'maybe' }, g);
    group(g, words(xm + 9, T.cy, 36, 5, 0));
    el('text', { x: X0 + DW + 0.5, y: f(T.cy + 6.6), 'text-anchor': 'end', class: 'qm' }, g, '?');
  }
  /* steps to be done; the one that rests on a paper is ticked */
  function plan(g, T) {
    var w = [DW - 18, 44, 58], s = '';
    for (var i = 0; i < 3; i++) {
      var y = T.cy + (i - 1) * ROW;
      s += '<rect class="box' + (i ? '' : ' on') + '" x="' + (X0 + 0.6) + '" y="' + f(y - 4.5) + '" width="9" height="9" rx="2.2"/>';
      if (!i) s += '<path class="tick" d="M' + (X0 + 2.7) + ',' + f(y + 0.2) + ' l1.9,1.9 l3,-3.9"/>';
      s += words(X0 + 18, y, w[i], 40 + i * 5, 0);
    }
    g.innerHTML = s;
  }
  /* a result of one's own, read against a paper */
  function reading(g, T) {
    // the plot is as tall as the three rows beside it and ends on the drawing's right edge
    var fx = X0 + 38, y0 = T.cy - ROW - 1.9, y1 = T.cy + ROW + 1.9, w = [26, 18, 22], s = '';
    for (var i = 0; i < 3; i++) s += words(X0, T.cy + (i - 1) * ROW, w[i], 71 + i * 6, 0);
    s += '<path class="axis" d="M' + fx + ',' + f(y0) + ' V' + f(y1) + ' H' + (X0 + DW - 0.6) + '"/>';
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
  var FILTERS = ['Year', 'Citations', 'Venue', 'Keywords', 'Title criteria', 'Abstract criteria'];
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
    el('title', { id: 'pic-t' }, pic, 'From a research question and three seed papers, three searches (citation tracing, semantic search, database search) find 14,950 papers; six filters in a row (year, citations, venue, keywords, title criteria, abstract criteria) keep 212. The 212 stand as one citation network in four topics, and four tasks rest on it: literature review, hypothesis generation, experiment planning and results interpretation, each tied by a line to a paper it cites.');
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

    // 3. the filters: one card, six names in a row one after another
    d.fLab = el('text', { x: FC.x - 0.9, y: FC.y - 11.5, class: 'lab' }, gTop, 'Filter');
    d.fCard = el('g', {}, gTop);
    card(FC, d.fCard);
    var DX = FC.x + INSET + 8, FY = function (i) { return AX + (i - 2.5) * 22; };
    d.chain = el('path', { d: 'M' + DX + ',' + FY(0) + ' V' + FY(5), class: 'chain', pathLength: 1 }, gTop);
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

  /* ---------- the reveal ---------- */
  var EASE = 'cubic-bezier(.2,.7,.2,1)';
  function from(e, frames, delay, dur) { anims.push(e.animate(frames, { delay: delay, duration: dur, easing: EASE, fill: 'backwards' })); }
  function fade(e, delay, dur) { from(e, [{ opacity: 0 }, { opacity: 1 }], delay, dur || 420); }
  function arrive(e, delay, dur) { from(e, [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'translateY(0)' }], delay, dur || 420); }
  function stroke(e, delay, dur) {
    e.style.strokeDasharray = '1';
    from(e, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], delay, dur);
  }
  function play(d) {
    anims.forEach(function (a) { a.cancel(); });
    anims = [];
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

  function start() {
    place();
    var d = draw();
    play(d);
    window.addEventListener('ok:replay', function () { play(d); });
  }
  /* the faces the picture measures text in must be loaded before anything is placed by measuring */
  function fontsReady() {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    var faces = ['500 20px "Hanken"', '600 20px "Hanken"', '400 20px "Hanken"', '400 12px "SF Mono"', '500 12px "SF Mono"'];
    return Promise.race([Promise.all(faces.map(function (f) { return document.fonts.load(f); })).then(function () { return document.fonts.ready; }), new Promise(function (r) { setTimeout(r, 2500); })]);
  }
  fontsReady().then(start);
})();
