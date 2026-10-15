// The page loads cleanly, every section mounts, and nothing overflows the window.
import { expect, test } from '@playwright/test';
import { SECTIONS, problems, settled } from './helpers.js';

for (const width of [1440, 390]) {
  test(`loads with no error and every section drawn at ${width}`, async ({ page }) => {
    const seen = problems(page);
    await page.setViewportSize({ width, height: 900 });
    await page.goto('?still=1', { waitUntil: 'networkidle' });
    await settled(page);
    await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
    for (const name of SECTIONS) expect(await page.locator(`[data-section=${name}] svg g`).count(), name).toBeGreaterThan(0);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBe(0);
    expect(seen).toEqual([]);
  });
}

for (const [how, fail] of /** @type {const} */ ([
  ['to load', (/** @type {import('@playwright/test').Route} */ route) => route.abort()],
  [
    'to mount',
    (/** @type {import('@playwright/test').Route} */ route) =>
      route.fulfill({
        contentType: 'text/javascript',
        body: 'export function mount() { throw new Error("broken on purpose"); }',
      }),
  ],
])) {
  test(`a section that fails ${how} leaves the others drawn`, async ({ page }) => {
    const seen = problems(page);
    await page.route('**/sections/search/search.js', fail);
    await page.goto('?still=1');
    await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
    for (const name of SECTIONS.filter((n) => n !== 'search'))
      expect(await page.locator(`[data-section=${name}] svg g`).count(), name).toBeGreaterThan(0);
    expect(seen.some((p) => p.includes('section "search" failed'))).toBe(true);
  });
}

test('a typeface that fails to load leaves every section drawn', async ({ page }) => {
  const seen = problems(page, /hanken\.woff2|Failed to load resource/);
  await page.route('**/hanken.woff2', (route) => route.abort());
  await page.goto('?still=1');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true', { timeout: 10000 });
  for (const name of SECTIONS) expect(await page.locator(`[data-section=${name}] svg g`).count(), name).toBeGreaterThan(0);
  expect(seen).toEqual([]);
});

test('a typeface that arrives late redraws the pictures in it, keeping what the reader chose', async ({ page }) => {
  await page.goto('?still=1', { waitUntil: 'networkidle' });
  await settled(page);
  await page.locator('[data-section=build] button[data-preset=heavy]').click();
  await page.mouse.move(0, 0);
  await settled(page);
  const onTime = await page.locator('main').screenshot();
  await page.route('**/hanken.woff2', async (route) => {
    await new Promise((r) => setTimeout(r, 4000));
    await route.continue();
  });
  await page.goto('?still=1');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true', { timeout: 10000 });
  await page.locator('[data-section=build] button[data-preset=heavy]').click();
  await page.mouse.move(0, 0);
  await page.waitForFunction(() => document.fonts.check('600 20px Hanken'), undefined, { timeout: 10000 });
  await settled(page);
  expect((await page.locator('main').screenshot()).equals(onTime)).toBe(true);
});

test('the skip link appears on focus and leads to the content', async ({ page, browserName }) => {
  await page.goto('?still=1');
  const skip = page.locator('.skip-link');
  const hidden = await skip.boundingBox();
  expect((hidden?.y ?? 0) + (hidden?.height ?? 0)).toBeLessThanOrEqual(0);
  // Safari moves focus to links with Option-Tab
  await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
  await expect(skip).toBeFocused();
  const shown = await skip.boundingBox();
  expect(shown?.y ?? -1).toBeGreaterThanOrEqual(0);
  await expect(skip).toHaveAttribute('href', '#main');
  await expect(page.locator('main#main')).toHaveCount(1);
});

test('headings descend without skipping a level', async ({ page }) => {
  await page.goto('?still=1');
  const levels = await page.locator('h1, h2, h3, h4, h5, h6').evaluateAll((hs) => hs.map((h) => Number(h.tagName[1])));
  expect(levels[0]).toBe(1);
  for (let i = 1; i < levels.length; i++) expect(levels[i] - levels[i - 1]).toBeLessThanOrEqual(1);
});
