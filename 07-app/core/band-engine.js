// band-engine.js — F7 "The band that follows you." PORTED 1:1 from 06-prototypes/step7-extra/band-engine.js.
// Deterministic, tempo-following loop engine. SYNTHESIZES original stems (no samples, no copyright).
// Reuses tuner + listening math. Browser-free (no AudioContext); player feeds buffers to Web Audio.

import * as T from './tuner-engine.js';
import * as L from './listening-engine.js';

export const SR = 22050;
export const MAX_BARS = 256;

function makeRng(seed) {
  let a = (seed >>> 0) || 1;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 13), 1 | t)) | 0;
    return ((t ^ (t >>> 30)) >>> 0) / 4294967296;
  };
}

const OPEN = [82.41, 110.00, 146.83, 196.00, 246.94, 329.63];

function tone(freq, seconds, gain) {
  return T.makeStringTone(freq, SR, seconds, gain == null ? 0.6 : gain);
}

function kick(t0, dur, buf) {
  const len = Math.floor(SR * dur);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const env = Math.exp(-t * 14);
    const f = 120 * Math.exp(-t * 30) + 45;
    const s = Math.sin(2 * Math.PI * f * t) * env * 0.9;
    const idx = Math.floor((t0 + t) * SR);
    if (idx >= 0 && idx < buf.length) buf[idx] += s;
  }
}
function noiseBurst(t0, dur, buf, hp, rng) {
  const len = Math.floor(SR * dur);
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

const NOTE_BASE = {
  'C': 65.41, 'C#': 69.30, 'Db': 69.30, 'D': 73.42, 'D#': 77.78, 'Eb': 77.78,
  'E': 82.41, 'F': 87.31, 'F#': 92.50, 'Gb': 92.50, 'G': 98.00, 'G#': 103.83,
  'Ab': 103.83, 'A': 110.00, 'A#': 116.54, 'Bb': 116.54, 'B': 123.47
};
function noteToFreq(name, octaveShift) {
  const baseName = String(name).replace(/\d+$/, '');
  const base = NOTE_BASE[baseName] || NOTE_BASE[baseName.replace(/b$/, '#')] || 65.41;
  const shift = octaveShift || 0;
  return base * Math.pow(2, shift);
}

export function buildBand(opts) {
  opts = opts || {};
  const chordCycle = opts.chordCycle && opts.chordCycle.length ? opts.chordCycle.slice() : ['C'];
  const bpm = (opts.bpm == null) ? clampBpm(opts.lessonDefaultBpm) : clampBpm(opts.bpm);
  const beats = (opts.beats && opts.beats >= 2 && opts.beats <= 12) ? opts.beats : 4;
  const feel = opts.feel === 'swing' ? 'swing' : 'straight';
  const bars = (opts.bars && opts.bars >= 1) ? Math.min(Math.floor(opts.bars), MAX_BARS) : chordCycle.length;
  const seed = opts.seed || 1;
  const masterGain = (opts.gain != null && isFinite(Number(opts.gain))) ? Number(opts.gain) : 1;

  const beatSec = 60 / bpm;
  const barSec = beatSec * beats;
  const totalSec = barSec * bars;
  const buffer = new Float32Array(Math.floor(SR * totalSec));
  const nominal = [];
  const rng = makeRng(seed);

  for (let bar = 0; bar < bars; bar++) {
    const chordName = chordCycle[bar % chordCycle.length];
    const chord = (opts.chords && opts.chords[chordName]) || null;
    const rootInfo = chordRootName(chordName);
    const root = rootInfo.root;
    const bassShift = (rootInfo.octave || 2) - 2;
    const bassFreq = noteToFreq(root, bassShift);

    for (let b = 0; b < beats; b++) {
      const tBeat = bar * barSec + b * beatSec;
      if (b === 0 || b === 2) { kick(tBeat, 0.18, buffer); nominal.push({ beat: b, stem: 'kick', note: 'kick' }); }
      if (b === 1 || b === 3) { noiseBurst(tBeat, 0.14, buffer, false, rng); nominal.push({ beat: b, stem: 'snare', note: 'snare' }); }
      const off = (feel === 'swing') ? beatSec * 0.66 : beatSec * 0.5;
      noiseBurst(tBeat, 0.04, buffer, true, rng);
      noiseBurst(tBeat + off, 0.04, buffer, true, rng);
      nominal.push({ beat: b, stem: 'hat', note: 'hat' });
    }
    if (root) {
      const fifth = transposeName(root, 7);
      const bass1 = tone(bassFreq, beatSec * 0.9, 0.5);
      addInto(buffer, bass1, bar * barSec);
      const bass2 = tone(noteToFreq(fifth, bassShift), beatSec * 0.9, 0.5);
      addInto(buffer, bass2, bar * barSec + 2 * beatSec);
      nominal.push({ beat: 0, stem: 'bass', note: root });
      nominal.push({ beat: 2, stem: 'bass', note: fifth });
    }
    if (chord && Array.isArray(chord.frets)) {
      const stabSec = beatSec * 0.8;
      for (let i = 0; i < 6; i++) {
        const fret = chord.frets[i];
        if (fret == null || !isFinite(Number(fret))) continue;
        const f = OPEN[i] * Math.pow(2, Number(fret) / 12);
        const stab = tone(f, stabSec, 0.22);
        addInto(buffer, stab, bar * barSec + rng() * 0.01);
      }
      nominal.push({ beat: 0, stem: 'chord', note: chordName });
    }
  }

  for (let i = 0; i < buffer.length; i++) {
    let v = buffer[i] * masterGain;
    if (!isFinite(v)) v = 0;
    if (v > 1) v = 1; else if (v < -1) v = -1;
    buffer[i] = v;
  }
  return { buffer, sampleRate: SR, durationSec: totalSec, bpm, beats, feel, bars, nominal };
}

function addInto(dest, src, t0) {
  const off = Math.floor(t0 * SR);
  for (let i = 0; i < src.length; i++) { const idx = off + i; if (idx >= 0 && idx < dest.length) dest[idx] += src[i]; }
}

export function clampBpm(bpm) {
  if (bpm == null) return 80;
  const n = Number(bpm);
  if (!isFinite(n)) return 80;
  if (n < 30) return 30;
  if (n > 240) return 240;
  return Math.round(n);
}

export function chordRootName(name) {
  if (typeof name !== 'string' || !/^[A-G][#b]?/i.test(name)) return { root: null, octave: 2 };
  const m = name.match(/^([A-G][#b]?)/i);
  const root = m[1][0].toUpperCase() + (m[1][1] || '');
  const EXT = /^(5|6|7|9|11|13)$/;
  const rest = name.slice(m[1].length).replace(/(maj|min|dim|aug|sus|add|m)[0-9]*/gi, '');
  const octMatch = rest.match(/^(\d+)$/);
  const octave = (octMatch && /^[0-4]$/.test(octMatch[1]) && !EXT.test(octMatch[1])) ? parseInt(octMatch[1], 10) : 2;
  return { root, octave };
}
export function transposeName(name, semi) {
  const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const flatToSharp = { 'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#' };
  let n = String(name).replace(/^\d+/, '');
  if (flatToSharp[n]) n = flatToSharp[n];
  let idx = keys.indexOf(n);
  if (idx < 0) idx = 0;
  return keys[((idx + semi) % 12 + 12) % 12];
}

export function verifyStemPitch(buffer, expectedFreq, opts) {
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

export function bufferHash(buf) {
  let h = 2166136261 >>> 0;
  const step = Math.max(1, Math.floor(buf.length / 4000));
  for (let i = 0; i < buf.length; i += step) { const v = Math.round(buf[i] * 100000) & 0xff; h ^= v; h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(16);
}
