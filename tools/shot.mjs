/**
 * Captures the page, or one part of it, as a PNG, served as GitHub Pages serves it.
 *
 * Usage: node tools/shot.mjs <out.png> [--size=1440x900] [--scale=2] [--sel=<css>] [--full]
 *                            [--click=<css>]... [--motion[=<ms>]] [--browser=webkit]
 *
 * The page opens with ?still=1, so every picture is in its finished state, and is captured once
 * it has settled. --sel captures one element; --full the whole page; otherwise the window.
 * --click presses elements in order, each after the page has settled. --motion opens it without
 * ?still=1 and captures <ms> after load (1200 by default), to sample a reveal. Prints horizontal
 * overflow and the page's height; exits non-zero on any page error or failed request.
 */
import path from 'node:path';
import { chromium, webkit } from '@playwright/test';
import { serve } from './serve.mjs';
import { settled } from './scenes.mjs';

const args = process.argv.slice(2);
/** @param {string} name @param {string} fallback */
const flag = (name, fallback) => args.find((a) => a === `--${name}` || a.startsWith(`--${name}=`))?.split('=')[1] ?? fallback;
const has = (/** @type {string} */ name) => args.some((a) => a === `--${name}` || a.startsWith(`--${name}=`));
const out = args.find((a) => !a.startsWith('--'));
if (!out) {
  console.error('usage: node tools/shot.mjs <out.png> [options]; see the comment at the top of tools/shot.mjs');
  process.exit(2);
}
const [w, h] = flag('size', '1440x900').split('x').map(Number);
const motion = has('motion');
const clicks = args.filter((a) => a.startsWith('--click=')).map((a) => a.slice(8));

const server = await serve({ prefix: '/OmniKnowledge/' });
const browser = await (flag('browser', 'chromium') === 'webkit' ? webkit : chromium).launch();
const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: Number(flag('scale', '1')) });
/** @type {string[]} */
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
});
page.on('requestfailed', (r) => errors.push(`failed: ${r.url()}`));
await page.goto(server.url + (motion ? '' : '?still=1'), { waitUntil: 'networkidle' });
if (motion) await page.waitForTimeout(Number(flag('motion', '1200')) || 1200);
else {
  await settled(page);
  for (const c of clicks) {
    await page.locator(c).first().click();
    await settled(page);
  }
}
const seen = await page.evaluate(() => ({
  overflow: document.documentElement.scrollWidth - window.innerWidth,
  height: document.documentElement.scrollHeight,
}));
const sel = flag('sel', '');
if (sel) await page.locator(sel).first().screenshot({ path: out });
else await page.screenshot({ path: out, fullPage: has('full') });
console.log(path.basename(out), JSON.stringify(seen), errors.join(' | ') || 'no errors');
await browser.close();
await server.close();
process.exit(errors.length || seen.overflow > 0 ? 1 : 0);
