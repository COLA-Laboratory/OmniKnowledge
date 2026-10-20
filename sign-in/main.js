/**
 * The sign-in page's entry: chooses the auth client, starts the form, grows the picture, and goes
 * on to `next` once the reader is signed in. The form starts at once, the picture once the
 * stylesheets are in; each starts on its own, and one that fails is logged while the other
 * works. Sets data-ready on <html> once both were tried.
 *
 * The page ships the demo client (sign-in/auth-demo.js); the app's own client replaces that one
 * import.
 */
import { growNetwork } from '../kit/network-growth.js';
import { stylesReady } from '../kit/tokens.js';
import { demoClient } from './auth-demo.js';
import { createFlow, destination } from './flow.js';
import { formView } from './view.js';
import { NETWORK } from './network.data.js';

const params = new URLSearchParams(location.search);

/**
 * Runs one part of the page, logging a failure instead of passing it on.
 *
 * @param {string} name
 * @param {() => void} start
 */
function isolated(name, start) {
  try {
    start();
  } catch (error) {
    console.error(`sign-in: the ${name} failed:`, error);
  }
}

isolated('form', () => {
  const flow = createFlow(demoClient());
  const root = document.querySelector('.si-form');
  if (!root) throw new Error('no .si-form');
  formView(root, flow);
  let leaving = false;
  flow.subscribe((state) => {
    if (state.step !== 'done' || leaving) return;
    leaving = true;
    location.assign(destination(params.get('next'), location.origin));
  });
});

await stylesReady();
isolated('picture', () => {
  const svg = document.querySelector('#si-network');
  if (!(svg instanceof SVGSVGElement)) throw new Error('no #si-network');
  growNetwork(svg, { layout: NETWORK });
});

document.documentElement.dataset.ready = 'true';
