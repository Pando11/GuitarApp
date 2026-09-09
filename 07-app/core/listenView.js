// listenView.js — the Listen screen: a tuner and a chord check, both driven by
// the microphone.
//
// Why this file exists (2026-09-08): listening-engine.js and tuner-engine.js
// have been complete and tested since the prototypes were ported, and nothing
// in the shipping app imported either of them. Lesson 1 opens by telling the
// student to tune, and the app gave them no way to do it. This is the missing
// surface, not new DSP — every number below comes out of those two engines,
// which are untouched.
//
// Mic audio never leaves the device: it is read into a Float32Array, handed to
// the engines, and dropped. Nothing here writes it anywhere or sends it
// anywhere, per the project's standing non-negotiable.

import * as T from './tuner-engine.js';
import { verifyChord } from './listening-engine.js';

// The tuner reads a fresh window this often. Fast enough to feel live, slow
// enough that the autocorrelation over ~2048 samples isn't run flat out.
const TUNER_INTERVAL_MS = 100;
// Below this RMS there is nothing to measure — the student isn't playing.
const TUNER_SILENCE_RMS = 0.012;
// Seconds of audio verifyChord gets per attempt. Matches the prototype player
// that proved the chord math in-browser; long enough for a strum to ring.
const CHORD_CAPTURE_SECONDS = 0.6;

const MIC_CONSTRAINTS = {
  audio: {
    // All three off on purpose: they are tuned for speech and will happily
    // reshape a guitar's harmonics, which is exactly what the pitch detection
    // is reading. Same settings the proven prototype used.
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
  },
};

function el(id) {
  return document.getElementById(id);
}

function AudioContextCtor() {
  return window.AudioContext || window.webkitAudioContext || null;
}

// --- shared mic plumbing ---------------------------------------------------

async function openMic() {
  if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
    throw new Error('This browser has no microphone access.');
  }
  const Ctor = AudioContextCtor();
  if (!Ctor) throw new Error('This browser has no Web Audio support.');
  const stream = await navigator.mediaDevices.getUserMedia(MIC_CONSTRAINTS);
  const ctx = new Ctor();
  // Chrome starts a context created outside a gesture in "suspended"; both
  // entry points here are click handlers, but resume anyway — it is a no-op
  // when already running and the difference is silent failure if skipped.
  if (ctx.state === 'suspended' && typeof ctx.resume === 'function') {
    try { await ctx.resume(); } catch (e) { /* fall through; capture will show it */ }
  }
  return { stream, ctx, source: ctx.createMediaStreamSource(stream) };
}

function closeMic(mic) {
  if (!mic) return;
  try { mic.stream.getTracks().forEach((t) => t.stop()); } catch (e) { /* already gone */ }
  try { if (mic.ctx.state !== 'closed') mic.ctx.close(); } catch (e) { /* already gone */ }
}

function micErrorText(err) {
  const name = err && err.name;
  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return 'Microphone blocked. Allow microphone access for this page, then try again.';
  }
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
    return 'No microphone found. Plug one in or check your system sound settings.';
  }
  if (name === 'NotReadableError') {
    return 'Something else is using the microphone. Close it and try again.';
  }
  return (err && err.message) ? err.message : 'The microphone could not be opened.';
}

// --- tuner -----------------------------------------------------------------

// Which of the six open strings a heard frequency is closest to, measured in
// cents so octave errors don't pick a silly neighbour.
function nearestString(freq) {
  let best = null;
  for (const s of T.STRINGS) {
    const cents = Math.abs(T.centsOff(freq, s.freq));
    if (!best || cents < best.cents) best = { string: s, cents };
  }
  return best;
}

function rmsOf(buffer) {
  let sum = 0;
  for (let i = 0; i < buffer.length; i++) sum += buffer[i] * buffer[i];
  return Math.sqrt(sum / buffer.length);
}

const tuner = { mic: null, analyser: null, timer: null, buffer: null };

function tunerRunning() {
  return !!tuner.timer;
}

function paintTunerIdle(message) {
  const note = el('tuner-note');
  const detail = el('tuner-detail');
  const needle = el('tuner-needle');
  if (note) note.textContent = '—';
  if (detail) detail.textContent = message || '';
  if (needle) needle.style.left = '50%';
  const meter = el('tuner-meter');
  if (meter) meter.dataset.state = 'idle';
}

function readTuner() {
  if (!tuner.analyser || !tuner.buffer) return;
  tuner.analyser.getFloatTimeDomainData(tuner.buffer);

  if (rmsOf(tuner.buffer) < TUNER_SILENCE_RMS) {
    paintTunerIdle('Play a single open string.');
    return;
  }

  const freq = T.autoCorrelate(tuner.buffer, tuner.mic.ctx.sampleRate);
  if (!(freq > 0)) {
    paintTunerIdle('Let one string ring on its own.');
    return;
  }

  const match = nearestString(freq);
  const verdict = T.tuneVerdict(freq, match.string.freq);
  const note = el('tuner-note');
  const detail = el('tuner-detail');
  const needle = el('tuner-needle');
  const meter = el('tuner-meter');

  if (note) note.textContent = match.string.name;
  if (detail) detail.textContent = verdict.label + ' · ' + Math.round(freq) + ' Hz';
  if (meter) meter.dataset.state = verdict.state;
  if (needle) {
    // -50..+50 cents mapped across the meter; clamped so a wildly wrong
    // string pins to an edge instead of sliding out of the box.
    const pct = 50 + T.clampNeedle(verdict.cents);
    needle.style.left = pct + '%';
  }
}

async function startTuner() {
  if (tunerRunning()) return;
  const status = el('listen-mic-status');
  const button = el('tuner-toggle');
  if (status) status.textContent = 'Asking for the microphone…';
  if (button) button.disabled = true;

  try {
    tuner.mic = await openMic();
    tuner.analyser = tuner.mic.ctx.createAnalyser();
    // 2048 samples is ~46ms at 44.1kHz — several periods of even the low E
    // string (82Hz), which is what autoCorrelate needs to lock on.
    tuner.analyser.fftSize = 2048;
    tuner.buffer = new Float32Array(tuner.analyser.fftSize);
    tuner.mic.source.connect(tuner.analyser);
    // Deliberately NOT connected to ctx.destination: routing the mic to the
    // speakers would feed back through the guitar's own pickup of the room.
    tuner.timer = setInterval(readTuner, TUNER_INTERVAL_MS);
    if (status) status.textContent = 'Listening. Audio stays on your device.';
    if (button) { button.textContent = 'Stop tuning'; button.disabled = false; }
    paintTunerIdle('Play a single open string.');
  } catch (err) {
    stopTuner();
    if (status) status.textContent = micErrorText(err);
    if (button) { button.textContent = 'Start tuning'; button.disabled = false; }
  }
}

function stopTuner() {
  if (tuner.timer) clearInterval(tuner.timer);
  tuner.timer = null;
  tuner.analyser = null;
  tuner.buffer = null;
  closeMic(tuner.mic);
  tuner.mic = null;
  const button = el('tuner-toggle');
  if (button) { button.textContent = 'Start tuning'; button.disabled = false; }
  paintTunerIdle('');
}

// --- chord check -----------------------------------------------------------

// Every chord shape the lesson catalog defines, keyed by name. Read straight
// off the loaded lessons' `chords` blocks, which carry a qa_status and are the
// project's verified source for fret shapes — never invented here.
function chordCatalog() {
  const lessons = (window.__APP__ && window.__APP__.CATALOG && window.__APP__.CATALOG.lessons) || [];
  const out = [];
  const seen = new Set();
  for (const entry of lessons) {
    // app.js stores each lesson as {id, title, raw}; the lesson shell keeps
    // the parsed JSON itself. Accept either rather than depending on which
    // populated the catalog first.
    const chords = (entry && entry.chords) || (entry && entry.raw && entry.raw.chords);
    if (!chords || typeof chords !== 'object') continue;
    for (const key of Object.keys(chords)) {
      if (key.startsWith('_')) continue; // `_schema`, not a chord
      const entry = chords[key];
      if (!entry || !Array.isArray(entry.frets) || entry.frets.length !== 6) continue;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ key, name: entry.name || key, frets: entry.frets });
    }
  }
  return out;
}

let chordListening = false;

function paintChordVerdict(result) {
  const box = el('chord-verdict');
  const heard = el('chord-heard');
  if (!box) return;
  box.dataset.verdict = result.verdict;
  const lead = result.verdict === 'pass' ? '✓ ' : (result.verdict === 'fail' ? '⚠ ' : '');
  box.textContent = lead + result.msg;
  if (heard) {
    heard.textContent = (result.heard && result.heard.length)
      ? 'Heard: ' + result.heard.join(', ')
      : '';
  }
}

// Capture a fixed span of contiguous audio and hand it to verifyChord.
//
// ScriptProcessorNode is deprecated, and used anyway: the chord math needs one
// unbroken ~0.6s buffer, and an AnalyserNode only ever exposes its last frame
// (~46ms), so stitching windows would leave gaps the DFT would smear. The
// modern replacement is an AudioWorklet, which needs its own module file and a
// message channel; this is the same node the proven prototype player used, and
// it is supported everywhere the app runs today.
function captureChord(mic, seconds) {
  return new Promise((resolve, reject) => {
    const needed = Math.floor(mic.ctx.sampleRate * seconds);
    const collected = new Float32Array(needed);
    let filled = 0;
    const processor = mic.ctx.createScriptProcessor(4096, 1, 1);

    const finish = (fn, arg) => {
      processor.onaudioprocess = null;
      try { processor.disconnect(); } catch (e) { /* already torn down */ }
      fn(arg);
    };

    const timeout = setTimeout(() => {
      finish(reject, new Error('The microphone stopped sending audio.'));
    }, Math.max(4000, seconds * 4000));

    processor.onaudioprocess = (event) => {
      const channel = event.inputBuffer.getChannelData(0);
      for (let i = 0; i < channel.length && filled < needed; i++) {
        collected[filled++] = channel[i];
      }
      if (filled >= needed) {
        clearTimeout(timeout);
        finish(resolve, collected);
      }
    };

    mic.source.connect(processor);
    // ScriptProcessorNode only fires while it has a downstream connection.
    // A zero-gain node keeps it pulling without putting the mic on the
    // speakers, which would feed back.
    const mute = mic.ctx.createGain();
    mute.gain.value = 0;
    processor.connect(mute);
    mute.connect(mic.ctx.destination);
  });
}

async function runChordCheck() {
  if (chordListening) return;
  const select = el('chord-select');
  const button = el('chord-listen');
  const status = el('listen-mic-status');
  const heard = el('chord-heard');
  const box = el('chord-verdict');
  if (!select || !select.value) return;

  const chord = chordCatalog().find((c) => c.key === select.value);
  if (!chord) return;

  chordListening = true;
  if (button) { button.disabled = true; button.textContent = 'Listening…'; }
  if (box) { box.dataset.verdict = ''; box.textContent = 'Strum it now, and let it ring.'; }
  if (heard) heard.textContent = '';

  let mic = null;
  try {
    mic = await openMic();
    if (status) status.textContent = 'Listening. Audio stays on your device.';
    const buffer = await captureChord(mic, CHORD_CAPTURE_SECONDS);
    const result = verifyChord(buffer, mic.ctx.sampleRate, chord.frets);
    paintChordVerdict(result);
    if (status) status.textContent = '';
  } catch (err) {
    if (box) { box.dataset.verdict = 'unsure'; box.textContent = micErrorText(err); }
  } finally {
    closeMic(mic);
    chordListening = false;
    if (button) { button.disabled = false; button.textContent = 'Listen'; }
  }
}

function renderChordOptions() {
  const select = el('chord-select');
  const button = el('chord-listen');
  if (!select) return;
  const catalog = chordCatalog();
  const previous = select.value;
  select.textContent = '';
  for (const chord of catalog) {
    const option = document.createElement('option');
    option.value = chord.key;
    option.textContent = chord.name;
    select.appendChild(option);
  }
  if (previous && catalog.some((c) => c.key === previous)) select.value = previous;
  const empty = catalog.length === 0;
  select.disabled = empty;
  if (button) button.disabled = empty;
  const note = el('chord-empty-note');
  if (note) note.hidden = !empty;
}

// --- view wiring -----------------------------------------------------------

export function openListenView() {
  const home = el('home-view');
  const view = el('listen-view');
  if (!home || !view) return;
  home.hidden = true;
  view.hidden = false;
  renderChordOptions();
  paintTunerIdle('');
  const status = el('listen-mic-status');
  if (status) status.textContent = '';
  window.scrollTo(0, 0);
}

export function closeListenView() {
  // Always release the mic on the way out. A tuner left running behind a
  // hidden view keeps the browser's recording indicator lit, which reads as
  // the app listening to the room after the student has walked away.
  stopTuner();
  const home = el('home-view');
  const view = el('listen-view');
  if (view) view.hidden = true;
  if (home) home.hidden = false;
  window.scrollTo(0, 0);
}

export function mountListenView() {
  const open = el('start-listen');
  const back = el('listen-back-home');
  const toggle = el('tuner-toggle');
  const listen = el('chord-listen');

  if (open) open.addEventListener('click', openListenView);
  if (back) back.addEventListener('click', closeListenView);
  if (toggle) toggle.addEventListener('click', function () {
    if (tunerRunning()) stopTuner(); else startTuner();
  });
  if (listen) listen.addEventListener('click', runChordCheck);

  // The lesson catalog loads asynchronously, so the chord list may be empty
  // when this runs. Re-render once it lands; openListenView re-renders too.
  window.addEventListener('guitarapp:lessons-loaded', renderChordOptions);
}

if (typeof window !== 'undefined') {
  window.GuitarApp = window.GuitarApp || {};
  window.GuitarApp.ListenView = {
    mountListenView,
    openListenView,
    closeListenView,
    chordCatalog,
    nearestString,
  };
}

export default { mountListenView, openListenView, closeListenView, chordCatalog, nearestString };
