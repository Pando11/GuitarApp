import test from 'node:test';
import assert from 'node:assert/strict';
import { runDrill, buildGrid, DRILL } from './count-out-loud.mjs';

test('DRILL constant is count-out-loud', () => { assert.equal(DRILL, 'count-out-loud'); });

test('buildGrid produces the 1-&-2-& pattern', () => {
  const g = buildGrid({ beatsPerBar: 4, bars: 1 });
  assert.deepEqual(g, ['1', '&', '2', '&', '3', '&', '4', '&']);
});

test('emits strum-shaped events (chord:null) and correct slot count', () => {
  const r = runDrill({ tempoPerMin: 80, bars: 2, seed: 1, accuracy: 0.9 });
  assert.ok(r.events.length > 0);
  assert.ok(r.events.every((e) => e.chord === null && 'confident' in e && 't' in e));
  assert.equal(r.metrics.grid.length, 16); // 2 bars * 8 slots
});

test('accuracy drives the score', () => {
  const lo = runDrill({ seed: 3, accuracy: 0.2 });
  const hi = runDrill({ seed: 3, accuracy: 1.0 });
  assert.ok(hi.score >= lo.score);
});
