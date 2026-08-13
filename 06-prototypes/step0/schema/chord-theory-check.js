// chord-theory-check.js — DETERMINISTIC chord verification. No human required.
// Computes the actual pitches a fingering produces on a standard-tuned guitar
// and checks them against the chord the lesson CLAIMS it is.
// This replaces "a guitarist eyeballs it" with arithmetic that cannot be wrong.
'use strict';

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
// Standard tuning, index 0 = low E (6th string) .. index 5 = high e (1st string)
// values = semitones above C, with octave, low E2 = 28 semitones above C0
const OPEN_MIDI = [40, 45, 50, 55, 59, 64]; // E2 A2 D3 G3 B3 E4 in MIDI

// interval recipes from the root, in semitones
const QUALITIES = {
  'maj':  [0, 4, 7],
  'min':  [0, 3, 7],
  '7':    [0, 4, 7, 10],
  'min7': [0, 3, 7, 10],
  'maj7': [0, 4, 7, 11],
  'sus2': [0, 2, 7],
  'sus4': [0, 5, 7],
  '5':    [0, 7],
  // --- extended / alterated chords (added 2026-08-13) ---
  // Tensions are spelled as their octave-normalized semitone offsets so the checker can
  // verify the actual pitch a fretted string produces (9->14, 11->17, 13->21).
  'm6':   [0, 3, 7, 9],          // minor triad + 6
  '6':    [0, 4, 7, 9],          // major triad + 6
  '6/9':  [0, 4, 7, 9, 14],      // major 6/9 (6 + 9)
  'm6/9': [0, 3, 7, 9, 14],      // minor 6/9
  'aug':  [0, 4, 8],             // +#5 (raised 5th)
  'dim':  [0, 3, 6],             // diminished triad (no 7th)
  '7#5':  [0, 4, 8, 10],         // dominant 7 with #5
  '7b5':  [0, 4, 6, 10],         // dominant 7 with b5
  '7sus4':[0, 5, 7, 10],         // dominant 7 suspended 4
  'dim7': [0, 3, 6, 9],          // fully-diminished 7 (bb7)
  'm7b5': [0, 3, 6, 10],         // half-diminished 7
  '9':    [0, 4, 7, 10, 14],     // dominant 9 (7th included by definition)
  'm9':   [0, 3, 7, 10, 14],     // minor 9
  'maj9': [0, 4, 7, 11, 14],     // major 9
  '11':   [0, 4, 7, 10, 14, 17], // dominant 11
  'm11':  [0, 3, 7, 10, 14, 17], // minor 11
  '13':   [0, 4, 7, 10, 14, 21], // dominant 13
  'm13':  [0, 3, 7, 10, 14, 21], // minor 13
  'add9': [0, 4, 7, 14],         // major triad + added 9, no 7th
  'madd9':[0, 3, 7, 14]          // minor triad + added 9, no 7th
};
// Tones that are REQUIRED — if absent the chord is not what its name claims.
// (2026-08-08 adversarial review: a missing 7th was only a warning, so "Am" named
// "Am7" passed. The defining tone of the chord must be an error, not a footnote.)
// For extended chords the DEFINING tension is required as an ERROR (you cannot call a
// voicing "C6" if it omits the 6th, nor "C9" without the b7/9). The triad shell stays
// required; non-defining tensions (e.g. the 9th of a 13th) are optional (warning only).
const REQUIRED = {
  'maj': [0, 4], 'min': [0, 3], '7': [0, 4, 10], 'min7': [0, 3, 10],
  'maj7': [0, 4, 11], 'sus2': [0, 2], 'sus4': [0, 5], '5': [0, 7],
  'm6': [0, 3, 9], '6': [0, 4, 9], '6/9': [0, 4, 9, 14], 'm6/9': [0, 3, 9, 14],
  'aug': [0, 4, 8], 'dim': [0, 3, 6], '7#5': [0, 4, 8, 10], '7b5': [0, 4, 6, 10],
  '7sus4': [0, 5, 7, 10], 'dim7': [0, 3, 6, 9], 'm7b5': [0, 3, 6, 10],
  '9': [0, 4, 10, 14], 'm9': [0, 3, 10, 14], 'maj9': [0, 4, 11, 14],
  '11': [0, 4, 10, 17], 'm11': [0, 3, 10, 17], '13': [0, 4, 10, 21], 'm13': [0, 3, 10, 21],
  'add9': [0, 4, 14], 'madd9': [0, 3, 14]
};
// Quality tokens we RECOGNIZE. Anything quality-looking that isn't here must FAIL CLOSED —
// before this fix, "Cdim"/"C6"/"G9" silently degraded to major and passed (blocker).
// Extended tokens moved to KNOWN on 2026-08-13 so they no longer fail-closed or degrade.
const KNOWN_QUALITY_TOKEN = /^(m|min|maj|maj7|m7|min7|minor|major|7|dom7|sus2|sus4|5|m6|6|6\/9|m6\/9|aug|dim|dim7|7#5|7b5|7sus4|9|m9|maj9|11|m11|13|m13|add9|madd9)$/i;
const UNKNOWN_QUALITY_TOKEN = /^(aug7)$/i;

// Parse a chord label like "E minor", "C major (standard)", "G major (3-finger)", "Am", "D"
// IMPORTANT: the root letter must be a STANDALONE token, not the first letter of a word.
// "Easy C" must resolve to C, not E. (Caught by the 2026-08-07 project-wide audit.)
function parseChordName(name) {
  const s = String(name || '').trim();
  if (!s) return null;

  // Strip parenthetical qualifiers: "C major (standard)" -> "C major"
  const bare = s.replace(/\([^)]*\)/g, ' ').trim();

  // Candidate tokens, in order. A root is a token that IS a note letter
  // (optionally with accidental) possibly glued to a quality suffix (Am, C#m7).
  const tokens = bare.split(/[\s,\/\-—]+/).filter(Boolean);

  // Words that look like they start with a note letter but are descriptors, not roots.
  const NON_ROOT = /^(easy|early|edge|adjusted|alt|alternate|advanced|beginner|basic|drop|dim|down|full|first|finger|fret|ground|gentle|barre|bar|clean|classic|common|core|double|extra|effortless|arpeggio|amended)/i;

  let root = null, restStr = '', unknownQuality = null;
  for (const tk of tokens) {
    const m = tk.match(/^([A-Ga-g])([#b]?)(.*)$/);
    if (!m) continue;
    const suffix = m[3];
    const looksLikeQuality = suffix === '' || /^(m|min|maj|sus|add|dim|aug|\d)/i.test(suffix);
    if (!looksLikeQuality) continue;
    if (NON_ROOT.test(tk)) continue;
    root = m[1].toUpperCase() + m[2];
    restStr = (suffix + ' ' + tokens.slice(tokens.indexOf(tk) + 1).join(' ')).toLowerCase();
    // 2026-08-08: detect a quality token we don't have a recipe for, so we can FAIL CLOSED
    // instead of silently treating "Cdim" as C major.
    const qtok = suffix.trim();
    if (qtok && !KNOWN_QUALITY_TOKEN.test(qtok)) {
      if (UNKNOWN_QUALITY_TOKEN.test(qtok)) unknownQuality = qtok;
      // try splitting like "add9" vs garbage; if it even LOOKS quality-like and isn't known, flag it
      else if (/^(add|dim|aug|\d|[6789#b])/.test(qtok)) unknownQuality = qtok;
    }
    // A space-separated numeric token after the root is part of the chord name ("A minor 7",
    // "D sus 4"). Merge it back so quality detection sees it. (2026-08-08 regression suite.)
    const after = tokens.slice(tokens.indexOf(tk) + 1);
    if (after.length && /^[0-9]+$/.test(after[0]) && (qtok === '' || /^[a-z]+$/.test(qtok))) {
      restStr = (qtok + after[0] + ' ' + after.slice(1).join(' ')).toLowerCase();
    }
    break;
  }
  if (!root) return null;

  root = root.replace('Db', 'C#').replace('Eb', 'D#').replace('Gb', 'F#')
             .replace('Ab', 'G#').replace('Bb', 'A#');

  // Quality may also be stated in the full original string ("2-finger reduction" etc. is ignored)
  const rest = restStr;
  let quality = 'maj';
  // --- extended / alterated chords (added 2026-08-13) ---
  // Specific forms first so the generic maj/min/7 branches below don't swallow them.
  // A slash in a label ("Cm6/9") is split into "m6" + "9" by the tokenizer, so we also
  // accept the space-separated "m6 9" / "6 9" forms here. Word spellings ("ninth",
  // "seventh", "six") are accepted alongside the numeric ones.
  // NOTE: \bm7b5 is intentionally NOT matched here — it belongs to the half-diminished
  // (m7b5) branch below. Including it here made the short form "Cm7b5" (no spaces)
  // resolve to dim7 instead of m7b5 (a silent degrade, caught 2026-08-13 regression).
  if (/\bdim.*7|\bdiminished\s*7|\bhalf.?dim/.test(rest)) quality = 'dim7';                    // fully-dim 7th
  else if (/\bm7b5|minor\s*7\s*flat\s*5|\bm7\s*b5/.test(rest)) quality = 'm7b5';              // half-dim 7th
  else if (/\baug|\baugmented/.test(rest)) quality = 'aug';                                   // +#5
  else if (/\bdim|\bdiminished/.test(rest)) quality = 'dim';                                   // dim triad
  else if (/\b7#5|seven.*sharp.*five|7\s*sharp\s*5/.test(rest)) quality = '7#5';              // dom 7 + #5
  else if (/\b7b5|seven.*flat.*five|7\s*flat\s*5/.test(rest)) quality = '7b5';                // dom 7 + b5
  else if (/\b7sus4|7\s*sus\s*4|7\s*suspended\s*4/.test(rest)) quality = '7sus4';            // dom 7 sus4
  else if (/\bm6\/9|\bm6\s*9/.test(rest)) quality = 'm6/9';                                   // minor 6/9
  else if (/\b6\/9|\b6\s*9/.test(rest)) quality = '6/9';                                       // major 6/9
  else if (/\bminor\s*six|minor\s*6|\bm6\b/.test(rest)) quality = 'm6';                        // minor + 6
  else if (/\bmajor\s*six|major\s*6|\bsixth\b|\b6\b/.test(rest)) quality = '6';                // major + 6
  else if (/\bminor\s*add\s*9|\bmadd9/.test(rest)) quality = 'madd9';                          // minor triad + 9
  else if (/\bmajor\s*add\s*9|add\s*9|add9/.test(rest)) quality = 'add9';                     // major triad + 9
  else if (/\bminor\s*ninth|minor\s*9|\bm9\b/.test(rest)) quality = 'm9';                    // minor 9
  else if (/\bmajor\s*nine|major\s*9|\bmaj9\b/.test(rest)) quality = 'maj9';                  // major 9
  else if (/\bninth|\bnine|\b9\b/.test(rest)) quality = '9';                                  // dominant 9
  else if (/\bminor\s*eleventh|minor\s*11|\bm11\b/.test(rest)) quality = 'm11';               // minor 11
  else if (/\beleventh|\bmajor\s*11|\b11\b/.test(rest)) quality = '11';                       // dominant 11
  else if (/\bminor\s*thirteenth|minor\s*13|\bm13\b/.test(rest)) quality = 'm13';             // minor 13
  else if (/\bthirteenth|\bmajor\s*13|\b13\b/.test(rest)) quality = '13';                     // dominant 13
  // --- base qualities (pre-existing, ordered so min7/maj7 win over bare minor/major) ---
  else if (/\bminor\s*(seventh|7)\b|\bmin\s*7\b|\bm7\b|^m7/.test(rest)) quality = 'min7';
  else if (/\bmajor\s*(seventh|7)\b|\bmaj\s*7\b|maj7/.test(rest)) quality = 'maj7';
  else if (/\bminor\b|^min\b|^m\b|\bmin\b|\bm\b/.test(rest)) quality = 'min';
  else if (/\bmajor\b|^maj\b|\bmaj\b/.test(rest)) quality = 'maj';
  else if (/sus\s*2/.test(rest)) quality = 'sus2';
  else if (/sus\s*4/.test(rest)) quality = 'sus4';
  else if (/\bseventh\b|\b7\b|dom7|^7/.test(rest)) quality = '7';
  else if (/\b5\b|power|^5/.test(rest)) quality = '5';
  return { root, quality, unknownQuality };
}

function pitchClassesOf(chord) {
  const out = [];
  for (let i = 0; i < 6; i++) {
    const f = chord.frets[i];
    if (f === null || f === undefined) continue; // muted
    out.push({ string: 6 - i, fret: f, pc: (OPEN_MIDI[i] + f) % 12, midi: OPEN_MIDI[i] + f });
  }
  return out;
}

// Verify a chord's fret data actually spells the chord its name claims.
function verifyChord(key, chord) {
  const errors = [], warnings = [];

  // 0. STRUCTURAL checks — this function must be self-contained because the audit and
  // ship gate call it WITHOUT schema/validate.js (2026-08-08 review: finger 9 and
  // 7-entry frets arrays passed before this).
  if (!chord || typeof chord !== 'object') return { key, ok: false, errors: ['chord is not an object'], warnings, notes: [] };
  if (!Array.isArray(chord.frets) || chord.frets.length !== 6)
    return { key, ok: false, errors: ['frets must be an array of exactly 6 entries'], warnings, notes: [] };
  if (!Array.isArray(chord.fingers) || chord.fingers.length !== 6)
    return { key, ok: false, errors: ['fingers must be an array of exactly 6 entries'], warnings, notes: [] };
  for (let i = 0; i < 6; i++) {
    const f = chord.frets[i], fg = chord.fingers[i];
    if (!(f === null || (Number.isInteger(f) && f >= 0 && f <= 24)))
      errors.push('frets[' + i + '] must be null or an integer 0-24 (got ' + JSON.stringify(f) + ')');
    if (!(fg === null || fg === 0 || fg === 1 || fg === 2 || fg === 3 || fg === 4))
      errors.push('fingers[' + i + '] must be null or 0-4 (got ' + JSON.stringify(fg) + ')');
  }
  if (errors.length) return { key, ok: false, errors, warnings, notes: [] };

  const parsed = parseChordName(chord.name);
  if (!parsed) return { key, ok: false, errors: ['cannot parse chord name: ' + chord.name], warnings, notes: [] };

  // 2026-08-08: FAIL CLOSED on qualities we have no recipe for. Before this, "Cdim"
  // named-chords with a C major shape passed silently. Refuse to judge, loudly.
  if (parsed.unknownQuality) {
    return { key, ok: false,
      errors: ['chord name "' + chord.name + '" uses quality "' + parsed.unknownQuality +
               '" which the checker has no recipe for — refusing to verify. Add a recipe or rename.'],
      warnings, notes: [] };
  }

  const rootPc = NOTES.indexOf(parsed.root);
  const recipe = QUALITIES[parsed.quality];
  if (rootPc < 0 || !recipe) return { key, ok: false, errors: ['unknown root/quality in: ' + chord.name], warnings, notes: [] };

  const expected = new Set(recipe.map(iv => (rootPc + iv) % 12));
  const sounded = pitchClassesOf(chord);
  const soundedPcs = new Set(sounded.map(n => n.pc));

  // 1. every sounding string must belong to the chord
  for (const n of sounded) {
    if (!expected.has(n.pc)) {
      errors.push('string ' + n.string + ' fret ' + n.fret + ' sounds ' + NOTES[n.pc] +
                  ' which is NOT in ' + parsed.root + ' ' + parsed.quality);
    }
  }
  // 2. REQUIRED tones must be present (root + 3rd always; the 7th for 7th-chords).
  // 2026-08-08 review: a missing b7 was only a warning, so "Am" named "Am7" passed.
  const req = REQUIRED[parsed.quality] || [0];
  for (const iv of recipe) {
    const pc = (rootPc + iv) % 12;
    if (!soundedPcs.has(pc)) {
      const label = iv === 0 ? 'root' : iv === 3 ? 'minor 3rd' : iv === 4 ? 'major 3rd'
                  : iv === 7 ? '5th' : iv === 10 ? 'b7' : iv === 11 ? 'maj7'
                  : iv === 2 ? '2nd' : iv === 5 ? '4th' : 'interval ' + iv;
      if (req.includes(iv)) {
        errors.push('REQUIRED tone ' + label + ' (' + NOTES[pc] + ') is missing — this is not a ' + chord.name);
      } else {
        warnings.push('the ' + label + ' (' + NOTES[pc] + ') is omitted (acceptable in a reduced voicing)');
      }
    }
  }
  // 3. bass note check — lowest sounding note is usually the root for open chords
  if (sounded.length) {
    const lowest = sounded.reduce((a, b) => (a.midi <= b.midi ? a : b));
    if (lowest.pc !== rootPc) {
      warnings.push('lowest note is ' + NOTES[lowest.pc] + ', not the root ' + parsed.root + ' (inversion / slash voicing)');
    }
  }
  // 4. playability: fingers must be physically sane
  const fretted = [];
  for (let i = 0; i < 6; i++) {
    const f = chord.frets[i], fg = chord.fingers[i];
    if (f === null || f === 0) {
      if (fg !== null && fg !== 0) errors.push('string ' + (6 - i) + ' is open/muted but assigns finger ' + fg);
      continue;
    }
    if (fg === 0 || fg === null) errors.push('string ' + (6 - i) + ' is fretted at ' + f + ' but no finger assigned');
    fretted.push({ string: 6 - i, fret: f, finger: fg });
  }
  // same finger on two different frets = impossible unless it's a barre (same fret)
  const byFinger = {};
  for (const d of fretted) { (byFinger[d.finger] = byFinger[d.finger] || []).push(d); }
  for (const [fg, ds] of Object.entries(byFinger)) {
    const frets = [...new Set(ds.map(d => d.fret))];
    if (frets.length > 1) errors.push('finger ' + fg + ' is on two different frets (' + frets.join(' and ') + ') — physically impossible');
    else if (ds.length > 1 && fg !== '1') warnings.push('finger ' + fg + ' barres ' + ds.length + ' strings (usually only the index finger barres)');
  }
  // stretch check
  if (fretted.length) {
    const fs = fretted.map(d => d.fret);
    const span = Math.max(...fs) - Math.min(...fs);
    if (span > 3) warnings.push('fret span of ' + span + ' is a wide stretch for a beginner');
  }
  // finger order: higher finger number should not be on a lower fret than a lower finger
  const sortedByFret = [...fretted].sort((a, b) => a.fret - b.fret);
  for (let i = 1; i < sortedByFret.length; i++) {
    if (sortedByFret[i].finger < sortedByFret[i - 1].finger &&
        sortedByFret[i].fret > sortedByFret[i - 1].fret) {
      warnings.push('finger ' + sortedByFret[i].finger + ' sits behind finger ' +
                    sortedByFret[i - 1].finger + ' — awkward but not impossible');
    }
  }

  const noteNames = sounded.map(n => NOTES[n.pc]);
  return {
    key, ok: errors.length === 0, errors, warnings,
    chordName: chord.name,
    spells: parsed.root + ' ' + parsed.quality,
    notes: noteNames,
    uniqueNotes: [...new Set(noteNames)]
  };
}

function verifyLesson(lessonJson) {
  const results = [];
  for (const [k, c] of Object.entries(lessonJson.chords || {})) {
    if (k.startsWith('_')) continue;
    results.push(verifyChord(k, c));
  }
  return { lessonId: lessonJson.lesson && lessonJson.lesson.id, results, allOk: results.every(r => r.ok) };
}

module.exports = { verifyChord, verifyLesson, parseChordName, NOTES, OPEN_MIDI, QUALITIES };
