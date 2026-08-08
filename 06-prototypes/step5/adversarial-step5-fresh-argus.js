/*
 * adversarial-step5-fresh-argus.js
 * INDEPENDENT hostile re-verify of Step 5 listening verification.
 * Written from scratch. Does NOT import/run verify-step5.js, adversarial-step5.js,
 * or render-smoke-step5.js. Only the engine under test is imported.
 * Synthesis is MY OWN (own harmonic model, own noise, own decay) — the engine's
 * makeChordTone() is deliberately NOT used for the primary cases.
 */
'use strict';
const path = require('path');
const fs = require('fs');
const ENGINE = path.join(__dirname, 'engine', 'listening-engine.js');
const L = require(ENGINE);

const SR = 22050;
let total = 0, pass = 0, fail = 0;
const defects = [];
function ck(name, cond, detail) {
  total++;
  if (cond) { pass++; console.log('  PASS  ' + name); }
  else { fail++; console.log('  FAIL  ' + name + (detail ? '  :: ' + detail : '')); defects.push(name + (detail ? ' :: ' + detail : '')); }
}

// ---------- my own guitar-ish synth ----------
const OPEN = [82.41, 110.00, 146.83, 196.00, 246.94, 329.63]; // low E6 .. high e1
function fretFreq(i, fret) { return OPEN[i] * Math.pow(2, fret / 12); }

// Additive: weak fundamental on low strings, strong 2nd/3rd harmonics, exp decay,
// slight inharmonicity, plus a touch of pink-ish noise (pick attack).
function stringTone(f0, sr, secs, amp, opts) {
  opts = opts || {};
  const n = Math.floor(sr * secs);
  const out = new Float32Array(n);
  const nH = 8;
  for (let h = 1; h <= nH; h++) {
    const fh = f0 * h * (1 + 0.0002 * h * h);
    if (fh > sr / 2) break;
    // low strings: fundamental suppressed
    let a = 1 / h;
    if (h === 1 && f0 < 130) a *= 0.35;
    if (h === 2) a *= 1.4;
    const ph = (h * 1.7) % (2 * Math.PI);
    const dec = 2.0 + 0.35 * h;
    for (let i = 0; i < n; i++) {
      const t = i / sr;
      out[i] += amp * a * Math.exp(-dec * t) * Math.sin(2 * Math.PI * fh * t + ph);
    }
  }
  if (opts.noise) {
    let s = 12345;
    for (let i = 0; i < n; i++) { s = (s * 1103515245 + 12345) & 0x7fffffff; out[i] += opts.noise * amp * ((s / 0x7fffffff) - 0.5); }
  }
  return out;
}
// chord: array of {i, fret} sounding strings. detune: map stringIndex->cents
function chordSignal(voices, gain, opts) {
  opts = opts || {};
  const secs = opts.secs || 0.35;
  const n = Math.floor(SR * secs);
  const buf = new Float32Array(n);
  voices.forEach((v, k) => {
    let f = fretFreq(v.i, v.fret);
    if (v.cents) f *= Math.pow(2, v.cents / 1200);
    const t = stringTone(f, SR, secs, v.amp == null ? 1 : v.amp, { noise: opts.noise || 0 });
    // small strum offset
    const off = Math.floor(k * 0.006 * SR);
    for (let i = 0; i < n - off; i++) buf[i + off] += t[i];
  });
  let mx = 0; for (let i = 0; i < n; i++) mx = Math.max(mx, Math.abs(buf[i]));
  if (mx > 0) for (let i = 0; i < n; i++) buf[i] = buf[i] / mx * gain;
  return buf;
}
function rmsOf(b) { let s = 0; for (let i = 0; i < b.length; i++) s += b[i] * b[i]; return Math.sqrt(s / b.length); }

// ---------- chord shapes (low E .. high e) ----------
const EM   = [0, 2, 2, 0, 0, 0];
const EMAJ = [0, 2, 2, 1, 0, 0];
const GMAJ = [3, 2, 0, 0, 0, 3];
const AMIN  = [null, 0, 2, 2, 1, 0];
const CMAJ  = [null, 3, 2, 0, 1, 0];
function voicesOf(frets) {
  const v = [];
  for (let i = 0; i < 6; i++) if (frets[i] !== null) v.push({ i, fret: frets[i] });
  return v;
}
function V(res) { return res.verdict; }
function joined(res) { return (res.problems || [res.msg]).join(' | '); }

console.log('\n=== FRESH ADVERSARIAL STEP 5 (argus) ===\n');

// --- A. Correct chord passes (no false-fail) ---
console.log('A. correct chord at healthy gain');
{
  const buf = chordSignal(voicesOf(EM), 0.30);
  const r = L.verifyChord(buf, SR, EM);
  ck('A1 Em played vs Em target => pass', V(r) === 'pass', V(r) + ' / ' + joined(r));
  ck('A2 pass message names the chord/clean strings', V(r) !== 'pass' || /Em|clean/i.test(r.msg), r.msg);
  ck('A3 pass reports 6 clean strings', V(r) !== 'pass' || (r.cleanStrings && r.cleanStrings.length === 6), JSON.stringify(r.cleanStrings));
}
{ // gain sweep — correct chord must never false-fail across loud takes
  for (const g of [0.10, 0.20, 0.45, 0.80]) {
    const r = L.verifyChord(chordSignal(voicesOf(EM), g), SR, EM);
    ck('A4 Em@gain ' + g + ' not a false FAIL', V(r) !== 'fail', V(r) + ' / ' + joined(r));
  }
}
{ // with pick noise
  const r = L.verifyChord(chordSignal(voicesOf(EM), 0.30, { noise: 0.15 }), SR, EM);
  ck('A5 Em with pick noise not false-FAIL', V(r) !== 'fail', V(r) + ' / ' + joined(r));
}
{ // other targets
  const r1 = L.verifyChord(chordSignal(voicesOf(GMAJ), 0.30), SR, GMAJ);
  ck('A6 G played vs G target => pass', V(r1) === 'pass', V(r1) + ' / ' + joined(r1));
  const r2 = L.verifyChord(chordSignal(voicesOf(AMIN), 0.30), SR, AMIN);
  ck('A7 Am (6th muted) played correctly => pass', V(r2) === 'pass', V(r2) + ' / ' + joined(r2));
  const r3 = L.verifyChord(chordSignal(voicesOf(CMAJ), 0.30), SR, CMAJ);
  ck('A8 C (6th muted) played correctly => pass', V(r3) === 'pass', V(r3) + ' / ' + joined(r3));
}
{ // slightly imperfect but within clean tolerance
  const v = voicesOf(EM); v[2].cents = 4;
  const r = L.verifyChord(chordSignal(v, 0.30), SR, EM);
  ck('A9 Em with +4c on one string still passes', V(r) === 'pass', V(r) + ' / ' + joined(r));
}

// --- B. Wrong chord must NOT false-pass ---
console.log('\nB. wrong chord must not false-pass');
{
  const r = L.verifyChord(chordSignal(voicesOf(EMAJ), 0.30), SR, EM);
  ck('B1 E-major played, Em target => NOT pass', V(r) !== 'pass', V(r) + ' / ' + joined(r));
  ck('B2 ...and is an explicit fail', V(r) === 'fail', V(r));
}
{
  const r = L.verifyChord(chordSignal(voicesOf(GMAJ), 0.30), SR, EM);
  ck('B3 G played, Em target => NOT pass', V(r) !== 'pass', V(r) + ' / ' + joined(r));
}
{
  const r = L.verifyChord(chordSignal(voicesOf(EM), 0.30), SR, GMAJ);
  ck('B4 Em played, G target => NOT pass', V(r) !== 'pass', V(r) + ' / ' + joined(r));
}
{
  const r = L.verifyChord(chordSignal(voicesOf(CMAJ), 0.30), SR, AMIN);
  ck('B5 C played, Am target => NOT pass', V(r) !== 'pass', V(r) + ' / ' + joined(r));
}
{
  const r = L.verifyChord(chordSignal(voicesOf(AMIN), 0.30), SR, CMAJ);
  ck('B6 Am played, C target => NOT pass', V(r) !== 'pass', V(r) + ' / ' + joined(r));
}
{ // single-note only — one string strummed, target full chord
  const r = L.verifyChord(chordSignal([{ i: 0, fret: 0 }], 0.30), SR, EM);
  ck('B7 only low-E rung, Em target => NOT pass', V(r) !== 'pass', V(r) + ' / ' + joined(r));
}
{ // one string badly fretted (semitone off)
  const v = voicesOf(EM); v[3].fret = 1; // G string 0 -> 1 = G#
  const r = L.verifyChord(chordSignal(v, 0.30), SR, EM);
  ck('B8 one string a semitone off => NOT pass', V(r) !== 'pass', V(r) + ' / ' + joined(r));
}
{ // massive gain wrong chord (try to bully it into pass)
  const r = L.verifyChord(chordSignal(voicesOf(EMAJ), 0.95), SR, EM);
  ck('B9 loud E-major vs Em => NOT pass', V(r) !== 'pass', V(r) + ' / ' + joined(r));
}
{ // wrong chord with tolerances loosened by a caller (opts abuse)
  const r = L.verifyChord(chordSignal(voicesOf(EMAJ), 0.30), SR, EM, { presentTol: 200, cleanTol: 200 });
  ck('B10 opts-loosened tolerances still do not accept E-major as Em', V(r) !== 'pass', V(r) + ' / ' + joined(r));
}

// --- C. Below-confidence => unsure, NEVER a red X ---
console.log('\nC. low-confidence must be unsure, never fail');
{
  for (const g of [0.001, 0.005, 0.01, 0.02, 0.029]) {
    const b = chordSignal(voicesOf(EM), g);
    const r = L.verifyChord(b, SR, EM);
    ck('C1 quiet Em gain=' + g + ' (rms ' + rmsOf(b).toFixed(4) + ') => unsure not fail', V(r) === 'unsure', V(r) + ' / ' + joined(r));
    ck('C2 quiet msg says play that again (g=' + g + ')', /not sure/i.test(r.msg || ''), r.msg);
  }
}
{ // white noise
  let s = 7; const n = Math.floor(SR * 0.35); const b = new Float32Array(n);
  for (let i = 0; i < n; i++) { s = (s * 1103515245 + 12345) & 0x7fffffff; b[i] = ((s / 0x7fffffff) - 0.5) * 0.6; }
  const r = L.verifyChord(b, SR, EM);
  ck('C3 loud white noise => not a fail (unsure)', V(r) === 'unsure', V(r) + ' / ' + joined(r));
}
{ // digital silence
  const b = new Float32Array(Math.floor(SR * 0.3));
  const r = L.verifyChord(b, SR, EM);
  ck('C4 pure silence => unsure', V(r) === 'unsure', V(r));
}
{ // DC offset only
  const b = new Float32Array(Math.floor(SR * 0.3)).fill(0.5);
  const r = L.verifyChord(b, SR, EM);
  ck('C5 DC-only signal => not a fail', V(r) !== 'fail', V(r) + ' / ' + joined(r));
}
{ // room rumble / hum below musical range
  const n = Math.floor(SR * 0.3); const b = new Float32Array(n);
  for (let i = 0; i < n; i++) b[i] = 0.5 * Math.sin(2 * Math.PI * 50 * i / SR);
  const r = L.verifyChord(b, SR, EM);
  ck('C6 50Hz hum => not a fail', V(r) !== 'fail', V(r) + ' / ' + joined(r));
}
{ // wrong chord, but too quiet: honesty rule says unsure wins over fail
  const b = chordSignal(voicesOf(EMAJ), 0.01);
  const r = L.verifyChord(b, SR, EM);
  ck('C7 quiet WRONG chord => unsure (no false red X)', V(r) === 'unsure', V(r) + ' / ' + joined(r));
  ck('C8 ...and definitely not a pass', V(r) !== 'pass', V(r));
}

// --- D. Muted string that rings is caught, with string number ---
console.log('\nD. muted-string ring detection');
{
  const v = voicesOf(AMIN); v.push({ i: 0, fret: 0 }); // low E rings on Am
  const r = L.verifyChord(chordSignal(v, 0.30), SR, AMIN);
  ck('D1 Am with low-E ringing => fail', V(r) === 'fail', V(r) + ' / ' + joined(r));
  ck('D2 ...feedback names string 6', /string 6/.test(joined(r)), joined(r));
  ck('D3 ...feedback mentions muted/ring', /mut|ring/i.test(joined(r)), joined(r));
}
{
  const v = voicesOf(CMAJ); v.push({ i: 0, fret: 0 });
  const r = L.verifyChord(chordSignal(v, 0.30), SR, CMAJ);
  ck('D4 C major with low-E ringing => fail', V(r) === 'fail', V(r) + ' / ' + joined(r));
  ck('D5 ...names string 6', /string 6/.test(joined(r)), joined(r));
}

// D-bis: cross-check with the ENGINE'S OWN synth so the finding cannot be blamed
// on my synthesis model. (Only place the engine's makeChordTone is used.)
{
  const AM = [null, 0, 2, 2, 1, 0];
  const rClean = L.verifyChord(L.makeChordTone(AM, SR, 0.35, 0.3), SR, AM);
  ck('D6 [own-synth] clean Am => pass', V(rClean) === 'pass', V(rClean) + ' / ' + joined(rClean));
  const rRing = L.verifyChord(L.makeChordTone([0, 0, 2, 2, 1, 0], SR, 0.35, 0.3), SR, AM);
  ck('D7 [own-synth] Am with muted 6th RINGING => must NOT pass', V(rRing) !== 'pass', V(rRing) + ' / ' + joined(rRing));
  ck('D8 [own-synth] ...and cites string 6', /string 6/.test(joined(rRing)), joined(rRing));
}

// --- E. Specific-string feedback for missing / bad strings ---
console.log('\nE. per-string specific feedback');
{
  const v = voicesOf(EM).filter(x => x.i !== 3); // drop D string (string #3)
  const r = L.verifyChord(chordSignal(v, 0.30), SR, EM);
  ck('E1 missing 3rd string => fail', V(r) === 'fail', V(r) + ' / ' + joined(r));
  ck('E2 ...cites "string 3"', /string 3\b/.test(joined(r)), joined(r));
  ck('E3 ...actionable wording (finger/fret/strum/ringing)', /finger|fret|strum|ringing/i.test(joined(r)), joined(r));
}
{
  const v = voicesOf(EM).filter(x => x.i !== 5); // drop high e (string #1)
  const r = L.verifyChord(chordSignal(v, 0.30), SR, EM);
  ck('E4 missing high-e => fail citing string 1', V(r) === 'fail' && /string 1\b/.test(joined(r)), V(r) + ' / ' + joined(r));
}
{ // buzzing / badly-fretted: 30 cents sharp on one string -> should be flagged, not passed
  const v = voicesOf(EM); v[3].cents = 30;
  const r = L.verifyChord(chordSignal(v, 0.30), SR, EM);
  ck('E5 string 30c sharp => not a pass', V(r) !== 'pass', V(r) + ' / ' + joined(r));
  ck('E6 ...feedback cites a specific string number', /string \d/.test(joined(r)), joined(r));
}
{
  const r = L.verifyChord(chordSignal(voicesOf(EM).filter(x => x.i !== 3), 0.30), SR, EM);
  ck('E7 fail msg is never a bare X / empty', !!(r.msg && r.msg.length > 12), JSON.stringify(r.msg));
}

// --- F. Structural / invariants ---
console.log('\nF. structure & invariants');
{
  const exp = L.chordExpected(AMIN);
  ck('F1 chordExpected returns 6 entries', exp.length === 6);
  ck('F2 stringNum mapping low-E=6, high-e=1', exp[0].stringNum === 6 && exp[5].stringNum === 1);
  ck('F3 muted flag set for null fret', exp[0].muted === true && exp[1].muted === false);
  ck('F4 fretted freq math (A string 2nd fret = B ~123.47)', Math.abs(exp[1].expectedFreq * Math.pow(2, 2 / 12) - 123.47) < 0.5);
}
{
  const verdicts = new Set();
  for (const g of [0.0, 0.005, 0.05, 0.3, 0.9]) verdicts.add(V(L.verifyChord(chordSignal(voicesOf(EM), g), SR, EM)));
  ck('F5 only legal verdict strings emitted', [...verdicts].every(x => ['pass', 'fail', 'unsure'].includes(x)), [...verdicts].join(','));
}
{
  const r = L.verifyChord(chordSignal(voicesOf(EM), 0.30), SR, EM);
  ck('F6 result always carries a msg', typeof r.msg === 'string' && r.msg.length > 0);
  ck('F7 result carries rms number', typeof r.rms === 'number');
}
{ // determinism
  const b = chordSignal(voicesOf(EM), 0.3);
  const a1 = L.verifyChord(b, SR, EM), a2 = L.verifyChord(b, SR, EM);
  ck('F8 deterministic for identical input', JSON.stringify(a1) === JSON.stringify(a2));
}
{ // non-mutation of input buffer
  const b = chordSignal(voicesOf(EM), 0.3);
  const copy = Float32Array.from(b);
  L.verifyChord(b, SR, EM);
  let same = true; for (let i = 0; i < b.length; i++) if (b[i] !== copy[i]) { same = false; break; }
  ck('F9 input buffer not mutated', same);
}

// --- G. Hard Ban 5: audio never leaves device ---
console.log('\nG. Hard Ban 5 — no network in audio path');
{
  const src = fs.readFileSync(ENGINE, 'utf8');
  // strip the selfAudit regex literal itself so we don't match the guard's own pattern
  const scan = src.replace(/const bannedCall[\s\S]*?;\n/, '');
  const bad = [/\bfetch\s*\(/, /XMLHttpRequest/, /WebSocket/, /\brequire\s*\(\s*['"](http|https|net|dgram|ws)['"]\s*\)/, /axios/, /navigator\.sendBeacon/, /\bEventSource\b/];
  const hits = bad.filter(re => re.test(scan)).map(String);
  ck('G1 engine source has no network calls', hits.length === 0, hits.join(','));
  const tuner = fs.readFileSync(path.join(__dirname, '..', 'step2', 'engine', 'tuner-engine.js'), 'utf8');
  const hits2 = bad.filter(re => re.test(tuner)).map(String);
  ck('G2 reused tuner-engine has no network calls', hits2.length === 0, hits2.join(','));
  ck('G3 selfAudit() reports noNetwork', L.selfAudit().noNetwork === true);
}

console.log('\n=== SUMMARY ===');
console.log('total ' + total + '  pass ' + pass + '  fail ' + fail);
if (defects.length) { console.log('\nDEFECTS:'); defects.forEach(d => console.log(' - ' + d)); }
console.log(fail === 0 ? '\nRESULT: PASS' : '\nRESULT: FAIL');
process.exit(fail === 0 ? 0 : 1);
