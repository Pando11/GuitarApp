// tuner-engine.js — F2 pitch-detection + note math.
// PORTED 1:1 from 06-prototypes/step2/engine/tuner-engine.js (proven autocorrelation).
// Algorithm is byte-identical; only the CommonJS wrapper was removed (ESM export).
// Browser-free: no document/window/AudioContext. Mic I/O lives in the player.

export const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Standard tuning, low→high. Frequencies are the EXACT equal-tempered targets.
export const STRINGS = [
  { name: 'E (low)',  freq: 82.41 },
  { name: 'A',        freq: 110.00 },
  { name: 'D',        freq: 146.83 },
  { name: 'G',        freq: 196.00 },
  { name: 'B',        freq: 246.94 },
  { name: 'e (high)', freq: 329.63 }
];

export function noteFromFreq(f) {
  const n = Math.round(12 * Math.log2(f / 440)) + 69;
  const name = NOTES[((n % 12) + 12) % 12] + (Math.floor(n / 12) - 1);
  const exact = 440 * Math.pow(2, (n - 69) / 12);
  const cents = 1200 * Math.log2(f / exact);
  return { name, cents: Math.round(cents), midi: n };
}

export function autoCorrelate(buffer, sampleRate) {
  const SIZE = buffer.length;
  let rms = 0;
  for (let i = 0; i < SIZE; i++) rms += buffer[i] * buffer[i];
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) return -1;
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

export function centsOff(freq, targetFreq) {
  return 1200 * Math.log2(freq / targetFreq);
}

export function clampNeedle(cents) {
  return Math.max(-50, Math.min(50, cents));
}

export function tuneVerdict(freq, targetFreq) {
  const c = centsOff(freq, targetFreq);
  const a = Math.abs(c);
  let state, label;
  if (a < 6) { state = 'inTune'; label = 'IN TUNE'; }
  else if (a < 20) { state = 'close'; label = 'CLOSE — ' + (c > 0 ? 'a touch sharp' : 'a touch flat'); }
  else { state = 'off'; label = (c > 0 ? 'SHARP' : 'FLAT') + ' by ' + Math.round(a) + ' cents'; }
  return { state, label, cents: Math.round(c) };
}

export function makeTone(freq, sampleRate, seconds) {
  const len = Math.floor(sampleRate * seconds);
  const buf = new Float32Array(len);
  for (let i = 0; i < len; i++) buf[i] = Math.sin(2 * Math.PI * freq * i / sampleRate);
  return buf;
}

export function makeStringTone(freq, sampleRate, seconds) {
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
