// tts-normalize.js — convert chord symbols in SPOKEN text into words the
// speech engine can say correctly.
//
// WHY: lesson captions + teacher persona_lines contain bare chord symbols
// ("Em", "C", "G"...). The browser/API speech engine reads "E" + "m" as the
// two letters and says "m" — confirmed bug in L02 ("That is Em" → "that is m").
// On-screen we still show "Em" (a chord symbol is correct visually); we only
// fix what gets SPOKEN. Every speak() call passes through normalizeForTTS().
//
// DESIGN RULES (kept deliberately conservative, see test):
//  - Only uppercase chord tokens are matched (lowercase "a" article is safe).
//  - A token already followed by "(major|minor)" is NOT double-expanded
//    ("C major" stays "C major", never "C major major").
//  - The teaching label "easy C" is protected — stays "easy C", not "easy C major".
//  - Unknown tokens fall through unchanged (fail-open, never mangles text).

const CHORD_SPEECH_MAP = {
  Em: 'E minor',
  Am: 'A minor',
  Dm: 'D minor',
  Bm: 'B minor',
  C:  'C major',
  G:  'G major',
  D:  'D major',
  A:  'A major',
  E:  'E major',
  B:  'B major',
};

// Order: longer/more-specific first so "Em" wins over "E", "Dm" over "D", etc.
const CHORD_TOKENS = ['Em', 'Am', 'Dm', 'Bm', 'C', 'G', 'D', 'A', 'E', 'B'];

// (?<![A-Za-z])      token is not mid-word
// (?<!easy\s)        protect the "easy C" teaching label
// (?![A-Za-z])       not followed by more letters (so "Em7" etc. untouched)
// (?<!low\s)(?<!high\s)  protect "low E" / "high e" string names (direction word BEFORE the letter)
// (?!\s*(?:major|minor|string|note|first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|fret))  protect
//   "A string" / "A note" / "A second fret" / "D third fret" — A/D/... used as STRING names, not chords
// (?!\s*\d)  protect "G 3" / "E 2" style string-position shorthand
// (?!\s*(?:major|minor))  already expanded → don't double
const CHORD_TTS_RE = new RegExp(
  '(?<![A-Za-z])(?<!(?:easy|low|high)\\s)(' + CHORD_TOKENS.join('|') + ')(?![A-Za-z])(?!\\s*(?:major|minor|string|note|first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|fret))(?!\\s*\\d)',
  'g'
);

export function normalizeForTTS(text) {
  if (!text || typeof text !== 'string') return text;
  return text.replace(CHORD_TTS_RE, (m) => CHORD_SPEECH_MAP[m] || m);
}

export { CHORD_SPEECH_MAP };
