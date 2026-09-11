// celebration.test.mjs — node self-test (prints PASS, exits 0).
import { buildCelebration, BANNED_PRAISE } from './celebration.js';
import assert from 'node:assert';

const numbers = { streakDays: 5, chordsCleaned: 12, daysPracticed: 8, totalSessions: 20, minutesPracticed: 140 };
const out = buildCelebration(numbers);

// output contains the real numbers
assert.ok(out.text.includes('5'), 'text must include streak 5');
assert.ok(out.text.includes('12'), 'text must include chordsCleaned 12');
assert.ok(out.text.includes('8'), 'text must include daysPracticed 8');
assert.ok(out.text.includes('20'), 'text must include sessions 20');
assert.ok(out.text.includes('140'), 'text must include minutes 140');
assert.deepEqual(out.numbers, numbers, 'numbers echoed back verbatim');

// two-layer privacy note (local-first)
assert.ok(out.privacy.layer1 && out.privacy.layer2, 'two-layer privacy note required');
assert.equal(out.localFirst, true, 'local-first flag');

// NO banned praise words (any case)
const blob = (out.text + ' ' + out.privacy.layer1 + ' ' + out.privacy.layer2).toLowerCase();
for (const w of BANNED_PRAISE) {
  assert.ok(!blob.includes(w), 'banned praise word must not appear: ' + w);
}

// no invented praise phrasing
assert.ok(!/you are |you're |amazing|incredible|awesome|born to/.test(blob), 'no invented praise');

console.log('celebration PASS — streak=' + numbers.streakDays +
  ', chordsCleaned=' + numbers.chordsCleaned + ', daysPracticed=' + numbers.daysPracticed);

// --- celebrationView.js (2C): mountCelebration + celebrationNumbersFromStore ---
// Extends this file rather than adding a sibling, per the task's OWNS list.
// `container` here is a plain `{ innerHTML: '' }` object, not a real DOM
// element — mountCelebration only needs a settable innerHTML string, so this
// stays jsdom-free like every other 07-app/core/*.test.mjs file.
import { mountCelebration, mountCelebrationFromStore, celebrationNumbersFromStore } from './celebrationView.js';
import { PracticeStore } from './practiceStore.js';
import { todayKey } from './practiceStore.js';

// -- mountCelebration against fixture numbers --------------------------------

{
  const container = { innerHTML: '' };
  const fixtureNumbers = { streakDays: 3, chordsCleaned: 2, daysPracticed: 4, totalSessions: 9, minutesPracticed: 55 };
  const result = mountCelebration(container, fixtureNumbers);

  assert.equal(result.empty, false, 'real numbers must not render the empty state');
  assert.ok(container.innerHTML.includes('celebration-card'), 'renders a celebration card');
  assert.ok(!container.innerHTML.includes('celebration-card--empty'), 'not the empty-state card');
  assert.ok(container.innerHTML.includes('3'), 'streak value present in markup');
  assert.ok(container.innerHTML.includes('Current streak'), 'recap text present in markup');
  assert.ok(container.innerHTML.includes(result.celebration.privacy.layer1), 'privacy layer1 rendered');
  assert.ok(container.innerHTML.includes(result.celebration.privacy.layer2), 'privacy layer2 rendered');
  assert.deepEqual(result.celebration.numbers, fixtureNumbers, 'echoes exactly the numbers passed in');

  const blob = container.innerHTML.toLowerCase();
  for (const w of BANNED_PRAISE) {
    assert.ok(!blob.includes(w), 'view markup must not contain banned praise word: ' + w);
  }
}

// -- mountCelebration empty state --------------------------------------------

{
  const container = { innerHTML: '' };
  const result = mountCelebration(container, null);
  assert.equal(result.empty, true, 'null numbers must render the empty state');
  assert.equal(result.celebration, null);
  assert.ok(container.innerHTML.includes('celebration-card--empty'), 'renders the empty-state card');
  assert.ok(!container.innerHTML.includes('Current streak'), 'empty state has no recap text');
}

{
  // Every field present but null/undefined — same as "nothing recorded yet".
  const container = { innerHTML: '' };
  const result = mountCelebration(container, { streakDays: null, chordsCleaned: undefined });
  assert.equal(result.empty, true, 'all-null numbers object must render the empty state, not a card of zeroes');
  assert.ok(!container.innerHTML.includes('0.'), 'empty state must not read as a celebration of zeroes');
}

{
  // undefined numbers (no argument at all) must behave the same way.
  const container = { innerHTML: '' };
  const result = mountCelebration(container);
  assert.equal(result.empty, true, 'missing numbers argument must render the empty state');
}

assert.throws(() => mountCelebration(null, { streakDays: 1 }), /requires a container/);

// -- celebrationNumbersFromStore: real PracticeStore mapping -----------------

{
  // A brand-new store has nothing recorded yet — must map to null, not zeroes.
  const freshStore = new PracticeStore();
  assert.equal(celebrationNumbersFromStore(freshStore), null, 'a store with zero sessions has no celebration numbers');

  const container = { innerHTML: '' };
  const result = mountCelebrationFromStore(container, freshStore);
  assert.equal(result.empty, true, 'a brand-new store renders the empty state end-to-end');
}

{
  // A store with real recorded practice on two distinct days.
  const store = new PracticeStore();
  const ts1 = new Date(2026, 5, 1, 10, 0).getTime();
  const ts2 = new Date(2026, 5, 2, 10, 0).getTime();

  const s1 = store.startSession('lesson1', ts1);
  store.logAttempt(s1, { chordName: 'C', verdict: 'pass', ts: ts1 });
  store.logAttempt(s1, { chordName: 'C', verdict: 'pass', ts: ts1 }); // clean: 2 passes, no recent fail
  store.finalizeSession(s1, { completed: true, lessonId: 'lesson1', durationSec: 300 });

  const s2 = store.startSession('lesson2', ts2);
  store.logAttempt(s2, { chordName: 'G', verdict: 'fail', ts: ts2 }); // struggling, not clean
  store.finalizeSession(s2, { completed: true, lessonId: 'lesson2', durationSec: 120 });

  const derived = celebrationNumbersFromStore(store);
  assert.ok(derived, 'a store with real sessions maps to real numbers, not null');
  assert.equal(derived.streakDays, store.currentStreak(), 'streakDays maps to PracticeStore.currentStreak()');
  assert.equal(derived.chordsCleaned, store.getCleanChords().length, 'chordsCleaned maps to getCleanChords().length');
  assert.equal(derived.chordsCleaned, 1, 'exactly C is clean here (G is struggling)');
  assert.equal(derived.daysPracticed, 2, 'two distinct session days (via todayKey) were practiced');
  assert.equal(derived.totalSessions, store.sessions.length, 'totalSessions maps to store.sessions.length');
  assert.equal(derived.totalSessions, 2);
  assert.equal(derived.minutesPracticed, store.practiceMinutesTotal(), 'minutesPracticed maps to practiceMinutesTotal()');
  assert.equal(derived.minutesPracticed, 7, 'round((300+120)/60) minutes');
  assert.equal(new Set([todayKey(ts1), todayKey(ts2)]).size, 2, 'sanity: the two fixture timestamps are on different days');

  const container = { innerHTML: '' };
  const result = mountCelebrationFromStore(container, store);
  assert.equal(result.empty, false, 'a store with real sessions renders a real celebration, not the empty state');
  assert.ok(container.innerHTML.includes('Days practiced: 2.'), 'rendered recap cites the real days-practiced number');
  assert.ok(container.innerHTML.includes('Chords cleaned this week: 1.'), 'rendered recap cites the real chords-cleaned number');
}

console.log('celebrationView PASS — mountCelebration + celebrationNumbersFromStore covered (real data + empty state)');
process.exit(0);
