/**
 * Where everything of the Screen picture stands, in its two arrangements, and the measures they
 * share: a filter's icon, cost, name, setting, node, count and counted papers.
 */
import { EXAMPLE } from '../../kit/index.js';
import { BW, BH } from './icons.js';
import { LAB, widthOf, wrap } from './measure.js';

export const N = EXAMPLE.filters.length;
export const WIDE = 1280; // the wide picture's width
/**
 * What one paper costs where an LLM reads it, by filter id (illustrative); a rule's check costs none.
 *
 * @type {Partial<Record<import('../../kit/example.js').FilterId, number>>}
 */
export const COINS = { title: 1, abstract: 3, fulltext: 6 };
export const SAID = { rule: 'Checked by rule', model: 'Screened by LLM' };
export const UNIT = 200; // papers to one icon
export const IW = 13; // a counted paper's width
export const IH = 17; // and height
export const K = 0.85; // the scale a counted paper is drawn at, from a size up, so its lines keep their proportion
export const ROW = 21; // the step from one row of counted papers to the next
export const SET_LH = 18; // the step between the lines of a filter's setting

/** @param {import('../../kit/example.js').Filter} F */
export const said = (F) => (F.model ? SAID.model : SAID.rule);

/**
 * @typedef {{ x: number, y: number, mid?: boolean }} At
 * @typedef {object} Column One filter's place.
 * @property {number} n How many counted papers reach it.
 * @property {number} pass How many pass.
 * @property {string[]} lines Its setting, on one line or two.
 * @property {At} box Its icon's top left corner.
 * @property {{ x: number, foot: number }} cost
 * @property {{ x: number, y: number, r: number }} node
 * @property {At} name
 * @property {At} set The first baseline of its setting.
 * @property {At} count
 * @property {{ x: number, y: number, per: number, dx: number, mid?: boolean, scale?: number }} pile
 * @property {number} bottom
 * @typedef {object} Plan
 * @property {number} W
 * @property {number} H
 * @property {Column[]} cols
 * @property {{ k: number, says: string, at: At, rule: [number, number, number] }[]} groups The filters of one kind: their words and a hairline as far as they reach.
 * @property {{ x: number, y: number } | null} dot Where the line starts, when it starts in a dot.
 * @property {{ x: number, y: number }} [start] Where it starts otherwise.
 * @property {{ x: number, y: number }} intro The count of candidates.
 */

/**
 * Returns the plan for a wide frame (the filters side by side on a level line, in a box 1280
 * wide) or a narrow one (stack: under one another on a line that runs down, in a box 326 wide).
 *
 * @param {boolean} stack
 * @returns {Plan}
 */
export function plan(stack) {
  const W = stack ? 326 : WIDE;
  /** @type {Column[]} */
  const cols = [];
  /** @type {Plan['groups']} */
  const groups = [];
  const reach = [EXAMPLE.deduped].concat(EXAMPLE.filters.map((F) => F.pass));
  const M = 40; // the wide frame's margin
  const BLOCK = 8 * IW + 7 * 4; // a block of counted papers
  const a0 = M + BLOCK / 2; // the first node
  const step = (W - M - BLOCK / 2 - a0) / (N - 1); // node to node
  /** @param {number} k */
  const col = (k) => ({
    n: Math.round(reach[k] / UNIT),
    pass: Math.round(reach[k + 1] / UNIT),
    lines: stack ? [EXAMPLE.filters[k].setting] : wrap(EXAMPLE.filters[k].setting, step - 24),
  });
  /** @param {number} k Opens a group at filter k when its kind differs from the filter before it. */
  const opens = (k) => !k || EXAMPLE.filters[k].model !== EXAMPLE.filters[k - 1].model;
  if (stack) {
    const LX = 7.5;
    const X = 28;
    let y = 44;
    for (let k = 0; k < N; k++) {
      const c = col(k);
      if (opens(k)) {
        const says = said(EXAMPLE.filters[k]);
        groups.push({ k, says, at: { x: X, y: y + 10 }, rule: [X + widthOf(says, LAB) + 12, W, y + 5.5] });
        y += 32;
      }
      const box = { x: X, y: y + 54 };
      // the inspected record and its remaining papers side by side; only the paper marks shrink
      const count = { x: 170, y: box.y + 14 };
      const pile = { x: 170, y: count.y + 14, per: 16, dx: (IW + 4) * 0.52, scale: 0.52 };
      if (k === N - 1) {
        count.y += 18;
        pile.y += 24;
      }
      const bottom = Math.max(box.y + BH, pile.y + Math.ceil(c.n / pile.per) * ROW * pile.scale);
      cols.push({
        ...c,
        node: { x: LX, y: y + 9, r: 5.5 },
        name: { x: X, y: y + 16 },
        set: { x: X, y: y + 36 },
        box,
        cost: { x: X + BW + 16, foot: box.y + BH },
        count,
        pile,
        bottom,
      });
      y = bottom + 26;
    }
    return { W, H: y - 26 + 12, cols, groups, dot: { x: LX, y: 15 }, intro: { x: X, y: 19.5 } };
  }
  const HEAD = 50;
  const FOOT = 112;
  const TOP = 126;
  const NAME = TOP + BH + 31;
  const LY = NAME + 22 + SET_LH + 48.5;
  for (let k = 0; k < N; k++) {
    const c = col(k);
    const ax = Math.round(a0 + k * step);
    const pile = { x: ax - BLOCK / 2, y: LY + 62, per: 8, dx: IW + 4, mid: c.n < 8 }; // papers short of a full row stand in the middle, under the node
    cols.push({
      ...c,
      box: { x: ax - BW / 2, y: TOP },
      cost: { x: ax, foot: FOOT },
      name: { x: ax, y: NAME, mid: true },
      set: { x: ax, y: NAME + 22, mid: true },
      node: { x: ax, y: LY, r: 5.5 },
      count: { x: ax, y: LY + 46, mid: true },
      pile,
      bottom: pile.y + Math.ceil(c.n / pile.per) * ROW - 4,
    });
  }
  cols.forEach((c, k) => {
    if (!opens(k)) return;
    const says = said(EXAMPLE.filters[k]);
    let last = k;
    while (last < N - 1 && !opens(last + 1)) last++;
    groups.push({
      k,
      says,
      at: { x: c.pile.x, y: HEAD },
      rule: [c.pile.x + widthOf(says, LAB) + 12, cols[last].pile.x + BLOCK, HEAD - 4.5],
    });
  });
  return { W, H: cols[0].bottom + M, cols, groups, dot: null, start: { x: M, y: LY }, intro: { x: M, y: LY - 15 } };
}
