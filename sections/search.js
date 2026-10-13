/* The Search section: three ways of searching, each drawn at work on the kit's papers, and what
   each contributes to the 14,950 candidates, shown as pale bands as wide as what each search
   found, standing on one ground.
   On a wide window the section is one drawing; on a narrow one each search is its own drawing
   and the counts follow. README.md owns the drawing language. */
(function () {
  'use strict';
  var OK = window.OK, f = OK.f, D = OK.DATA;
  var HEAD = 'Triangulated search across citations, semantics and keywords';
  var TEXT = 'Three search paradigms run as one and take the best of each. Citation tracing follows how papers build on one another, semantic search finds related work whatever its wording, and database search reaches papers no citation leads to.';
  var COLW = 368;                                   // the width the three drawings are composed for
  var TOP = 36, TILE = 26;                          // a column's title: its top, the size of its tile
  var NOTE = 96;                                    // the baseline of the quiet words above a drawing
  var Y1 = 372, MID = 242;                          // a drawing: its foot, and the height its seed stands at
  var SEED = [30, 39], NEAR = [22, 29], FAR = [16, 21], SMALL = [14, 18];   // paper sizes
  var R = 16;                                       // the one corner radius of a ground

  function el(tag, attrs, parent, text) { return OK.svg(tag, attrs, parent, text); }
  function group(parent, html) { var g = el('g', {}, parent); if (html) g.innerHTML = html; return g; }
  /** Returns the centre nearest to c at which a paper of this size has its edges on half pixels. */
  function snap(c, size) { return Math.round(c - size / 2) + 0.5 + size / 2; }
  /** Returns a kit paper of size [w, h] at a snapped centre. */
  function paper(cx, cy, size, o) { return OK.paper(snap(cx, size[0]), snap(cy, size[1]), size[0], size[1], o); }
  function note(parent, x, y, text, anchor) { return el('text', { x: f(x), y: y, class: 'note', 'text-anchor': anchor || 'start' }, parent, text); }
  /** Returns one curve from (x0, y0) to (x1, y1), level where it leaves and where it arrives. */
  function curve(x0, y0, x1, y1) {
    var half = (x1 - x0) / 2;
    return 'M' + f(x0) + ',' + f(y0) + ' C' + f(x0 + half) + ',' + f(y0) + ' ' + f(x1 - half) + ',' + f(y1) + ' ' + f(x1) + ',' + f(y1);
  }
  /** Returns the open arrowhead of the first picture's line, small, at (x, y) pointing along side (1 right, -1 left). */
  function head(x, y, side) {
    return 'M' + f(x - side * 3.4) + ',' + f(y - 3.4) + ' L' + f(x) + ',' + f(y) + ' L' + f(x - side * 3.4) + ',' + f(y + 3.4);
  }
  function title(parent, x, search) {
    return group(parent, OK.tile(x, TOP, TILE, search.key) + '<text class="task" x="' + (x + TILE + 12) + '" y="' + (TOP + 20) + '">' + search.name + '</text>');
  }

  /* ---------- citation tracing: references to the left, citing papers to the right ---------- */
  // [x, y] from the seed; a second-generation paper also names the first-generation paper it hangs on
  var TREE = [
    { side: -1, word: 'References', near: [[-90, -54], [-84, 50]], far: [[-174, -108, 0], [-176, -34, 0], [-171, 30, 1], [-175, 104, 1]] },
    { side: 1, word: 'Cited by', near: [[86, -80], [94, 0], [82, 76]], far: [[173, -112, 0], [176, -60, 0], [171, -18, 1], [175, 38, 1], [172, 104, 2]] }
  ];
  /**
   * Draws citation tracing into host, in the column B = { x, w }.
   * Returns play(rv, t): lays the reveal over it from time t and returns when it ends.
   */
  function cite(host, B) {
    var cx = snap(B.x + B.w / 2, SEED[0]), cy = snap(MID, SEED[1]), s = B.w / COLW, gArc = group(host), gPap = group(host), d = { near: [], far: [] };
    function place(p, size) { return { x: snap(cx + p[0] * s, size[0]), y: snap(cy + p[1], size[1]) }; }
    function arc(from, fromSize, off, to, toSize, side, cls) {
      // a paper that stands at the height the line leaves at is reached by a level line
      var x0 = from.x + side * (fromSize[0] / 2 + 4), x1 = to.x - side * (toSize[0] / 2 + 5.5), y0 = from.y + off, y1 = Math.abs(to.y - y0) < 1.5 ? y0 : to.y;
      return { line: el('path', { d: curve(x0, y0, x1, y1), class: 'sr-arc' + cls, pathLength: 1 }, gArc), head: el('path', { d: head(x1, y1, side), class: 'sr-head' + cls }, gArc) };
    }
    d.words = TREE.map(function (T) { return note(host, T.side < 0 ? B.x : B.x + B.w, NOTE, T.word, T.side < 0 ? 'start' : 'end'); });
    TREE.forEach(function (T) {
      var seed = { x: cx, y: cy }, near = T.near.map(function (p) { return place(p, NEAR); }), kids = near.map(function () { return []; });
      T.far.forEach(function (p) { kids[p[2]].push(place(p, FAR)); });
      near.forEach(function (p, i) {
        var a = arc(seed, SEED, (i - (near.length - 1) / 2) * 9, p, NEAR, T.side, '');
        d.near.push({ line: a.line, head: a.head, paper: group(gPap, paper(p.x, p.y, NEAR)), k: i });
        kids[i].forEach(function (q, j) {
          var b = arc(p, NEAR, (j - (kids[i].length - 1) / 2) * 7, q, FAR, T.side, ' sr-out');
          d.far.push({ line: b.line, head: b.head, paper: group(gPap, paper(q.x, q.y, FAR, { dim: true })), k: i + j });
        });
      });
    });
    d.seed = group(gPap, paper(cx, cy, SEED, { seed: true }));
    return function (rv, t) {
      rv.arrive(d.seed, t);
      d.words.forEach(function (w) { rv.fade(w, t + 250, 320); });
      [[d.near, t + 380, 90], [d.far, t + 1180, 70]].forEach(function (gen) {
        gen[0].forEach(function (o) {
          var at = gen[1] + o.k * gen[2];
          rv.stroke(o.line, at, 460); rv.fade(o.head, at + 380, 160); rv.arrive(o.paper, at + 330, 360);
        });
      });
      return t + 2100;
    };
  }

  /* ---------- semantic search: the seed in a field of papers, each line a similarity, the most similar taken ---------- */
  // [x, y] from the seed and the similarity to it, falling with distance: the papers taken, and two just beyond
  var ALIKE = [[-34, -100, 0.93], [88, -70, 0.91], [-118, -20, 0.89], [64, 104, 0.87], [138, 12, 0.84], [-96, 104, 0.82]];
  var BEYOND = [[-134, -114, 0.58], [153, 105, 0.52]];
  var REACH = 150;                                  // every other paper of the field stands further from the seed than this
  var PITCH = 4.5;                                  // from dot to dot on the kit's dotted line
  var rayN = 0;
  /** Returns how far from its middle a line along (ux, uy) leaves a box of half-size hw by hh. */
  function leave(ux, uy, hw, hh) { return Math.min(hw / Math.max(1e-6, Math.abs(ux)), hh / Math.max(1e-6, Math.abs(uy))); }
  /** Returns the distance of (x, y) from the stretch between a and b. */
  function off(x, y, a, b) {
    var ex = b.x - a.x, ey = b.y - a.y, t = Math.max(0, Math.min(1, ((x - a.x) * ex + (y - a.y) * ey) / (ex * ex + ey * ey)));
    return Math.hypot(a.x + ex * t - x, a.y + ey * t - y);
  }
  /**
   * Draws a similarity: a straight dotted line from the seed to the paper p, and its number on the line.
   * half: the half-size the line stops short of at p; at: where on the line the number stands (0 to 1);
   * low: a paper that is not similar enough, drawn pale. The dots stop at the number and begin again after it.
   * Returns { line, reach: the circle that uncovers the line from the seed outward, label }.
   */
  function alike(lines, labels, seed, p, half, at, low) {
    var r = Math.hypot(p.x - seed.x, p.y - seed.y), ux = (p.x - seed.x) / r, uy = (p.y - seed.y) / r, id = 'sr-ray' + (++rayN), d = '';
    var t0 = leave(ux, uy, SEED[0] / 2 + 5, SEED[1] / 2 + 5), t1 = r - leave(ux, uy, half[0], half[1]), tm = t0 + (t1 - t0) * at;
    var label = el('text', { x: f(seed.x + ux * tm), y: f(seed.y + uy * tm + 4.6), 'text-anchor': 'middle', class: 'cnt' + (low ? ' sr-low' : '') }, labels, p.sim.toFixed(2));
    var gap = leave(ux, uy, label.getComputedTextLength() / 2 + 5, 9.5);
    [[t0, tm - gap], [tm + gap, t1]].forEach(function (run) {
      var n = Math.floor((run[1] - run[0]) / PITCH), a = run[0] + (run[1] - run[0] - n * PITCH) / 2, b = a + n * PITCH + 0.1;
      if (n >= 0) d += 'M' + f(seed.x + ux * a) + ',' + f(seed.y + uy * a) + ' L' + f(seed.x + ux * b) + ',' + f(seed.y + uy * b) + ' ';
    });
    var reach = el('circle', { cx: seed.x, cy: seed.y, r: f(t1 + 2), style: 'transform-origin:' + seed.x + 'px ' + seed.y + 'px' }, el('clipPath', { id: id }, lines));
    return { line: el('path', { d: d, class: 'maybe' + (low ? ' sr-faint' : ''), 'clip-path': 'url(#' + id + ')' }, lines), reach: reach, label: label };
  }
  /**
   * Returns where the unnamed papers of the field stand: loosely over the column under its word,
   * further from the seed than any paper with a number, and clear of the lines to the papers beyond.
   */
  function fieldOf(B, seed, named, beyond) {
    var rnd = OK.prng(57), out = [], cols = Math.max(5, Math.round(B.w / 52)), rows = 5, cw = B.w / cols, top = NOTE + 16, ch = (Y1 - top) / rows, r, c;
    for (r = 0; r < rows; r++) for (c = 0; c < cols; c++) {
      var x = B.x + (c + 0.5) * cw + (rnd() - 0.5) * cw * 0.56, y = top + (r + 0.5) * ch + (rnd() - 0.5) * ch * 0.56;
      x = Math.max(B.x + FAR[0] / 2, Math.min(B.x + B.w - FAR[0] / 2, x));
      y = Math.max(top + FAR[1] / 2, Math.min(Y1 - FAR[1] / 2, y));
      if (Math.hypot(x - seed.x, y - seed.y) < REACH) continue;
      if (named.some(function (p) { return Math.abs(p.x - x) < 36 && Math.abs(p.y - y) < 42; })) continue;
      if (beyond.some(function (p) { return off(x, y, seed, p) < 26; })) continue;
      if (out.some(function (p) { return Math.hypot(p.x - x, p.y - y) < 42; })) continue;
      out.push({ x: x, y: y });
    }
    return out;
  }
  /** Draws semantic search into host, in the column B = { x, w }. Returns play(rv, t), as cite does. */
  function sem(host, B) {
    var seed = { x: snap(B.x + B.w / 2, SEED[0]), y: snap(MID, SEED[1]) }, d = { taken: [], beyond: [] }, edge = B.w / 2 - FAR[0] / 2 - 1;
    function place(list, size, lim) {
      return list.map(function (p) { return { x: snap(seed.x + Math.max(-lim, Math.min(lim, p[0])), size[0]), y: snap(seed.y + p[1], size[1]), sim: p[2] }; });
    }
    var taken = place(ALIKE, NEAR, 1e3), beyond = place(BEYOND, FAR, edge);   // a narrow column pulls the papers beyond in to its edge
    d.word = note(host, B.x, NOTE, 'Similarity to the seed');
    d.field = group(host, fieldOf(B, seed, taken.concat(beyond), beyond).concat(beyond).map(function (p) { return paper(p.x, p.y, FAR, { pale: true }); }).join('') +
      taken.map(function (p) { return paper(p.x, p.y, NEAR, { pale: true }); }).join(''));
    var lines = group(host), labels = group(host);
    taken.forEach(function (p) {
      var o = alike(lines, labels, seed, p, [NEAR[0] / 2 + 7.5, NEAR[1] / 2 + 7.5], 0.5, false);
      o.paper = group(host, '<rect class="sr-halo" x="' + f(p.x - NEAR[0] / 2 - 4.5) + '" y="' + f(p.y - NEAR[1] / 2 - 4.5) + '" width="' + (NEAR[0] + 9) + '" height="' + (NEAR[1] + 9) + '" rx="3"/>' + paper(p.x, p.y, NEAR));
      d.taken.push(o);
    });
    beyond.forEach(function (p) { d.beyond.push(alike(lines, labels, seed, p, [FAR[0] / 2 + 5, FAR[1] / 2 + 5], 0.76, true)); });
    d.seed = group(host, paper(seed.x, seed.y, SEED, { seed: true }));
    return function (rv, t) {
      var grow = [{ transform: 'scale(0)' }, { transform: 'scale(1)' }], after = t + 600 + d.taken.length * 230;
      rv.fade(d.field, t, 520); rv.arrive(d.seed, t + 150); rv.fade(d.word, t + 250, 320);
      // nearest first: the line reaches out, its number arrives with it, then the paper is taken
      d.taken.forEach(function (o, i) {
        var at = t + 600 + i * 230;
        rv.from(o.reach, grow, at, 420); rv.fade(o.label, at + 240, 260); rv.fade(o.paper, at + 400, 300);
      });
      d.beyond.forEach(function (o, i) { rv.from(o.reach, grow, after + i * 200, 480); rv.fade(o.label, after + i * 200 + 320, 260); });
      return after + d.beyond.length * 200 + 600;
    };
  }

  /* ---------- database search: a query, the index, the papers whose words match ---------- */
  var QUERY = ['microplastic', 'AND', 'fish'];
  var GRID = { cols: 5, rows: 7, dx: 28, dy: 33, top: 156, word: 141 };   // the index: small papers on a grid, its top, the baseline of the word over it
  // a match: its place in the index [column, row], and its two lines (a number: a word bar that
  // long, cut where the line ends, so 99 runs to the end; a string: a word of the query)
  var MATCHES = [
    { at: [1, 1], lines: [['microplastic', 34, 26, 99], [24, 'fish', 38, 20]] },
    { at: [3, 2], lines: [[22, 'microplastic', 30, 16], ['fish', 44, 26, 99]] },
    { at: [0, 4], lines: [[34, 20, 'fish', 30, 99], [22, 'microplastic', 18]] },
    { at: [2, 5], lines: [['microplastic', 20, 36], [40, 28, 'fish', 99]] }
  ];
  /** Draws one line of a matching paper at baseline y from x: word bars, and the query's words on the marker. */
  function matchLine(parent, x, y, tokens, room) {
    var x1 = x + room;
    tokens.forEach(function (tk) {
      if (x >= x1 - 8) return;
      if (typeof tk === 'number') {
        var w = Math.min(tk, x1 - x);
        el('rect', { x: f(x), y: f(y - 6.8), width: f(w), height: 5, rx: 2.5, class: 'sr-bar' }, parent);
        x += w + 5;
        return;
      }
      var t = el('text', { x: f(x + 3), y: y, class: 'row' }, parent, tk), tw = t.getComputedTextLength();
      el('rect', { x: f(x), y: y - 12.5, width: f(tw + 6), height: 16, class: 'mark' }, parent);
      parent.appendChild(t);
      x += tw + 6 + 6;
    });
  }
  /** Draws database search into host, in the column B = { x, w }. Returns play(rv, t), as cite does. */
  function db(host, B) {
    var d = { rows: [] }, gx = B.x + SMALL[0] / 2, gy = GRID.top + SMALL[1] / 2, gw = (GRID.cols - 1) * GRID.dx + SMALL[0];
    var mx = B.x + gw + Math.round(40 * B.w / COLW), room = B.x + B.w - (mx + NEAR[0] + 12), s = '', c, r;
    // the query: a lens, the words, a hairline under them
    d.query = group(host, '<circle class="sr-lens" cx="' + (B.x + 6.5) + '" cy="' + (NOTE - 5.5) + '" r="5"/><path class="sr-lens" d="M' + (B.x + 10.2) + ',' + (NOTE - 1.8) + ' l3.8,3.8"/>');
    var q = el('text', { x: B.x + 23, y: NOTE, class: 'lab' }, d.query);
    QUERY.forEach(function (w, i) { el('tspan', i === 1 ? { class: 'sr-op', dx: 5 } : i ? { dx: 5 } : {}, q, w); });
    d.rule = el('line', { x1: B.x, x2: B.x + B.w, y1: NOTE + 13.5, y2: NOTE + 13.5, class: 'rule sr-rule', pathLength: 1 }, host);
    d.words = [note(host, B.x, GRID.word, 'Literature index'), note(host, mx, GRID.word, 'Matches')];
    for (r = 0; r < GRID.rows; r++) for (c = 0; c < GRID.cols; c++) s += paper(gx + c * GRID.dx, gy + r * GRID.dy, SMALL, { pale: true });
    d.index = group(host, s);
    var step = (Y1 - GRID.top - NEAR[1]) / (MATCHES.length - 1);   // the matches stand from the index's top to its foot
    MATCHES.forEach(function (m, i) {
      var ix = snap(gx + m.at[0] * GRID.dx, SMALL[0]), iy = snap(gy + m.at[1] * GRID.dy, SMALL[1]);
      var px = snap(mx + NEAR[0] / 2, NEAR[0]), py = snap(GRID.top + NEAR[1] / 2 + i * step, NEAR[1]), o = { dx: ix - px, dy: iy - py };
      o.lit = group(host, '<rect class="sr-halo" x="' + f(ix - SMALL[0] / 2 - 3.5) + '" y="' + f(iy - SMALL[1] / 2 - 3.5) + '" width="' + (SMALL[0] + 7) + '" height="' + (SMALL[1] + 7) + '" rx="2.5"/>' + paper(ix, iy, SMALL));
      o.paper = group(host, paper(px, py, NEAR));
      o.text = group(host);
      m.lines.forEach(function (line, k) { matchLine(o.text, mx + NEAR[0] + 12, py + (k ? 13.5 : -4.5), line, room); });
      d.rows.push(o);
    });
    return function (rv, t) {
      rv.fade(d.query, t, 360); rv.stroke(d.rule, t + 100, 520);
      d.words.forEach(function (w) { rv.fade(w, t + 300, 320); });
      rv.fade(d.index, t + 300, 520);
      d.rows.forEach(function (o, i) {
        var at = t + 900 + i * 360, from = 'translate(' + o.dx + 'px,' + o.dy + 'px)';
        rv.fade(o.lit, at, 280);
        rv.from(o.paper, [{ opacity: 0, transform: from }, { opacity: 1, transform: from, offset: 0.15 }, { opacity: 1, transform: 'translate(0,0)' }], at + 200, 720);
        rv.fade(o.text, at + 760, 320);
      });
      return t + 900 + d.rows.length * 360 + 900;
    };
  }
  var DRAW = { cite: cite, sem: sem, db: db };

  /* ---------- the counts ---------- */
  /** Returns the total: the number large, and its word. anchor: 'start' | 'middle' | 'end'. */
  function total(parent, x, y, anchor) {
    var t = el('text', { x: f(x), y: y, 'text-anchor': anchor, class: 'sr-sum' }, parent);
    el('tspan', {}, t, OK.fmt(D.found));
    el('tspan', { class: 'sr-unit', dx: 12 }, t, 'candidates');
    return t;
  }
  /** Returns a count centred on x. */
  function countAt(parent, x, y, n) { return el('text', { x: f(x), y: y, 'text-anchor': 'middle', class: 'sr-count' }, parent, OK.fmt(n)); }
  /**
   * Returns the outline of the bands' ground: one band per search rising from one ground.
   * bands: [{ x0, x1 }] left to right; top: the bands' top; mid: where they meet the ground;
   * x0, x1, bottom: the ground. Every corner has the radius r; a band on the ground's edge runs straight into it.
   */
  function comb(bands, top, mid, x0, x1, bottom, r) {
    var a = ' A' + r + ',' + r + ' 0 0 ', last = bands.length - 1, flushL = bands[0].x0 <= x0, flushR = bands[last].x1 >= x1;
    var d = flushL ? 'M' + f(x0) + ',' + f(top + r) : 'M' + f(x0) + ',' + f(mid + r) + a + '1 ' + f(x0 + r) + ',' + f(mid);
    bands.forEach(function (b, i) {
      if (i || !flushL) d += ' H' + f(b.x0 - r) + a + '0 ' + f(b.x0) + ',' + f(mid - r) + ' V' + f(top + r);       // off the ground, up the band's left side
      d += a + '1 ' + f(b.x0 + r) + ',' + f(top) + ' H' + f(b.x1 - r) + a + '1 ' + f(b.x1) + ',' + f(top + r);   // over its top
      if (i < last || !flushR) d += ' V' + f(mid - r) + a + '0 ' + f(b.x1 + r) + ',' + f(mid);                   // down its right side, back onto the ground
    });
    if (!flushR) d += ' H' + f(x1 - r) + a + '1 ' + f(x1) + ',' + f(mid + r);
    return d + ' V' + f(bottom - r) + a + '1 ' + f(x1 - r) + ',' + f(bottom) + ' H' + f(x0 + r) + a + '1 ' + f(x0) + ',' + f(bottom - r) + ' Z';
  }
  /** Returns the even width of a band for n papers when the largest search is `full` wide. */
  function bandWidth(n, full) { return Math.round(full * n / D.searches[0].found / 2) * 2; }

  /**
   * Draws the counts on a wide window: under each drawing a band as wide as what its search
   * found, the three standing on one ground that carries the total. Returns { bottom, play }.
   */
  function bands(svg, cols, x0, x1, top, uid) {
    var mid = top + 52, bottom = mid + 72, d = { counts: [] };
    var list = cols.map(function (B, i) { var w = bandWidth(D.searches[i].found, B.w), c = Math.round(B.x + B.w / 2); return { x0: c - w / 2, x1: c + w / 2, c: c }; });
    var clip = el('clipPath', { id: uid + '-pour' }, svg);
    d.pour = el('rect', { x: x0, y: top, width: x1 - x0, height: bottom - top, class: 'sr-pour' }, clip);
    el('path', { d: comb(list, top, mid, x0, x1, bottom, R), class: 'ground', 'clip-path': 'url(#' + uid + '-pour)' }, svg);
    list.forEach(function (b, i) { d.counts.push(countAt(svg, b.c, top + 33, D.searches[i].found)); });
    d.total = total(svg, (x0 + x1) / 2, mid + 47, 'middle');
    return {
      bottom: bottom,
      play: function (rv, t) {
        rv.from(d.pour, [{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)' }], t, 900, 'cubic-bezier(.45,0,.3,1)');
        d.counts.forEach(function (g, i) { rv.arrive(g, t + 120 + i * 110); });
        rv.arrive(d.total, t + 760, 480);
      }
    };
  }

  /* ---------- the section ---------- */
  var uidN = 0;
  function picture(frame, w, h, text) {
    var uid = 'sr' + (++uidN), svg = el('svg', { viewBox: '0 0 ' + w + ' ' + h, role: 'img', 'aria-labelledby': uid + '-t' }, frame);
    el('title', { id: uid + '-t' }, svg, text);
    svg.uid = uid;
    return svg;
  }
  var SAYS = {
    cite: 'Citation tracing: from a seed paper, the papers it cites and the papers that cite it, over two generations',
    sem: 'Semantic Search: a seed paper in a field of papers, the nearest in meaning taken',
    db: 'Database Search: a query, an index of papers, and the papers whose words match it'
  };
  function sums() {
    var each = D.searches.map(function (s) { return s.name + ' ' + OK.fmt(s.found); }).join(', ');
    return 'Papers found: ' + each + '. Together ' + OK.fmt(D.found) + ' candidates.';
  }

  /** The wide window: one drawing, three equal columns, the counts under them. */
  function wide(frame, rv) {
    var W = 1278, X0 = 39, GUT = 48, svg = picture(frame, W, 620, D.searches.map(function (s) { return SAYS[s.key]; }).join('. ') + '. ' + sums());
    var cols = D.searches.map(function (s, i) { return { x: X0 + i * (COLW + GUT), w: COLW }; });
    var titles = [], plays = [], low;
    D.searches.forEach(function (s, i) { titles.push(title(svg, cols[i].x, s)); plays.push(DRAW[s.key](group(svg), cols[i])); });
    low = bands(svg, cols, X0, W - X0, Y1 + 32, svg.uid);
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + (low.bottom + X0));
    OK.onArrive(svg, function () {
      var end = 0;
      plays.forEach(function (play, i) { rv.arrive(titles[i], i * 450); end = play(rv, 150 + i * 450); });
      low.play(rv, end - 500);
    });
  }

  /** The narrow window: each search its own drawing; then the counts together. */
  function narrow(frame, rv) {
    var W = 348, X0 = 20, B = { x: X0, w: W - 2 * X0 };
    D.searches.forEach(function (s) {
      var svg = picture(frame, W, Y1 + 16, SAYS[s.key]), t = title(svg, B.x, s), play = DRAW[s.key](group(svg), B);
      OK.onArrive(svg, function () { rv.arrive(t, 0); play(rv, 150); });
    });
    var last = picture(frame, W, 100, sums()), d = {};
    // the first band stands on the ground's left edge, as on a wide window; the others in the middle of their thirds
    var third = B.w / 3, list = D.searches.map(function (s, i) { var w = bandWidth(s.found, 100), c = i ? Math.round(B.x + (i + 0.5) * third) : B.x + w / 2; return { x0: c - w / 2, x1: c + w / 2, c: c }; });
    d.heads = list.map(function (b, i) { return group(last, OK.tile(b.c - 11, 12, 22, D.searches[i].key) + '<text class="cnt" x="' + b.c + '" y="54" text-anchor="middle">' + OK.fmt(D.searches[i].found) + '</text>'); });
    d.ground = el('path', { d: comb(list, 66, 106, B.x, B.x + B.w, 186, R / 2), class: 'ground' }, last);
    d.total = total(last, W / 2, 157, 'middle');
    last.setAttribute('viewBox', '0 0 ' + W + ' 214');
    OK.onArrive(last, function () {
      d.heads.forEach(function (g, i) { rv.arrive(g, i * 110); });
      rv.fade(d.ground, 250, 480); rv.arrive(d.total, 560, 480);
    });
  }

  function mount(root) {
    var headBox = OK.h('div', { class: 'sec-head' }, root);
    OK.h('h2', { class: 'sec-h sr-h' }, headBox, HEAD);
    OK.h('p', { class: 'sec-p' }, headBox, TEXT);
    var frame = OK.h('div', { class: 'frame pic sr-pic' }, root), rv = OK.reveal(), mq = window.matchMedia('(max-width: 900px)');
    function draw() {
      rv.cancel();
      frame.textContent = '';
      frame.classList.toggle('sr-narrow', mq.matches);
      (mq.matches ? narrow : wide)(frame, rv);
    }
    draw();
    mq.addEventListener('change', draw);
    return { destroy: function () { mq.removeEventListener('change', draw); rv.cancel(); } };
  }
  OK.section('search', 'a', { label: 'Bands', mount: mount });
})();
