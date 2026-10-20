/**
 * Checks the rules of the static site that no linter knows, printing file:line for each breach:
 *
 * - no hand-kept cache-buster (`?v=`) in a page, stylesheet or module (GitHub Pages caches for
 *   ten minutes; README.md, "Publishing");
 * - every local file a page refers to exists, and every icon it uses is in assets/icons.svg;
 * - links that go to one external address are written identically on every page;
 * - the brand mark is drawn once: the favicon's mark is the sprite's;
 * - every page's header, up to and including its brand, and its footer are the same markup, but
 *   for where their links lead (a page's own path to the sprite, a page's own destinations).
 *
 * A page is any .html file outside the tools, tests and generated folders; local references are
 * resolved from the page's own folder.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
/** @type {string[]} */
const breaches = [];
/** @param {string} file @param {string} text @param {number} index @param {string} message */
const breach = (file, text, index, message) => breaches.push(`${file}:${text.slice(0, index).split('\n').length}: ${message}`);

/** Folders that hold no published page code. */
const SKIP = new Set([
  '.git',
  '.github',
  'node_modules',
  'output',
  'runs',
  'test-results',
  'playwright-report',
  'tools',
  'tests',
]);
/** @param {string} dir @returns {string[]} */
const published = (dir) =>
  fs
    .readdirSync(path.join(root, dir), { withFileTypes: true })
    .flatMap((e) => (e.isDirectory() ? (SKIP.has(e.name) ? [] : published(path.join(dir, e.name))) : [path.join(dir, e.name)]));
const files = published('');
const pages = files.filter((f) => f.endsWith('.html'));
const sources = files.filter((f) => /\.(html|css|js)$/.test(f) && !/(^|\/)[^/]*\.config\.js$/.test(f));
const read = (/** @type {string} */ f) => fs.readFileSync(path.join(root, f), 'utf8');

for (const file of sources) {
  const text = read(file);
  for (const m of text.matchAll(/\?v=/g))
    breach(file, text, m.index, 'a cache-buster; files are published without version stamps');
}

/**
 * Returns a reference from a page as a path from the root.
 *
 * @param {string} page
 * @param {string} ref
 */
function local(page, ref) {
  return path.normalize(path.join(path.dirname(page), ref)).replace(/\/$/, '') || '.';
}

/**
 * Returns markup in the form two pages' copies are compared in: whitespace between tags dropped,
 * a link's destination left out, and an icon's sprite path resolved from the page.
 *
 * @param {string} page
 * @param {string} markup
 */
function comparable(page, markup) {
  return markup
    .replace(/\s+/g, ' ')
    .replace(/\s*([<>])\s*/g, '$1')
    .replace(/(<a\b[^>]*\bhref=")[^"]*"/g, '$1"')
    .replace(/(<use\b[^>]*\bhref=")([^"#]*)/g, (_, head, ref) => head + local(page, ref));
}

const sprite = read('assets/icons.svg');
const symbols = new Set([...sprite.matchAll(/<symbol id="([^"]+)"/g)].map((m) => m[1]));
/** @type {Map<string, { href: string, at: string }>} */
const addresses = new Map();
/** @type {Map<string, { markup: string, at: string }>} */
const shared = new Map();

for (const file of pages) {
  const text = read(file);
  for (const m of text.matchAll(/\b(?:href|src)="([^"#?]*)(#[^"]*)?"/g)) {
    const [, ref, hash] = m;
    if (!ref || /^[a-z]+:/i.test(ref) || ref.startsWith('//')) continue;
    const target = local(file, ref);
    if (!fs.existsSync(path.join(root, target))) breach(file, text, m.index, `"${ref}" does not exist`);
    if (target === 'assets/icons.svg' && !symbols.has((hash ?? '').slice(1)))
      breach(file, text, m.index, `assets/icons.svg has no symbol "${hash}"`);
  }
  for (const m of text.matchAll(/<a\b[^>]*\bhref="(https?:[^"]+)"/g)) {
    const url = new URL(m[1].replaceAll('&amp;', '&'));
    const key = url.origin + url.pathname;
    const seen = addresses.get(key);
    if (seen && seen.href !== m[1]) breach(file, text, m.index, `${key} is written differently at ${seen.at}`);
    else if (!seen) addresses.set(key, { href: m[1], at: `${file}:${text.slice(0, m.index).split('\n').length}` });
  }
  for (const [name, pattern] of /** @type {[string, RegExp][]} */ ([
    ['header', /<header class="site-header">[\s\S]*?<a class="brand"[\s\S]*?<\/a\s*>/],
    ['footer', /<footer[\s\S]*?<\/footer>/],
  ])) {
    const m = text.match(pattern);
    if (!m) continue;
    const markup = comparable(file, m[0]);
    const seen = shared.get(name);
    if (seen && seen.markup !== markup) breach(file, text, m.index ?? 0, `the ${name} differs from ${seen.at}`);
    else if (!seen) shared.set(name, { markup, at: `${file}:${text.slice(0, m.index).split('\n').length}` });
  }
}

const icon = read('assets/icon.svg');
const brand = sprite.match(/<symbol id="brand"[\s\S]*?<\/symbol>/)?.[0] ?? '';
const strokes = (/** @type {string} */ s) =>
  [...s.matchAll(/\b(d|cx|cy|r)="([^"]+)"/g)].map((m) => m.slice(1).join('=')).join(' ');
if (strokes(brand) !== strokes(icon.replace(/<rect[^>]*>/, '')))
  breach('assets/icon.svg', icon, 0, 'the favicon\'s mark differs from the "brand" symbol in assets/icons.svg');

for (const b of breaches) console.error(b);
if (breaches.length) process.exit(1);
console.log(`static checks passed: ${pages.length} page(s), ${sources.length} source files`);
