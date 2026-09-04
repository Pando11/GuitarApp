// stylisticExplorer.js — V2-FEATURES / A4.3
// exploreStyle(chordOrProgression) -> {pattern, rhythmFeel, countsPerBar, styleCategory}
// for ONE bar with counts.
//
// Style expressed as a CATEGORY ONLY (folk / blues / punk / ballad ...) —
// NO artist names (AMENDMENT-14). Ported logic from
// 06-prototypes/song-styles-q5-prototype.html (G-D-Em-C shown three ways).
// Rule 5 safe: categories + strum counts only, no musical opinion/praise.

export const STYLE_LIBRARY = {
  folk: {
    styleCategory: 'folk',
    pattern: '1 & 2 & 3 & 4 &',
    arrows: '↓ ↓ ↑ ↑ ↓ ↑',
    rhythmFeel: 'steady strum with held beats — the rhythm breathes',
    countsPerBar: '1 & 2 & 3 & 4 &',
  },
  blues: {
    styleCategory: 'blues',
    pattern: '1 & 2 & 3 & 4 &',
    arrows: '↓ ↓ ↑ ↓ ↓ ↑',
    rhythmFeel: 'swung strums — the time leans, push-pull',
    countsPerBar: '1 & 2 & 3 & 4 &',
  },
  punk: {
    styleCategory: 'punk',
    pattern: '1 & 2 & 3 & 4 &',
    arrows: '↓ ↓ ↓ ↓',
    rhythmFeel: 'short hard downstrokes with silence between — driving, not busy',
    countsPerBar: '1 & 2 & 3 & 4 &',
  },
  ballad: {
    styleCategory: 'ballad',
    pattern: '1 & 2 & 3 & 4 &',
    arrows: '↓ & ↑ & ↓ & ↑ &',
    rhythmFeel: 'slow, spacious, full ringing strums',
    countsPerBar: '1 & 2 & 3 & 4 &',
  },
};

const CATEGORIES = Object.keys(STYLE_LIBRARY);

// Deterministic (data-only) category pick — no personality/mood inference.
function deriveCategory(input) {
  const s = String(input || '');
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return CATEGORIES[h % CATEGORIES.length];
}

// Normalise "G - D - Em - C" / "G D Em C" / "G" -> ["G","D","Em","C"]
function normalizeBar(chordOrProgression) {
  const s = String(chordOrProgression || '').trim();
  return s.split(/[\s\-–,]+/).map((c) => c.trim()).filter(Boolean);
}

export function exploreStyle(chordOrProgression, opts = {}) {
  const bar = normalizeBar(chordOrProgression);
  const styleCategory = opts && opts.styleCategory && STYLE_LIBRARY[opts.styleCategory]
    ? opts.styleCategory
    : deriveCategory(chordOrProgression);
  const lib = STYLE_LIBRARY[styleCategory];

  return {
    input: chordOrProgression,
    bar,
    styleCategory: lib.styleCategory,
    pattern: lib.pattern,
    arrows: lib.arrows,
    rhythmFeel: lib.rhythmFeel,
    countsPerBar: lib.countsPerBar,
    stylesAvailable: CATEGORIES, // the ported "three approaches" preserved
  };
}

export default exploreStyle;
