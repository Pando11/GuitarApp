import test from 'node:test';
import assert from 'node:assert/strict';
import { runDrill, buildSequence, DRILL } from './spider-warmup.mjs';

test('DRILL constant is spider', () => { assert.equal(DRILL, 'spider'); });

test('buildSequence produces movements', () => {
  const b = buildSequence({ startFret: 1, frets: 4, strings: [6, 5, 4, 3, 2, 1], pattern: 'up' });
  assert.ok(b.movements > 0);
  assert.equal(b.sequence[0].finger, 1);
});

test('runDrill envelope', () => {
  const r = runDrill({});
  assert.equal(r.drill, 'spider');
  assert.ok(Array.isArray(r.metrics.sequence));
  assert.equal(r.score, 1);
});

test('down pattern reverses the ladder', () => {
  const up = buildSequence({ pattern: 'up', frets: 3, strings: [6], reps: 1 }).sequence.map((s) => s.fret);
  const down = buildSequence({ pattern: 'down', frets: 3, strings: [6], reps: 1 }).sequence.map((s) => s.fret);
  assert.deepEqual([...up].reverse(), down);
});
