// anchorPivot.test.mjs — plain check()/counter self-test (no test framework).
//
// Run: node 07-app/core/drills/anchorPivot.test.mjs
//
// Ported from 06-prototypes/practice-engine/drills/anchor-pivot.test.mjs's
// node:test assertions, translated into this repo's check()/counter style
// (see 07-app/core/telemetry.test.mjs for the pattern).
import { runDrill, findAnchor, DRILL } from './anchorPivot.js';

let passed = 0;
let failed = 0;
function check(name, cond) {
  if (cond) { passed++; console.log(`  PASS  ${name}`); }
  else { failed++; console.error(`  FAIL  ${name}`); }
}

console.log('\n=== anchorPivot.js self-test ===');

const A = { name: 'C',  fingering: { '5': { fret: 3, finger: 3 }, '4': { fret: 2, finger: 2 }, '2': { fret: 1, finger: 1 } } };
const B = { name: 'Am', fingering: { '5': { fret: 3, finger: 3 }, '4': { fret: 2, finger: 2 }, '3': { fret: 1, finger: 1 } } };

check('DRILL constant is anchor', DRILL === 'anchor');

{
  const { anchor, pivotFingers } = findAnchor(A, B);
  check('finds shared anchor finger across the change (>=2)', anchor.length >= 2);
  check('anchor includes finger 3 on string 5 fret 3', anchor.some((a) => a.finger === 3 && a.string === '5' && a.fret === 3));
}

{
  const r = runDrill({ chordA: A, chordB: B });
  check('runDrill reports anchorFinger 3', r.metrics.anchorFinger === 3);
  check('runDrill score is 1', r.score === 1);
  check('runDrill summary mentions pivot or Anchor', r.summary.includes('pivot') || r.summary.includes('Anchor'));
}

{
  const X = { name: 'X', fingering: { '6': { fret: 1, finger: 1 } } };
  const Y = { name: 'Y', fingering: { '6': { fret: 3, finger: 3 } } };
  const r = runDrill({ chordA: X, chordB: Y });
  check('no shared finger => full lift', r.metrics.anchor.length === 0);
}

{
  const r = runDrill({});
  check('missing chords returns safe envelope', r.metrics.anchor.length === 0);
}

console.log(`\n=== ${passed} passed, ${failed} failed ===\n`);
process.exit(failed === 0 ? 0 : 1);
