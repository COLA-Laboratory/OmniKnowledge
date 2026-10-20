/**
 * The states a reader can put the sign-in page in, and the sizes it is checked at. One list,
 * shared by the capture tool (tools/sign-in-shots.mjs) and the end-to-end tests (tests/e2e).
 *
 * Each state is reached by driving the form as a reader would, against the demo client, on a page
 * whose clock Playwright holds: the client's answers and the countdown move only when a state
 * advances the clock, so a waiting button can be caught and the countdown run out.
 */

/** The page, relative to the site's root. */
export const PATH = 'sign-in/';

/** The window sizes every state is captured at: a desktop and a phone. */
export const SIZES = /** @type {const} */ ([
  [1440, 900],
  [390, 844],
]);

/** The address and the wrong code the states type. */
export const EMAIL = 'a.researcher@ox.ac.uk';
export const WRONG = '481207';
export const RIGHT = '123456';

/** Longer than the demo client takes to answer (sign-in/auth-demo.js). */
const ANSWER = 700;

/** @typedef {import('@playwright/test').Page} Page */

/**
 * Opens the page with its clock held, in still mode, at the email form.
 *
 * @param {Page} page
 * @param {string} base The site's root URL, with its slash.
 */
export async function open(page, base) {
  await page.clock.install();
  await page.goto(`${base}${PATH}?still=1`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => document.documentElement.dataset.ready === 'true' && document.fonts.status === 'loaded');
}

/** @param {Page} page */
async function askForCode(page) {
  await page.locator('#si-email').fill(EMAIL);
  await page.locator('#si-email-send').click();
}

/** @param {Page} page */
async function atCode(page) {
  await askForCode(page);
  await page.clock.runFor(ANSWER);
}

/** @param {Page} page @param {string} code */
async function tryCode(page, code) {
  await page.locator('#si-code').fill(code);
  await page.locator('#si-code-send').click();
  await page.clock.runFor(ANSWER);
}

/** @type {{ name: string, enter: (page: Page) => Promise<void> }[]} */
export const STATES = [
  { name: 'email', enter: async () => {} },
  { name: 'sending', enter: askForCode },
  { name: 'code', enter: atCode },
  {
    name: 'verifying',
    enter: async (page) => {
      await atCode(page);
      await page.locator('#si-code').fill(WRONG);
      await page.locator('#si-code-send').click();
    },
  },
  {
    name: 'wrong',
    enter: async (page) => {
      await atCode(page);
      await tryCode(page, WRONG);
    },
  },
  {
    name: 'wrong-last',
    enter: async (page) => {
      await atCode(page);
      for (let i = 0; i < 4; i++) await tryCode(page, WRONG);
    },
  },
  {
    name: 'expired',
    enter: async (page) => {
      await atCode(page);
      for (let i = 0; i < 5; i++) await tryCode(page, WRONG);
    },
  },
  {
    name: 'resend',
    enter: async (page) => {
      await atCode(page);
      await page.clock.runFor(31_000);
    },
  },
  {
    name: 'limited',
    enter: async (page) => {
      for (let i = 0; i < 6; i++) {
        if (i) await page.locator('#si-change-email').click();
        await atCode(page);
      }
    },
  },
];

/**
 * Moves the pointer off the page and waits out the hover's fade, so no hover enters a capture.
 * The fade is a CSS transition, which runs on real time rather than on the held clock.
 *
 * @param {Page} page
 */
export async function rest(page) {
  await page.mouse.move(0, 0);
  await page.clock.runFor(50);
  await page.waitForTimeout(300);
}
