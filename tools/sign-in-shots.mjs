/**
 * Captures every state of the sign-in page (tools/sign-in-states.mjs) at every size, and the
 * network's growth at moments of its first 4.5 s, into runs/sign-in/ at twice the pixel density.
 * Prints each capture's horizontal overflow; exits non-zero on any overflow, page error or failed
 * request.
 *
 * Usage: node tools/sign-in-shots.mjs [--browser=webkit] [--states=email,wrong]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, webkit } from '@playwright/test';
import { serve } from './serve.mjs';
import { PATH, SIZES, STATES, open, rest } from './sign-in-states.mjs';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const args = process.argv.slice(2);
/** @param {string} name */
const flag = (name) => args.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const only = flag('states')?.split(',');
const out = path.join(root, 'runs', 'sign-in');
fs.mkdirSync(out, { recursive: true });

const server = await serve({ prefix: '/OmniKnowledge/' });
const browser = await (flag('browser') === 'webkit' ? webkit : chromium).launch();
/** @type {string[]} */
const problems = [];

/**
 * Opens a page at a size, collecting its problems.
 *
 * @param {number} width
 * @param {number} height
 * @param {string} where
 */
async function page(width, height, where) {
  const p = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 2 });
  p.on('pageerror', (e) => problems.push(`${where}: page error: ${e.message}`));
  p.on('console', (m) => {
    if (m.type() === 'error') problems.push(`${where}: console error: ${m.text()}`);
  });
  p.on('requestfailed', (r) => problems.push(`${where}: request failed: ${r.url()}`));
  return p;
}

/** @param {import('@playwright/test').Page} p @param {string} where */
async function overflow(p, where) {
  const o = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (o) problems.push(`${where}: overflows by ${o} px`);
  return o;
}

try {
  for (const [width, height] of SIZES)
    for (const state of STATES.filter((s) => !only || only.includes(s.name))) {
      const where = `${state.name}-${width}`;
      const p = await page(width, height, where);
      await open(p, server.url);
      await state.enter(p);
      await rest(p);
      await p.screenshot({ path: path.join(out, `${where}.png`) });
      console.log(`${where}.png  overflow ${await overflow(p, where)}`);
      await p.close();
    }
  if (!only) {
    const p = await page(1440, 900, 'growth');
    await p.goto(`${server.url}${PATH}`, { waitUntil: 'load' });
    let last = 0;
    for (const t of [500, 1500, 2500, 3500, 4500]) {
      await p.waitForTimeout(t - last);
      last = t;
      await p.screenshot({ path: path.join(out, `growth-${t}.png`) });
    }
    console.log('growth-*.png');
    await p.close();
  }
} finally {
  await browser.close();
  await server.close();
}
for (const problem of problems) console.error(problem);
process.exit(problems.length ? 1 : 0);
