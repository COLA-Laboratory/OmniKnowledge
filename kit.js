/* The shared drawing kit: the paper icon, the large sheet with parts, the map of the 212 papers,
   and the helpers every picture is built with. Every picture on the page draws with these, so a
   paper, a sheet and the network are the same objects from the first screen to the last.
   README.md says what each object and each class of kit.css is for. */
/* The paper icon: use it wherever a paper is shown large enough to be a paper (about 14 px wide
   and up); circles are for papers in number, as in a citation network. */
window.OK = (function () {
  var INK = '#0b0b0c', Q = '#9d9d96', OUT = '#d3d3cd', BAR = '#c6c6bf', Y = '#ffe62e';
  function f(n) { return Math.round(n * 10) / 10; }
  /**
   * Returns the SVG markup of a paper: a sheet with a folded corner and lines for text.
   * cx, cy: centre; w, h: size (h is about 1.3 times w).
   * o.seed: a seed paper, black; o.kept: a kept paper, yellow; o.dim: one hop further out;
   * o.pale: a paper that was not taken or was removed. Default: a found paper, white with an ink outline.
   */
  function paper(cx, cy, w, h, o) {
    o = o || {};
    var x = cx - w / 2, y = cy - h / 2, e = Math.max(4, Math.min(w * 0.3, 11)), r = 1.6;
    var stroke = o.seed ? INK : o.pale ? OUT : o.dim ? Q : INK, sw = o.seed ? 1.5 : o.pale ? 1 : 1.15;
    var s = '<path d="M' + f(x + r) + ',' + f(y) + ' H' + f(x + w - e) + ' L' + f(x + w) + ',' + f(y + e) + ' V' + f(y + h - r) + ' Q' + f(x + w) + ',' + f(y + h) + ' ' + f(x + w - r) + ',' + f(y + h) + ' H' + f(x + r) + ' Q' + f(x) + ',' + f(y + h) + ' ' + f(x) + ',' + f(y + h - r) + ' V' + f(y + r) + ' Q' + f(x) + ',' + f(y) + ' ' + f(x + r) + ',' + f(y) + ' Z" fill="' + (o.seed ? INK : o.kept ? Y : '#fff') + '" stroke="' + stroke + '" stroke-width="' + sw + '" stroke-linejoin="round"/>';
    s += '<path d="M' + f(x + w - e) + ',' + f(y) + ' V' + f(y + e) + ' H' + f(x + w) + '" fill="none" stroke="' + (o.seed ? '#fff' : stroke) + '" stroke-width="' + (o.seed ? 1 : sw * 0.85) + '" stroke-linejoin="round"' + (o.seed ? ' opacity=".5"' : '') + '/>';
    var tiny = h < 20, pad = w * (tiny ? 0.22 : 0.17), lh = tiny ? 1.1 : Math.max(1.4, h * 0.042), gap = h * (tiny ? 0.21 : 0.125), yy = y + h * (tiny ? 0.36 : 0.21), n = tiny ? 3 : Math.floor((h * 0.7) / gap);
    var col = o.seed ? '#fff' : o.kept ? '#8f7f00' : o.pale ? '#e4e4de' : o.dim ? '#d9d9d2' : BAR;
    var head = o.seed ? '#fff' : o.kept ? INK : o.pale ? '#dcdcd6' : o.dim ? '#b4b4ad' : '#8a8a83';
    for (var i = 0; i < n; i++) {
      var lw = (w - 2 * pad) * (tiny ? (i === n - 1 ? 0.6 : 1) : i === 0 ? 0.6 : i === n - 1 ? 0.55 : 1), hh = i === 0 && !tiny ? lh * 1.7 : lh;
      s += '<rect x="' + f(x + pad) + '" y="' + f(yy - hh / 2) + '" width="' + f(lw) + '" height="' + f(hh) + '" rx="' + f(hh / 2) + '" fill="' + (i === 0 || tiny ? head : col) + '"' + (o.seed && i > 0 ? ' opacity=".62"' : '') + '/>';
      yy += gap;
    }
    return s;
  }
  /* The large paper with parts, from round 6's "What each filter reads": use it wherever a paper
     is shown large enough to have a title, an abstract and the rest (about 90 px wide and up),
     so a large paper is the same object in every picture.
     sheetGeo(x, y, w, h) gives the rectangles of each part (venue, year, title, auth, cite, abs,
     body); sheetBase(g, opts) draws the quiet sheet; sheetInk(g, part, opts) draws one part in
     ink; ticks(rect, margin, colour) marks a part; bar(rect, fill) draws one line of text. */
  function prng(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  var QUIET = '#dfdfd9', QUIET2 = '#ebebe6', YEL = Y;
  
  /** Returns where each part of a sheet at (x, y) of size w by h lies: rectangles keyed by part. */
  function sheetGeo(x, y, w, h) {
    var e = Math.min(w * 0.17, 22), pad = w * 0.13, iw = w - 2 * pad, hv = Math.max(2.6, w * 0.03), fs = w * 0.094, i;
    var g = { x: x, y: y, w: w, h: h, e: e, pad: pad, iw: iw, hv: hv, fs: fs };
    g.venue = [{ x: x + pad, y: y + h * 0.105 - hv / 2, w: iw * 0.44, h: hv }];
    g.year = [{ x: x + w - e - w * 0.07 - fs * 2.42, y: y + h * 0.105 - fs * 0.46, w: fs * 2.42, h: fs * 0.92 }];
    var th = w * 0.054;
    g.title = [{ x: x + pad, y: y + h * 0.2, w: iw, h: th }, { x: x + pad, y: y + h * 0.2 + th + h * 0.032, w: iw * 0.62, h: th }];
    g.auth = [{ x: x + pad, y: y + h * 0.365, w: iw * 0.5, h: hv * 0.8 }];
    g.cite = [{ x: x + pad, y: y + h * 0.425, w: iw * 0.76, h: w * 0.112 }];
    g.abs = [];
    for (i = 0; i < 5; i++) g.abs.push({ x: x + pad, y: y + h * (0.555 + i * 0.05), w: iw * (i === 4 ? 0.58 : 1), h: Math.max(2.2, w * 0.027) });
    g.body = [];
    for (i = 0; i < 6; i++) g.body.push({ x: x + pad + (i % 2) * (iw * 0.54), y: y + h * (0.845 + Math.floor(i / 2) * 0.045), w: iw * (i === 5 ? 0.3 : 0.46), h: Math.max(1.8, w * 0.02) });
    return g;
  }
  
  /** Returns the rectangle around several rectangles. */
  function bbox(rects) {
    var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    rects.forEach(function (r) { x0 = Math.min(x0, r.x); y0 = Math.min(y0, r.y); x1 = Math.max(x1, r.x + r.w); y1 = Math.max(y1, r.y + r.h); });
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }
  
  function bar(r, fill, extra) {
    return '<rect x="' + f(r.x) + '" y="' + f(r.y) + '" width="' + f(r.w) + '" height="' + f(r.h) + '" rx="' + f(Math.min(r.h / 2, 3)) + '" fill="' + fill + '"' + (extra || '') + '/>';
  }
  
  /** Splits a line of text into word-sized pieces; returns [{x, y, w, h, hit}], hit for the words that match. */
  function wordsOf(r, rnd, hits, wide) {
    var out = [], x = r.x, k = 0, gap = wide ? 4.5 : 3.2;
    while (x < r.x + r.w - 5) {
      var w = Math.min((wide ? 15 : 9) + rnd() * (wide ? 16 : 13), r.x + r.w - x);
      if (r.x + r.w - (x + w) < 7) w = r.x + r.w - x;
      out.push({ x: x, y: r.y, w: w, h: r.h, hit: hits.indexOf(k) >= 0 });
      x += w + gap; k++;
    }
    return out;
  }
  
  /** Returns four corner ticks around a rectangle: the mark of the part a filter reads. */
  function ticks(r, m, col) {
    var x0 = r.x - m, y0 = r.y - m, x1 = r.x + r.w + m, y1 = r.y + r.h + m, t = Math.min(6, (y1 - y0) / 2 - 1);
    return '<path d="M' + f(x0) + ',' + f(y0 + t) + ' V' + f(y0) + ' H' + f(x0 + t) + ' M' + f(x1 - t) + ',' + f(y0) + ' H' + f(x1) + ' V' + f(y0 + t) + ' M' + f(x1) + ',' + f(y1 - t) + ' V' + f(y1) + ' H' + f(x1 - t) + ' M' + f(x0 + t) + ',' + f(y1) + ' H' + f(x0) + ' V' + f(y1 - t) + '" fill="none" stroke="' + (col || INK) + '" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>';
  }
  
  /**
   * Returns the quiet sheet: outline, folded corner and every part in pale grey.
   * o.kept: a kept paper, yellow; o.skip: {part: true} for parts drawn only in ink; o.words: the
   * title and abstract drawn word by word (a list from sheetWords).
   */
  function sheetBase(g, o) {
    o = o || {};
    var x = g.x, y = g.y, w = g.w, h = g.h, e = g.e, r = 2.6, skip = o.skip || {};
    var q1 = o.kept ? 'rgba(11,11,12,.3)' : QUIET, q2 = o.kept ? 'rgba(11,11,12,.16)' : QUIET2;
    var s = '<path d="M' + f(x + r) + ',' + f(y) + ' H' + f(x + w - e) + ' L' + f(x + w) + ',' + f(y + e) + ' V' + f(y + h - r) + ' Q' + f(x + w) + ',' + f(y + h) + ' ' + f(x + w - r) + ',' + f(y + h) + ' H' + f(x + r) + ' Q' + f(x) + ',' + f(y + h) + ' ' + f(x) + ',' + f(y + h - r) + ' V' + f(y + r) + ' Q' + f(x) + ',' + f(y) + ' ' + f(x + r) + ',' + f(y) + ' Z" fill="' + (o.kept ? YEL : '#fff') + '" stroke="' + INK + '" stroke-width="1.3" stroke-linejoin="round"/>';
    s += '<path d="M' + f(x + w - e) + ',' + f(y) + ' V' + f(y + e) + ' H' + f(x + w) + '" fill="none" stroke="' + INK + '" stroke-width="1.1" stroke-linejoin="round"/>';
    if (!skip.venue) s += bar(g.venue[0], q1);
    if (!skip.year) s += bar({ x: g.year[0].x + g.year[0].w * 0.25, y: g.venue[0].y, w: g.year[0].w * 0.75, h: g.hv }, q1);
    if (o.words) o.words.forEach(function (p) { s += bar(p, q1); });
    else { g.title.forEach(function (b) { s += bar(b, q1); }); g.abs.forEach(function (b) { s += bar(b, q1); }); }
    s += bar(g.auth[0], q2);
    if (!skip.cite) s += bar({ x: g.cite[0].x, y: g.cite[0].y + g.cite[0].h / 2 - g.hv / 2, w: g.iw * 0.34, h: g.hv }, q1);
    g.body.forEach(function (b) { s += bar(b, q2); });
    return s;
  }
  
  /** Returns the title and abstract of a sheet as words, a few of them matching. */
  function sheetWords(g, seedNum) {
    var rnd = prng(seedNum), out = [];
    [[g.title[0], [1], true], [g.title[1], [0], true], [g.abs[0], [3], false], [g.abs[1], [0, 1], false], [g.abs[2], [], false], [g.abs[3], [2], false], [g.abs[4], [1], false]].forEach(function (l) {
      out = out.concat(wordsOf(l[0], rnd, l[1], l[2]));
    });
    return out;
  }
  
  /** Returns one part of a sheet in ink. part: 'year' (o.year: the text), 'cite', 'venue', 'title', 'abs'. */
  function sheetInk(g, part, o) {
    o = o || {};
    var s = '', r = g[part][0];
    if (part === 'year') {
      return '<text x="' + f(r.x + r.w) + '" y="' + f(r.y + r.h * 0.88) + '" text-anchor="end" style="font:500 ' + f(g.fs) + 'px/1 var(--mono);letter-spacing:-.02em">' + o.year + '</text>';
    }
    if (part === 'cite') {
      var fs = g.w * 0.078;
      s += '<rect x="' + f(r.x) + '" y="' + f(r.y) + '" width="' + f(r.w) + '" height="' + f(r.h) + '" rx="' + f(r.h / 2) + '" fill="#fff" stroke="' + INK + '" stroke-width="1.15"/>';
      s += '<text x="' + f(r.x + r.h * 0.5) + '" y="' + f(r.y + r.h / 2 + fs * 0.35) + '" style="font:500 ' + f(fs) + 'px/1 var(--text)">cited by</text>';
      s += bar({ x: r.x + r.w - r.h * 0.45 - g.w * 0.12, y: r.y + r.h / 2 - g.hv * 0.6, w: g.w * 0.12, h: g.hv * 1.2 }, INK);
      return s;
    }
    g[part].forEach(function (b) { s += bar(b, INK); });
    return s;
  }
  return { paper: paper, prng: prng, sheetGeo: sheetGeo, sheetBase: sheetBase, sheetWords: sheetWords, sheetInk: sheetInk, ticks: ticks, bar: bar, bbox: bbox };
})();
/* The map of the 212 kept papers: one citation network in four named topics. The same block is
   in Mapped 1 and Mapped 2 (and can be copied into Asked), so every picture draws the same map.
   OK.map.topics[t] = { name, n, seed, w, h, nodes: [{ i, x, y, r, deg, seed }], links: [[a, b]] }
   with x, y measured from the middle of the topic's own network. OK.map.between(at, scale) gives
   the citations between topics for one placement. A paper's circle is sized by how often it is cited. */
window.OK.map = (function () {
  var prng = window.OK.prng;
  var SPEC = [
    { name: 'Feeding and ingestion', n: 68, seed: 'Li et al. 2021', rank: 1, hubs: [5, 3.2, 2.4, 2, 1.5], ph: 0.56, w: 318, h: 388, rs: 41 },
    { name: 'Oxidative stress', n: 57, seed: 'Chen et al. 2019', rank: 0, hubs: [4, 3.6, 2, 1.6], ph: 0.6, w: 292, h: 356, rs: 19 },
    { name: 'Growth and development', n: 54, seed: 'Park et al. 2018', rank: 2, hubs: [3.6, 3, 2.6, 2.2, 1.6], ph: 0.5, w: 284, h: 346, rs: 7 },
    { name: 'Trophic transfer', n: 33, hubs: [4, 2.4, 1.5], ph: 0.58, w: 206, h: 250, rs: 23 }
  ];
  var PAIRS = [[0, 1, 2], [1, 2, 2], [2, 3, 2]];   // neighbouring topics, and how many citations cross between them

  /** Grows one topic: a few papers are hubs; each later paper cites a hub or a paper near one. */
  function grow(S) {
    var R = prng(S.rs * 7919 + 13), n = S.n, H = S.hubs.length, adj = [], fit = [], links = [], i;
    for (i = 0; i < n; i++) adj[i] = [];
    function link(a, b) { if (b == null || a === b || adj[a].indexOf(b) >= 0) return false; adj[a].push(b); adj[b].push(a); links.push([a, b]); return true; }
    function pick(from, not) {
      var tot = 0, k, w = [];
      for (k = 0; k < from.length; k++) { w[k] = from[k] === not ? 0 : from[k] < H ? S.hubs[from[k]] * 1.6 : fit[from[k]] * Math.pow(adj[from[k]].length + 1, 0.6); tot += w[k]; }
      var q = R() * tot;
      for (k = 0; k < from.length; k++) { q -= w[k]; if (q <= 0) return from[k]; }
      return from[from.length - 1];
    }
    var hubs = [], rest = [];
    for (i = 0; i < n; i++) {
      if (i < H) {
        fit[i] = S.hubs[i];
        if (i) link(i, R() < 0.6 ? i - 1 : Math.floor(R() * i));
        hubs.push(i);
        continue;
      }
      fit[i] = R() < 0.24 ? 1.4 : 0.3;
      var t = !rest.length || R() < S.ph ? pick(hubs, -1) : pick(rest, -1);
      link(i, t);
      if (R() < 0.3) link(i, R() < 0.6 && adj[t].length > 1 ? pick(adj[t], i) : R() < 0.5 ? pick(hubs, -1) : pick(rest, -1));
      rest.push(i);
    }
    return { adj: adj, links: links, R: R };
  }

  /** Lays a topic out by springs along citations and repulsion between papers; returns [{x, y}]. */
  function settle(S, G) {
    var R = G.R, n = S.n, adj = G.adj, links = G.links, P = [], i, j, k, seen = [0], queue = [0];
    P[0] = { x: 0, y: 0 };
    while (queue.length) {
      var p = queue.shift();
      adj[p].forEach(function (c) {
        if (seen.indexOf(c) >= 0) return;
        var a = R() * 6.2832;
        P[c] = { x: P[p].x + Math.cos(a) * 34, y: P[p].y + Math.sin(a) * 34 };
        seen.push(c); queue.push(c);
      });
    }
    var deg = adj.map(function (a) { return a.length; });
    var q = deg.map(function (d) { return 1 + 0.55 * Math.sqrt(d - 1); });
    var len = links.map(function (l) {
      var a = deg[l[0]], b = deg[l[1]], lo = Math.min(a, b), hi = Math.max(a, b);
      return (lo === 1 ? 20 + 3.2 * Math.sqrt(hi) : 30 + 7 * Math.sqrt(lo) + 3 * Math.sqrt(hi)) * (0.7 + 0.75 * R());
    });
    var asp = S.h / S.w, IT = 700;
    for (var it = 0; it < IT; it++) {
      var T = 14 * Math.pow(1 - it / IT, 1.4) + 0.25, dx, dy, d, f, D = [];
      for (i = 0; i < n; i++) D[i] = { x: -P[i].x * 0.03 * asp, y: -P[i].y * 0.03 / asp };
      for (i = 0; i < n; i++) for (j = i + 1; j < n; j++) {
        dx = P[j].x - P[i].x; dy = P[j].y - P[i].y; d = Math.hypot(dx, dy) + 0.01;
        f = Math.min(40, 620 * q[i] * q[j] / (d * d)) / d;
        D[i].x -= dx * f; D[i].y -= dy * f; D[j].x += dx * f; D[j].y += dy * f;
      }
      for (k = 0; k < links.length; k++) {
        i = links[k][0]; j = links[k][1];
        dx = P[j].x - P[i].x; dy = P[j].y - P[i].y; d = Math.hypot(dx, dy) + 0.01;
        f = 0.16 * (d - len[k]) / d;
        D[i].x += dx * f; D[i].y += dy * f; D[j].x -= dx * f; D[j].y -= dy * f;
      }
      for (i = 0; i < n; i++) {
        d = Math.hypot(D[i].x, D[i].y) + 0.01; f = Math.min(d, T) / d;
        P[i].x += D[i].x * f; P[i].y += D[i].y * f;
      }
    }
    return P;
  }

  var topics = SPEC.map(function (S) {
    var G = grow(S), P = settle(S, G), R = G.R, i, j, k, n = S.n;
    var nodes = P.map(function (p, ix) {
      var d = G.adj[ix].length;
      return { i: ix, x: p.x, y: p.y, deg: d, r: 3 + 1.28 * Math.pow(d - 1, 0.74) + (d < 3 ? R() * 0.9 : 0) };
    });
    var byDeg = nodes.slice().sort(function (a, b) { return b.deg - a.deg || a.i - b.i; });
    if (S.seed) { byDeg[S.rank].seed = S.seed; byDeg[S.rank].r = Math.max(byDeg[S.rank].r, 7.5); }
    // fit the topic's own box, then keep circles off each other and off lines that are not theirs
    var x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    nodes.forEach(function (m) { x0 = Math.min(x0, m.x); x1 = Math.max(x1, m.x); y0 = Math.min(y0, m.y); y1 = Math.max(y1, m.y); });
    var sx = (S.w - 16) / (x1 - x0), sy = (S.h - 16) / (y1 - y0), s = Math.min(sx, sy);
    sx = Math.min(sx, s * 1.12); sy = Math.min(sy, s * 1.12);
    nodes.forEach(function (m) { m.x = (m.x - (x0 + x1) / 2) * sx; m.y = (m.y - (y0 + y1) / 2) * sy; });
    for (var it = 0; it < 60; it++) {
      for (i = 0; i < n; i++) for (j = i + 1; j < n; j++) {
        var a = nodes[i], b = nodes[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 0.01, want = a.r + b.r + (a.seed || b.seed ? 7 : 3.5);
        if (d >= want) continue;
        var push = (want - d) / d * 0.5;
        a.x -= dx * push; a.y -= dy * push; b.x += dx * push; b.y += dy * push;
      }
      nodes.forEach(function (sd) {                    // room above a seed for its name
        if (!sd.seed) return;
        var bx0 = sd.x - 49, bx1 = sd.x + 49, by1 = sd.y - sd.r - 5.5, by0 = by1 - 21;
        nodes.forEach(function (m) {
          if (m === sd || m.x < bx0 - m.r || m.x > bx1 + m.r || m.y < by0 - m.r || m.y > by1 + m.r) return;
          var up = m.y - (by0 - m.r), left = m.x - (bx0 - m.r), right = bx1 + m.r - m.x, lo = Math.min(up, left, right);
          if (lo === up) m.y -= up * 0.8; else if (lo === left) m.x -= left * 0.8; else m.x += right * 0.8;
        });
      });
      for (k = 0; k < G.links.length; k++) {
        var u = nodes[G.links[k][0]], v = nodes[G.links[k][1]], ex = v.x - u.x, ey = v.y - u.y, el = ex * ex + ey * ey;
        for (i = 0; i < n; i++) {
          var m = nodes[i];
          if (m === u || m === v) continue;
          var t = ((m.x - u.x) * ex + (m.y - u.y) * ey) / el;
          if (t < 0.08 || t > 0.92) continue;
          var px = u.x + ex * t - m.x, py = u.y + ey * t - m.y, pd = Math.hypot(px, py) || 0.01, need = m.r + 2.6;
          if (pd >= need) continue;
          var mv = (need - pd) / pd * 0.5;
          m.x -= px * mv; m.y -= py * mv;
        }
      }
    }
    x0 = 1e9; x1 = -1e9; y0 = 1e9; y1 = -1e9;
    nodes.forEach(function (m) { x0 = Math.min(x0, m.x - m.r); x1 = Math.max(x1, m.x + m.r); y0 = Math.min(y0, m.y - m.r); y1 = Math.max(y1, m.y + m.r); });
    nodes.forEach(function (m) { m.x -= (x0 + x1) / 2; m.y -= (y0 + y1) / 2; });
    return { name: S.name, n: S.n, seed: S.seed, w: x1 - x0, h: y1 - y0, nodes: nodes, links: G.links };
  });

  /**
   * Picks the citations between neighbouring topics for one placement of the map: single lines
   * between papers on the facing sides, apart from each other and clear of other papers.
   * at: [{ x, y }] the middle of each topic; s: the map's scale. Returns [[ta, a, tb, b]].
   */
  function between(at, s) {
    var out = [];
    PAIRS.forEach(function (c) {
      var A = topics[c[0]], B = topics[c[1]], pa = at[c[0]], pb = at[c[1]], cand = [], got = [];
      var pos = function (P, m) { return { x: P.x + m.x * s, y: P.y + m.y * s, r: m.r * s, m: m }; };
      var na = A.nodes.map(function (m) { return pos(pa, m); }), nb = B.nodes.map(function (m) { return pos(pb, m); }), all = na.concat(nb);
      na.forEach(function (a) { if (a.m.seed || a.m.deg > 7) return; nb.forEach(function (b) { if (!b.m.seed && b.m.deg <= 7) cand.push([Math.hypot(a.x - b.x, a.y - b.y), a, b]); }); });
      cand.sort(function (p, q) { return p[0] - q[0]; });
      for (var k = 0; k < cand.length && got.length < c[2]; k++) {
        var a = cand[k][1], b = cand[k][2], ex = b.x - a.x, ey = b.y - a.y, el = ex * ex + ey * ey;
        var apart = got.every(function (g) { return Math.hypot(g[0].x - a.x, g[0].y - a.y) > 74 * s && Math.hypot(g[1].x - b.x, g[1].y - b.y) > 60 * s; });
        var clear = all.every(function (m) {
          if (m === a || m === b) return true;
          var t = Math.max(0, Math.min(1, ((m.x - a.x) * ex + (m.y - a.y) * ey) / el));
          return Math.hypot(a.x + ex * t - m.x, a.y + ey * t - m.y) > m.r + 5;
        });
        if (apart && clear) got.push([a, b]);
      }
      got.forEach(function (g) { out.push([c[0], g[0].m.i, c[1], g[1].m.i]); });
    });
    return out;
  }
  return { topics: topics, between: between };
})();

/* ---------- shared helpers for every picture ---------- */
(function () {
  'use strict';
  var OK = window.OK, NS = 'http://www.w3.org/2000/svg';
  var Q = new URLSearchParams(location.search);

  /** True when pictures must show their finished state at once (?still=1 or reduced motion). */
  OK.still = Q.has('still') || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  OK.EASE = 'cubic-bezier(.2,.7,.2,1)';

  /** Creates an SVG element. attrs: attributes; parent: appended to when given; text: its text. */
  OK.svg = function (tag, attrs, parent, text) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  };
  /** Creates an HTML element. attrs: attributes ("class", "aria-pressed"...); html: its innerHTML. */
  OK.h = function (tag, attrs, parent, html) {
    var e = document.createElement(tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (html != null) e.innerHTML = html;
    if (parent) parent.appendChild(e);
    return e;
  };
  /** Rounds to one decimal, for coordinates written into markup. */
  OK.f = function (n) { return Math.round(n * 10) / 10; };
  /** 14950 -> "14,950". */
  OK.fmt = function (n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); };

  /**
   * Returns a line of text that cannot be quoted, as word-sized bars (SVG markup).
   * x, y: left end and middle height; w: length; seed: any integer; ink: how many of the first
   * words are set in ink; h: bar height (5 by default).
   */
  OK.words = function (x, y, w, seed, ink, h) {
    var R = OK.prng(seed), s = '', k = 0, x1 = x + w;
    h = h || 5;
    while (x < x1 - 6) {
      var ww = Math.min(10 + R() * 16, x1 - x);
      if (x1 - (x + ww) < 9) ww = x1 - x;
      s += '<rect x="' + OK.f(x) + '" y="' + OK.f(y - h / 2) + '" width="' + OK.f(ww) + '" height="' + h + '" rx="' + OK.f(h / 2) + '" fill="' + (k < (ink || 0) ? '#0b0b0c' : '#c9c9c2') + '"/>';
      x += ww + h * 0.85; k++;
    }
    return s;
  };

  /* The three search icons of the first picture, and the two directions of citation tracing
     (back: the papers a paper cites; fwd: the papers that cite it), in a 20 by 20 box with class "ic". */
  OK.icon = {
    cite: '<path d="M4 15.5 10 10l6-5.5M10 10l5.5 5"/><circle class="f" cx="4" cy="15.5" r="2.1"/><circle class="f" cx="10" cy="10" r="2.1"/><circle class="f" cx="16" cy="4.5" r="2.1"/><circle class="f" cx="15.5" cy="15" r="2.1"/>',
    sem: '<circle cx="10" cy="10" r="7.6" stroke-dasharray="1.6 2.9"/><circle class="f" cx="10" cy="10" r="2.3"/><circle class="f" cx="13.6" cy="6.9" r="1.2"/><circle class="f" cx="6.3" cy="12.9" r="1.2"/><circle class="f" cx="12.9" cy="13.9" r="1.2"/>',
    db: '<rect x="2.6" y="2.8" width="14.8" height="4.6" rx="2.3"/><path d="M6.6 11h10.2M6.6 14.2h10.2M6.6 17.4h6.4"/><circle class="f" cx="3.4" cy="11" r="1"/><circle class="f" cx="3.4" cy="14.2" r="1"/><circle class="f" cx="3.4" cy="17.4" r="1"/>',
    back: '<circle class="f" cx="14.6" cy="10" r="2.6"/><path d="M11 10H3.4M6.9 6.4 3.3 10l3.6 3.6"/>',
    fwd: '<circle class="f" cx="5.4" cy="10" r="2.6"/><path d="M9 10h7.6M13.1 6.4l3.6 3.6-3.6 3.6"/>'
  };
  /** Returns the black rounded tile with a white icon, as in the first picture's Search card (SVG markup). */
  OK.tile = function (x, y, size, key) {
    var k = size / 22;
    return '<rect class="tile" x="' + OK.f(x) + '" y="' + OK.f(y) + '" width="' + size + '" height="' + size + '" rx="' + OK.f(6.6 * k) + '"/><g class="ic" transform="translate(' + OK.f(x + 3.7 * k) + ' ' + OK.f(y + 3.7 * k) + ') scale(' + OK.f(0.73 * k * 100) / 100 + ')">' + OK.icon[key] + '</g>';
  };

  /**
   * Returns a reveal: animations laid over a finished picture, so that with OK.still (or after
   * cancel) the DOM is the finished state. from/fade/arrive/stroke take (element, delay ms,
   * duration ms); stroke needs pathLength="1" on the path. cancel() ends every animation.
   */
  OK.reveal = function () {
    var anims = [];
    function from(e, frames, delay, dur, ease) { if (!OK.still) anims.push(e.animate(frames, { delay: delay || 0, duration: dur || 420, easing: ease || OK.EASE, fill: 'backwards' })); }
    return {
      from: from,
      fade: function (e, delay, dur) { from(e, [{ opacity: 0 }, { opacity: 1 }], delay, dur || 420); },
      arrive: function (e, delay, dur) { from(e, [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'translateY(0)' }], delay, dur || 420); },
      stroke: function (e, delay, dur) { e.style.strokeDasharray = '1'; from(e, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], delay, dur); },
      cancel: function () { anims.forEach(function (a) { a.cancel(); }); anims = []; }
    };
  };

  /** Calls fn once, the first time a third of el is in the window (at once when OK.still). */
  OK.onArrive = function (el, fn) {
    if (OK.still || !('IntersectionObserver' in window)) { fn(); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { io.disconnect(); fn(); } });
    }, { threshold: 0.3 });
    io.observe(el);
  };

  /** Resolves when the faces the pictures measure text in are loaded (or after 2.5 s). */
  OK.fontsReady = function () {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    var faces = ['500 20px "Hanken"', '600 20px "Hanken"', '400 20px "Hanken"'];
    return Promise.race([Promise.all(faces.map(function (f) { return document.fonts.load(f); })), new Promise(function (r) { setTimeout(r, 2500); })]);
  };

  /* The example every picture tells: one question, its numbers, its names. Illustrative. */
  OK.DATA = {
    question: 'How does microplastic exposure affect freshwater fish?',
    seeds: ['Li et al. 2021', 'Chen et al. 2019', 'Park et al. 2018'],
    searches: [
      { key: 'cite', name: 'Citation tracing', found: 8210 },
      { key: 'sem', name: 'Semantic Search', found: 4630 },
      { key: 'db', name: 'Database Search', found: 2110 }
    ],
    found: 14950,
    deduped: 12400,
    filters: [
      { name: 'Year', reads: 'the year', setting: '2015 or later', pass: 8500, model: false },
      { name: 'Citations', reads: 'the citation count', setting: 'At least 5 a year', pass: 6200, model: false },
      { name: 'Venue', reads: 'the venue', setting: 'Peer-reviewed, no preprints', pass: 5300, model: false },
      { name: 'Keywords', reads: 'words in title and abstract', setting: 'microplastic* OR nanoplastic*', pass: 1900, model: false },
      { name: 'Title criteria', reads: 'the title', setting: 'Studies a freshwater fish species', pass: 650, model: true },
      { name: 'Abstract criteria', reads: 'the abstract', setting: 'Reports an exposure experiment', pass: 320, model: true },
      { name: 'Full-text criteria', reads: 'the full text', setting: 'Reports dose and duration', pass: 212, model: true }
    ],
    kept: 212,
    tasks: ['Literature review', 'Hypothesis generation', 'Experiment planning', 'Results interpretation']
  };

  /**
   * The semantic map of the same 212 papers: where each paper stands when papers are placed by
   * what they are about instead of by citation. Returns { w, h, topics: [{ name, lobes: [{ name,
   * x, y }], pts: [{ i, x, y, lobe }] }] } in a box of w by h; pts[i] is the paper
   * OK.map.topics[t].nodes[i], so a paper keeps its identity between the two views.
   */
  OK.semantic = (function () {
    var W = 1000, H = 460, memo = null;
    var LOBES = [
      [['Particle uptake', 150, 140, 26], ['Gut retention', 232, 304, 24], ['Feeding rate', 345, 196, 18]],
      [['Antioxidant enzymes', 566, 108, 30], ['Lipid peroxidation', 708, 136, 27]],
      [['Body condition', 884, 214, 16], ['Larval growth', 800, 344, 20], ['Embryo development', 656, 372, 18]],
      [['Prey to predator', 452, 384, 19], ['Food web models', 536, 290, 14]]
    ];
    return function () {
      if (memo) return memo;
      var all = [];
      var topics = OK.map.topics.map(function (T, t) {
        var R = OK.prng(9001 + t * 131), pts = [], lobes = LOBES[t], k = 0, left = lobes[0][3];
        T.nodes.forEach(function (m, i) {
          while (left <= 0 && k < lobes.length - 1) { k++; left = lobes[k][3]; }
          left--;
          var L = lobes[k], sig = 7.2 * Math.sqrt(L[3]);
          var u = Math.max(1e-6, R()), v = R(), g = Math.sqrt(-2 * Math.log(u)), a = 6.2832 * v;
          var p = { i: i, t: t, lobe: k, x: L[1] + Math.cos(a) * g * sig * 1.15, y: L[2] + Math.sin(a) * g * sig * 0.9 };
          pts.push(p); all.push(p);
        });
        return { name: T.name, lobes: lobes.map(function (L) { return { name: L[0], x: L[1], y: L[2] }; }), pts: pts };
      });
      for (var it = 0; it < 80; it++) {
        for (var a = 0; a < all.length; a++) for (var b = a + 1; b < all.length; b++) {
          var p = all[a], q = all[b], dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy) || 0.01, want = p.t === q.t ? 13 : 22;
          if (d >= want) continue;
          var mv = (want - d) / d * 0.5;
          p.x -= dx * mv; p.y -= dy * mv; q.x += dx * mv; q.y += dy * mv;
        }
        all.forEach(function (p) { p.x = Math.max(14, Math.min(W - 14, p.x)); p.y = Math.max(14, Math.min(H - 14, p.y)); });
      }
      memo = { w: W, h: H, topics: topics };
      return memo;
    };
  })();

  /* ---------- sections and their versions ---------- */
  OK.sections = {};
  /**
   * Registers one version of a section of the page.
   * name: 'features' | 'build' | 'search' | 'screen' | 'knowledge'; id: 'a', 'b'...;
   * def.label: a few words naming the version;
   * def.mount(root, ctx): fills the empty element root with the whole section (heading, text
   * and picture) and may return { destroy() } to stop its timers.
   */
  OK.section = function (name, id, def) {
    (OK.sections[name] = OK.sections[name] || []).push({ id: id, label: def.label, mount: def.mount });
    OK.sections[name].sort(function (p, q) { return p.id < q.id ? -1 : 1; });
  };
})();
