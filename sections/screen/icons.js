/**
 * The Screen picture's filter icons and coins. Every icon is a view of BW by BH onto the same
 * paper, between four corner ticks: what the filter reads is in ink, the rest of the paper
 * around it is quiet. The paper, from its top: a venue line; a title of two lines; a line of
 * authors and year; its text; at its foot, a line of citations. A line of the title is THICK,
 * every other line THIN, both set IN from the icon's edge. The words every paper prints alike
 * ("Journal of", "cited by") and the numbers are type; any other word is a bar, as in the kit.
 */
import { f } from '../../kit/index.js';
import { widthOf, NUDGE, WORD } from './measure.js';

/** An icon's width. */
export const BW = 100;
/** An icon's height. */
export const BH = 64;
const TICK = 8; // the length of a corner tick
const THICK = 6;
const THIN = 4;
const IN = 10;
const WIDE = BW - 2 * IN; // a full line
const SPACE = 4.5; // between two words
const VENUE = [33, 12, 26]; // the lengths of the words of a paper's record
const AUTHORS = [20, 9];
const YEAR = 18;

/** @typedef {{ quiet: string, read: string, frame: string }} Icon Markup: the quiet paper, what is read, the ticks. */

/**
 * Returns one bar of text: from x, centred on height cy, w long and h thick.
 *
 * @param {number} x
 * @param {number} cy
 * @param {number} w
 * @param {number} h
 * @param {string} cls
 */
const bar = (x, cy, w, h, cls) =>
  `<rect class="${cls}" x="${f(x)}" y="${f(cy - h / 2)}" width="${f(w)}" height="${h}" rx="${f(Math.min(h / 2, 3))}"/>`;

/**
 * Adds a line of words h thick to an icon, from x at height cy.
 *
 * @param {Icon} o
 * @param {number} x
 * @param {number} cy
 * @param {(number | [number])[]} ws The words' lengths; a length given as [length] is a word
 *   that matches, drawn in ink on the marker.
 * @param {number} h
 */
function words(o, x, cy, ws, h) {
  let at = x;
  for (const w of ws) {
    const len = Array.isArray(w) ? w[0] : w;
    if (Array.isArray(w))
      o.read += `<rect class="mark" x="${f(at - 3)}" y="${f(cy - h / 2 - 3.5)}" width="${f(len + 6)}" height="${h + 7}"/>${bar(at, cy, len, h, 'sc-ink')}`;
    else o.quiet += bar(at, cy, len, h, 'sc-quiet');
    at += len + SPACE;
  }
}

/**
 * Adds the two lines of the title to an icon, the first at height cy.
 *
 * @param {Icon} o
 * @param {number} x
 * @param {number} cy
 * @param {boolean} [read] In ink.
 */
function title(o, x, cy, read) {
  const cls = read ? 'sc-ink' : 'sc-quiet';
  o[read ? 'read' : 'quiet'] += bar(x, cy, WIDE, THICK, cls) + bar(x, cy + 11, WIDE * 0.62, THICK, cls);
}

/**
 * Returns a figure of the paper, w by h with its top left corner at x, y: a block in ink with a
 * plot in white, its points rising.
 *
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 */
function figure(x, y, w, h) {
  const x0 = x + 6.5;
  const y0 = y + h - 6.5;
  let s = `<rect class="sc-ink" x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${h}" rx="2.5"/>`;
  s += `<path class="sc-plot" d="M${f(x0)},${f(y + 5.5)} V${f(y0)} H${f(x + w - 5.5)}"/>`;
  for (const [dx, dy] of [
    [6, 4],
    [11.5, 6.5],
    [16.5, 9.5],
    [21.5, 13],
  ])
    s += `<circle class="sc-pt" cx="${f(x0 + dx)}" cy="${f(y0 - dy)}" r="1.6"/>`;
  return s;
}

/**
 * What each filter's icon shows, by filter id.
 *
 * @type {Record<import('../../kit/example.js').FilterId, (o: Icon, x: number, y: number) => void>}
 */
const SHOWS = {
  /* the year, in the head of the paper: under the title, after the authors, before the text begins */
  year(o, x, y) {
    title(o, x, y + 11);
    words(o, x, y + 36.5, AUTHORS, THIN);
    o.read += `<text class="sc-fig" x="${f(x + WIDE)}" y="${f(y + 41.8)}" text-anchor="end">2019</text>`;
    o.quiet += bar(x, y + 50.5, WIDE, THIN, 'sc-quiet');
  },
  /* the citation count, at the foot of the paper: under the last lines of its text */
  citations(o, x, y) {
    for (let i = 0; i < 4; i++) o.quiet += bar(x, y + 10 + i * 7.5, WIDE * (i === 3 ? 0.55 : 1), THIN, 'sc-quiet');
    o.read += `<text x="${f(x - NUDGE['sc-word'])}" y="${f(y + 53.8)}"><tspan class="sc-word">cited by</tspan><tspan class="sc-fig" dx="6">48</tspan></text>`;
  },
  /* the venue: a journal's name, over the title */
  venue(o, x, y) {
    const w = widthOf('Journal of', WORD) + 5;
    o.read += `<text class="sc-word" x="${f(x - NUDGE['sc-word'])}" y="${f(y + 17)}">Journal of</text>${bar(x + w, y + 13.7, WIDE - w, THIN, 'sc-ink')}`;
    title(o, x, y + 28.5);
    words(o, x, y + 53, AUTHORS.concat(YEAR), THIN);
  },
  /* the words of title and abstract, a few of them matching */
  keywords(o, x, y) {
    words(o, x, y + 12, [23, [29], 19], THICK);
    words(o, x, y + 26.5, [23, 11, 18, [14.5]], THIN);
    words(o, x, y + 38.5, [12, 18, 26, 10.5], THIN);
    words(o, x, y + 50.5, [20, 9, [22]], THIN);
  },
  /* the title, between the venue and the authors */
  title(o, x, y) {
    words(o, x, y + 12.5, VENUE, THIN);
    title(o, x, y + 28.5, true);
    words(o, x, y + 53, AUTHORS.concat(YEAR), THIN);
  },
  /* the abstract, under the end of the title */
  abstract(o, x, y) {
    o.quiet += bar(x, y + 12, WIDE * 0.62, THICK, 'sc-quiet');
    for (let i = 0; i < 5; i++) o.read += bar(x, y + 24.5 + i * 7.5, WIDE * (i === 4 ? 0.55 : 1), THIN, 'sc-ink');
  },
  /* the whole paper: a page of its body in two columns, a section's heading and text beside a figure and the text under it */
  fulltext(o, x, y) {
    const col = (WIDE - 7) / 2;
    const x2 = x + col + 7;
    o.read += bar(x, y + 11, col * 0.45, THICK, 'sc-ink');
    for (let i = 0; i < 5; i++) o.read += bar(x, y + 22 + i * 7.5, col * (i === 4 ? 0.6 : 1), THIN, 'sc-ink');
    o.read += figure(x2, y + 8, col, 27.5);
    for (let i = 0; i < 2; i++) o.read += bar(x2, y + 44.5 + i * 7.5, col * (i ? 0.7 : 1), THIN, 'sc-ink');
  },
};

/**
 * Returns the four corner ticks of an icon with its top left corner at x, y.
 *
 * @param {number} x
 * @param {number} y
 */
function corners(x, y) {
  const e = 0.75; // the stroke's outer edge stands on the icon's box
  const t = TICK - e;
  const x1 = x + BW - e;
  const y1 = y + BH - e;
  const x0 = x + e;
  const y0 = y + e;
  return `<path class="sc-corner" d="M${x0},${y0 + t} V${y0} H${x0 + t} M${x1 - t},${y0} H${x1} V${y0 + t} M${x1},${y1 - t} V${y1} H${x1 - t} M${x0 + t},${y1} H${x0} V${y1 - t}"/>`;
}

/**
 * Returns the icon of a filter with its top left corner at x, y.
 *
 * @param {import('../../kit/example.js').FilterId} id
 * @param {number} x
 * @param {number} y
 * @returns {Icon}
 */
export function icon(id, x, y) {
  const o = { quiet: '', read: '', frame: corners(x, y) };
  SHOWS[id](o, x + IN, y);
  return o;
}

/* ---------- what one paper costs: a cost stands on a foot, centred on x, its parts from the foot up ---------- */

const CR = 13; // a coin: half its width
const CE = 5; // and its edge

/**
 * Returns a coin lying flat, seen from a little above, its upper face round (cx, y).
 *
 * @param {number} cx
 * @param {number} y
 * @param {boolean} ghost A coin that is not paid, in dotted outline.
 */
function coin(cx, y, ghost) {
  const ry = CR * 0.4;
  const cls = ghost ? 'sc-ghost' : 'sc-coin';
  return (
    `<path class="${cls}" d="M${f(cx - CR)},${f(y)} v${CE} a${CR},${f(ry)} 0 0 0 ${2 * CR},0 v${-CE}"/><ellipse class="${cls}" cx="${f(cx)}" cy="${f(y)}" rx="${CR}" ry="${f(ry)}"/>` +
    (ghost ? '' : `<ellipse class="sc-mint" cx="${f(cx)}" cy="${f(y)}" rx="${f(CR - 3.8)}" ry="${f(ry - 1.6)}"/>`)
  );
}

/**
 * Returns the coins one paper costs, stacked; where nothing is paid, one coin in dotted outline.
 *
 * @param {number} n How many coins.
 * @param {number} cx
 * @param {number} foot
 * @returns {string[]} Markup of each coin, from the foot up.
 */
export function coins(n, cx, foot) {
  const out = [];
  for (let i = 0; i < Math.max(n, 1); i++) out.push(coin(cx, foot - 0.6 - CR * 0.4 - CE * (i + 1), !n));
  return out;
}
