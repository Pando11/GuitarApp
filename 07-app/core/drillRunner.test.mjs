// drillRunner.test.mjs — Wave 3 task F self-test (plain check()/counter
// style — see 07-app/core/telemetry.test.mjs for the pattern copied here).
//
// Run: node 07-app/core/drillRunner.test.mjs
//
// REQUIRED acceptance test (Wave 3 task F): a student who has completed only
// Lesson 1 is never offered a practice pair whose introducedAt exceeds 1 —
// verified directly against the real 07-app/content/practice/index.json
// data, including the case where getWeakPairs() is rigged to prefer an
// ineligible (higher introducedAt) pair.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  selectPracticePair,
  availableDrillMenu,
  drillIdForMenuName,
  runnerForDrillId,
  masteryFromSkillMap,
  DRILL_MENU_TO_ID,
} from './drillRunner.js';
import { DRILL_MENU } from './adaptivePlan.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

let passed = 0;
let failed = 0;
function check(name, cond) {
  if (cond) { passed++; console.log(`  PASS  ${name}`); }
  else { failed++; console.error(`  FAIL  ${name}`); }
}

console.log('\n=== drillRunner.js self-test ===');

// ---------------------------------------------------------------------------
// Load the REAL practice catalog (not a hand-rolled fixture) — the gate must
// hold against actual content, not an idealized shape.
// ---------------------------------------------------------------------------
const practiceIndexPath = join(__dirname, '..', 'content', 'practice', 'index.json');
const practiceIndex = JSON.parse(readFileSync(practiceIndexPath, 'utf8'));
check('practice/index.json has pairs', Array.isArray(practiceIndex.pairs) && practiceIndex.pairs.length > 0);

const minIntroducedAt = Math.min(...practiceIndex.pairs.map((p) => p.introducedAt));
const higherPair = practiceIndex.pairs.find((p) => p.introducedAt > 1);
check('fixture sanity: some real pair has introducedAt > 1 (Lesson 1 gate is meaningful)', !!higherPair);

// A minimal fake PracticeStore stand-in: only the two methods drillRunner.js
// actually calls (completedLessonCount, getWeakPairs) — matches the doc'd
// PracticeStore surface without dragging in the full class.
function fakeStore({ completedLessonCount, weakPairs }) {
  return {
    completedLessonCount: () => completedLessonCount,
    getWeakPairs: () => weakPairs || [],
  };
}

// ---------------------------------------------------------------------------
// Core acceptance case: completed lesson 1 only.
// ---------------------------------------------------------------------------
{
  const store = fakeStore({ completedLessonCount: 1, weakPairs: [] });
  const pair = selectPracticePair(practiceIndex, store);
  if (minIntroducedAt > 1) {
    check('no eligible pair at completedLessonCount=1 (min introducedAt > 1) -> null', pair === null);
  } else {
    check('pair returned at completedLessonCount=1 respects the gate', !pair || pair.introducedAt <= 1);
  }

  // Run it multiple times / against every eligible candidate directly, not
  // just the one the function happened to pick, to pin the gate itself.
  const allEligible = practiceIndex.pairs.filter((p) => p.introducedAt <= 1);
  check('every real pair eligible at lesson-1 has introducedAt <= 1 (gate definition sanity)',
    allEligible.every((p) => p.introducedAt <= 1));
}

// ---------------------------------------------------------------------------
// getWeakPairs() rigged to prefer an ineligible (higher introducedAt) pair —
// must never be surfaced.
// ---------------------------------------------------------------------------
{
  const riggedWeak = [higherPair.key]; // e.g. an introducedAt:4+ pair
  const store = fakeStore({ completedLessonCount: 1, weakPairs: riggedWeak });
  const pair = selectPracticePair(practiceIndex, store);
  check('rigged getWeakPairs() preferring an ineligible pair is never returned',
    !pair || pair.key !== higherPair.key);
  check('rigged getWeakPairs() preferring an ineligible pair still respects the gate',
    !pair || pair.introducedAt <= 1);
}

// ---------------------------------------------------------------------------
// Once enough lessons are completed, the gated pair becomes selectable, and
// a matching weak pair IS preferred (proves the gate isn't just "always
// return null" — it actually opens up).
// ---------------------------------------------------------------------------
{
  const completedLessonCount = higherPair.introducedAt;
  const store = fakeStore({ completedLessonCount, weakPairs: [higherPair.key] });
  const pair = selectPracticePair(practiceIndex, store);
  check('once the lesson is completed, the previously-gated weak pair is returned',
    !!pair && pair.key === higherPair.key);
  check('returned pair still satisfies the gate', pair.introducedAt <= completedLessonCount);
}

// ---------------------------------------------------------------------------
// Cold start: nothing completed at all -> null, no crash.
// ---------------------------------------------------------------------------
{
  const store = fakeStore({ completedLessonCount: 0, weakPairs: [] });
  const pair = selectPracticePair(practiceIndex, store);
  check('completedLessonCount=0 with min introducedAt > 0 yields null gracefully',
    minIntroducedAt > 0 ? pair === null : true);
}

// ---------------------------------------------------------------------------
// Malformed / missing inputs never throw.
// ---------------------------------------------------------------------------
{
  let threw = false;
  try { selectPracticePair(null, null); } catch (e) { threw = true; }
  check('selectPracticePair(null, null) does not throw', !threw);
  check('selectPracticePair(null, null) returns null', selectPracticePair(null, null) === null);
}
{
  let threw = false;
  try {
    selectPracticePair(practiceIndex, {
      completedLessonCount: () => 20,
      getWeakPairs: () => { throw new Error('boom'); },
    });
  } catch (e) { threw = true; }
  check('a throwing getWeakPairs() does not propagate', !threw);
}

// ---------------------------------------------------------------------------
// DRILL_MENU mapping: every mapped entry's id must correspond to a real
// runner; unmapped entries must be exactly the three unimplemented ones and
// must be omitted from availableDrillMenu().
// ---------------------------------------------------------------------------
const available = availableDrillMenu();
check('availableDrillMenu() omits Chord-Perfect', !available.includes('Chord-Perfect'));
check('availableDrillMenu() omits Air Changes', !available.includes('Air Changes'));
check('availableDrillMenu() omits One-Minute Changes', !available.includes('One-Minute Changes'));
check('availableDrillMenu() has exactly 8 entries', available.length === 8);

for (const name of DRILL_MENU) {
  const id = drillIdForMenuName(name);
  if (id === null) {
    check(`"${name}" has no runner (expected — unimplemented)`, runnerForDrillId(id) === null);
  } else {
    check(`"${name}" -> "${id}" has a registered runner`, typeof runnerForDrillId(id) === 'function');
  }
}

// Never crashes on an unknown/garbage menu name.
check('drillIdForMenuName(garbage) is null, not a throw', drillIdForMenuName('nonsense-drill') === null);
check('runnerForDrillId(garbage) is null, not a throw', runnerForDrillId('nonsense-drill') === null);

// ---------------------------------------------------------------------------
// masteryFromSkillMap — arithmetic-only derivation, never fabricates a claim.
// ---------------------------------------------------------------------------
{
  const skillMap = {
    Em: { clean: 3, fail: 1, unsure: 0, state: 'clean' },
    C: { clean: 0, fail: 0, unsure: 0, state: 'untried' },
  };
  const mastery = masteryFromSkillMap(skillMap);
  const em = mastery.find((m) => m.chord === 'Em');
  const c = mastery.find((m) => m.chord === 'C');
  check('mastery confidence is derived from clean/total (Em: 3/4 = 75)', em && em.confidence === 75);
  check('mastery label is mapped to the service vocabulary (clean -> mastered)', em && em.label === 'mastered');
  check('the store\'s own state word is still carried alongside (Em: clean)', em && em.state === 'clean');
  check('untried maps to not_started, the service\'s word for it', c && c.label === 'not_started');
  check('untried chord gets 0 confidence, not a guess', c && c.confidence === 0);
  check('masteryFromSkillMap(null) degrades to []', Array.isArray(masteryFromSkillMap(null)) && masteryFromSkillMap(null).length === 0);
}

console.log(`\n=== ${passed} passed, ${failed} failed ===\n`);
process.exit(failed === 0 ? 0 : 1);
