// metronomeLadder.test.mjs — plain check()/counter self-test (no test framework).
//
// Run: node 07-app/core/drills/metronomeLadder.test.mjs
//
// Ported from 06-prototypes/practice-engine/drills/metronome-ladder.test.mjs's
// node:test assertions, translated into this repo's check()/counter style
// (see 07-app/core/telemetry.test.mjs for the pattern).
import { runDrill, DRILL } from './metronomeLadder.js';

let passed = 0;
let failed = 0;
function check(name, cond) {
  if (cond) { passed++; console.log(`  PASS  ${name}`); }
  else { failed++; console.error(`  FAIL  ${name}`); }
}

console.log('\n=== metronomeLadder.js self-test ===');

check('DRILL constant is metronome-ladder', DRILL === 'metronome-ladder');

{
  const r = runDrill({ pair: ['A', 'B'], startBpm: 60, maxBpm: 140, step: 5, cleanRatePerMin: 0, rounds: 8, seed: 2, skillA: 1.0, skillB: 1.0 });
  check('climbs every level when always clean (8 levels)', r.metrics.levels.length === 8);
  check('topBpm is 95 (60 + 7 steps of 5, last recorded level)', r.metrics.topBpm === 95);
  check('passed is true', r.passed === true);
}

{
  const r = runDrill({ pair: ['A', 'B'], startBpm: 60, maxBpm: 140, step: 5, cleanRatePerMin: 999, rounds: 4, seed: 2 });
  check('holds when never clean (all levels at 60)', r.metrics.levels.every((l) => l.bpm === 60));
  check('passed is false', r.passed === false);
}

{
  const r = runDrill({ seed: 9 });
  check('envelope has levels', r.metrics.levels.length >= 1);
  check('summary includes arrow', r.summary.includes('→'));
}

console.log(`\n=== ${passed} passed, ${failed} failed ===\n`);
process.exit(failed === 0 ? 0 : 1);
