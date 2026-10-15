/**
 * The Knowledge section: the map of the kept papers and the four tasks (picture.js), the switch
 * between the map's two views, and the rotation that chooses the next task by itself, round the
 * four, until the reader chooses one. A frame wide enough (kit/fit.js) shows the four task cards
 * in a row, each pressed through a button laid over it; a narrow one shows the chosen card alone,
 * with the four names under it.
 */
import { EXAMPLE, fitsWide, isStill, onArrive, onLateFonts, onStill, onWidthChange } from '../../kit/index.js';
import { TALL, WIDE } from './arrangements.js';
import { Picture } from './picture.js';
import { TASKS } from './tasks.js';

const DWELL = 6000; // how long a finished reading stands before the next task is chosen by itself, ms
const QUIET = 20000; // how long the rotation waits after the reader switches the map, ms

/**
 * Draws the picture, follows the switches and runs the rotation.
 *
 * The rotation chooses the next task DWELL after a reading has finished. It waits while the part
 * of the map that starts the first reading (ka-seen) is out of the window, the tab is hidden or
 * keyboard focus is inside the frame, and for DWELL after each of these ends and after the
 * pointer last moved or pressed over the frame (a pointer that only rests there does not hold
 * it); it waits for QUIET after the reader switches the map, and ends for good once the reader
 * chooses a task or the page becomes still.
 *
 * @param {HTMLElement} root
 */
export function mount(root) {
  const frame = /** @type {HTMLElement} */ (root.querySelector('.ka'));
  const seen = /** @type {HTMLElement} */ (frame.querySelector('.ka-seen'));
  const stage = /** @type {HTMLElement} */ (frame.querySelector('.ka-stage'));
  const views = /** @type {HTMLButtonElement[]} */ ([...frame.querySelectorAll('.ka-top button[data-view]')]);
  const picks = /** @type {HTMLButtonElement[]} */ ([...frame.querySelectorAll('.ka-pick button[data-k]')]);
  /** @type {{ view: 'net' | 'sem', task: number, arrived: boolean }} */
  const state = { view: 'net', task: 0, arrived: isStill() };
  /** @type {ReturnType<typeof Picture> | null} */
  let pic = null;
  /** @type {typeof WIDE | null} */
  let G = null;
  /** @type {HTMLButtonElement[]} */
  let hits = [];
  /** @param {boolean} on */
  const waiting = (on) => frame.classList.toggle('ka-wait', on);

  /* ---------- the rotation: turn.at is the earliest moment the next task may be chosen ---------- */
  const turn = { on: !isStill() && 'IntersectionObserver' in window, at: 0, timer: 0, seen: false, sx: -1, sy: -1 };
  const held = () => !state.arrived || !turn.seen || document.hidden || !!frame.querySelector(':focus-visible');
  /** @param {number} ms Keeps the rotation from choosing the next task for another ms from now. */
  function defer(ms) {
    if (!turn.on) return;
    turn.at = Math.max(turn.at, performance.now() + ms);
    if (!turn.timer) turn.timer = window.setTimeout(due, turn.at - performance.now());
  }
  /** Chooses the next task when nothing holds the rotation and its moment has come. */
  function due() {
    const left = turn.at - performance.now();
    turn.timer = 0;
    if (!turn.on || held()) return;
    if (left > 0) turn.timer = window.setTimeout(due, left);
    else choose((state.task + 1) % TASKS.length);
  }
  /** @param {PointerEvent} e A pointer that moves or presses over the frame; the page scrolling under a resting pointer is no move. */
  function touched(e) {
    if (e.type === 'pointermove' && e.screenX === turn.sx && e.screenY === turn.sy) return;
    turn.sx = e.screenX;
    turn.sy = e.screenY;
    defer(DWELL);
  }
  /** Starts the wait again when the tab is shown again or focus leaves the frame. */
  function resume() {
    if (!document.hidden) defer(DWELL);
  }
  function end() {
    turn.on = false;
    clearTimeout(turn.timer);
  }

  function pressed() {
    for (const b of [...hits, ...picks]) b.setAttribute('aria-pressed', String(Number(b.dataset.k) === state.task));
  }
  /** @param {number} k Chooses task k and plays its reading; the rotation waits until the reading has stood for DWELL. */
  function choose(k) {
    if (!pic) return;
    state.task = k;
    pressed();
    defer(pic.choose(k) + DWELL);
  }
  /** @param {number} k The reader's own choice: it stands, so the rotation ends. */
  function byHand(k) {
    end();
    choose(k);
  }

  /** @param {boolean} [force] Draws the picture in the arrangement the frame asks for; does nothing while that arrangement stands unless forced. */
  function build(force = false) {
    const next = fitsWide(frame, WIDE.W, 'ka-tall') ? WIDE : TALL;
    if (next === G && !force) return;
    G = next;
    pic?.destroy();
    for (const b of hits) b.remove();
    // the narrow type applies before labels and their markers are measured
    frame.classList.toggle('ka-tall', !!G.tall);
    const g = G;
    hits = TASKS.map((T, k) => {
      const R = g.cards[k];
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'ka-hit';
      b.dataset.k = String(k);
      b.setAttribute('aria-label', `${EXAMPLE.tasks[k]}: ${T.ask}`);
      b.style.cssText = `left:${(R.x / g.W) * 100}%;top:${(R.y / g.H) * 100}%;width:${(R.w / g.W) * 100}%;height:${(R.h / g.H) * 100}%`;
      b.addEventListener('click', () => byHand(k));
      stage.appendChild(b);
      return b;
    });
    pic = Picture(g, g.tall ? 'tall' : 'wide', stage, waiting, state.arrived ? state.task : -1);
    pressed();
    waiting(!state.arrived);
    if (state.view === 'sem') pic.view('sem', true);
    if (state.arrived) choose(state.task);
  }
  /** @param {PointerEvent} e Tells the picture where the pointer stands in it, so that a citation under it and its twin come out. */
  function pointer(e) {
    const box = /** @type {SVGSVGElement} */ (stage.querySelector('svg')).getBoundingClientRect();
    if (state.arrived && pic && G)
      pic.point(((e.clientX - box.left) / box.width) * G.W, ((e.clientY - box.top) / box.height) * G.H);
  }
  function pointerOut() {
    if (state.arrived) pic?.point(-1e9, -1e9);
  }
  /** @param {MouseEvent} e */
  function switchView(e) {
    const b = /** @type {HTMLButtonElement} */ (e.currentTarget);
    for (const o of views) o.setAttribute('aria-pressed', String(o === b));
    state.view = /** @type {'net' | 'sem'} */ (b.dataset.view);
    pic?.view(state.view);
    defer(QUIET);
  }
  /** @param {MouseEvent} e */
  const pick = (e) => byHand(Number(/** @type {HTMLElement} */ (e.currentTarget).dataset.k));

  for (const b of views) b.addEventListener('click', switchView);
  for (const b of picks) b.addEventListener('click', pick);
  stage.addEventListener('pointermove', pointer);
  stage.addEventListener('pointerleave', pointerOut);
  build();
  const stopArrive = onArrive(seen, () => {
    state.arrived = true;
    choose(state.task);
  });
  const rebuild = () => build();
  const stopFonts = onLateFonts(() => build(true));
  const stopStill = onStill(end);
  const stopWidth = onWidthChange(frame, rebuild);
  /** @type {IntersectionObserver | null} */
  let watch = null;
  if (turn.on) {
    watch = new IntersectionObserver(
      (es) => {
        turn.seen = es[es.length - 1].isIntersecting;
        if (turn.seen) defer(DWELL);
      },
      { threshold: 0.3 },
    );
    watch.observe(seen);
    document.addEventListener('visibilitychange', resume);
    frame.addEventListener('focusout', resume);
    frame.addEventListener('pointermove', touched);
    frame.addEventListener('pointerdown', touched);
  }
  return {
    destroy() {
      end();
      watch?.disconnect();
      stopArrive();
      stopFonts();
      stopStill();
      document.removeEventListener('visibilitychange', resume);
      frame.removeEventListener('focusout', resume);
      frame.removeEventListener('pointermove', touched);
      frame.removeEventListener('pointerdown', touched);
      for (const b of views) b.removeEventListener('click', switchView);
      for (const b of picks) b.removeEventListener('click', pick);
      stage.removeEventListener('pointermove', pointer);
      stage.removeEventListener('pointerleave', pointerOut);
      stopWidth();
      pic?.destroy();
      for (const b of hits) b.remove();
    },
  };
}
