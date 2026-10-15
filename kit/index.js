/**
 * The drawing kit: everything every picture is drawn with, so that a paper, a sheet and the
 * network are the same objects from the first picture to the last. README.md describes the
 * drawing language; styles/kit.css holds its classes.
 */
export { svg, html, markup, setMarkup } from './dom.js';
export { f, fmt } from './format.js';
export { prng } from './random.js';
export { centroid, enclosingCircle } from './geometry.js';
export { token } from './tokens.js';
export { paper, words } from './paper.js';
export { sheetGeo, sheetBase, sheetInk, ticks, bar } from './sheet.js';
export { GLYPHS, tile } from './icons.js';
export { topics, between } from './network.js';
export { isStill, onStill, reveal, onArrive, easing, REVEAL_LIMIT } from './motion.js';
export { fontsReady, onLateFonts } from './fonts.js';
export { fitsWide, onWidthChange, MIN_TEXT, SMALLEST_TEXT } from './fit.js';
export { EXAMPLE } from './example.js';
