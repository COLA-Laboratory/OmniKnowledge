/* The Build section: the section's text on the left, and in one frame a vertical pipeline of
   search steps beside the six filters as a vertical chain. The 3 px line runs down through the
   steps, turns under the pipeline, rises between the two columns and comes down through the
   filters, so the papers every step finds are seen to meet the same six criteria in order.
   A parallel group is one pale ground with its steps side by side; the line passes through it.
   The finished picture is the DOM; reveal and preset changes are animations laid over it.
   README.md owns the drawing language; this file owns only this section. */
(function () {
  'use strict';
  var OK = window.OK, f = OK.f, R = 16, count = 0;

  var HEAD = ['Build the search', 'your question', 'needs.'];        // the heading, as the lines it takes beside the frame
  var TEXT = 'Start from the papers you trust. Chain search steps, run them side by side, and set the criteria every paper has to meet.';

  /* a kind of step: its name and what it does, each split where a slim card breaks the line */
  var KINDS = {
    seed: { name: ['Seed', 'set'], does: ['The papers', 'you trust'] },
    back: { name: ['Backward', 'Searcher'], does: ['The papers each', 'paper cites'] },
    fwd: { name: ['Forward', 'Searcher'], does: ['The papers that', 'cite it'] },
    sem: { name: ['Semantic', 'Search'], does: ['The papers closest', 'in meaning'] },
    db: { name: ['Database', 'Search'], does: ['Queries written', 'from the question'] }
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

  /* The two arrangements. Wide: pipeline and filters side by side, the pipeline spread over a
     fixed height. Narrow: one column, the filters under the pipeline.
     card(n): the card of a step that stands in a row of n; pad, gap: inside a ground;
     px: the line through the pipeline; top: the first card's top; gx: the line's rise between
     the columns; fx, tx: the line through the filters and the text beside it; first: the first filter's
     height under top; pitch: filter to filter; bead: the found paper on the line. */
  var ROOMY = { id: 'roomy', cw: 219, ch: 80 }, SLIM = { id: 'slim', cw: 143, ch: 92 }, MINI = { id: 'mini', cw: 99, ch: 80 };
  var WIDE = { card: function (n) { return n > 2 ? SLIM : ROOMY; }, pad: 9, gap: 9, px: 232.5, top: 40, span: 544, cross: 28.5, gx: 509.5, fx: 587.5, tx: 616, first: 48, pitch: 85, bead: 420.5 };
  var NARROW = { narrow: true, card: function () { return MINI; }, vw: 325, pad: 7, gap: 7, px: 162.5, top: 40, step: 24, cross: 30.5, fx: 12.5, tx: 39, pitch: 76, bead: 87.5 };

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

  /** Returns a step card's markup in one of the three card formats, drawn from its own top left corner. */
  function card(kind, F) {
    var K = KINDS[kind], seed = kind === 'seed', s = '<rect class="card" x=".5" y=".5" width="' + (F.cw - 1) + '" height="' + (F.ch - 1) + '" rx="12.5"/>', i;
    if (F === MINI) {
      if (seed) for (i = 0; i < 3; i++) s += OK.paper(17.5 + i * 19, 23, 15, 20, { seed: true });
      else s += OK.tile(10, 10, 26, kind);
      (seed ? [K.name.join(' ')] : K.name).forEach(function (l, k) { s += '<text class="row" x="10" y="' + ((seed ? 58 : 53) + k * 15.5) + '">' + l + '</text>'; });
      return s;
    }
    if (seed) for (i = 0; i < 3; i++) s += OK.paper(21 + i * 20.5, 28, 16, 21, { seed: true });
    else s += OK.tile(13, 13, 30, kind);
    var nx = seed ? 81 : 54;
    if (F === ROOMY) {
      s += '<text class="lab" x="' + nx + '" y="33">' + K.name.join(' ') + '</text>';
      s += '<text class="note" x="13" y="64.5">' + K.does.join(' ') + '</text>';
    } else {
      K.name.forEach(function (l, k) { s += '<text class="lab" x="' + nx + '" y="' + (25 + k * 16.5) + '">' + l + '</text>'; });
      K.does.forEach(function (l, k) { s += '<text class="note" x="13" y="' + (62 + k * 16) + '">' + l + '</text>'; });
    }
    return s;
  }

  /** Returns the picture's title for one preset: the steps row by row, then the filters. */
  function describe(P) {
    var steps = 0, rows = P.rows.map(function (ids) {
      steps += ids.length;
      return ids.map(function (id) { return KINDS[kindOf(id)].name.join(' '); }).join(' beside ');
    });
    return 'A search pipeline of ' + steps + ' steps, from top to bottom: ' + rows.join('; then ') + '. Every paper the steps find then passes six filters in order: ' +
      OK.DATA.filters.map(function (x) { return x.name + ', ' + x.setting + (x.model ? ' (read by a language model)' : ''); }).join('; ') + '. What passes all six is kept.';
  }

  /**
   * Draws the picture and its switch into stage.
   * narrow: the one-column arrangement; first: the preset shown at once.
   * Returns { vw, set(presetId, moving), play(), current(), destroy() }; vw is the picture's width.
   */
  function picture(stage, narrow, first) {
    var G = narrow ? NARROW : WIDE, rv = OK.reveal(), uid = 'ba-title-' + (++count), cards = {}, cur = null, d = {};
    stage.textContent = '';
    var svg = OK.svg('svg', { class: 'ba-svg', role: 'img', 'aria-labelledby': uid }, stage);
    var title = OK.svg('title', { id: uid }, svg);
    var gStub = OK.svg('g', {}, svg), gTail = OK.svg('g', {}, svg), gGround = OK.svg('g', {}, svg), gGhost = OK.svg('g', {}, svg), gCards = OK.svg('g', {}, svg), gHead = OK.svg('g', {}, svg);
    var probe = OK.svg('text', { x: 0, y: -200, visibility: 'hidden' }, svg);
    function width(str, cls) { probe.setAttribute('class', cls); probe.textContent = str; return probe.getComputedTextLength(); }
    function group(parent, html) { var g = OK.svg('g', {}, parent); if (html) g.innerHTML = html; return g; }

    /* ---- the filters and the line into them: drawn once, measured from the pipeline's foot ---- */
    var B = narrow ? 0 : G.top + G.span;                // the pipeline's foot in the picture (narrow: the tail is moved to it)
    // a filter: its name beside its disc; under the name its setting, small on a pale tag.
    // A criterion a language model reads is the user's sentence, so it stands in quotation marks.
    var fs = OK.DATA.filters.map(function (x) { return { name: x.name, set: x.model ? '\u201c' + x.setting + '\u201d' : x.setting }; });
    var y0 = narrow ? G.cross + R + 60 : G.top + G.first - B, arch = G.top + 1.5 - B, wmax = 0, yy = y0;
    fs.forEach(function (x) {
      x.y = yy; yy += G.pitch;
      x.tw = Math.ceil(width(x.set, 'ba-set')) + 18;
      wmax = Math.max(wmax, width(x.name, 'task'), x.tw);
    });
    // the kept paper ends the line; wide, it stands at the height of the found paper
    var last = fs[fs.length - 1], keptY = narrow ? last.y + 90 : G.cross, tip = keptY - 19;
    var vw = narrow ? G.vw : Math.ceil(G.tx + wmax), tailH = keptY + 13;
    (function tail() {
      var c = G.cross, s;
      if (narrow) {
        d.a = OK.svg('path', { class: 'lead cut', pathLength: 1, d: 'M' + G.px + ',-.5 V' + (c - R) + ' A' + R + ',' + R + ' 0 0 1 ' + (G.px - R) + ',' + c + ' H' + (G.bead + 11) }, gTail);
        d.b1 = OK.svg('path', { class: 'lead cut', pathLength: 1, d: 'M' + (G.bead - 11) + ',' + c + ' H' + (G.fx + R) + ' A' + R + ',' + R + ' 0 0 0 ' + G.fx + ',' + (c + R) + ' V' + y0 }, gTail);
      } else {
        d.a = OK.svg('path', { class: 'lead cut', pathLength: 1, d: 'M' + G.px + ',-.5 V' + (c - R) + ' A' + R + ',' + R + ' 0 0 0 ' + (G.px + R) + ',' + c + ' H' + (G.bead - 11) }, gTail);
        d.b1 = OK.svg('path', { class: 'lead cut', pathLength: 1, d: 'M' + (G.bead + 11) + ',' + c + ' H' + (G.gx - R) + ' A' + R + ',' + R + ' 0 0 0 ' + G.gx + ',' + (c - R) + ' V' + (arch + R) + ' A' + R + ',' + R + ' 0 0 1 ' + (G.gx + R) + ',' + arch + ' H' + (G.fx - R) + ' A' + R + ',' + R + ' 0 0 1 ' + G.fx + ',' + (arch + R) + ' V' + y0 }, gTail);
      }
      d.b2 = OK.svg('path', { class: 'lead cut', pathLength: 1, d: 'M' + G.fx + ',' + y0 + ' V' + tip }, gTail);
      d.head = OK.svg('path', { class: 'lead', d: 'M' + (G.fx - 5) + ',' + (tip - 5) + ' L' + G.fx + ',' + tip + ' L' + (G.fx + 5) + ',' + (tip - 5) }, gTail);
      d.found = group(gTail, OK.paper(G.bead, c, 15, 20));
      d.foundN = OK.svg('text', { class: 'note', x: G.bead, y: c - 19.5, 'text-anchor': 'middle' }, gTail, 'found');
      d.fLab = OK.svg('text', { class: 'lab', x: G.tx, y: narrow ? c + 40 : 14 - B }, gTail, 'Filter');
      d.rows = fs.map(function (x, i) {
        s = '<circle class="port" cx="' + G.fx + '" cy="' + x.y + '" r="12"/><text class="ba-no" x="' + G.fx + '" y="' + (x.y + 4.6) + '" text-anchor="middle">' + (i + 1) + '</text>';
        s += '<text class="task" x="' + (G.tx - 0.6) + '" y="' + (x.y + 7) + '">' + x.name + '</text>';
        s += '<rect class="ba-tag" x="' + G.tx + '" y="' + (x.y + 20) + '" width="' + x.tw + '" height="24" rx="7"/><text class="ba-set" x="' + (G.tx + 9) + '" y="' + (x.y + 36.3) + '">' + x.set + '</text>';
        return group(gTail, s);
      });
      d.kept = group(gTail, OK.paper(G.fx, keptY, 18, 23.5, { kept: true }));
      d.keptN = OK.svg('text', { class: 'note', x: G.fx + 18, y: keptY + 4.5 }, gTail, 'kept');
    })();
    d.sLab = OK.svg('text', { class: 'lab', x: 0, y: 14 }, gHead, 'Search');
    d.steps = OK.svg('tspan', { class: 'note', dx: 9 }, d.sLab);
    probe.remove();

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
    /** Shows a preset. moving: true when it replaces the one on show, so that steps travel to their new places. */
    function set(id, moving) {
      var P = presetOf(id), L = arrange(P, G), old = cur, k;
      rv.cancel();
      gGhost.textContent = '';
      title.textContent = describe(P);
      d.steps.textContent = P.rows.reduce(function (n, r) { return n + r.length; }, 0) + ' steps';
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
          var c = cards[key], at = L.at[key], F = L.fmt[key];
          if (!c) {
            c = cards[key] = { g: OK.svg('g', {}, gCards) };
            c.in = group(c.g, card(kindOf(key), F));
            d.fresh.push(c.in);
          } else {
            if (moving) rv.from(c.g, [{ transform: 'translate(' + c.at.x + 'px,' + c.at.y + 'px)' }, { transform: 'translate(' + at.x + 'px,' + at.y + 'px)' }], 0, 520);
            if (c.fmt !== F) {                           // the same step in another card: one fades out as the other fades in
              if (moving) fadeOut(c.in, 200); else c.in.remove();
              c.in = group(c.g, card(kindOf(key), F));
              if (moving) rv.fade(c.in, 120, 320);
            }
          }
          c.fmt = F;
          c.at = at; put(c.g, at);
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

    /** Plays the reveal: the pipeline row by row along the line, then the line into the filters. */
    function play() {
      rv.cancel();
      if (OK.still) return;
      rv.arrive(d.sLab, 0); rv.fade(stage.querySelector('.ba-switch'), 150, 400);
      var t = 0;
      d.cards.forEach(function (row, i) {
        if (i) { rv.stroke(d.stubs[i - 1], t, 260); t += 170; }
        if (d.grounds[i]) rv.fade(d.grounds[i], t, 360);
        row.forEach(function (g, k) { rv.arrive(g, t + 40 + k * 90); });
        t += 300;
      });
      rv.stroke(d.a, t, 380); rv.arrive(d.found, t + 300); rv.fade(d.foundN, t + 380, 320);
      t += 480;
      rv.stroke(d.b1, t, narrow ? 360 : 760); t += narrow ? 300 : 620;
      rv.arrive(d.fLab, t - 120);
      rv.from(d.b2, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], t, 780, 'linear'); d.b2.style.strokeDasharray = '1';
      var run = tip - y0;
      d.rows.forEach(function (g, i) { rv.arrive(g, t + 780 * (fs[i].y - y0) / run - 40, 380); });
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
    return { vw: vw, set: set, play: play, current: function () { return cur.id; }, destroy: function () { rv.cancel(); } };
  }

  function mount(root) {
    var wrap = OK.h('div', { class: 'ba-wrap' }, root);
    var text = OK.h('div', { class: 'ba-text' }, wrap);
    OK.h('h2', { class: 'sec-h' }, text, HEAD.map(function (l) { return '<span class="ba-l">' + l + '</span>'; }).join(' '));
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
