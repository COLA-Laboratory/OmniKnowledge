/* The Robust section: one small citation network drawn three times. Each drawing is traced from
   three other seed papers, a fixed number of citations out, and finds nearly the same papers: a
   few at the fringe stay unreached, other ones each time.
   On a wide window the three stand side by side in one drawing; on a narrow one each is its own
   drawing. README.md owns the drawing language. */
(function () {
  'use strict';
  var OK = window.OK, f = OK.f;
  var HEAD = 'Start from different papers. Arrive at the same literature.';
  var TEXT = 'Papers on one question cite each other. Tracing from any few of them reaches the same neighbourhood, so the result does not hinge on which papers you happened to start with.';
  // The network. at: [x, y, r] of each paper from the network's middle; links: the citations; w, h: its box.
  var NET = {
    w: 355, h: 154,
    at: [[-145, -4.5, 5.8], [-82, 0, 6.6], [-4, -23.5, 6.2], [89, 16.5, 6.6], [-27, -74, 3.6], [-53.5, -64, 2.7], [0, 15.5, 2.7], [119.5, 28.5, 2.5], [-47, -36.5, 3],
      [-54.5, 67.5, 4.1], [-27, 4.5, 3.6], [21, 73.5, 4.1], [-131.5, 60, 3.4], [139.5, -8, 4.6], [-113, 21.5, 2.7], [-106.5, 51, 2.6], [34, 38.5, 3.3], [-109, -45.5, 3.2],
      [50, 11.5, 2.6], [148.5, 21.5, 2.5], [-4.5, -60, 2.5], [60.5, -12.5, 2.7], [97, -60.5, 3], [63, 49.5, 2.2], [-170, -33, 2.5], [-77.5, -33, 2.5], [-146.5, 27, 2.5],
      [-175, -5.5, 2.6], [110, -23.5, 2.2], [33, -25, 2.4], [96, 52, 2.3], [82.5, -23, 2.6], [-54, 13, 2.6], [175, -2.5, 2.6], [-10, 60, 2.6], [-74.5, 40.5, 2.3],
      [-110.5, -10.5, 2.6], [-32, 33, 2.2], [7.5, 40, 2.5], [-174, 22.5, 2.3], [26.5, -51.5, 2.4], [67.5, -50.5, 2.7], [20.5, -2.5, 2.2], [-138.5, -45.5, 2.3]],
    links: [[1, 0], [2, 1], [3, 2], [4, 2], [5, 4], [6, 2], [7, 3], [8, 2], [8, 1], [9, 1], [10, 9], [10, 1], [11, 9], [11, 3], [12, 0], [13, 3], [14, 1], [15, 12], [16, 2],
      [16, 3], [17, 0], [17, 1], [18, 3], [19, 13], [20, 4], [21, 3], [22, 13], [23, 3], [24, 0], [25, 1], [26, 0], [27, 0], [28, 13], [29, 2], [30, 3], [31, 3], [32, 1],
      [33, 13], [34, 11], [35, 9], [36, 1], [37, 10], [38, 11], [39, 0], [40, 2], [41, 22], [42, 2], [43, 0]]
  };
  var STARTS = [[0, 4, 22], [2, 9, 13], [11, 12, 17]];   // the seed papers of each drawing
  var WORDS = ['Start from these papers', 'Or from these', 'Or from these'];
  var HOPS = 3;                                     // how many citations a trace follows out from a seed
  var CORE = 5;                                   // the least radius of a seed's core
  var WORD = 52, GAP = 28, FOOT = 40;               // a word's baseline; from it to its network's top; under the network
  var HOP = 560;                                    // the reveal: from one hop to the next, in ms

  function el(tag, attrs, parent, text) { return OK.svg(tag, attrs, parent, text); }
  function group(parent, html) { var g = el('g', {}, parent); if (html) g.innerHTML = html; return g; }
  /** Returns how many citations each paper is from the nearest of the seeds; -1 for a paper further than HOPS. */
  function reach(seeds) {
    var hop = NET.at.map(function () { return -1; }), queue = seeds.slice();
    seeds.forEach(function (s) { hop[s] = 0; });
    while (queue.length) {
      var p = queue.shift();
      if (hop[p] === HOPS) continue;
      NET.links.forEach(function (l) {
        var q = l[0] === p ? l[1] : l[1] === p ? l[0] : -1;
        if (q >= 0 && hop[q] < 0) { hop[q] = hop[p] + 1; queue.push(q); }
      });
    }
    return hop;
  }
  /** Returns how many papers the k-th drawing finds, its seeds among them. */
  function found(k) { return reach(STARTS[k]).filter(function (h) { return h >= 0; }).length; }

  /**
   * Draws the network traced from the k-th seeds, its left edge at x and its word's baseline at
   * y, at the scale s. Seeds are the kit's ring and core; a paper the trace did not reach is pale.
   * Returns play(rv, t): the network grows from its seeds, one hop after another.
   */
  function traced(parent, x, y, k, s) {
    var hop = reach(STARTS[k]), cx = x + NET.w * s / 2, cy = y + GAP + NET.h * s / 2, rs = s < 1 ? 0.92 : 1;
    var gEdge = group(parent), gDot = group(parent), d = { edges: [], dots: [], seeds: [] };
    function at(i) { return { x: f(cx + NET.at[i][0] * s), y: f(cy + NET.at[i][1] * s), r: NET.at[i][2] * rs }; }
    NET.links.forEach(function (l) {
      var a = l[0], b = l[1], off = hop[a] < 0 || hop[b] < 0, level = hop[a] === hop[b], near, far;
      if (off ? hop[a] < 0 : hop[a] > hop[b]) { a = l[1]; b = l[0]; }   // a line is drawn outward from the seeds
      near = at(a); far = at(b);
      d.edges.push({
        e: el('path', { d: 'M' + near.x + ',' + near.y + ' L' + far.x + ',' + far.y, class: 'edge' + (off ? ' rb-off' : ''), pathLength: 1 }, gEdge),
        k: off ? HOPS + 1 : level ? hop[a] + 1 : hop[b], drawn: !off && !level
      });
    });
    NET.at.forEach(function (p, i) {
      var m = at(i), r, g;
      if (!hop[i]) {
        r = Math.max(m.r, CORE * rs);
        g = group(gDot, '<circle class="ring" cx="' + m.x + '" cy="' + m.y + '" r="' + f(r + 3) + '"/><circle class="core" cx="' + m.x + '" cy="' + m.y + '" r="' + f(r) + '"/>');
        g.setAttribute('class', 'rb-pop');
        d.seeds.push(g);
      } else d.dots.push({ e: el('circle', { cx: m.x, cy: m.y, r: f(m.r), class: 'rb-pop dot' + (hop[i] < 0 ? ' rb-off' : '') }, gDot), k: hop[i] < 0 ? HOPS + 1 : hop[i] });
    });
    d.word = group(parent, '<circle class="ring" cx="' + (x + 6) + '" cy="' + (y - 4.5) + '" r="5.4"/><circle class="core" cx="' + (x + 6) + '" cy="' + (y - 4.5) + '" r="2.6"/>');
    el('text', { x: x + 19, y: y, class: 'note' }, d.word, WORDS[k]);
    return function (rv, t) {
      var pop = [{ opacity: 0, transform: 'scale(.4)' }, { opacity: 1, transform: 'scale(1)' }];
      function when(o) { return t + 520 + (o.k - 1) * HOP; }
      rv.fade(d.word, t, 360);
      d.seeds.forEach(function (g, i) { rv.from(g, pop, t + 120 + i * 90, 380); });
      d.edges.forEach(function (o) { if (o.drawn) rv.stroke(o.e, when(o), 400); else rv.fade(o.e, when(o) + 120, 400); });
      d.dots.forEach(function (o) { rv.from(o.e, pop, when(o) + 260, 360); });
    };
  }

  var uidN = 0;
  function picture(frame, w, h, text) {
    var uid = 'rb' + (++uidN) + '-t', svg = el('svg', { viewBox: '0 0 ' + w + ' ' + h, role: 'img', 'aria-labelledby': uid }, frame);
    el('title', { id: uid }, svg, text);
    return svg;
  }
  /** Returns what the k-th drawing shows, in words. */
  function says(k) {
    return 'traced ' + HOPS + ' citations out from ' + STARTS[k].length + ' seed papers, ' + found(k) + ' of its ' + NET.at.length + ' papers are found';
  }

  /** The wide window: the three drawings side by side, at equal steps across the frame. */
  function wide(frame, rv) {
    var W = 1278, X0 = 39, n = STARTS.length, step = (W - 2 * X0 - NET.w) / (n - 1);
    var svg = picture(frame, W, WORD + GAP + NET.h + FOOT, 'One citation network drawn ' + n + ' times, each time grown from other seed papers. ' + STARTS.map(function (s, k) { return (k ? 'Then' : 'First') + ', ' + says(k); }).join('. ') + '. Nearly the same papers every time.');
    var plays = STARTS.map(function (s, k) { return traced(group(svg), f(X0 + k * step), WORD, k, 1); });
    OK.onArrive(svg, function () { plays.forEach(function (play, k) { play(rv, k * 300); }); });
  }

  /** The narrow window: each drawing its own picture, one over another. */
  function narrow(frame, rv) {
    var W = 348, X0 = 20, s = (W - 2 * X0) / NET.w;
    STARTS.forEach(function (st, k) {
      var top = k ? 34 : 46, svg = picture(frame, W, Math.ceil(top + GAP + NET.h * s + (k < STARTS.length - 1 ? 14 : 34)), 'One citation network, ' + says(k) + '.');
      var play = traced(group(svg), X0, top, k, s);
      OK.onArrive(svg, function () { play(rv, 0); });
    });
  }

  function mount(root) {
    var headBox = OK.h('div', { class: 'sec-head' }, root);
    OK.h('h2', { class: 'sec-h' }, headBox, HEAD);
    OK.h('p', { class: 'sec-p' }, headBox, TEXT);
    var frame = OK.h('div', { class: 'frame pic rb-pic' }, root), rv = OK.reveal(), mq = window.matchMedia('(max-width: 900px)');
    function draw() {
      rv.cancel();
      frame.textContent = '';
      frame.classList.toggle('rb-narrow', mq.matches);
      (mq.matches ? narrow : wide)(frame, rv);
    }
    draw();
    mq.addEventListener('change', draw);
    return { destroy: function () { mq.removeEventListener('change', draw); rv.cancel(); } };
  }
  OK.section('robust', 'a', { label: 'Same network from different seeds', mount: mount });
})();
