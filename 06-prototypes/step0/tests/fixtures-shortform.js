'use strict';
// Short-form chord-name fixtures (GOAL #2).
// The harvested reference uses LONG names ("C Augmented", "C Ninth"). Real
// curriculum/lesson JSON and the FAIL-CLOSED regression suite use SHORT names
// ("Cdim", "C6", "C9", "Cm7b5", "C13", "C Aug"). Both forms must verify
// arithmetically: a CORRECT voicing -> ok:true (0 errors); a WRONG voicing
// -> ok:false (never a false pass). Every voicing below is hand-computed
// against the QUALITIES recipe (standard tuning, low E -> A D G B e).
//
// Run: node tests/fixtures-shortform.js
const { verifyChord } = require('../schema/chord-theory-check.js');

function mk(name, frets, fingers) { return { name, frets, fingers }; }

// Strings index: [6th(low E),5th(A),4th(D),3rd(G),2nd(B),1st(hi e)]
const CASES = [
  // ---- CORRECT short-form voicings: each must yield ok:true, errors=0 ----
  { name: 'C Aug',  frets: [null, 3, 2, 1, null, null], fingers: [null, 1, 2, 3, null, null] }, // C E G#
  { name: 'Cdim',   frets: [null, 3, 4, null, 4, null], fingers: [null, 1, 2, null, 3, null] }, // C Eb Gb
  { name: 'C6',     frets: [null, 0, 2, 0, 1, 3],       fingers: [null, 0, 2, 0, 1, 3] },       // C E G A
  { name: 'C9',     frets: [null, 3, 2, 3, 3, 3],       fingers: [null, 1, 2, 3, 3, 3] },       // C E G Bb D (+barre on A)
  { name: 'Cm7b5',  frets: [null, 3, 4, 3, 4, null],    fingers: [null, 1, 2, 3, 4, null] },    // C Eb Gb Bb
  { name: 'C13',    frets: [3, 3, 2, 3, 3, 5],          fingers: [1, 1, 2, 3, 3, 4] },          // C E G Bb D A (+barre)
  // ---- WRONG voicing: a plain C-major shape (C E G) called "C Aug" ----
  // G(7) is not in aug{0,4,8} and the defining G#(8) is missing -> ERROR, ok:false.
  { name: 'C Aug',  frets: [null, 3, 2, 0, 1, 0],       fingers: [null, 3, 2, 0, 1, 0], wrong: true }
];

let bad = 0;
console.log('=== SHORT-FORM FIXTURE REGRESSION ===');
for (const c of CASES) {
  const r = verifyChord('fx', c);
  const want = !c.wrong;                       // correct -> true, wrong -> false
  const ok = r.ok === want && (want ? r.errors.length === 0 : true);
  if (!ok) bad++;
  console.log((ok ? 'PASS ' : 'FAIL ') + (c.wrong ? '[WRONG] ' : '[OK]    ') + c.name.padEnd(8) +
    ' ok=' + r.ok + ' errs=' + r.errors.length + ' warns=' + r.warnings.length +
    '  notes=[' + (r.uniqueNotes || []).join(' ') + ']');
  if (!ok) r.errors.forEach(e => console.log('       ERROR: ' + e));
}
console.log('\n' + (bad === 0
  ? 'SHORTFORM-FIXTURES-OK — all correct voicings ok:true, wrong voicing ok:false'
  : 'SHORTFORM FIXTURES FAILED — ' + bad + ' case(s) wrong'));
process.exit(bad === 0 ? 0 : 1);
