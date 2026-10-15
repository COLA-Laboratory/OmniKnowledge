/** The seeded random numbers every drawing scatters with, so a drawing is the same on every visit. */

/**
 * Returns a generator of numbers in [0, 1) determined by the seed (mulberry32).
 *
 * @param {number} seed Any integer.
 * @returns {() => number}
 */
export function prng(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
