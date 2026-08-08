'use strict';
// Reproduction of the fresh-agent (argus) FAILs against the REAL engine, to tell
// genuine engine defects from test-harness artifacts (weak low fundamentals).
const L = require('./engine/listening-engine.js');
const T = require('../step2/engine/tuner-engine.js');
const SR = 22050;

function makeTone(freq, sr, sec) { return T.makeStringTone(freq, sr, sec); }

function bufFrom(parts, sr, sec, gain) {
  const len = Math.floor(sr * sec);
  const b = new Float32Array(len);
  for (const p of parts) {
    const t = makeTone(p.freq, sr, sec);
    for (let i = 0; i < len; i++) b[i] += t[i] * (p.gain == null ? 1 : p.gain);
  }
  for (let i = 0; i < len; i++) b[i] *= (gain == null ? 0.3 : gain);
  return b;
}

console.log('--- A7: correct Am (6th muted), synth via makeChordTone. Expect PASS. ---');
const am = [null, 0, 2, 2, 1, 0];
const amBuf = L.makeChordTone(am, SR, 0.35, 0.3);
console.log('  verdict:', JSON.stringify(L.verifyChord(amBuf, SR, am)));

console.log('--- D7: Am with muted 6th ACTUALLY ringing (add clear low E2). Expect FAIL citing string 6. ---');
const amRing = L.makeChordTone(am, SR, 0.35, 0.3);
{ // overlay a strong low E2 (82.41 Hz) = the muted string ringing
  const e2 = makeTone(82.41, SR, 0.35);
  for (let i = 0; i < amRing.length; i++) amRing[i] += e2[i] * 0.5;
}
console.log('  verdict:', JSON.stringify(L.verifyChord(amRing, SR, am)));

console.log('--- E4: Em but high-e (string1) missing. Expect FAIL citing string 1 missing. ---');
const em = [0, 2, 2, 0, 0, 0];
const emLow5 = bufFrom(
  [{ freq: 82.41, gain: 1 }, { freq: 110.0, gain: 1 }, { freq: 164.81, gain: 1 }, { freq: 196.0, gain: 1 }, { freq: 246.94, gain: 1 }],
  SR, 0.35, 0.3); // 5 of 6 Em strings, omit high e (329.63)
console.log('  verdict:', JSON.stringify(L.verifyChord(emLow5, SR, em)));

console.log('--- C5: DC-only signal (zero-mean offset). Expect unsure, NOT fail. ---');
const dc = new Float32Array(Math.floor(SR * 0.35)).fill(0.5);
console.log('  verdict:', JSON.stringify(L.verifyChord(dc, SR, em)));

console.log('--- C6: 50Hz hum. Expect unsure (incoherent for guitar), NOT fail. ---');
const hum = bufFrom([{ freq: 50, gain: 1 }], SR, 0.35, 0.5);
console.log('  verdict:', JSON.stringify(L.verifyChord(hum, SR, em)));
