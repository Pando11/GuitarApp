// jamSessionView.js — jam session panel for a lesson step.
//
// Why this file exists (2026-09-10, TIER-1B task 3B): jamSession.js's
// PART A (gradeStudentPhrase/emitFacts) has been complete and tested since
// before this task, and PART B (generateResponse) just went from an
// intentional BLOCKED stub to a real call against server/src/musicGen.js's
// verified fal.ai round trip (see jamSession.js's own header comment and
// server/README.md's "Jam session generation" section). Nothing in the
// shipping app imported jamSession.js at all. This is the missing view, not
// new grading/generation logic — every number and every audio URL shown
// here comes straight out of that module, which this file does not modify.
//
// Chord identification reuses 07-app/core/listening-engine.js's
// verifyChord() verbatim — the exact tested function 07-app/core/
// listenView.js's own chord-check panel already calls to answer "is the mic
// hearing chord X cleanly right now?" (see listenView.js's runChordCheck()).
// listenView.js's mic-opening/capture glue (openMic/captureChord) is private
// to that module (not exported, and this task's file-ownership list does not
// include listenView.js), so the minimal Web Audio plumbing below mirrors
// its settings and technique (echoCancellation/noiseSuppression/
// autoGainControl off, the same fixed-window ScriptProcessorNode capture) so
// as not to invent a different one — but the actual chord-detection DSP
// (verifyChord, and everything it calls in listening-engine.js /
// tuner-engine.js) is reused as-is, not duplicated.
//
// AMENDMENT-05 — audio never leaves the device: the captured Float32Array is
// read into memory, handed to verifyChord() locally, and discarded once a
// verdict is painted. Only gradeStudentPhrase()'s -> emitFacts()'s tiny fact
// object ({chordsMatched, chordsMissed, accuracy}) ever crosses the network,
// via jamSession.js's generateResponse() — never a blob, a stream, or a URL
// pointing at the student's own recording.
//
// Rule 5 / real-content discipline: known chords come straight out of the
// lesson's own `chords` block (lessonModel.chords — same field
// lesson-runner.js's normalizeLesson() puts on the model, and the same
// access pattern styleExplorerView.js uses: lessonModel.chords[key].frets,
// filtering out the non-chord `_schema` key). If a lesson has no playable
// chords yet, this renders an honest empty state and nothing else. If the
// student hasn't played (heard) anything yet, this never fabricates a grade
// or a generated response — it shows an honest "play something first"
// prompt and keeps the response button disabled.
//
// Wiring note for whichever wave adds the call site: this module exports a
// pure `mountJamSession(container, lessonModel)` and touches no ids in
// index.html, so it does not collide with lesson-runner.js's own rendering.

import { gradeStudentPhrase, emitFacts, generateResponse } from './jamSession.js';
import { verifyChord } from './listening-engine.js';

// Same as listenView.js's CHORD_CAPTURE_SECONDS: long enough for a strum to
// ring, matching the prototype player that proved the chord math in-browser.
const CAPTURE_SECONDS = 0.6;

// Same as listenView.js's MIC_CONSTRAINTS: all three off on purpose — they
// are tuned for speech and would reshape a guitar's harmonics, which is
// exactly what the pitch detection reads.
const MIC_CONSTRAINTS = {
  audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
};

// ---------------------------------------------------------------------------
// lessonModel.chords access (mirrors styleExplorerView.js's deriveProgression)
// ---------------------------------------------------------------------------
function knownChordList(lessonModel) {
  const chords =
    lessonModel && typeof lessonModel.chords === 'object' && lessonModel.chords !== null
      ? lessonModel.chords
      : {};
  const out = [];
  for (const key of Object.keys(chords)) {
    if (key === '_schema') continue;
    const entry = chords[key];
    if (!entry || !Array.isArray(entry.frets) || entry.frets.length !== 6) continue;
    out.push({ key, name: entry.name || key, frets: entry.frets });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Minimal mic plumbing (mirrors listenView.js's private openMic/captureChord
// — see file header for why this can't just import those).
// ---------------------------------------------------------------------------
function audioContextCtor() {
  if (typeof window === 'undefined') return null;
  return window.AudioContext || window.webkitAudioContext || null;
}

async function openMic() {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices
    || typeof navigator.mediaDevices.getUserMedia !== 'function') {
    throw new Error('This browser has no microphone access.');
  }
  const Ctor = audioContextCtor();
  if (!Ctor) throw new Error('This browser has no Web Audio support.');
  const stream = await navigator.mediaDevices.getUserMedia(MIC_CONSTRAINTS);
  const ctx = new Ctor();
  if (ctx.state === 'suspended' && typeof ctx.resume === 'function') {
    try { await ctx.resume(); } catch (e) { /* fall through; capture will surface it */ }
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

// Captures one fixed window of contiguous audio. Same ScriptProcessorNode
// technique as listenView.js's captureChord() (see that file's comment for
// why ScriptProcessorNode rather than an AnalyserNode/AudioWorklet).
function captureBuffer(mic, seconds) {
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
    // Deliberately not connected to real output: a zero-gain node keeps the
    // ScriptProcessorNode pulling without putting the mic on the speakers
    // (which would feed back through the guitar's own pickup of the room).
    const mute = mic.ctx.createGain();
    mute.gain.value = 0;
    processor.connect(mute);
    mute.connect(mic.ctx.destination);
  });
}

// ---------------------------------------------------------------------------
// mountJamSession(container, lessonModel)
// ---------------------------------------------------------------------------

/**
 * Renders the jam session panel into `container`: a list of the lesson's
 * known chords the student can play into the mic (each verified on-device
 * with listening-engine.js's verifyChord()), a running "heard" phrase, and a
 * "Get a response" action that grades that phrase (gradeStudentPhrase()),
 * builds the audio-free facts payload (emitFacts()), and calls the real
 * generative round trip (jamSession.js's generateResponse()) to play back
 * the server's generated audio clip.
 *
 * @param {Element} container - empty-able host element (its content is replaced)
 * @param {Object} lessonModel - the model produced by lesson-runner.js's
 *   normalizeLesson(); only `lessonModel.chords` is read.
 * @returns {null|{
 *   getKnownChords: () => string[],
 *   getHeardChords: () => string[],
 *   getStatus: () => string,
 * }} null when the lesson has no chords to jam on (honest empty state was
 *   rendered instead); otherwise a small handle for tests/callers.
 */
export function mountJamSession(container, lessonModel) {
  if (!container) return null;
  const doc = container.ownerDocument || (typeof document !== 'undefined' ? document : null);
  if (!doc) return null;

  const knownChords = knownChordList(lessonModel);

  container.innerHTML = '';

  if (!knownChords.length) {
    const empty = doc.createElement('div');
    empty.className = 'jam-session jam-session--empty';
    empty.setAttribute('data-testid', 'jam-session-empty');
    empty.textContent = "This lesson doesn't have a chord yet, so there's nothing to jam on.";
    container.appendChild(empty);
    return null;
  }

  // Chord labels the student has actually played and had confirmed on-device
  // this session — the ONLY source for heardChords. Never seeded with
  // anything else, so gradeStudentPhrase() is always graded against real,
  // locally-verified attempts.
  const heardChords = [];
  let listening = false;
  let generating = false;

  const panel = doc.createElement('div');
  panel.className = 'jam-session';
  panel.setAttribute('data-testid', 'jam-session-panel');

  const heading = doc.createElement('h3');
  heading.className = 'jam-session__heading';
  heading.textContent = 'Jam with Sage';
  panel.appendChild(heading);

  const sub = doc.createElement('p');
  sub.className = 'jam-session__sub';
  sub.textContent = 'Play a chord below. When it rings clean, it joins your phrase — then get a response.';
  panel.appendChild(sub);

  const chordRow = doc.createElement('div');
  chordRow.className = 'jam-session__chords';
  panel.appendChild(chordRow);

  const status = doc.createElement('p');
  status.className = 'jam-session__status';
  status.setAttribute('data-testid', 'jam-session-status');
  status.setAttribute('role', 'status');
  panel.appendChild(status);

  const heardLine = doc.createElement('p');
  heardLine.className = 'jam-session__heard';
  heardLine.setAttribute('data-testid', 'jam-session-heard');
  panel.appendChild(heardLine);

  const respondBtn = doc.createElement('button');
  respondBtn.type = 'button';
  respondBtn.className = 'jam-session__respond';
  respondBtn.setAttribute('data-testid', 'jam-session-respond');
  respondBtn.textContent = 'Get a response';
  panel.appendChild(respondBtn);

  const resultHost = doc.createElement('div');
  resultHost.className = 'jam-session__result';
  resultHost.setAttribute('data-testid', 'jam-session-result');
  panel.appendChild(resultHost);

  const chordButtons = [];

  function setButtonsDisabled(disabled) {
    chordButtons.forEach((b) => { b.disabled = disabled; });
    respondBtn.disabled = disabled || heardChords.length === 0;
  }

  function paintHeard() {
    heardLine.textContent = heardChords.length
      ? 'Heard so far: ' + heardChords.join(', ')
      : "Nothing heard yet — play a chord above first.";
    respondBtn.disabled = listening || generating || heardChords.length === 0;
  }

  async function playChord(chord, btn) {
    if (listening || generating) return;
    listening = true;
    setButtonsDisabled(true);
    status.textContent = 'Listening for ' + chord.name + '… strum it now, and let it ring.';
    resultHost.innerHTML = '';

    let mic = null;
    try {
      mic = await openMic();
      const buffer = await captureBuffer(mic, CAPTURE_SECONDS);
      const verdict = verifyChord(buffer, mic.ctx.sampleRate, chord.frets);
      if (verdict.verdict === 'pass') {
        heardChords.push(chord.key);
        status.textContent = 'Nice — that ' + chord.name + ' rang clean.';
      } else {
        // Honest, real verdict message from verifyChord() itself — never a
        // fabricated pass, and never silently added to the heard phrase.
        status.textContent = verdict.msg || 'Not sure that was clean — try again.';
      }
    } catch (err) {
      status.textContent = micErrorText(err);
    } finally {
      closeMic(mic);
      listening = false;
      setButtonsDisabled(false);
      paintHeard();
    }
  }

  knownChords.forEach((chord) => {
    const btn = doc.createElement('button');
    btn.type = 'button';
    btn.className = 'jam-session__chord-btn';
    btn.setAttribute('data-testid', 'jam-session-chord-' + chord.key);
    btn.textContent = 'Play ' + chord.name;
    btn.addEventListener('click', () => playChord(chord, btn));
    chordButtons.push(btn);
    chordRow.appendChild(btn);
  });

  async function requestResponse() {
    if (listening || generating) return;
    if (heardChords.length === 0) {
      // Never fabricate a grade or a response from nothing real to grade.
      status.textContent = 'Play something first — jam a chord above, then ask for a response.';
      return;
    }

    generating = true;
    setButtonsDisabled(true);
    resultHost.innerHTML = '';
    const loading = doc.createElement('p');
    loading.className = 'jam-session__loading';
    loading.setAttribute('data-testid', 'jam-session-loading');
    loading.textContent = 'Generating a response…';
    resultHost.appendChild(loading);

    try {
      const knownNames = knownChords.map((c) => c.key);
      const grade = gradeStudentPhrase(heardChords, knownNames);
      const facts = emitFacts(grade);
      const { audioUrl } = await generateResponse(facts);

      resultHost.innerHTML = '';
      const summary = doc.createElement('p');
      summary.className = 'jam-session__grade';
      summary.setAttribute('data-testid', 'jam-session-grade');
      summary.textContent = 'Accuracy: ' + Math.round(facts.accuracy * 100) + '%'
        + (facts.chordsMissed.length ? ' · missed: ' + facts.chordsMissed.join(', ') : '');
      resultHost.appendChild(summary);

      const audio = doc.createElement('audio');
      audio.setAttribute('controls', '');
      audio.setAttribute('data-testid', 'jam-session-audio');
      audio.src = audioUrl;
      resultHost.appendChild(audio);
      try { audio.play(); } catch (e) { /* autoplay may be blocked; controls remain */ }

      status.textContent = 'Here’s a response to your phrase.';
    } catch (err) {
      resultHost.innerHTML = '';
      const errorEl = doc.createElement('p');
      errorEl.className = 'jam-session__error';
      errorEl.setAttribute('data-testid', 'jam-session-error');
      errorEl.textContent = 'Could not generate a response: '
        + ((err && err.message) || 'unknown error') + '. Try again in a moment.';
      resultHost.appendChild(errorEl);
      status.textContent = '';
    } finally {
      generating = false;
      setButtonsDisabled(false);
      paintHeard();
    }
  }

  respondBtn.addEventListener('click', requestResponse);

  paintHeard();
  container.appendChild(panel);

  return {
    getKnownChords: () => knownChords.map((c) => c.key),
    getHeardChords: () => heardChords.slice(),
    getStatus: () => status.textContent,
  };
}

export default mountJamSession;
