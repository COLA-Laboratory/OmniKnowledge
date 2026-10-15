// What the end-to-end tests share: collecting a page's problems, and the pictures' readiness.
export { SCENES, WIDTHS, settled, enter } from '../../tools/scenes.mjs';

/** The sections a reader sees, by the element that holds each. */
export const SECTIONS = ['hero', 'features', 'search', 'screen', 'build', 'knowledge'];

/**
 * Starts collecting the page's errors, console errors and failed requests.
 *
 * @param {import('@playwright/test').Page} page
 * @param {RegExp} [allowed] Problems to leave out, e.g. a request a test makes fail on purpose.
 * @returns {string[]} The problems so far; the list grows as the page runs.
 */
export function problems(page, allowed) {
  /** @type {string[]} */
  const list = [];
  const add = (/** @type {string} */ p) => {
    if (!allowed?.test(p)) list.push(p);
  };
  page.on('pageerror', (e) => add(`page error: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') add(`console error: ${m.text()}`);
  });
  page.on('requestfailed', (r) => add(`request failed: ${r.url()}`));
  page.on('response', (r) => {
    if (r.status() >= 400) add(`HTTP ${r.status()}: ${r.url()}`);
  });
  return list;
}

/**
 * Brings each picture into view in turn, from the top of the page down, as a reader scrolling
 * would, and returns to the top.
 *
 * @param {import('@playwright/test').Page} page
 */
export async function scrollThrough(page) {
  const count = await page.locator('main svg').count();
  for (let i = 0; i < count; i++) {
    await page
      .locator('main svg')
      .nth(i)
      .evaluate((e) => e.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await page.waitForTimeout(120);
  }
}
