// tempoLoop.test.mjs — plain check()/counter self-test (no test framework).
//
// Run: node 07-app/core/drills/tempoLoop.test.mjs
//
// Ported from 06-prototypes/practice-engine/drills/tempo-loop.test.mjs's
// node:test assertions, translated into this repo's check()/counter style
// (see 07-app/core/telemetry.test.mjs for the pattern).
import { runDrill, DRILL } from './tempoLoop.js';

let passed = 0;
let failed = 0;
function check(name, cond) {
  if (cond) { passed++; console.log(`  PASS  ${name}`); }
  else { failed++; console.error(`  FAIL  ${name}`); }
}

console.log('\n=== tempoLoop.js self-test ===');

check('DRILL constant is tempo-loop', DRILL === 'tempo-loop');

{
  const r = runDrill({ pair: ['A', 'B'], tempoPerMin: 60, scale: 1.0, seed: 1, skillA: 0.9, skillB: 0.9 });
  check('drill is tempo-loop', r.drill === 'tempo-loop');
  check('events is an array', Array.isArray(r.events));
  check('events is non-empty', r.events.length > 0);
  check('first event chord is A', r.events[0].chord === 'A');
  check('score is a number', typeof r.score === 'number');
  check('metrics.changes > 0 (should count changes)', r.metrics.changes > 0);
  check('summary includes arrow char', r.summary.includes('↔'));
}

{
  const lo = runDrill({ scale: -5 });
  const hi = runDrill({ scale: 9 });
  check('scale is clamped to 0.25 lower bound', lo.params.scale === 0.25);
  check('scale is clamped to 1.25 upper bound', hi.params.scale === 1.25);
}

{
  const slow = runDrill({ tempoPerMin: 40, scale: 1, seed: 3 });
  const fast = runDrill({ tempoPerMin: 120, scale: 1, seed: 3 });
  check('higher tempo yields higher effective tempo', fast.metrics.effectiveTempo > slow.metrics.effectiveTempo);
}

console.log(`\n=== ${passed} passed, ${failed} failed ===\n`);
process.exit(failed === 0 ? 0 : 1);
