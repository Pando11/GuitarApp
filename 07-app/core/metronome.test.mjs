// metronome.test.mjs — node self-test (prints PASS, exits 0).
import { createMetronome, makeClickBuffer, clampBpm, MIN_BPM, MAX_BPM, DEFAULT_BPM } from './metronome.js';
import assert from 'node:assert';

// -- makeClickBuffer: audible click shape (short, percussive, decays) --------

{
  const sampleRate = 44100;
  const buf = makeClickBuffer(sampleRate);
  assert.ok(buf instanceof Float32Array, 'click buffer is a Float32Array, matching tuner-engine.js tone shape');
  assert.ok(buf.length > 0, 'click buffer has samples');
  assert.ok(buf.length < sampleRate * 0.2, 'click is short (percussive), not a sustained tone');

  // energy near the start should be greater than energy near the end (decay
  // envelope) — compare RMS over windows, not single samples, since a single
  // sample can land near a sine zero-crossing regardless of envelope.
  function rms(arr) {
    let sum = 0;
    for (const v of arr) sum += v * v;
    return Math.sqrt(sum / arr.length);
  }
  const headWindow = buf.slice(0, Math.floor(buf.length * 0.2));
  const tailWindow = buf.slice(Math.floor(buf.length * 0.8));
  const head = rms(headWindow);
  const tail = rms(tailWindow);
  assert.ok(head > tail, 'click amplitude decays toward the tail (percussive envelope), head_rms=' + head + ' tail_rms=' + tail);

  // values stay in a sane audio range
  for (const v of buf) assert.ok(v >= -1.0001 && v <= 1.0001, 'sample within [-1, 1]');
}

// -- clampBpm: guitar practice range ------------------------------------------

{
  assert.equal(MIN_BPM, 30);
  assert.equal(MAX_BPM, 240);
  assert.equal(clampBpm(10), 30, 'below range clamps up to MIN_BPM');
  assert.equal(clampBpm(500), 240, 'above range clamps down to MAX_BPM');
  assert.equal(clampBpm(120), 120, 'in-range value passes through');
  assert.equal(clampBpm(NaN), DEFAULT_BPM, 'non-finite input falls back to DEFAULT_BPM');
  assert.equal(clampBpm('90'), 90, 'numeric strings coerce');
}

// -- createMetronome: public API shape ----------------------------------------

{
  const m = createMetronome({ bpm: 100 });
  assert.equal(typeof m.start, 'function');
  assert.equal(typeof m.stop, 'function');
  assert.equal(typeof m.setBpm, 'function');
  assert.equal(typeof m.onBeat, 'function');
  assert.equal(typeof m.isRunning, 'function');
  assert.equal(m.isRunning(), false, 'not running before start()');
  assert.equal(m.getBpm(), 100);
}

// -- deterministic scheduling: fake timer so beats don't depend on real time -

function makeFakeTimer() {
  let scheduled = null; // { fn, ms }
  return {
    setIntervalFn: (fn, ms) => { scheduled = { fn, ms }; return { id: 'fake' }; },
    clearIntervalFn: () => { scheduled = null; },
    tick: () => { assert.ok(scheduled, 'tick() called with no active interval'); scheduled.fn(); },
    intervalMs: () => scheduled && scheduled.ms
  };
}

{
  const timer = makeFakeTimer();
  const m = createMetronome({ bpm: 120, setIntervalFn: timer.setIntervalFn, clearIntervalFn: timer.clearIntervalFn });

  const beats = [];
  const unsubscribe = m.onBeat((n) => beats.push(n));

  m.start();
  assert.equal(m.isRunning(), true, 'running after start()');
  assert.equal(beats.length, 1, 'start() fires an immediate first beat');
  assert.equal(beats[0], 1);
  assert.equal(timer.intervalMs(), 500, '60000/120bpm = 500ms between beats');

  timer.tick();
  timer.tick();
  assert.deepEqual(beats, [1, 2, 3], 'onBeat callback fires once per scheduled tick, in order');

  m.stop();
  assert.equal(m.isRunning(), false, 'not running after stop()');
  assert.equal(timer.intervalMs(), null, 'stop() clears the interval');

  // stop() is idempotent / tick after stop must not fire more callbacks
  m.stop();
  assert.deepEqual(beats, [1, 2, 3], 'no extra beats after stop()');

  unsubscribe();
}

// -- setBpm: clamps, updates schedule, works while running or stopped --------

{
  const timer = makeFakeTimer();
  const m = createMetronome({ bpm: 60, setIntervalFn: timer.setIntervalFn, clearIntervalFn: timer.clearIntervalFn });

  assert.equal(m.setBpm(999), 240, 'setBpm clamps to MAX_BPM while stopped');
  assert.equal(m.getBpm(), 240);

  m.start();
  assert.equal(timer.intervalMs(), 60000 / 240, 'interval reflects clamped bpm at start');

  m.setBpm(30);
  assert.equal(m.getBpm(), 30);
  assert.equal(timer.intervalMs(), 2000, 'setBpm while running reschedules the interval, 60000/30bpm=2000ms');

  m.stop();
}

// -- onBeat: multiple listeners, unsubscribe -----------------------------

{
  const timer = makeFakeTimer();
  const m = createMetronome({ bpm: 100, setIntervalFn: timer.setIntervalFn, clearIntervalFn: timer.clearIntervalFn });

  const a = [];
  const b = [];
  m.onBeat((n) => a.push(n));
  const unsubB = m.onBeat((n) => b.push(n));

  m.start();
  timer.tick();
  unsubB();
  timer.tick();

  assert.deepEqual(a, [1, 2, 3], 'listener a receives every beat');
  assert.deepEqual(b, [1, 2], 'listener b stops receiving beats after unsubscribe');
  m.stop();
}

// -- start() with no injected timer/audio (plain Node): must not throw ------
// Exercises the real global setInterval/clearInterval and the no-AudioContext
// fallback path (playClick() silently no-ops when there is no audio host).

{
  const m = createMetronome({ bpm: 240 }); // fastest allowed interval, keep the real wait short
  const beats = [];
  m.onBeat((n) => beats.push(n));
  assert.doesNotThrow(() => m.start(), 'start() with real timers and no AudioContext must not throw');
  assert.equal(beats.length, 1, 'immediate beat fired synchronously even with real timers');
  m.stop();
}

console.log('metronome PASS — click buffer, clampBpm(' + MIN_BPM + '-' + MAX_BPM + '), start/stop/setBpm/onBeat all covered');
process.exit(0);
