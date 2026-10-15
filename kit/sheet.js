/**
 * The large paper with parts: a sheet large enough to show a venue, a year, a title, authors, a
 * citation count, an abstract and a body (about 90 px wide and up), so a large paper is the same
 * object in every picture. `sheetGeo` places the parts; the others draw them as SVG markup.
 */
import { f } from './format.js';
import { token } from './tokens.js';

/** @typedef {{ x: number, y: number, w: number, h: number }} Rect */
/** @typedef {'venue' | 'year' | 'title' | 'auth' | 'cite' | 'abs' | 'body'} Part */
/**
 * @typedef {object} SheetGeo Where each part of a sheet lies.
 * @property {number} x
 * @property {number} y
 * @property {number} w
 * @property {number} h
 * @property {number} e The folded corner's size.
 * @property {number} pad The inset of the text.
 * @property {number} iw The width of the text.
 * @property {number} hv The height of a thin line.
 * @property {number} fs The size of the year's type.
 * @property {Rect[]} venue
 * @property {Rect[]} year
 * @property {Rect[]} title
 * @property {Rect[]} auth
 * @property {Rect[]} cite
 * @property {Rect[]} abs
 * @property {Rect[]} body
 */

/**
 * Returns where each part of a sheet with its top left corner at (x, y) lies.
 *
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 * @returns {SheetGeo}
 */
export function sheetGeo(x, y, w, h) {
  const e = Math.min(w * 0.17, 22);
  const pad = w * 0.13;
  const iw = w - 2 * pad;
  const hv = Math.max(2.6, w * 0.03);
  const fs = w * 0.094;
  const th = w * 0.054;
  return {
    x,
    y,
    w,
    h,
    e,
    pad,
    iw,
    hv,
    fs,
    venue: [{ x: x + pad, y: y + h * 0.105 - hv / 2, w: iw * 0.44, h: hv }],
    year: [{ x: x + w - e - w * 0.07 - fs * 2.42, y: y + h * 0.105 - fs * 0.46, w: fs * 2.42, h: fs * 0.92 }],
    title: [
      { x: x + pad, y: y + h * 0.2, w: iw, h: th },
      { x: x + pad, y: y + h * 0.2 + th + h * 0.032, w: iw * 0.62, h: th },
    ],
    auth: [{ x: x + pad, y: y + h * 0.365, w: iw * 0.5, h: hv * 0.8 }],
    cite: [{ x: x + pad, y: y + h * 0.425, w: iw * 0.76, h: w * 0.112 }],
    abs: [0, 1, 2, 3, 4].map((i) => ({
      x: x + pad,
      y: y + h * (0.555 + i * 0.05),
      w: iw * (i === 4 ? 0.58 : 1),
      h: Math.max(2.2, w * 0.027),
    })),
    body: [0, 1, 2, 3, 4, 5].map((i) => ({
      x: x + pad + (i % 2) * (iw * 0.54),
      y: y + h * (0.845 + Math.floor(i / 2) * 0.045),
      w: iw * (i === 5 ? 0.3 : 0.46),
      h: Math.max(1.8, w * 0.02),
    })),
  };
}

/**
 * Returns one line of text as a rounded bar.
 *
 * @param {Rect} r
 * @param {string} fill A colour.
 * @returns {string} SVG markup.
 */
export function bar(r, fill) {
  return `<rect x="${f(r.x)}" y="${f(r.y)}" width="${f(r.w)}" height="${f(r.h)}" rx="${f(Math.min(r.h / 2, 3))}" fill="${fill}"/>`;
}

/**
 * Returns four corner ticks around a rectangle: the mark of the part a filter reads.
 *
 * @param {Rect} r
 * @param {number} m The ticks' distance from the rectangle.
 * @param {string} [colour] Ink by default.
 * @returns {string} SVG markup.
 */
export function ticks(r, m, colour = token('ink')) {
  const x0 = r.x - m;
  const y0 = r.y - m;
  const x1 = r.x + r.w + m;
  const y1 = r.y + r.h + m;
  const t = Math.min(6, (y1 - y0) / 2 - 1);
  return `<path d="M${f(x0)},${f(y0 + t)} V${f(y0)} H${f(x0 + t)} M${f(x1 - t)},${f(y0)} H${f(x1)} V${f(y0 + t)} M${f(x1)},${f(y1 - t)} V${f(y1)} H${f(x1 - t)} M${f(x0 + t)},${f(y1)} H${f(x0)} V${f(y1 - t)}" fill="none" stroke="${colour}" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>`;
}

/**
 * Returns the quiet sheet: its outline, folded corner and every part in pale grey.
 *
 * @param {SheetGeo} g
 * @param {{ kept?: boolean, skip?: Partial<Record<Part, boolean>> }} [o] kept: a kept paper,
 *   yellow; skip: parts left out, to be drawn in ink by `sheetInk`.
 * @returns {string} SVG markup.
 */
export function sheetBase(g, o = {}) {
  const { x, y, w, h, e } = g;
  const r = 2.6;
  const skip = o.skip ?? {};
  const ink = token('ink');
  const q1 = token(o.kept ? 'quiet-on-kept' : 'quiet');
  const q2 = token(o.kept ? 'quiet-2-on-kept' : 'quiet-2');
  let s = `<path d="M${f(x + r)},${f(y)} H${f(x + w - e)} L${f(x + w)},${f(y + e)} V${f(y + h - r)} Q${f(x + w)},${f(y + h)} ${f(x + w - r)},${f(y + h)} H${f(x + r)} Q${f(x)},${f(y + h)} ${f(x)},${f(y + h - r)} V${f(y + r)} Q${f(x)},${f(y)} ${f(x + r)},${f(y)} Z" fill="${token(o.kept ? 'y' : 'paper')}" stroke="${ink}" stroke-width="1.3" stroke-linejoin="round"/>`;
  s += `<path d="M${f(x + w - e)},${f(y)} V${f(y + e)} H${f(x + w)}" fill="none" stroke="${ink}" stroke-width="1.1" stroke-linejoin="round"/>`;
  if (!skip.venue) s += bar(g.venue[0], q1);
  if (!skip.year) s += bar({ x: g.year[0].x + g.year[0].w * 0.25, y: g.venue[0].y, w: g.year[0].w * 0.75, h: g.hv }, q1);
  for (const b of [...g.title, ...g.abs]) s += bar(b, q1);
  s += bar(g.auth[0], q2);
  if (!skip.cite) s += bar({ x: g.cite[0].x, y: g.cite[0].y + g.cite[0].h / 2 - g.hv / 2, w: g.iw * 0.34, h: g.hv }, q1);
  for (const b of g.body) s += bar(b, q2);
  return s;
}

/**
 * Returns one part of a sheet in ink.
 *
 * @param {SheetGeo} g
 * @param {Exclude<Part, 'auth' | 'body'>} part
 * @param {{ year?: string }} [o] year: the year's text, for the part "year".
 * @returns {string} SVG markup.
 */
export function sheetInk(g, part, o = {}) {
  const ink = token('ink');
  const r = g[part][0];
  if (part === 'year') {
    return `<text x="${f(r.x + r.w)}" y="${f(r.y + r.h * 0.88)}" text-anchor="end" style="font:500 ${f(g.fs)}px/1 var(--font-mono);letter-spacing:-.02em">${o.year ?? ''}</text>`;
  }
  if (part === 'cite') {
    const fs = g.w * 0.078;
    return (
      `<rect x="${f(r.x)}" y="${f(r.y)}" width="${f(r.w)}" height="${f(r.h)}" rx="${f(r.h / 2)}" fill="${token('paper')}" stroke="${ink}" stroke-width="1.15"/>` +
      `<text x="${f(r.x + r.h * 0.5)}" y="${f(r.y + r.h / 2 + fs * 0.35)}" style="font:500 ${f(fs)}px/1 var(--font-pic)">cited by</text>` +
      bar({ x: r.x + r.w - r.h * 0.45 - g.w * 0.12, y: r.y + r.h / 2 - g.hv * 0.6, w: g.w * 0.12, h: g.hv * 1.2 }, ink)
    );
  }
  return g[part].map((b) => bar(b, ink)).join('');
}
