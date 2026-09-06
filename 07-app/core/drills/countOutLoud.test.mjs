// countOutLoud.test.mjs — plain check()/counter self-test (no test framework).
//
// Run: node 07-app/core/drills/countOutLoud.test.mjs
//
// Ported from 06-prototypes/practice-engine/drills/count-out-loud.test.mjs's
// node:test assertions, translated into this repo's check()/counter style
// (see 07-app/core/telemetry.test.mjs for the pattern).
import { runDrill, buildGrid, DRILL } from './countOutLoud.js';

let passed = 0;
let failed = 0;
function check(name, cond) {
  if (cond) { passed++; console.log(`  PASS  ${name}`); }
  else { failed++; console.error(`  FAIL  ${name}`); }
}

console.log('\n=== countOutLoud.js self-test ===');

check('DRILL constant is count-out-loud', DRILL === 'count-out-loud');

{
  const g = buildGrid({ beatsPerBar: 4, bars: 1 });
  check('buildGrid produces the 1-&-2-& pattern', JSON.stringify(g) === JSON.stringify(['1', '&', '2', '&', '3', '&', '4', '&']));
}

{
  const r = runDrill({ tempoPerMin: 80, bars: 2, seed: 1, accuracy: 0.9 });
  check('emits events', r.events.length > 0);
  check('every event has chord:null and confident/t', r.events.every((e) => e.chord === null && 'confident' in e && 't' in e));
  check('grid length is 2 bars * 8 slots = 16', r.metrics.grid.length === 16);
}

{
  const lo = runDrill({ seed: 3, accuracy: 0.2 });
  const hi = runDrill({ seed: 3, accuracy: 1.0 });
  check('accuracy drives the score', hi.score >= lo.score);
}

console.log(`\n=== ${passed} passed, ${failed} failed ===\n`);
process.exit(failed === 0 ? 0 : 1);
