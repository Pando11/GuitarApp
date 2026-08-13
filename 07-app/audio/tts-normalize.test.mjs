// tts-normalize.test.mjs — prove normalizeForTTS() kills the "m" bug
// without mangling legitimate text (articles, already-expanded chords, "easy C").
import { normalizeForTTS } from './tts-normalize.js';

let pass = 0, fail = 0;
function check(label, got, want) {
  const ok = got === want;
  if (ok) { pass++; } else { fail++; }
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}\n       got:  ${JSON.stringify(got)}\n       want: ${JSON.stringify(want)}`);
}

// --- The bug that was reported ---
check('L02 coaching: bare Em → E minor',
  normalizeForTTS("That is Em. Easiest chord on the guitar."),
  "That is E minor. Easiest chord on the guitar.");

// --- App.js real call shape: persona_line + caption (chord in caption) ---
check('app.js speak() shape (Em in caption)',
  normalizeForTTS("Let's land it. In Em your middle finger stays."),
  "Let's land it. In E minor your middle finger stays.");

// --- All 20 lessons use a mix; cover each token ---
check('every token expands',
  normalizeForTTS("Try Am then C, then G, then D, then A, then E, then Bm, B, Dm."),
  "Try A minor then C major, then G major, then D major, then A major, then E major, then B minor, B major, D minor.");

// --- "a" article must NOT be touched (lowercase safety) ---
check('lowercase "a" article untouched',
  normalizeForTTS("Put a finger on the A string."),
  "Put a finger on the A string.");

// --- already-expanded must not double ---
check('already "C major" not doubled',
  normalizeForTTS("This is C major, not C minor."),
  "This is C major, not C minor.");

// --- "easy C" teaching label protected ---
check('"easy C" label protected',
  normalizeForTTS("Switch to easy C — it's a 2-finger reduction."),
  "Switch to easy C — it's a 2-finger reduction.");

// --- chord at end of string / end of sentence ---
check('chord at sentence end',
  normalizeForTTS("Strum all six strings. That's Em"),
  "Strum all six strings. That's E minor");

// --- plain prose untouched ---
check('plain prose untouched',
  normalizeForTTS("Breathe. Floppy fingers are normal. You've got this."),
  "Breathe. Floppy fingers are normal. You've got this.");

// --- guitar string/note names must NOT expand (the "A string" trap) ---
check('string/note names stay literal',
  normalizeForTTS("Middle on the A string, ring on the D string, index on the G string."),
  "Middle on the A string, ring on the D string, index on the G string.");

// --- but "the A chord" DOES expand (real chord usage) ---
check('"the A chord" expands',
  normalizeForTTS("Now play the A chord, then the A note by itself."),
  "Now play the A major chord, then the A note by itself.");

// --- low E / high e STRING NAMES must NOT expand (the L06 trap) ---
check('"low E" / "high e" string names stay literal',
  normalizeForTTS("middle on the low E third fret, index on the A second fret, ring on the high e third fret."),
  "middle on the low E third fret, index on the A second fret, ring on the high e third fret.");

// --- real L06 line must not say "low E major" ---
check('L06 real line: low E / high e protected',
  normalizeForTTS("G is three fingers: middle on the low E third fret, ring on the high e third fret."),
  "G major is three fingers: middle on the low E third fret, ring on the high e third fret.");

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
