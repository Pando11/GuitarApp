// adaptivePlan.js — F5 adaptive practice plan.
//
// buildTomorrowPlan/nextLessonId are PORTED 1:1 from
// 06-prototypes/step6/adaptive/adaptivePlan.js — do not change their behavior,
// 07-app/test/fidelity.mjs diffs them byte-for-byte against the original.
//
// planNextUnit() is the T1.2 addition: real rules-based adaptive planning.
// Rule 5: this module decides musical/pedagogical FACTS from STORED NUMBERS
// only (mastery gates, next unit, drill choice). It never calls a model and
// never invents a number. Every decision below carries a `reason` string
// naming the inputs it used, so the coaching service (T1.1) can turn it into
// prose and a human can debug it without guessing.

export function nextLessonId(store) {
  let max = 0;
  for (const s of store.sessions) {
    const m = /L(\d+)/.exec(s.lessonId || '');
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return 'L' + String(max + 1).padStart(2, '0');
}

export function buildTomorrowPlan(store) {
  const struggled = store.getStruggledChords();
  const learning = store.getLearningChords();
  const clean = store.getCleanChords();
  const plan = [];
  let openingDrill = null;
  if (struggled.length) {
    const chord = struggled[0];
    const lessonId = store.lessonForChord(chord);
    openingDrill = { type: 'chord-drill', chord, reason: 'flagged struggling in your last session', lessonDeepLink: lessonId ? 'lesson/' + lessonId : null };
    plan.push(openingDrill);
  }
  if (struggled.length >= 2) plan.push({ type: 'chord-change-drill', chords: [struggled[0], struggled[1]], reason: 'slow changes between your weakest chords' });
  else if (learning.length) plan.push({ type: 'chord-drill', chord: learning[0], reason: 'still consolidating' });
  if (clean.length) plan.push({ type: 'rep', chord: clean[0], reason: 'keep your clean chords sharp' });
  plan.push({ type: 'lesson', lessonId: nextLessonId(store), reason: 'advance the path' });
  return { openedWithDrill: !!openingDrill, openingDrill, plan, struggledCount: struggled.length };
}

// ---------------------------------------------------------------------------
// T1.2 — real adaptive planning.
// ---------------------------------------------------------------------------

// Below this per-chord confidence, the chord is not mastered and the gate
// must not be passed. Confidence is on a 0-100 scale, per CONTEXT.md's
// "Confidence (0-100)" glossary entry and the facts-envelope shape in
// TIER-1-make-ai-real.md: mastery: [{chord, label, confidence}].
export const CONFIDENCE_FLOOR = 60;

// The §5.2 drill menu (docs/adr/0002-practice-delivery.md, decision #2).
// Eleven modular drills; planNextUnit picks from this list only — it never
// invents a drill name.
export const DRILL_MENU = Object.freeze([
  'Chord-Perfect',
  'Air Changes',
  'One-Minute Changes',
  'Tempo-Scaled Loop',
  'Wait-To-Play',
  'Anchor',
  'Spider',
  'Metronome ladder',
  'Weak-Pair Review',
  'Muted strum',
  'Count-out-loud',
]);

// How many consecutive clean gate passes unlock skipping the reinforcement
// lesson that follows.
const CLEAN_STREAK_TO_SKIP_REINFORCEMENT = 2;

const SHORT_MINUTES_PER_DAY = 5;
const LONG_MINUTES_PER_DAY = 60;

// Pick a drill from the §5.2 menu for the given failing chord(s). Pure,
// deterministic mapping — no randomness, so the same inputs always produce
// the same drill and the choice is explainable in the reason string.
function pickDrill(failingSorted) {
  if (failingSorted.length >= 2) {
    return {
      drill: 'Weak-Pair Review',
      why: `weakest pair is ${failingSorted[0].chord} (${failingSorted[0].confidence}) and ${failingSorted[1].chord} (${failingSorted[1].confidence})`,
    };
  }
  const target = failingSorted[0];
  if (target.confidence < 30) {
    return { drill: 'Chord-Perfect', why: `${target.chord} confidence ${target.confidence} is well below the floor — needs shape accuracy work first` };
  }
  return { drill: 'One-Minute Changes', why: `${target.chord} confidence ${target.confidence} is below the floor but close — needs change-speed reps` };
}

// Count consecutive clean passes at the tail of a chronological gate-attempt
// history (oldest first, most recent last). `entries` are plain
// {clean: boolean} records for the CURRENT lesson's gate only — the caller
// (lesson-runner / the coaching service) is responsible for filtering to the
// right lesson before calling planNextUnit.
function trailingCleanStreak(entries) {
  if (!Array.isArray(entries) || !entries.length) return 0;
  let streak = 0;
  for (let i = entries.length - 1; i >= 0; i--) {
    if (entries[i] && entries[i].clean) streak++;
    else break;
  }
  return streak;
}

/**
 * Decide the next unit for a student. Pure function: given the mastery map,
 * the learner profile, and recent drill/gate results, returns what to do
 * next and why. Never calls a model, never invents a chord/drill/lesson name
 * that wasn't supplied by the caller.
 *
 * @param {object} input
 * @param {object} [input.learnerProfile] - {ageBand, experience, goal, minutesPerDay}
 * @param {string} [input.currentLessonId] - the lesson the student is currently in
 * @param {Array}  [input.mastery] - [{chord, label, confidence}] for chords in the current lesson
 * @param {Array}  [input.gateHistory] - [{clean: boolean}] chronological attempts at the CURRENT lesson's gate (oldest first)
 * @param {Array}  [input.recentHistory] - [{lessonId, completedAt, confidenceDelta}] (may be empty — no drill screen ships one yet)
 * @param {object|null} [input.justHappened] - {drillId, passed, score, ratePerMin}
 * @param {string} [input.nextLessonId] - the deterministic "next" lesson id the caller computed (e.g. current+1)
 * @param {boolean} [input.isReinforcementLesson] - whether `nextLessonId` is a reinforcement lesson that can be skipped
 * @param {string} [input.lessonAfterNextId] - the lesson after `nextLessonId`, used only when chaining two units
 * @param {string} [input.unprovenLessonId] - for returning players: first lesson id containing a chord they haven't proven
 * @returns {{action: string, reason: string, [key: string]: any}}
 */
export function planNextUnit(input = {}) {
  const {
    learnerProfile = {},
    currentLessonId = null,
    mastery = [],
    gateHistory = [],
    recentHistory = [],
    justHappened = null,
    nextLessonId: candidateNextLessonId = null,
    isReinforcementLesson = false,
    lessonAfterNextId = null,
    unprovenLessonId = null,
  } = input;

  const minutesPerDay = learnerProfile && typeof learnerProfile.minutesPerDay === 'number' ? learnerProfile.minutesPerDay : null;
  const unitSize = minutesPerDay != null && minutesPerDay <= SHORT_MINUTES_PER_DAY
    ? 'short'
    : minutesPerDay != null && minutesPerDay >= LONG_MINUTES_PER_DAY
      ? 'long'
      : 'standard';

  // --- Rule 1: gate check. Any chord in the current lesson below the
  // confidence floor blocks advancement; a targeted drill is inserted
  // instead. This check comes first and overrides everything else — a
  // failed gate is never skipped for any reason (profile, streak, minutes).
  const failing = mastery
    .filter((m) => m && typeof m.confidence === 'number' && m.confidence < CONFIDENCE_FLOOR)
    .slice()
    .sort((a, b) => a.confidence - b.confidence);

  if (failing.length) {
    const { drill, why } = pickDrill(failing);
    return {
      action: 'drill',
      lessonId: currentLessonId,
      drill,
      targetChords: failing.map((f) => f.chord),
      advance: false,
      unitSize,
      reason: `Gate not clear: ${why} (floor ${CONFIDENCE_FLOOR}). Inserting "${drill}" before advancing past ${currentLessonId || 'the current lesson'}.`,
    };
  }

  // --- Rule 4 (checked before the placement/advance split so it can win
  // outright): a returning player who hasn't logged any history yet gets a
  // placement skip to the first lesson containing a chord they haven't
  // proven, instead of starting at Lesson 1.
  if (learnerProfile.experience === 'returning-player' && recentHistory.length === 0 && unprovenLessonId) {
    return {
      action: 'placement-skip',
      lessonId: unprovenLessonId,
      advance: true,
      unitSize,
      reason: `experience=returning-player with no recorded history — skipping placement to ${unprovenLessonId}, the first lesson containing a chord not yet proven, instead of Lesson 1.`,
    };
  }

  // --- Rule 2: two consecutive clean gate passes unlock skipping the
  // reinforcement lesson that follows.
  const cleanStreak = trailingCleanStreak(gateHistory);
  const skipReinforcement = cleanStreak >= CLEAN_STREAK_TO_SKIP_REINFORCEMENT && isReinforcementLesson;

  if (skipReinforcement && lessonAfterNextId) {
    return {
      action: 'advance',
      lessonId: lessonAfterNextId,
      skippedLessonId: candidateNextLessonId,
      advance: true,
      unitSize,
      reason: `${cleanStreak} consecutive clean gate passes on ${currentLessonId || 'the current lesson'} — skipping reinforcement lesson ${candidateNextLessonId} and advancing straight to ${lessonAfterNextId}.`,
    };
  }

  // --- Rule 3: minutesPerDay shapes unit size. 60+ may chain two lessons
  // when there is no gate failure and no reinforcement lesson to skip.
  if (unitSize === 'long' && candidateNextLessonId && lessonAfterNextId) {
    return {
      action: 'chain',
      lessonIds: [candidateNextLessonId, lessonAfterNextId],
      advance: true,
      unitSize,
      reason: `minutesPerDay=${minutesPerDay} (>= ${LONG_MINUTES_PER_DAY}) with a clear gate — chaining ${candidateNextLessonId} and ${lessonAfterNextId} into one session.`,
    };
  }

  if (candidateNextLessonId) {
    const minutesNote = unitSize === 'short'
      ? `minutesPerDay=${minutesPerDay} (<= ${SHORT_MINUTES_PER_DAY}) — emitting a shorter unit.`
      : unitSize === 'long'
        ? `minutesPerDay=${minutesPerDay} (>= ${LONG_MINUTES_PER_DAY}) but no second lesson was available to chain.`
        : `gate clear on ${currentLessonId || 'the current lesson'}.`;
    return {
      action: 'advance',
      lessonId: candidateNextLessonId,
      advance: true,
      unitSize,
      reason: `${minutesNote} Advancing to ${candidateNextLessonId}.`,
    };
  }

  // No candidate next lesson was supplied and nothing else applies — stay
  // put rather than inventing a lesson id.
  return {
    action: 'hold',
    lessonId: currentLessonId,
    advance: false,
    unitSize,
    reason: 'Gate clear, but no next-lesson candidate was supplied by the caller — holding at the current lesson rather than guessing one.',
  };
}
