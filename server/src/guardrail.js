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

function buildAllowedChordSet(envelope) {
  const set = new Set();
  const mastery = Array.isArray(envelope?.mastery) ? envelope.mastery : [];
  for (const m of mastery) {
    if (m && typeof m.chord === 'string') {
      set.add(m.chord);
      set.add(m.chord.toLowerCase());
      set.add(m.chord.toUpperCase());
    }
  }
  return set;
}

function buildAllowedNumberSet(envelope) {
  const set = new Set();

  const addNumber = (n) => {
    if (typeof n !== 'number' || !Number.isFinite(n)) return;
    set.add(String(n));
    // common display forms: rounded, and as a percentage
    set.add(String(Math.round(n)));
    set.add(`${n}%`);
    set.add(`${Math.round(n)}%`);
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
export function checkInventedFacts(prose, envelope) {
  if (typeof prose !== 'string' || !prose.length) {
    return { ok: false, reason: 'invented_token:<empty_prose>' };
  }

  const { chords, numbers } = extractKnownTokens(envelope);

  const chordMatches = prose.match(CHORD_TOKEN_RE) || [];
  for (const token of chordMatches) {
    if (!chords.has(token)) {
      return { ok: false, reason: `invented_token:${token}` };
    }
  }

  const numberMatches = prose.match(NUMBER_TOKEN_RE) || [];
  for (const token of numberMatches) {
    if (!numbers.has(token)) {
      return { ok: false, reason: `invented_token:${token}` };
    }
  }

  return { ok: true };
}
