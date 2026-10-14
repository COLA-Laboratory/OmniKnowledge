/* The four qualities under the first picture, each a link to the section that shows it. Every
   drawing is made of the kit's objects, stands in one box of W by H with its foot on y = FOOT,
   and is returned as its parts in the order a reader takes them in (the reveal shows them in
   that order). */
(function () {
  'use strict';
  var OK = window.OK, f = OK.f, D = OK.DATA;
  var W = 232, H = 96, FOOT = 94;

  /* ---------- marks shared by several drawings ---------- */
  /** Returns a check box centred on (cx, cy): state 'on' ticks it, 'no' crosses it. */
  function box(cx, cy, state) {
    var s = 11, x = cx - s / 2, y = cy - s / 2, k = s / 9;
    var m = '<rect class="box on" x="' + f(x) + '" y="' + f(y) + '" width="' + s + '" height="' + s + '" rx="' + f(2.2 * k) + '"/>';
    if (state === 'on') m += '<path class="tick" d="M' + f(x + 2.1 * k) + ',' + f(cy + 0.2 * k) + ' l' + f(1.9 * k) + ',' + f(1.9 * k) + ' l' + f(3 * k) + ',' + f(-3.9 * k) + '"/>';
    else m += '<path class="tick" d="M' + f(cx - 2.2 * k) + ',' + f(cy - 2.2 * k) + ' l' + f(4.4 * k) + ',' + f(4.4 * k) + ' M' + f(cx + 2.2 * k) + ',' + f(cy - 2.2 * k) + ' l' + f(-4.4 * k) + ',' + f(4.4 * k) + '"/>';
    return m;
  }
  /** Returns one word as a bar from x, w long, its middle on y; ink: set in ink instead of grey. */
  function bar(x, y, w, ink, h) {
    h = h || 5;
    return '<rect x="' + f(x) + '" y="' + f(y - h / 2) + '" width="' + f(w) + '" height="' + h + '" rx="' + f(h / 2) + '" fill="' + (ink ? '#0b0b0c' : '#c9c9c2') + '"/>';
  }
  /** Returns a word on the yellow marker: an ink bar from x, w long, its middle on y. */
  function marked(x, y, w, h) {
    h = h || 5;
    return '<rect class="mark" x="' + f(x - 3) + '" y="' + f(y - h / 2 - 3.5) + '" width="' + f(w + 6) + '" height="' + f(h + 7) + '"/>' + bar(x, y, w, true, h);
  }

  /* ---------- Comprehensive ---------- */
  /* the same papers after one, two and three ways of searching: the gaps close */
  function comprehensive() {
    var T = 16, ROWS = [14, 48.5, 83], X0 = 74, DX = 25, N = 7, FOUND = [[0, 1, 3, 5], [0, 1, 2, 3, 5, 6], [0, 1, 2, 3, 4, 5, 6]];
    return ROWS.map(function (y, r) {
      var s = '', k;
      for (k = 0; k <= r; k++) s += OK.tile(k * 19, y - T / 2, T, D.searches[k].key);
      for (k = 0; k < N; k++) s += FOUND[r].indexOf(k) >= 0 ? OK.paper(X0 + k * DX, y, 15, 20, { kept: true }) : '<rect class="ft-gone" x="' + f(X0 + k * DX - 7.5) + '" y="' + (y - 10) + '" width="15" height="20" rx="2"/>';
      return s;
    });
  }

  /* ---------- Quality-controlled ---------- */
  /* the same criteria down the side, every paper across the top; one paper fails the second */
  function controlled() {
    var rows = [56, 72, 88], cols = [86, 118, 150, 182, 214], w = [52, 38, 46], FAIL = 3;
    var papers = cols.map(function (x, c) { return OK.paper(x, 23, 20, 26, c === FAIL ? { pale: true } : { kept: true }); }).join('');
    return [papers].concat(rows.map(function (y, i) {
      return OK.words(0, y, w[i], 31 + i * 8, 0) + cols.map(function (x, c) { return c === FAIL && i > 1 ? '' : box(x, y, c === FAIL && i === 1 ? 'no' : 'on'); }).join('');
    }));
  }

  /* ---------- Cost-effective ---------- */
  var THICK = 5.6;                                  // a coin's edge
  /** Returns a coin lying flat, seen from a little above: its upper face is an ellipse round (cx, y), rx wide. */
  function coin(cx, y, rx) {
    var ry = rx * 0.4;
    return '<path class="ft-coin" d="M' + f(cx - rx) + ',' + f(y) + ' v' + THICK + ' a' + rx + ',' + f(ry) + ' 0 0 0 ' + (2 * rx) + ',0 v' + (-THICK) + '"/><ellipse class="ft-coin" cx="' + f(cx) + '" cy="' + f(y) + '" rx="' + rx + '" ry="' + f(ry) + '"/>' +
      '<ellipse class="ft-mint" cx="' + f(cx) + '" cy="' + f(y) + '" rx="' + f(rx - 4.6) + '" ry="' + f(ry - 1.9) + '"/>';
  }
  /**
   * Returns a pile of n kept papers, each standing behind the one before: the front paper is w
   * wide with its left edge on x and its foot on y = foot; every next one is dx to the right.
   */
  function pile(x, foot, n, w, dx) {
    var h = Math.round(w * 1.3), s = '', i;
    for (i = n - 1; i >= 0; i--) s += OK.paper(x + w / 2 + i * dx, foot - h / 2, w, h, { kept: true });
    return s;
  }
  /* a balance. The pile of papers on one end outweighs the coin it cost on the other */
  function costEffective() {
    var CX = 116, CY = 62;
    var beam = '<path class="lead" d="M14,' + CY + ' H218"/>' + pile(18, CY - 1.5, 7, 30, 8) + coin(196, CY - 1.5 - 6.8 - THICK, 17);
    var prop = '<path class="ft-prop" d="M' + CX + ',' + (CY + 2) + ' L' + (CX + 15) + ',' + FOOT + ' H' + (CX - 15) + ' Z"/>';
    return [prop, '<g transform="rotate(-9 ' + CX + ' ' + CY + ')">' + beam + '</g>'];
  }

  /* ---------- Trustworthy ---------- */
  /** Returns an evidence line along d that ends in a dot at (x, y). */
  function wire(d, x, y) { return '<path class="wire" d="' + d + '"/><circle class="port" cx="' + f(x) + '" cy="' + f(y) + '" r="2.7"/>'; }
  /* one paper between its past and its record. Behind it, the trail back to the seed it was found
     from; before it, the decisions made on it, each tied to its line */
  function trustworthy() {
    var g = OK.sheetGeo(106, 12, 58, 82), t = g.title[0], a = g.abs[2], ty = t.y + t.h / 2, ay = a.y + a.h / 2;
    var SEED = 8.5, FROM = 60;                          // where the seed and the paper this one was found from stand
    /** Returns the height of the line of sight at x: it leaves the sheet at y = 70 and rises to the left. */
    function sight(x) { return f(70 - (g.x - x) * 0.12); }
    /** Returns one hop of the trail between x0 and x1, with the tile of the search that made it in the middle. */
    function hop(x0, x1, size) {
      var x = (x0 + x1) / 2;
      return '<path class="edge ft-hop" d="M' + x0 + ',' + sight(x0) + ' L' + x1 + ',' + sight(x1) + '"/>' + OK.tile(f(x - size / 2), f(sight(x) - size / 2), size, 'back');
    }
    var sheet = OK.sheetBase(g, {}) + marked(t.x + 18, ty, t.w - 18, t.h) + marked(a.x, ay, a.w * 0.62, a.h);
    var near = hop(FROM + 12.5, g.x, 15) + OK.paper(FROM, sight(FROM), 25, 32, {});
    var far = hop(SEED + 7.5, FROM - 12.5, 12) + OK.paper(SEED, sight(SEED), 15, 19, { seed: true });
    function verdict(y, state, seedNum, to) {
      return box(182, y, state) + OK.words(194, y, 38, seedNum, 2) +
        wire('M175,' + y + ' C169,' + y + ' 172,' + f(to[1]) + ' ' + f(to[0]) + ',' + f(to[1]), to[0], to[1]);
    }
    return [sheet, near, far, verdict(26, 'on', 7, [t.x + t.w + 5.5, ty]), verdict(70, 'no', 15, [a.x + a.w * 0.62 + 5.5, ay])];
  }

  var ITEMS = [
    { name: 'Comprehensive', to: '#search', text: 'Triangulated search combines citations, semantics and keywords to deliver the most complete picture of your field.' },
    { name: 'Rigorous', to: '#screen', text: 'Exact metadata rules and LLM screening, from title to full text, hold every paper to your criteria.' },
    { name: 'Cost-effective', to: '#screen', text: 'Cascaded screening lets cheap rules settle the clear cases and saves LLM screening for the hard ones.' },
    { name: 'Trustworthy', to: '#build', text: 'Transparent search and screening pipelines, with a fully auditable record of every decision, keep you in control.' }
  ];
  // for every item, its drawing and what the drawing shows in words
  var DRAW = [
    [comprehensive, 'The same seven papers after one, two and three ways of searching: three are missing, then one, then none'],
    [controlled, 'Five papers checked against the same three criteria; four pass, one fails the second and is removed'],
    [costEffective, 'A balance: the pile of papers on one end outweighs the single coin on the other'],
    [trustworthy, 'One paper: a trail leads back from it, through the paper it was found from, to a seed paper, each hop marked with the search that made it; two decisions on it, a pass and a fail, are each tied to the line they rest on']
  ];

  OK.section('features', 'a', {
    label: 'Four qualities',
    mount: function (root) {
      var row = OK.h('div', { class: 'ft-row' }, root), rv = OK.reveal(), pics = [];
      ITEMS.forEach(function (it, i) {
        var a = OK.h('a', { class: 'ft-item', href: it.to }, row);
        var parts = DRAW[i][0]().map(function (p) { return '<g>' + p + '</g>'; }).join('');
        pics.push(OK.h('div', { class: 'ft-pic pic' }, a, '<svg viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" role="img" aria-label="' + DRAW[i][1] + '">' + parts + '</svg>'));
        OK.h('h3', { class: 'ft-name' }, a, '<span>' + it.name + '</span>');
        OK.h('p', { class: 'ft-text' }, a, it.text);
      });
      // when the row arrives, each drawing shows its parts in reading order
      OK.onArrive(row, function () {
        pics.forEach(function (p, i) {
          Array.prototype.forEach.call(p.firstChild.children, function (g, k) { rv.fade(g, i * 140 + k * 170, 420); });
        });
      });
      return { destroy: function () { rv.cancel(); } };
    }
  });
})();
