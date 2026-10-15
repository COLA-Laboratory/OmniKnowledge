// The kit's pure functions: numbers, the seeded random, geometry and the sheet's parts.
import { describe, expect, it } from 'vitest';
import { f, fmt } from '../../kit/format.js';
import { prng } from '../../kit/random.js';
import { centroid, enclosingCircle } from '../../kit/geometry.js';
import { sheetGeo } from '../../kit/sheet.js';

describe('format', () => {
  it('rounds coordinates to one decimal', () => {
    expect(f(12.345)).toBe(12.3);
    expect(f(-0.06)).toBe(-0.1);
    expect(f(7)).toBe(7);
  });
  it('writes counts with thousands separators', () => {
    expect(fmt(14950)).toBe('14,950');
    expect(fmt(212)).toBe('212');
    expect(fmt(1234567)).toBe('1,234,567');
  });
});

describe('prng', () => {
  it('gives the same numbers for the same seed', () => {
    const a = prng(57);
    const b = prng(57);
    const run = (/** @type {() => number} */ r) => Array.from({ length: 50 }, r);
    expect(run(a)).toEqual(run(b));
  });
  it('is the mulberry32 sequence the drawings were composed with', () => {
    const r = prng(1);
    expect([r(), r(), r()].map((x) => x.toFixed(10))).toEqual(['0.6270739406', '0.0027357212', '0.5274470400']);
  });
  it('stays in [0, 1) and differs between seeds', () => {
    const r = prng(9001);
    const xs = Array.from({ length: 1000 }, r);
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...xs)).toBeLessThan(1);
    expect(prng(1)()).not.toBe(prng(2)());
  });
});

describe('geometry', () => {
  const circles = [
    { x: 0, y: 0, r: 2 },
    { x: 10, y: 0, r: 1 },
    { x: 4, y: 7, r: 3 },
    { x: -3, y: 5, r: 1.5 },
  ];
  it('finds the mean of points', () => {
    expect(
      centroid([
        { x: 0, y: 0 },
        { x: 4, y: 2 },
      ]),
    ).toEqual({ x: 2, y: 1 });
  });
  it('encloses every circle, close to the smallest circle', () => {
    for (const start of [undefined, centroid(circles)]) {
      const c = enclosingCircle(circles, start);
      for (const p of circles) expect(Math.hypot(p.x - c.x, p.y - c.y) + p.r).toBeLessThanOrEqual(c.r + 1e-9);
      expect(c.r).toBeLessThan(8.5);
    }
  });
});

describe('sheetGeo', () => {
  it('keeps every part inside the sheet', () => {
    const g = sheetGeo(106, 12, 58, 82);
    for (const part of /** @type {const} */ (['venue', 'year', 'title', 'auth', 'cite', 'abs', 'body'])) {
      for (const r of g[part]) {
        expect(r.x).toBeGreaterThanOrEqual(g.x);
        expect(r.x + r.w).toBeLessThanOrEqual(g.x + g.w);
        expect(r.y).toBeGreaterThanOrEqual(g.y);
        expect(r.y + r.h).toBeLessThanOrEqual(g.y + g.h);
      }
    }
  });
});
