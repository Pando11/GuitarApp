// adaptivePlan.js — F5 adaptive practice plan. PORTED 1:1 from 06-prototypes/step6/adaptive/adaptivePlan.js.
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

export function planNext(store) {
  // Determine what should happen after lesson completion
  const struggled = store.getStruggledChords();

  // If there are struggled chords, suggest a practice drill
  if (struggled.length >= 2) {
    return {
      type: 'chord-change-drill',
      chords: [struggled[0], struggled[1]],
      reason: 'practice your weakest change before moving on',
      nextRoute: 'practice'
    };
  }
  if (struggled.length) {
    return {
      type: 'chord-drill',
      chord: struggled[0],
      reason: 'drill your weakest chord',
      nextRoute: 'practice'
    };
  }

  // Otherwise, show progress and suggest next lesson
  return {
    type: 'lesson',
    lessonId: nextLessonId(store),
    reason: 'ready for the next lesson',
    nextRoute: 'progress'
  };
}
