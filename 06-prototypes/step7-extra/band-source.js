window.__bandSrc = `'use strict';
/*
 * band-engine.js — F7 "The band that follows you".
 *
 * A tempo-following loop engine. It synthesizes ORIGINAL (non-copyrighted) backing
 * stems — kick/snare/hat (drums), a root-fifth bass, and the lesson's chord stabs —
 * and plays them at THE TEMPO THE STUDENT ACTUALLY PRACTICED AT LAST, not a fixed
 * click. Practicing alone is the #1 quit-driver; a patient band is the fix.
 *
 * v1 design (per FEATURES-LOCKED-v1 F7): deterministic, generated stems. Full
 * generative music is a later upgrade. "Tempo-following" here = the loop adopts the
 * student's last measured BPM (from the practice store) and, if no reading exists,
 * the lesson's default tempo_bpm. It stays locked to that BPM for the loop duration
 * so the student always hears the band sitting in their pocket.
 *
 * Design invariants (proven by verify-band.js):
 *   - DETERMINISTIC: same (chordCycle, bpm, beats, feel, seed) -> identical float buffer.
 *   - TEMPO-FOLLOWING: output loop length = beats * (60/bpm) seconds for ANY bpm in
 *     [30,240]; the band never silently snaps to a fixed click. Adversarial bmps
 *     (33, 240) still produce correctly-proportioned loops.
 *   - ORIGINAL AUDIO ONLY: every stem is synthesized with the REUSED Step 2/Step 5
 *     DSP (makeStringTone). No samples, no licensed loops, no AI-sung melody.
 *   - STEM PITCH CORRECT: each synth stem is verified by detectPitchSet / notePitchClass
 *     (the SAME listener math) to actually sound its intended note (e.g. the bass
 *     plays the chord root, not a wrong pitch). This is the audio analogue of the
 *     chord arithmetric gate — we don't eyeball, we measure.
 *   - NO NETWORK (Ban 5): this module makes ZERO network calls. Audio is generated
 *     on-device (proved by selfAudit).
 *   - NO AI DRAWS FINGERS (Ban 1) / NO COPYRIGHT (Ban 4): only synthesized drums +
 *     root-fifth bass + chord stabs derived from the lesson's OWN chord data.
 *
 * Reuse, don't reimplement:
 *   - makeStringTone  (step2/engine/tuner-engine.js) for harmonic-rich synth tones.
 *   - detectPitchSet / notePitchClass (step5/engine/listening-engine.js) to VERIFY
 *     the synthesized stems pitch, reusing the proven listener math.
 *
 * Run its DONE BAR: node verify-band.js
 */

const T = require('../step2/engine/tuner-engine.js');
const L = require('../step5/engine/listening-engine.js');

const SR = 22050;

// --- seeded PRNG (mulberry32) so the generated band is reproducible & testable ---
function makeRng(seed) {
  let a = (seed >>> 0) || 1;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 13), 1 | t)) | 0;
    return ((t ^ (t >>> 30)) >>> 0) / 4294967296;
  };
}

// Standard open-string frequencies (low E..high e), reused for bass/root.
const OPEN = [82.41, 110.00, 146.83, 196.00, 246.94, 329.63];

// Build a single synthesized tone (root + 2 harmonics = guitar-like) at \`freq\`.
function tone(freq, seconds, gain) {
  return T.makeStringTone(freq, SR, seconds, gain == null ? 0.6 : gain);
}

// --- drum synthesis: pure synthesized percussion, original, no samples ---
// kick: pitched sine sweep down. snare: noise burst + body. hat: short high noise.
function kick(t0, dur, buf) {
  const len = Math.floor(SR * dur);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const env = Math.exp(-t * 14);
    const f = 120 * Math.exp(-t * 30) + 45; // pitch drop
    const s = Math.sin(2 * Math.PI * f * t) * env * 0.9;
    const idx = Math.floor((t0 + t) * SR);
    if (idx >= 0 && idx < buf.length) buf[idx] += s;
  }
}
function noiseBurst(t0, dur, buf, hp, rng) {
  const len = Math.floor(SR * dur);
  // Deterministic noise: draw from the SEEDED rng (not Math.random) so the
  // generated band is reproducible & testable (determinism invariant).
  const r = rng || Math.random;
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const env = Math.exp(-t * (hp ? 60 : 18));
    const n = r() * 2 - 1;
    const s = n * env * (hp ? 0.5 : 0.7);
    const idx = Math.floor((t0 + t) * SR);
    if (idx >= 0 && idx < buf.length) buf[idx] += s;
  }
}

// Map a note NAME (e.g. "E", "A", "G") to a frequency: bass octave (E2=82.41) by default.
const NOTE_BASE = { 'C': 65.41, 'C#': 69.30, 'D': 73.42, 'D#': 77.78, 'E': 82.41,
  'F': 87.31, 'F#': 92.50, 'G': 98.00, 'G#': 103.83, 'A': 110.00, 'A#': 116.54, 'B': 123.47 };
function noteToFreq(name, octaveShift) {
  const base = NOTE_BASE[name.replace(/\\d+$/, '')] || 110.00;
  const shift = octaveShift || 0;
  return base * Math.pow(2, shift);
}

// --- public: build a band loop for one chord cycle ---
// opts: { chordCycle:["E7","A7"], chords:{NAME:{frets:[...]}}, bpm, beats (per bar),
//         feel:'straight'|'swing', seed, bars }
// Returns { buffer:Float32Array, sampleRate, durationSec, bpm, beats, feel,
//           nominal: [{beat, stem, note}] (what each audible event should be) }
function buildBand(opts) {
  opts = opts || {};
  const chordCycle = opts.chordCycle && opts.chordCycle.length ? opts.chordCycle.slice()
    : ['C']; // sensible default so the engine always produces sound
  const bpm = (opts.bpm == null) ? clampBpm(opts.lessonDefaultBpm) : clampBpm(opts.bpm);
  const beats = (opts.beats && opts.beats >= 2 && opts.beats <= 12) ? opts.beats : 4;
  const feel = opts.feel === 'swing' ? 'swing' : 'straight';
  const bars = (opts.bars && opts.bars >= 1) ? Math.floor(opts.bars) : chordCycle.length;
  const seed = opts.seed || 1;

  const beatSec = 60 / bpm;
  const barSec = beatSec * beats;
  const totalSec = barSec * bars;
  const buffer = new Float32Array(Math.floor(SR * totalSec));
  const nominal = [];

  const rng = makeRng(seed);

  for (let bar = 0; bar < bars; bar++) {
    const chordName = chordCycle[bar % chordCycle.length];
    const chord = (opts.chords && opts.chords[chordName]) || null;
    const root = chordRootName(chordName); // e.g. "E7" -> "E"
    // Bass one octave down from the chord stabs but still audible/detectable on
    // phone speakers: root at E2=82.41 (noteToFreq shift 0). E1 (41Hz) sits below
    // the detector's F_MIN=55 and is inaudible on small speakers, so we anchor the
    // pocket at E2 — a believable, audible bass register that the listener math can verify.
    const bassFreq = noteToFreq(root, 0);

    // --- DRUMS per beat ---
    for (let b = 0; b < beats; b++) {
      const tBeat = bar * barSec + b * beatSec;
      // kick on beats 1 and 3
      if (b === 0 || b === 2) { kick(tBeat, 0.18, buffer); nominal.push({ beat: b, stem: 'kick', note: 'kick' }); }
      // snare on beats 2 and 4 (backbeat)
      if (b === 1 || b === 3) { noiseBurst(tBeat, 0.14, buffer, false, rng); nominal.push({ beat: b, stem: 'snare', note: 'snare' }); }
      // hats on every 8th; swing offsets the off-beat
      const off = (feel === 'swing') ? beatSec * 0.66 : beatSec * 0.5;
      noiseBurst(tBeat, 0.04, buffer, true, rng);
      noiseBurst(tBeat + off, 0.04, buffer, true, rng);
      nominal.push({ beat: b, stem: 'hat', note: 'hat' });
    }

    // --- BASS: root on beat 1, fifth on beat 3 (root-fifth = the patient pocket) ---
    const fifth = transposeName(root, 7);
    const bass1 = tone(bassFreq, beatSec * 0.9, 0.5);
    addInto(buffer, bass1, bar * barSec);
    const bass2 = tone(noteToFreq(fifth, 0), beatSec * 0.9, 0.5);
    addInto(buffer, bass2, bar * barSec + 2 * beatSec);
    nominal.push({ beat: 0, stem: 'bass', note: root });
    nominal.push({ beat: 2, stem: 'bass', note: fifth });

    // --- CHORD STABS: a short strum of the chord's sounding strings, on beat 1 ---
    if (chord && Array.isArray(chord.frets)) {
      const stabSec = beatSec * 0.8;
      for (let i = 0; i < 6; i++) {
        const fret = chord.frets[i];
        if (fret === null || fret === undefined) continue;
        const f = OPEN[i] * Math.pow(2, fret / 12);
        const stab = tone(f, stabSec, 0.22);
        addInto(buffer, stab, bar * barSec + rng() * 0.01);
      }
      nominal.push({ beat: 0, stem: 'chord', note: chordName });
    }
  }

  // soft clip to avoid denormal/overflow
  for (let i = 0; i < buffer.length; i++) {
    if (buffer[i] > 1) buffer[i] = 1; else if (buffer[i] < -1) buffer[i] = -1;
  }
  return { buffer, sampleRate: SR, durationSec: totalSec, bpm, beats, feel, bars, nominal };
}

function addInto(dest, src, t0) {
  const off = Math.floor(t0 * SR);
  for (let i = 0; i < src.length; i++) {
    const idx = off + i;
    if (idx >= 0 && idx < dest.length) dest[idx] += src[i];
  }
}

function clampBpm(bpm) {
  // Explicit "no reading" (null/undefined) -> neutral default, NOT the 30 clamp floor.
  if (bpm == null) return 80;
  const n = Number(bpm);
  if (!isFinite(n)) return 80;          // lesson-default fallback
  if (n < 30) return 30;                // adversarial clamp (never a fixed click)
  if (n > 240) return 240;
  return Math.round(n);
}

// "E7" -> "E", "Am" -> "A", "B7" -> "B", "C" -> "C"
function chordRootName(name) {
  if (!name) return 'C';
  return name.replace(/m$/, '').replace(/[0-9].*$/, '').replace(/^([A-G]#?).*$/, '$1');
}
// transpose a note name up \`semi\` semitones within one octave (wraps)
function transposeName(name, semi) {
  const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  let idx = keys.indexOf(name.replace(/\\d+$/, ''));
  if (idx < 0) idx = 0;
  return keys[(idx + semi) % 12];
}

// --- verify a synth stem sounds its intended note (reuse listener math) ---
// The full band loop is long, so we verify a SHORT WINDOW (windowSec) starting at
// t0 instead of the whole buffer (the standard step5 measurement pattern). This
// keeps the DFT fast (window ~0.3s) and lets us probe a specific stem's slot.
// NOTE: notesMatch expects the EXPECTED note to carry a .freq (the listening engine
// always attaches it via Object.assign(noteFromFreq(f),{freq:f})). We build the
// expected note the same way so the cents check is well-defined.
function verifyStemPitch(buffer, expectedFreq, opts) {
  opts = opts || {};
  const t0 = opts.t0 || 0;
  const wSec = opts.windowSec || 0.3;
  const tol = opts.presentTol || 25;
  const off = Math.floor(t0 * SR);
  const len = Math.min(Math.floor(wSec * SR), buffer.length - off);
  if (len <= 0) return { ok: false, heard: [], expected: T.noteFromFreq(expectedFreq).name, rms: 0 };
  const win = buffer.subarray(off, off + len);
  const det = L.detectPitchSet(win, SR);
  const heard = det.heard.map(h => h.note.name);
  const expected = Object.assign(T.noteFromFreq(expectedFreq), { freq: expectedFreq });
  const ok = det.heard.some(h => L.notesMatch(h, expected, tol));
  return { ok, heard, expected: expected.name, rms: det.rms };
}

// --- Ban 5 self-audit: no network calls in this module ---
function selfAudit() {
  const src = require('fs').readFileSync(__filename, 'utf8');
  const banned = /fetch\\s*\\(|new\\s+XMLHttpRequest|new\\s+WebSocket|http\\s*\\.\\s*request|axios\\s*\\(/;
  return { noNetwork: !banned.test(src), note: 'all audio synthesized on-device; no network' };
}

// Determinism helper for tests: hash a buffer to a stable string.
function bufferHash(buf) {
  let h = 2166136261 >>> 0;
  const step = Math.max(1, Math.floor(buf.length / 4000)); // sample for speed
  for (let i = 0; i < buf.length; i += step) {
    const v = Math.round(buf[i] * 100000) & 0xff;
    h ^= v; h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}

module.exports = {
  buildBand, verifyStemPitch, selfAudit, bufferHash, clampBpm,
  chordRootName, transposeName, noteToFreq, makeRng, SR
};
`;
