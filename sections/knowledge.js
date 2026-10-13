/* The Knowledge section: the map of the 212 kept papers above (as a citation network
   or as a semantic map, the same dots moving between the two) and the four tasks in one row
   below. Choosing a task plays the reading: a front crosses the map once and every paper is read
   as it passes; the papers that hold something relevant stay ringed; the cited ones, from all
   four topics, become numbered citation marks, and a copy of each mark travels down into the
   task, whose drawing is written into an output that carries the same numbers. Paper and
   citation are tied by number, as a place on a map and its entry in the legend; no line stands
   between them. Left alone, the section chooses the next task by itself, round the four, until
   the reader chooses one.
   The finished picture is the DOM; the reading is a set of animations laid over it, so ?still=1
   and reduced motion show the DOM. README.md owns the drawing language. */
(function () {
  'use strict';
  var OK = window.OK, MAP = OK.map, f = OK.f, el = OK.svg;
  var INK = '#0b0b0c', BAR = '#c9c9c2', PALE = '#ebebe6';
  var PAD = 8;                                      // the room between a ground's edge and its outermost paper
  var DW = 244;                                     // the width of a task's drawing
  var CR = 8.5;                                     // the radius of a citation mark
  var BH = 6;                                       // the height of a word of an output, a little over the kit's 5 so that a mark sits well beside it
  var FLY = 'cubic-bezier(.5,0,.3,1)';              // how a citation mark travels from its paper into the text
  var T_SWEEP = 2400;                               // the time the front takes to cross the map, ms
  var DWELL = 6000;                                 // how long a finished reading stands before the next task is chosen by itself, ms
  var QUIET = 20000;                                // how long the rotation waits after the reader switches the map, ms

  /* ask: the request in the user's words; hold: how many papers hold something relevant; from:
     how many papers of each topic the output cites (as many in all as the drawing has marks). */
  var TASKS = [
    { ask: 'Review the particle sizes and doses tested so far.', hold: 64, from: [2, 1, 2, 1], draw: review },
    { ask: 'What has nobody tested yet?', hold: 41, from: [1, 1, 1, 1], draw: hypothesis },
    { ask: 'Plan an exposure experiment on juvenile carp.', hold: 38, from: [1, 1, 1, 1], draw: planning },
    { ask: 'My fish ate less but grew normally. Is that expected?', hold: 27, from: [2, 1, 1, 1], draw: reading }
  ];

  /* The two arrangements: the wide one that is judged, and a stacked one for a phone. at: the
     middle of each topic's ground in the citation network; gap, over, apart, semTop: in the
     semantic map, the room between two papers, how far the grounds of one topic overlap, the room
     between topics, and the room kept above the grounds for a topic's name; lobes: for each sub-topic in OK.semantic's order, where its ground stands and on which
     side its name (without it both follow from OK.semantic's own places); lab: where a topic's
     name stands in the network, on two lines, when it is not above its ground; cards: the task cards
     (on a phone the four share one place and the chosen one shows). */
  var WIDE = {
    W: 1278, H: 688, S: 0.78, rk: 1, rmin: 2.3, gap: 11, over: 12, apart: 34, semTop: 22, flip: false,
    map: { x: 32, y: 24, w: 1214, h: 350 },
    at: [{ cx: 270, cy: 219 }, { cx: 558, cy: 171 }, { cx: 841, cy: 170 }, { cx: 1066, cy: 266 }],
    lobes: [[208, 190, 'w'], [293, 255, 's'], [370, 216, 'e'], [693, 125, 'w'], [803, 135, 's'], [1080, 212, 'e'], [1003, 262, 'nw'], [918, 300, 'w'], [538, 300, 'w'], [613, 258, 'e']],
    cards: [0, 1, 2, 3].map(function (k) { return { x: 32 + k * 308, y: 424, w: 290, h: 232 }; })
  };
  var TALL = {
    W: 350, H: 876, S: 0.5, rk: 1.2, rmin: 2.1, gap: 8, over: 9, apart: 20, semTop: 34, flip: true, tall: true,
    map: { x: 10, y: 24, w: 330, h: 566 },
    at: [{ cx: 113, cy: 128 }, { cx: 236, cy: 274 }, { cx: 113, cy: 414 }, { cx: 242, cy: 512 }],
    lab: [{ x: 216, y: 44 }, { x: 14, y: 262 }, { x: 222, y: 398 }, { x: 14, y: 534 }],
    cards: [0, 1, 2, 3].map(function () { return { x: 10, y: 626, w: 330, h: 232 }; })
  };

  /** Returns the smallest circle that holds every one of the circles given: { x, y, r }. */
  function ground(nodes) {
    var x = 0, y = 0, it, far, reach;
    function farthest() {
      reach = -1;
      nodes.forEach(function (n) { var d = Math.hypot(n.x - x, n.y - y) + n.r; if (d > reach) { reach = d; far = n; } });
    }
    nodes.forEach(function (n) { x += n.x / nodes.length; y += n.y / nodes.length; });
    for (it = 1; it <= 600; it++) { farthest(); x += (far.x - x) / (it + 1); y += (far.y - y) / (it + 1); }
    farthest();
    return { x: x, y: y, r: reach };
  }

  /** The kit's easing as a function of time, 0 to 1. */
  function ease(t) {
    var u = t, i, x, dx;
    for (i = 0; i < 8; i++) {
      x = 3 * (1 - u) * (1 - u) * u * 0.2 + 3 * (1 - u) * u * u * 0.2 + u * u * u - t;
      dx = 3 * (1 - u) * (1 - u) * 0.2 + 3 * u * u * 0.8;
      if (Math.abs(dx) < 1e-6) break;
      u -= x / dx;
    }
    return 3 * (1 - u) * (1 - u) * u * 0.7 + 3 * (1 - u) * u * u + u * u * u;
  }

  /* ---------- the four task drawings ----------
     Each draws into g with its top left corner at (ox, oy) and lists in cites the papers its
     output cites: { x, y, r, full, stmt }, in reading order. Bars are text and only text; a cited
     paper is a citation mark after the words it supports. Classes say what a thing is before and
     after the reading: ka-b a word; ka-k a word that ends in ink; ka-s a word in ink from the
     start; ka-t and ka-late what only the finished output has; ka-ph what stands in for a real
     word before; ka-c0 a cited paper as a plain dot before, ka-c1 as a numbered mark after. */

  /**
   * Draws one line of text as words (OK.words) and returns them.
   * keys: which words end in ink, counted from the end when negative (a line of one or two
   * words keeps only its last); kind: 's' when those are in ink from the start, 'ph' when the
   * whole line only stands in for a real word.
   */
  function line(g, x, y, w, seed, keys, kind) {
    var tmp = el('g'), bars = Array.prototype.slice.call((tmp.innerHTML = OK.words(x, y, w, seed, 0, BH), tmp.children));
    var ink = (keys || []).map(function (k) { return k >= 0 ? k : bars.length > 2 || k === -1 ? bars.length + k : -1; });
    bars.forEach(function (r, k) {
      r.removeAttribute('fill');
      r.setAttribute('class', 'ka-b' + (kind === 'ph' ? ' ka-ph' : ink.indexOf(k) >= 0 ? (kind === 's' ? ' ka-s' : ' ka-k') : ''));
      g.appendChild(r);
    });
    return bars;
  }
  /** Draws a real word and what stands in for it before the reading (a heading's bar, or words); returns the word's width. */
  function word(g, x, y, text, head) {
    var t = el('text', { x: f(x - 0.4), y: f(y + 4.5), class: 'row ka-t' }, g, text), w = t.getComputedTextLength();
    if (head) el('rect', { x: f(x), y: f(y - 3.5), width: f(w * 0.72), height: 7, rx: 3.5, class: 'ka-b ka-ph' }, g);
    else line(g, x, y, w, text.length * 17, null, 'ph');
    return w;
  }
  /** Returns the markup of a citation mark standing at the origin: the paper's dot with the citation's number in it. */
  function markAt0(n) {
    return '<circle r="' + CR + '" class="dot"/><text y="4.2" text-anchor="middle" class="ka-num">' + n + '</text>';
  }
  /**
   * Draws a citation mark at (x, y): a plain dot before the reading, the numbered mark once the
   * output is written. stmt: the words it supports.
   */
  function cite(g, cites, x, y, stmt) {
    var m = el('g', { class: 'ka-cite' }, g), full;
    el('circle', { cx: f(x), cy: f(y), r: 4, class: 'dot ka-c0' }, m);
    full = el('g', { class: 'ka-c1', transform: 'translate(' + f(x) + ' ' + f(y) + ')' }, m);
    full.innerHTML = markAt0(cites.length + 1);
    cites.push({ x: x, y: y, r: CR, full: full, stmt: stmt || [] });
  }

  /* a review written under three headings; a mark stands right after each phrase that rests on
     a paper, and the line may go on after it. Per line: [length of the text, and when it ends in
     a cited phrase, the length up to which the line goes on after the mark (0: it ends there)] */
  function review(g, ox, oy, cites) {
    var cols = [
      ['Particle size', [[46, 0], [70], [32, 70], [48]]],
      ['Dose', [[70], [46, 0], [64], [38, 0]]],
      ['Duration', [[66], [30, 70], [70], [46, 0]]]
    ];
    cols.forEach(function (C, c) {
      var x = ox + c * 87;
      word(g, x, oy + 21, C[0], true);
      C[1].forEach(function (L, i) {
        var y = oy + 43 + i * 18, has = L.length > 1, bars = line(g, x, y, L[0], 300 + c * 31 + i * 7, has ? [-2, -1] : [], !c && !i ? 's' : '');
        if (!has) return;
        var last = bars[bars.length - 1], mx = Number(last.getAttribute('x')) + Number(last.getAttribute('width')) + 4.5 + CR;
        cite(g, cites, mx, y, bars);
        if (L[1]) line(g, mx + CR + 5.5, y, x + L[1] - (mx + CR + 5.5), 340 + c * 13 + i, []);
      });
    });
  }
  /* two claims nobody has tested yet, each drawn between the two papers it stands between */
  function hypothesis(g, ox, oy, cites) {
    [0, 1].forEach(function (k) {
      var xa = ox + CR + k * 136, xb = xa + 88, xm = xa + 44, my = oy + 12, ym = oy + 61;
      cite(g, cites, xa, my); cite(g, cites, xb, my);
      el('path', { d: [xa, xb].map(function (x) { return 'M' + x + ',' + (my + 12) + ' C' + x + ',' + (my + 32) + ' ' + xm + ',' + (ym - 20) + ' ' + xm + ',' + ym; }).join(' '), class: 'maybe' }, g);
      line(g, xa - CR, oy + 78, 82, 500 + k * 9, [0, 1]);
      line(g, xa - CR, oy + 93, 46, 523 + k * 9, []);
      el('text', { x: xb + CR, y: oy + 99.6, 'text-anchor': 'end', class: 'qm' }, g, '?');
    });
  }
  /* the steps of a plan; a ticked step rests on a paper, whose mark ends its row */
  function planning(g, ox, oy, cites) {
    [['Control group', 150], ['Dose', 122], ['Duration', 178], ['Endpoints', 144], [null, 106]].forEach(function (r, i) {
      var y = oy + 9 + i * 22, x = ox + 22;
      el('rect', { x: ox + 0.6, y: y - 5.5, width: 11, height: 11, rx: 2.6, class: 'box' + (i ? r[0] ? ' ka-bx' : '' : ' on') }, g);
      if (r[0]) el('path', { d: 'M' + (ox + 3.2) + ',' + f(y + 0.3) + ' l2.3,2.3 l3.6,-4.8', class: 'tick' + (i ? ' ka-late' : '') }, g);
      if (r[0]) x += word(g, x, y, r[0]) + 7;
      var bars = line(g, x, y, ox + r[1] - x, 610 + i * 5, []);
      if (r[0]) cite(g, cites, ox + r[1] + 6 + CR, y, bars);
    });
  }
  /* a result of one's own (the ring), read against the results of papers: each point is a cited paper */
  function reading(g, ox, oy, cites) {
    var x0 = ox + 0.6, yb = oy + 96, ux = x0 + 28, uy = yb - 64;
    el('path', { d: 'M' + x0 + ',' + (oy + 17) + ' V' + yb + ' H' + (ox + DW), class: 'axis' }, g);
    el('text', { x: ox - 0.4, y: oy + 7, class: 'note ka-t' }, g, 'Growth');
    el('text', { x: ox + DW, y: yb + 16.5, 'text-anchor': 'end', class: 'note ka-t' }, g, 'Food intake');
    [[34, 20], [80, 35], [124, 27], [170, 53], [216, 66]].forEach(function (p) { cite(g, cites, x0 + p[0], yb - p[1]); });
    el('circle', { cx: ux, cy: uy, r: 5.5, class: 'ka-own' }, g);
    line(g, ux + 13, uy, 46, 77, null, 'ph');
    el('text', { x: ux + 12.5, y: uy + 4.5, class: 'row ka-t' }, g, 'Your result');
  }

  /* ---------- the picture ---------- */
  /**
   * Builds the picture for one arrangement.
   * G: WIDE or TALL; stage: the element the SVG goes into; ui: { waiting(bool) };
   * first: the task that is chosen from the start, or -1.
   * Returns { choose(k), view(name), replay(), point(x, y), destroy(), cards }; choose and replay
   * return how long the reading they start lasts, in ms (0 when nothing plays).
   */
  function Picture(G, stage, ui, first) {
    var M = G.map, svg = el('svg', { viewBox: '0 0 ' + G.W + ' ' + G.H, role: 'img', 'aria-labelledby': 'ka-title' }, stage);
    el('title', { id: 'ka-title' }, svg, 'The 212 kept papers as one map, shown as a citation network in four topics or as a semantic map of ten sub-topics. Below it four tasks: literature review, hypothesis generation, experiment planning and results interpretation. For the chosen task every paper on the map is read, the papers that hold relevant passages are ringed, and the statements of the output are tied by lines to the papers they rest on.');
    var gGround = el('g', {}, svg), gEdge = el('g', {}, svg), gDot = el('g', {}, svg), gMark = el('g', { class: 'ka-marks' }, svg);
    var gLab = el('g', {}, svg), gSub = el('g', {}, svg), gCard = el('g', {}, svg), gFly = el('g', {}, svg);
    var state = { v: 0, view: 'net', task: 0 }, rv = OK.reveal(), kept = [], tw = 0, hot = -1, dead = false;

    /* -- the papers, in both views -- */
    var G0 = MAP.topics.map(function (T) { return ground(T.nodes); });
    var papers = [], base = [], edges = [], org = [];
    MAP.topics.forEach(function (T, t) {
      var A = G.at[t];
      A.r = G0[t].r * G.S + PAD;
      org[t] = { x: A.cx - G0[t].x * G.S, y: A.cy - G0[t].y * G.S };
      base[t] = papers.length;
      T.nodes.forEach(function (m) {
        papers.push({ t: t, seed: !!m.seed, r: Math.max(G.rmin, m.r * G.S * G.rk), n: { x: org[t].x + m.x * G.S, y: org[t].y + m.y * G.S }, x: 0, y: 0 });
      });
      T.links.forEach(function (l) { edges.push({ a: papers[base[t] + l[0]], b: papers[base[t] + l[1]] }); });
    });
    MAP.between(org, G.S).forEach(function (c) { edges.push({ a: papers[base[c[0]] + c[1]], b: papers[base[c[2]] + c[3]] }); });

    // the semantic map: OK.semantic says which sub-topic a paper belongs to and roughly where it
    // stands; here a sub-topic's papers gather evenly round its middle, the sub-topics of one
    // topic touch, and topics stand apart
    var SEM = OK.semantic(), lobes = [], touch = [];
    function toBox(x, y) {
      return G.flip ? { x: M.x + (y / SEM.h) * M.w, y: M.y + (x / SEM.w) * M.h } : { x: M.x + (x / SEM.w) * M.w, y: M.y + (y / SEM.h) * M.h };
    }
    SEM.topics.forEach(function (T, t) {
      var mine = T.lobes.map(function (L) {
        var hand = G.lobes && G.lobes[lobes.length], o = { t: t, name: L.name, g: hand ? { x: hand[0], y: hand[1] } : toBox(L.x, L.y), side: hand && hand[2], pts: [] };
        lobes.push(o);
        return o;
      });
      T.pts.forEach(function (p) {
        var L = T.lobes[p.lobe], o = mine[p.lobe], P = papers[base[t] + p.i], dx = (p.x - L.x) * 0.4, dy = (p.y - L.y) * 0.4;
        P.o = G.flip ? { x: dy, y: dx } : { x: dx, y: dy };
        P.lobe = o; o.pts.push(P);
      });
      // a spanning tree over the topic's sub-topics: each touches its nearest
      var inTree = [mine[0]], rest = mine.slice(1);
      while (rest.length) {
        var bestD = 1e9, pair = null;
        inTree.forEach(function (p) { rest.forEach(function (q) { var d = Math.hypot(p.g.x - q.g.x, p.g.y - q.g.y); if (d < bestD) { bestD = d; pair = [p, q]; } }); });
        touch.push(pair); inTree.push(pair[1]); rest.splice(rest.indexOf(pair[1]), 1);
      }
    });
    lobes.forEach(function (o) {
      for (var it = 0; it < 300; it++) {
        o.pts.forEach(function (P) { P.o.x *= 0.97; P.o.y *= 0.97; });
        for (var a = 0; a < o.pts.length; a++) for (var b = a + 1; b < o.pts.length; b++) {
          var p = o.pts[a], q = o.pts[b], dx = q.o.x - p.o.x, dy = q.o.y - p.o.y, d = Math.hypot(dx, dy) || 0.01, want = p.r + q.r + G.gap;
          if (d >= want) continue;
          var mv = (want - d) / d * 0.5;
          p.o.x -= dx * mv; p.o.y -= dy * mv; q.o.x += dx * mv; q.o.y += dy * mv;
        }
      }
      var c = ground(o.pts.map(function (P) { return { x: P.o.x, y: P.o.y, r: P.r }; }));
      o.pts.forEach(function (P) { P.o.x -= c.x; P.o.y -= c.y; });
      o.g.r = c.r + PAD;
    });
    (function settle() {
      function pull(p, q, want, both) {
        var dx = q.g.x - p.g.x, dy = q.g.y - p.g.y, d = Math.hypot(dx, dy) || 0.01;
        if (!both && d >= want) return;
        var mv = (want - d) / d * 0.25;
        p.g.x -= dx * mv; p.g.y -= dy * mv; q.g.x += dx * mv; q.g.y += dy * mv;
      }
      for (var it = 0; it < 500; it++) {
        touch.forEach(function (l) { pull(l[0], l[1], l[0].g.r + l[1].g.r - G.over, true); });
        for (var a = 0; a < lobes.length; a++) for (var b = a + 1; b < lobes.length; b++) {
          var p = lobes[a], q = lobes[b];
          if (touch.some(function (l) { return (l[0] === p && l[1] === q) || (l[0] === q && l[1] === p); })) continue;
          pull(p, q, p.g.r + q.g.r + (p.t === q.t ? -G.over : G.apart), false);
        }
        lobes.forEach(function (o) {
          o.g.x = Math.max(M.x + o.g.r, Math.min(M.x + M.w - o.g.r, o.g.x));
          o.g.y = Math.max(M.y + o.g.r + G.semTop, Math.min(M.y + M.h - o.g.r, o.g.y));
        });
      }
    })();
    lobes.forEach(function (o) {
      o.pts.forEach(function (P) { P.s = { x: o.g.x + P.o.x, y: o.g.y + P.o.y }; });
      o.el = el('circle', { class: 'ground' }, gGround);
    });
    edges.forEach(function (e) { e.el = el('line', { class: 'edge' }, gEdge); });
    papers.forEach(function (p) {
      if (p.seed) { p.ring = el('circle', { r: f(p.r + 3), class: 'ring' }, gDot); p.el = el('circle', { r: f(p.r), class: 'core' }, gDot); }
      else p.el = el('circle', { r: f(p.r), class: 'dot' }, gDot);
    });
    var front = el('line', { x1: M.x - 6, x2: M.x - 6, y1: M.y - 14, y2: M.y + M.h + 14, class: 'ka-front' }, gDot);

    /* -- names: a topic's name moves with its topic; a sub-topic's name shows in the semantic map -- */
    var taken = [], named = [];                    // the room names take: in the semantic map, in the network
    function hitsGround(b, c) { var nx = Math.max(b.x, Math.min(c.x, b.x + b.w)), ny = Math.max(b.y, Math.min(c.y, b.y + b.h)); return Math.hypot(nx - c.x, ny - c.y) < c.r + 3; }
    function clear(b) {
      return b.x >= 16 && b.x + b.w <= G.W - 16 && b.y >= M.y - 24 && b.y + b.h <= M.y + M.h + 30 &&
        !lobes.some(function (o) { return hitsGround(b, o.g); }) &&
        !taken.some(function (t) { return b.x < t.x + t.w && t.x < b.x + b.w && b.y < t.y + t.h && t.y < b.y + b.h; });
    }
    /** Finds a name its place beside one of the grounds given, trying the sides in order; returns the left end of its baseline. */
    function beside(grounds, w, h, sides) {
      var first = null, found = null;
      grounds.forEach(function (c) {
        sides.split(' ').forEach(function (side) {
          var k = c.r * 0.72, at = side === 'n' ? { x: c.x - w / 2, y: c.y - c.r - 7 - (h - 15) } : side === 's' ? { x: c.x - w / 2, y: c.y + c.r + 16 } :
            side === 'e' ? { x: c.x + c.r + 8, y: c.y + 4.5 } : side === 'w' ? { x: c.x - c.r - 8 - w, y: c.y + 4.5 } :
            side === 'ne' ? { x: c.x + k + 5, y: c.y - k - 3 - (h - 15) } : side === 'nw' ? { x: c.x - k - 5 - w, y: c.y - k - 3 - (h - 15) } :
            side === 'se' ? { x: c.x + k + 5, y: c.y + k + 12 } : { x: c.x - k - 5 - w, y: c.y + k + 12 };
          at.box = { x: at.x - 4, y: at.y - 12, w: w + 8, h: h - 1 };
          first = first || at;
          if (!found && clear(at.box)) found = at;
        });
      });
      found = found || first;
      taken.push(found.box);
      return found;
    }
    var topicLabs = MAP.topics.map(function (T, t) {
      var g = el('g', {}, gLab), tx = el('text', { class: 'topic' }, g), parts = T.name.split(' '), cut = G.tall ? Math.ceil(parts.length / 2) : parts.length;
      el('tspan', { x: 0 }, tx, parts.slice(0, cut).join(' '));
      if (cut < parts.length) el('tspan', { x: 0, dy: 17 }, tx, parts.slice(cut).join(' '));
      el('tspan', { class: 'c', dx: 7 }, tx, String(T.n));
      var w = tx.getBBox().width, A = G.at[t];
      var own = lobes.filter(function (o) { return o.t === t; }).map(function (o) { return o.g; }).sort(function (p, q) { return (p.y - p.r) - (q.y - q.r); });
      var n = G.lab ? G.lab[t] : { x: A.cx - w / 2, y: A.cy - A.r - 7 };
      named.push({ x: n.x - 4, y: n.y - 12, w: w + 8, h: G.tall ? 31 : 14 });
      return { g: g, n: n, s: beside(own, w, G.tall ? 32 : 15, 'n nw ne w e') };
    });
    // a sub-topic's name stands on the side of its ground that faces away from the rest of its
    // topic; on a phone sub-topics go unnamed
    lobes.forEach(function (o) {
      if (G.tall) return;
      var own = lobes.filter(function (q) { return q.t === o.t; }), mx = 0, my = 0;
      own.forEach(function (q) { mx += q.g.x / own.length; my += q.g.y / own.length; });
      var h = o.g.x >= mx ? 'e' : 'w', h2 = h === 'e' ? 'w' : 'e', up = o.g.y < my;
      var order = up ? ['n', h, 'n' + h, h2, 'n' + h2, 's' + h, 's'] : [h, h2, 's' + h, 's' + h2, 'n' + h, 's', 'n'];
      var tx = el('text', { class: 'note ka-sub' }, gSub, o.name), at = beside([o.g], tx.getComputedTextLength(), 15, o.side || order.join(' '));
      tx.setAttribute('x', f(at.x)); tx.setAttribute('y', f(at.y));
    });

    /** Puts every paper, ground, citation and name where it stands at v: 0 the network, 1 the semantic map. */
    function apply(v) {
      state.v = v;
      papers.forEach(function (p) {
        p.x = p.n.x + (p.s.x - p.n.x) * v; p.y = p.n.y + (p.s.y - p.n.y) * v;
        var x = f(p.x), y = f(p.y);
        p.el.setAttribute('cx', x); p.el.setAttribute('cy', y);
        if (p.ring) { p.ring.setAttribute('cx', x); p.ring.setAttribute('cy', y); }
        if (p.mark) { p.mark.halo.setAttribute('transform', 'translate(' + x + ' ' + y + ')'); p.mark.g.setAttribute('transform', 'translate(' + x + ' ' + y + ')'); }
      });
      lobes.forEach(function (o) {
        var A = G.at[o.t];
        o.el.setAttribute('cx', f(A.cx + (o.g.x - A.cx) * v)); o.el.setAttribute('cy', f(A.cy + (o.g.y - A.cy) * v)); o.el.setAttribute('r', f(A.r + (o.g.r - A.r) * v));
      });
      var eo = Math.max(0, 1 - v * 2.6);
      gEdge.style.opacity = eo; gEdge.style.display = eo ? '' : 'none';
      if (eo) edges.forEach(function (e) { e.el.setAttribute('x1', f(e.a.x)); e.el.setAttribute('y1', f(e.a.y)); e.el.setAttribute('x2', f(e.b.x)); e.el.setAttribute('y2', f(e.b.y)); });
      topicLabs.forEach(function (L) { L.g.setAttribute('transform', 'translate(' + f(L.n.x + (L.s.x - L.n.x) * v) + ' ' + f(L.n.y + (L.s.y - L.n.y) * v) + ')'); });
      var so = Math.max(0, (v - 0.85) / 0.15);
      gSub.style.opacity = so; gSub.style.display = so ? '' : 'none';
    }

    /* -- the task cards -- */
    var meter = document.createElement('canvas').getContext('2d');
    meter.font = '400 12.5px Hanken';
    function wrap(text, width) {
      var out = [], cur = '';
      text.split(' ').forEach(function (w) {
        if (cur && meter.measureText(cur + ' ' + w).width > width) { out.push(cur); cur = w; } else cur = cur ? cur + ' ' + w : w;
      });
      out.push(cur);
      return out;
    }
    var cards = TASKS.map(function (T, k) {
      var R = G.cards[k], g = el('g', { class: 'ka-task', 'data-k': k, 'data-on': k === first ? '1' : '0' }, gCard), ox = R.x + 23, oy = R.y + 24;
      el('rect', { x: R.x + 0.5, y: R.y + 0.5, width: R.w - 1, height: R.h - 1, rx: 12.5, class: 'card ka-edge' }, g);
      var body = el('g', {}, g), cites = [];
      T.draw(body, ox, oy, cites);
      var mark = el('rect', { class: 'mark ka-chosen' }, g), name = el('text', { x: ox - 0.8, y: R.y + 171, class: 'task' }, g, OK.DATA.tasks[k]);
      mark.setAttribute('x', f(ox - 6)); mark.setAttribute('y', R.y + 152); mark.setAttribute('width', f(name.getComputedTextLength() + 12)); mark.setAttribute('height', 25);
      var ask = el('text', { class: 'note ka-ask' }, g);
      wrap('“' + T.ask + '”', R.w - 46).forEach(function (l, i) { el('tspan', { x: ox - (i ? 0.2 : 5.4), y: R.y + 194 + i * 17 }, ask, l); });
      var words = Array.prototype.slice.call(body.querySelectorAll('.ka-b:not(.ka-ph)')).map(function (e) { return { el: e, key: /ka-k|ka-s/.test(e.getAttribute('class')) }; });
      var late = Array.prototype.slice.call(body.querySelectorAll('.ka-t, .ka-late, .ka-ph'));
      return { g: g, R: R, cites: cites, words: words, late: late, cited: null, rel: null };
    });

    /* -- the papers a task rests on -- */
    function ringR(p) { return Math.max(p.r + 1.6, 4.8); }
    // how far a citation mark standing on a paper would stay clear of the papers round it and of
    // the names, in the worse of the two views
    papers.forEach(function (p) {
      p.room = 1e9;
      ['n', 's'].forEach(function (v) {
        papers.forEach(function (q) { if (q !== p) p.room = Math.min(p.room, Math.hypot(q[v].x - p[v].x, q[v].y - p[v].y) - (q.seed ? q.r + 3 : q.r) - CR); });
        (v === 'n' ? named : taken).forEach(function (b) {
          p.room = Math.min(p.room, Math.hypot(Math.max(b.x - p[v].x, 0, p[v].x - b.x - b.w), Math.max(b.y - p[v].y, 0, p[v].y - b.y - b.h)) - CR);
        });
      });
    });
    /**
     * Gives every citation mark of task k its paper, the same in both views, and returns the
     * papers: from all four topics, each a paper with room for a mark (never a seed or a hub),
     * apart from one another, numbered across the network (down it on a phone).
     */
    function cited(k) {
      var C = cards[k];
      if (C.cited) return C.cited;
      var R = OK.prng(911 + k * 37), out = [];
      function apart(p) {
        var d = 1e9;
        out.forEach(function (q) { d = Math.min(d, Math.hypot(p.n.x - q.n.x, p.n.y - q.n.y), Math.hypot(p.s.x - q.s.x, p.s.y - q.s.y)); });
        return d;
      }
      TASKS[k].from.forEach(function (n, t) {
        for (var i = 0; i < n; i++) {
          var best = null, score = -1e9;
          papers.forEach(function (p) {
            if (p.t !== t || p.seed || p.r > 6 || out.indexOf(p) >= 0) return;
            var s = Math.min(p.room, 6) * 24 + Math.min(apart(p), 120) * 0.4 + R() * 14;
            if (s > score) { score = s; best = p; }
          });
          out.push(best);
        }
      });
      out.sort(function (p, q) { return G.tall ? p.n.y - q.n.y : p.n.x - q.n.x; });
      C.cites.forEach(function (m, i) { m.p = out[i]; });
      return (C.cited = out);
    }
    /** Returns the papers that hold something relevant to task k: the cited ones, and others across the whole map. */
    function relevant(k) {
      var C = cards[k];
      if (C.rel) return C.rel;
      var R = OK.prng(700 + k * 53), set = cited(k).slice(), tries = 0;
      function reach(p) { return set.indexOf(p) < C.cites.length && set.indexOf(p) >= 0 ? CR : ringR(p); }
      function near(p, q) { var need = ringR(p) + reach(q) + 5; return Math.hypot(p.n.x - q.n.x, p.n.y - q.n.y) < need || Math.hypot(p.s.x - q.s.x, p.s.y - q.s.y) < need; }
      var pool = papers.filter(function (p) { return !p.seed && set.indexOf(p) < 0; });
      while (set.length < TASKS[k].hold && pool.length) {
        var p = pool.splice(Math.floor(R() * pool.length), 1)[0];
        if (++tries < 400 && set.some(function (q) { return near(p, q); })) continue;
        set.push(p);
      }
      return (C.rel = set);
    }
    /** Marks the papers of task k on the map: a ring on each that holds something relevant, the numbered mark on each cited one. */
    function marks(k) {
      gMark.textContent = '';
      papers.forEach(function (p) { p.mark = null; });
      var C = cards[k], set = relevant(k), halos = el('g', {}, gMark), tops = el('g', {}, gMark);
      set.forEach(function (p) {
        var n = C.cited.indexOf(p), at = 'translate(' + f(p.x) + ' ' + f(p.y) + ')';
        var h = el('circle', { r: f((n < 0 ? ringR(p) : CR) + 2.2), class: 'ka-halo', transform: at }, halos), g = el('g', { transform: at }, tops);
        if (n < 0) el('circle', { r: f(ringR(p)), class: 'ka-ring' }, g);
        else { g.innerHTML = markAt0(n + 1); C.cites[n].twin = g; }
        p.mark = { halo: h, g: g };
      });
    }
    /**
     * Brings out the citation whose mark stands under the point (x, y) of the picture, on the map
     * or in the card: both its marks take a heavier outline. None when no mark stands there.
     */
    function point(x, y) {
      var C = cards[state.task], hit = -1;
      C.cites.forEach(function (m, i) {
        if (m.twin && (Math.hypot(x - m.x, y - m.y) <= m.r + 2 || Math.hypot(x - m.p.x, y - m.p.y) <= m.r + 2)) hit = i;
      });
      if (hit === hot) return;
      hot = hit;
      C.cites.forEach(function (m, i) { m.full.classList.toggle('ka-hot', i === hit); if (m.twin) m.twin.classList.toggle('ka-hot', i === hit); });
    }

    /* -- the reading -- */
    function keep(a) { kept.push(a); return a; }
    /** The way a mark takes from (a.x, a.y) down to (b.x, b.y): one curve, upright where it leaves and where it arrives. */
    function curve(a, b) {
      var h = (b.y - a.y) / 2;
      return function (u) {
        var v = 1 - u, bx = 3 * v * u * u + u * u * u, by = 3 * v * v * u * h + 3 * v * u * u * h + u * u * u * 2 * h;
        return { x: a.x + (b.x - a.x) * bx, y: a.y + by };
      };
    }
    /** Returns n + 1 points at equal steps along a curve, and its length as len. */
    function along(c, n) {
      var P = [], L = [0], out = [], i, j = 0;
      for (i = 0; i <= 60; i++) { P.push(c(i / 60)); if (i) L.push(L[i - 1] + Math.hypot(P[i].x - P[i - 1].x, P[i].y - P[i - 1].y)); }
      for (i = 0; i <= n; i++) {
        var d = L[60] * i / n;
        while (j < 59 && L[j + 1] < d) j++;
        var u = (d - L[j]) / (L[j + 1] - L[j] || 1);
        out.push({ x: P[j].x + (P[j + 1].x - P[j].x) * u, y: P[j].y + (P[j + 1].y - P[j].y) * u });
      }
      out.len = L[60];
      return out;
    }
    function stop() {
      rv.cancel();
      kept.forEach(function (a) { a.cancel(); });
      kept = [];
      gFly.textContent = '';
    }
    /** Plays the reading for the chosen task over the finished picture; returns how long it lasts, in ms. */
    function play() {
      stop();
      if (OK.still) return 0;
      var C = cards[state.task], X0 = M.x - 6, span = M.w + 12;
      keep(front.animate([{ opacity: 1, transform: 'translateX(0px)' }, { opacity: 1, transform: 'translateX(' + span + 'px)' }], { duration: T_SWEEP, easing: 'linear' }));
      papers.forEach(function (p) {
        p.at = (p.x - X0) / span * T_SWEEP;
        keep((p.ring || p.el).animate([{ fill: INK }, { fill: INK }], { delay: p.at, duration: 300 }));
        if (!p.mark) return;
        rv.fade(p.mark.halo, p.at + 150, 220); rv.fade(p.mark.g, p.at + 150, 220);
      });
      // a cited paper becomes its mark once it is read; a copy of the mark then leaves it and
      // travels to its place in the text
      var last = T_SWEEP + 300;
      C.cites.forEach(function (m, i) {
        var pts = along(curve(m.p, m), 24), t = m.p.at + 420, dur = 640 + pts.len * 0.55, e = el('g', { class: 'ka-fly' }, gFly);
        e.innerHTML = markAt0(i + 1);
        keep(e.animate(pts.map(function (q) { return { opacity: 1, transform: 'translate(' + f(q.x) + 'px,' + f(q.y) + 'px)' }; }), { delay: t, duration: dur, easing: FLY }));
        rv.fade(m.full, t + dur - 30, 90);
        m.stmt.forEach(function (b) { b.land = t + dur - 80; });
        last = Math.max(last, t + dur);
      });
      // the text is written as the front crosses the map; the words a mark supports, as it arrives
      var tK = last + 260, over = tK;
      C.words.forEach(function (W, i) {
        var t = W.el.land || 250 + i / Math.max(1, C.words.length - 1) * (T_SWEEP + 300);
        if (!W.key) { rv.from(W.el, [{ fill: PALE }, { fill: BAR }], t, 160); return; }
        var end = tK + 320 + (i % 5) * 30, a = t / end;
        over = Math.max(over, end);
        rv.from(W.el, [{ fill: PALE, offset: 0 }, { fill: PALE, offset: a }, { fill: BAR, offset: Math.min(a + 0.03, 0.9) }, { fill: BAR, offset: (end - 320) / end }, { fill: INK, offset: 1 }], 0, end, 'linear');
      });
      C.late.forEach(function (e, i) {
        var ph = /ka-ph/.test(e.getAttribute('class'));
        if (ph) keep(e.animate([{ opacity: 1 }, { opacity: 1, offset: 0.9 }, { opacity: 0 }], { duration: tK + i * 20, fill: 'backwards' }));
        else rv.fade(e, tK + i * 20, 320);
        over = Math.max(over, tK + i * 20 + (ph ? 0 : 320));
      });
      return over;
    }

    /** Ends a move between the two views at once, every paper where it was going. */
    function rest() {
      if (!tw) return;
      cancelAnimationFrame(tw); tw = 0;
      apply(state.view === 'sem' ? 1 : 0);
    }
    /** Chooses task k: its relevant and its cited papers are marked, and the reading plays. */
    function choose(k) {
      stop(); rest(); point(-1e9, -1e9);
      state.task = k;
      cards.forEach(function (c, i) { c.g.setAttribute('data-on', i === k ? '1' : '0'); });
      marks(k);
      ui.waiting(false);
      return play();
    }
    /** Shows the map as 'net' or 'sem'; every paper moves to its place, marked papers stay marked. */
    function view(name) {
      var to = name === 'sem' ? 1 : 0, from = state.v, t0 = performance.now();
      state.view = name;
      stop();
      cancelAnimationFrame(tw); tw = 0;
      if (OK.still) { apply(to); return; }
      (function step() {
        var u = Math.min(1, (performance.now() - t0) / 900);
        apply(from + (to - from) * ease(u));
        tw = u < 1 && !dead ? requestAnimationFrame(step) : 0;
      })();
    }

    apply(0);
    marks(0);
    return {
      cards: cards, choose: choose, view: view, replay: play, point: point,
      destroy: function () { dead = true; stop(); cancelAnimationFrame(tw); }
    };
  }

  /* ---------- the section ---------- */
  function mount(root) {
    var head = OK.h('div', { class: 'sec-head' }, root);
    OK.h('h2', { class: 'sec-h' }, head, 'A mapped knowledge corpus, ready to power your research');
    OK.h('p', { class: 'sec-p' }, head, 'The papers that pass stand as a citation network or by topic. For a literature review, a hypothesis, an experiment plan or a reading of your results, every paper is read and each statement cites its source.');
    var frame = OK.h('div', { class: 'frame pic ka' }, root), top = OK.h('div', { class: 'ka-top' }, frame);
    var sw = OK.h('div', { class: 'k-switch', role: 'group', 'aria-label': 'How the map is drawn' }, top);
    var views = [['net', 'Citation network'], ['sem', 'Semantic map']].map(function (v, i) {
      var b = OK.h('button', { type: 'button', 'aria-pressed': String(!i) }, sw, v[1]);
      b.addEventListener('click', function () { views.forEach(function (o) { o.setAttribute('aria-pressed', String(o === b)); }); state.view = v[0]; pic.view(v[0]); defer(QUIET); });
      return b;
    });
    var seen = OK.h('div', { class: 'ka-seen' }, frame), stage = OK.h('div', { class: 'ka-stage' }, frame), pick = OK.h('div', { class: 'k-switch ka-pick', role: 'group', 'aria-label': 'Task' }, frame);
    var state = { view: 'net', task: 0, arrived: OK.still }, pic = null, hits = [], picks = [];
    var narrow = window.matchMedia('(max-width: 760px)'), G = null;
    var ui = { waiting: function (on) { frame.classList.toggle('ka-wait', on); } };

    /* The rotation: while the reader leaves the picture alone, the next task is chosen by itself
       DWELL after a reading has finished, round the four. turn.at is the earliest moment that may
       happen; whatever makes the rotation wait moves it later, and the one timer looks again when
       it runs out. The rotation waits while the part of the map that starts the first reading
       (ka-seen) is out of the window, the tab is hidden or keyboard focus is inside the frame, and
       for DWELL after each of these ends and after the pointer last moved or pressed over the
       frame (a pointer that only rests there does not hold it); it waits for QUIET after the
       reader switches the map, and ends for good once the reader chooses a task. With OK.still
       there is none. */
    var turn = { on: !OK.still && 'IntersectionObserver' in window, at: 0, timer: 0, seen: false, sx: -1, sy: -1 }, watch = null;
    function held() { return !state.arrived || !turn.seen || document.hidden || !!frame.querySelector(':focus-visible'); }
    /** Keeps the rotation from choosing the next task for another ms from now. */
    function defer(ms) {
      if (!turn.on) return;
      turn.at = Math.max(turn.at, performance.now() + ms);
      if (!turn.timer) turn.timer = setTimeout(due, turn.at - performance.now());
    }
    /** Chooses the next task when nothing holds the rotation and its moment has come; waits out the rest when it was moved later. */
    function due() {
      var left = turn.at - performance.now();
      turn.timer = 0;
      if (!turn.on || held()) return;
      if (left > 0) turn.timer = setTimeout(due, left);
      else choose((state.task + 1) % TASKS.length);
    }
    /** Makes the rotation wait for a pointer that moves or presses over the frame; the page scrolling under a resting pointer is no move. */
    function touched(e) {
      if (e.type === 'pointermove' && e.screenX === turn.sx && e.screenY === turn.sy) return;
      turn.sx = e.screenX; turn.sy = e.screenY;
      defer(DWELL);
    }
    /** Starts the wait again when the tab is shown again or focus leaves the frame. */
    function resume() { if (!document.hidden) defer(DWELL); }

    function pressed() {
      hits.concat(picks).forEach(function (b) { b.setAttribute('aria-pressed', String(Number(b.getAttribute('data-k')) === state.task)); });
    }
    /** Chooses task k and plays its reading; the rotation waits until the reading has stood for DWELL. */
    function choose(k) { state.task = k; pressed(); defer(pic.choose(k) + DWELL); }
    /** The reader's own choice of task k: it stands, so the rotation ends. */
    function byHand(k) { turn.on = false; clearTimeout(turn.timer); choose(k); }
    /** Draws the picture in the arrangement the window asks for; does nothing while that arrangement stands. */
    function build() {
      var next = narrow.matches ? TALL : WIDE;
      if (next === G) return;
      G = next;
      if (pic) pic.destroy();
      stage.textContent = ''; pick.textContent = '';
      frame.classList.remove('ka-tall');
      hits = TASKS.map(function (T, k) {
        var R = G.cards[k], b = OK.h('button', { type: 'button', class: 'ka-hit', 'data-k': k, 'aria-label': OK.DATA.tasks[k] + ': ' + T.ask }, stage);
        b.style.cssText = 'left:' + (R.x / G.W * 100) + '%;top:' + (R.y / G.H * 100) + '%;width:' + (R.w / G.W * 100) + '%;height:' + (R.h / G.H * 100) + '%';
        b.addEventListener('click', function () { byHand(k); });
        return b;
      });
      picks = TASKS.map(function (T, k) {
        var b = OK.h('button', { type: 'button', 'data-k': k }, pick, OK.DATA.tasks[k]);
        b.addEventListener('click', function () { byHand(k); });
        return b;
      });
      pic = Picture(G, stage, ui, state.arrived ? state.task : -1);
      frame.classList.toggle('ka-tall', !!G.tall);
      pressed();
      ui.waiting(!state.arrived);
      if (state.view === 'sem') { var still = OK.still; OK.still = true; pic.view('sem'); OK.still = still; }
      if (state.arrived) choose(state.task);
    }
    function replay() { if (state.arrived) defer(pic.replay() + DWELL); }
    /** Tells the picture where the pointer stands in it, so that a citation under it and its twin come out. */
    function pointer(e) {
      var box = stage.querySelector('svg').getBoundingClientRect();
      if (state.arrived) pic.point((e.clientX - box.left) / box.width * G.W, (e.clientY - box.top) / box.height * G.H);
    }
    function pointerOut() { if (state.arrived) pic.point(-1e9, -1e9); }
    stage.addEventListener('pointermove', pointer);
    stage.addEventListener('pointerleave', pointerOut);
    build();
    OK.onArrive(seen, function () { state.arrived = true; choose(state.task); });
    narrow.addEventListener('change', build);
    window.addEventListener('ok:replay', replay);
    if (turn.on) {
      watch = new IntersectionObserver(function (es) { turn.seen = es[es.length - 1].isIntersecting; if (turn.seen) defer(DWELL); }, { threshold: 0.3 });
      watch.observe(seen);
      document.addEventListener('visibilitychange', resume);
      frame.addEventListener('focusout', resume);
      frame.addEventListener('pointermove', touched);
      frame.addEventListener('pointerdown', touched);
    }
    return {
      destroy: function () {
        turn.on = false; clearTimeout(turn.timer);
        if (watch) watch.disconnect();
        document.removeEventListener('visibilitychange', resume);
        narrow.removeEventListener('change', build); window.removeEventListener('ok:replay', replay);
        if (pic) pic.destroy();
      }
    };
  }

  OK.section('knowledge', 'a', { label: 'Map above, four tasks below', mount: mount });
})();
