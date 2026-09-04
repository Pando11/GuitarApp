// chatEngine.js — F4 teacher chat.
// PORTED from 06-prototypes/step6/chat/chatEngine.js, INCLUDING the Loop-A
// drill-serving branch that was dropped in the first port. The proven original
// does more than generic encouragement: when the student's record shows a
// struggled chord (or they name one), it serves a REAL drill pulled from the
// lesson JSON — "Let's work on your Em — try this: Find the anchor… (Lesson
// L05-…)". That branch is restored here so the fidelity gate matches the
// proven engine byte-for-byte.
//
// Bans preserved:
//   Ban 5: ZERO network. Lesson data is passed in or read LOCAL-only.
//   Ban 6: cites ONLY real lesson data (exercise name, coaching, chord pair,
//          lesson id) and ONLY real practice-data keys (struggled/clean chords).
//          Never invents a physical diagnosis or a drill that isn't in the
//          curriculum. If no drill matches, falls back to data-derived
//          encouragement text.
//
// Browser note: app.js imports this module in the browser, where `fs` does not
// exist and `require` is undefined (ESM). Lesson data is therefore INJECTED by
// the caller (see setLessons): the browser feeds its catalog; the Node tests
// feed the 05-content source. loadLessons() returns the injected set, so the
// port needs no Node fs import and stays browser-safe.

export const PERSONA = {
  T1: { name: 'Sage', style: 'emerald-hollow',
        open: "Easy does it. Let's keep the next strum clean.",
        struggled: (c) => `Your ${c} is still giving you a little trouble. Slow it down and let the shape settle before the next strum.`,
        clean: (c) => `Your ${c} is sounding cleaner now. Keep that relaxed hand and do it once more.` },
  T2: { name: 'Ellis Nakamura', style: 'zen',
        open: "Breathe. Then play.",
        struggled: (c) => `Your ${c} is not yet clean. That is information, not failure. Slow down, and let it speak.`,
        clean: (c) => `Your ${c} is clean now. Notice the calm, even tone.` },
  T3: { name: 'Ray Boudreaux', style: 'drill',
        open: "Again. Cleaner this time.",
        struggled: (c) => `Your ${c} isn't clean yet. Reps fix that — run it ten times clean.`,
        clean: (c) => `Your ${c} is clean. Good. Now do it again so it sticks.` }
};

export const PRACTICE_TERM = /guitar|chord|strum|string|fret|practice|lesson|finger|tune|tuning|metronome|teacher|pick|buzz|tone|tempo|barre|drill|scale|fretboard|chord chart|play|playing/i;
export const CHORD_NAME = /\b([A-G])(#|b)?(maj|min|m|dim|aug|sus|add|7|9|11|13)?\b/i;
export const OFFTOPIC_SUBJECT = /stock|invest|investing|price|market|football|soccer|sport|sports|rent|landlord|weather|climate|politics|election|news|recipe|movie|film|tv|show|game|video game|friend|friends|work|job|boss|doctor|health|crypto|bitcoin|money|bank|loan|tax|stock price/i;
export const PROGRESS_Q = /how (am|are|is) (i|we|my|things)|my progress|am i improving|how('?s| is) it going/i;
export const COMMAND_VERB = /\b(write|code|script|program|build|create|compose|translate|summarize|calculate|compose|draw|generate|design a|make me a)\b/i;

export function isOnTopic(text) {
  if (!text || typeof text !== 'string') return false;
  if (OFFTOPIC_SUBJECT.test(text)) return false;
  if (COMMAND_VERB.test(text) && !PRACTICE_TERM.test(text) && !CHORD_NAME.test(text) && !PROGRESS_Q.test(text)) return false;
  if (PRACTICE_TERM.test(text)) return true;
  if (CHORD_NAME.test(text)) return true;
  if (PROGRESS_Q.test(text)) return true;
  return false;
}

const OFFTOPIC = "I'm here for your guitar practice — ask me about chords, buzzing strings, or your next lesson and I'll help.";

// ---------------------------------------------------------------------------
// Drill lookup (pure). Mirrors 06-prototypes/step6/drillSelector.js.
// A drill is "for chord X" when its params.chord_pair array contains X. We
// return the first match. Callers pass an already-loaded `lessons` array (the
// browser feeds it from its catalog; Node tests feed the 05-content source).
// ---------------------------------------------------------------------------
export function findDrillForChord(chordName, lessons) {
  if (!chordName || typeof chordName !== 'string' || !chordName.trim()) return null;
  const c = chordName.trim();
  const list = lessons || [];
  for (const lesson of list) {
    for (const ex of (lesson.exercises || [])) {
      const pair = (ex.params && ex.params.chord_pair) || [];
      if (Array.isArray(pair) && pair.includes(c)) {
        return {
          lessonId: lesson.lessonId || (lesson.lesson && lesson.lesson.id) || '',
          lessonTitle: lesson.title || (lesson.lesson && lesson.lesson.title) || '',
          exerciseName: ex.name,
          coaching: ex.coaching || '',
          chordPair: pair,
          isStepDrill: /\b(air|anchor|find|first|mini|slow|step|lift|land)\b/i.test(ex.name || '')
        };
      }
    }
  }
  return null;
}

export function drillForStruggle(store, lessons) {
  const struggled = store.getStruggledChords();
  if (!struggled.length) return null;
  return findDrillForChord(struggled[0], lessons);
}

// Injected lesson set (browser catalog, or the test's 05-content mirror). This
// is the ONLY data source loadLessons consults, keeping the module browser-safe.
let _lessons = null;
export function setLessons(lessons) { _lessons = Array.isArray(lessons) ? lessons : null; }
export function getLessons() { return _lessons || []; }

// Returns the injected lessons. Under Node (tests) callers set them via
// setLessons(); the browser does the same from its catalog. Returns [] if none
// were injected (safe fallback — chat still works, just without served drills).
export function loadLessons() { return getLessons(); }

export function reply(store, teacherId, message) {
  const p = PERSONA[teacherId] || PERSONA.T1;
  if (!isOnTopic(message)) return { persona: p.name, offTopic: true, text: OFFTOPIC };

  // Loop A (TASK-A1): detect a struggle signal or a named chord, then serve a
  // REAL drill from the lesson data + record the ask (so Loop C2 follows up on
  // the exact thing).
  const lessons = getLessons();

  const struggleSignal = /\b(can'?t|can not|struggl|stuck|hard|difficult|getting|get it|figure|won'?t|not ringing|not clean|muted|buzz)\b/i.test(message);
  const namedChord = (message.match(CHORD_NAME) || [])[0];
  const targetChord = namedChord || (struggleSignal ? (store.getStruggledChords()[0] || null) : null);

  if (targetChord) {
    const drill = findDrillForChord(targetChord, lessons) || drillForStruggle(store, lessons);
    if (drill) {
      // Record the ask against the REAL chord the drill is for (not a
      // false-positive chord name from the message) so Loop C2 follows up right.
      const realChord = drill.chordPair.includes(targetChord) ? targetChord : drill.chordPair[0];
      try { store.studentRequested(realChord); } catch (e) { /* non-fatal */ }
      const drillText =
        `Let's work on your ${realChord}. Try this: "${drill.exerciseName}"` +
        (drill.coaching ? ` — ${drill.coaching}` : '') +
        ` (Lesson ${drill.lessonId}). Run it a few times and tell me how it goes.`;
      return { persona: p.name, offTopic: false, drill: drill, text: drillText };
    }
    // No drill found -> fall back to data-derived encouragement (Ban 6 safe).
    const struggled = store.getStruggledChords();
    const clean = store.getCleanChords();
    const fb = struggled.length ? p.struggled(struggled[0]) : (clean.length ? p.clean(clean[0]) : p.open + " Let's get your hands on the guitar — open Lesson 1.");
    return { persona: p.name, offTopic: false, text: fb };
  }

  // No specific chord targeted -> generic data-derived encouragement.
  const struggled = store.getStruggledChords();
  const clean = store.getCleanChords();
  let text;
  if (struggled.length) text = p.struggled(struggled[0]);
  else if (clean.length) text = p.clean(clean[0]);
  else text = p.open + " Let's get your hands on the guitar — open Lesson 1.";
  return { persona: p.name, offTopic: false, text };
}

export default { reply, isOnTopic, PERSONA, findDrillForChord, drillForStruggle, loadLessons, setLessons, getLessons };
