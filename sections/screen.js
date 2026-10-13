/* The Screen section: the 12,400 candidates pass six filters in order and 212 are kept. The
   pipeline line has a node per filter. Above a node stand the filter's name and setting, an icon
   of what the filter looks at (six icons of one size: four corner ticks around the part of a
   paper that is read, in ink) and, over the icon, what one paper costs there. Under a node the
   papers that reach the filter are counted in paper icons (one for 200 papers; the ones it
   removes stay as pale papers). Two versions are registered and differ only in how the cost is
   drawn: a, coins; b, a block of counted units. README.md owns the drawing language. */
(function () {
  'use strict';
  var OK = window.OK, D = OK.DATA, f = OK.f;
  var PARTS = ['year', 'cite', 'venue', 'words', 'title', 'abs'];   // what each filter looks at
  var READS = [0, 0, 0, 0, 4, 25];                  // what one paper costs at each filter, in units of model reading (illustrative)
  var SAID = { false: 'Checked by rule', true: 'Read by a language model' };   // the two kinds of filter, keyed by D.filters[k].model
  var UNIT = 200;                                   // papers to one icon
  var IW = 13, IH = 17, K = 0.85, ROW = 21;         // a counted paper, and the step from one row of them to the next
  var BW = 100, BH = 64, TICK = 8;                  // a filter's icon: every one is this size; the length of a corner tick
  var SET = '500 13.5px Hanken', SET_LH = 18;       // a filter's setting: its face, and the step between its lines
  var LAB = '600 14px Hanken';                      // the face of the kit's "lab"
  var NUDGE = { task: 0.8, lab: 0.6, 'sc-set': 0.4, 'sc-n': 1.3 };   // how far a face's first letter stands in from where it is set, so text shares one left edge
  var uid = 0;

  /* ---------- small drawing helpers ---------- */
  function g(parent, html) { var e = OK.svg('g', {}, parent); if (html) e.innerHTML = html; return e; }
  /** Returns a line of text. at: { x, y, mid } (mid: centred on x; otherwise it starts at x, optically aligned). */
  function text(cls, at, dy, s) {
    return '<text class="' + cls + '" x="' + f(at.x - (at.mid ? 0 : NUDGE[cls] || 0)) + '" y="' + f(at.y + dy) + '"' + (at.mid ? ' text-anchor="middle"' : '') + '>' + s + '</text>';
  }
  /** Returns one counted paper centred on x, y: the kit's icon drawn a size up and scaled, so its lines keep their proportion. */
  function counted(x, y, o) {
    return '<g transform="translate(' + f(x) + ' ' + f(y) + ') scale(' + K + ')">' + OK.paper(0, 0, IW / K, IH / K, o) + '</g>';
  }
  var ruler = null;
  /** Returns the width of a string set in a CSS font. */
  function widthOf(s, font) {
    ruler = ruler || document.createElement('canvas').getContext('2d');
    ruler.font = font;
    return ruler.measureText(s).width;
  }
  /** Splits a setting over at most two lines no longer than max, as evenly as its words allow. */
  function wrap(s, max) {
    if (widthOf(s, SET) <= max) return [s];
    var w = s.split(' '), best = null, i;
    for (i = 1; i < w.length; i++) {
      var a = w.slice(0, i).join(' '), b = w.slice(i).join(' '), m = Math.max(widthOf(a, SET), widthOf(b, SET));
      if (!best || m < best.m) best = { m: m, lines: [a, b] };
    }
    return best.lines;
  }

  /* ---------- the six icons ----------
     An icon is a view of BW by BH onto a paper, between four corner ticks. What the filter reads
     is in ink; the text beside it is quiet. A field of the paper's record is set in type (a
     year, a citation count, a venue's name); running text is word bars, as everywhere in the
     kit. One measure for all six: a line of the title is 6 thick, a line of text 3 or 4. */

  /** Returns one bar of text: from x, centred on height cy, w long and h thick. */
  function bar(x, cy, w, h, cls) {
    return '<rect class="' + cls + '" x="' + f(x) + '" y="' + f(cy - h / 2) + '" width="' + f(w) + '" height="' + h + '" rx="' + f(Math.min(h / 2, 3)) + '"/>';
  }
  /** Adds a line of words to an icon o. ws: [[length, kind]], kind 0: quiet, 1: read, 2: read and matched (on the marker). */
  function words(o, x, cy, ws, h, gap) {
    ws.forEach(function (w) {
      if (w[1] === 2) o.read += '<rect class="mark" x="' + f(x - 3) + '" y="' + f(cy - h / 2 - 3.5) + '" width="' + f(w[0] + 6) + '" height="' + (h + 7) + '"/>';
      o[w[1] ? 'read' : 'quiet'] += bar(x, cy, w[0], h, w[1] ? 'sc-ink' : 'sc-quiet');
      x += w[0] + gap;
    });
  }
  var SHOWS = {
    /* the year a paper appeared in */
    year: function (o, x, y) {
      o.read += '<text class="sc-fig" x="' + (x + BW / 2) + '" y="' + (y + 39) + '" text-anchor="middle">2019</text>';
    },
    /* how often it has been cited */
    cite: function (o, x, y) {
      o.read += '<text x="' + (x + BW / 2) + '" y="' + (y + 39) + '" text-anchor="middle"><tspan class="sc-by">cited by</tspan><tspan class="sc-fig" dx="6">48</tspan></text>';
    },
    /* where it was published: a journal's name */
    venue: function (o, x, y) {
      o.read += '<text class="sc-jn" x="' + (x + 15.1) + '" y="' + (y + 29) + '">Journal of</text>';
      words(o, x + 15.5, y + 41.5, [[26, 1], [38, 1]], 4.5, 5);
    },
    /* the words of title and abstract, a few of them matching */
    words: function (o, x, y) {
      var X = x + 11.5, G = 4.5;
      words(o, X, y + 15, [[16, 0], [24, 2], [12, 0], [11.5, 0]], 4, G);
      words(o, X, y + 26.5, [[22, 0], [10, 0], [18, 0], [13.5, 2]], 4, G);
      words(o, X, y + 38, [[11, 0], [17, 0], [26, 0], [9.5, 0]], 4, G);
      words(o, X, y + 49.5, [[20, 0], [9, 0], [22, 2]], 4, G);
    },
    /* the title, over the lines that follow it */
    title: function (o, x, y) {
      var X = x + 11.5, w = BW - 23;
      o.read += bar(X, y + 15, w, 6, 'sc-ink') + bar(X, y + 27, w * 0.62, 6, 'sc-ink');
      o.quiet += bar(X, y + 40, w * 0.4, 3, 'sc-quiet') + bar(X, y + 50, w, 3, 'sc-quiet');
    },
    /* the abstract, under the end of the title */
    abs: function (o, x, y) {
      var X = x + 11.5, w = BW - 23, i;
      o.quiet += bar(X, y + 13, w * 0.62, 6, 'sc-quiet');
      for (i = 0; i < 5; i++) o.read += bar(X, y + 25.5 + i * 7, w * (i === 4 ? 0.55 : 1), 3, 'sc-ink');
    }
  };
  /** Returns the four corner ticks of an icon with its top left corner at x, y. */
  function corners(x, y) {
    var e = 0.75, t = TICK - e, x1 = x + BW - e, y1 = y + BH - e;   // the stroke's outer edge stands on the icon's box
    x += e; y += e;
    return '<path class="sc-corner" d="M' + x + ',' + (y + t) + ' V' + y + ' H' + (x + t) + ' M' + (x1 - t) + ',' + y + ' H' + x1 + ' V' + (y + t) + ' M' + x1 + ',' + (y1 - t) + ' V' + y1 + ' H' + (x1 - t) + ' M' + (x + t) + ',' + y1 + ' H' + x + ' V' + (y1 - t) + '"/>';
  }
  /** Returns the icon of filter k with its top left corner at x, y: { frame, quiet, read } as markup. */
  function shows(k, x, y) {
    var o = { quiet: '', read: '', frame: corners(x, y) };
    SHOWS[PARTS[k]](o, x, y);
    return o;
  }

  /* ---------- what one paper costs ----------
     A cost stands on a foot, centred on x, and is returned as its parts from the foot up. */
  var CR = 13, CE = 5;                              // a coin: half its width, and its edge
  /** Returns a coin lying flat, seen from a little above, its upper face round (cx, y). ghost: a coin that is not paid, in dotted outline. */
  function coin(cx, y, ghost) {
    var ry = CR * 0.4, cls = ghost ? 'sc-ghost' : 'sc-coin';
    return '<path class="' + cls + '" d="M' + f(cx - CR) + ',' + f(y) + ' v' + CE + ' a' + CR + ',' + f(ry) + ' 0 0 0 ' + (2 * CR) + ',0 v' + (-CE) + '"/><ellipse class="' + cls + '" cx="' + f(cx) + '" cy="' + f(y) + '" rx="' + CR + '" ry="' + f(ry) + '"/>' +
      (ghost ? '' : '<ellipse class="sc-mint" cx="' + f(cx) + '" cy="' + f(y) + '" rx="' + f(CR - 3.8) + '" ry="' + f(ry - 1.6) + '"/>');
  }
  /** Version a. Returns the coins one paper costs at filter k, stacked (a coin for four units); where nothing is paid, one coin in dotted outline. */
  function coins(k, cx, foot) {
    var n = Math.round(READS[k] / 4), out = [], i;
    for (i = 0; i < Math.max(n, 1); i++) out.push(coin(cx, foot - 0.6 - CR * 0.4 - CE * (i + 1), !n));
    return out;
  }
  var U = 6.5, UG = 1.5;                            // a unit, and the room between two
  /** Version b. Returns the units one paper costs at filter k as a square block, row by row; where nothing is read, one grey unit. */
  function units(k, cx, foot) {
    var n = Math.max(1, Math.round(Math.sqrt(READS[k]))), w = n * U + (n - 1) * UG, out = [], r, c, s;
    var x0 = Math.round(cx * 2 - w) / 2;            // on a half pixel, so every unit's edges are sharp
    for (r = 0; r < n; r++) {
      s = '';
      for (c = 0; c < n; c++) s += '<rect class="' + (READS[k] ? 'sc-unit' : 'sc-unit sc-none') + '" x="' + f(x0 + c * (U + UG)) + '" y="' + f(foot - U - r * (U + UG)) + '" width="' + U + '" height="' + U + '" rx="1"/>';
      out.push(s);
    }
    return out;
  }

  /* ---------- where everything stands ---------- */
  /**
   * Returns the plan for a wide column (stack false: six filters side by side on a level line,
   * in a box 1280 wide) or a phone (stack true: six filters under one another on a line that
   * runs down, in a box 326 wide).
   * A filter: { box (its icon's top left corner), cost { x, foot }, node, name, set (first
   * baseline), lines, count, pile }. A group of filters of one kind: { says, at, rule: [x0, x1, y] }.
   */
  function plan(stack) {
    var P = { cols: [], groups: [], W: stack ? 326 : 1280 }, k, c;
    var reach = [D.deduped].concat(D.filters.map(function (F) { return F.pass; }));
    function col(k) {
      return { n: Math.round(reach[k] / UNIT), pass: Math.round(reach[k + 1] / UNIT), lines: stack ? [D.filters[k].setting] : wrap(D.filters[k].setting, 168) };
    }
    /* opens a group at filter k when its kind differs from the filter before it */
    function opens(k) { return !k || D.filters[k].model !== D.filters[k - 1].model; }
    if (stack) {
      var y = 52, LX = 7.5, X = 28;
      P.dot = { x: LX, y: 15 }; P.intro = { x: X, y: 19.5 };
      for (k = 0; k < 6; k++) {
        c = col(k);
        if (opens(k)) {
          var lw = widthOf(SAID[D.filters[k].model], LAB);
          P.groups.push({ k: k, says: SAID[D.filters[k].model], at: { x: X, y: y + 10 }, rule: [X + lw + 12, P.W, y + 5.5] });
          y += 40;
        }
        c.node = { x: LX, y: y + 9, r: 5.5 }; c.name = { x: X, y: y + 16 }; c.set = { x: X, y: y + 36 };
        c.box = { x: X, y: y + 54 };
        c.cost = { x: X + BW + 44, foot: c.box.y + BH };
        c.note = { x: c.cost.x + 30, y: c.cost.foot };
        c.count = { x: X, y: c.box.y + BH + 36 };   // the papers are counted under the icon
        c.pile = { x: X, y: c.count.y + 14, per: 16, dx: IW + 4 };
        if (k === 5) { c.count.y += 16; c.pile.y += 22; }
        c.bottom = c.pile.y + Math.ceil(c.n / c.pile.per) * ROW - 4;
        P.cols.push(c);
        y = c.bottom + 40;
      }
      P.H = y - 40 + 8;
      return P;
    }
    var M = 40, BLOCK = 8 * IW + 7 * 4, a0 = M + BLOCK / 2, step = (P.W - M - BLOCK / 2 - a0) / 5;
    var HEAD = 50, FOOT = 112, TOP = 126, NAME = TOP + BH + 31, LY = NAME + 22 + SET_LH + 48.5;
    for (k = 0; k < 6; k++) {
      c = col(k);
      var ax = Math.round(a0 + k * step);
      c.box = { x: ax - BW / 2, y: TOP };
      c.cost = { x: ax, foot: FOOT };
      c.note = { x: ax - 30, y: FOOT, end: true };
      c.name = { x: ax, y: NAME, mid: true };
      c.set = { x: ax, y: NAME + 22, mid: true };
      c.node = { x: ax, y: LY, r: 5.5 };
      c.count = { x: ax, y: LY + 46, mid: true };
      c.pile = { x: ax - BLOCK / 2, y: LY + 62, per: 8, dx: IW + 4, mid: k === 5 };
      c.bottom = c.pile.y + Math.ceil(c.n / c.pile.per) * ROW - 4;
      P.cols.push(c);
    }
    P.cols.forEach(function (c, k) {
      if (!opens(k)) return;
      var says = SAID[D.filters[k].model], last = k;
      while (last < 5 && !opens(last + 1)) last++;
      P.groups.push({ k: k, says: says, at: { x: c.pile.x, y: HEAD }, rule: [c.pile.x + widthOf(says, LAB) + 12, P.cols[last].pile.x + BLOCK, HEAD - 4.5] });
    });
    P.dot = null; P.start = { x: M, y: LY }; P.intro = { x: M, y: LY - 15 };
    P.H = P.cols[0].bottom + M;
    return P;
  }

  /* ---------- drawing ---------- */
  /** Draws a plan into svg, the cost in the way V draws it, and returns the parts the reveal moves. */
  function draw(svg, P, titleId, V) {
    var d = { segs: [], cols: [], groups: [] };
    svg.textContent = '';
    svg.setAttribute('viewBox', '0 0 ' + P.W + ' ' + f(P.H));
    svg.style.aspectRatio = P.W + ' / ' + f(P.H);
    OK.svg('title', { id: titleId }, svg, 'The ' + OK.fmt(D.deduped) + ' candidate papers pass six filters in order: ' +
      D.filters.map(function (F) { return F.name + ' looks at ' + F.reads + ' (' + F.setting + ') and ' + OK.fmt(F.pass) + ' pass'; }).join('; ') +
      '. Each filter has an icon of the same size that shows what it looks at. The first four are checked by rule and cost almost nothing for a paper; the last two are read by a language model, and ' + V.says +
      ' ' + D.kept + ' are kept. One paper icon stands for ' + UNIT + ' papers.');
    var gLine = g(svg), gTop = g(svg), gOver = g(svg);

    // the pipeline line: one stretch to each filter's node
    var from = P.dot || P.start;
    if (P.dot) d.dot = OK.svg('circle', { class: 'port', cx: P.dot.x, cy: P.dot.y, r: 5.5 }, gLine);
    d.intro = g(gTop, '<text x="' + f(P.intro.x - NUDGE['sc-n']) + '" y="' + P.intro.y + '"><tspan class="sc-n">' + OK.fmt(D.deduped) + '</tspan><tspan class="note" dx="8">after duplicates</tspan></text>');
    P.cols.forEach(function (c, k) {
      var a = k ? P.cols[k - 1].node : from;
      d.segs.push(OK.svg('path', { class: 'lead' + (k || P.dot ? ' cut' : ''), d: 'M' + f(a.x + (k || P.dot ? 0 : 1.5)) + ',' + f(a.y) + ' L' + f(c.node.x) + ',' + f(c.node.y), pathLength: 1 }, gLine));
    });

    // the two kinds of filter: each kind's words, and a hairline as far as its filters reach
    P.groups.forEach(function (G) {
      d.groups.push({ k: G.k, says: g(gTop, text('lab', G.at, 0, G.says)), rule: OK.svg('path', { class: 'rule', d: 'M' + f(G.rule[0]) + ',' + G.rule[2] + ' H' + f(G.rule[1]), pathLength: 1 }, gTop) });
    });

    P.cols.forEach(function (c, k) {
      var F = D.filters[k], o = { rows: [], out: [], cost: [] }, i, t = '';
      o.name = g(gTop, text('task', c.name, 0, F.name));
      c.lines.forEach(function (l, i) { t += text('sc-set', c.set, i * SET_LH, l); });
      o.set = g(gTop, t);
      // the icon: its ticks and the quiet text, then what the filter reads
      var I = shows(k, c.box.x, c.box.y);
      o.icon = g(gTop, I.quiet + I.frame);
      o.read = g(gTop, I.read);
      // what one paper costs here
      V.cost(k, c.cost.x, c.cost.foot).forEach(function (p) { o.cost.push(g(gTop, p)); });
      if (V.note && k === V.note.k) o.note = g(gTop, '<text class="note" x="' + f(c.note.x) + '" y="' + f(c.note.y - 0.5) + '"' + (c.note.end ? ' text-anchor="end"' : '') + '>' + V.note.says + '</text>');
      o.node = OK.svg('circle', { class: 'port', cx: f(c.node.x), cy: f(c.node.y), r: f(c.node.r) }, gOver);
      // the papers that reach this filter, in rows; the ones it removes are pale papers under an ink paper that leaves
      var rows = Math.ceil(c.n / c.pile.per), last = k === 5, lead = c.pile.mid ? Math.floor((c.n - c.pass) / 2) : 0;
      var px = c.pile.mid ? c.node.x - ((c.n - 1) * c.pile.dx) / 2 : c.pile.x + IW / 2;
      for (i = 0; i < rows; i++) o.rows.push(g(gTop));
      for (i = 0; i < c.n; i++) {
        var r = Math.floor(i / c.pile.per), x = px + (i % c.pile.per) * c.pile.dx, y = c.pile.y + IH / 2 + r * ROW;
        if (i >= lead && i < lead + c.pass) { g(o.rows[r], counted(x, y, { kept: last })); continue; }
        g(o.rows[r], counted(x, y, { pale: true }));
        var leaving = g(o.rows[r], counted(x, y));
        leaving.setAttribute('opacity', 0);
        o.out.push(leaving);
      }
      // how many pass; after the last filter, the number the picture ends on
      if (last) {
        var bw = Math.ceil(widthOf(String(D.kept), '600 34px Hanken') * 0.97) + 14, by = c.count.y;
        var bx = c.count.mid ? c.count.x - (bw + 10 + widthOf('kept', '600 20px Hanken')) / 2 : c.count.x;
        o.count = g(gTop, '<rect class="mark" x="' + f(bx) + '" y="' + f(by - 31) + '" width="' + bw + '" height="38"/>' +
          text('sc-big', { x: bx + 7, y: by }, 0, D.kept) + text('sc-kept', { x: bx + bw + 10, y: by }, 0, 'kept'));
      } else o.count = g(gTop, text('sc-n', c.count, 0, OK.fmt(F.pass)));
      o.slow = F.model;
      d.cols.push(o);
    });
    return d;
  }

  /* ---------- the reveal: left to right, the order a reader takes it in ---------- */
  var T0 = 350, EVERY = 520;
  /** Lets an SVG element grow from its own middle. */
  function pop(R, e, delay, dur) {
    e.style.transformBox = 'fill-box'; e.style.transformOrigin = 'center';
    R.from(e, [{ opacity: 0, transform: 'scale(.6)' }, { opacity: 1, transform: 'scale(1)' }], delay, dur);
  }
  /** Lays the reveal R over the drawn parts d: the line runs to each filter in turn, and the filter shows itself as the line arrives. */
  function play(R, d) {
    R.cancel();
    if (d.dot) R.fade(d.dot, 0, 250);
    R.fade(d.intro, 100, 350);
    d.groups.forEach(function (G, i) {
      var t = T0 + G.k * EVERY, next = d.groups[i + 1] ? d.groups[i + 1].k : d.cols.length;
      R.arrive(G.says, t - 120); R.stroke(G.rule, t, (next - G.k) * EVERY);
    });
    d.cols.forEach(function (o, k) {
      var t = T0 + k * EVERY;
      R.stroke(d.segs[k], k ? t - EVERY * 0.7 : 80, k ? EVERY : T0);
      R.arrive(o.icon, t); R.arrive(o.name, t + 60); R.arrive(o.set, t + 120);
      // a rule's check lands at once; what a language model reads is taken in from left to right
      if (o.slow) R.from(o.read, [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }], t + 260, 700);
      else R.fade(o.read, t + 280, 300);
      o.cost.forEach(function (p, i) { R.arrive(p, t + (o.slow ? 620 : 420) + i * 70, 320); });
      if (o.note) R.fade(o.note, t + 700, 360);
      pop(R, o.node, t + 100, 260);
      o.rows.forEach(function (r, i) { R.arrive(r, t + 160 + i * 28, 320); });
      o.out.forEach(function (e, i) { R.from(e, [{ opacity: 1 }, { opacity: 0 }], t + 620 + i * 300 / o.out.length, 320); });
      if (k < 5) R.fade(o.count, t + 700, 360); else R.arrive(o.count, t + 1000, 480);
    });
  }

  /* ---------- the section ---------- */
  /** Returns the mount of one version. V: { cost(k, cx, foot): the parts of a cost, says: the cost in words, note: { k, says } or null }. */
  function section(V) {
    return function (root) {
      var id = 'sc-t' + (++uid);
      root.innerHTML = '<div class="sec-head"><h2 class="sec-h">Cheap checks first. The language model reads what is left.</h2>' +
        '<p class="sec-p">Year, citations, venue and keywords cost almost nothing to check and remove most papers. Only the titles and abstracts that remain go to a language model, so the cost is spent on papers that may belong.</p></div>' +
        '<div class="frame pic sc-pic"><svg class="sc-svg" role="img" aria-labelledby="' + id + '"></svg></div>';
      var svg = root.querySelector('svg'), narrow = window.matchMedia('(max-width: 800px)'), R = OK.reveal(), d = null, arrived = false, gone = false;
      function render() {
        R.cancel();
        root.querySelector('.sc-pic').classList.toggle('sc-stack', narrow.matches);
        d = draw(svg, plan(narrow.matches), id, V);
        if (arrived) play(R, d);
      }
      function replay() { if (arrived) play(R, d); }
      render();
      OK.onArrive(svg, function () { if (gone) return; arrived = true; play(R, d); });
      narrow.addEventListener('change', render);
      window.addEventListener('ok:replay', replay);
      return { destroy: function () { gone = true; R.cancel(); narrow.removeEventListener('change', render); window.removeEventListener('ok:replay', replay); } };
    };
  }
  OK.section('screen', 'a', { label: 'Cost in coins', mount: section({ cost: coins, note: null,
    says: 'a paper costs one coin where only its title is read and a stack of six where its abstract is read.' }) });
  OK.section('screen', 'b', { label: 'Cost in units', mount: section({ cost: units, note: { k: 5, says: 'cost per paper' },
    says: 'the cost of a paper is a block of units, small where only its title is read and several times larger where its abstract is read.' }) });
})();
