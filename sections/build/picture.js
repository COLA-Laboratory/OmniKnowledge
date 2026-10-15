/**
 * The Build picture: a vertical pipeline of search steps beside the filters, and the record of
 * its run. The 3 px line runs down through the steps, turns under the pipeline, rises between the
 * two columns and comes down through the filters (wide); or falls straight through everything
 * (narrow, one column, the filters under the pipeline).
 *
 * Every search step carries the papers it found; on the line under the pipeline stand the total
 * found and the duplicates merged. At most two steps stand side by side, on one pale ground, and
 * every step card has one width and one layout. A filter is a card the line passes through: its
 * name, and what the user set in it on one pale field. Filters differ only in how much the field
 * holds, so a card is as tall as its filter is heavy. Above each card a pale bar lies across the
 * line, as long as the papers that reach the filter are many, with their count at its end; the
 * bars shorten down the column to the papers kept, on the yellow marker. The picture is as tall
 * as the preset's filters make it. Changing the preset moves what stays and swaps what changes.
 */
import { f, fmt, isStill, markup, paper, reveal, svg, token } from '../../kit/index.js';
import { LIBRARY, PRESETS, RECORD } from './record.js';
import { END, FIELD, FLOW, MOST, NARROW, PLACES, R, WIDE, arrange, card, describe, measure, tall } from './layout.js';

/** @typedef {import('./record.js').LibraryFilter} LibraryFilter */
/** @typedef {import('./record.js').RunRecord} RunRecord */
/** @typedef {import('./record.js').PresetId} PresetId */

let count = 0;

/**
 * Draws the picture into the stage, in front of the stage's switch.
 *
 * @param {HTMLElement} stage
 * @param {HTMLElement} sw The preset switch; its right edge is aligned to where a row of two ends.
 * @param {boolean} narrow The one-column arrangement.
 * @param {PresetId} first The preset shown at once.
 * @returns {{ vw: number, set: (id: PresetId, moving: boolean) => void, play: () => void, current: () => PresetId, destroy: () => void }}
 *   vw: the picture's width; set shows a preset, moving the change into sight when `moving`.
 */
export function picture(stage, sw, narrow, first) {
  const G = narrow ? NARROW : WIDE;
  const rv = reveal();
  const uid = `ba-title-${++count}`;
  /** @type {Record<string, { g: SVGElement, in: SVGElement, at?: { x: number, y: number } }>} */
  const cards = {};
  /** @type {Record<string, { g: SVGElement, in: SVGElement, y?: number }>} */
  const fcards = {};
  /** @type {{ id: PresetId, foot: number, col: ReturnType<typeof column> } | null} */
  let cur = null;
  /** @type {(() => void)[]} */
  let rolls = [];
  stage.querySelector('svg.ba-svg')?.remove();
  const pic = svg('svg', { class: 'ba-svg', role: 'img', 'aria-labelledby': uid });
  stage.prepend(pic);
  const description = svg('desc', { id: uid }, pic);
  const [gStub, gTail, gGround, gGhost, gCards, gHead] = [0, 1, 2, 3, 4, 5].map(() => svg('g', {}, pic));
  // the filters' column: narrow, it hangs under the pipeline's foot with the tail; wide, it stands on its own
  const gCol = svg('g', {}, narrow ? gTail : pic);
  const { fields, fw, cw, px, gx, c, fl, fx, t0, arch, vw, width } = measure(pic, narrow);

  /**
   * Returns where the filters of a record stand in the column.
   *
   * @param {RunRecord} rec
   * @returns {{ y: number[], row: number[], kept: number }} Each card's top, the middle of the bar above each, the middle of the kept paper.
   */
  function column(rec) {
    let y = t0;
    /** @type {{ y: number[], row: number[], kept: number }} */
    const out = { y: [], row: [], kept: 0 };
    for (const id of rec.filters) {
      out.y.push(y);
      out.row.push(y - FLOW.gap / 2);
      y += tall(LIBRARY[id]) + FLOW.gap;
    }
    out.kept = y - FLOW.gap + END;
    return out;
  }

  /* ---- the line out of the pipeline and its two counts, measured from the pipeline's foot ---- */
  /** @type {Record<string, SVGElement>} */
  const d = {};
  /** @type {Record<string, SVGElement>} */
  const n = {};
  {
    const FOUND_W = 'found';
    const MERGED_W = 'duplicates merged';
    let b1;
    let b2;
    /** @type {(b: { x: number, y: number }, word: string) => { g: SVGElement, num: SVGElement }} */
    let lab;
    if (narrow) {
      // both papers stand on the line as it falls, their counts beside them
      b1 = { x: px, y: G.beads[0] };
      b2 = { x: px, y: G.beads[1] };
      d.a = svg('path', { class: 'lead cut', pathLength: 1, d: `M${px},-.5 V${b1.y - 13.5}` }, gTail);
      d.m = svg('path', { class: 'lead cut', pathLength: 1, d: `M${px},${b1.y + 13.5} V${b2.y - 18.5}` }, gTail);
      d.b1 = svg('path', { class: 'lead cut', pathLength: 1, d: `M${px},${b2.y + 13.5} V${t0 + 0.5}` }, gTail);
      lab = (b, word) => {
        const g = svg('g', {}, gTail);
        const num = svg('text', { class: 'cnt', x: b.x + 22, y: b.y - 2.5 }, g);
        svg('text', { class: 'note', x: b.x + 22, y: b.y + 12.5 }, g, word);
        return { g, num };
      };
    } else {
      // both papers stand on the run under the pipeline, their counts above them; the three
      // gaps beside and between the two labels are equal. The run ends in the turn up to the rise.
      const w1 = Math.max(width('00,000', 'cnt'), width(FOUND_W, 'note'));
      const w2 = Math.max(width('0,000', 'cnt'), width(MERGED_W, 'note'));
      const x0 = px + 1.5;
      const room = (gx - 1.5 - x0 - w1 - w2) / 3;
      b1 = { x: Math.round(x0 + room + w1 / 2) + 0.5, y: c };
      b2 = { x: Math.round(x0 + 2 * room + w1 + w2 / 2) + 0.5, y: c };
      d.a = svg(
        'path',
        { class: 'lead cut', pathLength: 1, d: `M${px},-.5 V${c - R} A${R},${R} 0 0 0 ${px + R},${c} H${b1.x - 11}` },
        gTail,
      );
      d.m = svg('path', { class: 'lead cut', pathLength: 1, d: `M${b1.x + 11},${c} H${b2.x - 16}` }, gTail);
      d.b1 = svg(
        'path',
        { class: 'lead cut', pathLength: 1, d: `M${b2.x + 11},${c} H${gx - R} A${R},${R} 0 0 0 ${gx},${c - R}` },
        gTail,
      );
      lab = (b, word) => {
        const g = svg('g', {}, gTail);
        const num = svg('text', { class: 'cnt', x: b.x, y: b.y - 34.5, 'text-anchor': 'middle' }, g);
        svg('text', { class: 'note', x: b.x, y: b.y - 19.5, 'text-anchor': 'middle' }, g, word);
        return { g, num };
      };
    }
    // what the steps found together; then the copies of one paper, merged into one
    d.found = markup(gTail, paper(b1.x, b1.y, 15, 20));
    const l1 = lab(b1, FOUND_W);
    d.foundN = l1.g;
    n.found = l1.num;
    d.merged = markup(gTail, paper(b2.x - 5, b2.y - 5, 15, 20, { pale: true }) + paper(b2.x, b2.y, 15, 20));
    const l2 = lab(b2, MERGED_W);
    d.mergedN = l2.g;
    n.merged = l2.num;
  }

  /* ---- the filters' column: drawn once; the cards, the numbers, the bars' lengths and every
          height are filled in by set ---- */
  const gFlow = svg('g', {}, gCol); // the bars, under the line
  if (!narrow) {
    // the rise from the run up to the turn (as long as the pipeline is tall), and the turn over to the first filter
    d.rise = svg('path', { class: 'lead cut ba-hang', pathLength: 1 }, gCol);
    d.arch = svg(
      'path',
      {
        class: 'lead cut',
        pathLength: 1,
        d: `M${gx},${arch + R} A${R},${R} 0 0 1 ${gx + R},${arch} H${fx - R} A${R},${R} 0 0 1 ${fx},${arch + R} V${t0 + 0.5}`,
      },
      gCol,
    );
  }
  // the line through the filters, behind their cards, so that it holds while one filter takes another's place
  d.fall = svg('path', { class: 'lead cut ba-hang', pathLength: 1 }, gCol);
  d.fLab = svg('text', { class: 'lab', x: narrow ? 0 : fl, y: narrow ? t0 - 34 : 14 }, gCol, 'Filter');
  // above each filter, across the line: the papers that reach it, as a bar and its count
  /** @type {SVGElement[]} */
  const arrives = [];
  /** @type {SVGElement[]} */
  const flows = [];
  for (let k = 0; k < PLACES; k++) {
    flows.push(svg('rect', { class: 'ba-flow', height: FLOW.h, rx: 3 }, gFlow));
    arrives.push(svg('text', { class: 'cnt' }, gCol));
  }
  const gGone = svg('g', {}, gCol); // filter cards on their way out
  const gFilt = svg('g', {}, gCol); // filter cards
  // the end of the line, drawn round the middle of the kept paper: arrowhead, paper, count on the marker
  const gKept = svg('g', {}, gCol);
  d.head = svg('path', { class: 'lead', d: `M${fx - 5},-24 L${fx},-19 L${fx + 5},-24` }, gKept);
  d.kept = markup(gKept, paper(fx, 0, 18, 23.5, { kept: true }));
  d.keptN = svg('g', {}, gKept);
  const mw = f(width('000', 'cnt') + 9.3);
  svg('rect', { class: 'mark', x: fx + 16, y: -8, width: mw, height: 16 }, d.keptN);
  n.kept = svg('text', { class: 'cnt', x: f(fx + 20.65), y: 4.5 }, d.keptN);
  svg('text', { class: 'note', x: f(fx + 16 + mw + 6), y: 4.5 }, d.keptN, 'kept');
  d.sLab = svg('text', { class: 'lab', x: 0, y: 14 }, gHead, 'Search');
  d.steps = svg('tspan', { class: 'note', dx: 9 }, d.sLab);
  width.done();

  /* ---- the record: one number per element, written by set ---- */
  /**
   * Writes a count; when from is a number, the count rolls to it from there.
   *
   * @param {Element} e
   * @param {number} to
   * @param {number | null | undefined} from
   */
  function write(e, to, from) {
    e.textContent = fmt(to);
    if (isStill() || from == null || from === to) return;
    const began = performance.now();
    let id = 0;
    /** @param {number} t */
    const step = (t) => {
      const p = Math.min(1, Math.max(0, (t - began) / 520));
      const q = 1 - Math.pow(1 - p, 3);
      e.textContent = fmt(Math.round(from + (to - from) * q));
      if (p < 1) id = requestAnimationFrame(step);
    };
    id = requestAnimationFrame(step);
    rolls.push(() => {
      cancelAnimationFrame(id);
      e.textContent = fmt(to);
    });
  }
  /** Ends every roll and every animation, so that the DOM alone shows. */
  function settle() {
    for (const end of rolls) end();
    rolls = [];
    rv.cancel();
  }
  /** @param {number} v A bar's length for a count of papers: even, so that a bar across the line has sharp ends. */
  const len = (v) => 2 * Math.round((FLOW.head + ((FLOW.most - FLOW.head) * v) / MOST) / 2);
  /** @param {RunRecord} rec The papers that reach each filter: those that enter the first, then what each passes on. */
  const reach = (rec) => [rec.found - rec.merged].concat(rec.pass.slice(0, -1));

  /**
   * Fills in the record of one preset, each bar and count at its height in the column. When the
   * change is to be seen (old, was: the record and column on show), a bar grows or shrinks about
   * the line and moves to its height, its count travelling with its end.
   *
   * @param {RunRecord} rec
   * @param {ReturnType<typeof column>} col
   * @param {RunRecord | null} old
   * @param {ReturnType<typeof column> | null} was
   */
  function report(rec, col, old, was) {
    const before = old && reach(old);
    const all = reach(rec);
    write(n.found, rec.found, old?.found);
    write(n.merged, rec.merged, old?.merged);
    flows.forEach((bar, i) => {
      const num = arrives[i];
      const on = i < all.length;
      bar.style.display = num.style.display = on ? '' : 'none';
      if (!on) return;
      const w = len(all[i]);
      write(num, all[i], before?.[i]);
      if (before && was && i < before.length) {
        const dy = was.row[i] - col.row[i];
        rv.from(
          bar,
          [{ transform: `translateY(${dy}px) scaleX(${len(before[i]) / w})` }, { transform: 'translateY(0) scaleX(1)' }],
          0,
          520,
        );
        rv.from(
          num,
          [{ transform: `translate(${(len(before[i]) - w) / 2}px,${dy}px)` }, { transform: 'translate(0,0)' }],
          0,
          520,
        );
      }
      bar.setAttribute('x', String(fx - w / 2));
      bar.setAttribute('y', String(col.row[i] - FLOW.h / 2));
      bar.setAttribute('width', String(w));
      num.setAttribute('x', String(fx + w / 2 + 8));
      num.setAttribute('y', String(f(col.row[i] + 4.6)));
    });
    write(n.kept, rec.pass[rec.pass.length - 1], old && old.pass[old.pass.length - 1]);
  }

  /**
   * Returns a filter card's markup, drawn from its own top left corner: the name, and what the
   * user set on one pale field that ends at the card's right inset. A rule's field is as wide as
   * its text and stands beside the name; a query's or a prompt's field stands under the name, as
   * wide as the card allows and as tall as its lines.
   *
   * @param {import('./record.js').FilterId} id
   */
  function fcard(id) {
    const x = LIBRARY[id];
    const F = fields[id];
    const beside = !!x.setting;
    const h = tall(x);
    const w = beside ? F.w : fw - 26;
    const bx = fw - 13 - w;
    const by = beside ? 9 : 31;
    const tx = bx + FIELD.pad;
    let s = `<rect class="card" x=".5" y=".5" width="${fw - 1}" height="${h - 1}" rx="12.5"/><text class="ba-name" x="12.5" y="${beside ? 26 : 24}">${x.name}</text>`;
    s += `<rect class="ba-tag" x="${bx}" y="${by}" width="${w}" height="${h - by - 9}" rx="7"/>`;
    if (x.prompt) s += `<text class="ba-set" x="${tx}" y="${by + 15.3}" text-anchor="end">“</text>`;
    return s + F.lines.map((l, i) => `<text class="ba-set" x="${tx}" y="${f(by + 15.3 + i * FIELD.lead)}">${l}</text>`).join('');
  }

  /**
   * An element on its way out fades where it is, then is removed.
   *
   * @param {Element} e
   * @param {number} duration
   */
  function fadeOut(e, duration) {
    if (isStill()) {
      e.remove();
      return;
    }
    e.animate([{ opacity: 1 }, { opacity: 0 }], { duration, easing: token('ease'), fill: 'forwards' }).onfinish = () =>
      e.remove();
  }

  /**
   * Shows the filters of one record, each at its height in the column. When the change is to be
   * seen, a filter that stays travels to its new place, one that leaves fades where it stood and
   * one that arrives fades in, so that one filter taking another's place reads as a swap.
   *
   * @param {RunRecord} rec
   * @param {ReturnType<typeof column>} col
   * @param {boolean} seen
   */
  function filters(rec, col, seen) {
    /** @type {SVGElement[]} */
    const fresh = [];
    gGone.replaceChildren();
    for (const id of Object.keys(fcards)) {
      if (rec.filters.includes(/** @type {import('./record.js').FilterId} */ (id))) continue;
      if (seen) {
        gGone.appendChild(fcards[id].g);
        fadeOut(fcards[id].g, 180);
      } else fcards[id].g.remove();
      delete fcards[id];
    }
    rec.filters.forEach((id, i) => {
      let cd = fcards[id];
      const y = col.y[i];
      if (!cd) {
        const g = svg('g', {}, gFilt);
        cd = fcards[id] = { g, in: markup(g, fcard(id)) };
        fresh.push(cd.in);
      } else if (seen && cd.y !== y)
        rv.from(cd.g, [{ transform: `translate(${fl}px,${cd.y}px)` }, { transform: `translate(${fl}px,${y}px)` }], 0, 520);
      cd.y = y;
      cd.g.style.transform = `translate(${fl}px,${y}px)`;
    });
    d.rows = /** @type {any} */ (rec.filters.map((id) => fcards[id].in));
    if (seen) fresh.forEach((g, i) => rv.arrive(g, 260 + i * 80, 380));
  }

  /**
   * Gives a piece of line that hangs from its top end its path, growing from the length it had
   * when that was shorter.
   *
   * @param {SVGElement} e
   * @param {string} path
   * @param {number} length
   * @param {number | null | undefined} was
   */
  function hang(e, path, length, was) {
    if (was != null && was < length) rv.from(e, [{ transform: `scaleY(${was / length})` }, { transform: 'scaleY(1)' }], 0, 520);
    e.setAttribute('d', path);
  }

  /* ---- the pipeline: rebuilt for each preset ---- */
  /**
   * Lifts an element out of the layer being redrawn and fades it where it is.
   *
   * @param {Element} e
   * @param {number} duration
   */
  function leave(e, duration) {
    if (isStill()) {
      e.remove();
      return;
    }
    gGhost.appendChild(e);
    fadeOut(e, duration);
  }

  /** @type {(SVGElement | null)[]} */
  let grounds = [];
  /** @type {SVGElement[]} */
  let stubs = [];
  /** @type {SVGElement[][]} */
  let rowsOfCards = [];
  /** @type {SVGElement[]} */
  let filterRows = [];

  /**
   * Shows a preset. When it replaces the one on show (moving), steps and filters travel to their
   * new places and the record changes in sight. The picture takes the new preset's height at
   * once; what then stands lower travels down to its place, and what stands higher is there at
   * once, inside the shorter picture.
   *
   * @param {PresetId} id
   * @param {boolean} moving
   */
  function set(id, moving) {
    const P = /** @type {(typeof PRESETS)[number]} */ (PRESETS.find((p) => p.id === id));
    const rec = RECORD[id];
    const col = column(rec);
    const old = moving ? cur : null;
    // wide: the run under the pipeline lies at the height of the kept paper, and the pipeline is spread down to it
    const L = arrange(P, G, cw, px, col.kept - c - G.top);
    const foot = narrow ? L.bottom : col.kept - c;
    settle();
    gGhost.replaceChildren();
    description.textContent = describe(P);
    d.steps.textContent = `${P.rows.reduce((s, r) => s + r.length, 0)} steps`;
    report(rec, col, old && RECORD[old.id], old && old.col);
    filters(rec, col, !!old);
    filterRows = /** @type {any} */ (d.rows);
    // the end of the column: the line down to the arrowhead, and the kept paper
    hang(d.fall, `M${fx},${t0} V${col.kept - 19}`, col.kept - 19 - t0, old && old.col.kept - 19 - t0);
    if (old && old.col.kept < col.kept)
      rv.from(gKept, [{ transform: `translate(0,${old.col.kept}px)` }, { transform: `translate(0,${col.kept}px)` }], 0, 520);
    gKept.style.transform = `translate(0,${col.kept}px)`;
    if (!narrow) hang(d.rise, `M${gx},${arch + R} V${foot + c - R}`, foot + c - arch - 2 * R, old && old.foot + c - arch - 2 * R);
    // grounds and line pieces are drawn again; the cards that stay travel
    for (const e of [...gGround.children]) {
      if (old) leave(e, 180);
      else e.remove();
    }
    gStub.replaceChildren();
    grounds = L.rows.map((r) =>
      r.group ? svg('rect', { class: 'ground', x: r.x, y: r.y, width: r.w, height: r.h, rx: 12.5 + G.pad }, gGround) : null,
    );
    stubs = L.stubs.map((s) =>
      svg('path', { class: 'lead cut', pathLength: 1, d: `M${px},${s.y1 - 0.5} V${s.y2 + 0.5}` }, gStub),
    );
    for (const key of Object.keys(cards)) {
      if (L.at[key]) continue;
      if (old) leave(cards[key].g, 180);
      else cards[key].g.remove();
      delete cards[key];
    }
    /** @type {SVGElement[]} */
    const fresh = [];
    for (const ids of P.rows)
      for (const key of ids) {
        let cd = cards[key];
        const at = L.at[key];
        if (!cd) {
          const g = svg('g', {}, gCards);
          cd = cards[key] = { g, in: markup(g, card(key, G, cw)) };
          fresh.push(cd.in);
        } else if (old && cd.at)
          rv.from(
            cd.g,
            [{ transform: `translate(${cd.at.x}px,${cd.at.y}px)` }, { transform: `translate(${at.x}px,${at.y}px)` }],
            0,
            520,
          );
        cd.at = at;
        cd.g.style.transform = `translate(${at.x}px,${at.y}px)`;
      }
    rowsOfCards = P.rows.map((ids) => ids.map((key) => cards[key].in));
    // the tail hangs from the pipeline's foot
    if (old && old.foot < foot)
      rv.from(gTail, [{ transform: `translate(0,${old.foot}px)` }, { transform: `translate(0,${foot}px)` }], 0, 520);
    gTail.style.transform = `translate(0,${foot}px)`;
    pic.setAttribute('viewBox', `0 0 ${vw} ${f((narrow ? foot : 0) + col.kept + 13)}`);
    cur = { id, foot, col };
    if (old) {
      for (const g of grounds) if (g) rv.fade(g, 160, 360);
      fresh.forEach((g, i) => rv.arrive(g, 300 + i * 80, 380));
      stubs.forEach((s, i) => rv.stroke(s, 200 + i * 120, 300));
    }
  }

  /**
   * Plays the reveal: the pipeline row by row along the line, the two counts under it, then the
   * line down through the filters, each under the bar of what reaches it.
   */
  function play() {
    settle();
    if (isStill() || !cur) return;
    rv.arrive(d.sLab, 0);
    rv.fade(sw, 150, 400);
    let t = 0;
    const col = cur.col;
    rowsOfCards.forEach((row, i) => {
      if (i) {
        rv.stroke(stubs[i - 1], t, 260);
        t += 170;
      }
      const ground = grounds[i];
      if (ground) rv.fade(ground, t, 360);
      row.forEach((g, k) => rv.arrive(g, t + 40 + k * 90));
      t += 300;
    });
    rv.stroke(d.a, t, narrow ? 200 : 380);
    t += narrow ? 120 : 300;
    rv.arrive(d.found, t);
    rv.fade(d.foundN, t + 80, 320);
    rv.stroke(d.m, t + 120, 240);
    t += 300;
    rv.arrive(d.merged, t);
    rv.fade(d.mergedN, t + 80, 320);
    t += 180;
    if (narrow) {
      rv.stroke(d.b1, t, 300);
      t += 220;
    } else {
      rv.stroke(d.b1, t, 200);
      rv.stroke(d.rise, t + 160, 340);
      rv.stroke(d.arch, t + 460, 260);
      t += 620;
    }
    rv.arrive(d.fLab, t - 120);
    // the line falls at one speed; above each filter the bar opens from the line, and the filter is there before the line passes behind it
    const run = col.kept - 19 - t0;
    /** @param {number} y */
    const at = (y) => t + (780 * (y - t0)) / run;
    d.fall.style.strokeDasharray = '1';
    rv.from(d.fall, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], t, 780, 'linear');
    filterRows.forEach((g, i) => {
      rv.from(flows[i], [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], at(col.y[i]) - 260, 420);
      rv.fade(arrives[i], at(col.y[i]) - 160, 320);
      rv.arrive(g, at(col.y[i]) - 240, 380);
    });
    rv.fade(d.head, t + 760, 200);
    rv.arrive(d.kept, t + 860);
    rv.fade(d.keptN, t + 940, 320);
    rv.fit();
  }

  set(first, false);
  // the switch ends where a row of two ends
  sw.style.right = `${f((1 - (2 * px) / vw) * 100)}%`;
  return {
    vw,
    set,
    play,
    current: () => /** @type {NonNullable<typeof cur>} */ (cur).id,
    destroy() {
      settle();
      pic.remove();
    },
  };
}
