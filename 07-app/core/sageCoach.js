// sageCoach.js — Rule-5-safe forward-coaching line generator.
//
// WAVE 2 SAGE FORWARD-COACHING BRIDGE (headline piece).
//
// Reads ONLY numbers already stored in PracticeStore and emits exactly ONE
// coaching line that cites those numbers. It invents NO praise, NO musical
// opinion, and NO personality inference (AGENTS.md Rule 5 / Rule 6 honesty).
// A downstream LLM may re-voice the line as prose, but must not change the
// numbers it cites.
//
// Honesty contract (enforced by sageCoach.test.mjs):
//   * Every number in the line comes from the input snapshot.
//   * The only free words are connective tissue ("your", "shows", "tries",
//     "days", ...). Never a judgement ("great", "natural", "talented", ...).
//   * The line is deterministic for the same input numbers.

// Phrases that, if present, would mean a freelanced opinion/praise slipped in.
// sageCoach itself never emits these; this list documents the contract the
// self-test enforces (and that any downstream re-voicing must respect).
export const BANNED_PHRASES = [
  'great musician', 'natural', 'talented', 'gifted', "you're a star",
  'you are a star', 'prodigy', 'born to', 'genius', 'amazing', 'wonderful',
  'incredible', 'superstar', 'naturall', 'you rock', 'you are a natural',
];

// ---------------------------------------------------------------------------
// Extract a flat, citable snapshot of stored numbers from a PracticeStore.
// Only reads public methods; never mutates the store.
// ---------------------------------------------------------------------------
export function snapshotFromStore(store) {
  const skill = store.getSkillMap();
  const chords = Object.keys(skill);
  const perChord = {};
  for (const c of chords) {
    const s = skill[c];
    perChord[c] = {
      clean: s.clean,
      fail: s.fail,
      unsure: s.unsure,
      // "tries" = total attempts for the chord = sum of stored verdict counts.
      tries: s.clean + s.fail + s.unsure,
    };
  }
  const raw = (typeof store.toJSON === 'function') ? store.toJSON() : {};
  return {
    chords,
    perChord,
    currentStreak: store.currentStreak(),
    longestStreak: store.longestStreak(),
    practiceMinutes: store.practiceMinutesTotal(),
    lessonsCompleted: store.completedLessonCount(),
    helpRequests: Array.isArray(raw.helpRequests) ? raw.helpRequests.length : 0,
    lastTempo: (typeof store.lastPracticeTempo === 'function') ? store.lastPracticeTempo() : null,
  };
}

// ---------------------------------------------------------------------------
// Pure: given a snapshot, return ONE coaching line citing only stored numbers.
// ---------------------------------------------------------------------------
export function coachLine(s) {
  if (!s || typeof s !== 'object') return 'No practice numbers recorded yet.';

  // 1) Open help requests — the "you asked about X" trail (real count).
  if (s.helpRequests > 0) {
    const n = s.helpRequests;
    return n === 1 ? 'You have 1 open help request.' : 'You have ' + n + ' open help requests.';
  }

  // 2) A chord with recorded fails — cite fail + clean + tries (all stored).
  const struggling = (s.chords || []).filter((c) => s.perChord[c] && s.perChord[c].fail > 0);
  if (struggling.length) {
    let top = struggling[0], topF = -1;
    for (const c of struggling) {
      if (s.perChord[c].fail > topF) { topF = s.perChord[c].fail; top = c; }
    }
    const d = s.perChord[top];
    return 'Your ' + top + ' shows ' + d.fail + ' fails and ' + d.clean + ' cleans over ' + d.tries + ' tries.';
  }

  // 3) Any chord with attempts — cite its try count.
  if ((s.chords || []).length) {
    let top = s.chords[0], topN = -1;
    for (const c of s.chords) {
      const n = s.perChord[c].tries;
      if (n > topN) { topN = n; top = c; }
    }
    return 'Your ' + top + ' took ' + topN + ' tries so far.';
  }

  // 4) Streak / lessons / minutes — fall back to whatever is recorded.
  if (s.currentStreak > 0) return 'Current streak: ' + s.currentStreak + ' days.';
  if (s.lessonsCompleted > 0) return 'Lessons completed: ' + s.lessonsCompleted + '.';
  if (s.practiceMinutes > 0) return 'Practice time logged: ' + s.practiceMinutes + ' minutes.';

  return 'No practice numbers recorded yet.';
}

// ---------------------------------------------------------------------------
// Convenience: read a PracticeStore directly and return the coaching line.
// ---------------------------------------------------------------------------
export function sageCoach(store) {
  return coachLine(snapshotFromStore(store));
}

export default { BANNED_PHRASES, snapshotFromStore, coachLine, sageCoach };
