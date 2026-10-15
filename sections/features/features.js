/**
 * The four qualities under the first picture. index.html holds each item (its link, name and
 * text) and an empty drawing named by data-drawing; this module draws them. Every drawing is
 * made of the kit's objects, stands in one box of 232 by 96 with its foot on y = 94, and is
 * returned as its parts in the order a reader takes them in, which is the order they reveal in.
 */
import { EXAMPLE, f, markup, onArrive, paper, reveal, sheetGeo, sheetBase, tile, token, words } from '../../kit/index.js';

const FOOT = 94;

/* ---------- marks shared by several drawings ---------- */

/**
 * Returns a check box centred on (cx, cy), ticked or crossed.
 *
 * @param {number} cx
 * @param {number} cy
 * @param {'on' | 'no'} state
 */
function box(cx, cy, state) {
  const s = 11;
  const x = cx - s / 2;
  const y = cy - s / 2;
  const k = s / 9;
  let m = `<rect class="box on" x="${f(x)}" y="${f(y)}" width="${s}" height="${s}" rx="${f(2.2 * k)}"/>`;
  if (state === 'on')
    m += `<path class="tick" d="M${f(x + 2.1 * k)},${f(cy + 0.2 * k)} l${f(1.9 * k)},${f(1.9 * k)} l${f(3 * k)},${f(-3.9 * k)}"/>`;
  else
    m += `<path class="tick" d="M${f(cx - 2.2 * k)},${f(cy - 2.2 * k)} l${f(4.4 * k)},${f(4.4 * k)} M${f(cx + 2.2 * k)},${f(cy - 2.2 * k)} l${f(-4.4 * k)},${f(4.4 * k)}"/>`;
  return m;
}

/**
 * Returns a word on the yellow marker: an ink bar from x, w long, its middle on y.
 *
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 */
function marked(x, y, w, h) {
  return `<rect class="mark" x="${f(x - 3)}" y="${f(y - h / 2 - 3.5)}" width="${f(w + 6)}" height="${f(h + 7)}"/><rect x="${f(x)}" y="${f(y - h / 2)}" width="${f(w)}" height="${h}" rx="${f(h / 2)}" fill="${token('ink')}"/>`;
}

/* ---------- the drawings ---------- */

/** The same papers after one, two and three ways of searching: the gaps close. */
function comprehensive() {
  const T = 16;
  const X0 = 74;
  const DX = 25;
  const FOUND = [
    [0, 1, 3, 5],
    [0, 1, 2, 3, 5, 6],
    [0, 1, 2, 3, 4, 5, 6],
  ];
  return [14, 48.5, 83].map((y, r) => {
    let s = '';
    for (let k = 0; k <= r; k++) s += tile(k * 19, y - T / 2, T, EXAMPLE.searches[k].key);
    for (let k = 0; k < 7; k++)
      s += FOUND[r].includes(k)
        ? paper(X0 + k * DX, y, 15, 20, { kept: true })
        : `<rect class="ft-gone" x="${f(X0 + k * DX - 7.5)}" y="${y - 10}" width="15" height="20" rx="2"/>`;
    return s;
  });
}

/** The same criteria down the side, every paper across the top; one paper fails the second. */
function rigorous() {
  const cols = [86, 118, 150, 182, 214];
  const w = [52, 38, 46];
  const FAIL = 3;
  const papers = cols.map((x, c) => paper(x, 23, 20, 26, c === FAIL ? { pale: true } : { kept: true })).join('');
  return [papers].concat(
    [56, 72, 88].map(
      (y, i) =>
        words(0, y, w[i], 31 + i * 8, 0) +
        cols.map((x, c) => (c === FAIL && i > 1 ? '' : box(x, y, c === FAIL && i === 1 ? 'no' : 'on'))).join(''),
    ),
  );
}

const THICK = 5.6; // a coin's edge

/**
 * Returns a coin lying flat, seen from a little above: its upper face is an ellipse round (cx, y), rx wide.
 *
 * @param {number} cx
 * @param {number} y
 * @param {number} rx
 */
function coin(cx, y, rx) {
  const ry = rx * 0.4;
  return (
    `<path class="ft-coin" d="M${f(cx - rx)},${f(y)} v${THICK} a${rx},${f(ry)} 0 0 0 ${2 * rx},0 v${-THICK}"/><ellipse class="ft-coin" cx="${f(cx)}" cy="${f(y)}" rx="${rx}" ry="${f(ry)}"/>` +
    `<ellipse class="ft-mint" cx="${f(cx)}" cy="${f(y)}" rx="${f(rx - 4.6)}" ry="${f(ry - 1.9)}"/>`
  );
}

/**
 * Returns a pile of n kept papers, each standing behind the one before: the front paper is w
 * wide with its left edge on x and its foot on y = foot; every next one is dx to the right.
 *
 * @param {number} x
 * @param {number} foot
 * @param {number} n
 * @param {number} w
 * @param {number} dx
 */
function pile(x, foot, n, w, dx) {
  const h = Math.round(w * 1.3);
  let s = '';
  for (let i = n - 1; i >= 0; i--) s += paper(x + w / 2 + i * dx, foot - h / 2, w, h, { kept: true });
  return s;
}

/** A balance: the pile of papers on one end outweighs the coin it cost on the other. */
function costEffective() {
  const CX = 116;
  const CY = 62;
  const beam = `<path class="lead" d="M14,${CY} H218"/>${pile(18, CY - 1.5, 7, 30, 8)}${coin(196, CY - 1.5 - 6.8 - THICK, 17)}`;
  const prop = `<path class="ft-prop" d="M${CX},${CY + 2} L${CX + 15},${FOOT} H${CX - 15} Z"/>`;
  return [prop, `<g transform="rotate(-9 ${CX} ${CY})">${beam}</g>`];
}

/**
 * Returns an evidence line along d that ends in a dot at (x, y).
 *
 * @param {string} d
 * @param {number} x
 * @param {number} y
 */
const wire = (d, x, y) => `<path class="wire" d="${d}"/><circle class="port" cx="${f(x)}" cy="${f(y)}" r="2.7"/>`;

/**
 * One paper between its past and its record. Behind it, the trail back to the seed it was found
 * from; before it, the decisions made on it, each tied to its line.
 */
function trustworthy() {
  const g = sheetGeo(106, 12, 58, 82);
  const t = g.title[0];
  const a = g.abs[2];
  const ty = t.y + t.h / 2;
  const ay = a.y + a.h / 2;
  const SEED = 8.5; // where the seed stands
  const FROM = 60; // where the paper this one was found from stands
  /** @param {number} x The height of the line of sight at x: it leaves the sheet at y = 70 and rises to the left. */
  const sight = (x) => f(70 - (g.x - x) * 0.12);
  /** @param {number} x0 @param {number} x1 @param {number} size One hop of the trail, with the tile of the search that made it in the middle. */
  const hop = (x0, x1, size) => {
    const x = (x0 + x1) / 2;
    return `<path class="edge ft-hop" d="M${x0},${sight(x0)} L${x1},${sight(x1)}"/>${tile(f(x - size / 2), f(sight(x) - size / 2), size, 'back')}`;
  };
  const sheet = sheetBase(g) + marked(t.x + 18, ty, t.w - 18, t.h) + marked(a.x, ay, a.w * 0.62, a.h);
  const near = hop(FROM + 12.5, g.x, 15) + paper(FROM, sight(FROM), 25, 32, {});
  const far = hop(SEED + 7.5, FROM - 12.5, 12) + paper(SEED, sight(SEED), 15, 19, { seed: true });
  /** @param {number} y @param {'on' | 'no'} state @param {number} seed @param {[number, number]} to */
  const verdict = (y, state, seed, to) =>
    box(182, y, state) +
    words(194, y, 38, seed, 2) +
    wire(`M175,${y} C169,${y} 172,${f(to[1])} ${f(to[0])},${f(to[1])}`, to[0], to[1]);
  return [sheet, near, far, verdict(26, 'on', 7, [t.x + t.w + 5.5, ty]), verdict(70, 'no', 15, [a.x + a.w * 0.62 + 5.5, ay])];
}

/** @type {Record<string, () => string[]>} */
const DRAWINGS = { comprehensive, rigorous, 'cost-effective': costEffective, trustworthy };

/**
 * Draws the four drawings and reveals each in reading order when the row arrives.
 *
 * @param {HTMLElement} root
 */
export function mount(root) {
  const rv = reveal();
  const pics = [...root.querySelectorAll('svg[data-drawing]')];
  for (const svg of pics) {
    const draw = DRAWINGS[/** @type {SVGElement} */ (svg).dataset.drawing ?? ''];
    if (!draw) throw new Error(`features: no drawing "${/** @type {SVGElement} */ (svg).dataset.drawing}"`);
    svg.replaceChildren();
    for (const part of draw()) markup(svg, part);
  }
  const stop = onArrive(/** @type {Element} */ (root.querySelector('.ft-row')), () => {
    pics.forEach((p, i) => [...p.children].forEach((g, k) => rv.fade(g, i * 140 + k * 170, 420)));
    rv.fit();
  });
  return {
    destroy() {
      stop();
      rv.cancel();
    },
  };
}
