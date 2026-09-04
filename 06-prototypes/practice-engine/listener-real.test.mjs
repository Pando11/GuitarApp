// listener-real.test.mjs — fresh-verifier completion (A's missing deliverable).
// Deterministic: injects a fake pitch detector so NO real mic / model is needed.
// Asserts the emitted strum event matches the target chord and the engine contract.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createListenerReal,
  analyzeAudio,
  chordPitchClasses,
  detectPitchClasses,
  classifyStrum,
} from './listener-real.mjs';

// Build a fake "audio frame" whose detected peaks are the pitch classes of a chord.
// detectPitchClasses(frame, {sampleRate}) is the injectable hook; we bypass the real
// FFT entirely by passing a fake detector that returns fixed pcs with unit magnitude.
function fakeDetector(pcs, mag = 1) {
  return (/* frame, opts */) => pcs.map((pc) => ({ pc, mag }));
}

// A synthesized chord "buffer": for analyzeAudio we only need a non-empty Float32Array
// (frameSize default 4096). The pitch content comes from the injected detector.
function synthBuffer() {
  return new Float32Array(4096).fill(0);
}

test('chordPitchClasses collapses easyC -> same pcs as C (canon alignment)', () => {
  assert.deepEqual(chordPitchClasses('easyC'), chordPitchClasses('C'));
  assert.deepEqual(chordPitchClasses('Em'), [4, 7, 11]);
});

test('detectPitchClasses is the documented injection hook', () => {
  // sanity: a frame of silence yields no peaks (default impl, not used by tests)
  assert.ok(typeof detectPitchClasses === 'function');
});

test('analyzeAudio emits the TARGET chord when given Em energy', () => {
  const events = analyzeAudio({
    buffer: synthBuffer(),
    pair: ['Em', 'easyC'],
    tempoPerMin: 60,
    pitchDetector: fakeDetector(chordPitchClasses('Em')),
  });
  assert.equal(events.length, 1, 'one strum window => one event');
  const e = events[0];
  assert.equal(e.chord, 'Em', 'emitted chord matches the synthesized target');
  assert.equal(e.confident, true, 'above threshold => confident');
  assert.equal(typeof e.t, 'number', 'strum-event shape requires t (ms)');
});

test('analyzeAudio emits the OTHER target chord (easyC)', () => {
  const events = analyzeAudio({
    buffer: synthBuffer(),
    pair: ['Em', 'easyC'],
    tempoPerMin: 60,
    pitchDetector: fakeDetector(chordPitchClasses('easyC')),
  });
  assert.equal(events[0].chord, 'easyC');
  assert.equal(events[0].confident, true);
});

test('below-threshold / unknown energy emits confident:false (never a false red X)', () => {
  // A frame with pitch class NOT in either target chord must NOT be confidently claimed.
  const events = analyzeAudio({
    buffer: synthBuffer(),
    pair: ['Em', 'easyC'],
    tempoPerMin: 60,
    // pitch class 1 (C#) belongs to neither Em nor easyC
    pitchDetector: fakeDetector([1]),
  });
  assert.equal(events.length, 1);
  assert.equal(events[0].confident, false, 'Rule 6: no false positive');
  assert.equal(events[0].chord, null, 'chord is null when not confidently matched');
});

test('strum-event shape matches one-minute-changes contract', () => {
  const events = analyzeAudio({
    buffer: synthBuffer(),
    pair: ['Em', 'easyC'],
    pitchDetector: fakeDetector(chordPitchClasses('Em')),
  });
  const e = events[0];
  const keys = Object.keys(e).sort();
  assert.deepEqual(keys, ['chord', 'confident', 't']);
});

test('createListenerReal rejects a non-pair arg', () => {
  assert.throws(() => createListenerReal({ pair: ['Em'] }), /pair must be/);
});

test('createListenerReal rejects unknown chord tokens', () => {
  assert.throws(() => createListenerReal({ pair: ['Em', 'ZZZ'] }), /unknown chord/);
});

test('classifyStrum returns the dominant known chord', () => {
  const pair = ['Em', 'easyC'];
  const pairPcs = {
    tokenA: 'Em', pcsA: chordPitchClasses('Em'),
    tokenB: 'easyC', pcsB: chordPitchClasses('easyC'),
  };
  const acc = new Map();
  for (const pc of chordPitchClasses('Em')) acc.set(pc, 1);
  const r = classifyStrum(acc, pairPcs, { minCoverage: 2, minDominance: 0.5 });
  assert.equal(r.chord, 'Em');
  assert.equal(r.confident, true);
});
