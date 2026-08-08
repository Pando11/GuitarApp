'use strict';
/*
 * chatEngine.js — F4 teacher chat (Step 6).
 * - Answers in the CURRENT teacher's persona (T1 Maggie Cole / T2 Ellis Nakamura / T3 Ray Boudreaux).
 * - Ban 6: cites ONLY real practice-data keys from the store (struggled/clean chords).
 *   The store records a verdict (pass|fail) ONLY — it never records WHY a chord failed
 *   (buzzing vs muted vs wrong shape). So replies are phrased ONLY from the recorded
 *   verdict ("not clean yet" / "sounding clean"). They NEVER invent a physical diagnosis.
 * - Off-topic input -> canned redirect (hard rule). Implemented as DENY-BY-DEFAULT:
 *   a message is on-topic only if it mentions a practice subject AND does not mention a
 *   known non-guitar subject (stock/football/rent/etc). This closes the "guitar company
 *   stock" bypass where a keyword allow-list leaked guitar advice into an off-topic question.
 * - Ban 5: no network. This module only READS the store; it does not call an LLM.
 *   (The real app pipes `reply()` text through OpenAI TTS; the logic here is proven first.)
 */
const PERSONA = {
  T1: { name: 'Maggie Cole', style: 'bestfriend',
        open: "You've got this!",
        // Phrasing derives ONLY from the recorded verdict, never a physical cause.
        struggled: (c) => `Hey — your ${c} isn't ringing clean yet, but that's totally normal when you're starting. Keep at it and it'll click.`,
        clean: (c) => `Look at you — your ${c} is sounding clean! That's a real win.` },
  T2: { name: 'Ellis Nakamura', style: 'zen',
        open: "Breathe. Then play.",
        struggled: (c) => `Your ${c} is not yet clean. That is information, not failure. Slow down, and let it speak.`,
        clean: (c) => `Your ${c} is clean now. Notice the calm, even tone.` },
  T3: { name: 'Ray Boudreaux', style: 'drill',
        open: "Again. Cleaner this time.",
        struggled: (c) => `Your ${c} isn't clean yet. Reps fix that — run it ten times clean.`,
        clean: (c) => `Your ${c} is clean. Good. Now do it again so it sticks.` },
};

// A practice subject must be mentioned for the message to be on-topic.
const PRACTICE_TERM = /guitar|chord|strum|string|fret|practice|lesson|finger|tune|tuning|metronome|teacher|pick|buzz|tone|tempo|barre|drill|scale|fretboard|chord chart|play|playing/i;
// A bare chord name (Em, C, G, D, Am, B7, Cmaj7...) is inherently a guitar question here.
// NOTE: no `i` flag and no bare 'a'/'i' — a lone "a" is the English article and would
// collide (e.g. "write me a python script" must NOT match). Guitar roots that are not
// English words: C G D E F B (+#/b). A/B-family chords are only matched WITH a quality
// (Am, B7, A#) since bare "A"/"B" are English words.
const CHORD_NAME = /\b([C-G])(#|b)?(maj|min|m|dim|aug|sus|add|7|9|11|13)?\b|\b(A|B)(#|b)?(maj|min|m|dim|aug|sus|add|7|9|11|13)\b/i;
// Explicit non-guitar subjects -> always redirect, even if a guitar word is present.
const OFFTOPIC_SUBJECT = /stock|invest|investing|price|market|football|soccer|sport|sports|rent|landlord|weather|climate|politics|election|news|recipe|movie|film|tv|show|game|video game|friend|friends|work|job|boss|doctor|health|crypto|bitcoin|money|bank|loan|tax|stock price/i;
// Self-progress questions are on-topic even without a practice noun (context-aware reply).
const PROGRESS_Q = /how (am|are|is) (i|we|my|things)|my progress|am i improving|how('?s| is) it going/i;
// Imperative outsourced-task commands ("write me a python script", "code a website") are
// off-topic for a guitar chat UNLESS a guitar signal is also present. This denies the whole
// class instead of enumerating every non-guitar subject.
const COMMAND_VERB = /\b(write|code|script|program|build|create|compose|translate|summarize|calculate|draw|generate|design a|make me a)\b/i;

function isOnTopic(text) {
  if (!text || typeof text !== 'string') return false;
  if (OFFTOPIC_SUBJECT.test(text)) return false;   // deny explicit non-guitar subjects (closes the bypass)
  if (COMMAND_VERB.test(text) && !PRACTICE_TERM.test(text) && !CHORD_NAME.test(text) && !PROGRESS_Q.test(text)) return false;
  if (PRACTICE_TERM.test(text)) return true;       // mentions a practice subject
  if (CHORD_NAME.test(text)) return true;          // mentions a chord name
  if (PROGRESS_Q.test(text)) return true;          // self-progress question
  return false;
}

const OFFTOPIC = "I'm here for your guitar practice — ask me about chords, buzzing strings, or your next lesson and I'll help.";

function reply(store, teacherId, message) {
  const p = PERSONA[teacherId] || PERSONA.T1;
  if (!isOnTopic(message)) {
    return { persona: p.name, offTopic: true, text: OFFTOPIC };
  }
  const struggled = store.getStruggledChords();
  const clean = store.getCleanChords();
  let text;
  if (struggled.length) text = p.struggled(struggled[0]);
  else if (clean.length) text = p.clean(clean[0]);
  else text = p.open + " Let's get your hands on the guitar — open Lesson 1.";
  return { persona: p.name, offTopic: false, text };
}

module.exports = { reply, isOnTopic, PERSONA };
