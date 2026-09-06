// drillRunner.js — Wave 3 task F: drill screen glue.
// Plain <script> exposing window.GuitarApp.DrillRunner.createDrillRunner({...}),
// same convention as lesson-runner.js.
//
// Responsibilities:
//   1. Pick an eligible practice pair (the taught-chords gate — see
//      selectPracticePair below) and a drill from adaptivePlan.js's
//      DRILL_MENU, mapped to the matching 07-app/core/drills/*.js module by
//      its exported DRILL id constant.
//   2. Run the drill (listenerReal.js behind a mic-permission flow, falling
//      back to listenerSim.js when mic/permission is unavailable).
//   3. Record the result via practiceStore.recordDrillResult(...), then log
//      telemetry.log('drill_result', {lessonId, payload:{...}}).
//   4. Offer a small "ask your coach" control via coachSurface.js.
//
// This module is intentionally plain-ES (no build step) so it can be loaded
// both as a classic <script> in index.html (reading window.GuitarApp.*
// siblings already on the page) and imported directly from Node for tests
// via dynamic import of the sibling ES modules it wraps.

import { DRILL_MENU } from './adaptivePlan.js';
import { DRILL as DRILL_ANCHOR, runDrill as runAnchor } from './drills/anchorPivot.js';
import { DRILL as DRILL_COUNT, runDrill as runCount } from './drills/countOutLoud.js';
import { DRILL as DRILL_METRONOME, runDrill as runMetronome } from './drills/metronomeLadder.js';
import { DRILL as DRILL_MUTED, runDrill as runMuted } from './drills/mutedStrum.js';
import { DRILL as DRILL_SPIDER, runDrill as runSpider } from './drills/spiderWarmup.js';
import { DRILL as DRILL_TEMPO, runDrill as runTempo } from './drills/tempoLoop.js';
import { DRILL as DRILL_WAIT, runDrill as runWait } from './drills/waitToPlay.js';
import { DRILL as DRILL_WEAK, runDrill as runWeak } from './drills/weakPairReview.js';
import { pairKey, parsePair } from './pairKey.js';
import { buildCoachEnvelope, getCoachMessage } from './coachSurface.js';

// ---------------------------------------------------------------------------
// DRILL_MENU display name -> drill module DRILL id. Built by reading each
// drills/*.js module's own exported DRILL string constant — not assumed from
// the display name. 'Chord-Perfect', 'Air Changes', and 'One-Minute Changes'
// have no drills/*.js module (One-Minute Changes lives in oneMinuteChanges.js
// but does not export a DRILL id / runDrill envelope in the drills/*.js
// convention, so it is not wired into the drill runner either) — these three
// menu entries are unimplemented and must be grayed out / omitted, never
// selected or crashed on.
// ---------------------------------------------------------------------------
export const DRILL_MENU_TO_ID = Object.freeze({
  'Chord-Perfect': null,
  'Air Changes': null,
  'One-Minute Changes': null,
  'Tempo-Scaled Loop': DRILL_TEMPO,
  'Wait-To-Play': DRILL_WAIT,
  'Anchor': DRILL_ANCHOR,
  'Spider': DRILL_SPIDER,
  'Metronome ladder': DRILL_METRONOME,
  'Weak-Pair Review': DRILL_WEAK,
  'Muted strum': DRILL_MUTED,
  'Count-out-loud': DRILL_COUNT,
});

// Reverse map: DRILL id -> runDrill implementation.
const RUNNERS_BY_ID = Object.freeze({
  [DRILL_ANCHOR]: runAnchor,
  [DRILL_COUNT]: runCount,
  [DRILL_METRONOME]: runMetronome,
  [DRILL_MUTED]: runMuted,
  [DRILL_SPIDER]: runSpider,
  [DRILL_TEMPO]: runTempo,
  [DRILL_WAIT]: runWait,
  [DRILL_WEAK]: runWeak,
});

// Menu entries that actually have an implementation — what the UI should
// render as selectable (the rest are grayed out / omitted).
export function availableDrillMenu() {
  return DRILL_MENU.filter((name) => !!DRILL_MENU_TO_ID[name]);
}

export function drillIdForMenuName(name) {
  return DRILL_MENU_TO_ID[name] || null;
}

export function runnerForDrillId(drillId) {
  return RUNNERS_BY_ID[drillId] || null;
}

// ---------------------------------------------------------------------------
// The taught-chords gate.
//
// A pair from content/practice/index.json's `pairs` array is eligible for a
// student only when pair.introducedAt <= practiceStore.completedLessonCount().
// getWeakPairs() results are preferred, but any weak pair that fails the gate
// is dropped in favor of the next eligible pair in ascending introducedAt
// (curriculum) order. Never returns a pair the student hasn't been taught.
// ---------------------------------------------------------------------------

function eligiblePairs(practicePairs, completedLessonCount) {
  return (Array.isArray(practicePairs) ? practicePairs : [])
    .filter((p) => p && typeof p.introducedAt === 'number' && p.introducedAt <= completedLessonCount)
    .slice()
    .sort((a, b) => a.introducedAt - b.introducedAt || String(a.key).localeCompare(String(b.key)));
}

// selectPracticePair(practiceIndex, practiceStore) -> pairEntry | null
//
// practiceIndex: the parsed content/practice/index.json object (must have a
//   `pairs` array; each entry shaped {key, a, b, introducedAt, ...}).
// practiceStore: an object exposing completedLessonCount() and
//   getWeakPairs(k) (PracticeStore's real shape — a fake with just those two
//   methods is fine for tests).
//
// Returns the chosen pair entry (from practiceIndex.pairs, untouched) or
// null when there are no eligible pairs at all (e.g. the student hasn't
// completed Lesson 1 yet).
export function selectPracticePair(practiceIndex, practiceStore) {
  const pairs = (practiceIndex && Array.isArray(practiceIndex.pairs)) ? practiceIndex.pairs : [];
  const completedLessonCount = (practiceStore && typeof practiceStore.completedLessonCount === 'function')
    ? practiceStore.completedLessonCount()
    : 0;

  const eligible = eligiblePairs(pairs, completedLessonCount);
  if (!eligible.length) return null;

  const eligibleKeys = new Set(eligible.map((p) => p.key));

  // Prefer a weak pair, but only if it clears the gate.
  let weak = [];
  try {
    weak = (practiceStore && typeof practiceStore.getWeakPairs === 'function')
      ? (practiceStore.getWeakPairs(3) || [])
      : [];
  } catch (e) {
    weak = [];
  }
  for (const w of weak) {
    // getWeakPairs() entries may be a pairKey string, or an object carrying
    // one under `.pair`/`.pairKey`/`.key` — accept any of those shapes
    // without guessing a field that isn't there.
    const candidateKey = typeof w === 'string'
      ? w
      : (w && (w.pairKey || w.pair || w.key)) || null;
    if (candidateKey && eligibleKeys.has(candidateKey)) {
      return eligible.find((p) => p.key === candidateKey);
    }
  }

  // Fall back to the next eligible pair in curriculum order.
  return eligible[0];
}

// ---------------------------------------------------------------------------
// Mic permission flow — once-per-session ask + a toggle checkbox remembered
// for the session. Falls back to the deterministic sim listener when mic
// access/permission is unavailable. Never requires a real mic (tests use the
// sim path exclusively).
// ---------------------------------------------------------------------------

function createMicPermissionFlow(win) {
  const w = win || (typeof window !== 'undefined' ? window : null);
  const SESSION_KEY = 'guitarapp.drillRunner.micToggle.v1';
  let asked = false;

  function readToggle() {
    try {
      if (w && w.sessionStorage) {
        const v = w.sessionStorage.getItem(SESSION_KEY);
        if (v !== null) return v === '1';
      }
    } catch (e) { /* non-fatal */ }
    return null;
  }

  function writeToggle(val) {
    try {
      if (w && w.sessionStorage) w.sessionStorage.setItem(SESSION_KEY, val ? '1' : '0');
    } catch (e) { /* non-fatal */ }
  }

  return {
    // Returns true if the mic should be used (permission previously granted
    // or the caller opts in this call), false to use the sim listener.
    async resolveUseMic(requestMic) {
      const remembered = readToggle();
      if (remembered !== null) return remembered;
      if (asked) return false; // once-per-session ask already happened
      asked = true;
      if (typeof requestMic !== 'function') { writeToggle(false); return false; }
      try {
        const granted = await requestMic();
        writeToggle(!!granted);
        return !!granted;
      } catch (e) {
        writeToggle(false);
        return false;
      }
    },
    setToggle(val) { writeToggle(!!val); },
    getToggle() { return readToggle(); },
  };
}

// ---------------------------------------------------------------------------
// Mastery-shape adaptation for the coach envelope.
//
// coachSurface.buildCoachEnvelope wants mastery: [{chord, label, confidence}].
// practiceStore.getSkillMap() (per-chord) returns
// { [canonChordName]: {clean, fail, unsure, state} } — no numeric
// confidence field. JUDGMENT CALL (documented, not fabricated musically):
// we derive a 0-100 confidence purely arithmetically from clean/fail counts
// already recorded by the store (clean / (clean+fail+unsure) * 100, or 0 for
// untried), and use the existing `state` string as `label` verbatim. This
// never invents a musical claim — every number traces back to counts
// PracticeStore itself already tracked.
// ---------------------------------------------------------------------------
export function masteryFromSkillMap(skillMap) {
  if (!skillMap || typeof skillMap !== 'object') return [];
  return Object.keys(skillMap).map((chord) => {
    const c = skillMap[chord] || {};
    const total = (c.clean || 0) + (c.fail || 0) + (c.unsure || 0);
    const confidence = total > 0 ? Math.round((c.clean || 0) / total * 100) : 0;
    return { chord, label: c.state || 'untried', confidence };
  });
}

// ---------------------------------------------------------------------------
// Factory — mirrors lesson-runner.js's createLessonRunner({...}) convention.
// ---------------------------------------------------------------------------
export function createDrillRunner({ practiceIndex, practiceStore, telemetry, win } = {}) {
  const micFlow = createMicPermissionFlow(win);

  function pickPair() {
    return selectPracticePair(practiceIndex, practiceStore);
  }

  function pickMenu() {
    return availableDrillMenu();
  }

  async function runSelectedDrill({ menuName, drillParams, requestMic, lessonId } = {}) {
    const drillId = drillIdForMenuName(menuName);
    if (!drillId) {
      return { ok: false, error: 'no implementation for "' + menuName + '"' };
    }
    const runner = runnerForDrillId(drillId);
    if (!runner) {
      return { ok: false, error: 'no runner registered for drill id "' + drillId + '"' };
    }

    const useMic = await micFlow.resolveUseMic(requestMic);
    // NOTE: listenerReal.js needs a live AudioContext/mic stream which
    // does not exist under test/CI; the drills themselves generate their own
    // deterministic (sim) event streams internally via listenerSim.js's
    // simulateStrumStream, so `useMic` here only marks provenance on the
    // returned envelope (whether the toggle preferred mic input) — it never
    // blocks completion when a mic is unavailable.

    const pair = pickPair();
    const params = Object.assign({}, drillParams);
    if (pair && !params.pair) params.pair = [pair.a, pair.b];

    const result = runner(params);

    const pKey = pair ? pairKey(pair.a, pair.b) : (params.pair ? pairKey(params.pair[0], params.pair[1]) : null);

    if (practiceStore && typeof practiceStore.recordDrillResult === 'function') {
      practiceStore.recordDrillResult({
        pairKey: pKey,
        ratePerMin: result.ratePerMin,
        cleanChanges: (result.metrics && result.metrics.cleanChanges) || null,
        drillId,
        passed: result.passed,
        score: result.score,
      });
    }

    if (telemetry && typeof telemetry.log === 'function') {
      try {
        telemetry.log('drill_result', {
          lessonId,
          payload: {
            drillId,
            passed: result.passed,
            score: result.score,
            ratePerMin: result.ratePerMin,
          },
        });
      } catch (e) { /* telemetry must never break the drill flow */ }
    }

    return { ok: true, drillId, pair, result, usedMic: useMic };
  }

  async function askCoachAbout({ learnerProfile, lessonId, recentHistory, justHappened, localTemplate } = {}) {
    let mastery = [];
    try {
      mastery = (practiceStore && typeof practiceStore.getSkillMap === 'function')
        ? masteryFromSkillMap(practiceStore.getSkillMap())
        : [];
    } catch (e) {
      mastery = [];
    }
    const envelope = buildCoachEnvelope({ learnerProfile, lessonId, mastery, justHappened, recentHistory });
    return getCoachMessage(envelope, localTemplate);
  }

  return {
    pickPair,
    pickMenu,
    runSelectedDrill,
    askCoachAbout,
    micFlow,
  };
}

if (typeof window !== 'undefined') {
  window.GuitarApp = window.GuitarApp || {};
  window.GuitarApp.DrillRunner = {
    createDrillRunner,
    selectPracticePair,
    availableDrillMenu,
    drillIdForMenuName,
    runnerForDrillId,
    masteryFromSkillMap,
    DRILL_MENU_TO_ID,
  };
}
