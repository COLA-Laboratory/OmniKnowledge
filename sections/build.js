/* The Build section: the section's text on the left, and in one frame a vertical pipeline of
   search steps beside the six filters. The 3 px line runs down through the steps, turns under
   the pipeline, rises between the two columns and comes down through the filters. The picture
   is also the record of a run: every search step carries the papers it found; on the line under
   the pipeline stand the total found and the duplicates merged. A filter is a card the line
   passes through, with its name and its setting: beside the line above it stands the count that
   arrives, beside the card lie the papers it removed, pale, with their count, and the count
   that goes on stands under it, down to the papers kept on the yellow marker.
   A parallel group is one pale ground with its steps side by side; the line passes through it.
   The finished picture is the DOM; reveal and preset changes are animations laid over it.
   README.md owns the drawing language; this file owns only this section. */
(function () {
  'use strict';
  var OK = window.OK, D = OK.DATA, f = OK.f, fmt = OK.fmt, R = 16, count = 0;

  /* the heading: two sentences, each in the two lines it takes beside the frame */
  var HEAD = [['You set', 'every step.'], ['You can check', 'every count.']];
  var TEXT = 'Choose which searches run and in what order, and what each filter requires. After a run, every search shows the papers it found and every filter the papers it removed.';

  /* a kind of step: its name (split where a small card breaks it) and what it does */
  var KINDS = {
    seed: { name: ['Seed', 'set'], does: 'The papers you trust' },
    back: { name: ['Backward', 'Searcher'], does: 'The papers each paper cites' },
    fwd: { name: ['Forward', 'Searcher'], does: 'The papers that cite it' },
    sem: { name: ['Semantic', 'Search'], does: 'The papers closest in meaning' },
    db: { name: ['Database', 'Search'], does: 'Queries written from the question' }
  };
  /* a preset: its rows from top to bottom; the steps of one row run side by side. A step keeps
     its id from preset to preset, so it is seen to move, not to be replaced. */
  var PRESETS = [
    { id: 'light', label: 'Light', rows: [['seed'], ['b1', 'f1'], ['s1']] },
    { id: 'medium', label: 'Medium', rows: [['seed'], ['b1', 'f1'], ['s1', 'd1'], ['b2']] },
    { id: 'heavy', label: 'Heavy', rows: [['seed'], ['b1', 'f1', 'd1'], ['s1'], ['b2', 'f2'], ['s2']] }
  ];
  function kindOf(id) { return id === 'seed' ? 'seed' : { b: 'back', f: 'fwd', s: 'sem', d: 'db' }[id.charAt(0)]; }
  function presetOf(id) { return PRESETS.filter(function (p) { return p.id === id; })[0]; }

  /* The record of a run, illustrative. FOUND: the papers each search step found. RECORD, per
     preset: the papers found by all its steps, the duplicates merged, the papers each of the six
     filters removed in order, and the papers kept. Medium is the page's example, so whatever
     OK.DATA holds of it is read from there. */
  function search(key) { return D.searches.filter(function (s) { return s.key === key; })[0].found; }
  var FOUND = { b1: 3480, f1: 2960, d1: search('db'), s1: search('sem'), b2: 1770, f2: 1540, s2: 2390 };
  var RECORD = {
    light: { found: 11070, merged: 1730, removed: [2940, 1730, 680, 2560, 950, 318], kept: 162 },
    medium: { found: D.found, merged: D.found - D.deduped, removed: D.filters.map(function (x, i) { return (i ? D.filters[i - 1].pass : D.deduped) - x.pass; }), kept: D.kept },
    heavy: { found: 18880, merged: 3880, removed: [4720, 2780, 1090, 4110, 1510, 553], kept: 237 }
  };
  /* the most papers that reach the filters in any preset: the longest bar, so one length means one count in every preset */
  var MOST = Math.max.apply(null, PRESETS.map(function (P) { return RECORD[P.id].found - RECORD[P.id].merged; }));

  /* The two arrangements. Wide: pipeline and filters side by side, the pipeline spread over a
     fixed height. Narrow: one column, the filters under the pipeline.
     card(n): the card of a step that stands in a row of n; pad, gap: inside a ground;
     px: the line through the pipeline; top: the first card's top; pitch: filter to filter;
     flow: the length of the bar that stands for the most papers (MOST).
     Wide: cross: the line's run under the pipeline's foot; gx: the line's rise between the
     columns; fl: the filter cards' left edge; first: the first filter card's top under top.
     Narrow: the line falls straight through everything; beads: the found paper and the merged
     duplicates on it, under the pipeline's foot; first: the first filter card's top under the
     foot. FH: a filter card's height. */
  var ROOMY = { id: 'roomy', cw: 240, ch: 80 }, SLIM = { id: 'slim', cw: 157, ch: 80 }, MINI = { id: 'mini', cw: 99, ch: 80 }, FH = 56;
  var WIDE = { card: function (n) { return n > 2 ? SLIM : ROOMY; }, pad: 9, gap: 9, px: 253.5, top: 40, span: 510, cross: 62.5, gx: 539.5, fl: 572, first: 48, pitch: 85, flow: 130 };
  var NARROW = { narrow: true, card: function () { return MINI; }, vw: 325, pad: 7, gap: 7, px: 162.5, top: 40, step: 24, beads: [31, 79], first: 152, pitch: 85, flow: 120 };

  /** Returns where the rows, cards and line pieces of a preset stand: { rows, at, fmt, stubs, bottom }. */
  function arrange(P, G) {
    var fmts = P.rows.map(function (r) { return G.card(r.length); });
    var hs = P.rows.map(function (r, i) { return fmts[i].ch + (r.length > 1 ? 2 * G.pad : 0); });
    var sum = hs.reduce(function (a, b) { return a + b; }, 0);
    var step = G.narrow ? G.step : (G.span - sum) / (hs.length - 1), y = G.top, prev = 0;
    var out = { rows: [], at: {}, fmt: {}, stubs: [] };
    P.rows.forEach(function (ids, i) {
      var n = ids.length, F = fmts[i], in_ = n > 1 ? G.pad : 0, w = n * F.cw + (n - 1) * G.gap + 2 * in_, x = G.px - w / 2, yy = Math.round(y);
      out.rows.push({ x: x, y: yy, w: w, h: hs[i], group: n > 1 });
      ids.forEach(function (id, k) { out.at[id] = { x: x + in_ + k * (F.cw + G.gap), y: yy + in_ }; out.fmt[id] = F; });
      if (i) out.stubs.push({ y1: prev, y2: yy });
      prev = yy + hs[i];
      y += hs[i] + step;
    });
    out.bottom = prev;
    return out;
  }

  /**
   * Returns a step card's markup in one of the three card formats, drawn from its own top left
   * corner. The papers the step found stand in the card's top right corner in every format; only
   * the roomy card has room for what the step does.
   */
  function card(id, F) {
    var kind = kindOf(id), K = KINDS[kind], seed = kind === 'seed', mini = F === MINI, in_ = mini ? 10 : 13, i;
    var s = '<rect class="card" x=".5" y=".5" width="' + (F.cw - 1) + '" height="' + (F.ch - 1) + '" rx="12.5"/>';
    if (seed) for (i = 0; i < 3; i++) s += mini ? OK.paper(17.5 + i * 19, 23, 15, 20, { seed: true }) : OK.paper(21 + i * 20.5, 28, 16, 21, { seed: true });
    else s += mini ? OK.tile(10, 10, 26, kind) : OK.tile(13, 13, 30, kind);
    if (FOUND[id]) s += '<text class="cnt" x="' + (F.cw - in_) + '" y="' + (mini ? 27.5 : 33) + '" text-anchor="end">' + fmt(FOUND[id]) + '</text>';
    if (mini) (seed ? [K.name.join(' ')] : K.name).forEach(function (l, k) { s += '<text class="row" x="10" y="' + ((seed ? 58 : 53) + k * 15.5) + '">' + l + '</text>'; });
    else if (F === ROOMY) s += '<text class="lab" x="' + (seed ? 81 : 54) + '" y="33">' + K.name.join(' ') + '</text><text class="note" x="13" y="64.5">' + K.does + '</text>';
    else s += '<text class="lab" x="13" y="64">' + K.name.join(' ') + '</text>';
    return s;
  }

  /** Returns the picture's title for one preset: the steps row by row with what each found, then the filters with what each removed and passed on. */
  function describe(P) {
    var rec = RECORD[P.id], left = rec.found - rec.merged, steps = 0, rows = P.rows.map(function (ids) {
      steps += ids.length;
      return ids.map(function (id) { return KINDS[kindOf(id)].name.join(' ') + (FOUND[id] ? ' (found ' + fmt(FOUND[id]) + ' papers)' : ''); }).join(' beside ');
    });
    return 'A search pipeline of ' + steps + ' steps and the record of its run. From top to bottom: ' + rows.join('; then ') + '. Together the searches found ' + fmt(rec.found) + ' papers; ' + fmt(rec.merged) + ' duplicates were merged, so ' + fmt(left) + ' papers reached the filters. The line passes through six filters in order, each shown with its setting, the papers it removed and the papers that went on: ' +
      D.filters.map(function (x, i) { left -= rec.removed[i]; return x.name + ', ' + x.setting + (x.model ? ' (read by a language model)' : '') + ', removed ' + fmt(rec.removed[i]) + ', ' + fmt(left) + ' went on'; }).join('; ') + '. ' + fmt(rec.kept) + ' papers were kept.';
  }

  /**
   * Draws the picture and its switch into stage.
   * narrow: the one-column arrangement; first: the preset shown at once.
   * Returns { vw, set(presetId, moving), play(), current(), destroy() }; vw is the picture's width.
   */
  function picture(stage, narrow, first) {
    var G = narrow ? NARROW : WIDE, rv = OK.reveal(), uid = 'ba-title-' + (++count), cards = {}, cur = null, d = {}, n = {}, rolls = [];
    stage.textContent = '';
    var svg = OK.svg('svg', { class: 'ba-svg', role: 'img', 'aria-labelledby': uid }, stage);
    var title = OK.svg('title', { id: uid }, svg);
    var gStub = OK.svg('g', {}, svg), gTail = OK.svg('g', {}, svg), gGround = OK.svg('g', {}, svg), gGhost = OK.svg('g', {}, svg), gCards = OK.svg('g', {}, svg), gHead = OK.svg('g', {}, svg);
    var probe = OK.svg('text', { x: 0, y: -200, visibility: 'hidden' }, svg);
    function width(str, cls) { probe.setAttribute('class', cls); probe.textContent = str; return probe.getComputedTextLength(); }
    function group(parent, html) { var g = OK.svg('g', {}, parent); if (html) g.innerHTML = html; return g; }

    /* ---- the line out of the pipeline, its two counts, and the filters: drawn once, measured
            from the pipeline's foot; the numbers and the bars' lengths are filled in by set ---- */
    var B = narrow ? 0 : G.top + G.span;                // the pipeline's foot in the picture (narrow: the tail is moved to it)
    // a criterion a language model reads is the user's sentence, so it stands in quotation marks
    var fs = D.filters.map(function (x) { return { name: x.name, set: x.model ? '“' + x.setting + '”' : x.setting }; });
    // a filter card is as wide as the longest setting, and odd, so that the line through its middle is sharp
    var FW = Math.ceil(Math.max.apply(null, fs.map(function (x) { return width(x.set, 'ba-set'); }))) + 26;
    FW += 1 - FW % 2;
    var c = G.cross, fl = narrow ? G.px - FW / 2 : G.fl, fx = fl + FW / 2, sx = fl + FW + 10;   // the filter cards' left edge; the line through them; the left edge of what they removed
    var t0 = narrow ? G.first : G.top + G.first - B, arch = G.top + 1.5 - B;
    fs.forEach(function (x, i) { x.y = t0 + i * G.pitch; });
    // the kept paper ends the line; wide, it stands at the height of the found paper
    var keptY = narrow ? fs[fs.length - 1].y + FH + 47.5 : c, tip = keptY - 19;
    var vw = narrow ? G.vw : sx + Math.ceil(Math.max(width('0,000', 'cnt'), width('removed', 'note'))), tailH = keptY + 13;
    (function tail() {
      var FOUND_W = 'found', MERGED_W = 'duplicates merged', b1, b2, lab;
      if (narrow) {
        // both papers stand on the line as it falls, their counts beside them
        b1 = { x: G.px, y: G.beads[0] }; b2 = { x: G.px, y: G.beads[1] };
        d.a = OK.svg('path', { class: 'lead cut', pathLength: 1, d: 'M' + G.px + ',-.5 V' + (b1.y - 13.5) }, gTail);
        d.m = OK.svg('path', { class: 'lead cut', pathLength: 1, d: 'M' + G.px + ',' + (b1.y + 13.5) + ' V' + (b2.y - 18.5) }, gTail);
        d.b1 = OK.svg('path', { class: 'lead cut', pathLength: 1, d: 'M' + G.px + ',' + (b2.y + 13.5) + ' V' + (t0 + 0.5) }, gTail);
        lab = function (b, word) {
          var g = OK.svg('g', {}, gTail);
          var num = OK.svg('text', { class: 'cnt', x: b.x + 22, y: b.y - 2.5 }, g);
          OK.svg('text', { class: 'note', x: b.x + 22, y: b.y + 12.5 }, g, word);
          return { g: g, num: num };
        };
      } else {
        // both papers stand on the run under the pipeline, their counts above them; the three
        // gaps beside and between the two labels are equal
        var w1 = Math.max(width('00,000', 'cnt'), width(FOUND_W, 'note')), w2 = Math.max(width('0,000', 'cnt'), width(MERGED_W, 'note'));
        var x0 = G.px + 1.5, room = (G.gx - 1.5 - x0 - w1 - w2) / 3;
        b1 = { x: Math.round(x0 + room + w1 / 2) + 0.5, y: c }; b2 = { x: Math.round(x0 + 2 * room + w1 + w2 / 2) + 0.5, y: c };
        d.a = OK.svg('path', { class: 'lead cut', pathLength: 1, d: 'M' + G.px + ',-.5 V' + (c - R) + ' A' + R + ',' + R + ' 0 0 0 ' + (G.px + R) + ',' + c + ' H' + (b1.x - 11) }, gTail);
        d.m = OK.svg('path', { class: 'lead cut', pathLength: 1, d: 'M' + (b1.x + 11) + ',' + c + ' H' + (b2.x - 16) }, gTail);
        d.b1 = OK.svg('path', { class: 'lead cut', pathLength: 1, d: 'M' + (b2.x + 11) + ',' + c + ' H' + (G.gx - R) + ' A' + R + ',' + R + ' 0 0 0 ' + G.gx + ',' + (c - R) + ' V' + (arch + R) + ' A' + R + ',' + R + ' 0 0 1 ' + (G.gx + R) + ',' + arch + ' H' + (fx - R) + ' A' + R + ',' + R + ' 0 0 1 ' + fx + ',' + (arch + R) + ' V' + (t0 + 0.5) }, gTail);
        lab = function (b, word) {
          var g = OK.svg('g', {}, gTail);
          var num = OK.svg('text', { class: 'cnt', x: b.x, y: b.y - 34.5, 'text-anchor': 'middle' }, g);
          OK.svg('text', { class: 'note', x: b.x, y: b.y - 19.5, 'text-anchor': 'middle' }, g, word);
          return { g: g, num: num };
        };
      }
      // the line through the filters: a piece from each card to the next, and from the last to the arrowhead
      d.falls = fs.map(function (x, i) {
        var y1 = x.y + FH - 0.5, y2 = i < fs.length - 1 ? fs[i + 1].y + 0.5 : tip;
        return { y1: y1, y2: y2, e: OK.svg('path', { class: 'lead cut', pathLength: 1, d: 'M' + fx + ',' + y1 + ' V' + y2 }, gTail) };
      });
      d.head = OK.svg('path', { class: 'lead', d: 'M' + (fx - 5) + ',' + (tip - 5) + ' L' + fx + ',' + tip + ' L' + (fx + 5) + ',' + (tip - 5) }, gTail);
      // what the steps found together; then the copies of one paper, merged into one
      d.found = group(gTail, OK.paper(b1.x, b1.y, 15, 20));
      var l1 = lab(b1, FOUND_W); d.foundN = l1.g; n.found = l1.num;
      d.merged = group(gTail, OK.paper(b2.x - 5, b2.y - 5, 15, 20, { pale: true }) + OK.paper(b2.x, b2.y, 15, 20));
      var l2 = lab(b2, MERGED_W); d.mergedN = l2.g; n.merged = l2.num;
      // the heads of the two columns: the filters, and what they removed
      var hy = narrow ? t0 - 34 : 14 - B;
      d.fLab = OK.svg('text', { class: 'lab', x: narrow ? 0 : fl, y: hy }, gTail, 'Filter');
      d.rLab = OK.svg('text', { class: 'note', x: vw, y: hy, 'text-anchor': 'end' }, gTail, 'removed');
      // a filter: above it, across the line, the papers that arrive; the card; beside the card the papers it removed
      n.arrives = []; n.removed = []; d.outs = []; d.flows = [];
      d.rows = fs.map(function (x) {
        d.flows.push(OK.svg('rect', { class: 'ba-flow', y: x.y - 18.5, height: 8, rx: 2 }, gTail));
        n.arrives.push(OK.svg('text', { class: 'cnt', y: x.y - 10 }, gTail));
        var s = '<rect class="card" x="' + (fl + 0.5) + '" y="' + (x.y + 0.5) + '" width="' + (FW - 1) + '" height="' + (FH - 1) + '" rx="12.5"/>';
        s += '<text class="lab" x="' + (fl + 13) + '" y="' + (x.y + 23) + '">' + x.name + '</text><text class="ba-set" x="' + (fl + 13) + '" y="' + (x.y + 41.5) + '">' + x.set + '</text>';
        var g = group(gTail, s);
        d.outs.push(OK.svg('rect', { class: 'ba-out', x: sx, y: x.y + 14, height: 8, rx: 2 }, g));
        n.removed.push(OK.svg('text', { class: 'cnt', x: sx, y: x.y + 41.5 }, g));
        return g;
      });
      d.kept = group(gTail, OK.paper(fx, keptY, 18, 23.5, { kept: true }));
      d.keptN = OK.svg('g', {}, gTail);
      var mw = f(width('000', 'cnt') + 9.3);
      OK.svg('rect', { class: 'mark', x: fx + 16, y: keptY - 8, width: mw, height: 16 }, d.keptN);
      n.kept = OK.svg('text', { class: 'cnt', x: f(fx + 20.65), y: keptY + 4.5 }, d.keptN);
      OK.svg('text', { class: 'note', x: f(fx + 16 + mw + 6), y: keptY + 4.5 }, d.keptN, 'kept');
    })();
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
        var p = Math.min(1, Math.max(0, (t - began) / 520)), k = 1 - Math.pow(1 - p, 3);
        e.textContent = fmt(Math.round(from + (to - from) * k));
        if (p < 1) id = requestAnimationFrame(step);
      }
      id = requestAnimationFrame(step);
      rolls.push(function () { cancelAnimationFrame(id); e.textContent = fmt(to); });
    }
    /* ends every roll and every animation, so that the DOM alone shows */
    function settle() { rolls.forEach(function (end) { end(); }); rolls = []; rv.cancel(); }
    /* a bar's length for a count of papers: even, so that a bar across the line has sharp ends */
    function len(v) { return Math.max(2, 2 * Math.round(v / MOST * G.flow / 2)); }
    /** Gives a bar its length; seen: true when the change is to be seen, the bar then growing or shrinking from the length it had. */
    function stretch(bar, w, seen) {
      if (seen) rv.from(bar, [{ transform: 'scaleX(' + (Number(bar.getAttribute('width')) / w) + ')' }, { transform: 'scaleX(1)' }], 0, 520);
      bar.setAttribute('width', w);
    }
    /** Fills in the record of one preset; old: the record on show when the change is to be seen. */
    function report(rec, old) {
      var left = rec.found - rec.merged, was = old && old.found - old.merged;
      write(n.found, rec.found, old && old.found);
      write(n.merged, rec.merged, old && old.merged);
      rec.removed.forEach(function (v, i) {
        // what arrives: a bar across the line, as long as the papers are many, and its count at the bar's end
        var w = Math.max(4, len(left)), num = n.arrives[i], x = fx + w / 2 + 8;
        write(num, left, was);
        if (old) rv.from(num, [{ transform: 'translateX(' + (Number(num.getAttribute('x')) - x) + 'px)' }, { transform: 'translateX(0)' }], 0, 520);
        num.setAttribute('x', x);
        stretch(d.flows[i], w, !!old); d.flows[i].setAttribute('x', fx - w / 2);
        // what the filter removed: a pale bar of the same measure, beside the card
        write(n.removed[i], v, old && old.removed[i]);
        stretch(d.outs[i], len(v), !!old);
        left -= v; if (old) was -= old.removed[i];
      });
      write(n.kept, rec.kept, old && old.kept);
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
    /** Shows a preset. moving: true when it replaces the one on show, so that steps travel to their new places and the record changes in sight. */
    function set(id, moving) {
      var P = presetOf(id), L = arrange(P, G), old = cur, k;
      settle();
      gGhost.textContent = '';
      title.textContent = describe(P);
      d.steps.textContent = P.rows.reduce(function (s, r) { return s + r.length; }, 0) + ' steps';
      report(RECORD[id], moving && old ? RECORD[old.id] : null);
      // grounds and line pieces are drawn again; the cards that stay travel
      Array.prototype.slice.call(gGround.childNodes).forEach(function (e) { if (moving) leave(e, 180); else e.remove(); });
      gStub.textContent = '';
      d.grounds = []; d.stubs = []; d.fresh = [];
      L.rows.forEach(function (r) {
        d.grounds.push(r.group ? OK.svg('rect', { class: 'ground', x: r.x, y: r.y, width: r.w, height: r.h, rx: 12.5 + G.pad }, gGround) : null);
      });
      L.stubs.forEach(function (s) { d.stubs.push(OK.svg('path', { class: 'lead cut', pathLength: 1, d: 'M' + G.px + ',' + (s.y1 - 0.5) + ' V' + (s.y2 + 0.5) }, gStub)); });
      for (k in cards) if (!L.at[k]) { if (moving) leave(cards[k].g, 180); else cards[k].g.remove(); delete cards[k]; }
      P.rows.forEach(function (ids) {
        ids.forEach(function (key) {
          var cd = cards[key], at = L.at[key], F = L.fmt[key];
          if (!cd) {
            cd = cards[key] = { g: OK.svg('g', {}, gCards) };
            cd.in = group(cd.g, card(key, F));
            d.fresh.push(cd.in);
          } else {
            if (moving) rv.from(cd.g, [{ transform: 'translate(' + cd.at.x + 'px,' + cd.at.y + 'px)' }, { transform: 'translate(' + at.x + 'px,' + at.y + 'px)' }], 0, 520);
            if (cd.fmt !== F) {                          // the same step in another card: one fades out as the other fades in
              if (moving) fadeOut(cd.in, 200); else cd.in.remove();
              cd.in = group(cd.g, card(key, F));
              if (moving) rv.fade(cd.in, 120, 320);
            }
          }
          cd.fmt = F;
          cd.at = at; put(cd.g, at);
        });
      });
      d.cards = P.rows.map(function (ids) { return ids.map(function (key) { return cards[key].in; }); });
      // narrow: the filters follow the pipeline's foot (they travel down with it; up, they are there at once, inside the shorter picture)
      var foot = narrow ? L.bottom : B;
      if (moving && old && old.foot < foot) rv.from(gTail, [{ transform: 'translate(0,' + old.foot + 'px)' }, { transform: 'translate(0,' + foot + 'px)' }], 0, 520);
      gTail.style.transform = 'translate(0,' + foot + 'px)';
      svg.setAttribute('viewBox', '0 0 ' + vw + ' ' + f(foot + tailH));
      cur = { id: id, foot: foot };
      if (moving) {
        d.grounds.forEach(function (g) { if (g) rv.fade(g, 160, 360); });
        d.fresh.forEach(function (g, i) { rv.arrive(g, 300 + i * 80, 380); });
        d.stubs.forEach(function (s, i) { rv.stroke(s, 200 + i * 120, 300); });
      }
    }

    /** Plays the reveal: the pipeline row by row along the line, the two counts under it, then the line down through the filters, each with what arrives and then what it removed. */
    function play() {
      settle();
      if (OK.still) return;
      rv.arrive(d.sLab, 0); rv.fade(stage.querySelector('.ba-switch'), 150, 400);
      var t = 0;
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
      rv.stroke(d.b1, t, narrow ? 300 : 760); t += narrow ? 220 : 620;
      rv.arrive(d.fLab, t - 120); rv.fade(d.rLab, t - 40, 320);
      // the line falls at one speed; each filter arrives as the line reaches it
      var run = tip - t0, at = function (y) { return t + 780 * (y - t0) / run; };
      d.rows.forEach(function (g, i) {
        var F = d.falls[i];
        rv.from(d.flows[i], [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], at(fs[i].y) - 120, 420);
        rv.fade(n.arrives[i], at(fs[i].y) - 40, 320);
        rv.arrive(g, at(fs[i].y) - 40, 380);
        rv.from(d.outs[i], [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], at(fs[i].y) + 140, 520);
        F.e.style.strokeDasharray = '1';
        rv.from(F.e, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], at(F.y1), 780 * (F.y2 - F.y1) / run, 'linear');
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
    var F3 = G.card(3), W3 = 3 * F3.cw + 2 * G.gap + 2 * G.pad;
    sw.style.right = f((1 - (G.px + W3 / 2) / vw) * 100) + '%';
    return { vw: vw, set: set, play: play, current: function () { return cur.id; }, destroy: settle };
  }

  function mount(root) {
    var wrap = OK.h('div', { class: 'ba-wrap' }, root);
    var text = OK.h('div', { class: 'ba-text' }, wrap);
    OK.h('h2', { class: 'sec-h' }, text, HEAD.map(function (s) {
      return '<span class="ba-s">' + s.map(function (l) { return '<span class="ba-l">' + l + '</span>'; }).join(' ') + '</span>';
    }).join(' '));
    OK.h('p', { class: 'sec-p' }, text, TEXT);
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
