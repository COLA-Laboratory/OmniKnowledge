/**
 * The first picture: the 3 px line joins the question, the searches, the filters, the map of the
 * kept papers and the four tasks that rest on it. It has two compositions, wide (wide.js) and
 * tall (tall.js); the width of its frame picks one (kit/fit.js). The finished picture is the DOM;
 * the reveal is laid over it.
 */
import { fitsWide, isStill, onStill, onWidthChange, reveal } from '../../kit/index.js';
import * as wide from './wide.js';
import * as tall from './tall.js';

/** @type {ReturnType<typeof wide.place> | null} */
let widePlan = null;
/** @type {ReturnType<typeof tall.place> | null} */
let tallPlan = null;
const planWide = () => (widePlan ??= wide.place());
const planTall = () => (tallPlan ??= tall.place());

/**
 * Gives the picture and its frame the box of one composition; the wide one is the page's own.
 *
 * @param {SVGSVGElement} pic
 * @param {boolean} isTall
 */
function box(pic, isTall) {
  const frame = /** @type {HTMLElement} */ (pic.parentElement);
  frame.classList.toggle('hr-tall', isTall);
  if (isTall) {
    pic.setAttribute('viewBox', `0 0 ${tall.WIDTH} ${planTall().h}`);
    pic.style.aspectRatio = `${tall.WIDTH} / ${planTall().h}`;
  } else {
    pic.setAttribute('viewBox', `0 0 ${wide.WIDTH} ${wide.HEIGHT}`);
    pic.style.removeProperty('aspect-ratio');
    if (!pic.getAttribute('style')) pic.removeAttribute('style');
  }
}

/**
 * Calls fn once, when the part of the picture that begins at `share` of its height has come
 * above the window's lower fifth.
 *
 * @param {Element} pic
 * @param {number} share
 * @param {() => void} fn
 * @returns {() => void} Stops waiting.
 */
function inView(pic, share, fn) {
  const off = () => {
    window.removeEventListener('scroll', check);
    window.removeEventListener('resize', check);
  };
  function check() {
    const b = pic.getBoundingClientRect();
    if (b.top + b.height * share < window.innerHeight * 0.8) {
      off();
      fn();
    }
  }
  window.addEventListener('scroll', check, { passive: true });
  window.addEventListener('resize', check);
  check();
  return off;
}

/** @param {HTMLElement} root */
const pictureOf = (root) => /** @type {SVGSVGElement} */ (root.querySelector('#hero-pic'));

/**
 * Returns true when the frame is too narrow for the wide composition.
 *
 * @param {SVGSVGElement} pic
 */
const wantsTall = (pic) => !fitsWide(/** @type {HTMLElement} */ (pic.parentElement), wide.WIDTH, 'hr-tall');

/**
 * Gives the picture the box of the composition its frame asks for, before the typeface is in.
 *
 * @param {HTMLElement} root
 */
export function prepare(root) {
  const pic = pictureOf(root);
  box(pic, wantsTall(pic));
}

/**
 * Draws the first picture and reveals it.
 *
 * @param {HTMLElement} root The figure.
 */
export function mount(root) {
  const pic = pictureOf(root);
  const upper = reveal();
  const lower = reveal();
  let stopWaiting = () => {};
  let timer = 0;

  /** Ends every animation and every wait, so that the DOM alone shows. */
  function settle() {
    stopWaiting();
    clearTimeout(timer);
    upper.cancel();
    lower.cancel();
  }

  /** Draws the composition the frame asks for in place of whatever stands there, and reveals it. */
  function render() {
    const isTall = wantsTall(pic);
    settle();
    box(pic, isTall);
    if (!isTall) {
      const d = wide.draw(pic, planWide());
      if (!isStill()) wide.play(upper, d);
      return;
    }
    const L = planTall();
    const d = tall.draw(pic, L);
    if (isStill()) return;
    // the map and the tasks wait, paused, until the map is in the window and the line has reached it
    const begun = performance.now();
    const reached = tall.play(upper, lower, d);
    const parts = lower.animations();
    for (const a of parts) a.pause();
    stopWaiting = inView(pic, L.top / L.h, () => {
      timer = window.setTimeout(() => parts.forEach((a) => a.play()), Math.max(0, begun + reached - performance.now()));
    });
  }

  render();
  let drawnTall = !!pic.parentElement?.classList.contains('hr-tall');
  const stopWidth = onWidthChange(/** @type {Element} */ (pic.parentElement), () => {
    if (wantsTall(pic) === drawnTall) return;
    drawnTall = !drawnTall;
    render();
  });
  const stopStill = onStill(settle);
  return {
    destroy() {
      stopWidth();
      stopStill();
      settle();
    },
  };
}
