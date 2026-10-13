/* The Screen section: the 12,400 candidates pass the filters of OK.DATA in order and 212 are
   kept. The pipeline line has a node per filter. Above a node stand the filter's name and
   setting, an icon of what the filter looks at (every icon the same view onto a paper, between
   four corner ticks, with the part that is read in ink) and, over the icon, what one paper costs
   there in coins. Under a node the papers that reach the filter are counted in paper icons (one
   for 200 papers; the ones it removes stay as pale papers). README.md owns the drawing language. */
(function () {
  'use strict';
  var OK = window.OK, D = OK.DATA, f = OK.f, N = D.filters.length;
  var COINS = { 'the title': 1, 'the abstract': 3, 'the full text': 6 };   // what one paper costs where a language model reads it, keyed by D.filters[k].reads (illustrative); a rule's check costs none
  var SAID = { false: 'Checked by rule', true: 'Read by a language model' };   // the two kinds of filter, keyed by D.filters[k].model
  var UNIT = 200;                                   // papers to one icon
  var IW = 13, IH = 17, K = 0.85, ROW = 21;         // a counted paper, and the step from one row of them to the next
  var BW = 100, BH = 64, TICK = 8;                  // a filter's icon: every one is this size; the length of a corner tick
  var SET = '500 13.5px Hanken', SET_LH = 18;       // a filter's setting: its face, and the step between its lines
  var LAB = '600 14px Hanken';                      // the face of the kit's "lab"
  var WORD = '600 12.5px Hanken';                   // the face of a word printed in an icon (sc-word)
  var NUDGE = { task: 0.8, lab: 0.6, 'sc-set': 0.4, 'sc-n': 1.3, 'sc-word': 0.5 };   // how far a face's first letter stands in from where it is set, so text shares one left edge
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
  /** Returns names as a phrase: "a, b and c". */
  function listed(a) { return a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]; }

  /* ---------- the icons ----------
     Every icon is a view of BW by BH onto the same paper, between four corner ticks: what the
     filter looks at is in ink, the rest of the paper around it is quiet. The paper, from its
     top: a venue line; a title of two lines; a line of authors and year; its text; at its foot,
     a line of citations. A view shows a few of these lines, or more of the text. One measure for all: a line
     of the title is THICK, every other line THIN, both set IN from the icon's edge; the words
     every paper prints alike ("Journal of", "cited by") and the numbers are type, any other
     word is a bar, as everywhere in the kit. */
  var THICK = 6, THIN = 4, IN = 10, WIDE = BW - 2 * IN, SPACE = 4.5;   // WIDE: a full line; SPACE: between two words
  var VENUE = [33, 12, 26], AUTHORS = [20, 9], YEAR = 18;   // the lengths of the words of a paper's record

  /** Returns one bar of text: from x, centred on height cy, w long and h thick. */
  function bar(x, cy, w, h, cls) {
    return '<rect class="' + cls + '" x="' + f(x) + '" y="' + f(cy - h / 2) + '" width="' + f(w) + '" height="' + h + '" rx="' + f(Math.min(h / 2, 3)) + '"/>';
  }
  /** Adds a line of words h thick to an icon o, from x at height cy. ws: the words' lengths; a length given as [length] is a word that matches, drawn in ink on the marker. */
  function words(o, x, cy, ws, h) {
    ws.forEach(function (w) {
      var hit = w.length, len = hit ? w[0] : w;
      if (hit) o.read += '<rect class="mark" x="' + f(x - 3) + '" y="' + f(cy - h / 2 - 3.5) + '" width="' + f(len + 6) + '" height="' + (h + 7) + '"/>' + bar(x, cy, len, h, 'sc-ink');
      else o.quiet += bar(x, cy, len, h, 'sc-quiet');
      x += len + SPACE;
    });
  }
  /** Adds the two lines of the title to an icon o, the first at height cy; read: in ink. */
  function title(o, x, cy, read) {
    o[read ? 'read' : 'quiet'] += bar(x, cy, WIDE, THICK, read ? 'sc-ink' : 'sc-quiet') + bar(x, cy + 11, WIDE * 0.62, THICK, read ? 'sc-ink' : 'sc-quiet');
  }
  var SHOWS = {
    /* the year, in the head of the paper: under the title, after the authors, before the text begins */
    'the year': function (o, x, y) {
      title(o, x, y + 11);
      words(o, x, y + 36.5, AUTHORS, THIN);
      o.read += '<text class="sc-fig" x="' + f(x + WIDE) + '" y="' + f(y + 41.8) + '" text-anchor="end">2019</text>';
      o.quiet += bar(x, y + 50.5, WIDE, THIN, 'sc-quiet');
    },
    /* the citation count, at the foot of the paper: under the last lines of its text */
    'the citation count': function (o, x, y) {
      for (var i = 0; i < 4; i++) o.quiet += bar(x, y + 10 + i * 7.5, WIDE * (i === 3 ? 0.55 : 1), THIN, 'sc-quiet');
      o.read += '<text x="' + f(x - NUDGE['sc-word']) + '" y="' + f(y + 53.8) + '"><tspan class="sc-word">cited by</tspan><tspan class="sc-fig" dx="6">48</tspan></text>';
    },
    /* the venue: a journal's name, over the title */
    'the venue': function (o, x, y) {
      var w = widthOf('Journal of', WORD) + 5;
      o.read += text('sc-word', { x: x, y: y + 17 }, 0, 'Journal of') + bar(x + w, y + 13.7, WIDE - w, THIN, 'sc-ink');
      title(o, x, y + 28.5);
      words(o, x, y + 53, AUTHORS.concat(YEAR), THIN);
    },
    /* the words of title and abstract, a few of them matching */
    'words in title and abstract': function (o, x, y) {
      words(o, x, y + 12, [23, [29], 19], THICK);
      words(o, x, y + 26.5, [23, 11, 18, [14.5]], THIN);
      words(o, x, y + 38.5, [12, 18, 26, 10.5], THIN);
      words(o, x, y + 50.5, [20, 9, [22]], THIN);
    },
    /* the title, between the venue and the authors */
    'the title': function (o, x, y) {
      words(o, x, y + 12.5, VENUE, THIN);
      title(o, x, y + 28.5, true);
      words(o, x, y + 53, AUTHORS.concat(YEAR), THIN);
    },
    /* the abstract, under the end of the title */
    'the abstract': function (o, x, y) {
      o.quiet += bar(x, y + 12, WIDE * 0.62, THICK, 'sc-quiet');
      for (var i = 0; i < 5; i++) o.read += bar(x, y + 24.5 + i * 7.5, WIDE * (i === 4 ? 0.55 : 1), THIN, 'sc-ink');
    },
    /* the whole paper: a page of its body in two columns, a section's heading and text beside a figure and the text under it */
    'the full text': function (o, x, y) {
      var col = (WIDE - 7) / 2, x2 = x + col + 7, i;
      o.read += bar(x, y + 11, col * 0.45, THICK, 'sc-ink');
      for (i = 0; i < 5; i++) o.read += bar(x, y + 22 + i * 7.5, col * (i === 4 ? 0.6 : 1), THIN, 'sc-ink');
      o.read += figure(x2, y + 8, col, 27.5);
      for (i = 0; i < 2; i++) o.read += bar(x2, y + 44.5 + i * 7.5, col * (i ? 0.7 : 1), THIN, 'sc-ink');
    }
  };
  /** Returns a figure of the paper, w by h with its top left corner at x, y: a block in ink with a plot in white, its points rising. */
  function figure(x, y, w, h) {
    var x0 = x + 6.5, y0 = y + h - 6.5, s = '<rect class="sc-ink" x="' + f(x) + '" y="' + f(y) + '" width="' + f(w) + '" height="' + h + '" rx="2.5"/>';
    s += '<path class="sc-plot" d="M' + f(x0) + ',' + f(y + 5.5) + ' V' + f(y0) + ' H' + f(x + w - 5.5) + '"/>';
    [[6, 4], [11.5, 6.5], [16.5, 9.5], [21.5, 13]].forEach(function (p) { s += '<circle class="sc-pt" cx="' + f(x0 + p[0]) + '" cy="' + f(y0 - p[1]) + '" r="1.6"/>'; });
    return s;
  }
  /** Returns the four corner ticks of an icon with its top left corner at x, y. */
  function corners(x, y) {
    var e = 0.75, t = TICK - e, x1 = x + BW - e, y1 = y + BH - e;   // the stroke's outer edge stands on the icon's box
    x += e; y += e;
    return '<path class="sc-corner" d="M' + x + ',' + (y + t) + ' V' + y + ' H' + (x + t) + ' M' + (x1 - t) + ',' + y + ' H' + x1 + ' V' + (y + t) + ' M' + x1 + ',' + (y1 - t) + ' V' + y1 + ' H' + (x1 - t) + ' M' + (x + t) + ',' + y1 + ' H' + x + ' V' + (y1 - t) + '"/>';
  }
  /** Returns the icon of filter k with its top left corner at x, y: { frame, quiet, read } as markup. */
  function shows(k, x, y) {
    var o = { quiet: '', read: '', frame: corners(x, y) };
    SHOWS[D.filters[k].reads](o, x + IN, y);
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
  /** Returns the coins one paper costs at filter k, stacked; where nothing is paid, one coin in dotted outline. */
  function coins(k, cx, foot) {
    var n = COINS[D.filters[k].reads] || 0, out = [], i;
    for (i = 0; i < Math.max(n, 1); i++) out.push(coin(cx, foot - 0.6 - CR * 0.4 - CE * (i + 1), !n));
    return out;
  }

  /* ---------- where everything stands ---------- */
  /**
   * Returns the plan for a wide column (stack false: the filters side by side on a level line,
   * in a box 1280 wide) or a phone (stack true: the filters under one another on a line that
   * runs down, in a box 326 wide).
   * A filter: { box (its icon's top left corner), cost { x, foot }, node, name, set (first
   * baseline), lines, count, pile }. A group of filters of one kind: { says, at, rule: [x0, x1, y] }.
   */
  function plan(stack) {
    var P = { cols: [], groups: [], W: stack ? 326 : 1280 }, k, c;
    var reach = [D.deduped].concat(D.filters.map(function (F) { return F.pass; }));
    var M = 40, BLOCK = 8 * IW + 7 * 4, a0 = M + BLOCK / 2, step = (P.W - M - BLOCK / 2 - a0) / (N - 1);   // the wide column: its margin, a block of counted papers, the first node, node to node
    function col(k) {
      return { n: Math.round(reach[k] / UNIT), pass: Math.round(reach[k + 1] / UNIT), lines: stack ? [D.filters[k].setting] : wrap(D.filters[k].setting, step - 24) };
    }
    /* opens a group at filter k when its kind differs from the filter before it */
    function opens(k) { return !k || D.filters[k].model !== D.filters[k - 1].model; }
    if (stack) {
      var y = 52, LX = 7.5, X = 28;
      P.dot = { x: LX, y: 15 }; P.intro = { x: X, y: 19.5 };
      for (k = 0; k < N; k++) {
        c = col(k);
        if (opens(k)) {
          var lw = widthOf(SAID[D.filters[k].model], LAB);
          P.groups.push({ k: k, says: SAID[D.filters[k].model], at: { x: X, y: y + 10 }, rule: [X + lw + 12, P.W, y + 5.5] });
          y += 40;
        }
        c.node = { x: LX, y: y + 9, r: 5.5 }; c.name = { x: X, y: y + 16 }; c.set = { x: X, y: y + 36 };
        c.box = { x: X, y: y + 54 };
        c.cost = { x: X + BW + 44, foot: c.box.y + BH };
        c.count = { x: X, y: c.box.y + BH + 36 };   // the papers are counted under the icon
        c.pile = { x: X, y: c.count.y + 14, per: 16, dx: IW + 4 };
        if (k === N - 1) { c.count.y += 16; c.pile.y += 22; }
        c.bottom = c.pile.y + Math.ceil(c.n / c.pile.per) * ROW - 4;
        P.cols.push(c);
        y = c.bottom + 40;
      }
      P.H = y - 40 + 8;
      return P;
    }
    var HEAD = 50, FOOT = 112, TOP = 126, NAME = TOP + BH + 31, LY = NAME + 22 + SET_LH + 48.5;
    for (k = 0; k < N; k++) {
      c = col(k);
      var ax = Math.round(a0 + k * step);
      c.box = { x: ax - BW / 2, y: TOP };
      c.cost = { x: ax, foot: FOOT };
      c.name = { x: ax, y: NAME, mid: true };
      c.set = { x: ax, y: NAME + 22, mid: true };
      c.node = { x: ax, y: LY, r: 5.5 };
      c.count = { x: ax, y: LY + 46, mid: true };
      c.pile = { x: ax - BLOCK / 2, y: LY + 62, per: 8, dx: IW + 4, mid: c.n < 8 };   // papers short of a full row stand in the middle, under the node
      c.bottom = c.pile.y + Math.ceil(c.n / c.pile.per) * ROW - 4;
      P.cols.push(c);
    }
    P.cols.forEach(function (c, k) {
      if (!opens(k)) return;
      var says = SAID[D.filters[k].model], last = k;
      while (last < N - 1 && !opens(last + 1)) last++;
      P.groups.push({ k: k, says: says, at: { x: c.pile.x, y: HEAD }, rule: [c.pile.x + widthOf(says, LAB) + 12, P.cols[last].pile.x + BLOCK, HEAD - 4.5] });
    });
    P.dot = null; P.start = { x: M, y: LY }; P.intro = { x: M, y: LY - 15 };
    P.H = P.cols[0].bottom + M;
    return P;
  }

  /* ---------- drawing ---------- */
  /** Returns what the picture shows, in words. */
  function told() {
    var byRule = D.filters.filter(function (F) { return !F.model; }), byModel = D.filters.filter(function (F) { return F.model; });
    function names(a) { return listed(a.map(function (F) { return F.name; })); }
    return 'The ' + OK.fmt(D.deduped) + ' candidate papers pass ' + N + ' filters in order: ' +
      D.filters.map(function (F) { return F.name + ' looks at ' + F.reads + ' (' + F.setting + ') and ' + OK.fmt(F.pass) + ' pass'; }).join('; ') +
      '. Each filter has an icon of the same size: a view onto a paper, with the part the filter looks at in ink. ' + names(byRule) + ' are checked by rule and cost almost nothing for a paper; ' +
      names(byModel) + ' are read by a language model and cost ' + listed(byModel.map(function (F) { return COINS[F.reads]; })) + ' coins for a paper. ' +
      D.kept + ' are kept. One paper icon stands for ' + UNIT + ' papers.';
  }
  /** Draws a plan into svg and returns the parts the reveal moves. d.level: the filters stand side by side, so their papers can travel from one to the next. */
  function draw(svg, P, titleId) {
    var d = { segs: [], cols: [], groups: [], level: !P.dot };
    svg.textContent = '';
    svg.setAttribute('viewBox', '0 0 ' + P.W + ' ' + f(P.H));
    svg.style.aspectRatio = P.W + ' / ' + f(P.H);
    OK.svg('title', { id: titleId }, svg, told());
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
      var F = D.filters[k], o = { rows: [], slots: [], passed: [], out: [], cost: [] }, i, t = '';
      o.name = g(gTop, text('task', c.name, 0, F.name));
      c.lines.forEach(function (l, i) { t += text('sc-set', c.set, i * SET_LH, l); });
      o.set = g(gTop, t);
      // the icon: its ticks and the quiet text, then what the filter reads
      var I = shows(k, c.box.x, c.box.y);
      o.icon = g(gTop, I.quiet + I.frame);
      o.read = g(gTop, I.read);
      // what one paper costs here
      coins(k, c.cost.x, c.cost.foot).forEach(function (p) { o.cost.push(g(gTop, p)); });
      o.node = OK.svg('circle', { class: 'port', cx: f(c.node.x), cy: f(c.node.y), r: f(c.node.r) }, gOver);
      // the papers that reach this filter, in rows. A slot holds one paper as the filter leaves it: in ink when it
      // passes, pale when it is removed, yellow when it is kept; over a pale or a yellow one lies the ink paper it arrived as
      var rows = Math.ceil(c.n / c.pile.per), last = k === N - 1, lead = c.pile.mid ? Math.floor((c.n - c.pass) / 2) : 0;
      var px = c.pile.mid ? c.node.x - ((c.n - 1) * c.pile.dx) / 2 : c.pile.x + IW / 2;
      for (i = 0; i < rows; i++) o.rows.push(g(gTop));
      for (i = 0; i < c.n; i++) {
        var r = Math.floor(i / c.pile.per), x = px + (i % c.pile.per) * c.pile.dx, y = c.pile.y + IH / 2 + r * ROW;
        var passes = i >= lead && i < lead + c.pass, slot = { e: g(o.rows[r], counted(x, y, passes ? { kept: last } : { pale: true })), x: x, y: y, row: r };
        o.slots.push(slot);
        if (passes) o.passed.push(slot);
        if (passes && !last) continue;
        var arrived = g(slot.e, counted(x, y));
        arrived.setAttribute('opacity', 0);
        o.out.push(arrived);
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

  /* ---------- the reveal: left to right, the order a reader takes it in ----------
     A filter's turn begins EVERY after the one before it. SETTLED into its turn its papers stand
     under its node; then it gives its verdict (the removed papers go pale) and its count shows.
     Side by side (d.level), the papers that passed travel on to the next filter and are its
     papers: every slot of a filter starts where the paper it holds stood at the filter before,
     which keeps its own copy in ink. Under one another, a filter's papers arrive where they stand. */
  var T0 = 350, EVERY = 520, SETTLED = 480, TRAVEL = 300;
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
      pop(R, o.node, t + 100, 260);
      var from = d.level && k ? d.cols[k - 1].passed : null, each = Math.min(28, (SETTLED - 360) / Math.max(1, o.rows.length - 1));
      if (from) o.slots.forEach(function (s, j) {
        var there = 'translate(' + f(from[j].x - s.x) + 'px,' + f(from[j].y - s.y) + 'px)';
        // hidden until it leaves, a row a moment after the row above it
        R.from(s.e, [{ opacity: 0, transform: there }, { opacity: 1, transform: there, offset: 0.01 }, { opacity: 1, transform: 'translate(0,0)' }], t + SETTLED - TRAVEL + s.row * 12, TRAVEL);
      });
      else o.rows.forEach(function (r, i) { R.arrive(r, t + 60 + i * each, 300); });
      o.out.forEach(function (e, i) { R.from(e, [{ opacity: 1 }, { opacity: 0 }], t + SETTLED + 20 + i * 60 / o.out.length, 220); });
      if (k < d.cols.length - 1) R.fade(o.count, t + SETTLED + 120, 320); else R.arrive(o.count, t + 1000, 480);
    });
  }

  /* ---------- the section ---------- */
  /** Fills root with the section (heading, text and picture) and returns { destroy() }. */
  function mount(root) {
    var id = 'sc-t' + (++uid);
    root.innerHTML = '<div class="sec-head"><h2 class="sec-h">Screening that scales within your budget</h2>' +
      '<p class="sec-p">Rule checks on year, citations, venue and keywords cost almost nothing and remove most papers. A language model reads only what remains, first titles, then abstracts, then full&nbsp;texts, so the cost stays within budget as the search grows.</p></div>' +
      '<div class="frame pic sc-pic"><svg class="sc-svg" role="img" aria-labelledby="' + id + '"></svg></div>';
    var svg = root.querySelector('svg'), narrow = window.matchMedia('(max-width: 800px)'), R = OK.reveal(), d = null, arrived = false, gone = false;
    function render() {
      R.cancel();
      root.querySelector('.sc-pic').classList.toggle('sc-stack', narrow.matches);
      d = draw(svg, plan(narrow.matches), id);
      if (arrived) play(R, d);
    }
    function replay() { if (arrived) play(R, d); }
    render();
    OK.onArrive(svg, function () { if (gone) return; arrived = true; play(R, d); });
    narrow.addEventListener('change', render);
    window.addEventListener('ok:replay', replay);
    return { destroy: function () { gone = true; R.cancel(); narrow.removeEventListener('change', render); window.removeEventListener('ok:replay', replay); } };
  }
  OK.section('screen', 'a', { label: 'Cost in coins', mount: mount });
})();
