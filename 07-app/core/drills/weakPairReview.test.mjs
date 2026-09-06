// weakPairReview.test.mjs — plain check()/counter self-test (no test framework).
//
// Run: node 07-app/core/drills/weakPairReview.test.mjs
//
// Ported from 06-prototypes/practice-engine/drills/weak-pair-review.test.mjs's
// node:test assertions, translated into this repo's check()/counter style
// (see 07-app/core/telemetry.test.mjs for the pattern).
import { runDrill, DRILL } from './weakPairReview.js';
import { createFluencyStore } from '../fluencyStore.js';

let passed = 0;
let failed = 0;
function check(name, cond) {
  if (cond) { passed++; console.log(`  PASS  ${name}`); }
  else { failed++; console.error(`  FAIL  ${name}`); }
}

console.log('\n=== weakPairReview.js self-test ===');

check('DRILL constant is weak-pair-review', DRILL === 'weak-pair-review');

{
  const r = runDrill({ knownPairs: [['Em', 'C'], ['Em', 'G'], ['Em', 'D'], ['Em', 'A']], K: 3 });
  check('returns K weakest from knownPairs (cold-start)', r.metrics.pairs.length === 3);
  check('summary includes "Weakest"', r.summary.includes('Weakest'));
}

{
  const r = runDrill({
    knownPairs: [['Em', 'C'], ['Em', 'G']],
    K: 2,
    samples: [{ pair: 'C::Em', ratePerMin: 60 }, { pair: 'G::Em', ratePerMin: 10 }],
  });
  // after recording, G::Em has low fluency -> among the 2 weakest
  check('records samples then surfaces the weakest (G::Em present)', r.metrics.pairs.includes('G::Em'));
}

{
  const store = createFluencyStore({ knownPairs: [['Em', 'C'], ['Em', 'G']] });
  store.record(['Em', 'C'], { ratePerMin: 60 });
  const r = runDrill({ store, K: 2 });
  check('accepts a prebuilt store instance (pairs is array)', Array.isArray(r.metrics.pairs));
  check('pairs length is 2', r.metrics.pairs.length === 2);
}

console.log(`\n=== ${passed} passed, ${failed} failed ===\n`);
process.exit(failed === 0 ? 0 : 1);
