// chord-theory-check.js — DETERMINISTIC chord verification (Hard Ban 7, arithmetic).
// PORTED 1:1 from 06-prototypes/step0/schema/chord-theory-check.js. Browser-free.

export const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const OPEN_MIDI = [40, 45, 50, 55, 59, 64];

export const QUALITIES = {
  'maj':  [0, 4, 7],
  'min':  [0, 3, 7],
  '7':    [0, 4, 7, 10],
  'min7': [0, 3, 7, 10],
  'maj7': [0, 4, 7, 11],
  'sus2': [0, 2, 7],
  'sus4': [0, 5, 7],
  '5':    [0, 7],
  // --- extended / alterated chords (added 2026-08-13) ---
  'm6':   [0, 3, 7, 9], '6': [0, 4, 7, 9], '6/9': [0, 4, 7, 9, 14], 'm6/9': [0, 3, 7, 9, 14],
  'aug':  [0, 4, 8], 'dim': [0, 3, 6], '7#5': [0, 4, 8, 10], '7b5': [0, 4, 6, 10],
  '7sus4':[0, 5, 7, 10], 'dim7': [0, 3, 6, 9], 'm7b5': [0, 3, 6, 10],
  '9':    [0, 4, 7, 10, 14], 'm9': [0, 3, 7, 10, 14], 'maj9': [0, 4, 7, 11, 14],
  '11':   [0, 4, 7, 10, 14, 17], 'm11': [0, 3, 7, 10, 14, 17],
  '13':   [0, 4, 7, 10, 14, 21], 'm13': [0, 3, 7, 10, 14, 21],
  'add9': [0, 4, 7, 14], 'madd9':[0, 3, 7, 14]
};
export const REQUIRED = {
  'maj': [0, 4], 'min': [0, 3], '7': [0, 4, 10], 'min7': [0, 3, 10],
  'maj7': [0, 4, 11], 'sus2': [0, 2], 'sus4': [0, 5], '5': [0, 7],
  'm6': [0, 3, 9], '6': [0, 4, 9], '6/9': [0, 4, 9, 14], 'm6/9': [0, 3, 9, 14],
  'aug': [0, 4, 8], 'dim': [0, 3, 6], '7#5': [0, 4, 8, 10], '7b5': [0, 4, 6, 10],
  '7sus4': [0, 5, 7, 10], 'dim7': [0, 3, 6, 9], 'm7b5': [0, 3, 6, 10],
  '9': [0, 4, 10, 14], 'm9': [0, 3, 10, 14], 'maj9': [0, 4, 11, 14],
  '11': [0, 4, 10, 17], 'm11': [0, 3, 10, 17], '13': [0, 4, 10, 21], 'm13': [0, 3, 10, 21],
  'add9': [0, 4, 14], 'madd9': [0, 3, 14]
};
export const KNOWN_QUALITY_TOKEN = /^(m|min|maj|maj7|m7|min7|minor|major|7|dom7|sus2|sus4|5|m6|6|6\/9|m6\/9|aug|dim|dim7|7#5|7b5|7sus4|9|m9|maj9|11|m11|13|m13|add9|madd9)$/i;
export const UNKNOWN_QUALITY_TOKEN = /^(aug7)$/i;

// Ordered (specific-first) quality-detection patterns. A label's `rest` string is
// tested against each `re` in order; the FIRST match sets `quality`. Encoded as a
// single table (2026-08-13 simplify) so the near-duplicate else-if ladder can't
// drift between the CJS and ESM checker copies. dim7 deliberately excludes \bm7b5
// (see the m7b5 entry) — that is the half-diminished (m7b5) branch, not fully-dim.
// This table is duplicated verbatim in 06-prototypes/step0/schema/chord-theory-check.js;
// the pre-commit hook proves the two stay 1:1. (The dim7 regex here MUST NOT include
// \bm7b5 — the 2026-08-13 pre-commit divergence audit caught the ESM copy silently
// degrading "Cm7b5" to dim7.)
export const QUALITY_PATTERNS = [
  { q: 'dim7',  re: /\bdim.*7|\bdiminished\s*7|\bhalf.?dim/ },
  { q: 'm7b5',  re: /\bm7b5|minor\s*7\s*flat\s*5|\bm7\s*b5/ },
  { q: 'aug',   re: /\baug|\baugmented/ },
  { q: 'dim',   re: /\bdim|\bdiminished/ },
  { q: '7#5',   re: /\b7#5|seven.*sharp.*five|7\s*sharp\s*5/ },
  { q: '7b5',   re: /\b7b5|seven.*flat.*five|7\s*flat\s*5/ },
  { q: '7sus4', re: /\b7sus4|7\s*sus\s*4|7\s*suspended\s*4/ },
  { q: 'm6/9',  re: /\bm6\/9|\bm6\s*9/ },
  { q: '6/9',   re: /\b6\/9|\b6\s*9/ },
  { q: 'm6',    re: /\bminor\s*six|minor\s*6|\bm6\b/ },
  { q: '6',     re: /\bmajor\s*six|major\s*6|\bsixth\b|\b6\b/ },
  { q: 'madd9', re: /\bminor\s*add\s*9|\bmadd9/ },
  { q: 'add9',  re: /\bmajor\s*add\s*9|add\s*9|add9/ },
  { q: 'm9',    re: /\bminor\s*ninth|minor\s*9|\bm9\b/ },
  { q: 'maj9',  re: /\bmajor\s*nine|major\s*9|\bmaj9\b/ },
  { q: '9',     re: /\bninth|\bnine|\b9\b/ },
  { q: 'm11',   re: /\bminor\s*eleventh|minor\s*11|\bm11\b/ },
  { q: '11',    re: /\beleventh|\bmajor\s*11|\b11\b/ },
  { q: 'm13',   re: /\bminor\s*thirteenth|minor\s*13|\bm13\b/ },
  { q: '13',    re: /\bthirteenth|\bmajor\s*13|\b13\b/ },
  // base qualities — ordered so min7/maj7 win over bare minor/major
  { q: 'min7',  re: /\bminor\s*(seventh|7)\b|\bmin\s*7\b|\bm7\b|^m7/ },
  { q: 'maj7',  re: /\bmajor\s*(seventh|7)\b|\bmaj\s*7\b|maj7/ },
  { q: 'min',   re: /\bminor\b|^min\b|^m\b|\bmin\b|\bm\b/ },
  { q: 'maj',   re: /\bmajor\b|^maj\b|\bmaj\b/ },
  { q: 'sus2',  re: /sus\s*2/ },
  { q: 'sus4',  re: /sus\s*4/ },
  { q: '7',     re: /\bseventh\b|\b7\b|dom7|^7/ },
  { q: '5',     re: /\b5\b|power|^5/ }
];

export function parseChordName(name) {
  const s = String(name || '').trim();
  if (!s) return null;
  const bare = s.replace(/\([^)]*\)/g, ' ').trim();
  const tokens = bare.split(/[\s,\/\—]+/).filter(Boolean);
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
    const qtok = suffix.trim();
    if (qtok && !KNOWN_QUALITY_TOKEN.test(qtok)) {
      if (UNKNOWN_QUALITY_TOKEN.test(qtok)) unknownQuality = qtok;
      else if (/^(add|dim|aug|\d|[6789#b])/.test(qtok)) unknownQuality = qtok;
    }
    const after = tokens.slice(tokens.indexOf(tk) + 1);
    if (after.length && /^[0-9]+$/.test(after[0]) && (qtok === '' || /^[a-z]+$/.test(qtok))) {
      restStr = (qtok + after[0] + ' ' + after.slice(1).join(' ')).toLowerCase();
    }
    break;
  }
  if (!root) return null;
  root = root.replace('Db', 'C#').replace('Eb', 'D#').replace('Gb', 'F#')
             .replace('Ab', 'G#').replace('Bb', 'A#');
  const rest = restStr;
  let quality = 'maj';
  // Quality detection is now a single ordered table (2026-08-13 simplify pass):
  // each {re, q} is tried in order, the FIRST match wins. This replaces the
  // hand-written else-if ladder so the two checker copies share one shape and
  // cannot drift — the pre-commit hook re-proves they stay 1:1.
  // NOTE: dim7 deliberately does NOT include \bm7b5 — that is the half-diminished
  // (m7b5) entry above. This ESM copy once wrongly had \bm7b5 in the dim7 branch,
  // silently degrading "Cm7b5" to dim7 (caught by the 2026-08-13 divergence audit).
  for (const { re, q } of QUALITY_PATTERNS) {
    if (re.test(rest)) { quality = q; break; }
  }
  return { root, quality, unknownQuality };
}

export function pitchClassesOf(chord) {
  const out = [];
  for (let i = 0; i < 6; i++) {
    const f = chord.frets[i];
    if (f === null || f === undefined) continue;
    out.push({ string: 6 - i, fret: f, pc: (OPEN_MIDI[i] + f) % 12, midi: OPEN_MIDI[i] + f });
  }
  return out;
}

export function verifyChord(key, chord) {
  const errors = [], warnings = [];
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

  for (const n of sounded) {
    if (!expected.has(n.pc)) {
      errors.push('string ' + n.string + ' fret ' + n.fret + ' sounds ' + NOTES[n.pc] +
                  ' which is NOT in ' + parsed.root + ' ' + parsed.quality);
    }
  }
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
  if (sounded.length) {
    const lowest = sounded.reduce((a, b) => (a.midi <= b.midi ? a : b));
    if (lowest.pc !== rootPc) {
      warnings.push('lowest note is ' + NOTES[lowest.pc] + ', not the root ' + parsed.root + ' (inversion / slash voicing)');
    }
  }
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
  const byFinger = {};
  for (const d of fretted) { (byFinger[d.finger] = byFinger[d.finger] || []).push(d); }
  for (const [fg, ds] of Object.entries(byFinger)) {
    const frets = [...new Set(ds.map(d => d.fret))];
    if (frets.length > 1) errors.push('finger ' + fg + ' is on two different frets (' + frets.join(' and ') + ') — physically impossible');
    else if (ds.length > 1 && fg !== '1') warnings.push('finger ' + fg + ' barres ' + ds.length + ' strings (usually only the index finger barres)');
  }
  if (fretted.length) {
    const fs = fretted.map(d => d.fret);
    const span = Math.max(...fs) - Math.min(...fs);
    if (span > 3) warnings.push('fret span of ' + span + ' is a wide stretch for a beginner');
  }
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
