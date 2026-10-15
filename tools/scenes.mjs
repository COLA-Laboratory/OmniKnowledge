/**
 * The states a reader can put the page in, and the widths it is checked at. One list, shared by
 * the pixel comparison (tools/compare.mjs) and the end-to-end tests (tests/e2e).
 *
 * A scene is a name and the presses that lead to it from a freshly loaded page. A press names an
 * element by a CSS selector; `:visible` picks the one a reader can see where the wide and the
 * narrow arrangement each have their own control.
 */

/** The window widths, in CSS pixels, every scene is captured at. */
export const WIDTHS = [1440, 1280, 1100, 768, 440, 402, 390, 375];

/** The window height used for every capture; the page is captured whole. */
export const HEIGHT = 900;

/** @param {string} preset */
const build = (preset) => `[data-section=build] .ba-switch button[data-preset=${preset}]`;
/** @param {number} k */
const task = (k) => `[data-section=knowledge] button[data-k="${k}"]:visible`;
const semantic = '[data-section=knowledge] .ka-top button:nth-child(2)';

/** @type {{ name: string, presses: string[] }[]} */
export const SCENES = [
  { name: 'page', presses: [] },
  { name: 'build-light', presses: [build('light')] },
  { name: 'build-heavy', presses: [build('heavy')] },
  { name: 'map-semantic', presses: [semantic] },
  { name: 'task-2', presses: [task(1)] },
  { name: 'task-3', presses: [task(2)] },
  { name: 'task-4', presses: [task(3)] },
  { name: 'map-semantic-task-3', presses: [semantic, task(2)] },
  { name: 'questions-open', presses: [1, 2, 3, 4, 5].map((i) => `.faq details:nth-child(${i}) > summary`) },
];

/**
 * Resolves when the page has drawn every picture, its fonts are in and nothing moves.
 *
 * Works on any version of the page: it asks only that the first picture and every section's
 * figure hold drawn groups.
 *
 * @param {import('@playwright/test').Page} page
 */
export async function settled(page) {
  await page.waitForFunction(
    () =>
      document.fonts.status === 'loaded' &&
      !!document.querySelector('#hero-pic g') &&
      [...document.querySelectorAll('[data-section]')].every((s) => s.querySelector('svg g')),
    undefined,
    { timeout: 20000 },
  );
  await page.evaluate(async () => {
    await document.fonts.ready;
    const frame = () => new Promise((r) => requestAnimationFrame(() => r(undefined)));
    await frame();
    await frame();
    await Promise.all(document.getAnimations().map((a) => a.finished.catch(() => undefined)));
    await frame();
  });
}

/**
 * Presses the scene's controls in order, each after the page has settled, then moves the pointer
 * off the page and scrolls back to the top, so no hover or scroll position enters the capture.
 *
 * @param {import('@playwright/test').Page} page
 * @param {{ presses: string[] }} scene
 */
export async function enter(page, scene) {
  await settled(page);
  for (const selector of scene.presses) {
    await page.locator(selector).first().click();
    await page.mouse.move(0, 0);
    await settled(page);
  }
  await page.mouse.move(0, 0);
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    window.scrollTo({ top: 0, behavior: 'instant' });
  });
  await page.waitForFunction(() => window.scrollY === 0);
  await settled(page);
}
