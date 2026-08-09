// chatEngine.js — F4 teacher chat. PORTED 1:1 from 06-prototypes/step6/chat/chatEngine.js.
// Ban 6: cites ONLY real practice-data keys (pass|fail verdicts). Off-topic -> canned redirect.

export const PERSONA = {
  T1: { name: 'Maggie Cole', style: 'bestfriend',
        open: "You've got this!",
        struggled: (c) => `Hey — your ${c} isn't ringing clean yet, but that's totally normal when you're starting. Keep at it and it'll click.`,
        clean: (c) => `Look at you — your ${c} is sounding clean! That's a real win.` },
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
export const CHORD_NAME = /\b([C-G])(#|b)?(maj|min|m|dim|aug|sus|add|7|9|11|13)?\b|\b(A|B)(#|b)?(maj|min|m|dim|aug|sus|add|7|9|11|13)\b/i;
export const OFFTOPIC_SUBJECT = /stock|invest|investing|price|market|football|soccer|sport|sports|rent|landlord|weather|climate|politics|election|news|recipe|movie|film|tv|show|game|video game|friend|friends|work|job|boss|doctor|health|crypto|bitcoin|money|bank|loan|tax|stock price/i;
export const PROGRESS_Q = /how (am|are|is) (i|we|my|things)|my progress|am i improving|how('?s| is) it going/i;
export const COMMAND_VERB = /\b(write|code|script|program|build|create|compose|translate|summarize|calculate|draw|generate|design a|make me a)\b/i;

export function isOnTopic(text) {
  if (!text || typeof text !== 'string') return false;
  if (OFFTOPIC_SUBJECT.test(text)) return false;
  if (COMMAND_VERB.test(text) && !PRACTICE_TERM.test(text) && !CHORD_NAME.test(text) && !PROGRESS_Q.test(text)) return false;
  if (PRACTICE_TERM.test(text)) return true;
  if (CHORD_NAME.test(text)) return true;
  if (PROGRESS_Q.test(text)) return true;
  return false;
}

export const OFFTOPIC = "I'm here for your guitar practice — ask me about chords, buzzing strings, or your next lesson and I'll help.";

export function reply(store, teacherId, message) {
  const p = PERSONA[teacherId] || PERSONA.T1;
  if (!isOnTopic(message)) return { persona: p.name, offTopic: true, text: OFFTOPIC };
  const struggled = store.getStruggledChords();
  const clean = store.getCleanChords();
  let text;
  if (struggled.length) text = p.struggled(struggled[0]);
  else if (clean.length) text = p.clean(clean[0]);
  else text = p.open + " Let's get your hands on the guitar — open Lesson 1.";
  return { persona: p.name, offTopic: false, text };
}
