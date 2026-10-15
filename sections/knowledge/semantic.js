/**
 * The semantic map of the 212 papers, packed for each of the Knowledge picture's arrangements by
 * tools/layouts.mjs into semantic.data.js. Only the Knowledge section loads it.
 */
import { SEMANTIC } from './semantic.data.js';

/**
 * @typedef {object} SemanticData
 * @property {{ t: number, name: string }[]} lobes Every sub-topic: its topic and its name.
 * @property {Record<'wide' | 'tall', { lobes: { x: number, y: number, r: number }[], papers: [number, number][] }>} arrangements
 *   For each arrangement, each sub-topic's ground and each paper's place, the papers in the
 *   order of the network's topics and nodes.
 */

/** The packed semantic map. */
export const semantic = SEMANTIC;
