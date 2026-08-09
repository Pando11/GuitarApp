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
  '5':    [0, 7]
};
export const REQUIRED = {
  'maj': [0, 4], 'min': [0, 3], '7': [0, 4, 10], 'min7': [0, 3, 10],
  'maj7': [0, 4, 11], 'sus2': [0, 2], 'sus4': [0, 5], '5': [0, 7]
};
export const KNOWN_QUALITY_TOKEN = /^(m|min|maj|maj7|m7|min7|minor|major|7|dom7|sus2|sus4|5)$/i;
export const UNKNOWN_QUALITY_TOKEN = /^(dim|aug|6|9|11|13|add9|6\/9|m6|dim7|aug7|7sus4|7b5|7#5)$/i;

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
  if (/^minor\s*7|^min\s*7|\bminor\s*7\b|\bmin\s*7\b|\bm7\b|^m7/.test(rest)) quality = 'min7';
  else if (/^major\s*7|\bmajor\s*7\b|\bmaj\s*7\b|maj7/.test(rest)) quality = 'maj7';
  else if (/\bminor\b|^min\b|^m\b|\bmin\b|\bm\b/.test(rest)) quality = 'min';
  else if (/sus\s*2/.test(rest)) quality = 'sus2';
  else if (/sus\s*4/.test(rest)) quality = 'sus4';
  else if (/\b7\b|dom7|^7/.test(rest)) quality = '7';
  else if (/\b5\b|power|^5/.test(rest)) quality = '5';
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

export function verifyLesson(lessonJson) {
  const results = [];
  for (const [k, c] of Object.entries(lessonJson.chords || {})) {
    if (k.startsWith('_')) continue;
    results.push(verifyChord(k, c));
  }
  return { lessonId: lessonJson.lesson && lessonJson.lesson.id, results, allOk: results.every(r => r.ok) };
}
