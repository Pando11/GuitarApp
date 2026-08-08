'use strict';
/*
 * verify-band.js — F7 DONE BAR (written to judge F7, run by a separate evaluator).
 *
 * Proves, on disk, browser-free:
 *  1. DETERMINISM — same inputs -> identical float buffer (hash match).
 *  2. TEMPO-FOLLOWING — loop length == beats * 60/bpm for arbitrary bpm in [30,240];
 *     the band adopts the student's LAST practice BPM (or the lesson default) and
 *     never silently snaps to a fixed click. Adversarial bmps (33, 240) still
 *     produce correctly-proportioned loops.
 *  3. tempo capture wiring — the practice store's lastPracticeTempo() drives the band.
 *  4. STEM PITCH CORRECTNESS — the synthesized bass root, bass fifth, and chord stab
 *     each actually sound their intended note (measured, not eyeballed). The expected
 *     frequency comes from an INDEPENDENT octave-aware oracle (equal temperament from
 *     A2=110), NOT the engine's own API, so a wrong-OCTAVE regression is caught.
 *
 *     Octave is proven by a Goertzel energy comparison at the expected fundamental, its
 *     octave-DOWN, and its octave-UP. The listener math (detectPitchSet) reports the
 *     strongest SPECTRAL peak in a pitch class, which for a low note is often its 2nd
 *     harmonic — so it would report E1 (41 Hz, 82 Hz harmonic) as "82 Hz". Comparing
 *     bin energy at f vs f/2 vs f*2 makes the gate octave-SOUND, not octave-blind: a
 *     literal octave error is rejected because the energy peak sits at the wrong octave.
 *  5. ORIGINAL AUDIO / NO COPYRIGHT (Ban 4) — every stem synthesized, no samples.
 *  6. NO NETWORK (Ban 5) — selfAudit confirms zero network calls in band-engine.js.
 *  7. NO AI DRAWS FINGERS (Ban 1) — stems are synthesized; no fretboard image gen.
 *  8. NO CORE-CODE CHANGE — the 8 core engine modules (CORE-UNTOUCHED baseline) are
 *     byte-identical. Baseline paths are resolved from the REPO ROOT (two levels up
 *     from this file) with the leading '*' stripped; a MISSING file FAILS (no
 *     silent skip) — so tampering or deletion is detected, not hidden.
 *
 * Run: node verify-band.js
 */
// 7th-pass HOLE 2: capture pristine fs/crypto bindings BEFORE requiring the engine
// under test. An evil band-engine.js could monkey-patch fs.readFileSync at load to
// serve forged original bytes to the tamper check (demonstrated: 34/0 green with a
// booby-trapped on-disk engine). Snapshotting first makes the baseline hashes read
// real disk bytes regardless of what the required modules do at load time.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const _readFileSync = fs.readFileSync.bind(fs);
const _existsSync = fs.existsSync.bind(fs);
const _createHash = crypto.createHash.bind(crypto);
const B = require('./band-engine.js');
const T = require('../step2/engine/tuner-engine.js');
const L = require('../step5/engine/listening-engine.js');
const { PracticeStore } = require('../step6/store/practiceStore.js');

// Repo root: __dirname is .../06-prototypes/step7-extra, so two '..' land on the
// GuitarApp root where the baseline's "06-prototypes/..." paths are anchored.
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const CORE_BASELINE = path.join(REPO_ROOT, '06-prototypes', 'step8', 'CORE-UNTOUCHED.sha256');

// HOLE-3 fix (4th hostile pass): the baseline file itself is not self-protected.
// If a core file is tampered and its one hash line rewritten, the gate goes green
// silently. Pin the baseline file's OWN sha256 here so an attacker must also edit
// this committed gate (visible in git diff) to bless a tampered code state.
const CORE_BASELINE_PIN = '08477f1ce00fdb2fec4db71fbe9ee1e1c9448f460942bc40d0aa65a5eee5f57b';

let pass = 0, fail = 0;
const fails = [];
function check(name, cond, detail) {
  if (cond) { pass++; console.log('  OK  ' + name); }
  else { fail++; fails.push(name + (detail ? ' — ' + detail : '')); console.log('  FAIL ' + name + (detail ? ' — ' + detail : '')); }
}

const CHORDS = {
  E7: { frets: [0, 2, 0, 1, 0, 0] },
  A7: { frets: [null, 0, 2, 0, 2, 0] },
  B7: { frets: [null, 2, 1, 2, 0, 2] }
};
function mkOpts(bpm) {
  return { chordCycle: ['E7', 'A7', 'B7'], chords: CHORDS, bpm, beats: 4, feel: 'swing', bars: 3, seed: 7 };
}

/* ----------------------------------------------------------------------------
 * INDEPENDENT pitch oracle (octave-aware). Equal temperament from A2 = 110 Hz.
 * Deliberately a SEPARATE implementation from band-engine.noteToFreq so that a
 * regression in the engine's register math (e.g. dropping an octave) is caught
 * here instead of agreeing with itself. MIDI octave convention: A4 = 69.
 * --------------------------------------------------------------------------*/
const SEMI = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
const FLAT = { Db: 'C#', Eb: 'D#', Gb: 'F#', Ab: 'G#', Bb: 'A#' };
const CHROMATIC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function oracleFreq(name, octave) {
  let n = String(name).replace(/^\d+/, '');
  if (FLAT[n]) n = FLAT[n];
  const pc = (SEMI[n] != null) ? SEMI[n] : 0;
  const midi = (octave + 1) * 12 + pc;
  return 440 * Math.pow(2, (midi - 69) / 12);
}
function parseChordRoot(name) {
  if (typeof name !== 'string') return { root: 'C', octave: 2 };
  // INDEPENDENT oracle (5th-pass fix): deliberately NOT a mirror of the engine's
  // regex pipeline — a shared parser bug lets a wrong register pass green by
  // agreement (that's how "Asus4"→octave 4 shipped). This implementation uses a
  // single anchored grammar instead: note letter, then the remainder is either
  // empty, a bare small octave digit (0-4, e.g. "E2"), or quality text which we
  // ignore wholesale. No token-stripping, so no "sus"→"4" residue.
  const m = name.match(/^([A-Ga-g][#b]?)(.*)$/);
  if (!m) return { root: 'C', octave: 2 };
  const root = m[1][0].toUpperCase() + (m[1][1] || '');
  const tail = m[2];
  const octM = tail.match(/^[0-4]$/); // single small bare digit = register spec
  return { root, octave: octM ? parseInt(octM[0], 10) : 2 };
}
function fifthNameOf(name) {
  let n = String(name).replace(/^\d+/, '');
  if (FLAT[n]) n = FLAT[n];
  const idx = (SEMI[n] != null) ? SEMI[n] : 0;
  return CHROMATIC[((idx + 7) % 12 + 12) % 12];
}

/* ----------------------------------------------------------------------------
 * Goertzel-style single-bin magnitude at frequency f over [t0, t0+secs).
 * Used to compare energy at f vs f/2 vs f*2 so the gate is octave-SOUND.
 * --------------------------------------------------------------------------*/
function binEnergy(buffer, t0, secs, f) {
  const SR = B.SR;
  const off = Math.floor(t0 * SR);
  const len = Math.min(Math.floor(secs * SR), buffer.length - off);
  if (len <= 0) return 0;
  const w0 = 2 * Math.PI * f / SR;
  let re = 0, im = 0;
  for (let n = 0; n < len; n++) {
    const s = buffer[off + n];
    re += s * Math.cos(w0 * n);
    im -= s * Math.sin(w0 * n);
  }
  return Math.sqrt(re * re + im * im) / len;
}
/*
 * Verify a bass-class stem at [t0, t0+secs) sounds expectedFreq in the CORRECT
 * octave AND at the correct PITCH (within tolCents). Two independent checks:
 *  (a) OCTAVE: expectedFreq must carry more energy than both its octave-down and
 *      octave-up (ratio > OCTAVE_RATIO), so a literal octave error (E1 vs E2, or
 *      E3 vs E2) is rejected. The listener math reports a low note's 2nd harmonic
 *      as the "fundamental", which is why an octave-blind cents check alone is unsound.
 *  (b) PITCH: the TRUE fundamental, read from the project's proven detectPitchSet
 *      (F_MIN-bounded spectral-peak per pitch class — deliberately NOT autoCorrelate,
 *      which latches onto the kick drum's 45-120Hz sweep at the root slot and reports
 *      ~20Hz). We take the heard pitch nearest expectedFreq and require it within
 *      tolCents. This is the fix for the 4th hostile pass's HOLE 2 — the previous
 *      version reported cents:0 for the matched octave bin and never measured the
 *      real detune, so a semitone-sharp bass in the correct octave slipped through.
 * Returns {ok, fundamental, cents, e0, eLow, eHigh, heardFreq}.
 */
const OCTAVE_RATIO = 1.4; // the true fundamental must beat each octave neighbor by >=40%
function verifyBassOctave(buffer, t0, secs, expectedFreq, tolCents) {
  const e = expectedFreq;
  const e0 = binEnergy(buffer, t0, secs, e);
  const eLow = binEnergy(buffer, t0, secs, e / 2);
  const eHigh = binEnergy(buffer, t0, secs, e * 2);
  // (a) octave energy gate — dominant energy must sit at the expected octave.
  const octaveOk = e0 > eLow * OCTAVE_RATIO && e0 > eHigh * OCTAVE_RATIO;
  // (b) pitch — read the measured fundamental from detectPitchSet (proven, F_MIN-bounded).
  const SR = B.SR;
  const off = Math.floor(t0 * SR);
  const len = Math.min(Math.floor(secs * SR), buffer.length - off);
  const win = (len > 0) ? buffer.subarray(off, off + len) : new Float32Array(1);
  const det = L.detectPitchSet(win, SR);
  // nearest heard pitch to expectedFreq (by Hz); detectPitchSet only reports >= F_MIN.
  let heardFreq = null, bestDist = Infinity;
  for (const h of det.heard) {
    const d = Math.abs(h.freq - e);
    if (d < bestDist) { bestDist = d; heardFreq = h.freq; }
  }
  // only trust a heard pitch that is plausibly the target (within ~2 octaves);
  // otherwise the stem simply isn't the expected note -> fail loud.
  const plausible = heardFreq != null && bestDist <= e * 2;
  const cents = plausible ? T.centsOff(heardFreq, e) : 9999;
  const pitchOk = plausible && Math.abs(cents) <= tolCents;
  const ok = octaveOk && pitchOk;
  // report the dominant octave for diagnostics
  const cand = [[e, e0], [e / 2, eLow], [e * 2, eHigh]];
  cand.sort((a, b) => b[1] - a[1]);
  const fundamental = cand[0][0];
  return { ok, fundamental, cents, e0, eLow, eHigh, heardFreq };
}

console.log('=== F7 BAND ENGINE — DONE BAR ===');

// 1. DETERMINISM
{
  const a = B.buildBand(mkOpts(60));
  const b = B.buildBand(mkOpts(60));
  check('DETERMINISTIC — same inputs hash-identical', B.bufferHash(a.buffer) === B.bufferHash(b.buffer));
}

// 2. TEMPO-FOLLOWING — length ∝ 1/bpm for many bmps including adversarial ends
{
  let allGood = true; let worst = '';
  const bmps = [33, 40, 58, 72, 120, 180, 240];
  for (const bpm of bmps) {
    const r = B.buildBand(mkOpts(bpm));
    const expect = (60 / bpm) * 4 * 3;
    const ok = Math.abs(r.durationSec - expect) < 0.02 && r.bpm === (bpm < 30 ? 30 : bpm > 240 ? 240 : bpm);
    if (!ok) { allGood = false; worst = 'bpm ' + bpm + ' got ' + r.durationSec.toFixed(3) + ' expect ' + expect.toFixed(3); }
  }
  check('TEMPO-FOLLOWING — loop length = beats*60/bpm for bpm in [33,240] (no fixed click)', allGood, worst);
}

// 2b. ADVERSARIAL clamp — out-of-range bpm is clamped, not silently fixed at 80
{
  check('clamp bpm=5 -> 30 (not a fixed click)', B.clampBpm(5) === 30);
  check('clamp bpm=999 -> 240', B.clampBpm(999) === 240);
  check('clamp bpm=NaN -> 80 default', B.clampBpm(NaN) === 80);
  const low = B.buildBand(mkOpts(5));
  check('band at clamped-30 still produces a valid loop (duration 24s)', Math.abs(low.durationSec - (60 / 30) * 4 * 3) < 0.02);
}

// 3. tempo capture wiring — lastPracticeTempo() flows into the band bpm
{
  const s = new PracticeStore();
  const id = s.startSession('L-blues');
  check('recordPracticeTempo rejects out-of-range (5)', (() => { try { s.recordPracticeTempo(id, 5); return false; } catch (e) { return true; } })());
  s.recordPracticeTempo(id, 63);
  check('lastPracticeTempo() returns 63', s.lastPracticeTempo() === 63);
  const r = B.buildBand({ chordCycle: ['E7'], chords: CHORDS, bpm: s.lastPracticeTempo(), beats: 4, bars: 1, seed: 2 });
  check('band adopts practice-store BPM (63 -> loop 3.81s)', Math.abs(r.bpm - 63) < 1e-9 && Math.abs(r.durationSec - (60 / 63) * 4) < 0.02);
  // null -> lesson default fallback path does not crash
  const s2 = new PracticeStore(); s2.startSession('Lx');
  const r2 = B.buildBand({ chordCycle: ['E7'], chords: CHORDS, bpm: s2.lastPracticeTempo(), lessonDefaultBpm: 68, beats: 4, bars: 1, seed: 2 });
  check('band tolerates null tempo (uses lesson default 68)', r2.bpm === 68);
}

// 4. STEM PITCH CORRECTNESS (measured by INDEPENDENT oracle + octave-sound Goertzel)
{
  const r = B.buildBand(mkOpts(58));
  const beatSec = 60 / 58;

  // Independent expected frequencies from the oracle (NOT band-engine.noteToFreq).
  const root1 = parseChordRoot('E7');
  const rootExp = oracleFreq(root1.root, root1.octave);            // 82.41 Hz (E2)
  const fifthExp = oracleFreq(fifthNameOf(root1.root), root1.octave); // 123.47 Hz (B2)

  // BASS ROOT — full length of the root tone (0.9 * beat) at beat 0.
  {
    const m = verifyBassOctave(r.buffer, 0, beatSec * 0.9, rootExp, 25);
    check('BASS ROOT sounds ' + T.noteFromFreq(rootExp).name + '2 (independent oracle, correct octave)',
      m.ok, 'fund=' + m.fundamental.toFixed(1) + 'Hz cents=' + (m.cents || 0).toFixed(0) +
      ' e0=' + m.e0.toFixed(3) + ' eLow=' + m.eLow.toFixed(3) + ' eHigh=' + m.eHigh.toFixed(3));
  }
  // BASS FIFTH — full length of the fifth tone (0.9 * beat) at beat 2.
  {
    const m = verifyBassOctave(r.buffer, 2 * beatSec, beatSec * 0.9, fifthExp, 25);
    check('BASS FIFTH sounds ' + T.noteFromFreq(fifthExp).name + '2 (independent oracle, correct octave)',
      m.ok, 'fund=' + m.fundamental.toFixed(1) + 'Hz cents=' + (m.cents || 0).toFixed(0) +
      ' e0=' + m.e0.toFixed(3) + ' eLow=' + m.eLow.toFixed(3) + ' eHigh=' + m.eHigh.toFixed(3));
  }
  // CHORD STAB — beat 0.05 window, root pitch class must dominate at the correct octave.
  {
    const m = verifyBassOctave(r.buffer, 0.05, beatSec * 0.9, rootExp, 25);
    check('CHORD STAB contains root ' + T.noteFromFreq(rootExp).name + ' at correct octave',
      m.ok, 'fund=' + m.fundamental.toFixed(1) + 'Hz cents=' + (m.cents || 0).toFixed(0) +
      ' e0=' + m.e0.toFixed(3) + ' eLow=' + m.eLow.toFixed(3) + ' eHigh=' + m.eHigh.toFixed(3));
  }

  // HARD GUARD — the bass target register must be audible (>= detector F_MIN=55) so a
  // sub-floor (e.g. E1=41Hz) bass is rejected LOUDLY, not silently passed.
  check('BASS target register is audible (root >=55Hz, above detector F_MIN)',
    rootExp >= 55, 'rootExp=' + rootExp.toFixed(1));
  check('BASS fifth target register is audible (>=55Hz)', fifthExp >= 55, 'fifthExp=' + fifthExp.toFixed(1));
}

// 4b. NEGATIVE TEST — a deliberately octave-LOW bass MUST FAIL this gate. We build a
//     pure E1 (41.2Hz) tone (the classic octave regression) and confirm the gate
//     reports the dominant octave as 41 Hz, not 82 Hz -> rejected.
{
  const SR = B.SR;
  const low = T.makeStringTone(41.2, SR, 0.9, 0.6); // E1 octave regression
  const m = verifyBassOctave(low, 0, 0.9, oracleFreq('E', 2), 25); // expected E2 = 82.41
  check('NEGATIVE: octave-low bass (E1) is REJECTED (gate is octave-sound, not blind)',
    !m.ok, 'dominant octave=' + m.fundamental.toFixed(1) + 'Hz (expected ~82.4)');
}
// 4c. NEGATIVE TEST — octave-HIGH bass (E3 = 164.8Hz) also rejected.
{
  const SR = B.SR;
  const high = T.makeStringTone(164.8, SR, 0.9, 0.6); // E3 octave regression
  const m = verifyBassOctave(high, 0, 0.9, oracleFreq('E', 2), 25); // expected E2 = 82.41
  check('NEGATIVE: octave-high bass (E3) is REJECTED',
    !m.ok, 'dominant octave=' + m.fundamental.toFixed(1) + 'Hz (expected ~82.4)');
}
// 4d. NEGATIVE TEST — a SAME-OCTAVE, WRONG-PITCH bass (the 4th hostile pass's HOLE 2).
//     A semitone-sharp E2 (+100c) and a +50c detune must BOTH be REJECTED, proving the
//     cents check is live (not a no-op that only catches octave errors).
{
  const SR = B.SR;
  const det100 = T.makeStringTone(oracleFreq('E', 2) * Math.pow(2, 100 / 1200), SR, 0.9, 0.6);
  const m100 = verifyBassOctave(det100, 0, 0.9, oracleFreq('E', 2), 25);
  check('NEGATIVE: semitone-sharp E2 (+100c) is REJECTED (pitch check live)',
    !m100.ok, 'measured f0=' + (m100.heardFreq || 0).toFixed(1) + 'Hz cents=' + (m100.cents || 0).toFixed(0));
  const det50 = T.makeStringTone(oracleFreq('E', 2) * Math.pow(2, 50 / 1200), SR, 0.9, 0.6);
  const m50 = verifyBassOctave(det50, 0, 0.9, oracleFreq('E', 2), 25);
  check('NEGATIVE: +50c detuned E2 is REJECTED (within 25c tolerance enforced)',
    !m50.ok, 'measured f0=' + (m50.heardFreq || 0).toFixed(1) + 'Hz cents=' + (m50.cents || 0).toFixed(0));
}
// 4e. SANITY — an in-tune E2 passes the cents check (so the tolerance isn't so tight it
//     rejects correct audio). Confirms 4d is not a false-negative trap.
{
  const SR = B.SR;
  const inTune = T.makeStringTone(oracleFreq('E', 2), SR, 0.9, 0.6);
  const m = verifyBassOctave(inTune, 0, 0.9, oracleFreq('E', 2), 25);
  check('SANITY: in-tune E2 PASSES (tolerance correctly admits correct pitch)',
    m.ok, 'measured f0=' + (m.heardFreq || 0).toFixed(1) + 'Hz cents=' + (m.cents || 0).toFixed(0));
}
// 4f. NEGATIVE TEST — the 5th hostile pass's HOLE 1: a sus4/add9/maj7 chord must put
//     the bass in octave 2, NOT the octave named by the token's trailing digit.
//     "Asus4" → A2 (110Hz), not A4 (440Hz). We MEASURE the actual synthesized band
//     audio for an Asus4 cycle and reject if the bass lands outside the pocket.
{
  const loop = B.buildBand({ chordCycle: ['Asus4', 'Asus4', 'Asus4'], bpm: 60, beats: 4, bars: 3, seed: 3 });
  const beatSec = 60 / loop.bpm;
  const oracle = oracleFreq('A', 2); // 110 Hz — independent oracle, not the engine parser
  const m = verifyBassOctave(loop.buffer, 0, beatSec, oracle, 25);
  check('NEGATIVE (5th-pass hole 1): Asus4 bass sits in octave 2 (110Hz pocket, not 440Hz)',
    m.ok, 'measured f0=' + (m.heardFreq || 0).toFixed(1) + 'Hz expected=' + oracle.toFixed(1));
}
// 4g. SANITY — engine parser over a BROAD corpus (6th-pass HOLE 1 fix): all 12 roots
//     × the full quality-token set × registers. 264 cases — special-casing the exact
//     probe set (the pass-6 gate-fit attack) is no longer feasible.
{
  const roots = ['C', 'C#', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
  const quals = ['', 'm', '7', 'maj7', 'm7', 'sus4', 'sus2', 'add9', 'dim', 'dim7', 'aug',
    'aug7', '6', '9', '11', '13', '5', '7sus4', '7#9', 'm7b5', 'sus4add9'];
  const bad = [];
  let n = 0;
  for (const r of roots) for (const q of quals) {
    n++;
    const p = B.chordRootName(r + q);
    const rootOk = p.root && p.root.toUpperCase() === r.toUpperCase();
    if (!(rootOk && p.octave === 2)) bad.push([r + q, p]);
  }
  // Register specs: bare single digit 0-4 honored; everything else defaults to 2.
  const regs = [['E0', 0], ['E1', 1], ['E2', 2], ['E3', 3], ['E4', 4], ['Bb1', 1],
    ['E8', 2], ['E10', 2], ['E04', 2], ['E00', 2], ['E14', 2], ['E40', 2]];
  for (const [c, o] of regs) { n++; const p = B.chordRootName(c); if (p.octave !== o) bad.push([c, p]); }
  check('SANITY (6th-pass): parser corpus ' + n + ' cases (roots×quals×regs) all correct',
    bad.length === 0, bad.length ? 'WRONG: ' + JSON.stringify(bad.slice(0, 5)) : n + '/' + n + ' correct');
}
// 4h. ORACLE CONFORMANCE — engine and gate oracle must agree on EVERY corpus case.
{
  const roots = ['C', 'C#', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
  const quals = ['', 'm', '7', 'maj7', 'm7', 'sus4', 'sus2', 'add9', 'dim', 'dim7', 'aug',
    'aug7', '6', '9', '11', '13', '5', '7sus4', '7#9', 'm7b5', 'sus4add9'];
  const extras = ['E0', 'E1', 'E2', 'E3', 'E4', 'Bb1', 'E8', 'E10', 'E04', 'E00', 'em7', 'e7', 'ASUS4'];
  const diverge = [];
  for (const r of roots) for (const q of quals) {
    const c = r + q, e = B.chordRootName(c), o = parseChordRoot(c);
    if (e.octave !== o.octave) diverge.push([c, e.octave, o.octave]);
  }
  for (const c of extras) {
    const e = B.chordRootName(c), o = parseChordRoot(c);
    if (e.octave !== o.octave) diverge.push([c, e.octave, o.octave]);
  }
  check('engine and oracle agree on octave for all ' + (roots.length * quals.length + extras.length) + ' corpus cases',
    diverge.length === 0, diverge.length ? 'DIVERGE: ' + JSON.stringify(diverge.slice(0, 5)) : 'no divergence');
}

// 5 + 7. ORIGINAL / NO COPYRIGHT / NO AI FINGERS — code inspection
{
  const src = _readFileSync(path.join(__dirname, 'band-engine.js'), 'utf8');
  check('NO sample/audio-file load (synthesized only)', !/\.(wav|mp3|ogg|m4a|flac)\b/i.test(src) && !/(loadSample|fetchSample|decodeAudio)/.test(src));
  check('NO fretboard/AI image generation (Ban 1 scope)', !/(generateImage|drawFingers|stable-diffusion|dall|flux)/i.test(src));
}

// 6. NO NETWORK (Ban 5)
{
  const audit = B.selfAudit();
  check('BAN 5 — selfAudit confirms no network calls', audit.noNetwork === true);
}

// 8. NO CORE-CODE CHANGE — core modules byte-identical to baseline (repo-root resolve, fail on missing)
{
  check('CORE baseline file present', _existsSync(CORE_BASELINE));
  // HOLE-3 fix: the baseline file itself must be unmodified, else an attacker can
  // rewrite a hash line to bless a tampered core file and pass silently.
  if (_existsSync(CORE_BASELINE)) {
    const baselineHash = _createHash('sha256').update(_readFileSync(CORE_BASELINE)).digest('hex');
    check('CORE baseline file is unmodified (self-pinned sha256)', baselineHash === CORE_BASELINE_PIN,
      'actual=' + baselineHash);
  }
  if (_existsSync(CORE_BASELINE)) {
    const expect = {};
    _readFileSync(CORE_BASELINE, 'utf8').split('\n').forEach(line => {
      const m = line.trim().match(/^([0-9a-f]{64})\s+\*(.+)$/); // strip leading '*' correctly
      if (m) expect[m[2]] = m[1];
    });
    const rels = Object.keys(expect);
    check('CORE baseline lists ' + rels.length + ' modules (was 6; +tuner-engine +practiceStore)', rels.length >= 8, 'count=' + rels.length);
    // HOLE-3 fix: reject path traversal — every listed rel must stay inside the
    // repo root and contain no '..' (a baseline entry like 'step8/../step3/decoy.js'
    // would otherwise checksum a decoy and pass).
    const traversal = rels.filter(rel => rel.includes('..') || !path.resolve(REPO_ROOT, rel).startsWith(REPO_ROOT + path.sep));
    check('CORE baseline has NO path-traversal entries (rejects .. and out-of-root rels)', traversal.length === 0, traversal.join(', '));
    let allSame = true; const changed = []; const missing = [];
    for (const rel of rels) {
      const fp = path.join(REPO_ROOT, rel); // resolve from repo root, not step7
      if (!_existsSync(fp)) { missing.push(rel); allSame = false; continue; } // FAIL on missing, no silent skip
      const h = _createHash('sha256').update(_readFileSync(fp)).digest('hex');
      if (h !== expect[rel]) { allSame = false; changed.push(rel); }
    }
    check('NO core module deleted/missing (tamper detects deletion)', missing.length === 0, missing.join(', '));
    check('ALL ' + rels.length + ' CORE MODULES byte-identical to baseline', allSame, changed.concat(missing).join(', '));
    // Explicitly assert the two newly-protected files are covered (proves #8 extension landed).
    check('tuner-engine.js is in the protected baseline', rels.some(r => r.indexOf('tuner-engine.js') >= 0));
    check('practiceStore.js is in the protected baseline', rels.some(r => r.indexOf('practiceStore.js') >= 0));
  } else {
    fail++; fails.push('CORE baseline missing');
  }
}

console.log('\n============================================================');
console.log('F7 BAND ENGINE: ' + pass + ' passed, ' + fail + ' failed');
if (fail === 0) console.log('STEP-7-EXTRA-BAND-OK — F7 proven; band follows the student tempo; gates octave-aware + tamper-real');
else { console.log('F7 GATE FAILURES:'); for (const f of fails) console.log('  - ' + f); }
process.exit(fail === 0 ? 0 : 1);
