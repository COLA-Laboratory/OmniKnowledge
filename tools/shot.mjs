// Captures the page, or one part of it, as a PNG.
// usage: node tools/shot.mjs <out.png> ["query"] [--size=1440x900] [--scale=2] [--sel=<css>] [--full]
//                      [--motion] [--wait=1200] [--click=<css>]... [--after=<ms>]
// query is the page's query string without "?", e.g. "only=build&build=a". Without --motion the
// page is opened with still=1, so every picture is in its finished state. --sel captures one
// element; --full the whole scrolling page; otherwise the window. --click presses elements in
// order before the capture, waiting --after ms (600 by default) after each. Prints horizontal
// overflow, page height and any page error. Needs playwright-core: installed where Node can
// resolve it, or its index.mjs named by the environment variable PLAYWRIGHT_CORE.
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const { chromium } = await import(process.env.PLAYWRIGHT_CORE || 'playwright-core')

const here = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const args = process.argv.slice(2)
const flag = (name, dflt) => { const a = args.find((x) => x.startsWith('--' + name + '=')); return a ? a.slice(name.length + 3) : dflt }
const has = (name) => args.includes('--' + name)
const [out, query = ''] = args.filter((a) => !a.startsWith('--'))
const [w, h] = flag('size', '1440x900').split('x').map(Number)
const motion = has('motion')
const clicks = args.filter((a) => a.startsWith('--click=')).map((a) => a.slice(8))
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: Number(flag('scale', '1')), reducedMotion: motion ? 'no-preference' : 'reduce' })
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))
page.on('console', (m) => { if (m.type() === 'error' && !/ERR_FILE_NOT_FOUND/.test(m.text())) errors.push(m.text()) })
const q = [query, motion ? '' : 'still=1'].filter(Boolean).join('&')
await page.goto(pathToFileURL(path.join(here, 'index.html')).href + (q ? '?' + q : ''), { waitUntil: 'load' })
await page.waitForTimeout(Number(flag('wait', '1200')))
for (const c of clicks) { await page.click(c); await page.waitForTimeout(Number(flag('after', '600'))) }
const seen = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth - window.innerWidth, height: document.documentElement.scrollHeight }))
const sel = flag('sel', '')
if (sel) await page.locator(sel).first().screenshot({ path: out })
else await page.screenshot({ path: out, fullPage: has('full') })
console.log(path.basename(out), JSON.stringify(seen), errors.join(' | ') || 'no errors')
await browser.close()
