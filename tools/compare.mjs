/**
 * Proves that this tree draws the page pixel for pixel as a git ref does.
 *
 * Exports <ref> (default 89d3153) into a temporary folder, serves it and this tree under
 * /OmniKnowledge/ as GitHub Pages does, captures every scene of tools/scenes.mjs at every width in
 * still mode in Chromium, and compares each pair pixel by pixel. A differing pair is written to
 * output/compare/ with a diff image. Exits non-zero on any difference, page error or failed request.
 *
 * Usage: node tools/compare.mjs [ref] [--widths=1440,390] [--scenes=page,task-2] [--scale=1]
 *                               [--ref-css=<file>]
 *
 * --ref-css adds a stylesheet to the ref's pages before they are captured, to show that a
 * deliberate change (say, one colour) explains every pixel that differs and nothing else does.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import { serve } from './serve.mjs';
import { SCENES, WIDTHS, HEIGHT, enter } from './scenes.mjs';

const here = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const args = process.argv.slice(2);
/** @param {string} name */
const flag = (name) => args.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const ref = args.find((a) => !a.startsWith('--')) ?? '89d3153';
const widths = flag('widths')?.split(',').map(Number) ?? WIDTHS;
const scenes = flag('scenes') ? SCENES.filter((s) => flag('scenes')?.split(',').includes(s.name)) : SCENES;
const scale = Number(flag('scale') ?? '1');
const refCss = flag('ref-css') ? fs.readFileSync(String(flag('ref-css')), 'utf8') : '';
const out = path.join(here, 'output', 'compare');

const old = fs.mkdtempSync(path.join(os.tmpdir(), 'ok-compare-'));
execFileSync('sh', ['-c', `git -C "${here}" archive --format=tar "${ref}" | tar -x -C "${old}"`]);
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

const PREFIX = '/OmniKnowledge/';
const servers = { ref: await serve({ root: old, prefix: PREFIX }), tree: await serve({ root: here, prefix: PREFIX }) };
const browser = await chromium.launch();
/** @type {string[]} */
const problems = [];
/** Responses from the font host, fetched once and replayed, so both trees get the same bytes. */
const fonts = new Map();
let differing = 0;

/**
 * Captures one scene at one width from one server.
 *
 * @param {'ref' | 'tree'} side
 * @param {(typeof SCENES)[number]} scene
 * @param {number} width
 * @returns {Promise<Buffer>} The PNG.
 */
async function capture(side, scene, width) {
  const context = await browser.newContext({ viewport: { width, height: HEIGHT }, deviceScaleFactor: scale });
  await context.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, async (route) => {
    const url = route.request().url();
    if (!fonts.has(url))
      fonts.set(
        url,
        route.fetch().then(async (r) => ({ status: r.status(), headers: r.headers(), body: await r.body() })),
      );
    await route.fulfill(await fonts.get(url));
  });
  const page = await context.newPage();
  const where = `${side} ${scene.name} @${width}`;
  page.on('pageerror', (e) => problems.push(`${where}: page error: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') problems.push(`${where}: console error: ${m.text()}`);
  });
  page.on('requestfailed', (r) => problems.push(`${where}: request failed: ${r.url()}`));
  page.on('response', (r) => {
    if (r.status() >= 400) problems.push(`${where}: HTTP ${r.status()}: ${r.url()}`);
  });
  if (side === 'ref' && refCss)
    await page.addInitScript((css) => {
      document.addEventListener('DOMContentLoaded', () =>
        document.head.append(Object.assign(document.createElement('style'), { textContent: css })),
      );
    }, refCss);
  await page.goto(`${servers[side].url}?still=1`, { waitUntil: 'networkidle' });
  await enter(page, scene);
  const png = await page.screenshot({ fullPage: true });
  await context.close();
  return png;
}

/**
 * Compares one scene at one width and records the pair when it differs.
 *
 * @param {(typeof SCENES)[number]} scene
 * @param {number} width
 */
async function check(scene, width) {
  const [a, b] = await Promise.all([capture('ref', scene, width), capture('tree', scene, width)]);
  const name = `${scene.name}-${width}`;
  if (a.equals(b)) return console.log(`same  ${name}`);
  const A = PNG.sync.read(a);
  const B = PNG.sync.read(b);
  let note;
  if (A.width !== B.width || A.height !== B.height) note = `size ${A.width}x${A.height} -> ${B.width}x${B.height}`;
  else {
    const diff = new PNG({ width: A.width, height: A.height });
    const n = pixelmatch(A.data, B.data, diff.data, A.width, A.height, { threshold: 0, includeAA: true });
    if (n === 0) return console.log(`same  ${name} (encoding only)`);
    note = `${n} pixels`;
    fs.writeFileSync(path.join(out, `${name}-diff.png`), PNG.sync.write(diff));
  }
  differing++;
  fs.writeFileSync(path.join(out, `${name}-ref.png`), a);
  fs.writeFileSync(path.join(out, `${name}-tree.png`), b);
  console.log(`DIFF  ${name}: ${note}`);
}

const jobs = scenes.flatMap((scene) => widths.map((width) => () => check(scene, width)));
const pool = Array.from({ length: 4 }, async () => {
  for (let job = jobs.shift(); job; job = jobs.shift()) await job();
});
try {
  await Promise.all(pool);
} finally {
  await browser.close();
  await Promise.all([servers.ref.close(), servers.tree.close()]);
  fs.rmSync(old, { recursive: true, force: true });
}

for (const p of problems) console.log(`ERROR ${p}`);
const total = scenes.length * widths.length;
console.log(
  `${total - differing} of ${total} captures identical to ${ref}; ${problems.length} page problems${differing ? `; differing pairs in ${path.relative(here, out)}` : ''}`,
);
process.exit(differing || problems.length ? 1 : 0);
