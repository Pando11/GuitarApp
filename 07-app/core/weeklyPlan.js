// weeklyPlan.js — T1.5 weekly practice plan renewal.
//
// Client-side, check-on-open "every Monday" renewal: there is no server, so
// instead of a cron job we compare the ISO-ish Monday-start week number of
// "now" against the week number the cached plan was generated for, and
// regenerate when they differ.
//
// Rule 5 (AGENTS.md): never invent a chord name, drill name, or number.
// Every plan entry here traces to real PracticeStore/learnerProfile data or
// to adaptivePlan.js's DRILL_MENU constant (via pickDrill()). Confidence
// numbers used to pick a drill are computed arithmetic over real recorded
// pass/fail/unsure counts (same spirit as comeback.js) — never fabricated.
//
// Pure/impure split, same pattern as comeback.js and adaptivePlan.js:
//   - weekKey / shouldRegenerate / buildWeeklyPlan are pure.
//   - getOrGenerateWeeklyPlan is the only impure export (localStorage I/O),
//     mirroring learnerProfile.js's _ls()-style storage helper for
//     Node-testability.

import { pickDrill, nextLessonId } from './adaptivePlan.js';

const SESSIONS_PER_WEEK = 3;
const DAY_LABELS = ['Mon', 'Wed', 'Fri'];

export const DEFAULT_STORAGE_KEY = 'guitarapp.weeklyPlan.v1';

// --- week keying -------------------------------------------------------------

// ISO-8601 Monday-start week number, formatted 'YYYY-Www'. Only the
// week/year granularity matters here (not exact ISO edge-case parity) — this
// is new logic (day-keying in practiceStore.js/comeback.js is day-granular,
// not week-granular) kept in the same plain-arithmetic style as those.
export function weekKey(ts) {
  const d = new Date(ts);
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dayIdx = (date.getDay() + 6) % 7; // Mon=0 .. Sun=6
  date.setDate(date.getDate() - dayIdx + 3); // shift to this week's Thursday
  const isoYear = date.getFullYear();
  const jan4 = new Date(isoYear, 0, 4);
  const jan4DayIdx = (jan4.getDay() + 6) % 7;
  const week1Monday = new Date(jan4);
  week1Monday.setDate(jan4.getDate() - jan4DayIdx);
  const diffDays = Math.round((date - week1Monday) / 86400000);
  const week = 1 + Math.floor(diffDays / 7);
  return isoYear + '-W' + String(week).padStart(2, '0');
}

// Pure: true when the stored plan's week key no longer matches "now"'s week.
export function shouldRegenerate(storedWeekKey, now) {
  return weekKey(now) !== storedWeekKey;
}

// --- confidence (derived arithmetic, not invented) ---------------------------

// Same idea as PracticeStore.getSkillMap()'s state buckets, but reduced to a
// single 0-100 number so pickDrill() (which expects {chord, confidence}) can
// rank real chords. Purely arithmetic over recorded clean/fail/unsure counts
// — no guessing.
function confidenceFor(skillMap, chord) {
  const c = skillMap[chord];
  if (!c) return 0;
  const total = c.clean + c.fail + c.unsure;
  if (total === 0) return 0;
  return Math.round((c.clean / total) * 100);
}

// --- pure plan builder ---------------------------------------------------------

/**
 * Build a weekly practice plan from real store/profile data only. Pure.
 * @param {import('./practiceStore.js').PracticeStore} store
 * @param {object} learnerProfile - {minutesPerDay, ...} (may be {} or null)
 * @param {number} now - epoch ms
 * @returns {object} weekly plan (see module header shape)
 */
export function buildWeeklyPlan(store, learnerProfile, now = Date.now()) {
  const minutesPerDay = learnerProfile && typeof learnerProfile.minutesPerDay === 'number'
    ? learnerProfile.minutesPerDay
    : null;

  const sessions = (store && store.sessions) || [];
  const struggled = store.getStruggledChords();
  const learning = store.getLearningChords();
  const clean = store.getCleanChords();

  const hasNoData = sessions.length === 0 && struggled.length === 0 && learning.length === 0;

  if (hasNoData) {
    const lessonId = nextLessonId(store);
    return {
      weekKey: weekKey(now),
      generatedAt: now,
      minutesPerDay,
      source: 'no-data',
      headline: `Next up: lesson ${lessonId}`,
      days: [
        { day: DAY_LABELS[0], type: 'lesson', lessonId, reason: 'no practice recorded yet — start the next lesson' },
      ],
    };
  }

  const skillMap = store.getSkillMap();
  const failingSorted = struggled
    .map((chord) => ({ chord, confidence: confidenceFor(skillMap, chord) }))
    .sort((a, b) => a.confidence - b.confidence);

  const days = [];
  let headline = null;

  // Slot 1 (Mon): the sharpest weakness gets the drill.
  if (failingSorted.length) {
    const { drill, why } = pickDrill(failingSorted);
    const targetChords = failingSorted.slice(0, 2).map((f) => f.chord);
    days.push({
      day: DAY_LABELS[0],
      type: 'drill',
      drill,
      chords: targetChords,
      lessonDeepLink: (() => { const l = store.lessonForChord(targetChords[0]); return l ? 'lesson/' + l : null; })(),
      reason: why,
    });
    headline = targetChords.length >= 2
      ? `Weak-pair review: ${targetChords[0]} ↔ ${targetChords[1]}`
      : `Chord drill: ${targetChords[0]}`;
  } else if (learning.length) {
    const chord = learning[0];
    const { drill, why } = pickDrill([{ chord, confidence: confidenceFor(skillMap, chord) }]);
    days.push({
      day: DAY_LABELS[0],
      type: 'drill',
      drill,
      chords: [chord],
      lessonDeepLink: (() => { const l = store.lessonForChord(chord); return l ? 'lesson/' + l : null; })(),
      reason: why,
    });
    headline = `Keep learning: ${chord}`;
  }

  // Slot 2 (Wed): a second, different real thing to work on.
  if (failingSorted.length >= 2) {
    const chord = failingSorted[1].chord;
    days.push({
      day: DAY_LABELS[1],
      type: 'rep',
      chord,
      reason: 'second-weakest chord — extra reps',
    });
  } else if (clean.length) {
    days.push({
      day: DAY_LABELS[1],
      type: 'rep',
      chord: clean[0],
      reason: 'keep your clean chords sharp',
    });
  } else if (learning.length > 1) {
    const chord = learning[1];
    const { drill, why } = pickDrill([{ chord, confidence: confidenceFor(skillMap, chord) }]);
    days.push({ day: DAY_LABELS[1], type: 'drill', drill, chords: [chord], reason: why });
  }

  // Slot 3 (Fri): always advance the path with a real next lesson id.
  const lessonId = nextLessonId(store);
  days.push({ day: DAY_LABELS[2], type: 'lesson', lessonId, reason: 'advance the path' });

  // Pad up to SESSIONS_PER_WEEK with the same lesson fact if earlier slots
  // had nothing real to fill them (e.g. only struggled data, no clean/learning).
  while (days.length < SESSIONS_PER_WEEK) {
    const label = DAY_LABELS[days.length] || DAY_LABELS[DAY_LABELS.length - 1];
    days.push({ day: label, type: 'lesson', lessonId, reason: 'advance the path' });
  }

  if (!headline) headline = `Next up: lesson ${lessonId}`;

  return {
    weekKey: weekKey(now),
    generatedAt: now,
    minutesPerDay,
    source: 'weak-pairs',
    headline,
    days: days.slice(0, SESSIONS_PER_WEEK),
  };
}

// --- storage backend (mirrors learnerProfile.js's _ls()-style helper) --------

const _mem = new Map();

function _ls() {
  try {
    return (typeof globalThis !== 'undefined' && globalThis.localStorage) ? globalThis.localStorage : null;
  } catch {
    return null;
  }
}

function _readStored(storageKey) {
  const ls = _ls();
  const raw = ls ? ls.getItem(storageKey) : _mem.get(storageKey);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return (parsed && typeof parsed === 'object') ? parsed : null;
  } catch {
    return null;
  }
}

function _writeStored(storageKey, obj) {
  const raw = JSON.stringify(obj);
  const ls = _ls();
  if (ls) ls.setItem(storageKey, raw); else _mem.set(storageKey, raw);
}

// --- impure entry point --------------------------------------------------------

/**
 * Return the cached weekly plan if it is still for the current week,
 * otherwise build and persist a fresh one.
 * @param {import('./practiceStore.js').PracticeStore} store
 * @param {object} learnerProfile
 * @param {{now?: number, storageKey?: string}} [opts]
 */
export function getOrGenerateWeeklyPlan(store, learnerProfile, { now = Date.now(), storageKey = DEFAULT_STORAGE_KEY } = {}) {
  const stored = _readStored(storageKey);
  if (stored && !shouldRegenerate(stored.weekKey, now)) {
    return stored;
  }
  const fresh = buildWeeklyPlan(store, learnerProfile, now);
  _writeStored(storageKey, fresh);
  return fresh;
}
