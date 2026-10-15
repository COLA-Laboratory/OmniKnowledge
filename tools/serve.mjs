/**
 * Serves a directory over HTTP the way GitHub Pages serves this repository: static files, an
 * optional path prefix (Pages publishes the site under /OmniKnowledge/), index.html for a folder.
 * Node's own http module, no dependency. Used by every tool and by the end-to-end tests.
 *
 * Usage: node tools/serve.mjs [--root=<dir>] [--port=4173] [--prefix=/OmniKnowledge/]
 */
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** @type {Record<string, string>} */
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

/**
 * Starts a static server.
 *
 * @param {object} [options]
 * @param {string} [options.root] The directory served; the repository root by default.
 * @param {number} [options.port] The port; 0 picks a free one.
 * @param {string} [options.prefix] The path the root is served under, with both slashes.
 * @returns {Promise<{ url: string, close: () => Promise<void> }>} The page's URL and a stop.
 */
export async function serve({ root = path.dirname(path.dirname(fileURLToPath(import.meta.url))), port = 0, prefix = '/' } = {}) {
  const base = path.resolve(root);
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    let rel = decodeURIComponent(url.pathname);
    if (rel === prefix.slice(0, -1)) {
      res.writeHead(301, { location: prefix }).end();
      return;
    }
    if (!rel.startsWith(prefix)) {
      res.writeHead(404).end('not found');
      return;
    }
    rel = rel.slice(prefix.length);
    let file = path.join(base, rel);
    if (file !== base && !file.startsWith(base + path.sep)) {
      res.writeHead(403).end('forbidden');
      return;
    }
    try {
      if ((await fs.stat(file)).isDirectory()) file = path.join(file, 'index.html');
      const body = await fs.readFile(file);
      res.writeHead(200, {
        'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream',
        'cache-control': 'no-store',
      });
      res.end(body);
    } catch {
      res.writeHead(404).end('not found');
    }
  });
  await new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve(undefined)));
  const address = /** @type {import('node:net').AddressInfo} */ (server.address());
  return {
    url: `http://127.0.0.1:${address.port}${prefix}`,
    close: () => new Promise((resolve) => server.close(() => resolve())),
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  /** @param {string} name @param {string | undefined} fallback */
  const arg = (name, fallback) => process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
  const { url } = await serve({
    root: arg('root', undefined),
    port: Number(arg('port', '4173')),
    prefix: arg('prefix', '/') ?? '/',
  });
  console.log(`serving ${url}`);
}
