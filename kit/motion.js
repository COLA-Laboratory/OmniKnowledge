/**
 * Motion: whether pictures move at all, the reveal a picture plays when it arrives, and the
 * moment it arrives.
 *
 * The finished picture is always the DOM; a reveal only lays animations over it. The page is
 * still with ?still=1 or while the reader prefers reduced motion; the preference is followed when
 * it changes, and every reveal then stops at its finished state. No automatic reveal lasts longer
 * than REVEAL_LIMIT: a longer one is compressed, keeping its order and proportions.
 */
import { token } from './tokens.js';

/** The longest an automatic reveal may run, in ms. */
export const REVEAL_LIMIT = 4500;

/** @type {{ forced: boolean, query: MediaQueryList } | null} */
let preference = null;
/** @type {Set<() => void>} */
const onStillCalls = new Set();

/** Reads the preference once and starts following it. */
function prefs() {
  if (!preference) {
    const p = {
      forced: new URLSearchParams(location.search).has('still'),
      query: matchMedia('(prefers-reduced-motion: reduce)'),
    };
    p.query.addEventListener('change', () => {
      if (isStill()) for (const call of [...onStillCalls]) call();
    });
    preference = p;
  }
  return preference;
}

/**
 * Returns true while pictures must show their finished state at once.
 *
 * @returns {boolean}
 */
export function isStill() {
  const p = prefs();
  return p.forced || p.query.matches;
}

/**
 * Calls fn whenever the page becomes still (the reader turns on reduced motion).
 *
 * @param {() => void} fn
 * @returns {() => void} Stops the calls.
 */
export function onStill(fn) {
  prefs();
  onStillCalls.add(fn);
  return () => onStillCalls.delete(fn);
}

/**
 * The reveal of one picture: animations laid over its finished state. Nothing is added while the
 * page is still.
 *
 * @typedef {object} Reveal
 * @property {(e: Element, frames: Keyframe[], delay?: number, duration?: number, easing?: string) => Animation | null} from
 *   Animates e from the first frame to its own state, holding the first frame through the delay.
 * @property {(e: Element, delay?: number, duration?: number) => Animation | null} fade Fades e in.
 * @property {(e: Element, delay?: number, duration?: number) => Animation | null} arrive Fades e in as it rises 6 px.
 * @property {(e: Element, delay?: number, duration?: number) => Animation | null} stroke Draws a
 *   path from its start; the path needs pathLength="1".
 * @property {(a: Animation) => Animation} add Takes an animation made elsewhere into the reveal.
 * @property {() => Animation[]} animations The animations taken so far.
 * @property {(limit?: number) => number} fit Compresses the animations taken so far so that the
 *   last ends by limit ms; returns the factor applied to every delay and duration (1 when none).
 * @property {() => void} cancel Ends every animation, leaving the finished state.
 */

/** @type {Set<Reveal>} */
const live = new Set();

/**
 * Returns a new reveal.
 *
 * @returns {Reveal}
 */
export function reveal() {
  /** @type {Animation[]} */
  let anims = [];
  /** @type {Reveal} */
  const rv = {
    from(e, frames, delay = 0, duration = 420, easing = token('ease')) {
      if (isStill()) return null;
      return rv.add(e.animate(frames, { delay, duration, easing, fill: 'backwards' }));
    },
    fade: (e, delay, duration = 420) => rv.from(e, [{ opacity: 0 }, { opacity: 1 }], delay, duration),
    arrive: (e, delay, duration = 420) =>
      rv.from(
        e,
        [
          { opacity: 0, transform: 'translateY(6px)' },
          { opacity: 1, transform: 'translateY(0)' },
        ],
        delay,
        duration,
      ),
    stroke(e, delay, duration) {
      /** @type {SVGElement} */ (e).style.strokeDasharray = '1';
      return rv.from(e, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], delay, duration);
    },
    add(a) {
      anims.push(a);
      live.add(rv);
      return a;
    },
    animations: () => anims.slice(),
    fit(limit = REVEAL_LIMIT) {
      const end = Math.max(0, ...anims.map((a) => (a.effect ? a.effect.getComputedTiming().endTime : 0)).map(Number));
      if (end <= limit) return 1;
      const k = limit / end;
      for (const a of anims) {
        const t = a.effect?.getTiming();
        if (t) a.effect?.updateTiming({ delay: Number(t.delay ?? 0) * k, duration: Number(t.duration) * k });
      }
      return k;
    },
    cancel() {
      for (const a of anims) a.cancel();
      anims = [];
      live.delete(rv);
    },
  };
  return rv;
}

onStill(() => {
  for (const rv of [...live]) rv.cancel();
});

/** @type {Set<() => void>} */
const waiting = new Set();
onStill(() => {
  for (const arrive of [...waiting]) arrive();
});

/**
 * Calls fn once, the first time a third of el is in the window; at once while the page is still.
 *
 * @param {Element} el
 * @param {() => void} fn
 * @returns {() => void} Stops waiting; fn is then never called.
 */
export function onArrive(el, fn) {
  if (isStill() || !('IntersectionObserver' in window)) {
    fn();
    return () => {};
  }
  const io = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) arrive();
    },
    { threshold: 0.3 },
  );
  const stop = () => {
    io.disconnect();
    waiting.delete(arrive);
  };
  function arrive() {
    stop();
    fn();
  }
  waiting.add(arrive);
  io.observe(el);
  return stop;
}

/**
 * Returns the page's easing (the token --ease) as a function of progress, for motion driven
 * frame by frame.
 *
 * @returns {(t: number) => number}
 */
export function easing() {
  const [x1, y1, x2, y2] = (token('ease').match(/-?[\d.]+/g) ?? []).map(Number);
  return (t) => {
    let u = t;
    for (let i = 0; i < 8; i++) {
      const x = 3 * (1 - u) * (1 - u) * u * x1 + 3 * (1 - u) * u * u * x2 + u * u * u - t;
      const dx = 3 * (1 - u) * (1 - u) * x1 + 6 * (1 - u) * u * (x2 - x1) + 3 * u * u * (1 - x2);
      if (Math.abs(dx) < 1e-6) break;
      u -= x / dx;
    }
    return 3 * (1 - u) * (1 - u) * u * y1 + 3 * (1 - u) * u * u * y2 + u * u * u;
  };
}
