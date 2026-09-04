import test from 'node:test';
import assert from 'node:assert/strict';
import { runDrill, findAnchor, DRILL } from './anchor-pivot.mjs';

const A = { name: 'C',  fingering: { '5': { fret: 3, finger: 3 }, '4': { fret: 2, finger: 2 }, '2': { fret: 1, finger: 1 } } };
const B = { name: 'Am', fingering: { '5': { fret: 3, finger: 3 }, '4': { fret: 2, finger: 2 }, '3': { fret: 1, finger: 1 } } };

test('DRILL constant is anchor', () => { assert.equal(DRILL, 'anchor'); });

test('finds shared anchor finger across the change', () => {
  const { anchor, pivotFingers } = findAnchor(A, B);
  assert.ok(anchor.length >= 2);
  assert.ok(anchor.some((a) => a.finger === 3 && a.string === '5' && a.fret === 3));
});

test('runDrill reports anchor', () => {
  const r = runDrill({ chordA: A, chordB: B });
  assert.equal(r.metrics.anchorFinger, 3);
  assert.equal(r.score, 1);
  assert.ok(r.summary.includes('pivot') || r.summary.includes('Anchor'));
});

test('no shared finger => full lift', () => {
  const X = { name: 'X', fingering: { '6': { fret: 1, finger: 1 } } };
  const Y = { name: 'Y', fingering: { '6': { fret: 3, finger: 3 } } };
  const r = runDrill({ chordA: X, chordB: Y });
  assert.equal(r.metrics.anchor.length, 0);
});

test('missing chords returns safe envelope', () => {
  const r = runDrill({});
  assert.equal(r.metrics.anchor.length, 0);
});
