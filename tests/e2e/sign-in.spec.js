// The sign-in page with its demo client: every state renders without overflow or error, the whole
// flow works with a pointer and with the keyboard alone, and the network grows within 4.5 s, as
// fades only under reduced motion, into the same finished picture as in still mode.
import { expect, test } from '@playwright/test';
import { problems } from './helpers.js';
import { EMAIL, PATH, RIGHT, SIZES, STATES, WRONG, open, rest } from '../../tools/sign-in-states.mjs';

/** The longest the growth may run (kit/motion.js), with a frame's grace. */
const LIMIT = 4500 + 20;

/** The words each state shows under its form, if any. */
const SAYS = /** @type {Record<string, string>} */ ({
  wrong: "That code doesn't match. You have 4 tries left.",
  'wrong-last': "That code doesn't match. You have 1 try left.",
  expired: 'That code has expired. Ask for a new one.',
  limited: 'Too many attempts. Try again in 60 minutes.',
});

/** @param {import('@playwright/test').Page} page */
const overflow = (page) => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

for (const [width, height] of SIZES)
  test(`every state renders without overflow or error at ${width}`, async ({ context }) => {
    for (const state of STATES) {
      const page = await context.newPage();
      const seen = problems(page);
      await page.setViewportSize({ width, height });
      await open(page, '');
      await state.enter(page);
      await rest(page);
      expect(await overflow(page), state.name).toBe(0);
      const error = page.locator('.field-error:visible');
      if (SAYS[state.name]) await expect(error, state.name).toHaveText(SAYS[state.name]);
      else await expect(error, state.name).toHaveCount(0);
      expect(seen, state.name).toEqual([]);
      await page.close();
    }
  });

test('the page is not indexed and draws the whole network', async ({ page }) => {
  const seen = problems(page);
  await page.goto(`${PATH}?still=1`);
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('meta[name=robots]')).toHaveAttribute('content', 'noindex');
  await expect(page.locator('#si-network .dot')).toHaveCount(126);
  await expect(page.locator('#si-network .ring')).toHaveCount(2);
  expect(seen).toEqual([]);
});

test('email, code, a wrong code, then the right one, and on to next', async ({ page }) => {
  const seen = problems(page);
  await page.goto(`${PATH}?next=/OmniKnowledge/%3Fstill=1`);
  const email = page.locator('#si-email');
  await expect(email).toBeFocused();
  await email.fill(EMAIL);
  const send = page.locator('#si-email-send');
  const box = await send.boundingBox();
  await send.click();
  await expect(send).toHaveAttribute('aria-busy', 'true');
  expect(await send.boundingBox()).toEqual(box);
  const code = page.locator('#si-code');
  await expect(code).toBeFocused();
  await expect(page.locator('#si-code-lede')).toHaveText(`We sent a 6-digit code to ${EMAIL}. It expires in 10 minutes.`);
  await expect(page.locator('#si-wait')).toHaveText(/^Resend code in 0:(30|29|28)$/);
  await expect(page.locator('#si-resend')).toBeHidden();

  await code.fill(WRONG);
  await page.locator('#si-code-send').click();
  await expect(page.locator('#si-code-send')).toHaveAttribute('aria-busy', 'true');
  await expect(page.locator('#si-code-error')).toHaveText(SAYS.wrong);
  await expect(page.locator('#si-code-error')).toHaveAttribute('role', 'alert');
  await expect(code).toHaveAttribute('aria-invalid', 'true');
  await expect(code).toBeFocused();
  await code.fill('12');
  await expect(page.locator('#si-code-error')).toBeHidden();
  await expect(code).not.toHaveAttribute('aria-invalid', 'true');

  await code.fill(RIGHT);
  await page.locator('#si-code-send').click();
  await page.waitForURL(/\/OmniKnowledge\/\?still=1$/);
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
  expect(seen).toEqual([]);
});

test('the code field takes digits only', async ({ page }) => {
  await page.goto(`${PATH}?still=1`);
  await page.locator('#si-email').fill(EMAIL);
  await page.keyboard.press('Enter');
  const code = page.locator('#si-code');
  await expect(code).toBeFocused();
  await code.pressSequentially('12 3-4a56');
  await expect(code).toHaveValue('123456');
});

test('the countdown runs out into a resend, which starts it again', async ({ page }) => {
  await open(page, '');
  await STATES.find((s) => s.name === 'code')?.enter(page);
  await expect(page.locator('#si-wait')).toHaveText('Resend code in 0:30');
  await page.clock.runFor(1000);
  await expect(page.locator('#si-wait')).toHaveText('Resend code in 0:29');
  await page.clock.runFor(29_000);
  await expect(page.locator('#si-wait')).toBeHidden();
  await page.locator('#si-resend').click();
  await page.clock.runFor(700);
  await expect(page.locator('#si-wait')).toHaveText('Resend code in 0:30');
  await expect(page.locator('#si-code')).toBeFocused();
});

test('the keyboard alone signs in, by way of a different email', async ({ page, browserName }) => {
  const seen = problems(page);
  // Safari moves focus to buttons and links with Option-Tab
  const tab = browserName === 'webkit' ? 'Alt+Tab' : 'Tab';
  await page.goto(`${PATH}?still=1&next=/OmniKnowledge/%3Fstill=1`);
  await expect(page.locator('#si-email')).toBeFocused();
  await page.keyboard.type('someone@else.org');
  await page.keyboard.press('Enter');
  await expect(page.locator('#si-code')).toBeFocused();
  await page.keyboard.type(WRONG);
  await page.keyboard.press('Enter');
  await expect(page.locator('#si-code-error')).toHaveText(SAYS.wrong);
  await expect(page.locator('#si-code')).toBeFocused();
  await page.keyboard.press(tab);
  await expect(page.locator('#si-code-send')).toBeFocused();
  await page.keyboard.press(tab);
  await expect(page.locator('#si-change-email')).toBeFocused();
  await page.keyboard.press('Enter');
  const email = page.locator('#si-email');
  await expect(email).toBeFocused();
  await expect(email).toHaveValue('someone@else.org');
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.type(EMAIL);
  await page.keyboard.press('Enter');
  await expect(page.locator('#si-code')).toBeFocused();
  await expect(page.locator('#si-sent-to')).toHaveText(EMAIL);
  await page.keyboard.type(RIGHT);
  await page.keyboard.press('Enter');
  await page.waitForURL(/\/OmniKnowledge\/\?still=1$/);
  expect(seen).toEqual([]);
});

/**
 * Returns the growth's animations once they have started: what each animates and when it ends,
 * in ms from the first one's start.
 *
 * @param {import('@playwright/test').Page} page
 */
async function growth(page) {
  const read = () => {
    const anims = document.getAnimations().filter((a) => {
      const target = /** @type {KeyframeEffect | null} */ (a.effect)?.target;
      return target instanceof Element && !!target.closest('#si-network');
    });
    const start = Math.min(...anims.map((a) => Number(a.startTime ?? 0)));
    return anims.map((a) => ({
      props: [
        ...new Set(
          /** @type {KeyframeEffect} */ (a.effect)
            .getKeyframes()
            .flatMap((k) => Object.keys(k).filter((p) => !['offset', 'easing', 'composite', 'computedOffset'].includes(p))),
        ),
      ],
      end: Number(a.startTime ?? 0) - start + Number(a.effect?.getComputedTiming().endTime ?? 0),
    }));
  };
  await expect.poll(() => page.evaluate(read).then((anims) => anims.length)).toBeGreaterThan(0);
  // the start times are set on the next frame
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  return page.evaluate(read);
}

/**
 * Captures the picture as a fresh paint draws it. Chromium may keep raster tiles from the motion
 * that differ from a fresh paint by a few anti-aliased pixels; hiding the picture for a frame
 * discards them.
 *
 * @param {import('@playwright/test').Page} page
 */
async function picture(page) {
  await page.locator('#si-network').evaluate(async (svg) => {
    const frame = () => new Promise((r) => requestAnimationFrame(r));
    /** @type {SVGSVGElement} */ (svg).style.display = 'none';
    await frame();
    /** @type {SVGSVGElement} */ (svg).style.display = '';
    await frame();
    await frame();
  });
  return page.locator('#si-network').screenshot();
}

/**
 * Waits for the growth to end and captures the picture.
 *
 * @param {import('@playwright/test').Page} page
 */
async function finished(page) {
  await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => undefined))));
  return picture(page);
}

test('the network grows within 4.5 s into the still picture', async ({ page }) => {
  const seen = problems(page);
  await page.goto(`${PATH}?still=1`);
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
  const still = await picture(page);
  await page.goto(PATH);
  const anims = await growth(page);
  expect(anims.length).toBe(169 + 128);
  expect(anims.some((a) => a.props.includes('transform'))).toBe(true);
  expect(anims.some((a) => a.props.includes('strokeDashoffset'))).toBe(true);
  expect(Math.max(...anims.map((a) => a.end))).toBeLessThanOrEqual(LIMIT);
  expect((await finished(page)).equals(still)).toBe(true);
  expect(seen).toEqual([]);
});

test('under reduced motion the network only fades in, and ends as the finished network', async ({ page }) => {
  await page.goto(`${PATH}?still=1`);
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
  const still = await picture(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(PATH);
  const anims = await growth(page);
  expect(anims.length).toBeGreaterThan(0);
  for (const a of anims) expect(a.props).toEqual(['opacity']);
  expect(Math.max(...anims.map((a) => a.end))).toBeLessThanOrEqual(LIMIT);
  expect((await finished(page)).equals(still)).toBe(true);
});

test('turning on reduced motion while it grows shows the finished network at once', async ({ page }) => {
  await page.goto(`${PATH}?still=1`);
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
  const still = await picture(page);
  await page.goto(PATH);
  await growth(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForTimeout(100);
  expect(await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length)).toBe(0);
  expect((await picture(page)).equals(still)).toBe(true);
});

test('the back link and the brand lead to the website', async ({ page }) => {
  await page.goto(`${PATH}?still=1`);
  for (const link of [page.locator('.nav-back'), page.locator('.site-header .brand')])
    expect(new URL(String(await link.getAttribute('href')), page.url()).pathname).toBe('/OmniKnowledge/');
});
