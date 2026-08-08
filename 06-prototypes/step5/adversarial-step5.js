/*
 * adversarial-step5.js — hostile re-test of the Step 5 listening engine.
 * Writes its OWN synthetic inputs (does not trust the project's verify-step5.js).
 * Goal: make the engine FALSE-PASS a wrong chord, or FALSE-FAIL a correct one,
 * or return a false red X on quiet input. Any hit = a real defect.
 */
'use strict';
const L = require('./engine/listening-engine.js');
const T = require('../step2/engine/tuner-engine.js');
const SR = 44100;

let hits = 0;
const probe = (name, cond, detail) => {
  const ok = !cond; // a "hit" means the bad thing happened
  console.log((ok ? '  SAFE ' : '  HIT  ') + name + (detail ? '  ' + detail : ''));
  if (cond) hits++;
};

// Tone helper: sum harmonic-rich strings at given frets.
function chord(frets, sr, sec, gain) {
  gain = gain == null ? 0.25 : gain;
  const exp = L.chordExpected(frets).filter(e => !e.muted);
  const len = Math.floor(sr * sec);
  const buf = new Float32Array(len);
  for (const e of exp) {
    const t = T.makeStringTone(e.expectedFreq, sr, sec);
    for (let i = 0; i < len; i++) buf[i] += t[i];
  }
  for (let i = 0; i < len; i++) buf[i] *= gain;
  return buf;
}
// Fret with a detune (cents) applied to one string number (1..6 high->low index).
function chordDetune(frets, sr, sec, strNum, cents) {
  const exp = L.chordExpected(frets).filter(e => !e.muted);
  const len = Math.floor(sr * sec);
  const buf = new Float32Array(len);
  for (const e of exp) {
    let f = e.expectedFreq;
    if (e.stringNum === strNum) f = e.expectedFreq * Math.pow(2, cents / 1200);
    const t = T.makeStringTone(f, sr, sec);
    for (let i = 0; i < len; i++) buf[i] += t[i];
  }
  for (let i = 0; i < len; i++) buf[i] *= 0.25;
  return buf;
}

console.log('ADVERSARIAL PROBE — Step 5 listening engine\n');

// 1) One string 50c out of tune on a "correct" Em -> must NOT pass (no false pass).
const em50 = chordDetune([0,2,2,0,0,0], SR, 0.4, 3, 50);
const r1 = L.verifyChord(em50, SR, [0,2,2,0,0,0]);
probe('Em with string-3 50c flat must NOT pass', r1.verdict === 'pass', JSON.stringify(r1));

// 2) Em but A and D strings SWAPPED (wrong chord shape) -> must fail.
// Em frets [0,2,2,0,0,0]; swapped A(2nd) & D(3rd) -> [0,2,2,...] identical for Em!
// Use a clearer swap: play Em but lift A to 3rd fret (Emadd?) -> still E class, but
// the D string at 2 vs expected 2 is fine. Instead test a TRUE wrong chord: CaddE.
const cMaj = [null,3,2,0,1,0];
const emAsC = chord(cMaj, SR, 0.4); // playing C but lesson asked Em
const r2 = L.verifyChord(emAsC, SR, [0,2,2,0,0,0]);
probe('playing C when Em asked must NOT pass', r2.verdict === 'pass', JSON.stringify(r2));

// 3) Correct chord + an EXTRA buzzing muted string (low E muted in C) -> C asks low E
// muted, but if student also rings low E, that's a stray note -> must fail.
const cPlusLowE = (() => {
  const exp = L.chordExpected(cMaj).filter(e => !e.muted);
  const len = Math.floor(SR*0.4); const buf = new Float32Array(len);
  for (const e of exp) { const t=T.makeStringTone(e.expectedFreq,SR,0.4); for(let i=0;i<len;i++)buf[i]+=t[i]; }
  const lowE = T.makeStringTone(82.41, SR, 0.4); for(let i=0;i<len;i++)buf[i]+=lowE[i];
  for(let i=0;i<len;i++)buf[i]*=0.25; return buf;
})();
const r3 = L.verifyChord(cPlusLowE, SR, cMaj);
probe('C + stray low-E (should be muted) must NOT pass', r3.verdict === 'pass', JSON.stringify(r3));

// 4) Quiet-but-coherent Em (gain 0.02, below quietRms 0.01? try 0.015) -> unsure, not pass.
const quietEm = chord([0,2,2,0,0,0], SR, 0.4, 0.015);
const r4 = L.verifyChord(quietEm, SR, [0,2,2,0,0,0]);
probe('quiet coherent Em must NOT pass (unsure, not red X)', r4.verdict === 'pass', JSON.stringify(r4));

// 5) Loud WHITE NOISE -> must be unsure, never pass/false-fail.
const noise = new Float32Array(Math.floor(SR*0.4));
for (let i=0;i<noise.length;i++) noise[i]=(Math.random()*2-1)*0.3;
const r5 = L.verifyChord(noise, SR, [0,2,2,0,0,0]);
probe('loud white noise must NOT pass', r5.verdict === 'pass', JSON.stringify(r5));
probe('loud white noise must NOT false-fail (should be unsure)', r5.verdict === 'fail', JSON.stringify(r5));

// 6) Genuinely correct Em at full gain -> pass (sanity).
const good = chord([0,2,2,0,0,0], SR, 0.4, 0.3);
const r6 = L.verifyChord(good, SR, [0,2,2,0,0,0]);
probe('correct Em at full gain must PASS', r6.verdict !== 'pass', JSON.stringify(r6));

// 7) Open-string-only chord (E2 etc.) all low: ensure low fundamentals detected.
const emOpen = chord([0,2,2,0,0,0], SR, 0.5, 0.35);
const r7 = L.verifyChord(emOpen, SR, [0,2,2,0,0,0]);
probe('Em with all 6 strings (incl low E2) must PASS', r7.verdict !== 'pass', JSON.stringify(r7.verdict));

console.log('\n' + '='.repeat(56));
console.log(hits === 0 ? 'ADVERSARIAL: 0 HITS — engine holds' : ('ADVERSARIAL: ' + hits + ' HIT(S) — DEFECT'));
console.log('='.repeat(56));
process.exit(hits === 0 ? 0 : 1);
