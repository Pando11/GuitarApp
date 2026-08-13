import test from 'node:test';
import assert from 'node:assert/strict';
import { runDrill, DRILL } from './wait-to-play.mjs';

test('DRILL constant is wait-to-play', () => { assert.equal(DRILL, 'wait-to-play'); });

test('disciplined student waits (no false starts)', () => {
  const r = runDrill({ pair: ['A', 'B'], target: 'B', tempoPerMin: 60, durationMin: 1.0, seed: 1, discipline: 1.0 });
  assert.equal(r.metrics.falseStarts, 0);
  assert.equal(r.metrics.waited, true);
  assert.ok(r.metrics.accuracy >= 0.99);
  assert.equal(r.passed, true);
});

test('undisciplined student false-starts', () => {
  const r = runDrill({ pair: ['A', 'B'], target: 'B', tempoPerMin: 60, durationMin: 1.0, seed: 1, discipline: 0.0 });
  assert.ok(r.metrics.falseStarts > 0, 'should have false starts');
  assert.equal(r.metrics.waited, false);
  assert.equal(r.passed, false);
});

test('target heard flag + strum-event shape', () => {
  const r = runDrill({ pair: ['A', 'B'], target: 'B', seed: 5 });
  assert.equal(r.metrics.targetHeard, true);
  for (const e of r.events) assert.ok('chord' in e && 'confident' in e && 't' in e);
});
