/*
 * listening-engine.js — Step 5 in-lesson listening verification (F2 full).
 *
 * CONSTRAINED TARGET-MATCHING ONLY. This is NOT open-ended transcription (Ban 3).
 * The lesson already told the student what to play ("play Em now"). This engine
 * checks whether the chord the lesson EXPECTED is the chord the student actually
 * produced — by comparing the set of pitches heard to the set of pitches the
 * target chord's fingering implies.
 *
 * Reuses the proven Step 2 pitch math (tuner-engine.js: noteFromFreq / autoCorrelate
 * / centsOff / makeStringTone) so the SAME on-device DSP the tuner uses backs the
 * listening check. This module adds the CHORD-level matcher on top.
 *
 * Audio is NEVER uploaded (Ban 5). This module is DOM-free / browser-free: the
 * microphone I/O lives in the player; this does DSP + chord matching + verdict.
 *
 * Verdicts:
 *   pass     — every expected string rings clean, no stray notes.
 *   fail     — a required string is missing/blocked (specific string named), OR a
 *              note sounds that the target chord does not contain (wrong chord), OR a
 *              string is badly out of tune. Friendly, specific feedback — never a bare X.
 *   unsure   — input too quiet / unclear to judge. "not sure — play that again".
 *              CRITICAL: unsure is NEVER a fail. A too-quiet take must never produce a
 *              false red X (that is the spec's explicit honesty requirement).
 *
 * Run browser-free via verify-step5.js (synthetic chord tones, no mic).
 */

'use strict';

// Reuse the proven Step 2 pitch engine — do NOT reimplement the DSP (HANDOFF: REUSE).
// Node: CommonJS require. Browser classic-<script>: read the global the tuner engine
// attached (window.TunerEngine), since require() is unavailable in a file:// page.
let T;
try { T = require('../../step2/engine/tuner-engine.js'); }
catch (e) { T = (typeof window !== 'undefined') ? window.TunerEngine : null; }

// Standard open-string frequencies, low E(6) -> high e(1). Mirrors tuner-engine.STRINGS.
const OPEN_FREQS = [82.41, 110.00, 146.83, 196.00, 246.94, 329.63];
// Guitar string NUMBER (1..6, high e = 1, low E = 6) for each array index 0..5.
const STRING_NUMBER = [6, 5, 4, 3, 2, 1];

// Expected pitch per string for a chord given its 6-length frets array.
// frets indexed low E(6)..high e(1) to match the lesson JSON `_schema`.
function chordExpected(chordFrets) {
  const out = [];
  for (let i = 0; i < 6; i++) {
    const fret = chordFrets[i];
    if (fret === null || fret === undefined) {
      // Muted string: we still need its expected note so we can detect if it rings
      // when it shouldn't (see verifyChord 1b). Its "expected" pitch is the open string.
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
        stringIndex: i,
        stringNum: STRING_NUMBER[i],
        fret: fret,
        expectedFreq: freq,
        muted: false,
        expectedNote: Object.assign(T.noteFromFreq(freq), { freq: freq })
      });
    }
  }
  return out;
}

// --- Pitch-set extraction: Hann-windowed magnitude DFT across the guitar range. ---
// A strummed chord is polyphonic; we need the SET of pitches present. Real guitar
// strings (especially low E2/A2) have WEAK fundamentals and STRONG harmonics, so a
// naive "peak-pick the lowest peak" misses them. Instead we spread each spectrum
// bin's energy onto its implied fundamental via pitch-class (octave-folded) energy,
// so a string heard only as its 2nd/3rd harmonic still reinforces the right note.
const F_MIN = 55, F_MAX = 1200; // cover fundamentals + first harmonics of all 6 strings

function detectPitchSet(buffer, sampleRate) {
  // RMS gate — if the take is too quiet, we cannot judge it.
  let rms = 0;
  for (let i = 0; i < buffer.length; i++) rms += buffer[i] * buffer[i];
  rms = Math.sqrt(rms / buffer.length);

  // Periodicity confidence: reuse the proven Step 2 autocorrelation. A real chord
  // has strong periodicity (the strings' fundamental); white noise does not. This
  // is what lets us return "unsure" for incoherent input instead of a false fail.
  const f0 = T.autoCorrelate(buffer, sampleRate);

  const N = buffer.length;
  const w = new Float32Array(N);
  for (let i = 0; i < N; i++) w[i] = buffer[i] * (0.5 - 0.5 * Math.cos(2 * Math.PI * i / (N - 1)));

  // Magnitude spectrum at 1-Hz bins across [F_MIN, F_MAX].
  const bins = [];
  for (let f = F_MIN; f <= F_MAX; f++) {
    const w0 = 2 * Math.PI * f / sampleRate;
    let re = 0, im = 0;
    for (let n = 0; n < N; n++) { re += w[n] * Math.cos(w0 * n); im -= w[n] * Math.sin(w0 * n); }
    bins.push({ f, mag: Math.sqrt(re * re + im * im) / N });
  }
  let peak = 0; for (const b of bins) if (b.mag > peak) peak = b.mag;
  if (peak > 0) for (const b of bins) b.mag /= peak;

  // Pitch-class (octave-folded) energy: fold every bin onto its nearest note, so a
  // string heard via its harmonic reinforces the correct note. PITCH_CLASS = 12 *
  // log2(f/440) mod 12, mapped to a 1200-cent bin per semitone of a reference octave.
  const pcEnergy = new Array(12).fill(0);
  const pcPeakFreq = new Array(12).fill(null);
  const SEMITONE_HZ = []; // reference freq per pitch class (A4=440 reference, pc index for C=0)
  for (let pc = 0; pc < 12; pc++) {
    // map pc to an actual reference frequency in a mid octave for naming
    SEMITONE_HZ.push(440 * Math.pow(2, (pc - 9) / 12)); // A4=440 => pc 9; C4 => pc 0
  }
  for (const b of bins) {
    if (b.mag < 0.04) continue;
    // fold to pitch class; track the measured peak freq for this pc
    const midi = 12 * Math.log2(b.f / 440) + 69;
    const pc = ((Math.round(midi) % 12) + 12) % 12;
    pcEnergy[pc] += b.mag;
    // Remember the strongest measured peak freq contributing to this pc.
    if (!pcPeakFreq[pc] || b.mag > pcPeakFreq[pc].mag) pcPeakFreq[pc] = { f: b.f, mag: b.mag };
  }
  // Normalize pc energy.
  let pcPeak = 0; for (const e of pcEnergy) if (e > pcPeak) pcPeak = e;
  if (pcPeak > 0) for (let i = 0; i < 12; i++) pcEnergy[i] /= pcPeak;

  // Harmonic-clarity: fraction of spectral energy concentrated in the detected pitch
  // classes. A real chord concentrates energy in a few notes (high clarity); white
  // noise spreads it evenly (low clarity). This gates incoherent input -> "unsure".
  let totalEnergy = 0;
  for (const b of bins) totalEnergy += b.mag * b.mag;
  let peakEnergy = 0;
  for (let pc = 0; pc < 12; pc++) peakEnergy += pcEnergy[pc] * pcEnergy[pc];
  const clarity = totalEnergy > 0 ? peakEnergy / totalEnergy : 0;

  // A pitch class is "heard" if it carries meaningful energy. The REPORTED frequency
  // is the strongest measured spectral peak in that pc (not the idealized reference),
  // so a buzzing / out-of-tune string surfaces as real cents-off — not a false clean.
  const heard = [];
  for (let pc = 0; pc < 12; pc++) {
    if (pcEnergy[pc] < 0.25) continue;
    const measuredF = pcPeakFreq[pc] ? pcPeakFreq[pc].f : SEMITONE_HZ[pc];
    heard.push({ freq: measuredF, note: T.noteFromFreq(measuredF), pitchClass: pc, pcEnergy: pcEnergy[pc] });
  }
  // de-dup by pitch class (keep highest energy)
  const byPc = {};
  for (const h of heard) {
    if (!byPc[h.pitchClass] || h.pcEnergy > byPc[h.pitchClass].pcEnergy) byPc[h.pitchClass] = h;
  }
  const heardUnique = Object.values(byPc).map(h => ({ freq: h.freq, note: h.note }));

  return { rms, peak, f0, clarity, heard: heardUnique };
}

// Match a heard note to an expected note by PITCH CLASS (octave-folded) + cents.
// A low string heard only as its 2nd/3rd harmonic still shares the expected note's
// pitch class, so matching on class (not literal octave) is correct and robust.
// Works on note objects ({name, cents, midi}) or {freq, note} pairs.
function notePitchClass(note) {
  const midi = typeof note === 'object' && note.midi != null ? note.midi
    : 12 * Math.log2(note.freq / 440) + 69;
  return ((Math.round(midi) % 12) + 12) % 12;
}
function notesMatch(heardPair, expectedNote, tolCents) {
  const heardNote = heardPair.note || heardPair;
  const heardFreq = heardPair.freq != null ? heardPair.freq : heardNote.freq;
  if (notePitchClass(heardNote) !== notePitchClass(expectedNote)) return false;
  // Fold cents to the nearest octave: a low string heard at E4 vs expected E2 is the
  // same note class (0 cents once octave-folded), not 2400 cents apart.
  let c = T.centsOff(heardFreq, expectedNote.freq) % 1200;
  if (c > 600) c -= 1200;
  if (c < -600) c += 1200;
  return Math.abs(c) <= tolCents;
}

// --- The verdict ---
// chordFrets: 6-length array, low E(6)..high e(1), null = muted.
// opts: { presentTol=25, cleanTol=6 }
function verifyChord(buffer, sampleRate, chordFrets, opts) {
  opts = opts || {};
  const presentTol = opts.presentTol != null ? opts.presentTol : 25; // note counts as "heard" within 25c
  const cleanTol = opts.cleanTol != null ? opts.cleanTol : 6;        // "clean" within 6c
  const quietRms = opts.quietRms != null ? opts.quietRms : 0.03;     // below this = too quiet to judge
  // COHERENCE GATE params (root-cause fix for incoherent-input false-fails):
  const minCoverage = opts.minCoverage != null ? opts.minCoverage : 0.2; // fraction of target chord tones heard

  const expected = chordExpected(chordFrets);
  const expectedSounding = expected.filter(e => !e.muted);

  const detect = detectPitchSet(buffer, sampleRate);
  const { rms, heard, clarity } = detect;

  // TOO QUIET / NO PITCH / INCOHERENT -> unsure, NEVER a fail (spec honesty requirement).
  if (rms < quietRms) {
    return { verdict: 'unsure', reason: 'quiet',
      msg: "not sure — play that again", heard: heard.map(h => h.note.name), rms: rms };
  }
  // COHERENCE GATE: incoherent input — DC offset, mains hum, white noise,
  // silence-shaped garbage — must return "unsure", NEVER a red X (spec honesty bar,
  // F2). The gate fires on ANY of three independent, data-backed signals
  // (measured in measure-coherence.js):
  //
  //   (a) COVERAGE — fraction of the target chord's expected tones actually heard.
  //       A real chord = 1.00; a genuinely WRONG chord still shares ~0.5 (so it
  //       FAILs, not "unsures"); 50Hz hum = ~0.00. But coverage ALONE is NOT
  //       deterministic for loud broadband noise: noise smears across all 12 pitch
  //       classes and occasionally matches a target note by chance, crossing the
  //       0.2 floor ~50% of the time and slipping to a spurious fail. Hence (c).
  //
  //   (b) QUANTITY < minCoverage — same as (a)'s floor; keeps weak/partial signals
  //       as unsure (50Hz, near-silence-shaped garbage).
  //
  //   (c) TONAL STRUCTURE — a genuine 6-string chord has AT MOST 6 distinct pitch
  //       classes (harmonics fold onto their fundamental's class, so they never add
  //       new classes). Incoherent DC/noise spreads energy across 9–12 classes.
  //       This is THE determinative signal for DC/noise: it cannot regress a real
  //       chord (max 6 classes) or a wrong chord (3 classes, coverage 0.5 -> fail).
  //
  //       NOTE: f0 autocorrelation is computed by detectPitchSet but is DELIBERATELY
  //       NOT used as a gate signal — it cannot separate 50Hz mains hum (f0≈50) from
  //       a real low chord's spurious periodicity (e.g. Am returns f0≈54.8), so a
  //       f0-threshold would wrongly mark real chords unsure. It is kept only for
  //       diagnostics. (The earlier "f0 periodicity" gate design was itself unsound;
  //       the structure gate (c) replaces it.)
  const expectedCoverage =
    expectedSounding.length ? heard.filter(h =>
      expectedSounding.some(e => notesMatch(h, e.expectedNote, presentTol))).length / expectedSounding.length : 0;
  if (expectedCoverage < minCoverage) {
    return { verdict: 'unsure', reason: 'incoherent',
      msg: "not sure — play that again", heard: heard.map(h => h.note.name), rms: rms, coverage: expectedCoverage };
  }
  // (c) Tonal-structure guard — deterministic, replaces the unsound f0 gate.
  // heard.length is the count of DISTINCT pitch classes (0..12); a real 6-string
  // chord can never exceed 6, so >=9 is unambiguously incoherent structure.
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

  // 1) Every expected sounding string must be heard. Missing => fail, name the string.
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

  // 1b) Muted strings must STAY silent. If the muted string's fundamental OR any of
  // its harmonics is heard, that string is ringing when it should be muted -> fail.
  // We test the heard peak against the muted string's freq × {1,2,3,4}; a real muted
  // low-E (82Hz) often surfaces as its 2nd harmonic (165Hz), which still means it rang.
  const expectedMuted = expected.filter(e => e.muted);
  for (const e of expectedMuted) {
    const hit = heard.find(h => {
      if (notePitchClass(h.note) !== notePitchClass(e.expectedNote)) return false;
      // Only the genuinely-LOW fundamentals (k=1, the open string; k=2, its 2nd
      // harmonic ~165Hz) count as the muted string ringing. Higher harmonics (k=4,
      // ~330Hz) coincide with legitimate chord tones (e.g. E4 in C major) and must
      // NOT be treated as the muted string — that would false-fail a correct chord.
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

  // 2) No stray note the target chord does not contain (catches WRONG chords).
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

// Synthesize a chord tone (sum of harmonic-rich string tones) for browser-free tests.
function makeChordTone(chordFrets, sampleRate, seconds, gain) {
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

// --- BAN REGRESSION: this module does NO open transcription and NO network. ---
function selfAudit() {
  // No network-transport calls (audio must never leave the device — Ban 5).
  const src = require('fs').readFileSync(__filename, 'utf8');
  const bannedCall = /fetch\s*\(|new\s+XMLHttpRequest|new\s+WebSocket|http\s*\.\s*request|axios\s*\(/;
  return { noNetwork: !bannedCall.test(src), note: 'constrained target-matching only; audio never leaves device' };
}

module.exports = {
  OPEN_FREQS, STRING_NUMBER, chordExpected, detectPitchSet, verifyChord,
  makeChordTone, notesMatch, notePitchClass, selfAudit, F_MIN, F_MAX
};

// UMD-ish: in a browser classic <script> (file://), expose on window so the player
// reuses the EXACT same DSP the Node tests prove. No network — Ban 5.
if (typeof window !== 'undefined' && typeof module === 'undefined') {
  window.Listening = module && module.exports ? module.exports : null;
}
if (typeof window !== 'undefined') {
  // Classic-script path: module is undefined; attach manually.
  window.Listening = {
    OPEN_FREQS, STRING_NUMBER, chordExpected, detectPitchSet, verifyChord,
    makeChordTone, notesMatch, notePitchClass, selfAudit, F_MIN, F_MAX
  };
}
