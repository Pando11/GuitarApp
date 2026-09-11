// guardrail.js — the machine-enforced version of Rule 5. Best-effort
// heuristic, NOT a proof: it cannot understand meaning, only tokens. Its job
// is to catch the model citing a chord or number that wasn't in the facts
// envelope, and reject the prose so the handler can fall back to template
// text instead. See guardrail.test.js for adversarial cases proving the
// reject path actually fires, and a safe-prose case proving it doesn't
// false-positive on ordinary text.

// Chord-shaped token: a valid note letter A-G, optional sharp/flat, optional
// quality suffix, optional number. Restricted to A-G specifically so we don't
// flag ordinary capitalized words/initials as "chords".
const CHORD_TOKEN_RE = /\b[A-G](?:#|b)?(?:maj|min|m|dim|aug|sus|add)?\d{0,2}\b/g;

// Digit sequences, with or without a trailing %. Deliberately does NOT match
// spelled-out numbers ("one more time") — only literal digits, to avoid
// flagging ordinary encouragement language.
const NUMBER_TOKEN_RE = /\d+(?:\.\d+)?%?/g;

// The lesson's verified chord shapes, normalized to an array. Shared by the
// chord and number allow-lists so they cannot drift apart.
function lessonChords(envelope) {
  const raw = Array.isArray(envelope?.lessonChords) ? envelope.lessonChords : [];
  return raw.filter((s) => s && typeof s.chord === 'string' && s.chord);
}

// Adds a known chord AND its bare root letter to the allow-list. Naming a
// chord licenses saying its root out loud — explaining "Em" necessarily means
// saying "E minor" — and that is true no matter WHICH of the three sources
// (mastery, the lesson's own verified shapes, or the student's own typed
// question) is where the chord became known. Before this was shared, only the
// lessonChords loop below granted the root; a chord known ONLY via mastery[]
// or ONLY via the student's own question (e.g. a beginner's very first
// message, before any lesson-chords/mastery fact about it exists yet — "How
// do I play Em?" followed by an answer that says "Em is short for E minor")
// still had its bare "E" rejected as `invented_token:E`. Same fact, told from
// a different one of the three lists, was licensed or not purely by which
// list happened to carry it — the actual bug behind the "guardrail flake"
// that rejected one legitimate first answer and then passed the identical
// question's answer once mastery/lessonChords had caught up. See
// guardrail.test.mjs's "known only via ..." cases.
function addChordAndRoot(set, chord) {
  if (typeof chord !== 'string' || !chord) return;
  set.add(chord);
  set.add(chord.toLowerCase());
  set.add(chord.toUpperCase());
  const root = chord.match(/^[A-G](?:#|b)?/);
  if (root) {
    set.add(root[0]);
    set.add(root[0].toLowerCase());
    set.add(root[0].toUpperCase());
  }
}

function buildAllowedChordSet(envelope) {
  const set = new Set();
  const mastery = Array.isArray(envelope?.mastery) ? envelope.mastery : [];
  for (const m of mastery) {
    if (m && typeof m.chord === 'string') {
      addChordAndRoot(set, m.chord);
    }
  }
  // The chords the lesson on screen actually teaches (schema.js
  // lessonChords). A beginner sitting in lesson 3 has no recorded mastery
  // yet, so before this the model could not name Em without being rejected —
  // Em being the entire subject of that lesson. Naming a chord the lesson
  // itself puts on the page is not inventing a fact about this student.
  for (const shape of lessonChords(envelope)) {
    addChordAndRoot(set, shape.chord);
  }

  // A student who types "how do I get from G to D?" has named G and D
  // themselves. Echoing those back is answering the question, not inventing a
  // fact, so every chord-shaped token in their own question joins the
  // allow-list, WITH the same root-letter license as the other two sources
  // (see addChordAndRoot above — this used to stop short of the root,
  // which is the bug this fixes). This widens the list only for the request
  // that carried the question — it is derived from that request's own input,
  // never stored.
  for (const token of questionTokens(envelope, CHORD_TOKEN_RE)) {
    addChordAndRoot(set, token);
  }
  return set;
}

// Pull the tokens a given pattern finds inside the student's typed question.
// Returns [] whenever there is no question, which is the original behavior.
function questionTokens(envelope, pattern) {
  const question = envelope && typeof envelope.question === 'string' ? envelope.question : '';
  if (!question) return [];
  return question.match(pattern) || [];
}

function buildAllowedNumberSet(envelope) {
  const set = new Set();

  // Fret and finger numbers off the lesson's own verified shapes. "Your index
  // goes on the 2nd fret" is reading the diagram on the page aloud, not a
  // claim about this student — and it is the whole point of sending the
  // shapes: the model no longer has to guess a fret, so it should not be
  // rejected for stating the right one.
  for (const shape of lessonChords(envelope)) {
    for (const field of ['frets', 'fingers']) {
      const arr = Array.isArray(shape[field]) ? shape[field] : [];
      for (const n of arr) {
        if (typeof n !== 'number') continue;
        set.add(String(n));
      }
    }
  }

  const addNumber = (n) => {
    if (typeof n !== 'number' || !Number.isFinite(n)) return;
    set.add(String(n));
    // common display forms: rounded, and as a percentage
    set.add(String(Math.round(n)));
    set.add(`${n}%`);
    set.add(`${Math.round(n)}%`);
    // The numeric value itself, for the tolerance check in
    // checkInventedFacts — see numberIsDerivable. A score arrives as a raw
    // float like 0.7166666666666667 and the model naturally writes "0.71",
    // which is the same fact shown to fewer places, not a different one.
    set.add(n);
    // A 0..1 ratio read aloud as a percentage is also the same fact.
    if (n >= 0 && n <= 1) set.add(Math.round(n * 100));
  };

  if (envelope?.learnerProfile && typeof envelope.learnerProfile.minutesPerDay === 'number') {
    addNumber(envelope.learnerProfile.minutesPerDay);
  }

  const mastery = Array.isArray(envelope?.mastery) ? envelope.mastery : [];
  for (const m of mastery) {
    if (m && typeof m.confidence === 'number') addNumber(m.confidence);
  }

  if (envelope?.justHappened) {
    addNumber(envelope.justHappened.score);
    addNumber(envelope.justHappened.ratePerMin);
  }

  const recentHistory = Array.isArray(envelope?.recentHistory) ? envelope.recentHistory : [];
  for (const h of recentHistory) {
    if (h && typeof h.confidenceDelta === 'number') addNumber(h.confidenceDelta);
  }

  // Same reasoning as the chord set: a number the student typed ("what's the
  // 3rd fret?") is theirs, and repeating it back is not an invented fact.
  for (const token of questionTokens(envelope, NUMBER_TOKEN_RE)) {
    set.add(token);
  }

  // The lesson's own id. "Lesson l03" reads back as the number 03, and the
  // model saying "in lesson 3 we only need two fingers" was rejected on
  // `invented_token:03` (2026-09-08). Naming where the student is sitting is
  // reading the envelope aloud, not asserting anything new about them.
  if (typeof envelope?.lessonId === 'string') {
    for (const token of envelope.lessonId.match(NUMBER_TOKEN_RE) || []) {
      set.add(token);
      // "l03" is lesson 3 when a teacher says it out loud.
      const asNumber = Number(token);
      if (Number.isFinite(asNumber)) set.add(String(asNumber));
    }
  }

  return set;
}

/**
 * Extract the token allow-lists from a sanitized envelope, BEFORE the model
 * is ever called. Exposed for tests and for callers that want to inspect
 * what's allowed without re-deriving it.
 */
export function extractKnownTokens(envelope) {
  return {
    chords: buildAllowedChordSet(envelope),
    numbers: buildAllowedNumberSet(envelope),
  };
}

/**
 * Check model-generated prose for any chord name or number not present in
 * the input envelope. Returns {ok: true} if clean, or
 * {ok: false, reason: 'invented_token:<token>'} on the first violation found.
 */
// "the A string", "your low E string", "the high e string" — a reference to
// one of the six open strings, not a claim about a chord the student plays.
// Standard tuning is a constant of the instrument: naming a string is true for
// every student on earth and asserts nothing about this one, so it cannot be
// an invented fact. Left in place, these read as chord tokens and reject
// otherwise-good prose — "How do I make Em sound clean?" was rejected on
// `invented_token:A` for exactly this reason (2026-09-08), which is most of
// what a teacher says when answering a fingering question.
//
// Widened 2026-09-08 to cover the plural: a teacher answering a fingering
// question says "the A and D strings" at least as often as "the A string",
// and the singular-only pattern rejected those answers on `invented_token:A`
// even after the lesson's own shape was being sent. The list form ("E, A, D,
// G, B and e strings") is the same sentence with more strings named.
//
// Deliberately narrow: ONLY note letters directly qualified by the word
// "string"/"strings" are exempted. A bare "your A is sounding great" is still
// a claim about the student and is still caught.
// The separator between two named strings is a comma, a conjunction, or both
// at once — "the G, B, and high e strings" is the Oxford-comma form and is
// exactly what the model wrote when asked which fingers go where (2026-09-08).
const STRING_SEPARATOR = String.raw`(?:\s*,\s*(?:and|or|&)?\s*|\s+(?:and|or|&|through|to)\s+)`;
const NOTE_LETTER = String.raw`(?:(?:low|high)\s*)?[A-Ga-g](?:#|b)?`;
const STRING_REFERENCE_RE = new RegExp(
  String.raw`\b${NOTE_LETTER}(?:${STRING_SEPARATOR}${NOTE_LETTER})*\s+strings?\b`,
  'g',
);

export function checkInventedFacts(prose, envelope) {
  if (typeof prose !== 'string' || !prose.length) {
    return { ok: false, reason: 'invented_token:<empty_prose>' };
  }

  const { chords, numbers } = extractKnownTokens(envelope);

  const chordScannable = prose.replace(STRING_REFERENCE_RE, ' ');
  const chordMatches = chordScannable.match(CHORD_TOKEN_RE) || [];
  for (const token of chordMatches) {
    if (!chords.has(token)) {
      return { ok: false, reason: `invented_token:${token}` };
    }
  }

  const numberMatches = prose.match(NUMBER_TOKEN_RE) || [];
  for (const token of numberMatches) {
    if (numbers.has(token)) continue;
    if (numberIsDerivable(token, numbers)) continue;
    return { ok: false, reason: `invented_token:${token}` };
  }

  return { ok: true };
}

/**
 * Is `token` a shortened rendering of some number the envelope actually
 * carries? Exact string matching alone rejected real, correct prose: a drill
 * score arrives as 0.7166666666666667 and the model writes "0.71", which is
 * the same number to fewer decimal places (observed 2026-09-08 —
 * `invented_token:0.71` on an otherwise clean coaching line).
 *
 * The comparison is deliberately tight. A token written to d decimal places
 * must sit within one unit in that last place of an allowed value, so it
 * matches whether the model rounded or truncated, and nothing further. "0.71"
 * and "0.72" both clear 0.7166; "0.9" does not. A trailing % is read as the
 * same value expressed per hundred, since the allowed set already carries the
 * percentage form of any 0..1 ratio.
 */
function numberIsDerivable(token, allowed) {
  const isPercent = token.endsWith('%');
  const digits = isPercent ? token.slice(0, -1) : token;
  const value = Number(digits);
  if (!Number.isFinite(value)) return false;

  const dot = digits.indexOf('.');
  const decimals = dot === -1 ? 0 : digits.length - dot - 1;
  const tolerance = Math.pow(10, -decimals);

  for (const candidate of allowed) {
    if (typeof candidate !== 'number') continue;
    if (Math.abs(candidate - value) <= tolerance) return true;
    // The same value stated per hundred, in either direction.
    if (Math.abs(candidate * 100 - value) <= tolerance) return true;
  }
  return false;
}
