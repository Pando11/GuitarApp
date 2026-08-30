// listening-engine.js — F2 full in-lesson listening verification.
// PORTED 1:1 from 06-prototypes/step5/engine/listening-engine.js.
// CONSTRAINED TARGET-MATCHING ONLY (Ban 3). Reuses the proven tuner math.
// Browser-free: mic I/O lives in the player; this does DSP + chord matching + verdict.

import * as T from './tuner-engine.js';

export const OPEN_FREQS = [82.41, 110.00, 146.83, 196.00, 246.94, 329.63];
export const STRING_NUMBER = [6, 5, 4, 3, 2, 1];
export const F_MIN = 55, F_MAX = 1200;

export function chordExpected(chordFrets) {
  const out = [];
  for (let i = 0; i < 6; i++) {
    const fret = chordFrets[i];
    if (fret === null || fret === undefined) {
      const open = OPEN_FREQS[i];
      out.push({
        stringIndex: i, stringNum: STRING_NUMBER[i], fret: null,
        expectedFreq: open, muted: true,
        expectedNote: Object.assign(T.noteFromFreq(open), { freq: open })
      });
    } else {
      const open = OPEN_FREQS[i];
      const freq = open * Math.pow(2, fret / 12);
      out.push({
        stringIndex: i, stringNum: STRING_NUMBER[i], fret: fret,
        expectedFreq: freq, muted: false,
        expectedNote: Object.assign(T.noteFromFreq(freq), { freq: freq })
      });
    }
  }
  return out;
}

export function detectPitchSet(buffer, sampleRate) {
  let rms = 0;
  for (let i = 0; i < buffer.length; i++) rms += buffer[i] * buffer[i];
  rms = Math.sqrt(rms / buffer.length);

  const f0 = T.autoCorrelate(buffer, sampleRate);

  const N = buffer.length;
  const w = new Float32Array(N);
  for (let i = 0; i < N; i++) w[i] = buffer[i] * (0.5 - 0.5 * Math.cos(2 * Math.PI * i / (N - 1)));

  const bins = [];
  for (let f = F_MIN; f <= F_MAX; f++) {
    const w0 = 2 * Math.PI * f / sampleRate;
    let re = 0, im = 0;
    for (let n = 0; n < N; n++) { re += w[n] * Math.cos(w0 * n); im -= w[n] * Math.sin(w0 * n); }
    bins.push({ f, mag: Math.sqrt(re * re + im * im) / N });
  }
  let peak = 0; for (const b of bins) if (b.mag > peak) peak = b.mag;
  if (peak > 0) for (const b of bins) b.mag /= peak;

  const pcEnergy = new Array(12).fill(0);
  const pcPeakFreq = new Array(12).fill(null);
  const SEMITONE_HZ = [];
  for (let pc = 0; pc < 12; pc++) {
    SEMITONE_HZ.push(440 * Math.pow(2, (pc - 9) / 12));
  }
  for (const b of bins) {
    if (b.mag < 0.04) continue;
    const midi = 12 * Math.log2(b.f / 440) + 69;
    const pc = ((Math.round(midi) % 12) + 12) % 12;
    pcEnergy[pc] += b.mag;
    if (!pcPeakFreq[pc] || b.mag > pcPeakFreq[pc].mag) pcPeakFreq[pc] = { f: b.f, mag: b.mag };
  }
  let pcPeak = 0; for (const e of pcEnergy) if (e > pcPeak) pcPeak = e;
  if (pcPeak > 0) for (let i = 0; i < 12; i++) pcEnergy[i] /= pcPeak;

  let totalEnergy = 0;
  for (const b of bins) totalEnergy += b.mag * b.mag;
  let peakEnergy = 0;
  for (let pc = 0; pc < 12; pc++) peakEnergy += pcEnergy[pc] * pcEnergy[pc];
  const clarity = totalEnergy > 0 ? peakEnergy / totalEnergy : 0;

  const heard = [];
  for (let pc = 0; pc < 12; pc++) {
    if (pcEnergy[pc] < 0.25) continue;
    const measuredF = pcPeakFreq[pc] ? pcPeakFreq[pc].f : SEMITONE_HZ[pc];
    heard.push({ freq: measuredF, note: T.noteFromFreq(measuredF), pitchClass: pc, pcEnergy: pcEnergy[pc] });
  }
  const byPc = {};
  for (const h of heard) {
    if (!byPc[h.pitchClass] || h.pcEnergy > byPc[h.pitchClass].pcEnergy) byPc[h.pitchClass] = h;
  }
  const heardUnique = Object.values(byPc).map(h => ({ freq: h.freq, note: h.note }));

  return { rms, peak, f0, clarity, heard: heardUnique };
}

export function notePitchClass(note) {
  const midi = typeof note === 'object' && note.midi != null ? note.midi
    : 12 * Math.log2(note.freq / 440) + 69;
  return ((Math.round(midi) % 12) + 12) % 12;
}

export function notesMatch(heardPair, expectedNote, tolCents) {
  const heardNote = heardPair.note || heardPair;
  const heardFreq = heardPair.freq != null ? heardPair.freq : heardNote.freq;
  if (notePitchClass(heardNote) !== notePitchClass(expectedNote)) return false;
  let c = T.centsOff(heardFreq, expectedNote.freq) % 1200;
  if (c > 600) c -= 1200;
  if (c < -600) c += 1200;
  return Math.abs(c) <= tolCents;
}

export function verifyChord(buffer, sampleRate, chordFrets, opts) {
  opts = opts || {};
  const presentTol = opts.presentTol != null ? opts.presentTol : 25;
  const cleanTol = opts.cleanTol != null ? opts.cleanTol : 6;
  const quietRms = opts.quietRms != null ? opts.quietRms : 0.03;
  const minCoverage = opts.minCoverage != null ? opts.minCoverage : 0.2;

  const expected = chordExpected(chordFrets);
  const expectedSounding = expected.filter(e => !e.muted);

  const detect = detectPitchSet(buffer, sampleRate);
  const { rms, heard, clarity } = detect;

  if (rms < quietRms) {
    return { verdict: 'unsure', reason: 'quiet',
      msg: "not sure — play that again", heard: heard.map(h => h.note.name), rms: rms };
  }
  const expectedCoverage =
    expectedSounding.length ? heard.filter(h =>
      expectedSounding.some(e => notesMatch(h, e.expectedNote, presentTol))).length / expectedSounding.length : 0;
  if (expectedCoverage < minCoverage) {
    return { verdict: 'unsure', reason: 'incoherent',
      msg: "not sure — play that again", heard: heard.map(h => h.note.name), rms: rms, coverage: expectedCoverage };
  }
  if (heard.length >= 9) {
    return { verdict: 'unsure', reason: 'incoherent-structure',
      msg: "not sure — play that again", heard: heard.map(h => h.note.name), rms: rms, heardCount: heard.length };
  }
  if (heard.length < 1) {
    return { verdict: 'unsure', reason: 'unclear',
      msg: "not sure — play that again", heard: [], rms: rms };
  }

  const problems = [];
  const cleanStrings = [];

  for (const e of expectedSounding) {
    const hit = heard.find(h => notesMatch(h, e.expectedNote, presentTol));
    if (!hit) {
      problems.push("string " + e.stringNum + " (the " + e.expectedNote.name + " note) isn't ringing — "
        + "check your finger and strum through it");
      continue;
    }
    const c = T.centsOff(hit.freq, e.expectedFreq) % 1200;
    const cFold = c > 600 ? c - 1200 : (c < -600 ? c + 1200 : c);
    if (Math.abs(cFold) <= cleanTol) {
      cleanStrings.push(e.stringNum);
    } else {
      problems.push("string " + e.stringNum + " is " + Math.round(cFold) + " cents "
        + (cFold > 0 ? "sharp" : "flat") + " — press a little closer to the fret");
    }
  }

  const expectedMuted = expected.filter(e => e.muted);
  for (const e of expectedMuted) {
    const hit = heard.find(h => {
      if (notePitchClass(h.note) !== notePitchClass(e.expectedNote)) return false;
      for (let k = 1; k <= 2; k++) {
        const c = T.centsOff(h.freq, e.expectedFreq * k);
        if (Math.abs(c) <= 50) return true;
      }
      return false;
    });
    if (hit) {
      problems.push("string " + e.stringNum + " should be muted but I'm hearing it ring — "
        + "lift that finger off so it stays quiet");
    }
  }

  const heardExcess = heard.filter(h =>
    !expectedSounding.some(e => notesMatch(h, e.expectedNote, presentTol)));
  for (const h of heardExcess) {
    problems.push("I'm hearing a " + h.note.name + " that shouldn't be there — "
      + "a string may be muted or blocked");
  }

  if (problems.length > 0) {
    return { verdict: 'fail', reason: 'mismatch', problems,
      msg: problems[0], heard: heard.map(h => h.note.name), rms: rms };
  }
  return { verdict: 'pass', reason: 'all-clean',
    msg: "all " + expectedSounding.length + " strings ringing clean — nice, that's "
      + (expectedSounding.length === 6 ? "Em" : "the chord") + "!",
    cleanStrings, heard: heard.map(h => h.note.name), rms: rms };
}

export function makeChordTone(chordFrets, sampleRate, seconds, gain) {
  gain = gain == null ? 0.25 : gain;
  const expected = chordExpected(chordFrets).filter(e => !e.muted);
  const len = Math.floor(sampleRate * seconds);
  const buf = new Float32Array(len);
  for (const e of expected) {
    const tone = T.makeStringTone(e.expectedFreq, sampleRate, seconds);
    for (let i = 0; i < len; i++) buf[i] += tone[i];
  }
  for (let i = 0; i < len; i++) buf[i] *= gain;
  return buf;
}
