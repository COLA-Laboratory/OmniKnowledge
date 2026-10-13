/* The Screen section: the 12,400 candidates pass six filters in order and 212 are kept. Six
   sheets stand side by side, each showing the part its filter reads in ink; the pipeline line
   has a node per filter, and under each node the papers that reach the filter are counted in
   paper icons (one for 200 papers; the ones it removes stay as pale papers). The sheets grow
   from a slip to a page and hold more: a later filter reads more closely and costs more.
   README.md owns the drawing language. */
(function () {
  'use strict';
  var OK = window.OK, D = OK.DATA, f = OK.f, INK = '#0b0b0c', QUIET = '#dfdfd9';
  var PARTS = ['year', 'cite', 'venue', 'words', 'title', 'abs'];
  var UNIT = 200;                                   // papers to one icon
  var IW = 13, IH = 17, K = 0.85, ROW = 21;         // a counted paper, and the step from one row of them to the next
  var SET = '500 13.5px Hanken', SET_LH = 18;       // a filter's setting: its face, and the step between its lines
  var NUDGE = { task: 0.8, 'sc-set': 0.4, 'sc-n': 1.3 };   // how far a face's first letter stands in from where it is set, so text and sheets share one left edge
  var uid = 0;

  /* ---------- small drawing helpers ---------- */
  function g(parent, html) { var e = OK.svg('g', {}, parent); if (html) e.innerHTML = html; return e; }
  /** Returns a line of text. at: { x, y, mid } (mid: centred on x; otherwise it starts at x, optically aligned). */
  function text(cls, at, dy, s) {
    return '<text class="' + cls + '" x="' + f(at.x - (at.mid ? 0 : NUDGE[cls] || 0)) + '" y="' + f(at.y + dy) + '"' + (at.mid ? ' text-anchor="middle"' : '') + '>' + s + '</text>';
  }
  /** Returns one counted paper centred on x, y: the kit's icon drawn a size up and scaled, so its lines keep their proportion. */
  function icon(x, y, o) {
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

  /* ---------- the sheets ----------
     A sheet is set in one measure (measuredSheet): every line of text has one thickness and one
     pitch, so a larger sheet holds more instead of being drawn larger. It returns the kit's
     geometry and, beside it: skip and extra (what sheetBase leaves out, and the quiet stand-ins
     drawn instead), words (title and abstract word by word), yr (where the year is printed),
     cited (the words "cited by"), count (the bar that stands for the citation count), pill (the
     pill around both) and m (the room around ticks). */

  var PAD = 12, FOLD = 14, LINE = 3, HEAD = 6;      // the one measure: margin, folded corner, a line of text, a line of the title
  var Y = { meta: 17, title: 34, title2: 46, auth: 57, cite: 76, abs: 94, step: 8 };   // where each part's line stands under the sheet's top
  var HOLDS = [{ abs: 0, body: 0 }, { abs: 0, body: 0 }, { abs: 4, body: 0 }, { abs: 7, body: 0 }, { abs: 7, body: 4 }, { abs: 10, body: 5 }];   // lines of abstract and rows of body text sheet k has room for
  /** Splits one line into word-sized pieces of the measure; hits: which of them match. */
  function wordsOf(r, rnd, hits, wide) {
    var out = [], x = r.x, k = 0, gap = wide ? 4.5 : 3.2;
    while (x < r.x + r.w - 6) {
      var w = Math.min((wide ? 15 : 9) + rnd() * (wide ? 16 : 13), r.x + r.w - x);
      if (r.x + r.w - (x + w) < 9) w = r.x + r.w - x;
      out.push({ x: x, y: r.y, w: w, h: r.h, hit: hits.indexOf(k) >= 0 });
      x += w + gap; k++;
    }
    return out;
  }
  /** Returns the measured sheet of filter k at (x, y), w by h: as much of a paper as its size has room for. */
  function measuredSheet(k, x, y, w, h, part) {
    var iw = w - 2 * PAD, x0 = x + PAD, hold = HOLDS[k], s = { x: x, y: y, w: w, h: h, e: FOLD, pad: PAD, iw: iw, hv: LINE, m: 4 }, i;
    function line(cy, lw, th, dx) { return { x: x0 + (dx || 0), y: y + cy - (th || LINE) / 2, w: lw, h: th || LINE }; }
    s.skip = { year: 1, cite: 1 }; s.extra = ''; s.words = null;
    // the first line: the year, then the venue
    var vx = part === 'year' ? 38 : 26;
    s.venue = [line(Y.meta, Math.min(44, w - FOLD - 6 - PAD - vx), LINE, vx)];
    if (part === 'year') s.yr = { x: x0, w: 28, cy: y + Y.meta, fs: 12 };
    else s.extra += OK.bar(line(Y.meta, 16), QUIET);
    s.title = [line(Y.title, iw, HEAD), line(Y.title2, iw * 0.62, HEAD)];
    s.auth = [h > Y.auth + 12 ? line(Y.auth, iw * 0.45) : { x: x0, y: y, w: 0, h: 0 }];   // a slip ends before the authors
    if (part === 'cite') {
      s.pill = { x: x0 - 1, y: y + Y.cite - 9, w: iw + 2, h: 18 };
      s.cited = { x: s.pill.x + 8.6, y: y + Y.cite + 4.1, fs: 12 };
      s.count = { x: s.pill.x + s.pill.w - 8.6 - 8, y: y + Y.cite - 1.65, w: 8, h: 3.3 };
    }
    else if (h > Y.cite + 12) s.extra += OK.bar(line(Y.cite, iw * 0.34), QUIET);
    s.abs = [];
    for (i = 0; i < hold.abs; i++) s.abs.push(line(Y.abs + i * Y.step, iw * (i === hold.abs - 1 ? 0.58 : 1)));
    s.body = [];
    var by = Y.abs + hold.abs * Y.step + 10;
    for (i = 0; i < hold.body * 2; i++) s.body.push(line(by + Math.floor(i / 2) * Y.step, iw * (i === hold.body * 2 - 1 ? 0.3 : 0.46), 2.5, (i % 2) * iw * 0.54));
    if (part === 'words') {
      var rnd = OK.prng(23), hits = [[1], [0], [3], [0, 1], [], [2], [1], [], [0]];
      s.words = [];
      s.title.concat(s.abs).forEach(function (r, n) { s.words = s.words.concat(wordsOf(r, rnd, hits[n] || [], n < 2)); });
    }
    return s;
  }

  /** Returns the part a filter reads on its sheet s (from measuredSheet), in ink between corner ticks. */
  function inkOf(s, part) {
    var ink = '', frame = [];
    if (part === 'year') {
      ink = '<text class="sc-yr" x="' + f(s.yr.x) + '" y="' + f(s.yr.cy + s.yr.fs * 0.35) + '" style="font-size:' + f(s.yr.fs) + 'px">2019</text>';
      frame = [{ x: s.yr.x, y: s.yr.cy - s.yr.fs * 0.42, w: s.yr.w, h: s.yr.fs * 0.84 }];
    } else if (part === 'cite') {
      var p = s.pill;
      ink = '<rect x="' + f(p.x) + '" y="' + f(p.y) + '" width="' + f(p.w) + '" height="' + p.h + '" rx="' + p.h / 2 + '" fill="#fff" stroke="' + INK + '" stroke-width="1.2"/>';
      ink += citedBy(s) + OK.bar(s.count, INK);
      frame = [p];
    } else if (part === 'words') {
      s.words.forEach(function (w) { if (w.hit) ink += OK.bar(w, INK); });
      frame = [OK.bbox(s.title), OK.bbox(s.abs)];
    } else {
      ink = OK.sheetInk(s, part);
      frame = [part === 'venue' ? s.venue[0] : OK.bbox(s[part])];
    }
    frame.forEach(function (r) { ink += OK.ticks(r, s.m); });
    return ink;
  }
  /** Returns the words "cited by" as printed on a sheet. */
  function citedBy(s) {
    return '<text class="sc-cb" x="' + f(s.cited.x) + '" y="' + f(s.cited.y) + '" style="font-size:' + f(s.cited.fs) + 'px">cited by</text>';
  }
  /** Returns the quiet sheet of a filter: outline, folded corner and every part in pale grey. */
  function baseOf(s) { return OK.sheetBase(s, { skip: s.skip, words: s.words }) + s.extra; }

  /* ---------- where everything stands ---------- */
  /**
   * Returns the plan for a wide column (stack false: six filters side by side on
   * a level line, in a box 1280 wide) or a phone (stack true: six filters under one another on
   * a line that runs down, in a box 326 wide).
   * A filter: { x, top, w, h (its sheet), node, name, set (first baseline), lines, count, pile }.
   */
  function plan(stack) {
    var P = { stack: stack, cols: [], W: stack ? 326 : 1280 }, k, c;
    var reach = [D.deduped].concat(D.filters.map(function (F) { return F.pass; }));
    var grown = function (k) { return { w: Math.round(82 + 17.6 * k), h: 64 + 33 * k }; };   // sheet k, from a slip to a page
    function col(k, o) {
      o.n = Math.round(reach[k] / UNIT); o.pass = Math.round(reach[k + 1] / UNIT);
      o.lines = stack ? [D.filters[k].setting] : wrap(D.filters[k].setting, 152);
      return o;
    }
    if (stack) {
      var y = 44, LX = 7.5, X = 28;
      P.dot = { x: LX, y: 15 }; P.intro = { x: X, y: 19.5 };
      for (k = 0; k < 6; k++) {
        c = col(k, grown(k));
        c.x = X; c.top = y + 50;
        c.node = { x: LX, y: y + 9, r: 5.5 }; c.name = { x: X, y: y + 16 }; c.set = { x: X, y: y + 36 };
        c.count = { x: X, y: c.top + c.h + 32 };    // the papers are counted under the sheet
        c.pile = { x: X, y: c.top + c.h + 46, per: 16, dx: IW + 4 };
        if (k === 5) { c.count.y += 16; c.pile.y += 22; }
        c.bottom = Math.max(c.top + c.h, c.pile.y + Math.ceil(c.n / c.pile.per) * ROW - 4);
        P.cols.push(c);
        y = c.bottom + 40;
      }
      P.H = y - 40 + 8;
      return P;
    }
    var M = 40, LY;
    var BLOCK = 8 * IW + 7 * 4, base = 337, a0 = M + BLOCK / 2, step = (P.W - M - grown(5).w / 2 - a0) / 5;
    LY = base + 46.5;
    for (k = 0; k < 6; k++) {
      c = col(k, grown(k));
      var ax = a0 + k * step;
      c.x = ax - c.w / 2; c.top = base - c.h;
      c.node = { x: ax, y: LY, r: 5.5 };
      c.set = { x: ax, y: c.top - 14 - (c.lines.length - 1) * SET_LH, mid: true };
      c.name = { x: ax, y: c.set.y - 23, mid: true };
      c.count = { x: ax, y: LY + 46, mid: true };
      c.pile = { x: ax - BLOCK / 2, y: LY + 62, per: 8, dx: IW + 4, mid: k === 5 };
      P.cols.push(c);
    }
    P.cols.forEach(function (c) { c.bottom = c.pile.y + Math.ceil(c.n / c.pile.per) * ROW - 4; });
    P.dot = null; P.start = { x: M, y: LY }; P.intro = { x: M, y: LY - 15 };
    P.H = P.cols[0].bottom + M;
    return P;
  }

  /* ---------- drawing ---------- */
  var SAYS = 'Each sheet is larger than the one before it and holds more of the paper: a later filter reads more of each paper.';
  /** Draws a plan into svg and returns the parts the reveal moves. */
  function draw(svg, P, titleId) {
    var d = { segs: [], cols: [] };
    svg.textContent = '';
    svg.setAttribute('viewBox', '0 0 ' + P.W + ' ' + f(P.H));
    svg.style.aspectRatio = P.W + ' / ' + f(P.H);
    OK.svg('title', { id: titleId }, svg, 'The ' + OK.fmt(D.deduped) + ' candidate papers pass six filters in order: ' +
      D.filters.map(function (F) { return F.name + ' reads ' + F.reads + ' (' + F.setting + ') and ' + OK.fmt(F.pass) + ' pass'; }).join('; ') +
      '. The first four are quick checks; a language model reads only the last two. ' + SAYS + ' ' + D.kept + ' are kept. One paper icon stands for ' + UNIT + ' papers.');
    var gLine = g(svg), gTop = g(svg), gOver = g(svg);

    // the pipeline line: one stretch to each filter's node
    var from = P.dot || P.start;
    if (P.dot) d.dot = OK.svg('circle', { class: 'port', cx: P.dot.x, cy: P.dot.y, r: 5.5 }, gLine);
    d.intro = g(gTop, '<text x="' + f(P.intro.x - NUDGE['sc-n']) + '" y="' + P.intro.y + '"><tspan class="sc-n">' + OK.fmt(D.deduped) + '</tspan><tspan class="note" dx="8">after duplicates</tspan></text>');
    P.cols.forEach(function (c, k) {
      var a = k ? P.cols[k - 1].node : from;
      d.segs.push(OK.svg('path', { class: 'lead' + (k || P.dot ? ' cut' : ''), d: 'M' + f(a.x + (k || P.dot ? 0 : 1.5)) + ',' + f(a.y) + ' L' + f(c.node.x) + ',' + f(c.node.y), pathLength: 1 }, gLine));
    });

    P.cols.forEach(function (c, k) {
      var F = D.filters[k], part = PARTS[k], o = { rows: [], out: [] }, i, t = '';
      var s = measuredSheet(k, c.x, c.top, c.w, c.h, part);
      o.name = g(gTop, text('task', c.name, 0, F.name));
      c.lines.forEach(function (l, i) { t += text('sc-set', c.set, i * SET_LH, l); });
      o.set = g(gTop, t);
      // the sheet; over it the part its filter reads, between ticks
      o.sheet = g(gTop, baseOf(s));
      o.ink = g(gTop, inkOf(s, part));
      o.node = OK.svg('circle', { class: 'port', cx: f(c.node.x), cy: f(c.node.y), r: f(c.node.r) }, gOver);
      // the papers that reach this filter, in rows; the ones it removes are pale papers under an ink paper that leaves
      var rows = Math.ceil(c.n / c.pile.per), last = k === 5, lead = c.pile.mid ? Math.floor((c.n - c.pass) / 2) : 0;
      var px = c.pile.mid ? c.node.x - ((c.n - 1) * c.pile.dx) / 2 : c.pile.x + IW / 2;
      for (i = 0; i < rows; i++) o.rows.push(g(gTop));
      for (i = 0; i < c.n; i++) {
        var r = Math.floor(i / c.pile.per), x = px + (i % c.pile.per) * c.pile.dx, y = c.pile.y + IH / 2 + r * ROW;
        if (i >= lead && i < lead + c.pass) { g(o.rows[r], icon(x, y, { kept: last })); continue; }
        g(o.rows[r], icon(x, y, { pale: true }));
        var leaving = g(o.rows[r], icon(x, y));
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
  function play(R, d) {
    R.cancel();
    if (d.dot) R.fade(d.dot, 0, 250);
    R.fade(d.intro, 100, 350);
    d.cols.forEach(function (o, k) {
      var t = T0 + k * EVERY;
      R.stroke(d.segs[k], k ? t - EVERY * 0.7 : 80, k ? EVERY : T0);
      R.arrive(o.name, t); R.arrive(o.set, t + 60);
      R.arrive(o.sheet, t);
      // a quick check lands at once; what a language model reads is taken in from left to right
      if (o.slow) R.from(o.ink, [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }], t + 260, 700, 'ease-in-out');
      else R.fade(o.ink, t + 280, 300);
      pop(R, o.node, t + 100, 260);
      o.rows.forEach(function (r, i) { R.arrive(r, t + 160 + i * 28, 320); });
      o.out.forEach(function (e, i) { R.from(e, [{ opacity: 1 }, { opacity: 0 }], t + 620 + i * 300 / o.out.length, 320); });
      if (k < 5) R.fade(o.count, t + 700, 360); else R.arrive(o.count, t + 1000, 480);
    });
  }

  /* ---------- the section ---------- */
  function mount(root) {
    var id = 'sc-t' + (++uid);
    root.innerHTML = '<div class="sec-head"><h2 class="sec-h">A closer read,<br>for fewer papers.</h2>' +
      '<p class="sec-p">Quick checks on year, citations, venue and keywords come first. A language model reads only the titles and abstracts that are left, so the costly reading is spent where it matters.</p></div>' +
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
  OK.section('screen', 'a', { label: 'Growing sheets', mount: mount });
})();
