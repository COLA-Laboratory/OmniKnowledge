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
  function dot(x, y, r) { return '<circle class="dot" cx="' + f(x) + '" cy="' + f(y) + '" r="' + r + '"/>'; }
  function text(cls, x, y, str, anchor) { return '<text class="' + cls + '" x="' + f(x) + '" y="' + f(y) + '"' + (anchor ? ' text-anchor="' + anchor + '"' : '') + '>' + str + '</text>'; }

  /* ---------- Comprehensive ---------- */
  /* a sum. Each way of searching finds some papers and misses others; under the rule, none is missing */
  function comprehensive() {
    var FOUND = [[0, 1, 3, 4, 6], [1, 2, 5, 6], [2, 4, 7]], N = 8, X0 = 42, DX = 22, ROWS = [15, 38, 61], RULE = 75.5, SUM = 88.5, T = 18, RD = 5.2, k;
    var parts = D.searches.map(function (S, i) {
      var s = OK.tile(0, ROWS[i] - T / 2, T, S.key);
      for (k = 0; k < N; k++) s += FOUND[i].indexOf(k) >= 0 ? dot(X0 + k * DX, ROWS[i], RD) : '<circle class="ft-miss" cx="' + (X0 + k * DX) + '" cy="' + ROWS[i] + '" r="1.7"/>';
      return s;
    });
    var sum = '<path class="chain" d="M0,' + RULE + ' H' + (X0 + (N - 1) * DX + RD + 3) + '"/>';
    for (k = 0; k < N; k++) sum += dot(X0 + k * DX, SUM, RD);
    return parts.concat([sum]);
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

  /* ---------- Affordable ---------- */
  var THICK = 5.6;                                  // a coin's edge
  /**
   * Returns a coin lying flat, seen from a little above: its upper face is an ellipse round
   * (cx, y), rx wide. ghost: a coin that is not paid, in dotted outline.
   */
  function coin(cx, y, rx, ghost) {
    var ry = rx * 0.4, cls = ghost ? 'ft-ghost' : 'ft-coin';
    return '<path class="' + cls + '" d="M' + f(cx - rx) + ',' + f(y) + ' v' + THICK + ' a' + rx + ',' + f(ry) + ' 0 0 0 ' + (2 * rx) + ',0 v' + (-THICK) + '"/><ellipse class="' + cls + '" cx="' + f(cx) + '" cy="' + f(y) + '" rx="' + rx + '" ry="' + f(ry) + '"/>' +
      (ghost ? '' : '<ellipse class="ft-mint" cx="' + f(cx) + '" cy="' + f(y) + '" rx="' + f(rx - 4.6) + '" ry="' + f(ry - 1.9) + '"/>');
  }
  /** Returns n coins stacked on the foot at cx. */
  function coins(cx, n, rx, ghost) {
    var s = '', i;
    for (i = 0; i < n; i++) s += coin(cx, FOOT - 0.6 - rx * 0.4 - THICK * (i + 1), rx, ghost);
    return s;
  }
  /* what reading every paper would cost, in dotted outline, beside what is paid */
  function affordable() {
    var RX = 18;
    return [coins(RX + 1, 10, RX, true), coins(RX * 4 + 1, 1, RX)];
  }

  /* ---------- Transparent ---------- */
  /* the flow report. Every paper that was found is counted where it left */
  function transparent() {
    var Y = 42, PY = 78, XK = 200, TIP = 226, merged = D.found - D.deduped, removed = D.deduped - D.kept;
    var outs = [{ x: 50, n: merged, word: 'duplicates' }, { x: 136, n: removed, word: 'removed' }];
    var parts = ['<path class="lead cut" d="M8.5,' + Y + ' H' + TIP + '"/><path class="lead" d="M' + (TIP - 5) + ',' + (Y - 5) + ' L' + TIP + ',' + Y + ' L' + (TIP - 5) + ',' + (Y + 5) + '"/>' + OK.paper(8.5, Y, 15, 20, {}) + text('cnt', 0.5, Y - 22, OK.fmt(D.found))];
    outs.forEach(function (o) {
      parts.push('<path class="chain" d="M' + o.x + ',' + Y + ' V' + (PY - 11) + '"/><circle class="port" cx="' + o.x + '" cy="' + Y + '" r="4.5"/>' + OK.paper(o.x, PY, 15, 20, { pale: true }) + text('cnt', o.x + 14, PY - 1, OK.fmt(o.n)) + text('note', o.x + 14, PY + 15, o.word));
    });
    parts.push('<rect class="ft-gap" x="' + (XK - 11) + '" y="' + (Y - 5) + '" width="22" height="10"/>' + OK.paper(XK, Y, 15, 20, { kept: true }) + '<rect class="mark" x="' + (XK - 16) + '" y="' + (Y - 34.5) + '" width="32" height="16"/>' + text('cnt', XK, Y - 22, D.kept, 'middle'));
    return parts;
  }

  var ITEMS = [
    { name: 'Comprehensive', to: '#search', text: 'Three kinds of search, each reaching papers the other two miss.' },
    { name: 'Quality-controlled', to: '#screen', text: 'Every paper meets the same criteria, in the same order.' },
    { name: 'Affordable', to: '#screen', text: 'Rule checks come first. A language model reads only what is left.' },
    { name: 'Transparent', to: '#build', text: 'Every paper found, merged or removed is counted where it happened.' }
  ];
  // for every item, its drawing and what the drawing shows in words
  var DRAW = [
    [comprehensive, 'Three rows of papers, one for each way of searching, each with gaps; under a rule, a row with none missing'],
    [controlled, 'Five papers checked against the same three criteria; four pass, one fails the second and is removed'],
    [affordable, 'A tall stack of coins in dotted outline beside the one coin that is paid'],
    [transparent, '14,950 papers found; 2,550 duplicates and 12,188 removed papers are counted where they leave; 212 kept']
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
