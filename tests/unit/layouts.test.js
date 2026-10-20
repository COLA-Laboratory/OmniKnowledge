// The checked-in layouts: what tools/layouts.mjs produces, and a network the pictures can draw.
import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { files } from '../../tools/layouts.mjs';
import { between, topics } from '../../kit/network.js';
import { semantic } from '../../sections/knowledge/semantic.js';
import { growthLayout } from '../../tools/growth-layout.mjs';
import { schedule } from '../../kit/network-growth.js';
import { NETWORK } from '../../sign-in/network.data.js';

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

describe('the growing network of the sign-in page', () => {
  const options = {
    seed: 29,
    clusters: [
      { x: 236, y: 222, r: 200, n: 70, sx: 250, sy: 214 },
      { x: 512, y: 208, r: 178, n: 56, sx: 500, sy: 216 },
    ],
  };
  it('is the same every time it is laid out, and differs with the seed', () => {
    expect(growthLayout(options)).toEqual(growthLayout(options));
    expect(growthLayout({ ...options, seed: 30 })).not.toEqual(growthLayout(options));
  });
  it('grows every paper from one paper of the generation before, inside the 720 by 430 box', () => {
    const { nodes, edges } = NETWORK;
    expect(nodes.filter((n) => n.seed)).toHaveLength(2);
    for (const n of nodes) expect(n.x > 0 && n.x < 720 && n.y > 0 && n.y < 430, `${n.x},${n.y}`).toBe(true);
    const parents = nodes.map(() => /** @type {number[]} */ ([]));
    for (const [a, b, tree] of edges) {
      expect(a !== b && a < nodes.length && b < nodes.length).toBe(true);
      if (tree) parents[b].push(a);
    }
    nodes.forEach((n, i) => {
      if (n.seed) return expect(parents[i]).toEqual([]);
      expect(parents[i]).toHaveLength(1);
      expect(nodes[parents[i][0]].depth).toBe(n.depth - 1);
    });
  });
  it('times each paper after the line that finds it, and each other citation after both its papers', () => {
    const time = schedule(NETWORK);
    for (const [i, [a, b, tree]] of NETWORK.edges.entries()) {
      const e = time.edges[i];
      if (tree) {
        expect([e.from, e.to]).toEqual([a, b]);
        expect(e.at).toBeGreaterThanOrEqual(time.nodes[a].at);
        expect(e.length).toBeGreaterThan(200);
        expect(e.at + e.length).toBe(time.nodes[b].at);
      } else expect(e.at).toBeGreaterThan(Math.max(time.nodes[a].at, time.nodes[b].at));
    }
    expect(schedule(NETWORK)).toEqual(time);
  });
});
