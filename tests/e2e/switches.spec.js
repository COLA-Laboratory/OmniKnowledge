// Every switch a reader can press changes the picture it belongs to.
import { expect, test } from '@playwright/test';
import { SCENES, settled } from './helpers.js';

for (const width of [1440, 390]) {
  for (const scene of SCENES.filter((s) => s.presses.length)) {
    test(`${scene.name} changes its picture at ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('?still=1', { waitUntil: 'networkidle' });
      await settled(page);
      const last = scene.presses[scene.presses.length - 1];
      const owner = page.locator(last).first().locator('xpath=ancestor::*[@data-section or self::section][1]');
      const before = await owner.screenshot();
      for (const press of scene.presses) {
        await page.locator(press).first().click();
        await page.mouse.move(0, 0);
        await settled(page);
      }
      const after = await owner.screenshot();
      expect(after.equals(before)).toBe(false);
      const pressed = await page.locator(last).first().getAttribute('aria-pressed');
      if (pressed !== null) expect(pressed).toBe('true');
    });
  }
}
