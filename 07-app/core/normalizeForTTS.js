// normalizeForTTS.js — text-normalization helper for text-to-speech input.
//
// Why this exists: TTS engines (both the server-side Kokoro voice in
// server/src/voiceGen.js and the browser's built-in `speechSynthesis`
// fallback used elsewhere in the app) read chord symbols badly — "Em" comes
// out as the letter "m", "D7" comes out as "D seven" only by luck, etc.
// This module is the single place that fixes that, plus a small pass that
// strips a few specific AI-generated-sounding phrases that read poorly out
// loud. It is client-side-safe (no server dependency, no API key) so it can
// be imported both from a server-side text-prep step and from the browser
// fallback path — neither wiring is done in this file; callers own that.
//
// Scope note: this is a plain find/replace pass, not a music-theory parser
// and not a general prose rewriter. It only recognizes chord tokens that
// look like <root><accidental?><quality?> as a whole word (e.g. "Em", "C",
// "G", "Am", "D7", "F#m7", "Bbmaj7"). A capitalized word that happens to
// collide with a chord shape — e.g. "Am" at the start of "Am I ready?" — will
// be misread as "A minor"; that ambiguity is inherent to the notation and is
// an accepted limitation here, not a bug to chase inside this ticket.

// Chord quality suffixes, longest-first so e.g. "maj7" is matched whole
// rather than as "maj" + a stray "7".
const QUALITIES = [
  ['maj7', 'major seven'],
  ['min7', 'minor seven'],
  ['dim7', 'diminished seven'],
  ['m7', 'minor seven'],
  ['sus2', 'sus two'],
  ['sus4', 'sus four'],
  ['add9', 'add nine'],
  ['maj', 'major'],
  ['min', 'minor'],
  ['dim', 'diminished'],
  ['aug', 'augmented'],
  ['m', 'minor'],
  ['7', 'seven'],
  ['9', 'nine'],
  ['6', 'six'],
  ['5', 'five'],
];

const QUALITY_PATTERN = QUALITIES.map(([sym]) => sym).join('|');

// A whole-word chord token: root note A-G, optional # / b accidental,
// optional quality suffix from QUALITIES above.
const CHORD_TOKEN_RE = new RegExp(`\\b([A-G])(#|b)?(${QUALITY_PATTERN})?\\b`, 'g');

function spellChordToken(root, accidental, quality) {
  let spoken = root;
  if (accidental === '#') spoken += ' sharp';
  else if (accidental === 'b') spoken += ' flat';
  if (quality) {
    const match = QUALITIES.find(([sym]) => sym === quality);
    if (match) spoken += ` ${match[1]}`;
  }
  return spoken;
}

/** Converts chord-symbol whole-word tokens in `text` into their spoken form. */
export function normalizeChordSymbols(text) {
  if (typeof text !== 'string' || !text) return text;
  return text.replace(CHORD_TOKEN_RE, (full, root, accidental, quality) => {
    // No accidental and no quality means nothing to change (e.g. bare "C",
    // "G") — return the original token untouched.
    if (!accidental && !quality) return full;
    return spellChordToken(root, accidental, quality);
  });
}

// Specific AI-isms to strip verbatim. This is intentionally a short,
// literal list — not a general style rewrite — per the ticket.
const AI_ISM_PATTERNS = [
  /\bFurthermore,\s*/g,
  /\bIt is important to note that\s*/gi,
  /\bSimply\s+/g,
];

/** Removes a short list of known AI-sounding filler phrases, verbatim. */
export function stripAIIsms(text) {
  if (typeof text !== 'string' || !text) return text;
  let out = text;
  for (const pattern of AI_ISM_PATTERNS) out = out.replace(pattern, '');
  return out;
}

function collapseWhitespace(text) {
  return text.replace(/[ \t]{2,}/g, ' ').replace(/[ \t]+\n/g, '\n').trim();
}

/**
 * normalizeForTTS(text) -> string
 *
 * Prepares coaching prose for speech synthesis: strips a short list of
 * known AI-sounding filler phrases, then rewrites chord-symbol tokens
 * ("Em", "D7", ...) into their spoken form ("E minor", "D seven", ...).
 * Normal prose (non-chord words, punctuation, sentence structure) is left
 * untouched. Safe to call on empty/non-string input (returns it as-is).
 */
export function normalizeForTTS(text) {
  if (typeof text !== 'string' || !text) return text;
  let out = stripAIIsms(text);
  out = collapseWhitespace(out);
  out = normalizeChordSymbols(out);
  return out;
}

export default normalizeForTTS;
