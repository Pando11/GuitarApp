// streaks.js — F11 progress / streaks / skill-map readout. PORTED 1:1 from 06-prototypes/step6/streaks/streaks.js.
export function readout(store) {
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
