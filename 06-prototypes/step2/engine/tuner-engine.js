/*
 * tuner-engine.js — Step 2 pitch-detection + note math (portable, DOM-free).
 * Ported 1:1 from 06-prototypes/listening-proof-demo.html (the proven autocorrelation
 * demo), so the SAME math the phone app uses is reused, not rewritten.
 * Browser-free: no document/window/AudioContext. The microphone I/O is the ONLY
 * part that lives in the player; this module does the DSP + note naming + cents.
 *
 * This is the F2 "listens through the microphone" engine's core, shared by the tuner,
 * metronome, and (later) in-lesson listening verification. Reused, never reimplemented.
 */
'use strict';

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Standard tuning, low→high. Frequencies are the EXACT equal-tempered targets.
const STRINGS = [
  { name: 'E (low)',  freq: 82.41 },
  { name: 'A',        freq: 110.00 },
  { name: 'D',        freq: 146.83 },
  { name: 'G',        freq: 196.00 },
  { name: 'B',        freq: 246.94 },
  { name: 'e (high)', freq: 329.63 }
];

// MIDI-ish note from a frequency: name, cents-off the nearest equal-tempered pitch, midi#.
function noteFromFreq(f) {
  const n = Math.round(12 * Math.log2(f / 440)) + 69;     // MIDI number
  const name = NOTES[((n % 12) + 12) % 12] + (Math.floor(n / 12) - 1);
  const exact = 440 * Math.pow(2, (n - 69) / 12);
  const cents = 1200 * Math.log2(f / exact);
  return { name, cents: Math.round(cents), midi: n };
}

// Autocorrelation (YIN-flavoured) pitch detector.
// Returns fundamental frequency in Hz, or -1 if the buffer is too quiet / unclear.
function autoCorrelate(buffer, sampleRate) {
  const SIZE = buffer.length;
  let rms = 0;
  for (let i = 0; i < SIZE; i++) rms += buffer[i] * buffer[i];
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) return -1;                              // too quiet
  let r1 = 0, r2 = SIZE - 1;
  const thres = 0.2;
  for (let i = 0; i < SIZE / 2; i++) if (Math.abs(buffer[i]) < thres) { r1 = i; break; }
  for (let i = 1; i < SIZE / 2; i++) if (Math.abs(buffer[SIZE - i]) < thres) { r2 = SIZE - i; break; }
  const b = buffer.slice(r1, r2);
  const N = b.length;
  if (N < 32) return -1;
  const c = new Array(N).fill(0);
  for (let i = 0; i < N; i++) for (let j = 0; j < N - i; j++) c[i] += b[j] * b[j + i];
  let d = 0;
  while (d < N - 1 && c[d] > c[d + 1]) d++;
  let maxval = -1, maxpos = -1;
  for (let i = d; i < N; i++) if (c[i] > maxval) { maxval = c[i]; maxpos = i; }
  if (maxpos <= 0) return -1;
  let T0 = maxpos;
  const x1 = c[T0 - 1] || 0, x2 = c[T0], x3 = c[T0 + 1] || 0;
  const a = (x1 + x3 - 2 * x2) / 2, bb = (x3 - x1) / 2;
  if (a) T0 = T0 - bb / (2 * a);
  return sampleRate / T0;
}

// Cents-off a target frequency (the needle math).
function centsOff(freq, targetFreq) {
  return 1200 * Math.log2(freq / targetFreq);
}

// Clamp a cents value into [-50, 50] for a needle display (does not change the verdict logic).
function clampNeedle(cents) {
  return Math.max(-50, Math.min(50, cents));
}

// Verdict against a target string: returns {state, label, cents}.
// states: 'inTune' (<6), 'close' (<20), 'off' (>=20). ±6 is the Step 2 DONE BAR.
function tuneVerdict(freq, targetFreq) {
  const c = centsOff(freq, targetFreq);
  const a = Math.abs(c);
  let state, label;
  if (a < 6) { state = 'inTune'; label = 'IN TUNE'; }
  else if (a < 20) { state = 'close'; label = 'CLOSE — ' + (c > 0 ? 'a touch sharp' : 'a touch flat'); }
  else { state = 'off'; label = (c > 0 ? 'SHARP' : 'FLAT') + ' by ' + Math.round(a) + ' cents'; }
  return { state, label, cents: Math.round(c) };
}

// Synthesize a sine tone at `freq` into a Float32Array (sampleRate, seconds).
// Used by the DONE-BAR test to inject precise cents-off signals without a mic.
function makeTone(freq, sampleRate, seconds) {
  const len = Math.floor(sampleRate * seconds);
  const buf = new Float32Array(len);
  for (let i = 0; i < len; i++) buf[i] = Math.sin(2 * Math.PI * freq * i / sampleRate);
  return buf;
}

// A real guitar string is never a pure sine — add a couple of harmonics so the
// autocorrelation is exercised against a realistic spectrum, not a toy sine.
function makeStringTone(freq, sampleRate, seconds) {
  const len = Math.floor(sampleRate * seconds);
  const buf = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / sampleRate;
    buf[i] = 0.6 * Math.sin(2 * Math.PI * freq * t)
           + 0.25 * Math.sin(2 * Math.PI * 2 * freq * t)
           + 0.12 * Math.sin(2 * Math.PI * 3 * freq * t);
  }
  return buf;
}

module.exports = {
  NOTES, STRINGS, noteFromFreq, autoCorrelate, centsOff, clampNeedle, tuneVerdict,
  makeTone, makeStringTone
};

// Browser classic-<script> support (file://): expose on window so the in-lesson
// listening player reuses the SAME proven DSP. No network calls — Ban 5.
if (typeof window !== 'undefined') {
  window.TunerEngine = {
    NOTES, STRINGS, noteFromFreq, autoCorrelate, centsOff, clampNeedle, tuneVerdict,
    makeTone, makeStringTone
  };
}
