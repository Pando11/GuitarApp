// guardrail.test.js — proves the invented-fact guardrail actually fires on
// adversarial cases (a chord not in mastery, a number not derivable from the
// envelope) and does NOT false-positive on ordinary safe prose. This is a
// best-effort heuristic, not a formal proof: it can only catch chord-shaped
// tokens (A-G with optional quality suffix) and literal digit sequences —
// it cannot verify semantic correctness. These tests document that scope.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkInventedFacts, extractKnownTokens } from '../src/guardrail.js';

function envelope(overrides = {}) {
  return {
    learnerProfile: { ageBand: '18-34', experience: 'never-held-one', goal: 'play songs', minutesPerDay: 15 },
    lessonId: 'L01',
    stepId: null,
    mastery: [{ chord: 'G', label: 'needs_work', confidence: 40 }],
    justHappened: null,
    recentHistory: [],
    ...overrides,
  };
}

test('prose citing only in-envelope chords/numbers is ok', () => {
  const result = checkInventedFacts('Your G is at 40 and coming along nicely. Keep going at 15 minutes a day.', envelope());
  assert.equal(result.ok, true);
});

test('prose inventing a chord not in mastery[] is rejected', () => {
  const env = envelope();
  const result = checkInventedFacts('Your G is coming along, and your Dsus4 is already solid.', env);
  assert.equal(result.ok, false);
  assert.match(result.reason, /^invented_token:/);
});

test('prose inventing a numeric score/percentage not derivable from envelope is rejected', () => {
  const env = envelope();
  const result = checkInventedFacts('Your G confidence just jumped to 95%, amazing work!', env);
  assert.equal(result.ok, false);
  assert.match(result.reason, /^invented_token:/);
});

test('prose citing a specific chord when mastery is empty and justHappened is null is rejected', () => {
  const env = envelope({ mastery: [], justHappened: null });
  const result = checkInventedFacts('Your Em is sounding great today!', env);
  assert.equal(result.ok, false);
});

test('generic safe prose with no chord/number mentions is not falsely flagged', () => {
  const env = envelope({ mastery: [], justHappened: null });
  const result = checkInventedFacts('Nice work today — keep that same relaxed pace and we will check in again soon.', env);
  assert.equal(result.ok, true);
});

test('a chord the student named in their own question may be echoed back', () => {
  const env = envelope({ mastery: [], question: 'How do I get from Em to C without pausing?' });
  const result = checkInventedFacts('Move the Em shape one string over and the C is already half made.', env);
  assert.equal(result.ok, true);
});

test('a number the student named in their own question may be echoed back', () => {
  const env = envelope({ mastery: [], question: 'Should my finger be on the 3rd fret?' });
  const result = checkInventedFacts('Yes, the 3rd fret is where that finger belongs.', env);
  assert.equal(result.ok, true);
});

test('the question widens the allow-list only to what it actually names', () => {
  const env = envelope({ mastery: [], question: 'How do I play Em?' });
  const result = checkInventedFacts('Start with Em, then reach for Bmaj7.', env);
  assert.equal(result.ok, false);
  assert.match(result.reason, /^invented_token:/);
});

test('naming an open string is not treated as an invented chord', () => {
  const env = envelope({ mastery: [] });
  const result = checkInventedFacts('Let the A string ring, and keep your thumb behind the low E string.', env);
  assert.equal(result.ok, true);
});

test('a bare chord claim is still caught even alongside a string reference', () => {
  const env = envelope({ mastery: [] });
  const result = checkInventedFacts('Mute the A string — your Dm is sounding great today.', env);
  assert.equal(result.ok, false);
  assert.match(result.reason, /^invented_token:/);
});

test('a provided number shown to fewer decimal places is allowed', () => {
  const env = envelope({
    mastery: [],
    justHappened: { drillId: 'd1', passed: true, score: 0.7166666666666667, ratePerMin: 43 },
  });
  const result = checkInventedFacts('You came in at 0.71 on that run, at 43 changes a minute.', env);
  assert.equal(result.ok, true);
});

test('a 0..1 score read aloud as a percentage is allowed', () => {
  const env = envelope({
    mastery: [],
    justHappened: { drillId: 'd1', passed: true, score: 0.72, ratePerMin: 43 },
  });
  const result = checkInventedFacts('That is 72% clean, and 43 changes a minute.', env);
  assert.equal(result.ok, true);
});

test('a number that is merely near an allowed one is still rejected', () => {
  const env = envelope({
    mastery: [],
    justHappened: { drillId: 'd1', passed: true, score: 0.7166666666666667, ratePerMin: 43 },
  });
  const result = checkInventedFacts('You came in at 0.9 on that run.', env);
  assert.equal(result.ok, false);
  assert.match(result.reason, /^invented_token:/);
});

test('numbers derived from justHappened are allowed', () => {
  const env = envelope({
    mastery: [],
    justHappened: { drillId: 'd1', passed: true, score: 88, ratePerMin: 12 },
  });
  const result = checkInventedFacts('Nice, you hit a score of 88 at a rate of 12 per minute.', env);
  assert.equal(result.ok, true);
});

// --- lessonChords (2026-09-08) -------------------------------------------
// A beginner sitting in lesson 3 has no recorded mastery for Em, which is the
// entire subject of that lesson. Before lessonChords existed, every answer
// naming it was rejected as an invented fact, and the student got an apology
// instead of a teacher.

const EM = { chord: 'Em', frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0] };

test('a chord the lesson teaches may be named even with no mastery recorded', () => {
  const env = envelope({ mastery: [], lessonChords: [EM] });
  assert.equal(checkInventedFacts('Em is the first shape most people get clean.', env).ok, true);
});

test('the root letter of a lesson chord is allowed, because explaining Em means saying E minor', () => {
  const env = envelope({ mastery: [], lessonChords: [EM] });
  assert.equal(checkInventedFacts('Em is short for E minor.', env).ok, true);
});

test("the lesson's own fret numbers may be quoted back", () => {
  const env = envelope({ mastery: [], lessonChords: [EM] });
  assert.equal(checkInventedFacts('Put finger 2 on fret 2 of the A string and finger 3 on fret 2 of the D string.', env).ok, true);
});

test('a fret the shape does not contain is still rejected', () => {
  const env = envelope({ mastery: [], lessonChords: [EM] });
  const result = checkInventedFacts('Put that finger on fret 7.', env);
  assert.equal(result.ok, false);
  assert.match(result.reason, /^invented_token:7$/);
});

test('a chord the lesson does NOT teach is still rejected', () => {
  const env = envelope({ mastery: [], lessonChords: [EM] });
  const result = checkInventedFacts('Now put your fingers on Bb and strum.', env);
  assert.equal(result.ok, false);
  assert.match(result.reason, /^invented_token:/);
});

test('a name-only lesson chord widens chords but not numbers', () => {
  const env = envelope({ mastery: [], lessonChords: [{ chord: 'Em' }] });
  assert.equal(checkInventedFacts('Try Em.', env).ok, true);
  const result = checkInventedFacts('Try Em on fret 2.', env);
  assert.equal(result.ok, false);
  assert.match(result.reason, /^invented_token:2$/);
});

test('an absent or malformed lessonChords changes nothing', () => {
  assert.equal(checkInventedFacts('Try Em next.', envelope({ mastery: [] })).ok, false);
  assert.equal(checkInventedFacts('Try Em next.', envelope({ mastery: [], lessonChords: 'Em' })).ok, false);
  assert.equal(checkInventedFacts('Try Em next.', envelope({ mastery: [], lessonChords: ['Em'] })).ok, false);
});

test('plural and list string references are not read as chords', () => {
  const env = envelope({ mastery: [], lessonChords: [EM] });
  assert.equal(checkInventedFacts('Both fingers sit on the A and D strings.', env).ok, true);
  assert.equal(checkInventedFacts('Strum all of them: the E, A, D, G, B and e strings.', env).ok, true);
  assert.equal(checkInventedFacts('Mute the low E and high e strings.', env).ok, true);
});

test('a bare chord claim next to string talk is still caught', () => {
  const env = envelope({ mastery: [], lessonChords: [EM] });
  const result = checkInventedFacts('Your fingers are on the A and D strings, so your C is ready.', env);
  assert.equal(result.ok, false);
  assert.match(result.reason, /^invented_token:C$/);
});

test('the Oxford-comma string list is not read as chords', () => {
  const env = envelope({ mastery: [], lessonChords: [EM] });
  const prose = 'Keep your low E string open, place your middle finger on the A string at fret 2, your ring finger on the D string at fret 2, and let the G, B, and high e strings ring open.';
  assert.equal(checkInventedFacts(prose, env).ok, true);
});

test("the lesson's own number may be said out loud", () => {
  const env = envelope({ mastery: [], lessonId: 'l03', lessonChords: [EM] });
  assert.equal(checkInventedFacts('In lesson 03 we only need two fingers.', env).ok, true);
  assert.equal(checkInventedFacts('In lesson 3 we only need two fingers.', env).ok, true);
});

test('a different lesson number is still rejected', () => {
  const env = envelope({ mastery: [], lessonId: 'l03', lessonChords: [EM] });
  const result = checkInventedFacts('You nailed this back in lesson 9.', env);
  assert.equal(result.ok, false);
  assert.match(result.reason, /^invented_token:9$/);
});

// --- guardrail flake: "invented_token:E" on a legitimate first question,
// passes on identical retry (docs/plans/TIER-1B-close-the-gaps.md task 1C;
// originally logged in HANDOFF-NEXT.md / STATUS.md Wave 8 finding 4)
// ---------------------------------------------------------------------------
// Investigated: checkInventedFacts()/buildAllowedChordSet() are pure
// functions of (prose, envelope) with no module-level state, and
// lesson-runner.js's askCoachAbout() derives lessonChords synchronously from
// the already-in-memory lesson JSON on every call — so there is no
// request-ordering/async-population race in the literal sense (nothing here
// is "not yet populated" by the time of the very first call).
//
// The real, reproducible bug: a chord became "known" to the allow-list from
// three different sources — mastery[], lessonChords[], and the student's own
// typed question — but only the lessonChords source also licensed the bare
// root letter (addChordAndRoot in ../src/guardrail.js). The other two only
// added the exact matched token. A beginner's very first message about a
// chord is exactly the case where mastery[] is still empty (nothing recorded
// yet) and lessonChords may not carry it either (e.g. the practice screen,
// or any question about a chord the current lesson step's own shapes block
// doesn't happen to list) — so the ONLY source is the question the student
// just typed. Sage's answer to "How do I play Em?" naturally says "Em is
// short for E minor," and the bare "E" was rejected as `invented_token:E`
// on that first ask. Once mastery/lessonChords caught up (e.g. a retry after
// the lesson's own chords were sent, or the same question asked again once
// some other call had already widened the list via lessonChords), "E" was
// licensed and the identical question passed — the exact "rejects first,
// passes on retry" ordering reported. Fixed by sharing the root-licensing
// logic across all three sources.
test('a chord known only via mastery[] (nothing else populated yet) still licenses its root letter', () => {
  const env = envelope({ mastery: [{ chord: 'Em', label: 'not_started', confidence: 0 }] });
  const result = checkInventedFacts('Your Em is coming along — remember, Em is short for E minor.', env);
  assert.equal(result.ok, true);
});

test('a chord known only via the student\'s own first question still licenses its root letter — reproduces the original invented_token:E ordering', () => {
  // The exact failing shape: a beginner's very first message about a lesson's
  // chord, before any mastery or lessonChords fact about it exists — the
  // chord is known ONLY because the student just typed it.
  const env = envelope({ mastery: [], lessonChords: [], question: 'How do I play Em?' });

  // Before the fix, this was the ordering that reproduced the flake:
  //   1st call — chord known only from the question echo (no root license)
  //   -> the exact same prose was REJECTED with invented_token:E.
  const firstCallAllowedTokens = extractKnownTokens(env);
  assert.equal(firstCallAllowedTokens.chords.has('E'), true,
    'root letter must be licensed on the very first call, not only once mastery/lessonChords catch up');

  const prose = 'Start with Em — that shape is short for E minor, so anchor your middle finger first.';
  const firstCallResult = checkInventedFacts(prose, env);
  assert.equal(firstCallResult.ok, true, 'the first legitimate answer must not be rejected');

  // Retrying the identical question/prose must obviously still pass — this is
  // the "passes on retry" half of the originally reported ordering, and
  // proves the fix is not merely order-dependent luck.
  const retryResult = checkInventedFacts(prose, env);
  assert.equal(retryResult.ok, true);
});

// --- sentence-initial "A" as the English article, not the chord
// (2026-09-10) ---------------------------------------------------------
// Live verification of "Why does my Em chord buzz on the low string?"
// against a real lesson-3 (Em) envelope rejected the model's real,
// otherwise-correct reply 3/8 times with `invented_token:A`. The prose
// below is the ACTUAL captured text from one of those rejections (not a
// paraphrase) — the model opens with "A buzz on..." as the ordinary
// indefinite article, which STRING_REFERENCE_RE was never meant to cover
// (it is never followed by "string") and CHORD_TOKEN_RE cannot tell apart
// from the chord letter A. See SENTENCE_INITIAL_ARTICLE_A_RE in
// guardrail.js for the fix and full reasoning.
const EM_BUZZ_ENVELOPE_2026_09_10 = envelope({
  mastery: [],
  lessonId: 'L03-first-chord-em',
  lessonChords: [EM],
  question: 'Why does my Em chord buzz on the low string?',
});

test('the real captured "A buzz on..." reply is not rejected on the sentence-initial article (live repro 2026-09-10)', () => {
  const prose = "A buzz on that low string usually means your finger on the A string—that's your second finger at fret 2—is leaning in and muting it just slightly, or your hand angle is letting the string sit too close to the fret. Try rolling your finger back a touch so the tip is doing the work at fret 2, and keep your thumb behind the neck relaxed and loose. Give it a strum and listen—that low E should ring clean and open, with nothing touching it.";
  const result = checkInventedFacts(prose, EM_BUZZ_ENVELOPE_2026_09_10);
  assert.equal(result.ok, true);
});

test('a second real captured "A buzz on the low E..." reply is not rejected either (live repro 2026-09-10)', () => {
  const prose = "A buzz on the low E usually means one of two things: either that finger isn't pressing down hard enough, or your hand is tilting so the string is catching the edge of the fret instead of ringing clear above it. Try pressing your finger 2 on the A string a little firmer, and make sure your fingertips are angled so they hit the strings straight on, not from the side. No rush — give it a few clean presses and listen to how the buzz changes as you adjust.";
  const result = checkInventedFacts(prose, EM_BUZZ_ENVELOPE_2026_09_10);
  assert.equal(result.ok, true);
});

test('a real captured "A fret 2" reply (letter paired with "fret" instead of "string") is not rejected (live repro 2026-09-10)', () => {
  // Captured on a second live re-test pass, after the article fix above was
  // already in place: the model still said "the A string" once, but then
  // switched to the terser "the A fret 2" for the same fact, which never
  // contains the word "string" at all. See STRING_FRET_REFERENCE_RE.
  const prose = "The low E string is open, so it should ring clean—that buzz tells you one of your other fingers is touching it by accident. Check your finger 2 on the A string: it's easy to let it lean over and mute the E below. Press straight down on the A fret 2, keep your finger tip rounded, and leave a small gap between your finger and the low E. Give it a try and let me know what you hear. No rush—we will take the next clean strum together.";
  const result = checkInventedFacts(prose, EM_BUZZ_ENVELOPE_2026_09_10);
  assert.equal(result.ok, true);
});

test('a bare letter with no string qualifier is still rejected even at a sentence boundary (narrow-exemption guard)', () => {
  const env = envelope({ mastery: [], lessonChords: [] });
  // Not sentence-initial: "your A" is still caught exactly as before.
  const midSentence = checkInventedFacts('Nice progress today. Your A is sounding great!', env);
  assert.equal(midSentence.ok, false);
  assert.match(midSentence.reason, /^invented_token:A$/);

  // Sentence-initial but immediately followed by "chord"/"minor" — the
  // grammatical subject of a real claim about the chord, not the article —
  // must still be caught, proving the exemption did not widen to cover it.
  const chordWord = checkInventedFacts('A chord like that takes practice to get clean.', env);
  assert.equal(chordWord.ok, false);
  assert.match(chordWord.reason, /^invented_token:A$/);

  const minorWord = checkInventedFacts('A minor is different from Em in only one note.', env);
  assert.equal(minorWord.ok, false);
  assert.match(minorWord.reason, /^invented_token:A$/);
});

test('sanity: before the shared root-licensing fix, a question-only chord did NOT license its root (regression guard)', () => {
  // This pins down the actual pre-fix behavior so a future refactor can't
  // silently reintroduce the asymmetry: the question-echo path alone (no
  // addChordAndRoot) only ever added the exact matched token, never its root.
  const env = envelope({ mastery: [], lessonChords: [], question: 'How do I play Em?' });
  const set = new Set();
  for (const token of (env.question.match(/\b[A-G](?:#|b)?(?:maj|min|m|dim|aug|sus|add)?\d{0,2}\b/g) || [])) {
    set.add(token);
    set.add(token.toLowerCase());
    set.add(token.toUpperCase());
  }
  // The unfixed widening reaches "Em"/"em"/"EM" but never the bare root "E" —
  // demonstrating the exact allow-list gap that produced invented_token:E.
  assert.equal(set.has('Em'), true);
  assert.equal(set.has('E'), false);
});
