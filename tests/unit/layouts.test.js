// The checked-in layouts: what tools/layouts.mjs produces, and a network the pictures can draw.
import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { files } from '../../tools/layouts.mjs';
import { between, topics } from '../../kit/network.js';
import { semantic } from '../../sections/knowledge/semantic.js';

describe('generated layouts', () => {
  it('are what the generator produces (run pnpm layouts after changing it)', () => {
    for (const [file, text] of Object.entries(files())) expect(fs.readFileSync(file, 'utf8'), file).toBe(text);
  });
});

describe('the citation network', () => {
  it('holds the 212 kept papers in four topics, one seed in each of three', () => {
    expect(topics.map((T) => T.n)).toEqual([68, 57, 54, 33]);
    expect(topics.reduce((n, T) => n + T.nodes.length, 0)).toBe(212);
    expect(topics.map((T) => T.nodes.filter((m) => m.seed).length)).toEqual([1, 1, 1, 0]);
  });
  it('links only papers of its own topic, with finite coordinates', () => {
    for (const T of topics) {
      for (const [a, b] of T.links) expect(a !== b && a < T.n && b < T.n).toBe(true);
      for (const m of T.nodes) expect(Number.isFinite(m.x) && Number.isFinite(m.y) && m.r > 0).toBe(true);
    }
  });
  it('picks two citations between each pair of neighbouring topics, the same every time', () => {
    const at = [
      { x: 0, y: 0 },
      { x: 360, y: 0 },
      { x: 720, y: 0 },
      { x: 1000, y: 0 },
    ];
    const cross = between(at, 1);
    expect(cross).toEqual(between(at, 1));
    for (const [ta, a, tb, b] of cross) {
      expect(tb).toBe(ta + 1);
      expect(a).toBeLessThan(topics[ta].n);
      expect(b).toBeLessThan(topics[tb].n);
    }
    expect(cross.length).toBeLessThanOrEqual(6);
  });
});

describe('the semantic map', () => {
  it('places every paper in both arrangements, inside each arrangement', () => {
    for (const packed of Object.values(semantic.arrangements)) {
      expect(packed.papers).toHaveLength(212);
      expect(packed.lobes).toHaveLength(semantic.lobes.length);
      for (const [x, y] of packed.papers) expect(Number.isFinite(x) && Number.isFinite(y)).toBe(true);
    }
  });
});
