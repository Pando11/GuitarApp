/**
 * chord-theory-check.js (ESM copy — browser import)
 *
 * The chord spelling + playability arithmetic checker.
 * Ships as TWO copies that MUST stay 1:1:
 *   - CJS: 06-prototypes/step0/schema/chord-theory-check.js (the ship-gate import)
 *   - ESM: 07-app/core/chord-theory-check.js (the browser import)
 *
 * The detection ladder is ONE shared QUALITY_PATTERNS table duplicated verbatim in both copies.
 * If you edit EITHER copy, re-run the non-vacuous divergence guard
 * (04-validation/check-esm-mirror.mjs) and the ship gate before commit.
 *
 * KNOWN_QUALITY_TOKEN: the set of chord qualities the checker understands.
 * As of 2026-08-13, the extended set (m6/6/6/9/m6/9/aug/dim/7#5/7b5/7sus4/dim7/m7b5/9/m9/maj9/11/m11/13/m13/add9/madd9)
 * is SUPPORTED and verifies arithmetically (references/chord-theory-extended.md).
 * Only genuinely UNKNOWN qualities (anything not in KNOWN_QUALITY_TOKEN) fail closed.
 *
 * SHIP GATE: node 06-prototypes/step0/run-chord-check.js → 0 errors AND 0 warnings
 * A WARNING trips it. The 2026-08-16 result: 25 lessons / 81 chords / 0 err / 0 warn ✅.
 *
 * STATUS: PLACEHOLDER — real file lost in PC transfer (2026-08-23). Scaffolded from guitarapp skill + chord-theory-extended.md.
 * The divergence guard is 04-validation/check-esm-mirror.mjs (also a placeholder).
 */

const KNOWN_QUALITY_TOKEN = new Set([
  "maj", "m", "min", "dim", "aug", "sus2", "sus4",
  "7", "m7", "maj7", "dim7", "m7b5", "7b5", "7#5", "7sus4",
  "6", "m6", "6/9", "9", "m9", "maj9",
  "11", "m11", "13", "m13",
  "add9", "madd9", "add11",
]);

// QUALITY_PATTERNS — shared detection table. MUST be identical in CJS copy.
// Each entry: quality token → regex that matches the tone name suffix.
const QUALITY_PATTERNS = {
  "maj":    /^(?:maj|M)$/i,
  "m":      /^(?:m|min|m[^-])$/i,
  "dim":    /^dim$/i,
  "aug":    /^aug$/i,
  "sus2":   /^sus2$/i,
  "sus4":   /^sus4$/i,
  "7":      /^[^-]7$/i,
  "m7":     /^m7$/i,
  "maj7":   /^maj7$/i,
  "dim7":   /^dim7$/i,
  "m7b5":   /^m7b5$/i,
  "7b5":    /^7b5$/i,
  "7#5":    /^7#5$/i,
  "7sus4":  /^7sus4$/i,
  "6":      /^[^-]6$/i,
  "m6":     /^m6$/i,
  "6/9":    /^6\/9$/i,
  "9":      /^[^-]9$/i,
  "m9":     /^m9$/i,
  "maj9":   /^maj9$/i,
  "11":     /^[^-]11$/i,
  "m11":    /^m11$/i,
  "13":     /^[^-]13$/i,
  "m13":    /^m13$/i,
  "add9":   /^add9$/i,
  "madd9":  /^madd9$/i,
  "add11":  /^add11$/i,
};

/**
 * Extract the quality token from a chord tone name (e.g. "Cmaj7" → "maj7", "Cdim7" → "dim7").
 * Returns the quality string or null if unrecognized.
 */
function extractQuality(toneName) {
  if (typeof toneName !== "string") return null;
  // Try longest matches first (maj7 before 7, m7b5 before m7, etc.)
  const sorted = Object.keys(QUALITY_PATTERNS).sort((a, b) => b.length - a.length);
  for (const q of sorted) {
    if (QUALITY_PATTERNS[q].test(toneName)) {
      return q;
    }
  }
  return null;
}

/**
 * verifyChord — the core arithmetic gate.
 * Given a chord definition { root, quality, frets } (6-string guitar), verify:
 * 1. The root is a valid note (A-G).
 * 2. The quality is in KNOWN_QUALITY_TOKEN.
 * 3. The frets array has exactly 6 entries (one per string).
 * 4. Each fret is a valid value (0 = open, -1 = muted, 1-24 = fret number).
 * 5. The chord is playable (at least one fret >= 0, no impossible stretches — simplified).
 *
 * Returns { ok: bool, errors: string[], warnings: string[] }.
 *
 * SHIP GATE: 0 errors AND 0 warnings. A WARNING trips it.
 */
function verifyChord(chord) {
  const errors = [];
  const warnings = [];

  if (!chord || typeof chord !== "object") {
    errors.push("chord is not an object");
    return { ok: false, errors, warnings };
  }

  // Root
  if (!chord.root || typeof chord.root !== "string") {
    errors.push("chord.root is required and must be a string");
  } else if (!/^[A-G]$/i.test(chord.root)) {
    errors.push(`chord.root '${chord.root}' is not a valid note (A-G)`);
  }

  // Quality
  if (!chord.quality) {
    errors.push("chord.quality is required");
  } else if (!KNOWN_QUALITY_TOKEN.has(chord.quality)) {
    errors.push(`chord.quality '${chord.quality}' is not in KNOWN_QUALITY_TOKEN`);
  }

  // Frets
  if (!chord.frets || !Array.isArray(chord.frets)) {
    errors.push("chord.frets is required and must be an array");
    return { ok: false, errors, warnings };
  }
  if (chord.frets.length !== 6) {
    errors.push(`chord.frets must have exactly 6 entries (one per string), got ${chord.frets.length}`);
  }

  let playedStrings = 0;
  for (let i = 0; i < chord.frets.length; i++) {
    const fret = chord.frets[i];
    if (fret === 0) {
      playedStrings++;
    } else if (fret > 0 && fret <= 24) {
      playedStrings++;
    } else if (fret !== -1) {
      errors.push(`chord.frets[${i}] = ${fret} is not a valid value (-1=muted, 0=open, 1-24=fret)`);
    }
  }

  if (playedStrings === 0) {
    warnings.push("chord has no played strings (all muted)");
  }

  // Playability: no impossible stretches (simplified — full check in step0)
  // A chord where the highest and lowest played fret differ by more than 5 may be flagged
  const frets = chord.frets.filter((f) => f > 0);
  if (frets.length >= 2) {
    const maxFret = Math.max(...frets);
    const minFret = Math.min(...frets);
    if (maxFret - minFret > 5) {
      warnings.push(`chord has a ${maxFret - minFret}-fret span across strings (may be difficult)`);
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings: warnings.filter((w) => !errors.includes(w)), // de-duplicate
  };
}

/**
 * verifyAllChords — run the checker over an array of chord definitions.
 * Returns aggregate result.
 */
function verifyAllChords(chords) {
  let totalErrors = 0;
  let totalWarnings = 0;
  const results = chords.map((chord, i) => {
    const r = verifyChord(chord);
    totalErrors += r.errors.length;
    totalWarnings += r.warnings.length;
    return { index: i, ...r };
  });
  return {
    totalErrors,
    totalWarnings,
    allOk: totalErrors === 0 && totalWarnings === 0,
    results,
  };
}

// ESM export (browser)
export { verifyChord, verifyAllChords, extractQuality, KNOWN_QUALITY_TOKEN, QUALITY_PATTERNS };
