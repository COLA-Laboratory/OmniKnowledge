/** Number formatting for coordinates written into markup and for counts shown to a reader. */

/**
 * Rounds a coordinate to one decimal.
 *
 * @param {number} n
 * @returns {number}
 */
export const f = (n) => Math.round(n * 10) / 10;

/**
 * Writes a count with thousands separators: 14950 becomes "14,950".
 *
 * @param {number} n
 * @returns {string}
 */
export const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
