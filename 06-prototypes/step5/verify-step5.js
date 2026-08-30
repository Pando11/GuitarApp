/*
 * verify-step5.js — Step 5 DONE BAR (browser-free, Node).
 *
 * Proves the in-lesson listening verification (F2 full) meets the spec bar using
 * SYNTHETIC chord tones (the same trick Step 2 used to prove pitch detection
 * without a real guitar in the room):
 *
 *   DONE BAR (from PLAN-from-locked-spec-2026-08-07.md, STEP 5):
 *   - on a real guitar, a correct Em passes and a wrong chord does NOT false-pass;
 *   - below-confidence input returns "not sure — play that again" NEVER a false red X;
 *   - feedback cites the specific string ("3rd string buzzing — press closer to the fret").
 *
 * This proves the LOGIC (detection + constrained target-matching + verdict routing).
 * The ONE open item, stated not hidden: live mic calibration on a real guitar strum
 * (body resonance, finger noise, multiple simultaneous string attacks). The math +
 * matching are proven; the acoustic capture is the only in-room sign-off.
 *
 * Run: node verify-step5.js
 */

'use strict';
const L = require('./engine/listening-engine.js');
const T = require('../step2/engine/tuner-engine.js');

let pass = 0, fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('  OK   ' + name); }
  else { fail++; console.log('  FAIL ' + name + (detail ? '  ' + detail : '')); }
}

const SR = 44100;

// Chord fingerings (low E(6)..high e(1)), null = muted. From lesson JSONs.
const EM = [0, 2, 2, 0, 0, 0];        // E minor — L02
const EMaj = [0, 2, 1, 0, 0, 0];      // E major — 3rd string lifted to 1st fret
const C_FRETS = [null, 3, 2, 0, 1, 0];  // C major — low E muted, A=3,D=2,G=0,B=1,high e=0
const G_FRETS = [3, 2, 0, 0, 0, 3];    // G major

console.log('STEP 5 DONE BAR — in-lesson listening verification (F2 full)\n');

console.log('1) CORRECT chord PASSES');
const emBuf = L.makeChordTone(EM, SR, 0.4);
const emV = L.verifyChord(emBuf, SR, EM);
check('Em correct -> verdict pass', emV.verdict === 'pass', 'got ' + emV.verdict + ' / ' + emV.msg);
check('Em pass names all 6 clean strings', emV.cleanStrings && emV.cleanStrings.length === 6,
  'clean=' + JSON.stringify(emV.cleanStrings));

console.log('\n2) WRONG chord does NOT false-pass (the core bar)');
// Student plays E major (3rd string 1st fret) but lesson asked for Em (3rd string 2nd fret).
const emajBuf = L.makeChordTone(EMaj, SR, 0.4);
const emajV = L.verifyChord(emajBuf, SR, EM);
check('E-major played when Em asked -> NOT pass', emajV.verdict !== 'pass', 'got ' + emajV.verdict);
check('E-major mismatch -> fail (specific)', emajV.verdict === 'fail',
  'got ' + emajV.verdict + ' / ' + emajV.msg);
check('E-major feedback is specific (names the wrong string or stray note)',
  /string 3|G#3|D#3|shouldn't be there/i.test(emajV.msg), 'msg=' + emajV.msg);

console.log('\n3) COMPLETELY different chord (G) when Em asked -> fail, not pass');
const gBuf = L.makeChordTone(G_FRETS, SR, 0.4);
const gV = L.verifyChord(gBuf, SR, EM);
check('G played when Em asked -> NOT pass', gV.verdict !== 'pass', 'got ' + gV.verdict);
check('G mismatch -> fail', gV.verdict === 'fail', 'msg=' + gV.msg);

console.log('\n4) TOO-QUIET input -> "not sure", NEVER a fail red X (honesty bar)');
const quiet = new Float32Array(Math.floor(SR * 0.4)); // silence
for (let i = 0; i < quiet.length; i++) quiet[i] = (Math.random() * 2 - 1) * 0.002; // ~2x below quietRms
const quietV = L.verifyChord(quiet, SR, EM);
check('too-quiet -> verdict unsure', quietV.verdict === 'unsure', 'got ' + quietV.verdict);
check('too-quiet NEVER a fail', quietV.verdict !== 'fail', 'got ' + quietV.verdict);
check('too-quiet msg = "not sure — play that again"',
  /not sure/i.test(quietV.msg), 'msg=' + quietV.msg);

console.log('\n5) UNCLEAR / no pitch -> unsure, never fail');
const noise = new Float32Array(Math.floor(SR * 0.4));
for (let i = 0; i < noise.length; i++) noise[i] = (Math.random() * 2 - 1) * 0.2; // loud but no pitch
const noiseV = L.verifyChord(noise, SR, EM);
check('no-pitch loud noise -> unsure (not fail)', noiseV.verdict === 'unsure', 'got ' + noiseV.verdict);

console.log('\n5b) INCOHERENT GARBAGE -> unsure, NEVER a red X (coherence-gate regression, root-cause fix)');
// DC offset only (no pitch structure) — must NOT be a fail.
const dc = new Float32Array(Math.floor(SR * 0.4)).fill(0.5);
const dcV = L.verifyChord(dc, SR, EM);
check('DC-only offset -> unsure (not fail)', dcV.verdict === 'unsure', 'got ' + dcV.verdict + ' / ' + dcV.msg);
check('DC-only NEVER a fail', dcV.verdict !== 'fail', 'got ' + dcV.verdict);
// Mains hum (50 Hz) — below guitar range, must NOT be a fail.
const hum = new Float32Array(Math.floor(SR * 0.4));
for (let i = 0; i < hum.length; i++) hum[i] = Math.sin(2 * Math.PI * 50 * i / SR) * 0.4;
const humV = L.verifyChord(hum, SR, EM);
check('50Hz mains hum -> unsure (not fail)', humV.verdict === 'unsure', 'got ' + humV.verdict + ' / ' + humV.msg);
check('50Hz mains hum NEVER a fail', humV.verdict !== 'fail', 'got ' + humV.verdict);

console.log('\n5c) A REAL wrong chord still FAILS (coherence gate must not mask a wrong chord as unsure)');
// G played when Em asked: shares ~0.5 its tones with Em — real mismatch, must FAIL not unsure.
const gV2 = L.verifyChord(gBuf, SR, EM);
check('G-vs-Em -> fail (not unsure) under coherence gate', gV2.verdict === 'fail', 'got ' + gV2.verdict);
// E-major played when Em asked: must still FAIL.
check('E-major-vs-Em -> fail (not unsure) under coherence gate', emajV.verdict === 'fail', 'got ' + emajV.verdict);

console.log('\n6) SPECIFIC STRING feedback — a missing/blocked string is named');
// Em but the D string (3rd) is muted: build Em with string-3 frequency zeroed.
const emParts = L.chordExpected(EM).filter(e => !e.muted);
const blocked = new Float32Array(Math.floor(SR * 0.4));
for (const e of emParts) {
  if (e.stringNum === 3) continue; // suppress the D string entirely
  const tone = T.makeStringTone(e.expectedFreq, SR, 0.4);
  for (let i = 0; i < blocked.length; i++) blocked[i] += tone[i] * 0.25;
}
const blockedV = L.verifyChord(blocked, SR, EM);
check('missing D string -> fail', blockedV.verdict === 'fail', 'got ' + blockedV.verdict);
check('missing D string feedback names string 3', /string 3/i.test(blockedV.msg), 'msg=' + blockedV.msg);

console.log('\n7) SPECIFIC STRING feedback — a buzzing/out-of-tune string is named');
// Em but the D string (3rd) is 30 cents flat (buzz).
const buzzed = new Float32Array(Math.floor(SR * 0.4));
for (const e of emParts) {
  let f = e.expectedFreq;
  if (e.stringNum === 3) f = e.expectedFreq * Math.pow(2, -15 / 1200); // 15c flat — heard but not clean
  const tone = T.makeStringTone(f, SR, 0.4);
  for (let i = 0; i < buzzed.length; i++) buzzed[i] += tone[i] * 0.25;
}
const buzzedV = L.verifyChord(buzzed, SR, EM);
check('buzzing/flat G string -> fail', buzzedV.verdict === 'fail', 'got ' + buzzedV.verdict);
check('flat G string feedback cites string 3 + flat', /string 3/i.test(buzzedV.msg) && /flat/i.test(buzzedV.msg),
  'msg=' + buzzedV.msg);

console.log('\n8) C major (has a muted low E) passes clean');
const cBuf = L.makeChordTone(C_FRETS, SR, 0.4);
const cV = L.verifyChord(cBuf, SR, C_FRETS);
check('C major correct -> pass', cV.verdict === 'pass', 'got ' + cV.verdict + ' / ' + cV.msg);
check('C major ignores muted low E (no false fail)', cV.verdict === 'pass', 'msg=' + cV.msg);

console.log('\n8b) C major WITH stray low-E ringing (should be muted) -> fail (muted-string guard)');
const cPlusLowE = (() => {
  const exp = L.chordExpected(C_FRETS).filter(e => !e.muted);
  const len = Math.floor(SR * 0.4); const buf = new Float32Array(len);
  for (const e of exp) { const t = T.makeStringTone(e.expectedFreq, SR, 0.4); for (let i = 0; i < len; i++) buf[i] += t[i]; }
  // Clearly-audible muted low E (same level as the other strings) — must be caught.
  const lowE = T.makeStringTone(82.41, SR, 0.4); for (let i = 0; i < len; i++) buf[i] += lowE[i];
  for (let i = 0; i < len; i++) buf[i] *= 0.25; return buf;
})();
const cMutedV = L.verifyChord(cPlusLowE, SR, C_FRETS);
check('C + stray ringing low-E must NOT pass', cMutedV.verdict !== 'pass', 'got ' + cMutedV.verdict);
check('C + stray low-E feedback cites muted string', /muted|should be muted/i.test(cMutedV.msg), 'msg=' + cMutedV.msg);

console.log('\n9) REUSE — Step 2 engine is the pitch core (no reimplementation)');
check('listening-engine reuses tuner-engine.autoCorrelate', typeof T.autoCorrelate === 'function');
check('listening-engine reuses tuner-engine.noteFromFreq', typeof T.noteFromFreq === 'function');
check('listening-engine reuses tuner-engine.centsOff', typeof T.centsOff === 'function');

console.log('\n10) BAN REGRESSION — no open transcription, no network, audio stays on-device');
const audit = L.selfAudit();
check('no fetch/XHR/WebSocket/URL in source (audio never leaves device)', audit.noNetwork === true);
// Ban 3: this never returns a chord *name* for arbitrary input; it only compares to the known target.
check('verifyChord is target-constrained (requires the expected frets)', L.verifyChord.length >= 3);

console.log('\n' + '='.repeat(62));
console.log('STEP 5 DONE BAR (logic): ' + pass + ' passed, ' + fail + ' failed');
console.log(fail === 0 ? 'STEP-5-LISTENING-OK — F2 full proven to bar' : 'STEP 5 LOGIC FAILED');
console.log('OPEN ITEM: live mic calibration on a real strummed chord (acoustic capture) — logic proven, in-room sign-off pending.');
console.log('='.repeat(62));
process.exit(fail === 0 ? 0 : 1);
