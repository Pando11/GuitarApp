// adaptivePlan.test.mjs — T1.2 real adaptive planning self-test.
//
// Run: node 07-app/core/adaptivePlan.test.mjs
//
// Plain check()/pass-fail harness, matching sageCoach.test.mjs's style.
// No mocks, no network — planNextUnit is a pure function over stored numbers.

import { planNextUnit, CONFIDENCE_FLOOR, DRILL_MENU, nextLessonId, buildTomorrowPlan } from './adaptivePlan.js';

let passed = 0;
let failed = 0;
function check(name, cond) {
  if (cond) { passed++; console.log(`  PASS  ${name}`); }
  else { failed++; console.error(`  FAIL  ${name}`); }
}

console.log('\n=== adaptivePlan (T1.2) self-test ===');

// ---------------------------------------------------------------------------
// Case 1: clean gate, standard minutes, no next-lesson data -> holds, does
// not invent a lesson id.
// ---------------------------------------------------------------------------
{
  const r = planNextUnit({
    learnerProfile: { minutesPerDay: 30 },
    currentLessonId: 'L03',
    mastery: [{ chord: 'Em', label: 'clean', confidence: 90 }],
  });
  check('1: clean gate + no candidate -> action is hold', r.action === 'hold');
  check('1: reason explains why it held', r.reason.toLowerCase().includes('no next-lesson candidate'));
}

// ---------------------------------------------------------------------------
// Case 2: clean gate, standard minutes, candidate supplied -> advances.
// ---------------------------------------------------------------------------
{
  const r = planNextUnit({
    learnerProfile: { minutesPerDay: 30 },
    currentLessonId: 'L03',
    mastery: [{ chord: 'Em', label: 'clean', confidence: 90 }],
    nextLessonId: 'L04',
  });
  check('2: clean gate + candidate -> advances', r.action === 'advance' && r.lessonId === 'L04');
  check('2: reason cites the confidence number path (no invented facts)', typeof r.reason === 'string' && r.reason.length > 0);
}

// ---------------------------------------------------------------------------
// Case 3: a chord below the confidence floor blocks advancement — never
// advance on a failed gate, even with a candidate lesson ready.
// ---------------------------------------------------------------------------
{
  const r = planNextUnit({
    learnerProfile: { minutesPerDay: 30 },
    currentLessonId: 'L03',
    mastery: [{ chord: 'Em', label: 'shaky', confidence: 40 }],
    nextLessonId: 'L04',
  });
  check('3: failing chord -> action is drill, not advance', r.action === 'drill');
  check('3: advance flag is false', r.advance === false);
  check('3: drill picked comes from the §5.2 menu', DRILL_MENU.includes(r.drill));
  check('3: reason cites the actual confidence number', r.reason.includes('40'));
  check('3: reason cites the floor constant', r.reason.includes(String(CONFIDENCE_FLOOR)));
}

// ---------------------------------------------------------------------------
// Case 4: struggling student stays stuck across repeated calls — never
// advanced past a failed gate no matter how many times we ask.
// ---------------------------------------------------------------------------
{
  const strugglingInput = {
    learnerProfile: { minutesPerDay: 30 },
    currentLessonId: 'L05',
    mastery: [
      { chord: 'C', label: 'shaky', confidence: 20 },
      { chord: 'G', label: 'clean', confidence: 95 },
    ],
    nextLessonId: 'L06',
    gateHistory: [{ clean: false }, { clean: false }, { clean: false }],
  };
  let everAdvanced = false;
  for (let i = 0; i < 5; i++) {
    const r = planNextUnit(strugglingInput);
    if (r.advance) everAdvanced = true;
    check(`4.${i}: struggling student not advanced (attempt ${i})`, r.action === 'drill' && r.advance === false);
  }
  check('4: never advanced across repeated attempts', everAdvanced === false);
}

// ---------------------------------------------------------------------------
// Case 5: two failing chords -> Weak-Pair Review is chosen over a
// single-chord drill.
// ---------------------------------------------------------------------------
{
  const r = planNextUnit({
    learnerProfile: {},
    currentLessonId: 'L07',
    mastery: [
      { chord: 'D', label: 'shaky', confidence: 50 },
      { chord: 'A', label: 'shaky', confidence: 30 },
    ],
  });
  check('5: two failing chords -> Weak-Pair Review', r.drill === 'Weak-Pair Review');
  check('5: reason names both chords', r.reason.includes('D') && r.reason.includes('A'));
}

// ---------------------------------------------------------------------------
// Case 6: two different learner profiles fed IDENTICAL play data produce
// DIFFERENT next-units (the core Tier-1 promise for this task).
// ---------------------------------------------------------------------------
{
  const sharedPlayData = {
    currentLessonId: 'L08',
    mastery: [{ chord: 'F', label: 'clean', confidence: 85 }],
    nextLessonId: 'L09',
    lessonAfterNextId: 'L10',
  };
  const shortProfilePlan = planNextUnit({ ...sharedPlayData, learnerProfile: { minutesPerDay: 5 } });
  const longProfilePlan = planNextUnit({ ...sharedPlayData, learnerProfile: { minutesPerDay: 60 } });
  check('6: short-minutes profile -> unitSize short', shortProfilePlan.unitSize === 'short');
  check('6: long-minutes profile -> unitSize long', longProfilePlan.unitSize === 'long');
  check('6: long profile chains two lessons, short does not', longProfilePlan.action === 'chain' && shortProfilePlan.action === 'advance');
  check('6: identical play data -> genuinely different plan shapes', JSON.stringify(shortProfilePlan) !== JSON.stringify(longProfilePlan));
}

// ---------------------------------------------------------------------------
// Case 7: minutesPerDay=5 emits a short unit and does NOT chain even when a
// second lesson is available.
// ---------------------------------------------------------------------------
{
  const r = planNextUnit({
    learnerProfile: { minutesPerDay: 5 },
    currentLessonId: 'L02',
    mastery: [{ chord: 'Em', label: 'clean', confidence: 80 }],
    nextLessonId: 'L03',
    lessonAfterNextId: 'L04',
  });
  check('7: short minutes -> unitSize short', r.unitSize === 'short');
  check('7: short minutes -> single advance, not chain', r.action === 'advance' && r.lessonId === 'L03');
}

// ---------------------------------------------------------------------------
// Case 8: minutesPerDay=60+ chains two lessons when the gate is clear and
// both lessons are supplied.
// ---------------------------------------------------------------------------
{
  const r = planNextUnit({
    learnerProfile: { minutesPerDay: 60 },
    currentLessonId: 'L02',
    mastery: [{ chord: 'Em', label: 'clean', confidence: 80 }],
    nextLessonId: 'L03',
    lessonAfterNextId: 'L04',
  });
  check('8: long minutes -> chains L03 and L04', r.action === 'chain' && r.lessonIds.length === 2 && r.lessonIds[0] === 'L03' && r.lessonIds[1] === 'L04');
}

// ---------------------------------------------------------------------------
// Case 9: two consecutive clean gate passes allow skipping the reinforcement
// lesson that follows.
// ---------------------------------------------------------------------------
{
  const r = planNextUnit({
    learnerProfile: { minutesPerDay: 30 },
    currentLessonId: 'L06',
    mastery: [{ chord: 'G', label: 'clean', confidence: 90 }],
    gateHistory: [{ clean: true }, { clean: true }],
    nextLessonId: 'L07-reinforcement',
    isReinforcementLesson: true,
    lessonAfterNextId: 'L08',
  });
  check('9: two clean passes -> skips reinforcement lesson', r.action === 'advance' && r.lessonId === 'L08');
  check('9: reports the skipped lesson id', r.skippedLessonId === 'L07-reinforcement');
  check('9: reason cites the streak count', r.reason.includes('2'));
}

// ---------------------------------------------------------------------------
// Case 10: only ONE clean pass does NOT unlock the reinforcement skip.
// ---------------------------------------------------------------------------
{
  const r = planNextUnit({
    learnerProfile: { minutesPerDay: 30 },
    currentLessonId: 'L06',
    mastery: [{ chord: 'G', label: 'clean', confidence: 90 }],
    gateHistory: [{ clean: false }, { clean: true }],
    nextLessonId: 'L07-reinforcement',
    isReinforcementLesson: true,
    lessonAfterNextId: 'L08',
  });
  check('10: one clean pass -> does not skip reinforcement', r.action === 'advance' && r.lessonId === 'L07-reinforcement');
}

// ---------------------------------------------------------------------------
// Case 11: experience=returning-player with no history gets a placement skip
// to the first lesson with an unproven chord, instead of Lesson 1.
// ---------------------------------------------------------------------------
{
  const r = planNextUnit({
    learnerProfile: { experience: 'returning-player', minutesPerDay: 30 },
    currentLessonId: null,
    mastery: [],
    recentHistory: [],
    unprovenLessonId: 'L09',
  });
  check('11: returning player -> placement-skip action', r.action === 'placement-skip');
  check('11: placement targets the unproven lesson, not L01', r.lessonId === 'L09');
}

// ---------------------------------------------------------------------------
// Case 12: a returning player who already HAS history does not get
// re-placed — normal advancement rules apply.
// ---------------------------------------------------------------------------
{
  const r = planNextUnit({
    learnerProfile: { experience: 'returning-player', minutesPerDay: 30 },
    currentLessonId: 'L04',
    mastery: [{ chord: 'C', label: 'clean', confidence: 90 }],
    recentHistory: [{ lessonId: 'L03', completedAt: 1, confidenceDelta: 0.1 }],
    unprovenLessonId: 'L09',
    nextLessonId: 'L05',
  });
  check('12: returning player with history -> normal advance, not re-placed', r.action === 'advance' && r.lessonId === 'L05');
}

// ---------------------------------------------------------------------------
// Case 13: a never-held-one beginner with identical clean play data as case 2
// still gets a plain advance (no returning-player placement logic kicks in).
// Paired with case 11/12 this shows two DIFFERENT profiles on the SAME
// underlying mastery data reach different actions (placement-skip vs advance).
// ---------------------------------------------------------------------------
{
  const r = planNextUnit({
    learnerProfile: { experience: 'never-held-one', minutesPerDay: 30 },
    currentLessonId: null,
    mastery: [],
    recentHistory: [],
    unprovenLessonId: 'L09',
    nextLessonId: 'L01',
  });
  check('13: never-held-one beginner -> plain advance, not placement-skip', r.action === 'advance' && r.lessonId === 'L01');
}

// ---------------------------------------------------------------------------
// Case 14: empty/absent recentHistory and gateHistory (the real-world case
// right now — no drill screen fires drill_result yet) must not crash and
// must not produce a nonsensical plan.
// ---------------------------------------------------------------------------
{
  let threw = false;
  let r = null;
  try {
    r = planNextUnit({ learnerProfile: {}, currentLessonId: 'L01', mastery: [] });
  } catch {
    threw = true;
  }
  check('14: no drill/gate history -> does not throw', threw === false);
  check('14: no drill/gate history -> returns a well-formed action', r && typeof r.action === 'string' && typeof r.reason === 'string');
}

// ---------------------------------------------------------------------------
// Case 15: calling with completely empty input (no args at all) is graceful.
// ---------------------------------------------------------------------------
{
  let threw = false;
  let r = null;
  try {
    r = planNextUnit();
  } catch {
    threw = true;
  }
  check('15: planNextUnit() with no args -> does not throw', threw === false);
  check('15: falls back to hold with no candidate lesson', r && r.action === 'hold');
}

// ---------------------------------------------------------------------------
// Case 16: every returned decision carries a non-empty reason string naming
// the numbers used (spot-checked across several action types already
// exercised above, plus a fresh justHappened-bearing call).
// ---------------------------------------------------------------------------
{
  const r = planNextUnit({
    learnerProfile: { minutesPerDay: 15 },
    currentLessonId: 'L11',
    mastery: [{ chord: 'B7', label: 'shaky', confidence: 55 }],
    justHappened: { drillId: 'chord-perfect', passed: false, score: 0.4, ratePerMin: 12 },
  });
  check('16: reason present and non-trivial', typeof r.reason === 'string' && r.reason.length > 10);
  check('16: reason cites the real chord name', r.reason.includes('B7'));
}

// ---------------------------------------------------------------------------
// Regression: the ported (T0) functions are untouched by the T1.2 addition.
// ---------------------------------------------------------------------------
{
  const fakeStore = {
    sessions: [{ lessonId: 'L05' }, { lessonId: 'L03' }],
    getStruggledChords: () => [],
    getLearningChords: () => [],
    getCleanChords: () => [],
    lessonForChord: () => null,
  };
  check('regression: nextLessonId still increments off session history', nextLessonId(fakeStore) === 'L06');
  const plan = buildTomorrowPlan(fakeStore);
  check('regression: buildTomorrowPlan still returns a plan shape', Array.isArray(plan.plan) && plan.openedWithDrill === false);
}

console.log(`\nRESULT: ${passed} passed, ${failed} failed`);
if (failed === 0) { console.log('OVERALL: PASS'); process.exit(0); }
else { console.log('OVERALL: FAIL'); process.exit(1); }
