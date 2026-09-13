// lesson-runner.degradedPaths.test.mjs — Ticket 11 (issue #14) self-test.
//
// Run: node 07-app/core/lesson-runner.degradedPaths.test.mjs
//
// Covers the "coaching server down / no key / no internet" degraded path
// lesson-runner.js owns for the in-lesson "Ask Sage" surface: askCoachAbout()
// still resolves the SAME text/source it always did (no regression to the
// Wave 5B gating fix — see lesson-runner.test.mjs), but ALSO speaks a real
// line — sageCoach.js's coachLine() (real stored numbers) plus the open
// lesson's own authored copy (model.avatarCopy.intro, Lesson 3's real
// authored copy) — through a fake window.GuitarApp.speak standing in for
// app.js's real browser-TTS speak(). The "I can't think out loud today"
// notice fires at most once, using the SAME sessionStorage key
// drillRunner.js's own offline notice uses (so one real session gets one
// notice across both coaching surfaces, not one per surface).

import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { PracticeStore } from './practiceStore.js';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));

let passed = 0;
let failed = 0;
function check(name, cond) {
  if (cond) { passed++; console.log(`  PASS  ${name}`); }
  else { failed++; console.error(`  FAIL  ${name}`); }
}

console.log('\n=== lesson-runner.js degraded-paths self-test (issue #14) ===');

const { GuitarApp } = require(join(__dirname, 'lesson-runner.js'));
const { createLessonRunner } = GuitarApp.LessonRunner;

const lessonPath = join(__dirname, '..', 'content', 'lessons', 'guitar-lesson-03-first-chord-em.json');
const rawLesson = JSON.parse(readFileSync(lessonPath, 'utf8'));

function freshDoc() {
  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  return dom.window.document;
}

// A fake sessionStorage so the "say it once" flag is exercised through the
// SAME code path a real browser session would use, not the Node-only
// in-memory fallback.
function fakeSessionStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => { map.set(k, String(v)); },
    removeItem: (k) => { map.delete(k); },
  };
}

// ---------------------------------------------------------------------------
// A real PracticeStore with one struggling chord (Em), so sageCoach.js's
// coachLine() has a genuine stored number to cite.
// ---------------------------------------------------------------------------
function storeWithEmFails() {
  return new PracticeStore({
    sessions: [
      {
        id: 's1', lessonId: 'L03', ts: Date.now(), durationSec: 60, completed: false,
        attempts: [
          { chordName: 'Em', verdict: 'fail', ts: Date.now() },
          { chordName: 'Em', verdict: 'fail', ts: Date.now() },
          { chordName: 'Em', verdict: 'pass', ts: Date.now() },
        ],
      },
    ],
  });
}

async function withDegradedSession(fn) {
  globalThis.document = freshDoc();
  const spoken = [];
  globalThis.window = { GuitarApp: { speak: (text) => spoken.push(text) }, sessionStorage: fakeSessionStorage() };
  globalThis.fetch = async () => { throw new Error('no network in this scenario'); };
  try {
    await fn(spoken);
  } finally {
    delete globalThis.document;
    delete globalThis.window;
    delete globalThis.fetch;
  }
}

// ---------------------------------------------------------------------------
// 1. Server unreachable: askCoachAbout() still resolves the same fallback
//    text/source it always did (no regression), AND speaks a real-numbers
//    line built from coachLine() + the lesson's authored copy.
// ---------------------------------------------------------------------------
await withDegradedSession(async (spoken) => {
  const store = storeWithEmFails();
  const runner = createLessonRunner({
    lessons: [rawLesson],
    strict: false,
    render: () => {},
    getPracticeStore: () => store,
  });
  runner.openLesson(0, { ageBand: '18-34', experience: 'never-held-one' });

  const DEFAULT_COACH_FALLBACK = 'Keep practicing — steady progress beats a rush.';
  const message = await runner.askCoachAbout({ index: 0, learnerProfile: { ageBand: '18-34' } });

  check('message.source is not model when unreachable (no regression)', message.source !== 'model');
  check('message.text is still the existing fallback text (no regression to on-screen text)', message.text === DEFAULT_COACH_FALLBACK);

  // speakOfflineCoachLine() is fire-and-forget (never awaited by
  // askCoachAbout) — give its promise chain a few microtask turns to land.
  for (let i = 0; i < 10; i++) await Promise.resolve();

  check('exactly one line was spoken through window.GuitarApp.speak', spoken.length === 1);
  check('the spoken line says "can\'t think out loud today"', spoken[0].includes("can't think out loud today"));
  check('the spoken line cites the real stored Em fail count (2), never invented', spoken[0].includes('Em') && spoken[0].includes('2'));
  check('the spoken line includes Lesson 3\'s own authored intro copy (adult-beginner variant)',
    spoken[0].includes(rawLesson.copyVariants['adult-beginner'].intro.slice(0, 20)));
});

// ---------------------------------------------------------------------------
// 2. The "can't think out loud today" notice fires at most once per
//    session (sessionStorage-backed), across two separate askCoachAbout()
//    calls in the SAME degraded session.
// ---------------------------------------------------------------------------
await withDegradedSession(async (spoken) => {
  const store = storeWithEmFails();
  const runner = createLessonRunner({
    lessons: [rawLesson],
    strict: false,
    render: () => {},
    getPracticeStore: () => store,
  });
  runner.openLesson(0, { ageBand: '18-34', experience: 'never-held-one' });

  await runner.askCoachAbout({ index: 0, learnerProfile: { ageBand: '18-34' } });
  await runner.askCoachAbout({ index: 0, learnerProfile: { ageBand: '18-34' }, question: 'Why does my chord buzz?' });
  for (let i = 0; i < 10; i++) await Promise.resolve();

  check('two degraded coach calls produced two spoken lines', spoken.length === 2);
  check('only the FIRST spoken line says "can\'t think out loud today"', spoken[0].includes("can't think out loud today"));
  check('the SECOND spoken line does not repeat that notice', !spoken[1].includes("can't think out loud today"));
});

// ---------------------------------------------------------------------------
// 3. When window.GuitarApp.speak isn't available (e.g. app.js hasn't
//    loaded yet, or a non-browser environment), the offline-voice path is a
//    silent no-op — it must never throw or block askCoachAbout()'s own
//    resolution.
// ---------------------------------------------------------------------------
{
  globalThis.document = freshDoc();
  globalThis.window = {}; // no GuitarApp at all
  globalThis.fetch = async () => { throw new Error('no network in this scenario'); };
  try {
    const store = storeWithEmFails();
    const runner = createLessonRunner({
      lessons: [rawLesson], strict: false, render: () => {}, getPracticeStore: () => store,
    });
    runner.openLesson(0, { ageBand: '18-34', experience: 'never-held-one' });
    let threw = false;
    let message = null;
    try {
      message = await runner.askCoachAbout({ index: 0, learnerProfile: { ageBand: '18-34' } });
    } catch (e) { threw = true; }
    check('askCoachAbout never throws when window.GuitarApp.speak is unavailable', !threw);
    check('askCoachAbout still resolves a usable message', !!message && typeof message.text === 'string' && !!message.text);
  } finally {
    delete globalThis.document;
    delete globalThis.window;
    delete globalThis.fetch;
  }
}

console.log(`\n=== ${passed} passed, ${failed} failed ===\n`);
process.exit(failed === 0 ? 0 : 1);
