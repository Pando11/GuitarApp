// lesson-runner.test.mjs — self-test for the Wave 5B "Sage speaks" gating
// fix (plain check()/counter style — see 07-app/core/drillRunner.test.mjs
// and 07-app/core/coachSurface.test.mjs for the pattern copied here).
//
// Run: node 07-app/core/lesson-runner.test.mjs
//
// This file did not exist before this fix — lesson-runner.js had NO test
// coverage at all, a genuine pre-existing gap that let the bug below ship
// undetected. Scope here is intentionally narrow: only the hasAnswer /
// speak-control-gating logic this fix touches, not the whole file.
//
// THE BUG (found by independent live verification): the "only show a
// tap-to-play speak control next to a REAL coach answer" gate checked only
// `result.text` being truthy, never whether the answer actually came from
// the real model. A speak button appeared next to lesson-runner.js's own
// DEFAULT_COACH_FALLBACK string and next to server/src/templateFallback.js's
// boilerplate — canned filler got a play button exactly like a genuine
// personalized Sage answer.
//
// THE FIX (two sites in lesson-runner.js's wireCoachButton()):
//   - the "how am I doing" button handler: `result.source === 'model'` is
//     now required (alongside the existing `result.text` truthiness check)
//     before mounting the speak control.
//   - the chat form submit handler: `pending.hasAnswer` now additionally
//     requires `result.source === 'model'`.
//
// THE REAL SOURCE VALUES (traced, not guessed):
//   - chatEngine.js's askCoach() (07-app/core/chatEngine.js, ~line 228-254)
//     resolves `{ text, source }` where source is either:
//       'model'    — coachClient() got a 200 with `data.source === 'model'`.
//       'template' — EITHER the coaching service itself answered 200 with
//                    source !== 'model' (server/src/templateFallback.js's
//                    boilerplate is one such response), OR coachClient()
//                    returned null (unreachable/error/timeout/non-200) and
//                    askCoach() fell back to the caller's own local
//                    template text (lesson-runner.js's own
//                    DEFAULT_COACH_FALLBACK is one such text). Both cases
//                    are tagged 'template' — chatEngine.js never
//                    distinguishes them in the returned `source`.
//   - chatEngine.js's replyWithCoach() (not used by lesson-runner.js's or
//     drillRunner.js's askCoachAbout(), which both call getCoachMessage()
//     directly) can additionally resolve source: 'local' for an off-topic
//     reply.js answer — included below for completeness/documentation even
//     though it can't currently reach this gate through either file's real
//     call path.
//   - lesson-runner.js's own askCoachAbout() (~line 610-687) adds one more
//     value found only in this file: source: 'unavailable', returned from
//     its own catch block when `import("./coachSurface.js")` itself fails
//     (a non-module environment) — never from chatEngine.js/coachSurface.js.
//   - coachSurface.js's getCoachMessage() (~line 199-202) is a pure
//     pass-through of askCoach()'s `{text, source}} — it invents nothing.
//
// So the full non-model source vocabulary reachable via lesson-runner.js's
// askCoachAbout() is {'template', 'unavailable'}, plus 'local' included
// below for defense-in-depth documentation.

import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));

let passed = 0;
let failed = 0;
function check(name, cond) {
  if (cond) { passed++; console.log(`  PASS  ${name}`); }
  else { failed++; console.error(`  FAIL  ${name}`); }
}

console.log('\n=== lesson-runner.js Wave 5B gating-fix self-test ===');

// ---------------------------------------------------------------------------
// lesson-runner.js is a classic-script IIFE (no import/export syntax), so
// Node treats it as CommonJS. `typeof window !== "undefined" ? window : this`
// picks `this` (== module.exports at the top of a CJS module) since we never
// define a global `window` before this first require, so GuitarApp lands on
// module.exports — see the file's own final lines.
// ---------------------------------------------------------------------------
const { GuitarApp } = require(join(__dirname, 'lesson-runner.js'));
const { createLessonRunner } = GuitarApp.LessonRunner;
check('lesson-runner.js loads and exposes createLessonRunner', typeof createLessonRunner === 'function');

// ---------------------------------------------------------------------------
// Direct predicate table — mirrors the exact condition now used at both
// gating sites (wireCoachButton's button handler and its chat-form submit
// handler): `result && result.text && result.source === 'model'`. Checked
// against every real source string traced above, not guessed values.
// ---------------------------------------------------------------------------
function gates(result) {
  return !!(result && result.text && result.source === 'model');
}

check('a genuine model answer gates true', gates({ text: 'Try relaxing your thumb.', source: 'model' }) === true);
check('source: template (server or local fallback) gates false', gates({ text: "I couldn't reach my answer for that one just now.", source: 'template' }) === false);
check('source: unavailable (askCoachAbout coachSurface import failure) gates false', gates({ text: 'Keep practicing — steady progress beats a rush.', source: 'unavailable' }) === false);
check('source: local (off-topic reply.js path) gates false', gates({ text: 'Let’s keep this about guitar.', source: 'local' }) === false);
check('a missing/undefined source gates false even with real text', gates({ text: 'Some text.' }) === false);
check('an empty-string text never gates true regardless of source', gates({ text: '', source: 'model' }) === false);
check('a null result never gates true', gates(null) === false);

// ---------------------------------------------------------------------------
// Full integration coverage: exercise the REAL wireCoachButton() closures
// (both the "how am I doing" button and the chat form) through a real
// (jsdom) DOM, controlling only what chatEngine.js's coachClient() sees over
// the network (globalThis.fetch) — the same seam coachSurface.test.mjs
// already uses. This reproduces, in-process, the exact two live failure
// scenarios the independent verifier found:
//   1. the server-side template fallback (server/src/templateFallback.js's
//      boilerplate, source: 'template' from a 200 response)
//   2. the client-side failure that falls back to lesson-runner.js's own
//      DEFAULT_COACH_FALLBACK (source: 'template' via a failed/thrown fetch)
// alongside the passing case (a genuine source: 'model' answer) to prove no
// regression.
// ---------------------------------------------------------------------------
const lessonPath = join(__dirname, '..', 'content', 'lessons', 'guitar-lesson-03-first-chord-em.json');
const rawLesson = JSON.parse(readFileSync(lessonPath, 'utf8'));

function freshDoc() {
  const dom = new JSDOM(`<!doctype html><html><body>
    <button id="lesson-ask-coach"></button>
    <div id="lesson-coach-text"></div>
    <form id="lesson-chat-form"><input id="lesson-chat-input" /><button id="lesson-chat-send"></button></form>
    <div id="lesson-chat-log"></div>
  </body></html>`);
  return dom.window.document;
}

// mountCoachSpeakControl() (lesson-runner.js) is async (it awaits a dynamic
// import of coachSurface.js before mounting), so give its promise chain a
// few microtask turns to settle before inspecting the DOM.
async function flushMicrotasks(times = 10) {
  for (let i = 0; i < times; i++) await Promise.resolve();
}

async function runScenario(label, fetchImpl) {
  globalThis.document = freshDoc();
  globalThis.fetch = fetchImpl;
  try {
    const runner = createLessonRunner({ lessons: [rawLesson], strict: false, render: () => {} });
    runner.openLesson(0, { ageBand: '18-34', experience: 'never-held-one' });

    // --- "How am I doing" button path -----------------------------------
    const btn = document.getElementById('lesson-ask-coach');
    await btn.onclick();
    await flushMicrotasks();
    const buttonSpeak = document.getElementById('lesson-coach-speak');
    const buttonText = document.getElementById('lesson-coach-text').textContent;

    // --- Chat form path ---------------------------------------------------
    const form = document.getElementById('lesson-chat-form');
    const input = document.getElementById('lesson-chat-input');
    input.value = 'How do I hold the pick?';
    await form.onsubmit({ preventDefault() {} });
    await flushMicrotasks();
    const chatSpeak = document.getElementById('lesson-chat-speak-1');
    const chatLogText = document.getElementById('lesson-chat-log').textContent;

    return {
      buttonSpeakMounted: !!buttonSpeak,
      buttonText,
      chatSpeakMounted: !!chatSpeak,
      chatLogText,
    };
  } finally {
    delete globalThis.document;
    delete globalThis.fetch;
  }
}

const MODEL_TEXT = 'Real personalized answer from Sage.';
const SERVER_TEMPLATE_TEXT = "I couldn't reach my answer for that one just now, but here's a general tip.";

// Scenario 1: a genuine model answer — must still get a working speak
// control on both surfaces (no regression).
{
  const result = await runScenario('model', async () => ({
    ok: true,
    json: async () => ({ prose: MODEL_TEXT, source: 'model' }),
  }));
  check('genuine model answer: button text renders the real answer', result.buttonText === MODEL_TEXT);
  check('genuine model answer: button speak control IS mounted', result.buttonSpeakMounted === true);
  check('genuine model answer: chat log renders the real answer', result.chatLogText.includes(MODEL_TEXT));
  check('genuine model answer: chat speak control IS mounted', result.chatSpeakMounted === true);
}

// Scenario 2 (live-reproduced failure #1): the coaching service itself
// answers 200 with a template/boilerplate body (server/src/templateFallback.js
// shape) — source: 'template'. Must render the text but NEVER mount a speak
// control.
{
  const result = await runScenario('server-template', async () => ({
    ok: true,
    json: async () => ({ prose: SERVER_TEMPLATE_TEXT, source: 'template' }),
  }));
  check('server-side template fallback: button text still renders (no regression to the text path)', result.buttonText === SERVER_TEMPLATE_TEXT);
  check('server-side template fallback: button speak control is NOT mounted', result.buttonSpeakMounted === false);
  check('server-side template fallback: chat log still renders the text', result.chatLogText.includes(SERVER_TEMPLATE_TEXT));
  check('server-side template fallback: chat speak control is NOT mounted', result.chatSpeakMounted === false);
}

// Scenario 3 (live-reproduced failure #2): the client can't reach the
// coaching service at all (fetch throws) — askCoach() falls back to
// lesson-runner.js's own DEFAULT_COACH_FALLBACK text, source: 'template'.
// Must render the fallback text but NEVER mount a speak control.
{
  const result = await runScenario('client-fetch-failure', async () => { throw new Error('network unreachable'); });
  const DEFAULT_COACH_FALLBACK = 'Keep practicing — steady progress beats a rush.';
  check('client-side fetch failure: falls back to DEFAULT_COACH_FALLBACK text', result.buttonText === DEFAULT_COACH_FALLBACK);
  check('client-side fetch failure: button speak control is NOT mounted', result.buttonSpeakMounted === false);
  check('client-side fetch failure: chat log renders the fallback text', result.chatLogText.includes(DEFAULT_COACH_FALLBACK));
  check('client-side fetch failure: chat speak control is NOT mounted', result.chatSpeakMounted === false);
}

console.log(`\n=== ${passed} passed, ${failed} failed ===\n`);
process.exit(failed === 0 ? 0 : 1);
