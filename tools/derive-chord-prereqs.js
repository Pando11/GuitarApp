#!/usr/bin/env node
// Regenerates chord-prereqs.json from the SHIPPING lesson order (manifest.json).
// Mystery Mode is opt-in ADVANCED: a song may only unlock when every chord it uses has
// already been taught. That prerequisite is a fact about the curriculum, so it is
// DERIVED, never hand-maintained — hand-maintained prereqs drift the moment a lesson moves.
'use strict';
const fs = require('fs'), path = require('path');
const LDIR = path.join(__dirname, '..', '07-app', 'content', 'lessons');
const OUT = path.join(__dirname, '..', '07-app', 'content', 'song-progressions', 'chord-prereqs.json');
const shapes = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '07-app', 'content', 'song-progressions', 'shapes.json'), 'utf8')).chords;

const order = JSON.parse(fs.readFileSync(path.join(LDIR, 'manifest.json'), 'utf8')).files
  .filter(f => /^guitar-lesson.*\.json$/.test(f));

// Canonical symbol for a lesson's chord name, e.g. "C major (standard)" -> "C",
// "E minor" -> "Em", "A7" -> "A7".
// DEFECT FIXED 2026-08-14: an earlier version matched only (minor|min|m|major|maj) and
// therefore normalised "A7" down to "A" — silently claiming A7 was taught in lesson 8
// (which teaches plain A major). That would have unlocked a mystery song using a chord
// the student had never seen. The quality MUST be preserved, and anything we cannot
// confidently normalise returns the raw trimmed name so it fails closed as "untaught"
// rather than aliasing onto a simpler chord.
function symbolOf(name) {
  if (!name) return null;
  // Drop parenthetical annotations like "(standard)" / "(Lauren's 'easy C' ...)".
  const clean = String(name).replace(/\(.*?\)/g, ' ').replace(/\s+/g, ' ').trim();
  const m = /^([A-G][#b]?)\s*(.*)$/.exec(clean);
  if (!m) return null;
  const root = m[1];
  let rest = (m[2] || '').trim().toLowerCase();
  if (rest === '' || rest === 'major' || rest === 'maj') return root;
  if (rest === 'minor' || rest === 'min' || rest === 'm') return root + 'm';
  // Known compact qualities keep their exact token (7, m7, sus4, add9, ...).
  const compact = rest.replace(/\s+/g, '');
  if (/^(7|maj7|m7|min7|sus2|sus4|5|6|m6|6\/9|m6\/9|9|m9|maj9|add9|madd9|dim|dim7|aug|m7b5|7sus4|11|m11|13|m13)$/.test(compact)) {
    return root + compact.replace(/^min7$/, 'm7');
  }
  // Unrecognised → fail closed: return the whole cleaned name so it will not match
  // any taught symbol and gets reported as untaught.
  return clean;
}

// Derive, from the shipping lesson manifest, the first lesson number that teaches each
// shape in `shapes`. Exported so tools/verify-song-progressions.js can RE-DERIVE in-process
// rather than trusting the generated chord-prereqs.json (hostile audit, 2026-08-14).
// Returns { total_lessons, first_taught, not_yet_taught }.
function deriveFirstTaught(lessonsDir, shapes) {
  const files = JSON.parse(fs.readFileSync(path.join(lessonsDir, 'manifest.json'), 'utf8')).files
    .filter(f => /^guitar-lesson.*\.json$/.test(f));
  const taughtAt = {};
  files.forEach((f, idx) => {
    const p = path.join(lessonsDir, f);
    if (!fs.existsSync(p)) return;
    const d = JSON.parse(fs.readFileSync(p, 'utf8'));
    for (const [k, c] of Object.entries(d.chords || {})) {
      if (k.startsWith('_')) continue;
      const s = symbolOf(c.name);
      if (s && !(s in taughtAt)) taughtAt[s] = idx + 1;
    }
  });
  const first_taught = {}, not_yet_taught = {};
  for (const key of Object.keys(shapes)) {
    const s = symbolOf(shapes[key].name);
    if (s in taughtAt) first_taught[key] = taughtAt[s];
    else not_yet_taught[key] = shapes[key].name + ' is NOT taught anywhere in the ' + files.length +
      '-lesson curriculum. Any song requiring it cannot unlock. Either add a lesson for it or re-voice the progression.';
  }
  return { total_lessons: files.length, first_taught, not_yet_taught };
}

module.exports = { deriveFirstTaught, symbolOf };

// ---- CLI mode: regenerate chord-prereqs.json ----
// Only runs when invoked directly, so `require`ing this file has no side effects.
if (require.main === module) {
  const derived = deriveFirstTaught(LDIR, shapes);
  const doc = {
    _purpose: 'Maps every chord shape to the lesson that FIRST teaches it, derived from ' +
      '07-app/content/lessons/manifest.json order. Mystery Mode is an OPT-IN ADVANCED mode for ' +
      'students already in the program (owner directive 2026-08-14), so a mystery song may only ' +
      'unlock once the student has been taught EVERY chord it uses. ' +
      'tools/verify-song-progressions.js RE-DERIVES this in-process and fails if this file disagrees.',
    _derivation: 'node tools/derive-chord-prereqs.js — regenerate whenever lessons/manifest.json changes.',
    total_lessons: derived.total_lessons,
    first_taught: derived.first_taught,
    not_yet_taught: derived.not_yet_taught
  };
  fs.writeFileSync(OUT, JSON.stringify(doc, null, 2) + '\n', 'utf8');
  console.log('wrote ' + OUT);
  console.log('taught: ' + Object.keys(derived.first_taught).length + ' shapes | untaught: ' +
    (Object.keys(derived.not_yet_taught).join(', ') || 'none'));
}
