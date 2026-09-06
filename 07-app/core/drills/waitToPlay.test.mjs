// waitToPlay.test.mjs — plain check()/counter self-test (no test framework).
//
// Run: node 07-app/core/drills/waitToPlay.test.mjs
//
// Ported from 06-prototypes/practice-engine/drills/wait-to-play.test.mjs's
// node:test assertions, translated into this repo's check()/counter style
// (see 07-app/core/telemetry.test.mjs for the pattern).
import { runDrill, DRILL } from './waitToPlay.js';

let passed = 0;
let failed = 0;
function check(name, cond) {
  if (cond) { passed++; console.log(`  PASS  ${name}`); }
  else { failed++; console.error(`  FAIL  ${name}`); }
}

console.log('\n=== waitToPlay.js self-test ===');

check('DRILL constant is wait-to-play', DRILL === 'wait-to-play');

{
  const r = runDrill({ pair: ['A', 'B'], target: 'B', tempoPerMin: 60, durationMin: 1.0, seed: 1, discipline: 1.0 });
  check('disciplined student has no false starts', r.metrics.falseStarts === 0);
  check('disciplined student waited', r.metrics.waited === true);
  check('post-target accuracy is >= 0.99', r.metrics.accuracy >= 0.99);
  check('passed is true', r.passed === true);
}

{
  const r = runDrill({ pair: ['A', 'B'], target: 'B', tempoPerMin: 60, durationMin: 1.0, seed: 1, discipline: 0.0 });
  check('undisciplined student false-starts (should have false starts)', r.metrics.falseStarts > 0);
  check('undisciplined student did not wait', r.metrics.waited === false);
  check('passed is false', r.passed === false);
}

{
  const r = runDrill({ pair: ['A', 'B'], target: 'B', seed: 5 });
  check('targetHeard flag is true', r.metrics.targetHeard === true);
  check('every event has strum-event shape', r.events.every((e) => 'chord' in e && 'confident' in e && 't' in e));
}

console.log(`\n=== ${passed} passed, ${failed} failed ===\n`);
process.exit(failed === 0 ? 0 : 1);
