// A picture's text is never drawn under 11 px: where the wide composition would be, the narrow
// one stands instead (kit/fit.js).
import { expect, test } from '@playwright/test';
import { settled } from './helpers.js';

/** The widths of the brief, and the windows on either side of every switch between compositions. */
const WIDTHS = [
  1440, 1280, 1266, 1264, 1255, 1254, 1240, 1238, 1201, 1100, 900, 887, 885, 881, 880, 801, 768, 761, 600, 440, 402, 390, 375,
];
const MIN_TEXT = 11;
const SMALLEST_TEXT = 12.5;

test.describe.configure({ mode: 'parallel' });

for (const width of WIDTHS) {
  test(`every picture sets its text at 11 px or more at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('?still=1', { waitUntil: 'networkidle' });
    await settled(page);
    const pictures = await page.evaluate(() =>
      [...document.querySelectorAll('.frame.pic svg[viewBox]')].map((svg) => {
        const box = svg.getBoundingClientRect();
        const vb = /** @type {SVGSVGElement} */ (svg).viewBox.baseVal;
        return { where: svg.closest('[data-section]')?.getAttribute('data-section'), scale: box.width / vb.width };
      }),
    );
    expect(pictures.length).toBeGreaterThan(4);
    for (const p of pictures) expect(p.scale * SMALLEST_TEXT, `${p.where} at ${width}`).toBeGreaterThanOrEqual(MIN_TEXT);
  });
}
