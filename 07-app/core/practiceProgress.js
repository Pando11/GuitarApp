// practiceProgress.js — the single owner of the persisted PracticeStore.
//
// Why this exists (2026-09-08): the app shell was building three separate
// PracticeStore instances that knew nothing about each other. The weekly-plan
// card made a fresh empty one every load and threw it away; the practice
// screen loaded one from localStorage; and the lesson screen had none at all,
// so finishing a lesson logged a telemetry event and recorded nothing. The
// visible symptom was that every drill on the practice screen stayed disabled
// forever — selectPracticePair gates on completedLessonCount(), which nothing
// ever incremented, so no chord pair was ever eligible and no drill could run.
//
// One store, loaded once, saved on every write. Everything that reads or
// writes practice progress goes through here.
//
// Never throws: a browser with localStorage denied (private mode, blocked
// site data) must still be able to take lessons, so every storage touch is
// wrapped and a failed read simply yields an empty store.

import { PracticeStore } from './practiceStore.js';

export const STORE_KEY = 'guitarapp.practiceStore.v1';

let store = null;

function readStore() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return PracticeStore.fromJSON(JSON.parse(raw));
  } catch (e) { /* non-fatal — fall through to a fresh store */ }
  return new PracticeStore({ currentTeacherId: 'T1' });
}

/** The one shared store. Loaded from localStorage on first call. */
export function getStore() {
  if (!store) store = readStore();
  return store;
}

/** Persist the shared store. Safe to call after any mutation. */
export function save() {
  if (!store) return;
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(store.toJSON()));
  } catch (e) { /* non-fatal — the session still works, it just won't persist */ }
}

/**
 * Record that the student finished a lesson, and persist it.
 *
 * PracticeStore has no single "this lesson is done" call — completion is a
 * property of a finalized session (finalizeSession sets lessonCompletion when
 * the session is completed and names a lesson), so we open and close one. That
 * is also what makes the day count toward the practice streak, which is the
 * behavior you want: a finished lesson is a day the student showed up.
 *
 * Idempotent by lesson: re-completing a lesson already marked complete is a
 * no-op, so tapping the button twice cannot inflate completedLessonCount().
 *
 * @param {string} lessonId
 * @param {number} [durationSec] time spent, when the caller knows it
 * @returns {boolean} true if this call is what marked it complete
 */
export function recordLessonComplete(lessonId, durationSec) {
  if (typeof lessonId !== 'string' || !lessonId) return false;
  const s = getStore();
  try {
    if (s.lessonCompleted(lessonId)) return false;
    const sessionId = s.startSession(lessonId);
    s.finalizeSession(sessionId, {
      completed: true,
      lessonId,
      durationSec: Number.isFinite(durationSec) ? Math.max(0, Math.round(durationSec)) : 0,
    });
    save();
    return true;
  } catch (e) {
    return false;
  }
}

/** How many distinct lessons have been completed. 0 when anything goes wrong. */
export function completedLessonCount() {
  try {
    return getStore().completedLessonCount();
  } catch (e) {
    return 0;
  }
}

/**
 * The student's per-chord mastery in the shape the coaching service accepts,
 * or [] when there is nothing recorded yet. Lets the lesson screen cite the
 * same real numbers the practice screen does instead of sending an empty
 * mastery list and getting generic prose back.
 */
export async function currentMastery() {
  try {
    const { masteryFromSkillMap } = await import('./drillRunner.js');
    return masteryFromSkillMap(getStore().getSkillMap());
  } catch (e) {
    return [];
  }
}

/** Test seam: drop the cached instance so the next call re-reads storage. */
export function _reset() {
  store = null;
}

if (typeof window !== 'undefined') {
  window.GuitarApp = window.GuitarApp || {};
  window.GuitarApp.PracticeProgress = {
    getStore,
    save,
    recordLessonComplete,
    completedLessonCount,
    currentMastery,
    STORE_KEY,
  };
}

export default { getStore, save, recordLessonComplete, completedLessonCount, currentMastery, STORE_KEY };
