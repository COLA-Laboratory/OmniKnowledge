/* The Build section: on the left the section's text and two short notes, and in one frame a
   vertical pipeline of search steps beside the filters. The 3 px line runs down through the
   steps, turns under the pipeline, rises between the two columns and comes down through the
   filters. The picture is also the record of a run: every search step carries the papers it
   found; on the line under the pipeline stand the total found and the duplicates merged. At
   most two steps stand side by side, and every step card has one width and one layout. A
   filter is a card the line passes through: its name, and what the user set in it on one pale
   field. Filters differ only in how much the field holds, so a card is as tall as its filter is
   heavy: a rule on a paper's record takes one row, a query a second row, a criterion a language
   model reads the lines of its prompt. Above each card a pale bar lies across the line, as long as the papers that reach
   the filter are many, with their count at its end; the bars shorten down the column to the
   papers kept, on the yellow marker. Each preset has its own steps and its own filters, chosen
   from one library, and the picture is as tall as its filters make it.
   A parallel group is one pale ground with its steps side by side; the line passes through it.
   The finished picture is the DOM; reveal and preset changes are animations laid over it.
   README.md owns the drawing language; this file owns only this section. */
(function () {
  'use strict';
  var OK = window.OK, D = OK.DATA, f = OK.f, fmt = OK.fmt, R = 16, count = 0;

  /* the heading: its sentences, each as the lines it takes beside the frame */
  var HEAD = [['Pipelines', 'you can', 'build, monitor', 'and audit']];
  var TEXT = 'A platform for knowledge retrieval pipelines. Every search reports the papers it found and every filter the papers it passes on, so a run can be checked from end to end.';
  /* the two notes under the text: an icon (one of the kit's, or a glyph drawn like them in a 20 by 20 box) beside a title, and a line or two */
  var NOTES = [
    { icon: OK.icon.cite, title: 'Search your way', text: 'Chain backward and forward citation tracing, semantic search and database search in any order, or run them side by side.' },
    { icon: '<rect x="3" y="3" width="14" height="14" rx="3.4"/><path d="M6.7 10.4l2.4 2.4 4.4-5.4"/>', title: 'Set your own bar', text: 'Choose from a library of criteria, from a publication year to a judgment a language model makes on the full text.' }
  ];

  /* a kind of step: its name (split where the one-column card breaks it) and what it does */
  var KINDS = {
    seed: { name: ['Seed', 'set'], does: 'The papers you trust' },
    back: { name: ['Backward', 'Searcher'], does: 'The papers each paper cites' },
    fwd: { name: ['Forward', 'Searcher'], does: 'The papers that cite it' },
    sem: { name: ['Semantic', 'Search'], does: 'The papers closest in meaning' },
    db: { name: ['Database', 'Search'], does: 'Queries written from the question' }
  };
  /* a preset: its rows from top to bottom; the steps of one row (two at most) run side by side.
     A step keeps its id from preset to preset, so it is seen to move, not to be replaced. */
  var PRESETS = [
    { id: 'light', label: 'Light', rows: [['seed'], ['b1', 'f1'], ['s1']] },
    { id: 'medium', label: 'Medium', rows: [['seed'], ['b1', 'f1'], ['s1', 'd1'], ['b2']] },
    { id: 'heavy', label: 'Heavy', rows: [['seed'], ['d1'], ['b1', 'f1'], ['b2', 'f2'], ['s1']] }
  ];
  function kindOf(id) { return id === 'seed' ? 'seed' : { b: 'back', f: 'fwd', s: 'sem', d: 'db' }[id.charAt(0)]; }
  function presetOf(id) { return PRESETS.filter(function (p) { return p.id === id; })[0]; }

  /* The record of a run, illustrative. FOUND: the papers each search step found. LIBRARY: the
     filters a pipeline can be built from, by name, each with what the user set: setting, a
     rule on a paper's record; query, words matched in title and abstract; prompt, the
     question a language model answers, as the lines it is shown in. RECORD, per preset: the
     papers found by all its steps, the duplicates merged, its filters in order and the papers
     that go on after each; the last count is the papers kept. Medium is the page's example:
     its totals are read from OK.DATA. */
  function search(key) { return D.searches.filter(function (s) { return s.key === key; })[0].found; }
  var FOUND = { b1: 3480, f1: 2960, d1: search('db'), s1: search('sem'), b2: 1770, f2: 1540 };
  var LIBRARY = {
    'Year': { setting: '2015 or later' },
    'Citations': { setting: 'At least 5 a year' },
    'Venue': { setting: 'Peer-reviewed, no preprints' },
    'Keywords': { query: 'microplastic* OR nanoplastic*' },
    'Title criteria': { prompt: ['Does the title describe a study', 'of a freshwater fish species?'] },
    'Abstract criteria': { prompt: ['Does the abstract report an exposure', 'experiment with micro- or nanoplastics', 'and a measured effect on the fish?'] },
    'Full-text criteria': { prompt: ['Does the paper state particle size,', 'dose and exposure duration, include', 'an unexposed control group and', 'report its outcomes with statistics?'] }
  };
  var RECORD = {
    light: { found: 11070, merged: 1730, filters: ['Year', 'Citations', 'Venue', 'Keywords', 'Title criteria', 'Abstract criteria'], pass: [6400, 4670, 3990, 1430, 480, 245] },
    medium: { found: D.found, merged: D.found - D.deduped, filters: ['Year', 'Venue', 'Keywords', 'Title criteria', 'Abstract criteria', 'Full-text criteria'], pass: [8500, 7300, 2600, 900, 380, D.kept] },
    heavy: { found: 16490, merged: 3090, filters: ['Year', 'Citations', 'Keywords', 'Title criteria', 'Abstract criteria', 'Full-text criteria'], pass: [9180, 6700, 2650, 920, 395, 230] }
  };
  /* the most papers that reach the filters in any preset: the longest bar, so one length means one count in every preset */
  var MOST = Math.max.apply(null, PRESETS.map(function (P) { return RECORD[P.id].found - RECORD[P.id].merged; }));
  /* the most filters a preset has: the bars and counts the column needs */
  var PLACES = Math.max.apply(null, PRESETS.map(function (P) { return RECORD[P.id].filters.length; }));

  /* The two arrangements. Wide: pipeline and filters side by side, the pipeline spread over the
     height the filters take; step cards and filter cards share one width, the widest any of
     them needs. Narrow: one column, the filters under the pipeline.
     ch: a step card's height; pad, gap: inside a ground; top: the first card's top.
     Wide: cross: the line's run under the pipeline's foot; air: the clear room on each side of
     the line's rise between the columns; first: the first filter card's top under top.
     Narrow: cw: a step card's width; the line falls straight through everything; step: row to
     row; beads: the found paper and the merged duplicates on the line, under the pipeline's
     foot; first: the first filter card's top under the foot.
     FLOW: the pale bar across the line above a filter: its thickness, the room between two
     filter cards in whose middle it lies, and its length, which is head for no papers and grows
     evenly to most for MOST, so that the smallest count is still a bar and equal differences
     are equal lengths. END: from the last filter card down to the middle of the kept paper.
     FIELD: the pale field that holds what the user set in a filter: its text's inset from its
     left and right edges, the height of a field of one line, and line to line. */
  var FLOW = { h: 10, gap: 20, head: 12, most: 130 }, END = 42.5;
  var FIELD = { pad: 8, h: 22, lead: 15 };
  var WIDE = { ch: 80, pad: 9, gap: 9, top: 40, cross: 62.5, air: 18.5, first: 38 };
  var NARROW = { narrow: true, vw: 325, cw: 150, ch: 80, pad: 7, gap: 7, top: 40, step: 24, beads: [31, 79], first: 150 };

  /* what the user set in a filter, as the lines its field shows */
  function lines(x) { return x.prompt || [x.setting || x.query]; }
  /* a filter card's height: one row when the field stands beside the name (a rule); otherwise the name, and under it the field with its lines */
  function tall(x) { return x.setting ? 40 : 40 + FIELD.h + (lines(x).length - 1) * FIELD.lead; }

  /**
   * Returns where the rows, cards and line pieces of a preset stand: { rows, at, stubs, bottom }.
   * cw: a step card's width; px: the line through the pipeline; span (wide): the height the
   * rows are spread over.
   */
  function arrange(P, G, cw, px, span) {
    var hs = P.rows.map(function (r) { return G.ch + (r.length > 1 ? 2 * G.pad : 0); });
    var sum = hs.reduce(function (a, b) { return a + b; }, 0);
    var step = G.narrow ? G.step : (span - sum) / (hs.length - 1), y = G.top, prev = 0;
    var out = { rows: [], at: {}, stubs: [] };
    P.rows.forEach(function (ids, i) {
      var n = ids.length, in_ = n > 1 ? G.pad : 0, w = n * cw + (n - 1) * G.gap + 2 * in_, x = px - w / 2, yy = Math.round(y);
      out.rows.push({ x: x, y: yy, w: w, h: hs[i], group: n > 1 });
      ids.forEach(function (id, k) { out.at[id] = { x: x + in_ + k * (cw + G.gap), y: yy + in_ }; });
      if (i) out.stubs.push({ y1: prev, y2: yy });
      prev = yy + hs[i];
      y += hs[i] + step;
    });
    out.bottom = prev;
    return out;
  }

  /**
   * Returns a step card's markup, drawn from its own top left corner; cw: its width. Wide: the
   * icon and the name on the first line; on the second, what the step does at the left and the
   * papers it found at the right. Narrow: the name on two lines beside the icon, the papers it
   * found under them at the right. Step names and filter names share one size (ba-name).
   */
  function card(id, G, cw) {
    var kind = kindOf(id), K = KINDS[kind], seed = kind === 'seed', mini = G.narrow, in_ = mini ? 10 : 13, y2 = mini ? 66.5 : 64.5, i;
    var s = '<rect class="card" x=".5" y=".5" width="' + (cw - 1) + '" height="' + (G.ch - 1) + '" rx="12.5"/>';
    if (seed) for (i = 0; i < 3; i++) s += mini ? OK.paper(17.5 + i * 19, 23, 15, 20, { seed: true }) : OK.paper(21 + i * 20.5, 28, 16, 21, { seed: true });
    else s += mini ? OK.tile(10, 10, 26, kind) : OK.tile(13, 13, 30, kind);
    if (FOUND[id]) s += '<text class="cnt" x="' + (cw - in_) + '" y="' + y2 + '" text-anchor="end">' + fmt(FOUND[id]) + '</text>';
    if (!mini) return s + '<text class="ba-name" x="' + (seed ? 81 : 54) + '" y="34">' + K.name.join(' ') + '</text><text class="note" x="13" y="' + y2 + '">' + K.does + '</text>';
    if (seed) return s + '<text class="ba-name" x="9.5" y="' + y2 + '">' + K.name.join(' ') + '</text>';
    return s + K.name.map(function (l, k) { return '<text class="ba-name" x="45" y="' + (25 + k * 20) + '">' + l + '</text>'; }).join('');
  }

  /** Returns the picture's title for one preset: the steps row by row with what each found, then the filters with what each passes on. */
  function describe(P) {
    var rec = RECORD[P.id], steps = 0, rows = P.rows.map(function (ids) {
      steps += ids.length;
      return ids.map(function (id) { return KINDS[kindOf(id)].name.join(' ') + (FOUND[id] ? ' (found ' + fmt(FOUND[id]) + ' papers)' : ''); }).join(' beside ');
    });
    return 'A search pipeline of ' + steps + ' steps and the record of its run. From top to bottom: ' + rows.join('; then ') + '. Together the searches found ' + fmt(rec.found) + ' papers; ' + fmt(rec.merged) + ' duplicates were merged, so ' + fmt(rec.found - rec.merged) + ' papers reached the filters. The line passes through ' + rec.filters.length + ' filters in order, each shown with what was set and the papers it passes on, as a count and a bar that shortens down the column: ' +
      rec.filters.map(function (name, i) {
        var x = LIBRARY[name];
        return name + ', ' + (x.prompt ? 'a language model asked \u201c' + x.prompt.join(' ') + '\u201d' : x.query ? 'matching ' + x.query : x.setting) + ', ' + fmt(rec.pass[i]) + ' go on';
      }).join('; ') + '. ' + fmt(rec.pass[rec.pass.length - 1]) + ' papers were kept.';
  }

  /**
   * Draws the picture and its switch into stage.
   * narrow: the one-column arrangement; first: the preset shown at once.
   * Returns { vw, set(presetId, moving), play(), current(), destroy() }; vw is the picture's width.
   */
  function picture(stage, narrow, first) {
    var G = narrow ? NARROW : WIDE, rv = OK.reveal(), uid = 'ba-title-' + (++count), cards = {}, fcards = {}, cur = null, d = {}, n = {}, rolls = [], k;
    stage.textContent = '';
    var svg = OK.svg('svg', { class: 'ba-svg', role: 'img', 'aria-labelledby': uid }, stage);
    var description = OK.svg('desc', { id: uid }, svg);
    var gStub = OK.svg('g', {}, svg), gTail = OK.svg('g', {}, svg), gGround = OK.svg('g', {}, svg), gGhost = OK.svg('g', {}, svg), gCards = OK.svg('g', {}, svg), gHead = OK.svg('g', {}, svg);
    // the filters' column: narrow, it hangs under the pipeline's foot with the tail; wide, it stands on its own
    var gCol = OK.svg('g', {}, narrow ? gTail : svg);
    var probe = OK.svg('text', { x: 0, y: -200, visibility: 'hidden' }, svg);
    function width(str, cls) { probe.setAttribute('class', cls); probe.textContent = str; return probe.getComputedTextLength(); }
    function group(parent, html) { var g = OK.svg('g', {}, parent); if (html) g.innerHTML = html; return g; }

    /* ---- measures: wide, step cards and filter cards share the width the widest of them needs;
            narrow, a filter card takes what the widest filter needs. A card's width is odd, so
            that the line through its middle is sharp ---- */
    var fields = {}, need = 0;
    function odd(w) { w = Math.ceil(w); return w + 1 - w % 2; }
    // a filter's field: its lines (a prompt stands in quotation marks; the opening one hangs in the field's inset) and the width its text needs
    for (k in LIBRARY) (function (name, x) {
      var ls = lines(x).map(function (l, i, all) { return l + (x.prompt && i === all.length - 1 ? '\u201d' : ''); });
      var w = Math.ceil(Math.max.apply(null, ls.map(function (l) { return width(l, 'ba-set'); }))) + 2 * FIELD.pad;
      fields[name] = { lines: ls, w: w };
      need = Math.max(need, 26 + w + (x.setting ? width(name, 'ba-name') + 12 : 0));
    })(k, LIBRARY[k]);
    // a step card holds its icon and name, and under them what it does, a clear gap and its count
    if (!narrow) for (k in KINDS) need = Math.max(need, (k === 'seed' ? 94 : 67) + width(KINDS[k].name.join(' '), 'ba-name'), 38 + width(KINDS[k].does, 'note') + width('0,000', 'cnt'));
    var fw = odd(need), cw = narrow ? G.cw : fw;         // a filter card's width; a step card's width
    var px = narrow ? G.vw / 2 : cw + G.gap / 2 + G.pad;  // the line through the pipeline: the middle of a row of two
    var gx = 2 * px + G.air;                              // wide: the line's rise between the columns
    var c = G.cross, fl = narrow ? px - fw / 2 : gx + G.air, fx = fl + fw / 2;   // the filter cards' left edge; the line through them
    var t0 = narrow ? G.first : G.top + G.first, arch = G.top + 1.5;       // the first filter card's top; wide: the line's turn over to the filters
    var vw = narrow ? G.vw : fl + fw;
    /** Returns where the filters of a record stand in the column: { y: each card's top, row: the middle of the bar above each, kept: the middle of the kept paper }. */
    function column(rec) {
      var y = t0, out = { y: [], row: [] };
      rec.filters.forEach(function (name) { out.y.push(y); out.row.push(y - FLOW.gap / 2); y += tall(LIBRARY[name]) + FLOW.gap; });
      out.kept = y - FLOW.gap + END;
      return out;
    }

    /* ---- the line out of the pipeline and its two counts, measured from the pipeline's foot ---- */
    (function tail() {
      var FOUND_W = 'found', MERGED_W = 'duplicates merged', b1, b2, lab;
      if (narrow) {
        // both papers stand on the line as it falls, their counts beside them
        b1 = { x: px, y: G.beads[0] }; b2 = { x: px, y: G.beads[1] };
        d.a = OK.svg('path', { class: 'lead cut', pathLength: 1, d: 'M' + px + ',-.5 V' + (b1.y - 13.5) }, gTail);
        d.m = OK.svg('path', { class: 'lead cut', pathLength: 1, d: 'M' + px + ',' + (b1.y + 13.5) + ' V' + (b2.y - 18.5) }, gTail);
        d.b1 = OK.svg('path', { class: 'lead cut', pathLength: 1, d: 'M' + px + ',' + (b2.y + 13.5) + ' V' + (t0 + 0.5) }, gTail);
        lab = function (b, word) {
          var g = OK.svg('g', {}, gTail);
          var num = OK.svg('text', { class: 'cnt', x: b.x + 22, y: b.y - 2.5 }, g);
          OK.svg('text', { class: 'note', x: b.x + 22, y: b.y + 12.5 }, g, word);
          return { g: g, num: num };
        };
      } else {
        // both papers stand on the run under the pipeline, their counts above them; the three
        // gaps beside and between the two labels are equal. The run ends in the turn up to the rise.
        var w1 = Math.max(width('00,000', 'cnt'), width(FOUND_W, 'note')), w2 = Math.max(width('0,000', 'cnt'), width(MERGED_W, 'note'));
        var x0 = px + 1.5, room = (gx - 1.5 - x0 - w1 - w2) / 3;
        b1 = { x: Math.round(x0 + room + w1 / 2) + 0.5, y: c }; b2 = { x: Math.round(x0 + 2 * room + w1 + w2 / 2) + 0.5, y: c };
        d.a = OK.svg('path', { class: 'lead cut', pathLength: 1, d: 'M' + px + ',-.5 V' + (c - R) + ' A' + R + ',' + R + ' 0 0 0 ' + (px + R) + ',' + c + ' H' + (b1.x - 11) }, gTail);
        d.m = OK.svg('path', { class: 'lead cut', pathLength: 1, d: 'M' + (b1.x + 11) + ',' + c + ' H' + (b2.x - 16) }, gTail);
        d.b1 = OK.svg('path', { class: 'lead cut', pathLength: 1, d: 'M' + (b2.x + 11) + ',' + c + ' H' + (gx - R) + ' A' + R + ',' + R + ' 0 0 0 ' + gx + ',' + (c - R) }, gTail);
        lab = function (b, word) {
          var g = OK.svg('g', {}, gTail);
          var num = OK.svg('text', { class: 'cnt', x: b.x, y: b.y - 34.5, 'text-anchor': 'middle' }, g);
          OK.svg('text', { class: 'note', x: b.x, y: b.y - 19.5, 'text-anchor': 'middle' }, g, word);
          return { g: g, num: num };
        };
      }
      // what the steps found together; then the copies of one paper, merged into one
      d.found = group(gTail, OK.paper(b1.x, b1.y, 15, 20));
      var l1 = lab(b1, FOUND_W); d.foundN = l1.g; n.found = l1.num;
      d.merged = group(gTail, OK.paper(b2.x - 5, b2.y - 5, 15, 20, { pale: true }) + OK.paper(b2.x, b2.y, 15, 20));
      var l2 = lab(b2, MERGED_W); d.mergedN = l2.g; n.merged = l2.num;
    })();

    /* ---- the filters' column: drawn once; the cards, the numbers, the bars' lengths and every
            height are filled in by set ---- */
    var gFlow = OK.svg('g', {}, gCol);                  // the bars, under the line
    if (!narrow) {
      // the rise from the run up to the turn (as long as the pipeline is tall), and the turn over to the first filter
      d.rise = OK.svg('path', { class: 'lead cut ba-hang', pathLength: 1 }, gCol);
      d.arch = OK.svg('path', { class: 'lead cut', pathLength: 1, d: 'M' + gx + ',' + (arch + R) + ' A' + R + ',' + R + ' 0 0 1 ' + (gx + R) + ',' + arch + ' H' + (fx - R) + ' A' + R + ',' + R + ' 0 0 1 ' + fx + ',' + (arch + R) + ' V' + (t0 + 0.5) }, gCol);
    }
    // the line through the filters, behind their cards, so that it holds while one filter takes another's place
    d.fall = OK.svg('path', { class: 'lead cut ba-hang', pathLength: 1 }, gCol);
    d.fLab = OK.svg('text', { class: 'lab', x: narrow ? 0 : fl, y: narrow ? t0 - 34 : 14 }, gCol, 'Filter');
    // above each filter, across the line: the papers that reach it, as a bar and its count
    n.arrives = []; d.flows = [];
    for (k = 0; k < PLACES; k++) {
      d.flows.push(OK.svg('rect', { class: 'ba-flow', height: FLOW.h, rx: 3 }, gFlow));
      n.arrives.push(OK.svg('text', { class: 'cnt' }, gCol));
    }
    var gGone = OK.svg('g', {}, gCol), gFilt = OK.svg('g', {}, gCol);   // filter cards on their way out; filter cards
    // the end of the line, drawn round the middle of the kept paper: arrowhead, paper, count on the marker
    var gKept = OK.svg('g', {}, gCol);
    d.head = OK.svg('path', { class: 'lead', d: 'M' + (fx - 5) + ',-24 L' + fx + ',-19 L' + (fx + 5) + ',-24' }, gKept);
    d.kept = group(gKept, OK.paper(fx, 0, 18, 23.5, { kept: true }));
    d.keptN = OK.svg('g', {}, gKept);
    var mw = f(width('000', 'cnt') + 9.3);
    OK.svg('rect', { class: 'mark', x: fx + 16, y: -8, width: mw, height: 16 }, d.keptN);
    n.kept = OK.svg('text', { class: 'cnt', x: f(fx + 20.65), y: 4.5 }, d.keptN);
    OK.svg('text', { class: 'note', x: f(fx + 16 + mw + 6), y: 4.5 }, d.keptN, 'kept');
    d.sLab = OK.svg('text', { class: 'lab', x: 0, y: 14 }, gHead, 'Search');
    d.steps = OK.svg('tspan', { class: 'note', dx: 9 }, d.sLab);
    probe.remove();

    /* ---- the record: one number per element, written by set ---- */
    /** Writes a count; when from is a number, the count rolls to it from there. */
    function write(e, to, from) {
      e.textContent = fmt(to);
      if (OK.still || from == null || from === to) return;
      var began = performance.now(), id = 0;
      function step(t) {
        var p = Math.min(1, Math.max(0, (t - began) / 520)), q = 1 - Math.pow(1 - p, 3);
        e.textContent = fmt(Math.round(from + (to - from) * q));
        if (p < 1) id = requestAnimationFrame(step);
      }
      id = requestAnimationFrame(step);
      rolls.push(function () { cancelAnimationFrame(id); e.textContent = fmt(to); });
    }
    /* ends every roll and every animation, so that the DOM alone shows */
    function settle() { rolls.forEach(function (end) { end(); }); rolls = []; rv.cancel(); }
    /* a bar's length for a count of papers (see FLOW): even, so that a bar across the line has sharp ends */
    function len(v) { return 2 * Math.round((FLOW.head + (FLOW.most - FLOW.head) * v / MOST) / 2); }
    /* the papers that reach each filter of a record: those that enter the first, then what each filter passes on */
    function reach(rec) { return [rec.found - rec.merged].concat(rec.pass.slice(0, -1)); }
    /**
     * Fills in the record of one preset, each bar and count at its height in the column col.
     * old, was: the record and the column on show when the change is to be seen: a bar then
     * grows or shrinks about the line and moves to its height, its count travelling with its end.
     */
    function report(rec, col, old, was) {
      var before = old && reach(old), all = reach(rec);
      write(n.found, rec.found, old && old.found);
      write(n.merged, rec.merged, old && old.merged);
      d.flows.forEach(function (bar, i) {
        var num = n.arrives[i], on = i < all.length, w, dy;
        bar.style.display = num.style.display = on ? '' : 'none';
        if (!on) return;
        w = len(all[i]);
        write(num, all[i], before && before[i]);
        if (old && i < before.length) {
          dy = was.row[i] - col.row[i];
          rv.from(bar, [{ transform: 'translateY(' + dy + 'px) scaleX(' + (len(before[i]) / w) + ')' }, { transform: 'translateY(0) scaleX(1)' }], 0, 520);
          rv.from(num, [{ transform: 'translate(' + ((len(before[i]) - w) / 2) + 'px,' + dy + 'px)' }, { transform: 'translate(0,0)' }], 0, 520);
        }
        bar.setAttribute('x', fx - w / 2); bar.setAttribute('y', col.row[i] - FLOW.h / 2); bar.setAttribute('width', w);
        num.setAttribute('x', fx + w / 2 + 8); num.setAttribute('y', f(col.row[i] + 4.6));
      });
      write(n.kept, rec.pass[rec.pass.length - 1], old && old.pass[old.pass.length - 1]);
    }
    /**
     * Returns a filter card's markup, drawn from its own top left corner: the name, and what
     * the user set on one pale field that ends at the card's right inset. A rule's field is as
     * wide as its text and stands beside the name; a query's or a prompt's field stands under
     * the name, as wide as the card allows and as tall as its lines.
     */
    function fcard(name) {
      var x = LIBRARY[name], F = fields[name], beside = !!x.setting, h = tall(x);
      var w = beside ? F.w : fw - 26, bx = fw - 13 - w, by = beside ? 9 : 31, tx = bx + FIELD.pad;
      var s = '<rect class="card" x=".5" y=".5" width="' + (fw - 1) + '" height="' + (h - 1) + '" rx="12.5"/><text class="ba-name" x="12.5" y="' + (beside ? 26 : 24) + '">' + name + '</text>';
      s += '<rect class="ba-tag" x="' + bx + '" y="' + by + '" width="' + w + '" height="' + (h - by - 9) + '" rx="7"/>';
      if (x.prompt) s += '<text class="ba-set" x="' + tx + '" y="' + (by + 15.3) + '" text-anchor="end">\u201c</text>';
      return s + F.lines.map(function (l, i) { return '<text class="ba-set" x="' + tx + '" y="' + f(by + 15.3 + i * FIELD.lead) + '">' + l + '</text>'; }).join('');
    }
    /**
     * Shows the filters of one record, each at its height in the column col. seen: true when the
     * change is to be seen: a filter that stays travels to its new place, one that leaves fades
     * where it stood and one that arrives fades in, so that one filter taking another's place
     * reads as a swap.
     */
    function filters(rec, col, seen) {
      var fresh = [], name;
      gGone.textContent = '';
      for (name in fcards) if (rec.filters.indexOf(name) < 0) {
        if (seen) { gGone.appendChild(fcards[name].g); fadeOut(fcards[name].g, 180); } else fcards[name].g.remove();
        delete fcards[name];
      }
      rec.filters.forEach(function (key, i) {
        var cd = fcards[key], y = col.y[i];
        if (!cd) {
          cd = fcards[key] = { g: OK.svg('g', {}, gFilt) };
          cd.in = group(cd.g, fcard(key));
          fresh.push(cd.in);
        } else if (seen && cd.y !== y) rv.from(cd.g, [{ transform: 'translate(' + fl + 'px,' + cd.y + 'px)' }, { transform: 'translate(' + fl + 'px,' + y + 'px)' }], 0, 520);
        cd.y = y; cd.g.style.transform = 'translate(' + fl + 'px,' + y + 'px)';
      });
      d.rows = rec.filters.map(function (key) { return fcards[key].in; });
      if (seen) fresh.forEach(function (g, i) { rv.arrive(g, 260 + i * 80, 380); });
    }
    /* a piece of line that hangs from its top end: gives it the length len, growing from the length it had (was) when that was shorter */
    function hang(e, path, len, was) {
      if (was != null && was < len) rv.from(e, [{ transform: 'scaleY(' + (was / len) + ')' }, { transform: 'scaleY(1)' }], 0, 520);
      e.setAttribute('d', path);
    }

    /* ---- the pipeline: rebuilt for each preset ---- */
    function put(g, at) { g.style.transform = 'translate(' + at.x + 'px,' + at.y + 'px)'; }
    /* an element on its way out fades where it is; leave() first lifts it out of the layer that is being redrawn */
    function fadeOut(e, dur) {
      if (OK.still) { e.remove(); return; }
      e.animate([{ opacity: 1 }, { opacity: 0 }], { duration: dur, easing: OK.EASE, fill: 'forwards' }).onfinish = function () { e.remove(); };
    }
    function leave(e, dur) {
      if (OK.still) { e.remove(); return; }
      gGhost.appendChild(e);
      e.animate([{ opacity: 1 }, { opacity: 0 }], { duration: dur, easing: OK.EASE, fill: 'forwards' }).onfinish = function () { e.remove(); };
    }
    /**
     * Shows a preset. moving: true when it replaces the one on show, so that steps and filters
     * travel to their new places and the record changes in sight. The picture takes the new
     * preset's height at once; what then stands lower travels down to its place, and what stands
     * higher is there at once, inside the shorter picture.
     */
    function set(id, moving) {
      var P = presetOf(id), rec = RECORD[id], col = column(rec), old = moving ? cur : null;
      // wide: the run under the pipeline lies at the height of the kept paper, and the pipeline is spread down to it
      var L = arrange(P, G, cw, px, col.kept - c - G.top), foot = narrow ? L.bottom : col.kept - c, key;
      settle();
      gGhost.textContent = '';
      description.textContent = describe(P);
      d.steps.textContent = P.rows.reduce(function (s, r) { return s + r.length; }, 0) + ' steps';
      report(rec, col, old && RECORD[old.id], old && old.col);
      filters(rec, col, !!old);
      // the end of the column: the line down to the arrowhead, and the kept paper
      hang(d.fall, 'M' + fx + ',' + t0 + ' V' + (col.kept - 19), col.kept - 19 - t0, old && old.col.kept - 19 - t0);
      if (old && old.col.kept < col.kept) rv.from(gKept, [{ transform: 'translate(0,' + old.col.kept + 'px)' }, { transform: 'translate(0,' + col.kept + 'px)' }], 0, 520);
      gKept.style.transform = 'translate(0,' + col.kept + 'px)';
      if (!narrow) hang(d.rise, 'M' + gx + ',' + (arch + R) + ' V' + (foot + c - R), foot + c - arch - 2 * R, old && old.foot + c - arch - 2 * R);
      // grounds and line pieces are drawn again; the cards that stay travel
      Array.prototype.slice.call(gGround.childNodes).forEach(function (e) { if (old) leave(e, 180); else e.remove(); });
      gStub.textContent = '';
      d.grounds = []; d.stubs = []; d.fresh = [];
      L.rows.forEach(function (r) {
        d.grounds.push(r.group ? OK.svg('rect', { class: 'ground', x: r.x, y: r.y, width: r.w, height: r.h, rx: 12.5 + G.pad }, gGround) : null);
      });
      L.stubs.forEach(function (s) { d.stubs.push(OK.svg('path', { class: 'lead cut', pathLength: 1, d: 'M' + px + ',' + (s.y1 - 0.5) + ' V' + (s.y2 + 0.5) }, gStub)); });
      for (key in cards) if (!L.at[key]) { if (old) leave(cards[key].g, 180); else cards[key].g.remove(); delete cards[key]; }
      P.rows.forEach(function (ids) {
        ids.forEach(function (key) {
          var cd = cards[key], at = L.at[key];
          if (!cd) {
            cd = cards[key] = { g: OK.svg('g', {}, gCards) };
            cd.in = group(cd.g, card(key, G, cw));
            d.fresh.push(cd.in);
          } else if (old) rv.from(cd.g, [{ transform: 'translate(' + cd.at.x + 'px,' + cd.at.y + 'px)' }, { transform: 'translate(' + at.x + 'px,' + at.y + 'px)' }], 0, 520);
          cd.at = at; put(cd.g, at);
        });
      });
      d.cards = P.rows.map(function (ids) { return ids.map(function (key) { return cards[key].in; }); });
      // the tail hangs from the pipeline's foot
      if (old && old.foot < foot) rv.from(gTail, [{ transform: 'translate(0,' + old.foot + 'px)' }, { transform: 'translate(0,' + foot + 'px)' }], 0, 520);
      gTail.style.transform = 'translate(0,' + foot + 'px)';
      svg.setAttribute('viewBox', '0 0 ' + vw + ' ' + f((narrow ? foot : 0) + col.kept + 13));
      cur = { id: id, foot: foot, col: col };
      if (old) {
        d.grounds.forEach(function (g) { if (g) rv.fade(g, 160, 360); });
        d.fresh.forEach(function (g, i) { rv.arrive(g, 300 + i * 80, 380); });
        d.stubs.forEach(function (s, i) { rv.stroke(s, 200 + i * 120, 300); });
      }
    }

    /** Plays the reveal: the pipeline row by row along the line, the two counts under it, then the line down through the filters, each under the bar of what reaches it. */
    function play() {
      settle();
      if (OK.still) return;
      rv.arrive(d.sLab, 0); rv.fade(stage.querySelector('.ba-switch'), 150, 400);
      var t = 0, col = cur.col;
      d.cards.forEach(function (row, i) {
        if (i) { rv.stroke(d.stubs[i - 1], t, 260); t += 170; }
        if (d.grounds[i]) rv.fade(d.grounds[i], t, 360);
        row.forEach(function (g, k) { rv.arrive(g, t + 40 + k * 90); });
        t += 300;
      });
      rv.stroke(d.a, t, narrow ? 200 : 380); t += narrow ? 120 : 300;
      rv.arrive(d.found, t); rv.fade(d.foundN, t + 80, 320);
      rv.stroke(d.m, t + 120, 240); t += 300;
      rv.arrive(d.merged, t); rv.fade(d.mergedN, t + 80, 320);
      t += 180;
      if (narrow) { rv.stroke(d.b1, t, 300); t += 220; }
      else { rv.stroke(d.b1, t, 200); rv.stroke(d.rise, t + 160, 340); rv.stroke(d.arch, t + 460, 260); t += 620; }
      rv.arrive(d.fLab, t - 120);
      // the line falls at one speed; above each filter the bar opens from the line, and the filter is there before the line passes behind it
      var run = col.kept - 19 - t0, at = function (y) { return t + 780 * (y - t0) / run; };
      d.fall.style.strokeDasharray = '1';
      rv.from(d.fall, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], t, 780, 'linear');
      d.rows.forEach(function (g, i) {
        rv.from(d.flows[i], [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], at(col.y[i]) - 260, 420);
        rv.fade(n.arrives[i], at(col.y[i]) - 160, 320);
        rv.arrive(g, at(col.y[i]) - 240, 380);
      });
      rv.fade(d.head, t + 760, 200); rv.arrive(d.kept, t + 860); rv.fade(d.keptN, t + 940, 320);
    }

    /* ---- the switch: real buttons laid over the picture's head ---- */
    var sw = OK.h('div', { class: 'k-switch ba-switch', role: 'group', 'aria-label': 'How far the search goes' }, stage);
    var buttons = PRESETS.map(function (P) {
      var b = OK.h('button', { type: 'button', 'aria-pressed': String(P.id === first), 'data-preset': P.id }, sw, P.label);
      b.addEventListener('click', function () {
        if (cur.id === P.id) return;
        buttons.forEach(function (o) { o.setAttribute('aria-pressed', String(o === b)); });
        set(P.id, true);
      });
      return b;
    });
    set(first, false);
    // the switch ends where a row of two ends
    sw.style.right = f((1 - 2 * px / vw) * 100) + '%';
    return { vw: vw, set: set, play: play, current: function () { return cur.id; }, destroy: settle };
  }

  function mount(root) {
    var wrap = OK.h('div', { class: 'ba-wrap' }, root);
    var text = OK.h('div', { class: 'ba-text' }, wrap);
    OK.h('h2', { class: 'sec-h' }, text, HEAD.map(function (s) {
      return '<span class="ba-s">' + s.map(function (l) { return '<span class="ba-l">' + l + '</span>'; }).join(' ') + '</span>';
    }).join(' '));
    OK.h('p', { class: 'sec-p' }, text, TEXT);
    var notes = OK.h('div', { class: 'ba-notes' }, text);
    NOTES.forEach(function (N) {
      var note = OK.h('div', { class: 'ba-note' }, notes);
      // the kit's tile at 24, beside the title: its glyph is drawn in a 20 by 20 box, as OK.tile places it
      OK.h('h3', { class: 'ba-note-h' }, note, '<span class="pic ba-ico" aria-hidden="true"><svg viewBox="0 0 24 24" width="24" height="24"><rect class="tile" width="24" height="24" rx="7.2"/><g class="ic" transform="translate(4.04 4.04) scale(.8)">' + N.icon + '</g></svg></span>' + N.title);
      OK.h('p', { class: 'ba-note-p' }, note, N.text);
    });
    var frame = OK.h('div', { class: 'frame pic ba-frame' }, wrap);
    var stage = OK.h('div', { class: 'ba-stage' }, frame);
    var mq = window.matchMedia('(max-width: 880px)'), pic = null, preset = 'medium';

    function draw() {
      if (pic) { preset = pic.current(); pic.destroy(); }
      pic = picture(stage, mq.matches, preset);
      // the frame takes the picture's width plus its own padding and edge, the text the rest of 1280
      wrap.style.setProperty('--ba-pic', (pic.vw + 66) + 'fr');
      wrap.style.setProperty('--ba-text', (1280 - 44 - pic.vw - 66) + 'fr');
      wrap.style.setProperty('--ba-own', pic.vw + 'px');
    }
    function replay() { if (pic) pic.play(); }
    draw();
    OK.onArrive(frame, function () { pic.play(); });
    if (mq.addEventListener) mq.addEventListener('change', draw); else mq.addListener(draw);
    window.addEventListener('ok:replay', replay);
    return {
      destroy: function () {
        if (mq.removeEventListener) mq.removeEventListener('change', draw); else mq.removeListener(draw);
        window.removeEventListener('ok:replay', replay);
        if (pic) pic.destroy();
      }
    };
  }

  OK.section('build', 'a', { label: 'Pipeline beside filters', mount: mount });
})();
