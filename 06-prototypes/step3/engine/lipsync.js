/*
 * GuitarApp Step 3 — LIP-SYNC ENGINE
 * CommonJS, ZERO npm deps, NO DOM access.
 * Authority: 06-prototypes/step3/CONTRACT.md
 *
 * Mouth openness is derived from the VOICE AUDIO ENVELOPE (RMS), never from text.
 * Same audio + different text => identical frames.
 * Different audio + same text => different frames.
 */

'use strict';

var FLOOR_DB = -50;   // below this = mouth closed
var CEIL_DB = -8;     // at/above this = mouth fully open

function toDb(rms) {
  if (rms <= 0) { return -Infinity; }
  return 20 * Math.log10(rms);
}

/*
 * lipsyncFrames(samples, sampleRate, fps)
 *   samples    : Float32Array | Array<number>, mono, nominally -1..1
 *   sampleRate : Hz (e.g. 24000 for OpenAI TTS)
 *   fps        : animation frames per second (default 30)
 * -> [{ tMs, openness }]  openness in 0..1
 */
function lipsyncFrames(samples, sampleRate, fps) {
  if (!samples || typeof samples.length !== 'number') {
    throw new Error('lipsyncFrames: samples must be an array-like of numbers');
  }
  if (!(sampleRate > 0)) { throw new Error('lipsyncFrames: sampleRate must be > 0'); }
  fps = fps || 30;
  if (!(fps > 0)) { throw new Error('lipsyncFrames: fps must be > 0'); }

  var windowSize = Math.max(1, Math.round(sampleRate / fps));
  var frames = [];
  var prev = 0;
  var SMOOTH = 0.45;    // attack/release smoothing so the jaw doesn't chatter

  for (var start = 0; start < samples.length; start += windowSize) {
    var end = Math.min(start + windowSize, samples.length);
    var sum = 0, n = 0;
    for (var i = start; i < end; i++) {
      var v = samples[i];
      if (typeof v !== 'number' || !isFinite(v)) {
        throw new Error('lipsyncFrames: non-finite sample at index ' + i);
      }
      sum += v * v;
      n++;
    }
    var rms = n ? Math.sqrt(sum / n) : 0;
    var db = toDb(rms);

    var raw;
    if (!isFinite(db) || db <= FLOOR_DB) {
      raw = 0;
    } else if (db >= CEIL_DB) {
      raw = 1;
    } else {
      raw = (db - FLOOR_DB) / (CEIL_DB - FLOOR_DB);
    }

    var smoothed = (raw === 0 && prev === 0) ? 0 : (prev + (raw - prev) * SMOOTH);
    if (smoothed < 1e-6) { smoothed = 0; }
    prev = smoothed;

    frames.push({
      tMs: Math.round((start / sampleRate) * 1000),
      openness: Math.round(smoothed * 1000) / 1000
    });
  }
  return frames;
}

/* Convenience: max openness, useful for asserting silence. */
function peakOpenness(frames) {
  return frames.reduce(function (m, f) { return f.openness > m ? f.openness : m; }, 0);
}

module.exports = {
  lipsyncFrames: lipsyncFrames,
  peakOpenness: peakOpenness,
  FLOOR_DB: FLOOR_DB,
  CEIL_DB: CEIL_DB
};
