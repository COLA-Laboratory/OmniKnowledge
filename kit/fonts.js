/**
 * Waiting for the typeface the pictures measure their text in.
 *
 * Drawings place text by measuring it, so they are drawn once Hanken is in. A font that fails to
 * load never holds the page: after FONT_WAIT the pictures are drawn in the fallback face, and if
 * Hanken arrives later the drawings that measure text are asked to draw again.
 */

/** How long the page waits for the typeface, in ms. */
export const FONT_WAIT = 2500;

const FACES = ['500 20px "Hanken"', '600 20px "Hanken"', '400 20px "Hanken"'];

/** @type {Promise<void> | null} */
let ready = null;
let late = false;
/** @type {Set<() => void>} */
const lateCalls = new Set();

/**
 * Resolves when the faces are loaded, have failed, or FONT_WAIT has passed. Never rejects.
 *
 * @returns {Promise<void>}
 */
export function fontsReady() {
  if (!ready) {
    ready = new Promise((resolve) => {
      if (!document.fonts?.load) {
        resolve();
        return;
      }
      const settled = Promise.allSettled(FACES.map((face) => document.fonts.load(face))).then(() => document.fonts.ready);
      const timer = setTimeout(() => {
        late = true;
        resolve();
      }, FONT_WAIT);
      settled.then(() => {
        clearTimeout(timer);
        if (late && document.fonts.check(FACES[0])) for (const call of [...lateCalls]) call();
        resolve();
      });
    });
  }
  return ready;
}

/**
 * Calls fn if the faces arrive after the pictures were drawn without them.
 *
 * @param {() => void} fn Draws again, keeping whatever the reader chose.
 * @returns {() => void} Stops the call.
 */
export function onLateFonts(fn) {
  lateCalls.add(fn);
  return () => lateCalls.delete(fn);
}
