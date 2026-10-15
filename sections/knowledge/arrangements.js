/**
 * The Knowledge picture's two arrangements, as data: the wide one, and a stacked one for a narrow
 * column. Read by the picture and by tools/layouts.mjs, which packs the semantic map for each.
 */

/** The room between a topic's ground and its outermost paper. */
export const PAD = 8;

/**
 * @typedef {{ x: number, y: number, w: number, h: number }} Box
 * @typedef {object} Arrangement
 * @property {number} W The picture's width.
 * @property {number} H Its height.
 * @property {number} S The citation network's scale.
 * @property {number} rk A paper's radius, relative to the network's scale.
 * @property {number} rmin The smallest radius of a paper.
 * @property {number} gap In the semantic map, the room between two papers.
 * @property {number} over How far the grounds of one topic's sub-topics overlap.
 * @property {number} apart The room between topics.
 * @property {number} semTop The room kept above the grounds for a topic's name.
 * @property {boolean} flip The semantic map is turned a quarter, to stand tall.
 * @property {boolean} [tall] One task card at a time, chosen by the words under the picture.
 * @property {Box} map The box the map stands in.
 * @property {{ cx: number, cy: number }[]} at The middle of each topic's ground in the network.
 * @property {[number, number, string][]} [lobes] For each sub-topic, where its ground stands and
 *   on which side its name; without it both follow from the semantic map's own places.
 * @property {{ x: number, y: number }[]} [lab] Where a topic's name stands in the network, on two
 *   lines, when not above its ground.
 * @property {Box[]} cards The task cards.
 */

/** @type {Arrangement} */
export const WIDE = {
  W: 1278,
  H: 688,
  S: 0.78,
  rk: 1,
  rmin: 2.3,
  gap: 11,
  over: 12,
  apart: 34,
  semTop: 22,
  flip: false,
  map: { x: 32, y: 24, w: 1214, h: 350 },
  at: [
    { cx: 270, cy: 219 },
    { cx: 558, cy: 171 },
    { cx: 841, cy: 170 },
    { cx: 1066, cy: 266 },
  ],
  lobes: [
    [208, 190, 'w'],
    [293, 255, 's'],
    [370, 216, 'e'],
    [693, 125, 'w'],
    [803, 135, 's'],
    [1080, 212, 'e'],
    [1003, 262, 'nw'],
    [918, 300, 'w'],
    [538, 300, 'w'],
    [613, 258, 'e'],
  ],
  cards: [0, 1, 2, 3].map((k) => ({ x: 32 + k * 308, y: 424, w: 290, h: 232 })),
};

/** @type {Arrangement} */
export const TALL = {
  W: 350,
  H: 730,
  S: 0.34,
  rk: 1.2,
  rmin: 1.8,
  gap: 7,
  over: 8,
  apart: 16,
  semTop: 30,
  flip: true,
  tall: true,
  map: { x: 10, y: 24, w: 330, h: 440 },
  at: [
    { cx: 100, cy: 110 },
    { cx: 247, cy: 211 },
    { cx: 100, cy: 316 },
    { cx: 247, cy: 400 },
  ],
  lab: [
    { x: 190, y: 44 },
    { x: 14, y: 210 },
    { x: 190, y: 325 },
    { x: 14, y: 425 },
  ],
  cards: [0, 1, 2, 3].map(() => ({ x: 10, y: 480, w: 330, h: 232 })),
};

/** Both arrangements, by the key the semantic map's data uses. */
export const ARRANGEMENTS = { wide: WIDE, tall: TALL };
