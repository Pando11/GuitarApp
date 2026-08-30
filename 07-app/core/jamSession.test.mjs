// jamSession.test.mjs — V2-JAM on-device self-test (PART A buildable + PART B BLOCKED).
//
// Run:  node 07-app/core/jamSession.test.mjs
//
// PART A (on-device grading + facts emit) MUST PASS with exit 0.
// PART B (generative response) is intentionally BLOCKED this session (no GPU/RunPod);
// the test asserts it correctly reports BLOCKED rather than faking audio.

import { gradeStudentPhrase, emitFacts, generateResponse } from './jamSession.js';

let passed = 0;
let failed = 0;
function check(name, cond) {
  if (cond) {
    passed++;
    console.log(`  PASS  ${name}`);
  } else {
    failed++;
    console.error(`  FAIL  ${name}`);
  }
}
function approx(a, b, eps = 1e-9) {
  return Math.abs(a - b) <= eps;
}

console.log('\n=== jamSession PART A (on-device) self-test ===');

// --- Case 1: perfect phrase -> accuracy 1.0 -------------------------------
const KNOWN = ['C', 'G', 'Em'];
const g1 = gradeStudentPhrase(['C', 'G', 'Em'], KNOWN);
console.log('  perfect grade:', JSON.stringify(g1));
check('perfect: matched all 3 known chords', g1.matched.length === 3);
check('perfect: missed none', g1.missed.length === 0);
check('perfect: accuracy === 1.0', approx(g1.accuracy, 1.0));

// --- Case 2: one wrong chord -> missed [Am], accuracy 2/3 -----------------
const g2 = gradeStudentPhrase(['C', 'G', 'Am'], KNOWN);
console.log('  wrong-chord grade:', JSON.stringify(g2));
check('wrong: matched 2 chords', g2.matched.length === 2);
check('wrong: missed === ["Am"]', g2.missed.length === 1 && g2.missed[0] === 'Am');
check('wrong: accuracy === 2/3', approx(g2.accuracy, 2 / 3));

// --- Case 3: emitFacts returns ONLY the fact object (no audio) ------------
const f = emitFacts(g2);
console.log('  emitFacts:', JSON.stringify(f));
const keys = Object.keys(f).sort();
check(
  'emitFacts keys exactly [accuracy, chordsMatched, chordsMissed]',
  JSON.stringify(keys) === JSON.stringify(['accuracy', 'chordsMatched', 'chordsMissed']),
);
check(
  'emitFacts.accuracy is a number in [0, 1]',
  typeof f.accuracy === 'number' && f.accuracy >= 0 && f.accuracy <= 1,
);
check('emitFacts has NO audio / audioUrl / blob field', !('audio' in f) && !('audioUrl' in f) && !('blob' in f));
check('emitFacts.chordsMissed === ["Am"]', f.chordsMissed.length === 1 && f.chordsMissed[0] === 'Am');
check('emitFacts.chordsMatched === ["C","G"]', f.chordsMatched.length === 2 && f.chordsMatched[0] === 'C' && f.chordsMatched[1] === 'G');

// --- Case 4: normalization sanity (case + minor alias) --------------------
const g3 = gradeStudentPhrase(['c', 'g', 'eM'], KNOWN);
check('normalization: lowercase+alias matches', g3.matched.length === 3 && g3.missed.length === 0);

// --- Case 5: empty known set is safe (no divide-by-zero) ------------------
const g4 = gradeStudentPhrase(['C'], []);
check('empty known: accuracy 0, no crash', g4.accuracy === 0 && Array.isArray(g4.matched));

// === PART B: generative response is correctly BLOCKED =====================
console.log('\n=== jamSession PART B (generative) — expected BLOCKED ===');
let blockedErr = null;
try {
  await generateResponse(f);
} catch (e) {
  blockedErr = e;
}
check('generateResponse throws (BLOCKED — no GPU/RunPod this session)', blockedErr !== null);
check(
  'BLOCKED marker carries status === "BLOCKED"',
  !!blockedErr && !!blockedErr.blocked && blockedErr.blocked.status === 'BLOCKED',
);
check(
  'BLOCKED reason cites ACE-Step / YuE / RunPod',
  !!blockedErr && !!blockedErr.blocked && /ACE-Step|YuE|RunPod/i.test(blockedErr.blocked.reason),
);

console.log(`\nRESULT: ${passed} passed, ${failed} failed`);
if (failed === 0) {
  console.log('OVERALL: PASS');
  process.exit(0);
} else {
  console.log('OVERALL: FAIL');
  process.exit(1);
}
