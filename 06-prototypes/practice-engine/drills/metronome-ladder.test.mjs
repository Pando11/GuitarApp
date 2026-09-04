import test from 'node:test';
import assert from 'node:assert/strict';
import { runDrill, DRILL } from './metronome-ladder.mjs';

test('DRILL constant is metronome-ladder', () => { assert.equal(DRILL, 'metronome-ladder'); });

test('climbs every level when always clean', () => {
  const r = runDrill({ pair: ['A', 'B'], startBpm: 60, maxBpm: 140, step: 5, cleanRatePerMin: 0, rounds: 8, seed: 2, skillA: 1.0, skillB: 1.0 });
  assert.equal(r.metrics.levels.length, 8);
  assert.equal(r.metrics.topBpm, 95); // 60 + 7 steps of 5 (last recorded level)
  assert.equal(r.passed, true);
});

test('holds when never clean', () => {
  const r = runDrill({ pair: ['A', 'B'], startBpm: 60, maxBpm: 140, step: 5, cleanRatePerMin: 999, rounds: 4, seed: 2 });
  assert.equal(r.metrics.levels.every((l) => l.bpm === 60), true);
  assert.equal(r.passed, false);
});

test('envelope has levels + summary', () => {
  const r = runDrill({ seed: 9 });
  assert.ok(r.metrics.levels.length >= 1);
  assert.ok(r.summary.includes('→'));
});
