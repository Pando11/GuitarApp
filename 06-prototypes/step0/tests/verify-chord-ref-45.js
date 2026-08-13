'use strict';
// Regression for the 45-row harvested reference (FINAL_chord_ref.jl).
// Re-runs the REAL parser (parseChordName) over every chord_name the reference
// contains and asserts each resolves to its TRUE quality — NO degrade, NO
// false-pass. This is the closure of spec-chord-ref.md §4, which (before the
// 2026-08-13 recipe extension) reported 13 FAIL-OPEN + 2 FAIL-CLOSED.
//
// Source of truth: ../schema/chord-theory-check.js  (AGENTS.md Hard Rule 8)
// Reference data: ~/scraping-stack/harvester/out/FINAL_chord_ref.jl
// Run: node tests/verify-chord-ref-45.js
const fs = require('fs');
const path = require('path');
const { parseChordName } = require('../schema/chord-theory-check.js');

const REF = path.join(process.env.USERPROFILE || process.env.HOME,
  'scraping-stack', 'harvester', 'out', 'FINAL_chord_ref.jl');

// distinct chord_name -> { root, quality } we expect the parser to return.
// Root F is from the mislabeled "f Diminished" row (row 11) — it genuinely
// parses to F dim; the reference row is itself wrong, but the parser is right.
const EXPECT = {
  'C Augmented Guitar Chord Diagrams':            { root: 'C', quality: 'aug' },
  'C Diminished 7 Guitar Chord Diagrams':         { root: 'C', quality: 'dim7' },
  'C Diminished Guitar Chord Diagrams':           { root: 'C', quality: 'dim' },
  'C Dominant 7 Guitar Chord Diagrams':           { root: 'C', quality: '7' },
  'C Eleventh Guitar Chord Diagrams':             { root: 'C', quality: '11' },
  'C Major Add 9 Guitar Chord Diagrams':           { root: 'C', quality: 'add9' },
  'C Major Guitar Chord Diagrams':                { root: 'C', quality: 'maj' },
  'C Major Nine Guitar Chord Diagrams':           { root: 'C', quality: 'maj9' },
  'C Major Seventh Guitar Chord Diagrams':        { root: 'C', quality: 'maj7' },
  'C Major Six Guitar Chord Diagrams':            { root: 'C', quality: '6' },
  'C Minor Add 9 Guitar Chord Diagrams':          { root: 'C', quality: 'madd9' },
  'C Minor Guitar Chord Diagrams':                { root: 'C', quality: 'min' },
  'C Minor Ninth Guitar Chord Diagrams':          { root: 'C', quality: 'm9' },
  'C Minor Seventh Guitar Chord Diagrams':        { root: 'C', quality: 'min7' },
  'C Minor Six Guitar Chord Diagrams':            { root: 'C', quality: 'm6' },
  'C Ninth Guitar Chord Diagrams':                { root: 'C', quality: '9' },
  'C Sus 2 Guitar Chord Diagrams':                { root: 'C', quality: 'sus2' },
  'C Sus 4 Guitar Chord Diagrams':                { root: 'C', quality: 'sus4' },
  'C Thirteenth Guitar Chord Diagrams':           { root: 'C', quality: '13' },
  'C6/9 Guitar Chord Diagrams':                   { root: 'C', quality: '6/9' },
  'Cm6/9 Guitar Chord Diagrams':                  { root: 'C', quality: 'm6/9' },
  'F Sus 2 Guitar Chord Diagrams':                { root: 'F', quality: 'sus2' },
  'f Diminished Guitar Chord Diagrams':           { root: 'F', quality: 'dim' }
};

if (!fs.existsSync(REF)) {
  console.log('REFERENCE MISSING: ' + REF);
  process.exit(1);
}

const lines = fs.readFileSync(REF, 'utf8').split('\n').filter(Boolean);
let total = 0, degrade = 0, falsePass = 0, failClosed = 0, mismatch = 0;
const byName = {};
for (const ln of lines) {
  let name;
  try { name = JSON.parse(ln).chord_name; } catch (e) { continue; }
  const exp = EXPECT[name];
  if (!exp) { console.log('  UNKNOWN REFERENCE NAME (not in EXPECT map): ' + name); mismatch++; continue; }
  const p = parseChordName(name);
  total++;
  if (!p) { console.log('  PARSE NULL: ' + name); mismatch++; continue; }
  const got = p.root + ' ' + p.quality;
  const want = exp.root + ' ' + exp.quality;
  // FAIL-CLOSED: parser refuses an unknown quality (would be a degrade-to-refusal,
  // but here we want it to RESOLVE, so any unknownQuality is a regression).
  if (p.unknownQuality) { failClosed++; console.log('  FAIL-CLOSED: ' + name + ' -> "' + p.unknownQuality + '"'); }
  if (got !== want) {
    // A name parsed to a SIMPLER/wrong quality than its true quality = degrade/false-pass.
    degrade++;
    console.log('  DEGRADE: ' + name + '  got "' + got + '"  want "' + want + '"');
  }
  byName[name] = got;
}

// distinct-coverage summary
const distinct = Object.keys(EXPECT).length;
console.log('\n=== 45-NAME REFERENCE REGRESSION ===');
console.log('rows parsed:        ' + total);
console.log('distinct expected:   ' + distinct);
console.log('degrade/false-pass:  ' + degrade);
console.log('fail-closed:         ' + failClosed);
console.log('unmapped names:      ' + mismatch);
const clean = degrade === 0 && failClosed === 0 && mismatch === 0;
console.log(clean
  ? 'CHORD-REF-45-OK — every reference name resolves to its true quality (0 degrade, 0 false-pass)'
  : 'CHORD-REF-45 FAILED — ' + (degrade + failClosed + mismatch) + ' problem name(s)');
process.exit(clean ? 0 : 1);
