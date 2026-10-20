/**
 * The sign-in form's view: renders a flow state into the page's two forms (sign-in/index.html)
 * and hands the reader's actions to the flow. It owns the words that depend on the state and
 * where focus goes; it does not know which auth client the flow talks to.
 */
import { BUSY, resendIn } from './flow.js';

/**
 * Writes a duration in whole minutes, rounded up: "10 minutes", "1 minute".
 *
 * @param {number} seconds
 */
export const minutes = (seconds) => {
  const m = Math.max(1, Math.ceil(seconds / 60));
  return `${m} ${m === 1 ? 'minute' : 'minutes'}`;
};

/**
 * Writes a countdown as minutes and seconds: 30 becomes "0:30".
 *
 * @param {number} seconds
 */
export const clock = (seconds) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

/**
 * Returns the error a state shows under its form, or '' for none.
 *
 * @param {import('./flow.js').State} state
 */
export function errorText(state) {
  switch (state.step) {
    case 'wrong':
      return `That code doesn't match. You have ${state.triesLeft} ${state.triesLeft === 1 ? 'try' : 'tries'} left.`;
    case 'expired':
      return 'That code has expired. Ask for a new one.';
    case 'limited':
      return `Too many attempts. Try again in ${minutes(state.retryAfterS)}.`;
    default:
      return '';
  }
}

/**
 * Finds an element of the page by id.
 *
 * @template {HTMLElement} T
 * @param {ParentNode} root
 * @param {string} id
 * @param {new () => T} type
 * @returns {T}
 * @throws {Error} When the page has no such element.
 */
function part(root, id, type) {
  const el = root.querySelector(`#${id}`);
  if (!(el instanceof type)) throw new Error(`sign-in/view: no #${id}`);
  return el;
}

/**
 * Renders the flow into root and passes the reader's actions to it.
 *
 * @param {ParentNode} root The element holding both forms.
 * @param {import('./flow.js').Flow} flow
 * @returns {{ destroy(): void }} Stops rendering and listening.
 */
export function formView(root, flow) {
  const steps = { email: part(root, 'si-step-email', HTMLElement), code: part(root, 'si-step-code', HTMLElement) };
  const forms = { email: part(root, 'si-email-form', HTMLFormElement), code: part(root, 'si-code-form', HTMLFormElement) };
  const fields = { email: part(root, 'si-email', HTMLInputElement), code: part(root, 'si-code', HTMLInputElement) };
  const submits = { email: part(root, 'si-email-send', HTMLButtonElement), code: part(root, 'si-code-send', HTMLButtonElement) };
  const errors = { email: part(root, 'si-email-error', HTMLElement), code: part(root, 'si-code-error', HTMLElement) };
  const sentTo = part(root, 'si-sent-to', HTMLElement);
  const expires = part(root, 'si-expires', HTMLElement);
  const wait = part(root, 'si-wait', HTMLElement);
  const seconds = part(root, 'si-seconds', HTMLElement);
  const resend = part(root, 'si-resend', HTMLButtonElement);
  const change = part(root, 'si-change-email', HTMLButtonElement);

  /** @type {import('./flow.js').State | null} */
  let shown = null;

  /**
   * @param {HTMLElement} el
   * @param {string} name
   * @param {boolean} on
   */
  const flag = (el, name, on) => (on ? el.setAttribute(name, 'true') : el.removeAttribute(name));

  /** @param {import('./flow.js').State} s @param {number} now */
  function render(s, now) {
    const was = shown;
    shown = s;
    steps.email.hidden = s.form !== 'email';
    steps.code.hidden = s.form !== 'code';
    const busy = BUSY.includes(s.step);
    for (const form of /** @type {const} */ (['email', 'code'])) {
      const working = busy && s.form === form;
      flag(submits[form], 'aria-busy', working);
      flag(submits[form], 'aria-disabled', working);
      const text = s.form === form ? errorText(s) : '';
      if (errors[form].textContent !== text) errors[form].textContent = text;
    }
    flag(fields.code, 'aria-invalid', s.step === 'wrong' || s.step === 'expired');
    sentTo.textContent = s.email;
    expires.textContent = minutes(s.expiresInS);
    const left = resendIn(s, now);
    wait.hidden = left === 0;
    seconds.textContent = clock(left);
    resend.hidden = left > 0;
    flag(resend, 'aria-disabled', busy);
    flag(change, 'aria-disabled', busy);

    // a new code empties the code field
    if (s.step === 'code' && was?.step === 'sending') fields.code.value = '';
    // focus goes to the field of a form that appears, and back to the code after an answer about it
    if (!was || was.form !== s.form) fields[s.form].focus();
    else if (s.form === 'code' && (was.step === 'verifying' || was.step === 'sending') && !busy) fields.code.focus();
  }

  /** @param {Promise<void>} work */
  const report = (work) => work.catch((error) => console.error('sign-in:', error));
  /** @type {[EventTarget, string, (e: Event) => void][]} */
  const listeners = [
    [
      forms.email,
      'submit',
      (e) => {
        e.preventDefault();
        report(flow.sendCode(fields.email.value.trim()));
      },
    ],
    [
      forms.code,
      'submit',
      (e) => {
        e.preventDefault();
        report(flow.verify(fields.code.value));
      },
    ],
    [
      fields.code,
      'input',
      () => {
        const digits = fields.code.value.replace(/\D/g, '').slice(0, 6);
        if (digits !== fields.code.value) fields.code.value = digits;
        flow.edit();
      },
    ],
    [resend, 'click', () => report(flow.resend())],
    [change, 'click', () => flow.changeEmail()],
  ];
  for (const [target, type, fn] of listeners) target.addEventListener(type, fn);
  const unsubscribe = flow.subscribe(render);

  return {
    destroy() {
      unsubscribe();
      for (const [target, type, fn] of listeners) target.removeEventListener(type, fn);
    },
  };
}
