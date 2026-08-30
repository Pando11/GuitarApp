'use strict';
/*
 * streaks.js — F11 progress / streaks / skill-map readout (Step 6).
 * Pure read surface over the store; everything it reports is derived from
 * real logged practice (Ban 6: cites real data only).
 * Run its DONE BAR: node verify-step6-streaks.js
 */
function readout(store) {
  return {
    currentStreak: store.currentStreak(),
    longestStreak: store.longestStreak(),
    practiceMinutes: store.practiceMinutesTotal(),
    lessonsCompleted: store.completedLessonCount(),
    cleanChords: store.getCleanChords(),
    strugglingChords: store.getStruggledChords(),
    learningChords: store.getLearningChords(),
    skillSnapshot: store.getSkillMap()
  };
}
module.exports = { readout };
