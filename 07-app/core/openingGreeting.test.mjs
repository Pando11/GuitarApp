// openingGreeting.test.mjs — Ticket 8 (issue #11) self-test.
//
// Run: node 07-app/core/openingGreeting.test.mjs
//
// Same plain check()/counter harness sageCoach.test.mjs uses. Covers the
// DONE MEANS list from issue #11:
//   - first-time-ever greeting (post-wipe, no history)
//   - returning-with-recent-history greeting
//   - returning-after-absence greeting
//   - practice-timer-aware greeting
//   - the tuning check is reachable from Sage's dialogue, not a menu

import {
  buildOpeningGreeting,
  renderOpeningGreetingHTML,
  ABSENCE_DAYS_THRESHOLD,
  TUNING_ENTRY_ID,
} from './openingGreeting.js';
import { PracticeStore } from './practiceStore.js';
import { PracticeTimer } from './practiceTimer.js';

let passed = 0;
let failed = 0;
function check(name, cond) {
  if (cond) { passed++; console.log(`  PASS  ${name}`); }
  else { failed++; console.error(`  FAIL  ${name}`); }
}

const DAY = 86400000;
const NOW = Date.parse('2026-09-13T12:00:00Z');

console.log('\n=== openingGreeting self-test (Ticket 8 / issue #11) ===');

// ---------------------------------------------------------------------------
// Case 1: first-time-ever greeting — post-wipe, zero sessions. This is
// literally the state practiceStore.js's wipeAllStoredData() (Wave 1) leaves
// every device in, so this must never reference history that doesn't exist.
// ---------------------------------------------------------------------------
{
  const store = new PracticeStore({});
  const g = buildOpeningGreeting({ store, now: NOW });
  check('first-time: kind is first-time', g.kind === 'first-time');
  check('first-time: greeting text is non-empty', g.greetingText.length > 0);
  check('first-time: greeting does not mention "last time" (no history to reference)', !/last time/i.test(g.greetingText));
  check('first-time: greeting cites no invented day/attempt count', !/\d/.test(g.greetingText));
  check('first-time: still carries a tuning line', /tun/i.test(g.tuningLine));
}

// ---------------------------------------------------------------------------
// Case 2: returning with recent history — last session yesterday, a chord
// attempted, and attempts logged this week. Every number must be real.
// ---------------------------------------------------------------------------
{
  const store = new PracticeStore({
    sessions: [
      {
        id: 's1', lessonId: 'L03', ts: NOW - 1 * DAY, durationSec: 300, completed: true,
        attempts: [
          { chordName: 'Em', verdict: 'fail', ts: NOW - 1 * DAY },
          { chordName: 'Em', verdict: 'pass', ts: NOW - 1 * DAY + 1000 },
          { chordName: 'Em', verdict: 'pass', ts: NOW - 1 * DAY + 2000 },
        ],
      },
    ],
  });
  const g = buildOpeningGreeting({ store, now: NOW });
  check('recent: kind is recent', g.kind === 'recent');
  check('recent: cites the real last-attempted chord (Em, displayed as easyC-style alias only when applicable)', g.greetingText.includes('Em'));
  check('recent: cites the real attempt count this week (3)', g.greetingText.includes('3'));
  check('recent: does NOT use the absence framing', !/welcome back/i.test(g.greetingText));
}

// ---------------------------------------------------------------------------
// Case 3: returning after absence — last session well past the threshold.
// There IS history, but it's stale, so this must NOT read like an ordinary
// "last time" recap.
// ---------------------------------------------------------------------------
{
  const staleDays = ABSENCE_DAYS_THRESHOLD + 4;
  const store = new PracticeStore({
    sessions: [
      {
        id: 's1', lessonId: 'L02', ts: NOW - staleDays * DAY, durationSec: 300, completed: true,
        attempts: [{ chordName: 'G', verdict: 'pass', ts: NOW - staleDays * DAY }],
      },
    ],
  });
  const g = buildOpeningGreeting({ store, now: NOW });
  check('absence: kind is absence', g.kind === 'absence');
  check('absence: welcomes the student back', /welcome back/i.test(g.greetingText));
  check('absence: cites the real day count', g.greetingText.includes(String(staleDays)));
  check('absence: still names the real last-worked chord (G)', g.greetingText.includes('G'));
}

// ---------------------------------------------------------------------------
// Case 3b: a same-day-yesterday-ish gap just UNDER the threshold must NOT be
// treated as an absence (boundary check).
// ---------------------------------------------------------------------------
{
  const store = new PracticeStore({
    sessions: [{ id: 's1', lessonId: 'L01', ts: NOW - (ABSENCE_DAYS_THRESHOLD - 1) * DAY, durationSec: 60, completed: true, attempts: [] }],
  });
  const g = buildOpeningGreeting({ store, now: NOW });
  check('just under the absence threshold stays "recent", not "absence"', g.kind === 'recent');
}

// ---------------------------------------------------------------------------
// Case 4: practice-timer-aware greeting. A running timer's remaining time
// must be cited; a never-started timer (practiceTimer.js's own default)
// must add no line at all (never a guessed duration).
// ---------------------------------------------------------------------------
{
  const store = new PracticeStore({});
  const runningTimer = new PracticeTimer();
  runningTimer.startTimer(20, NOW); // 20 minutes, started right now
  const gRunning = buildOpeningGreeting({ store, timer: runningTimer, now: NOW + 5 * 60000 }); // 5 min elapsed
  check('timer-aware: cites the real remaining minutes (15)', gRunning.greetingText.includes('15'));

  const neverStartedTimer = new PracticeTimer();
  const gNone = buildOpeningGreeting({ store, timer: neverStartedTimer, now: NOW });
  check('no timer entered: greeting adds no timer line', !/timer/i.test(gNone.greetingText));

  const expiredTimer = new PracticeTimer();
  expiredTimer.startTimer(1, NOW); // 1 minute
  const gExpired = buildOpeningGreeting({ store, timer: expiredTimer, now: NOW + 5 * 60000 });
  check('expired timer: greeting says the timer ran out, not a negative/garbage number', /run out/i.test(gExpired.greetingText));
}

// ---------------------------------------------------------------------------
// Case 5: the tuning check is reachable from Sage's own dialogue — a control
// embedded in the greeting panel itself, not a separate/standalone menu item.
// ---------------------------------------------------------------------------
{
  const store = new PracticeStore({});
  const g = buildOpeningGreeting({ store, now: NOW });
  const html = renderOpeningGreetingHTML(g);
  check('rendered greeting HTML contains the tuning entry control', html.includes(TUNING_ENTRY_ID));
  check('the tuning entry control sits inside the SAME panel as the greeting text (one Sage block, not a separate menu)', /sage-opening[\s\S]*sage-opening-greeting[\s\S]*sage-opening-tuning[\s\S]*sage-tuning-entry[\s\S]*<\/section>/.test(html));
  check('the tuning entry is phrased as dialogue, not a bare label like "Tune & listen"', !/tune\s*&\s*listen/i.test(html));
}

// ---------------------------------------------------------------------------
// Edge cases: never throw on a missing/malformed store.
// ---------------------------------------------------------------------------
{
  check('buildOpeningGreeting({}) does not throw and yields first-time', (() => {
    try { return buildOpeningGreeting({}).kind === 'first-time'; } catch (e) { return false; }
  })());
  check('buildOpeningGreeting(undefined) does not throw', (() => {
    try { buildOpeningGreeting(); return true; } catch (e) { return false; }
  })());
  check('renderOpeningGreetingHTML(null) does not throw and returns ""', (() => {
    try { return renderOpeningGreetingHTML(null) === ''; } catch (e) { return false; }
  })());
}

console.log(`\nRESULT: ${passed} passed, ${failed} failed`);
if (failed === 0) { console.log('OVERALL: PASS'); process.exit(0); }
else { console.log('OVERALL: FAIL'); process.exit(1); }
