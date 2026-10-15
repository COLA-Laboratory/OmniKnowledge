// Motion: reveals play, stay under the limit, and end in the finished picture; reduced motion
// shows the finished picture at once, also when the reader turns it on while a reveal plays.
import { expect, test } from '@playwright/test';
import { problems, scrollThrough, settled } from './helpers.js';

/** The longest an automatic reveal may run (kit/motion.js), with a frame's grace. */
const LIMIT = 4500 + 20;

/**
 * Returns each section's reveals as they start while the reader scrolls: how long each runs, in ms.
 *
 * @param {import('@playwright/test').Page} page
 */
async function revealLengths(page) {
  await page.evaluate(() => {
    /** @type {Map<Animation, string>} */
    const owner = new Map();
    // @ts-expect-error a test-only record on the window
    window.__reveals = owner;
    const look = () => {
      for (const a of document.getAnimations()) {
        const t = /** @type {KeyframeEffect | null} */ (a.effect)?.target;
        const section = t?.closest?.('[data-section]');
        if (section && !owner.has(a)) owner.set(a, /** @type {HTMLElement} */ (section).dataset.section ?? '');
      }
      requestAnimationFrame(look);
    };
    look();
  });
  await scrollThrough(page);
  await page.waitForTimeout(300);
  return page.evaluate(() => {
    // @ts-expect-error the record made above
    const owner = /** @type {Map<Animation, string>} */ (window.__reveals);
    /** @type {{ section: string, start: number, end: number }[]} */
    const runs = [];
    for (const [a, section] of owner) {
      if (section === 'knowledge') continue; // its readings belong to the task rotation, not a reveal
      const start = Number(a.startTime ?? 0);
      const end = start + Number(a.effect?.getComputedTiming().endTime ?? 0);
      const run = runs.find((r) => r.section === section && Math.abs(r.start - start) < 60);
      if (run) run.end = Math.max(run.end, end);
      else runs.push({ section, start, end });
    }
    return runs.map((r) => ({ section: r.section, length: Math.round(r.end - r.start) }));
  });
}

for (const width of [1440, 1100, 390]) {
  test(`every reveal ends within 4.5 s at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('', { waitUntil: 'networkidle' });
    const runs = await revealLengths(page);
    for (const s of ['hero', 'features', 'search', 'screen', 'build'])
      expect(
        runs.some((r) => r.section === s),
        `${s} revealed`,
      ).toBe(true);
    for (const r of runs) expect(r.length, `${r.section} reveal`).toBeLessThanOrEqual(LIMIT);
  });
}

for (const width of [1440, 390]) {
  test(`the reveal plays and ends in the finished picture at ${width}`, async ({ page, browserName }) => {
    test.slow();
    const seen = problems(page);
    await page.setViewportSize({ width, height: 900 });
    await page.goto('?still=1', { waitUntil: 'networkidle' });
    await settled(page);
    const still = await page.screenshot({ fullPage: true });
    await page.goto('', { waitUntil: 'networkidle' });
    const played = await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r(document.getAnimations().length))));
    expect(played).toBeGreaterThan(0);
    await scrollThrough(page);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.mouse.move(0, 0);
    await settled(page);
    const moved = await page.screenshot({ fullPage: true });
    expect(moved.equals(still), `${browserName} at ${width}: the page after its reveals differs from ?still=1`).toBe(true);
    expect(seen).toEqual([]);
  });
}

test('reduced motion shows the finished picture at once', async ({ page }) => {
  await page.goto('?still=1', { waitUntil: 'networkidle' });
  await settled(page);
  const still = await page.screenshot({ fullPage: true });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('', { waitUntil: 'networkidle' });
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
  await scrollThrough(page);
  const running = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length);
  expect(running).toBe(0);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await settled(page);
  expect((await page.screenshot({ fullPage: true })).equals(still)).toBe(true);
});

test('turning on reduced motion stops a reveal at its finished state', async ({ page }) => {
  await page.goto('', { waitUntil: 'networkidle' });
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
  expect(await page.evaluate(() => document.getAnimations().length)).toBeGreaterThan(0);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForTimeout(100);
  const running = await page.evaluate(
    () => document.getAnimations().filter((a) => a.playState === 'running' && !(a instanceof CSSTransition)).length,
  );
  expect(running).toBe(0);
});
