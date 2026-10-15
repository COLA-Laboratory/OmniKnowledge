/**
 * The Build section: beside its text and two notes (index.html), one frame holding the pipeline,
 * the filters and the record of a run (picture.js), with a switch between three presets. The
 * frame's column takes the wide picture's own width, so that in a 1280 column it stands at its own
 * size; where the frame is too narrow for it (kit/fit.js) the one-column picture is drawn.
 */
import { GLYPHS, fitsWide, onArrive, onLateFonts, onWidthChange, setMarkup } from '../../kit/index.js';
import { wideWidth } from './layout.js';
import { picture } from './picture.js';
import { FIRST } from './record.js';

/**
 * Draws a note's glyph on the kit's tile at 24 px.
 *
 * @param {HTMLElement} el An element with data-glyph naming one of the kit's glyphs.
 */
function noteIcon(el) {
  const glyph = GLYPHS[/** @type {keyof typeof GLYPHS} */ (el.dataset.glyph)];
  if (!glyph) throw new Error(`build: no glyph "${el.dataset.glyph}"`);
  setMarkup(
    el,
    `<svg viewBox="0 0 24 24" width="24" height="24"><rect class="tile" width="24" height="24" rx="7.2"/><g class="ic" transform="translate(4.04 4.04) scale(.8)">${glyph}</g></svg>`,
  );
}

/**
 * Draws the notes' icons and the picture, reveals it when it arrives, and follows the switch.
 *
 * @param {HTMLElement} root
 */
export function mount(root) {
  for (const el of root.querySelectorAll('.ba-ico')) noteIcon(/** @type {HTMLElement} */ (el));
  const wrap = /** @type {HTMLElement} */ (root.querySelector('.ba-wrap'));
  const frame = /** @type {HTMLElement} */ (root.querySelector('.ba-frame'));
  const stage = /** @type {HTMLElement} */ (root.querySelector('.ba-stage'));
  const sw = /** @type {HTMLElement} */ (stage.querySelector('.ba-switch'));
  const buttons = /** @type {HTMLButtonElement[]} */ ([...sw.querySelectorAll('button[data-preset]')]);
  /** @type {ReturnType<typeof picture> | null} */
  let pic = null;
  /** @type {import('./record.js').PresetId} */
  let preset = FIRST;

  let wideVw = 0;
  let narrow = false;
  function draw() {
    if (pic) {
      preset = pic.current();
      pic.destroy();
    }
    // the frame takes the wide picture's width plus its own padding and edge, the text the rest of 1280
    wideVw = wideWidth(stage);
    wrap.style.setProperty('--ba-pic', `${wideVw + 66}fr`);
    wrap.style.setProperty('--ba-text', `${1280 - 44 - wideVw - 66}fr`);
    wrap.style.setProperty('--ba-own', `${wideVw}px`);
    narrow = !fitsWide(frame, wideVw, 'ba-narrow');
    pic = picture(stage, sw, narrow, preset);
  }
  /** @param {MouseEvent} e */
  function choose(e) {
    const b = /** @type {HTMLButtonElement} */ (e.currentTarget);
    const id = /** @type {import('./record.js').PresetId} */ (b.dataset.preset);
    if (!pic || pic.current() === id) return;
    for (const o of buttons) o.setAttribute('aria-pressed', String(o === b));
    pic.set(id, true);
  }
  for (const b of buttons) b.addEventListener('click', choose);
  draw();
  const stopArrive = onArrive(frame, () => pic?.play());
  const stopFonts = onLateFonts(draw);
  const stopWidth = onWidthChange(frame, () => {
    if (!fitsWide(frame, wideVw, 'ba-narrow') !== narrow) draw();
  });
  return {
    destroy() {
      for (const b of buttons) b.removeEventListener('click', choose);
      stopWidth();
      stopArrive();
      stopFonts();
      pic?.destroy();
    },
  };
}
