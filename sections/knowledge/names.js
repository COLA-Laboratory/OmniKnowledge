/**
 * Where the Knowledge picture's names stand: a topic's name, at its place in the network and in
 * the semantic map, and each sub-topic's name in the semantic map, each clear of the grounds and
 * of the names placed before it.
 */
import { f, svg, topics } from '../../kit/index.js';

/**
 * @typedef {{ x: number, y: number }} Point
 * @typedef {{ x: number, y: number, w: number, h: number }} Box
 * @typedef {{ x: number, y: number, r: number }} Ground
 */

/**
 * Draws the names and returns where they stand.
 *
 * @param {import('./arrangements.js').Arrangement} G
 * @param {{ cx: number, cy: number, r: number }[]} at The middle and radius of each topic's ground in the network.
 * @param {{ t: number, name: string, g: Ground, side?: string }[]} lobes The sub-topics of the semantic map.
 * @param {SVGElement} gLab The layer of the topics' names.
 * @param {SVGElement} gSub The layer of the sub-topics' names.
 * @returns {{ topicLabs: { g: SVGElement, n: Point, s: Point }[], named: Box[], taken: Box[] }}
 *   Each topic's name with its place in the network (n) and the semantic map (s); the room the
 *   names take in the network (named) and in the semantic map (taken).
 */
export function names(G, at, lobes, gLab, gSub) {
  const M = G.map;
  /** @type {Box[]} */
  const taken = []; // the room names take in the semantic map
  /** @type {Box[]} */
  const named = []; // and in the network
  /** @param {Box} b @param {{ x: number, y: number, r: number }} c */
  const hitsGround = (b, c) =>
    Math.hypot(Math.max(b.x, Math.min(c.x, b.x + b.w)) - c.x, Math.max(b.y, Math.min(c.y, b.y + b.h)) - c.y) < c.r + 3;
  /** @param {Box} b */
  const clear = (b) =>
    b.x >= 16 &&
    b.x + b.w <= G.W - 16 &&
    b.y >= M.y - 24 &&
    b.y + b.h <= M.y + M.h + 30 &&
    !lobes.some((o) => hitsGround(b, o.g)) &&
    !taken.some((t) => b.x < t.x + t.w && t.x < b.x + b.w && b.y < t.y + t.h && t.y < b.y + b.h);
  /**
   * Finds a name its place beside one of the grounds given, trying the sides in order.
   *
   * @param {{ x: number, y: number, r: number }[]} grounds
   * @param {number} w
   * @param {number} h
   * @param {string} sides
   * @returns {Point} The left end of its baseline.
   */
  function beside(grounds, w, h, sides) {
    /** @type {(Point & { box: Box }) | null} */
    let firstAt = null;
    /** @type {(Point & { box: Box }) | null} */
    let found = null;
    for (const c of grounds) {
      for (const side of sides.split(' ')) {
        const k = c.r * 0.72;
        const p =
          side === 'n'
            ? { x: c.x - w / 2, y: c.y - c.r - 7 - (h - 15) }
            : side === 's'
              ? { x: c.x - w / 2, y: c.y + c.r + 16 }
              : side === 'e'
                ? { x: c.x + c.r + 8, y: c.y + 4.5 }
                : side === 'w'
                  ? { x: c.x - c.r - 8 - w, y: c.y + 4.5 }
                  : side === 'ne'
                    ? { x: c.x + k + 5, y: c.y - k - 3 - (h - 15) }
                    : side === 'nw'
                      ? { x: c.x - k - 5 - w, y: c.y - k - 3 - (h - 15) }
                      : side === 'se'
                        ? { x: c.x + k + 5, y: c.y + k + 12 }
                        : { x: c.x - k - 5 - w, y: c.y + k + 12 };
        const spot = { ...p, box: { x: p.x - 4, y: p.y - 12, w: w + 8, h: h - 1 } };
        firstAt = firstAt || spot;
        if (!found && clear(spot.box)) found = spot;
      }
    }
    const chosen = /** @type {Point & { box: Box }} */ (found || firstAt);
    taken.push(chosen.box);
    return chosen;
  }
  const topicLabs = topics.map((T, t) => {
    const g = svg('g', {}, gLab);
    const tx = /** @type {SVGTextElement} */ (svg('text', { class: 'topic' }, g));
    const parts = T.name.split(' ');
    const cut = G.tall ? Math.ceil(parts.length / 2) : parts.length;
    svg('tspan', { x: 0 }, tx, parts.slice(0, cut).join(' '));
    if (cut < parts.length) svg('tspan', { x: 0, dy: 17 }, tx, parts.slice(cut).join(' '));
    svg('tspan', { class: 'c', dx: 7 }, tx, String(T.n));
    const w = tx.getBBox().width;
    const A = at[t];
    const own = lobes
      .filter((o) => o.t === t)
      .map((o) => o.g)
      .sort((p, q) => p.y - p.r - (q.y - q.r));
    const n = G.lab ? G.lab[t] : { x: A.cx - w / 2, y: A.cy - A.r - 7 };
    named.push({ x: n.x - 4, y: n.y - 12, w: w + 8, h: G.tall ? 31 : 14 });
    return { g, n, s: beside(own, w, G.tall ? 32 : 15, 'n nw ne w e') };
  });
  // a sub-topic's name stands on the side of its ground that faces away from the rest of its
  // topic; in the tall arrangement sub-topics go unnamed
  if (!G.tall)
    for (const o of lobes) {
      const own = lobes.filter((q) => q.t === o.t);
      let mx = 0;
      let my = 0;
      for (const q of own) {
        mx += q.g.x / own.length;
        my += q.g.y / own.length;
      }
      const h = o.g.x >= mx ? 'e' : 'w';
      const h2 = h === 'e' ? 'w' : 'e';
      const up = o.g.y < my;
      const order = up ? ['n', h, `n${h}`, h2, `n${h2}`, `s${h}`, 's'] : [h, h2, `s${h}`, `s${h2}`, `n${h}`, 's', 'n'];
      const tx = /** @type {SVGTextElement} */ (svg('text', { class: 'note ka-sub' }, gSub, o.name));
      const p = beside([o.g], tx.getComputedTextLength(), 15, o.side || order.join(' '));
      tx.setAttribute('x', String(f(p.x)));
      tx.setAttribute('y', String(f(p.y)));
    }
  return { topicLabs, named, taken };
}
