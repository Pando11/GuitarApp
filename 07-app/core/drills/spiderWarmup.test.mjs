// spiderWarmup.test.mjs — plain check()/counter self-test (no test framework).
//
// Run: node 07-app/core/drills/spiderWarmup.test.mjs
//
// Ported from 06-prototypes/practice-engine/drills/spider-warmup.test.mjs's
// node:test assertions, translated into this repo's check()/counter style
// (see 07-app/core/telemetry.test.mjs for the pattern).
import { runDrill, buildSequence, DRILL } from './spiderWarmup.js';

let passed = 0;
let failed = 0;
function check(name, cond) {
  if (cond) { passed++; console.log(`  PASS  ${name}`); }
  else { failed++; console.error(`  FAIL  ${name}`); }
}

console.log('\n=== spiderWarmup.js self-test ===');

check('DRILL constant is spider', DRILL === 'spider');

{
  const b = buildSequence({ startFret: 1, frets: 4, strings: [6, 5, 4, 3, 2, 1], pattern: 'up' });
  check('buildSequence produces movements', b.movements > 0);
  check('first finger is 1', b.sequence[0].finger === 1);
}

{
  const r = runDrill({});
  check('runDrill drill is spider', r.drill === 'spider');
  check('metrics.sequence is an array', Array.isArray(r.metrics.sequence));
  check('score is 1', r.score === 1);
}

{
  const up = buildSequence({ pattern: 'up', frets: 3, strings: [6], reps: 1 }).sequence.map((s) => s.fret);
  const down = buildSequence({ pattern: 'down', frets: 3, strings: [6], reps: 1 }).sequence.map((s) => s.fret);
  check('down pattern reverses the ladder', JSON.stringify([...up].reverse()) === JSON.stringify(down));
}

console.log(`\n=== ${passed} passed, ${failed} failed ===\n`);
process.exit(failed === 0 ? 0 : 1);
