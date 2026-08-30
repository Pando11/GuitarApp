import test from 'node:test';
import assert from 'node:assert/strict';
import { runDrill, DRILL } from './muted-strum.mjs';

test('DRILL constant is muted-strum', () => { assert.equal(DRILL, 'muted-strum'); });

test('emits muted (chord:null) strum events', () => {
  const r = runDrill({ tempoPerMin: 80, durationMin: 1.0, seed: 1, accuracy: 0.9 });
  assert.ok(r.events.length > 0);
  assert.ok(r.events.every((e) => e.chord === null && e.confident === true && 't' in e));
  assert.equal(r.metrics.mutedHits, r.events.length);
});

test('higher accuracy => at least as many on-beat hits', () => {
  const lo = runDrill({ seed: 4, accuracy: 0.3 });
  const hi = runDrill({ seed: 4, accuracy: 1.0 });
  assert.ok(hi.metrics.onBeat >= lo.metrics.onBeat);
});

test('ratePerMin roughly matches tempo*accuracy', () => {
  const r = runDrill({ tempoPerMin: 60, durationMin: 1.0, seed: 2, accuracy: 1.0 });
  assert.ok(Math.abs(r.ratePerMin - 60) < 5, `got ${r.ratePerMin}`);
});
