import test from 'node:test';
import assert from 'node:assert/strict';
import { runDrill, DRILL } from './tempo-loop.mjs';

test('DRILL constant is tempo-loop', () => { assert.equal(DRILL, 'tempo-loop'); });

test('runDrill returns engine envelope with events + score', () => {
  const r = runDrill({ pair: ['A', 'B'], tempoPerMin: 60, scale: 1.0, seed: 1, skillA: 0.9, skillB: 0.9 });
  assert.equal(r.drill, 'tempo-loop');
  assert.ok(Array.isArray(r.events));
  assert.ok(r.events.length > 0);
  assert.equal(r.events[0].chord, 'A');
  assert.ok(typeof r.score === 'number');
  assert.ok(r.metrics.changes > 0, 'should count changes');
  assert.ok(r.summary.includes('↔'));
});

test('scale is clamped to [0.25,1.25]', () => {
  const lo = runDrill({ scale: -5 }); assert.equal(lo.params.scale, 0.25);
  const hi = runDrill({ scale: 9 });  assert.equal(hi.params.scale, 1.25);
});

test('higher tempo yields more strums in the window', () => {
  const slow = runDrill({ tempoPerMin: 40, scale: 1, seed: 3 });
  const fast = runDrill({ tempoPerMin: 120, scale: 1, seed: 3 });
  assert.ok(fast.metrics.effectiveTempo > slow.metrics.effectiveTempo);
});
