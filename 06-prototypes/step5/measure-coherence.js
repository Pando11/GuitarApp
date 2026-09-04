'use strict';
// Measure the raw signals the coherence gate relies on, to design a fix that
// returns 'unsure' for incoherent input (DC/50Hz) WITHOUT regressing the
// correct wrong-chord -> FAIL behavior. No edits yet — measurement only.
const L = require('./engine/listening-engine.js');
const T = require('../step2/engine/tuner-engine.js');
const SR = 22050;

function bufFrom(parts, sr, sec, gain) {
  const len = Math.floor(sr * sec);
  const b = new Float32Array(len);
  for (const p of parts) {
    const t = T.makeStringTone(p.freq, sr, sec);
    for (let i = 0; i < len; i++) b[i] += t[i] * (p.gain == null ? 1 : p.gain);
  }
  for (let i = 0; i < len; i++) b[i] *= (gain == null ? 0.3 : gain);
  return b;
}

function probe(label, buf, frets) {
  const det = L.detectPitchSet(buf, SR);
  const expected = L.chordExpected(frets).filter(e => !e.muted);
  // coverage = fraction of expected pitch classes present in heard set
  let present = 0;
  for (const e of expected) {
    if (det.heard.some(h => L.notesMatch(h, e.expectedNote, 25))) present++;
  }
  const coverage = present / expected.length;
  console.log(label.padEnd(28),
    'clarity=' + det.clarity.toFixed(3),
    'f0=' + (det.f0 != null ? det.f0.toFixed(1) : 'n/a'),
    'heard=' + det.heard.length,
    'coverage=' + coverage.toFixed(2),
    'rms=' + det.rms.toFixed(3));
}

const em = [0, 2, 2, 0, 0, 0];
const am = [null, 0, 2, 2, 1, 0];

console.log('SIGNAL MEASUREMENTS (for gate design)\n');
probe('CORRECT Em', L.makeChordTone(em, SR, 0.35, 0.3), em);
probe('WRONG chord (G vs Em)', L.makeChordTone([3,2,0,0,0,3], SR, 0.35, 0.3), em); // G played, target Em
probe('CORRECT Am', L.makeChordTone(am, SR, 0.35, 0.3), am);
probe('DC offset only', new Float32Array(Math.floor(SR*0.35)).fill(0.5), em);
probe('50Hz hum', bufFrom([{freq:50,gain:1}], SR, 0.35, 0.6), em);
probe('white noise', (()=>{const b=new Float32Array(Math.floor(SR*0.35));for(let i=0;i<b.length;i++)b[i]=Math.random()*2-1;b.rms=0;return b;})(), em);
probe('very quiet (rms<0.03)', L.makeChordTone(em, SR, 0.35, 0.02), em);
