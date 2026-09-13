// metronome.js — audible click + beat callbacks for practice tempo.
// Follows the Web Audio tone-generation pattern in tuner-engine.js's
// makeTone()/makeStringTone() (buffer of samples, played through an
// AudioContext) — that file is NOT modified, only its pattern is reused.
// Browser-free at import time: no `document`/`window`/`AudioContext` access
// happens until start() actually needs to play a sound, so this module loads
// and its scheduling/BPM logic is fully testable under plain Node.

export const MIN_BPM = 30;
export const MAX_BPM = 240;
export const DEFAULT_BPM = 100;

// Short percussive click: a high-pitched tone with a fast exponential-decay
// envelope, same buffer-of-samples shape as makeTone() in tuner-engine.js.
export function makeClickBuffer(sampleRate, { freq = 1000, seconds = 0.03, decay = 40 } = {}) {
  const len = Math.max(1, Math.floor(sampleRate * seconds));
  const buf = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / sampleRate;
    const envelope = Math.exp(-decay * t);
    buf[i] = Math.sin(2 * Math.PI * freq * t) * envelope;
  }
  return buf;
}

export function clampBpm(bpm) {
  const n = Math.round(Number(bpm));
  if (!Number.isFinite(n)) return DEFAULT_BPM;
  return Math.max(MIN_BPM, Math.min(MAX_BPM, n));
}

// createMetronome({ bpm }) -> { start, stop, setBpm, getBpm, onBeat, isRunning }
//
// Optional injectable params (for tests / non-browser hosts) beyond `bpm`:
//   audioContext   — a pre-built AudioContext-like object; if omitted, one is
//                     lazily constructed from the global AudioContext on the
//                     first beat, and if no such global exists (e.g. Node),
//                     the click is silently skipped while beat callbacks
//                     still fire — the scheduling contract never depends on
//                     audio actually being available.
//   setIntervalFn/clearIntervalFn — defaults to the global setInterval/
//                     clearInterval; overridable so tests can drive beats
//                     deterministically instead of waiting on real timers.
export function createMetronome({
  bpm = DEFAULT_BPM,
  audioContext = null,
  setIntervalFn = setInterval,
  clearIntervalFn = clearInterval
} = {}) {
  let currentBpm = clampBpm(bpm);
  let running = false;
  let timerId = null;
  let beatCount = 0;
  let listeners = [];
  let ctx = audioContext;

  function ensureContext() {
    if (ctx) return ctx;
    const AC = (typeof AudioContext !== 'undefined' && AudioContext)
      || (typeof window !== 'undefined' && window.AudioContext);
    if (!AC) return null;
    ctx = new AC();
    return ctx;
  }

  function playClick() {
    const audioCtx = ensureContext();
    if (!audioCtx || typeof audioCtx.createBuffer !== 'function') return; // no audio host — silent tick is fine
    const samples = makeClickBuffer(audioCtx.sampleRate);
    const audioBuffer = audioCtx.createBuffer(1, samples.length, audioCtx.sampleRate);
    const channel = audioBuffer.getChannelData(0);
    channel.set(samples);
    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioCtx.destination);
    source.start();
  }

  function intervalMs() {
    return 60000 / currentBpm;
  }

  function tick() {
    playClick();
    beatCount++;
    for (const cb of listeners.slice()) {
      cb(beatCount);
    }
  }

  function start() {
    if (running) return;
    running = true;
    beatCount = 0;
    tick(); // immediate beat on start, then steady pulse
    timerId = setIntervalFn(tick, intervalMs());
  }

  function stop() {
    if (!running) return;
    running = false;
    clearIntervalFn(timerId);
    timerId = null;
  }

  function setBpm(newBpm) {
    currentBpm = clampBpm(newBpm);
    if (running) {
      clearIntervalFn(timerId);
      timerId = setIntervalFn(tick, intervalMs());
    }
    return currentBpm;
  }

  function getBpm() {
    return currentBpm;
  }

  function onBeat(cb) {
    listeners.push(cb);
    return () => {
      listeners = listeners.filter((fn) => fn !== cb);
    };
  }

  function isRunning() {
    return running;
  }

  return { start, stop, setBpm, getBpm, onBeat, isRunning };
}
