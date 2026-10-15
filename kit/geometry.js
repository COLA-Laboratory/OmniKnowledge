/** Plane geometry shared by the drawings and the layout generator. */

/** @typedef {{ x: number, y: number }} Point */
/** @typedef {{ x: number, y: number, r: number }} Circle */

/**
 * Returns the mean of the points, summed in order.
 *
 * @param {Point[]} points
 * @returns {Point}
 */
export function centroid(points) {
  let x = 0;
  let y = 0;
  for (const p of points) {
    x += p.x / points.length;
    y += p.y / points.length;
  }
  return { x, y };
}

/**
 * Returns a circle that holds every circle given, close to the smallest.
 *
 * Walks from `start` towards the farthest circle in shrinking steps (600 of them), which is
 * exact enough for a ground drawn behind a topic. The result depends on `start`.
 *
 * @param {Circle[]} circles
 * @param {Point} [start] Where the walk begins; the origin by default.
 * @returns {Circle}
 */
export function enclosingCircle(circles, start = { x: 0, y: 0 }) {
  let { x, y } = start;
  let far = circles[0];
  let reach = -1;
  const farthest = () => {
    reach = -1;
    for (const c of circles) {
      const d = Math.hypot(c.x - x, c.y - y) + c.r;
      if (d > reach) {
        reach = d;
        far = c;
      }
    }
  };
  for (let it = 1; it <= 600; it++) {
    farthest();
    x += (far.x - x) / (it + 1);
    y += (far.y - y) / (it + 1);
  }
  farthest();
  return { x, y, r: reach };
}
