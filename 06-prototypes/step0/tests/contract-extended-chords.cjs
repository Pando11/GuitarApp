'use strict';
// CONTRACT test (GOAL #5, simplify pass). Pins the behavior that makes future
// simplify passes safe:
//   (A) an extended chord WITHOUT its defining tone must ERROR, not warn/pass;
//   (B) a plain major shape misnamed as an extended chord must be ok:false (no
//       false pass) — the defining tension is simply absent, so it cannot spell
//       the claimed chord.
// This file is the canonical home for the contract; the 04-validation/ duplicate
// regression was folded into fixtures-shortform.js + this. (2026-08-13 simplify)
const { verifyChord } = require('../schema/chord-theory-check.js');
const mk = (name, frets, fingers) => ({ name, frets, fingers });

const CASES = [
  // (A) defining-tone missing => ERROR. "C6" without the 6th (A) -> C E G only.
  { contract: 'A', expect: 'fail', c: mk('C6', [null, 3, 2, 0, 1, 0], [null, 3, 2, 0, 1, 0]) },
  // (A) "C9" without the b7 (Bb) and 9 (D) -> plain C major triad. Must ERROR.
  { contract: 'A', expect: 'fail', c: mk('C9', [null, 3, 2, 0, 1, 0], [null, 3, 2, 0, 1, 0]) },
  // (B) plain C-major shape named "C Aug" -> G is not in aug{0,4,8}, G# missing.
  { contract: 'B', expect: 'fail', c: mk('C Aug', [null, 3, 2, 0, 1, 0], [null, 3, 2, 0, 1, 0]) },
  // (B) plain C-major shape named "Cm7b5" -> multiple required tones missing.
  { contract: 'B', expect: 'fail', c: mk('Cm7b5', [null, 3, 2, 0, 1, 0], [null, 3, 2, 0, 1, 0]) },
  // sanity: a CORRECT C6 voicing passes with 0 errors (proves we didn't over-stricten).
  { contract: 'sanity', expect: 'pass', c: mk('C6', [null, 0, 2, 0, 1, 3], [null, 0, 2, 0, 1, 3]) }
];

let bad = 0;
console.log('=== EXTENDED-CHORD CONTRACT ===');
for (const { contract, expect, c } of CASES) {
  const r = verifyChord('cx', c);
  const want = expect === 'pass';
  const ok = r.ok === want && (want ? r.errors.length === 0 : true);
  if (!ok) bad++;
  console.log((ok ? 'PASS ' : 'FAIL ') + '[' + contract + '] ' + c.name.padEnd(8) +
    ' ok=' + r.ok + ' errs=' + r.errors.length);
  if (!ok) r.errors.forEach(e => console.log('       ERROR: ' + e));
}
console.log('\n' + (bad === 0
  ? 'CONTRACT-OK — defining-tone-missing = ERROR; misnamed-shape = false-pass-blocked'
  : 'CONTRACT FAILED — ' + bad + ' case(s)'));
process.exit(bad === 0 ? 0 : 1);
