/**
 * The landing page's entry: loads the module of each section named in the page (data-section),
 * waits for the pictures' typeface, then mounts each section into its element. Each section is
 * loaded and mounted on its own: one that fails to load or to mount is logged and left empty,
 * and the others still mount. Sets data-ready on <html> once every section has been tried.
 */
import { fontsReady } from './kit/index.js';

/**
 * @typedef {object} Section
 * @property {(element: HTMLElement) => { destroy(): void }} mount Fills the element's figure and
 *   returns the way to release what it holds (observers, listeners, timers, animations).
 * @property {(element: HTMLElement) => void} [prepare] Sizes the figure before the typeface is in.
 */

/** @type {Record<string, () => Promise<Section>>} */
const SECTIONS = {
  hero: () => import('./sections/hero/hero.js'),
  features: () => import('./sections/features/features.js'),
  search: () => import('./sections/search/search.js'),
  screen: () => import('./sections/screen/screen.js'),
  build: () => import('./sections/build/build.js'),
  knowledge: () => import('./sections/knowledge/knowledge.js'),
};

/** The destructors of the mounted sections, by name. */
const mounted = new Map();

/**
 * Runs one step of one section, logging a failure instead of passing it on.
 *
 * @param {string} name
 * @param {() => void} step
 */
function isolated(name, step) {
  try {
    step();
  } catch (error) {
    console.error(`section "${name}" failed:`, error);
  }
}

const places = /** @type {HTMLElement[]} */ ([...document.querySelectorAll('[data-section]')]);
const loaded = await Promise.all(
  places.map(async (el) => {
    const name = el.dataset.section ?? '';
    const load = SECTIONS[name];
    if (!load) {
      console.error(`section "${name}": no module mounts it`);
      return null;
    }
    try {
      const section = await load();
      if (section.prepare) isolated(name, () => section.prepare?.(el));
      return { name, el, section };
    } catch (error) {
      console.error(`section "${name}" failed to load:`, error);
      return null;
    }
  }),
);
await fontsReady();
for (const entry of loaded) if (entry) isolated(entry.name, () => mounted.set(entry.name, entry.section.mount(entry.el)));
document.documentElement.dataset.ready = 'true';
