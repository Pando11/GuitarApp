// mutedStrum.test.mjs — plain check()/counter self-test (no test framework).
//
// Run: node 07-app/core/drills/mutedStrum.test.mjs
//
// Ported from 06-prototypes/practice-engine/drills/muted-strum.test.mjs's
// node:test assertions, translated into this repo's check()/counter style
// (see 07-app/core/telemetry.test.mjs for the pattern).
import { runDrill, DRILL } from './mutedStrum.js';

let passed = 0;
let failed = 0;
function check(name, cond) {
  if (cond) { passed++; console.log(`  PASS  ${name}`); }
  else { failed++; console.error(`  FAIL  ${name}`); }
}

console.log('\n=== mutedStrum.js self-test ===');

check('DRILL constant is muted-strum', DRILL === 'muted-strum');

{
  const r = runDrill({ tempoPerMin: 80, durationMin: 1.0, seed: 1, accuracy: 0.9 });
  check('emits muted (chord:null) strum events', r.events.length > 0);
  check('every event is chord:null, confident:true, has t', r.events.every((e) => e.chord === null && e.confident === true && 't' in e));
  check('mutedHits matches events length', r.metrics.mutedHits === r.events.length);
}

{
  const lo = runDrill({ seed: 4, accuracy: 0.3 });
  const hi = runDrill({ seed: 4, accuracy: 1.0 });
  check('higher accuracy => at least as many on-beat hits', hi.metrics.onBeat >= lo.metrics.onBeat);
}

{
  const r = runDrill({ tempoPerMin: 60, durationMin: 1.0, seed: 2, accuracy: 1.0 });
  check(`ratePerMin roughly matches tempo*accuracy (got ${r.ratePerMin})`, Math.abs(r.ratePerMin - 60) < 5);
}

console.log(`\n=== ${passed} passed, ${failed} failed ===\n`);
process.exit(failed === 0 ? 0 : 1);
