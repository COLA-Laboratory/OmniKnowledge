/**
 * The Build picture's measures and the parts that hold no state: where a preset's rows and cards
 * stand, a step card's markup, the picture's description, and the widths its text needs.
 */
import { fmt, paper, svg, tile } from '../../kit/index.js';
import { FOUND, KINDS, LIBRARY, PRESETS, RECORD, kindOf } from './record.js';

export const R = 16; // the line's one corner radius
/**
 * The pale bar across the line above a filter: its thickness, the room between two filter cards
 * in whose middle it lies, and its length, which is head for no papers and grows evenly to most
 * for MOST, so that the smallest count is still a bar and equal differences are equal lengths.
 */
export const FLOW = { h: 10, gap: 20, head: 12, most: 130 };
export const END = 42.5; // from the last filter card down to the middle of the kept paper
/** The pale field of a filter: its text's inset, the height of a field of one line, line to line. */
export const FIELD = { pad: 8, h: 22, lead: 15 };

/**
 * The two arrangements. ch: a step card's height; pad, gap: inside a ground; top: the first
 * card's top. Wide: cross: the line's run under the pipeline's foot; air: the clear room on each
 * side of the line's rise between the columns; first: the first filter card's top under top.
 * Narrow: vw: the picture's width; cw: a step card's width; step: row to row; beads: the found
 * paper and the merged duplicates on the line, under the pipeline's foot; first: the first
 * filter card's top under the foot.
 */
export const WIDE = {
  narrow: false,
  vw: 0,
  cw: 0,
  ch: 80,
  pad: 9,
  gap: 9,
  top: 40,
  cross: 62.5,
  air: 18.5,
  first: 38,
  step: 0,
  beads: [0, 0],
};
export const NARROW = {
  narrow: true,
  vw: 325,
  cw: 150,
  ch: 72,
  pad: 5,
  gap: 7,
  top: 48,
  cross: 0,
  air: 0,
  step: 16,
  beads: [26, 66],
  first: 122,
};

/** The most papers that reach the filters in any preset: the longest bar, so one length means one count in every preset. */
export const MOST = Math.max(...PRESETS.map((P) => RECORD[P.id].found - RECORD[P.id].merged));
/** The most filters a preset has: the bars and counts the column needs. */
export const PLACES = Math.max(...PRESETS.map((P) => RECORD[P.id].filters.length));

/** @typedef {import('./record.js').LibraryFilter} LibraryFilter */
/** @typedef {import('./record.js').RunRecord} RunRecord */
/** @typedef {import('./record.js').PresetId} PresetId */

/**
 * Returns what the user set in a filter, as the lines its field shows.
 *
 * @param {LibraryFilter} x
 * @returns {string[]}
 */
export const lines = (x) => x.prompt ?? [x.setting ?? x.query ?? ''];

/**
 * Returns a filter card's height: one row when the field stands beside the name (a rule);
 * otherwise the name, and under it the field with its lines.
 *
 * @param {LibraryFilter} x
 */
export const tall = (x) => (x.setting ? 40 : 40 + FIELD.h + (lines(x).length - 1) * FIELD.lead);

/**
 * Returns where the rows, cards and line pieces of a preset stand.
 *
 * @param {(typeof PRESETS)[number]} P
 * @param {typeof WIDE} G
 * @param {number} cw A step card's width.
 * @param {number} px The line through the pipeline.
 * @param {number} span Wide: the height the rows are spread over.
 */
export function arrange(P, G, cw, px, span) {
  const hs = P.rows.map((r) => G.ch + (r.length > 1 ? 2 * G.pad : 0));
  const sum = hs.reduce((a, b) => a + b, 0);
  const step = G.narrow ? G.step : (span - sum) / (hs.length - 1);
  let y = G.top;
  let prev = 0;
  /** @type {{ rows: { x: number, y: number, w: number, h: number, group: boolean }[], at: Record<string, { x: number, y: number }>, stubs: { y1: number, y2: number }[], bottom: number }} */
  const out = { rows: [], at: {}, stubs: [], bottom: 0 };
  P.rows.forEach((ids, i) => {
    const n = ids.length;
    const inset = n > 1 ? G.pad : 0;
    const w = n * cw + (n - 1) * G.gap + 2 * inset;
    const x = px - w / 2;
    const yy = Math.round(y);
    out.rows.push({ x, y: yy, w, h: hs[i], group: n > 1 });
    ids.forEach((id, k) => (out.at[id] = { x: x + inset + k * (cw + G.gap), y: yy + inset }));
    if (i) out.stubs.push({ y1: prev, y2: yy });
    prev = yy + hs[i];
    y += hs[i] + step;
  });
  out.bottom = prev;
  return out;
}

/**
 * Returns a step card's markup, drawn from its own top left corner. Wide: the icon and the name
 * on the first line; on the second, what the step does at the left and the papers it found at
 * the right. Narrow: the name on two lines beside the icon, the papers it found under them at
 * the right. Step names and filter names share one size (ba-name).
 *
 * @param {string} id
 * @param {typeof WIDE} G
 * @param {number} cw
 */
export function card(id, G, cw) {
  const kind = kindOf(id);
  const K = KINDS[kind];
  const seed = kind === 'seed';
  const mini = G.narrow;
  const inset = mini ? 10 : 13;
  const y2 = mini ? G.ch - 12.5 : 64.5;
  let s = `<rect class="card" x=".5" y=".5" width="${cw - 1}" height="${G.ch - 1}" rx="12.5"/>`;
  if (seed)
    for (let i = 0; i < 3; i++)
      s += mini ? paper(17.5 + i * 19, 23, 15, 20, { seed: true }) : paper(21 + i * 20.5, 28, 16, 21, { seed: true });
  else s += mini ? tile(10, 10, 26, kind) : tile(13, 13, 30, kind);
  if (FOUND[id]) s += `<text class="cnt" x="${cw - inset}" y="${y2}" text-anchor="end">${fmt(FOUND[id])}</text>`;
  if (!mini)
    return `${s}<text class="ba-name" x="${seed ? 81 : 54}" y="34">${K.name.join(' ')}</text><text class="note" x="13" y="${y2}">${K.does}</text>`;
  if (seed) return `${s}<text class="ba-name" x="9.5" y="${y2}">${K.name.join(' ')}</text>`;
  return s + K.name.map((l, k) => `<text class="ba-name" x="45" y="${23 + k * 18}">${l}</text>`).join('');
}

/**
 * Returns the picture's description for one preset: the steps row by row with what each found,
 * then the filters with what each passes on.
 *
 * @param {(typeof PRESETS)[number]} P
 */
export function describe(P) {
  const rec = RECORD[P.id];
  let steps = 0;
  const rows = P.rows.map((ids) => {
    steps += ids.length;
    return ids
      .map((id) => KINDS[kindOf(id)].name.join(' ') + (FOUND[id] ? ` (found ${fmt(FOUND[id])} papers)` : ''))
      .join(' beside ');
  });
  const filters = rec.filters.map((id, i) => {
    const x = LIBRARY[id];
    return `${x.name}, ${x.prompt ? `an LLM asked “${x.prompt.join(' ')}”` : x.query ? `matching ${x.query}` : x.setting}, ${fmt(rec.pass[i])} go on`;
  });
  return `A search pipeline of ${steps} steps and the record of its run. From top to bottom: ${rows.join('; then ')}. Together the searches found ${fmt(rec.found)} papers; ${fmt(rec.merged)} duplicates were merged, so ${fmt(rec.found - rec.merged)} papers reached the filters. The line passes through ${rec.filters.length} filters in order, each shown with what was set and the papers it passes on, as a count and a bar that shortens down the column: ${filters.join('; ')}. ${fmt(rec.pass[rec.pass.length - 1])} papers were kept.`;
}

/**
 * Measures an arrangement: wide, step cards and filter cards share the width the widest of them
 * needs; narrow, a filter card takes what the widest filter needs. A card's width is odd, so that
 * the line through its middle is sharp.
 *
 * @param {SVGElement} pic A picture in the page, to measure text in.
 * @param {boolean} narrow
 */
export function measure(pic, narrow) {
  const G = narrow ? NARROW : WIDE;
  const probe = /** @type {SVGTextElement} */ (svg('text', { x: 0, y: -200, visibility: 'hidden' }, pic));
  const width = Object.assign(
    (/** @type {string} */ str, /** @type {string} */ cls) => {
      probe.setAttribute('class', cls);
      probe.textContent = str;
      return probe.getComputedTextLength();
    },
    { done: () => probe.remove() },
  );

  /** @type {Record<string, { lines: string[], w: number }>} */
  const fields = {};
  let need = 0;
  /** @param {number} w */
  const odd = (w) => {
    const c = Math.ceil(w);
    return c + 1 - (c % 2);
  };
  // a filter's field: its lines (a prompt stands in quotation marks; the opening one hangs in the field's inset) and the width its text needs
  for (const [id, x] of Object.entries(LIBRARY)) {
    const ls = lines(x).map((l, i, all) => l + (x.prompt && i === all.length - 1 ? '”' : ''));
    const w = Math.ceil(Math.max(...ls.map((l) => width(l, 'ba-set')))) + 2 * FIELD.pad;
    fields[id] = { lines: ls, w };
    need = Math.max(need, 26 + w + (x.setting ? width(x.name, 'ba-name') + 12 : 0));
  }
  // a step card holds its icon and name, and under them what it does, a clear gap and its count
  if (!narrow)
    for (const [k, K] of Object.entries(KINDS))
      need = Math.max(
        need,
        (k === 'seed' ? 94 : 67) + width(K.name.join(' '), 'ba-name'),
        38 + width(K.does, 'note') + width('0,000', 'cnt'),
      );
  const fw = odd(need); // a filter card's width
  const cw = narrow ? G.cw : fw; // a step card's width
  const px = narrow ? G.vw / 2 : cw + G.gap / 2 + G.pad; // the line through the pipeline: the middle of a row of two
  const gx = 2 * px + G.air; // wide: the line's rise between the columns
  const c = G.cross;
  const fl = narrow ? px - fw / 2 : gx + G.air; // the filter cards' left edge
  const fx = fl + fw / 2; // the line through them
  const t0 = narrow ? G.first : G.top + G.first; // the first filter card's top
  const arch = G.top + 1.5; // wide: the line's turn over to the filters
  const vw = narrow ? G.vw : fl + fw;

  return { fields, fw, cw, px, gx, c, fl, fx, t0, arch, vw, width };
}

/**
 * Returns the wide arrangement's width, measured in the stage.
 *
 * @param {HTMLElement} stage
 */
export function wideWidth(stage) {
  const pic = svg('svg', { class: 'ba-svg' }, stage);
  const { vw, width } = measure(pic, false);
  width.done();
  pic.remove();
  return vw;
}
