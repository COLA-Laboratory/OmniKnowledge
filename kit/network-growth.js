/**
 * A citation network that grows from its seed papers: drawn finished in a given SVG, then grown
 * once when it arrives, generation by generation. Each tree citation draws out from the paper
 * that found the next one and that paper appears at its end; the other citations follow once
 * both their papers are there. The layout is data (tools/growth-layout.mjs); this module only
 * draws and times it. Motion follows kit/motion.js: fades only under reduced motion, nothing in
 * still mode, and never longer than REVEAL_LIMIT.
 */
import { svg } from './dom.js';
import { onArrive, reveal, REVEAL_LIMIT } from './motion.js';

/**
 * @typedef {object} GrowthNode A paper, in the coordinates of the SVG's viewBox.
 * @property {number} x
 * @property {number} y
 * @property {number} [r] Its dot's radius; a seed is drawn at a fixed size instead.
 * @property {number} depth Its generation: 0 for a seed, 1 for a paper a seed found, and so on.
 * @property {number} lag Where in its generation it appears, from 0 (first) to 1 (last).
 * @property {true} [seed] On a seed paper.
 */
/**
 * @typedef {object} GrowthLayout
 * @property {GrowthNode[]} nodes
 * @property {[number, number, 0 | 1][]} edges Each citation as [paper, paper, tree]; a tree
 *   citation (1) goes from the paper that found the other one.
 */

/** The growth's timing before it is fitted into its duration, in ms. */
const START = 600;
const GENERATION = 900;
const LINE = 600;
const POP = 420;
const SEED_POP = 700;
const CROSS_AFTER = 150;
/** The span every generation shares when there are many of them. */
const GENERATIONS = 5000;
/** The seed's halo, ring and core radii. */
const SEED = { halo: 11.2, ring: 9, core: 5.6 };

/**
 * Times the growth: when each paper appears and when each citation draws.
 *
 * @param {GrowthLayout} layout
 * @returns {{ nodes: { at: number, length: number }[], edges: { from: number, to: number, at: number, length: number }[] }}
 *   Delays and lengths in ms, before fitting; a citation draws from paper `from` to paper `to`.
 */
export function schedule(layout) {
  const deepest = Math.max(1, ...layout.nodes.map((n) => n.depth));
  const gen = Math.min(GENERATION, GENERATIONS / deepest);
  const at = layout.nodes.map((n) => (n.seed ? 0 : START + (n.depth - 1) * gen + n.lag * gen * 0.7 + LINE));
  return {
    nodes: layout.nodes.map((n, i) => ({ at: at[i], length: n.seed ? SEED_POP : POP })),
    edges: layout.edges.map(([a, b, tree]) => {
      // a tree line starts once the paper it leaves has appeared, so it may draw faster than LINE
      if (tree) {
        const start = Math.max(at[b] - LINE, at[a]);
        return { from: a, to: b, at: start, length: at[b] - start };
      }
      const [from, to] = at[a] <= at[b] ? [a, b] : [b, a];
      return { from, to, at: at[to] + CROSS_AFTER, length: LINE };
    }),
  };
}

/**
 * Draws the network in root and grows it once when it arrives.
 *
 * @param {SVGSVGElement} root An SVG whose viewBox holds the layout.
 * @param {{ layout: GrowthLayout, duration?: number }} options duration: the most the growth may
 *   take, in ms (at most REVEAL_LIMIT); a longer timing is compressed in proportion.
 * @returns {{ destroy(): void }} Stops the growth and removes the drawing.
 */
export function growNetwork(root, { layout, duration = REVEAL_LIMIT }) {
  const { nodes } = layout;
  const time = schedule(layout);
  const lines = svg('g', {}, root);
  const papers = svg('g', {}, root);
  const edgeEls = time.edges.map(({ from, to }) =>
    svg('line', { x1: nodes[from].x, y1: nodes[from].y, x2: nodes[to].x, y2: nodes[to].y, class: 'edge', pathLength: 1 }, lines),
  );
  const nodeEls = nodes.map((n) => {
    const g = svg('g', {}, papers);
    if (n.seed) {
      svg('circle', { cx: n.x, cy: n.y, r: SEED.halo, class: 'halo' }, g);
      svg('circle', { cx: n.x, cy: n.y, r: SEED.ring, class: 'ring' }, g);
      svg('circle', { cx: n.x, cy: n.y, r: SEED.core, class: 'core' }, g);
    } else svg('circle', { cx: n.x, cy: n.y, r: n.r ?? 0, class: 'dot' }, g);
    g.style.transformBox = 'fill-box';
    g.style.transformOrigin = 'center';
    return g;
  });

  const rv = reveal({ fades: true });
  const stop = onArrive(root, () => {
    time.edges.forEach((e, i) => rv.stroke(edgeEls[i], e.at, e.length));
    time.nodes.forEach((n, i) =>
      rv.from(
        nodeEls[i],
        [
          { opacity: 0, transform: 'scale(.3)' },
          { opacity: 1, transform: 'scale(1)' },
        ],
        n.at,
        n.length,
      ),
    );
    rv.fit(Math.min(duration, REVEAL_LIMIT));
  });

  return {
    destroy() {
      stop();
      rv.cancel();
      lines.remove();
      papers.remove();
    },
  };
}
