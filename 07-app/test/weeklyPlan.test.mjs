// weeklyPlan.test.mjs — T1.5 weekly practice plan self-test.
//
// Run: node 07-app/test/weeklyPlan.test.mjs
//
// FAKE store/session data only — no real student data, no network.
// Plain assertions, no test framework, mirrors 07-app/core/storyMemory.test.mjs.

import {
  weekKey,
  shouldRegenerate,
  buildWeeklyPlan,
  getOrGenerateWeeklyPlan,
  DEFAULT_STORAGE_KEY,
} from '../core/weeklyPlan.js';
import { DRILL_MENU } from '../core/adaptivePlan.js';
import { PracticeStore } from '../core/practiceStore.js';

let passed = 0;
let failed = 0;
function check(name, cond) {
  if (cond) { passed++; console.log(`  PASS  ${name}`); }
  else { failed++; console.error(`  FAIL  ${name}`); }
}

const DAY_MS = 86400000;

// --- 1. weekKey() ------------------------------------------------------------

console.log('\n=== weekKey ===');

// Wed 2026-01-07 and Fri 2026-01-09 are the same Mon-Sun week (Mon 2026-01-05).
const wed = new Date(2026, 0, 7, 10, 0, 0).getTime();
const fri = new Date(2026, 0, 9, 22, 0, 0).getTime();
check('same week -> same key', weekKey(wed) === weekKey(fri));

// Sun 2026-01-11 (end of that week) vs Mon 2026-01-12 (next week) must differ.
const sunEndOfWeek = new Date(2026, 0, 11, 23, 0, 0).getTime();
const monNextWeek = new Date(2026, 0, 12, 0, 0, 0).getTime();
check('across Monday boundary -> different key', weekKey(sunEndOfWeek) !== weekKey(monNextWeek));
check('weekKey format looks like YYYY-Www', /^\d{4}-W\d{2}$/.test(weekKey(wed)));

// --- shouldRegenerate ---------------------------------------------------------

console.log('\n=== shouldRegenerate ===');
check('same week key -> no regenerate', shouldRegenerate(weekKey(wed), fri) === false);
check('different week key -> regenerate', shouldRegenerate(weekKey(sunEndOfWeek), monNextWeek) === true);

// --- helpers to build real PracticeStore scenarios ---------------------------

// A store with real struggled chords: F fails a lot (struggling), G is
// learning (1 clean, no recent fail), Em is clean (2+ clean, no recent fail).
function makeStruggledStore() {
  const store = new PracticeStore();
  const sid = store.startSession('L01', Date.now() - 2 * DAY_MS);
  // F: struggling — most recent attempt is a fail.
  store.logAttempt(sid, { chordName: 'F', verdict: 'fail' });
  store.logAttempt(sid, { chordName: 'F', verdict: 'fail' });
  store.logAttempt(sid, { chordName: 'F', verdict: 'pass' });
  store.logAttempt(sid, { chordName: 'F', verdict: 'fail' });
  // C: also struggling, slightly less bad, so F/C form a weak pair.
  store.logAttempt(sid, { chordName: 'C', verdict: 'fail' });
  store.logAttempt(sid, { chordName: 'C', verdict: 'pass' });
  store.logAttempt(sid, { chordName: 'C', verdict: 'fail' });
  // G: learning — some clean, no recent fail, not yet 2 clean.
  store.logAttempt(sid, { chordName: 'G', verdict: 'pass' });
  // Em: clean — 2+ clean, no recent fail.
  store.logAttempt(sid, { chordName: 'Em', verdict: 'pass' });
  store.logAttempt(sid, { chordName: 'Em', verdict: 'pass' });
  store.finalizeSession(sid, { completed: true, durationSec: 600, lessonId: 'L01' });
  return store;
}

// --- 2. buildWeeklyPlan with real struggled-chord data ------------------------

console.log('\n=== buildWeeklyPlan (struggled-chords scenario) ===');

const struggledStore = makeStruggledStore();
const struggled = struggledStore.getStruggledChords();
const learning = struggledStore.getLearningChords();
const clean = struggledStore.getCleanChords();

check('sanity: store has struggled chords', struggled.length >= 1);

const now1 = new Date(2026, 0, 7, 10, 0, 0).getTime();
const plan1 = buildWeeklyPlan(struggledStore, { minutesPerDay: 20 }, now1);

check('plan has 3 days', plan1.days.length === 3);
check('source is weak-pairs', plan1.source === 'weak-pairs');
check('weekKey matches now', plan1.weekKey === weekKey(now1));
check('generatedAt matches now', plan1.generatedAt === now1);
check('minutesPerDay wired through', plan1.minutesPerDay === 20);
check('headline is non-empty string', typeof plan1.headline === 'string' && plan1.headline.length > 0);

const knownChords = new Set([...struggled, ...learning, ...clean]);

let allDrillsValid = true;
let allReasonsNonEmpty = true;
let allReasonsReferenceRealChord = true;
for (const day of plan1.days) {
  if (day.drill !== undefined && !DRILL_MENU.includes(day.drill)) allDrillsValid = false;
  const reason = day.reason;
  if (typeof reason !== 'string' || reason.trim().length === 0) allReasonsNonEmpty = false;
  // reason/why strings should reference a real chord name from the store's data,
  // except for pure "advance the path" lesson-slot reasons which name no chord.
  if (day.type !== 'lesson') {
    // The chord may be named in the reason text itself (drill slots) or
    // carried in a separate chord/chords field (rep slots) — either counts
    // as "references a real chord from the store's data".
    const fieldChords = [].concat(day.chord || [], day.chords || []);
    const referencesRealChord = Array.from(knownChords).some((c) => reason.includes(c)) ||
      fieldChords.some((c) => knownChords.has(c));
    if (!referencesRealChord) allReasonsReferenceRealChord = false;
  }
}
check('every drill field (where present) is a member of DRILL_MENU', allDrillsValid);
check('every reason string is non-empty', allReasonsNonEmpty);
check('non-lesson reasons reference a real chord from the store', allReasonsReferenceRealChord);

// Slot 1 should be the weak-pair drill referencing F and C (the two struggled chords).
const day1 = plan1.days[0];
check('day1 is a drill', day1.type === 'drill');
check('day1 chords are real struggled chords', day1.chords.every((c) => struggled.includes(c)));
check('headline references a real chord', Array.from(knownChords).some((c) => plan1.headline.includes(c)));

// --- 3. buildWeeklyPlan with a brand-new empty store --------------------------

console.log('\n=== buildWeeklyPlan (empty store, no-data scenario) ===');

const emptyStore = new PracticeStore();
let threw = false;
let planEmpty;
try {
  planEmpty = buildWeeklyPlan(emptyStore, { minutesPerDay: 15 }, now1);
} catch (e) {
  threw = true;
}
check('does not throw on empty store', threw === false);
check('source is no-data', planEmpty && planEmpty.source === 'no-data');
check('minutesPerDay still wired through', planEmpty && planEmpty.minutesPerDay === 15);
check('headline references lesson L01 (nextLessonId of empty store)', planEmpty && planEmpty.headline.includes('L01'));
check('days array is non-empty and does not fabricate a chord/drill', planEmpty && planEmpty.days.length >= 1 &&
  planEmpty.days.every((d) => d.drill === undefined && d.chord === undefined && d.chords === undefined));

// --- 4/5/6. getOrGenerateWeeklyPlan (in-memory storage fallback) -------------

console.log('\n=== getOrGenerateWeeklyPlan (in-memory storage fallback, no localStorage in Node) ===');

check('no global localStorage in plain Node (module falls back to internal Map)', typeof globalThis.localStorage === 'undefined');

const storeForGen = makeStruggledStore();
const profile = { minutesPerDay: 25 };
const key1 = 'weeklyPlan.test.' + Math.random();

const gen1 = getOrGenerateWeeklyPlan(storeForGen, profile, { now: now1, storageKey: key1 });
// Second call, later same week (Fri of same week) — must NOT regenerate.
const now1SameWeek = fri; // Fri 2026-01-09, same ISO week as now1 (Wed 2026-01-07)
const gen2 = getOrGenerateWeeklyPlan(storeForGen, profile, { now: now1SameWeek, storageKey: key1 });

check('same-week second call returns identical generatedAt (no regeneration)', gen1.generatedAt === gen2.generatedAt);
check('same-week second call returns identical weekKey', gen1.weekKey === gen2.weekKey);
check('minutesPerDay respected in returned plan', gen1.minutesPerDay === 25 && gen2.minutesPerDay === 25);

// Cross into a new ISO week: 10+ days later.
const nowNextWeek = now1 + 10 * DAY_MS;
check('sanity: nowNextWeek is a different weekKey than now1', weekKey(nowNextWeek) !== weekKey(now1));
const gen3 = getOrGenerateWeeklyPlan(storeForGen, profile, { now: nowNextWeek, storageKey: key1 });

check('crossing into a new week regenerates (different generatedAt)', gen3.generatedAt !== gen1.generatedAt);
check('crossing into a new week regenerates (different weekKey)', gen3.weekKey !== gen1.weekKey);
check('regenerated plan still respects minutesPerDay', gen3.minutesPerDay === 25);

// Different storageKey never collides with key1's cache.
const key2 = 'weeklyPlan.test.' + Math.random();
const genOtherKey = getOrGenerateWeeklyPlan(storeForGen, profile, { now: now1, storageKey: key2 });
check('a distinct storageKey gets its own cache entry (independent of key1)', genOtherKey.generatedAt === now1);

// DEFAULT_STORAGE_KEY constant sanity (used implicitly when no storageKey passed).
check('DEFAULT_STORAGE_KEY is a non-empty string', typeof DEFAULT_STORAGE_KEY === 'string' && DEFAULT_STORAGE_KEY.length > 0);

// --- summary -------------------------------------------------------------------

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
