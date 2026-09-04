// comeback.js — RETENTION: lapse-risk read + comeback plan.
//
// NOT a port. This is new 07-app logic and is deliberately NOT part of the
// fidelity gate's 48 port-equivalence checks (there is no 06-prototypes
// original to be faithful to). It is covered by its own gate:
//   node 07-app/test/comeback.test.mjs
//
// Purpose (north-star: active-learner retention): the single biggest churn
// event in a subscription lesson app is a lapsed streak that the student
// never comes back from. This module reads ONLY facts already in
// PracticeStore (session timestamps, streak, struggling chords) and returns
// a factual risk state plus the smallest possible next step.
//
// HONESTY RULES (AGENTS.md Rule 5 / Rule 6):
//  - Every field here is arithmetic over recorded facts. No inference about
//    the student's playing, no musical judgement, no invented numbers.
//  - `line` is short factual copy; an LLM may re-voice it as prose but must
//    not change the numbers or the recommended step.
//  - No guilt framing, no fake streak-freeze, no "you lost everything".

const DAY_MS = 86400000;
// The real F6 outbound channel a retention nudge would travel on.
// PracticeStore's channels are messages / sms / email — there is NO separate
// 'nudge' channel, and setMute() throws on an unknown one.
export const NUDGE_CHANNEL = 'messages';

function dayKey(ts) {
  const d = new Date(ts);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function keyToDate(k) { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); }

/** Whole calendar days since the student's most recent practice session.
 *  null when they have never practised. 0 = practised today. */
export function daysSinceLastPractice(store, now = Date.now()) {
  const sessions = store.toJSON().sessions || [];
  if (!sessions.length) return null;
  const last = Math.max(...sessions.map(s => s.ts));
  return Math.round((keyToDate(dayKey(now)) - keyToDate(dayKey(last))) / DAY_MS);
}

/** Factual risk tier. Thresholds are product policy, stated plainly:
 *   new       — no sessions recorded yet
 *   active    — practised today or yesterday (0-1 days)
 *   slipping  — 2-3 days idle (streak already broken, habit recoverable)
 *   lapsed    — 4-13 days idle
 *   dormant   — 14+ days idle (cancellation-risk window)
 */
export function riskTier(store, now = Date.now()) {
  const d = daysSinceLastPractice(store, now);
  if (d === null) return 'new';
  if (d <= 1) return 'active';
  if (d <= 3) return 'slipping';
  if (d <= 13) return 'lapsed';
  return 'dormant';
}

/** True only when a live streak of >= 2 days will break if the student does
 *  not practise today. This is a fact about the calendar, not a guess. */
export function streakAtRisk(store, now = Date.now()) {
  const d = daysSinceLastPractice(store, now);
  const streak = store.currentStreak();
  return d === 1 && streak >= 2;
}

/** The smallest next step: prefer a chord the store already recorded as
 *  struggling (re-entry on known-weak material), else the newest chord the
 *  student has been learning, else a first-session prompt. Returns null when
 *  there is nothing recorded to work on. */
export function smallestNextStep(store) {
  const struggling = store.getStruggledChords() || [];
  if (struggling.length) {
    const chord = struggling[0];
    return { kind: 'struggling-chord', chord, lessonId: store.lessonForChord(chord) || null, minutes: 3 };
  }
  const learning = store.getLearningChords() || [];
  if (learning.length) {
    const chord = learning[0];
    return { kind: 'learning-chord', chord, lessonId: store.lessonForChord(chord) || null, minutes: 3 };
  }
  return null;
}

/** Full comeback plan. `nudge` is true only for tiers where contacting the
 *  student is justified, and only when the 'nudge' channel is not muted —
 *  the student's mute setting always wins. */
export function comebackPlan(store, now = Date.now()) {
  const days = daysSinceLastPractice(store, now);
  const tier = riskTier(store, now);
  const step = smallestNextStep(store);
  const atRisk = streakAtRisk(store, now);
  const streak = store.currentStreak();
  const longest = store.longestStreak();

  const muted = typeof store.isMuted === 'function' ? store.isMuted(NUDGE_CHANNEL) : false;
  const nudgeWorthy = atRisk || tier === 'slipping' || tier === 'lapsed' || tier === 'dormant';

  let line;
  if (tier === 'new') line = 'No practice recorded yet. Start with lesson L01 — about 3 minutes.';
  else if (atRisk) line = 'You have a ' + streak + '-day streak. Play today to keep it.';
  else if (tier === 'active') line = 'Practised ' + (days === 0 ? 'today' : 'yesterday') + '. Streak: ' + streak + ' days.';
  else line = days + ' days since your last session. Longest streak so far: ' + longest + ' days.'
    + (step ? ' Pick back up with ' + step.chord + ' — about ' + step.minutes + ' minutes.' : '');

  return {
    tier,
    daysSinceLastPractice: days,
    currentStreak: streak,
    longestStreak: longest,
    streakAtRisk: atRisk,
    step,
    nudge: nudgeWorthy && !muted,
    suppressedByMute: nudgeWorthy && muted,
    line
  };
}

export default { NUDGE_CHANNEL, daysSinceLastPractice, riskTier, streakAtRisk, smallestNextStep, comebackPlan };
