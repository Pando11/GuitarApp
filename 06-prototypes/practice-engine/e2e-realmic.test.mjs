// e2e-realmic.test.mjs — REAL-MIC e2e harness (synthetic-audio math only).
//
// Per HANDOFF-2026-08-12-REMAINING-ITEMS.md ITEM #4: the on-DEVICE run (a real
// guitar through a real mic in a browser) is a Heidi-authorized manual step before
// paid launch and CANNOT be satisfied here. What this harness DOES is de-risk the
// detector math: it feeds the listener's REAL CREPE-class FFT (no injected fake
// detector) a synthetic chord tone and asserts it classifies the right target
// chord with confident:true, and that noise / a wrong chord yields confident:false.
//
// This exercises the exact same createListenerReal + detectPitchClasses pipeline
// that the browser's listener-twin.js mirrors, so a pass here is real proof the
// pitch->classify path works — not a stubbed self-report.
//
// Run: node --test e2e-realmic.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { createListenerReal, analyzeAudio, chordPitchClasses } from './listener-real.mjs';

// --- synthetic tone generation (same math the real mic path would analyze) ---
const SAMPLE_RATE = 44100;

// A single strum window = ~1s of summed harmonic sines at the chord's pitch classes.
function freqOfPc(pc, octaveBase = 4) {
  const midi = 12 * (octaveBase + 1) + pc; // C4 = midi 60
  return 440 * Math.pow(2, (midi - 69) / 12);
}
function synthChord(pcs, durSec = 1.0, amp = 0.5) {
  const n = Math.floor(SAMPLE_RATE * durSec);
  const buf = new Float32Array(n);
  for (const pc of pcs) {
    const f = freqOfPc(pc);
    const k = 2 * Math.PI * f / SAMPLE_RATE;
    for (let i = 0; i < n; i++) buf[i] += amp * (Math.sin(k * i) + 0.4 * Math.sin(2 * k * i));
  }
  let mx = 0; for (let i = 0; i < n; i++) mx = Math.max(mx, Math.abs(buf[i]));
  if (mx > 0) for (let i = 0; i < n; i++) buf[i] /= mx;
  return buf;
}
function synthNoise(durSec = 1.0) {
  const n = Math.floor(SAMPLE_RATE * durSec);
  const buf = new Float32Array(n);
  for (let i = 0; i < n; i++) buf[i] = (Math.random() * 2 - 1) * 0.5;
  return buf;
}

test('REAL FFT classifies Em from a synthetic Em tone (confident:true)', () => {
  const pair = ['Em', 'easyC'];
  const buf = synthChord(chordPitchClasses('Em'));
  const evs = analyzeAudio({ buffer: buf, pair, tempoPerMin: 60 });
  assert.equal(evs.length, 1);
  assert.equal(evs[0].chord, 'Em');
  assert.equal(evs[0].confident, true);
});

test('REAL FFT classifies easyC from a synthetic easyC tone (confident:true)', () => {
  const pair = ['Em', 'easyC'];
  const buf = synthChord(chordPitchClasses('easyC'));
  const evs = analyzeAudio({ buffer: buf, pair, tempoPerMin: 60 });
  assert.equal(evs[0].chord, 'easyC');
  assert.equal(evs[0].confident, true);
});

test('REAL FFT treats white noise as not-confident (never a false red X)', () => {
  const pair = ['Em', 'easyC'];
  const buf = synthNoise();
  const evs = analyzeAudio({ buffer: buf, pair, tempoPerMin: 60 });
  assert.equal(evs.length, 1);
  assert.equal(evs[0].confident, false);
  assert.equal(evs[0].chord, null);
});

test('REAL FFT: a chord with ZERO overlap to the known pair is not confidently claimed', () => {
  const pair = ['Em', 'easyC'];
  // D = [2,6,9]; shares NO pitch class with Em[4,7,11] or easyC[0,4,7] -> must not match.
  const buf = synthChord(chordPitchClasses('D'));
  const evs = analyzeAudio({ buffer: buf, pair, tempoPerMin: 60 });
  assert.equal(evs[0].confident, false, 'zero-overlap chord must not be claimed');
  assert.equal(evs[0].chord, null);
});

test('REAL FFT alternation: Em then easyC produces two events in order', () => {
  const pair = ['Em', 'easyC'];
  // At tempoPerMin=60 the strum window is 1000ms; a 2s buffer -> 2 windows (Em, then easyC).
  const buf = new Float32Array(SAMPLE_RATE * 2);
  buf.set(synthChord(chordPitchClasses('Em')), 0);
  buf.set(synthChord(chordPitchClasses('easyC')), SAMPLE_RATE);
  const evs = analyzeAudio({ buffer: buf, pair, tempoPerMin: 60 }); // 2 strum windows
  assert.equal(evs.length, 2);
  assert.equal(evs[0].chord, 'Em');
  assert.equal(evs[1].chord, 'easyC');
});

test('createListenerReal + REAL FFT still reject a non-pair arg', () => {
  assert.throws(() => createListenerReal({ pair: ['Em'] }), /pair must be/);
});
