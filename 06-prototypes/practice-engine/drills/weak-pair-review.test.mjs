import test from 'node:test';
import assert from 'node:assert/strict';
import { runDrill, DRILL } from './weak-pair-review.mjs';
import { createFluencyStore } from '../fluency-store.mjs';

test('DRILL constant is weak-pair-review', () => { assert.equal(DRILL, 'weak-pair-review'); });

test('returns K weakest from knownPairs (cold-start)', () => {
  const r = runDrill({ knownPairs: [['Em', 'C'], ['Em', 'G'], ['Em', 'D'], ['Em', 'A']], K: 3 });
  assert.equal(r.metrics.pairs.length, 3);
  assert.ok(r.summary.includes('Weakest'));
});

test('records samples then surfaces the weakest', () => {
  const r = runDrill({
    knownPairs: [['Em', 'C'], ['Em', 'G']],
    K: 2,
    samples: [{ pair: 'C::Em', ratePerMin: 60 }, { pair: 'G::Em', ratePerMin: 10 }],
  });
  // after recording, G::Em has low fluency -> among the 2 weakest
  assert.ok(r.metrics.pairs.includes('G::Em'));
});

test('accepts a prebuilt store instance', () => {
  const store = createFluencyStore({ knownPairs: [['Em', 'C'], ['Em', 'G']] });
  store.record(['Em', 'C'], { ratePerMin: 60 });
  const r = runDrill({ store, K: 2 });
  assert.ok(Array.isArray(r.metrics.pairs));
  assert.equal(r.metrics.pairs.length, 2);
});
