/**
 * Choosing a picture's composition by the width of its frame, so that its text stays readable.
 *
 * A picture is drawn across its frame's content box and scales with it, text included. Its wide
 * composition stands only while its smallest text (SMALLEST_TEXT units, README.md "Type") is drawn
 * at MIN_TEXT px or more; otherwise its narrow composition takes over. The frame decides, not the
 * window, so a picture behaves the same in a narrow panel of a wide page.
 */

/** The smallest size, in CSS px, a picture's text may be drawn at. */
export const MIN_TEXT = 11;
/** The size, in a picture's own units, of the smallest text it sets. */
export const SMALLEST_TEXT = 12.5;

/**
 * Returns whether the wide composition, `width` units wide, fits the frame, and marks the frame.
 *
 * The frame is measured as it is with the wide composition in it (without `narrowClass`), and
 * leaves carrying `narrowClass` (and the kit's k-narrow, which sets the narrow type) when the
 * narrow one must stand instead.
 *
 * @param {HTMLElement} frame
 * @param {number} width The wide composition's width in its own units.
 * @param {string} narrowClass The class the frame carries while the narrow composition stands in it.
 * @returns {boolean}
 */
export function fitsWide(frame, width, narrowClass) {
  frame.classList.remove(narrowClass, 'k-narrow');
  const style = getComputedStyle(frame);
  const content = frame.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
  const wide = (content * SMALLEST_TEXT) / width >= MIN_TEXT;
  frame.classList.toggle(narrowClass, !wide);
  frame.classList.toggle('k-narrow', !wide);
  return wide;
}

/**
 * Calls fn, in the next frame, whenever the element's width changes.
 *
 * @param {Element} el
 * @param {() => void} fn
 * @returns {() => void} Stops watching.
 */
export function onWidthChange(el, fn) {
  let last = el.getBoundingClientRect().width;
  let frame = 0;
  const watch = new ResizeObserver((entries) => {
    const width = entries[entries.length - 1].borderBoxSize?.[0]?.inlineSize ?? el.getBoundingClientRect().width;
    if (width === last) return;
    last = width;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(fn);
  });
  watch.observe(el);
  return () => {
    watch.disconnect();
    cancelAnimationFrame(frame);
  };
}
