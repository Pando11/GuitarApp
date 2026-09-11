// celebrationView.js — Wave 2 task 2C. Renders celebration.js's
// buildCelebration() output as a card, sourced from real PracticeStore data.
//
// Rule 5 (never invent a number, never invent praise): every value this
// module feeds into buildCelebration() traces to a stored session/attempt via
// practiceStore.js/streaks.js, and the rendered markup adds no praise text of
// its own — only the recap sentences and privacy note buildCelebration()
// already produced, which celebration.js's own BANNED_PRAISE check enforces.
//
// mountCelebration(container, numbers) is the exported mount point Wave 4
// wires into the weekly-plan surface. `container` only needs a settable
// `innerHTML` string property — a real DOM element in the app, or a plain
// `{ innerHTML: '' }` object in tests — so this file needs no DOM framework
// and no `document` global to be unit-testable in plain Node.
//
// celebrationNumbersFromStore(store) is the seam that maps a real
// PracticeStore (the one practiceProgress.js's getStore() returns) onto
// celebration.js's exact numbers shape:
//   - streakDays       <- streaks.js readout().currentStreak
//                         (PracticeStore.currentStreak())
//   - chordsCleaned    <- streaks.js readout().cleanChords.length
//                         (PracticeStore.getCleanChords())
//   - daysPracticed    <- distinct session-day count, derived from
//                         store.sessions' timestamps via practiceStore.js's
//                         exported todayKey() — the same arithmetic
//                         PracticeStore's own currentStreak()/longestStreak()
//                         use internally (via their private _activeDays()),
//                         recomputed here from public data only
//   - totalSessions    <- store.sessions.length
//   - minutesPracticed <- streaks.js readout().practiceMinutes
//                         (PracticeStore.practiceMinutesTotal())
//
// A brand-new store (zero recorded sessions) has none of these yet.
// celebrationNumbersFromStore returns null in that case, and mountCelebration
// renders an honest "nothing recorded yet" state instead of a celebration
// built entirely of zeroes, which would read as fake enthusiasm about
// nothing the student has actually done.

import { buildCelebration } from './celebration.js';
import { readout } from './streaks.js';
import { todayKey } from './practiceStore.js';

const EMPTY_STATE_TEXT =
  'No practice recorded yet. Finish a lesson or a drill and your recap will show up here.';

const NUMBER_FIELDS = ['streakDays', 'chordsCleaned', 'daysPracticed', 'totalSessions', 'minutesPracticed'];

/**
 * Derive celebration.js's buildCelebration() input from a real PracticeStore.
 * Returns null when the store has no recorded sessions yet, so callers can
 * render an honest empty state instead of a celebration full of zeroes.
 *
 * @param {import('./practiceStore.js').PracticeStore} store
 * @returns {{streakDays:number, chordsCleaned:number, daysPracticed:number, totalSessions:number, minutesPracticed:number}|null}
 */
export function celebrationNumbersFromStore(store) {
  if (!store || !Array.isArray(store.sessions) || store.sessions.length === 0) return null;

  const r = readout(store);
  const daysPracticed = new Set(store.sessions.map((s) => todayKey(s.ts))).size;

  return {
    streakDays: r.currentStreak,
    chordsCleaned: r.cleanChords.length,
    daysPracticed,
    totalSessions: store.sessions.length,
    minutesPracticed: r.practiceMinutes,
  };
}

function hasAnyNumber(numbers) {
  if (!numbers) return false;
  return NUMBER_FIELDS.some((key) => numbers[key] != null);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (ch) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
  ));
}

function emptyStateHtml() {
  return (
    '<div class="celebration-card celebration-card--empty">' +
    '<p class="celebration-empty-text">' + escapeHtml(EMPTY_STATE_TEXT) + '</p>' +
    '</div>'
  );
}

function celebrationHtml(celebration) {
  return (
    '<div class="celebration-card">' +
    '<p class="celebration-text">' + escapeHtml(celebration.text) + '</p>' +
    '<div class="celebration-privacy">' +
    '<p class="celebration-privacy-line">' + escapeHtml(celebration.privacy.layer1) + '</p>' +
    '<p class="celebration-privacy-line">' + escapeHtml(celebration.privacy.layer2) + '</p>' +
    '</div>' +
    '</div>'
  );
}

/**
 * Render a celebration card into `container`.
 *
 * @param {{innerHTML: string}} container - anything with a settable
 *   `innerHTML` string property (a real DOM element, or a plain object in
 *   tests).
 * @param {{streakDays?:number, chordsCleaned?:number, daysPracticed?:number, totalSessions?:number, minutesPracticed?:number}|null} [numbers]
 *   celebration.js's buildCelebration() input shape. Pass null/undefined, or
 *   an object with every field null/undefined, to render the empty state.
 * @returns {{empty: boolean, celebration: object|null}} what was rendered
 */
export function mountCelebration(container, numbers) {
  if (!container) throw new Error('mountCelebration requires a container');

  if (!hasAnyNumber(numbers)) {
    container.innerHTML = emptyStateHtml();
    return { empty: true, celebration: null };
  }

  const celebration = buildCelebration(numbers);
  container.innerHTML = celebrationHtml(celebration);
  return { empty: false, celebration };
}

/**
 * Convenience wrapper for callers that have a PracticeStore, not a
 * pre-shaped numbers object: derives the numbers via
 * celebrationNumbersFromStore() and mounts them in one call.
 *
 * @param {{innerHTML: string}} container
 * @param {import('./practiceStore.js').PracticeStore} store
 * @returns {{empty: boolean, celebration: object|null}}
 */
export function mountCelebrationFromStore(container, store) {
  return mountCelebration(container, celebrationNumbersFromStore(store));
}

if (typeof window !== 'undefined') {
  window.GuitarApp = window.GuitarApp || {};
  window.GuitarApp.CelebrationView = {
    mountCelebration,
    mountCelebrationFromStore,
    celebrationNumbersFromStore,
  };
}

export default mountCelebration;
