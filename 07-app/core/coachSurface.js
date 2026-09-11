// coachSurface.js — Wave 1 task C: coach envelope assembly + minimal coach
// entry point.
//
// Rule 5: this module NEVER invents or synthesizes a field. It only ever
// copies values that were literally present on its inputs, whitelisted down
// to exactly the shape server/src/schema.js's validateFactsEnvelope()
// accepts (read directly from that file, not guessed):
//   { anonId, learnerProfile: {ageBand, experience, goal, minutesPerDay},
//     lessonId, stepId, mastery: [{chord, label, confidence}],
//     justHappened: {drillId, passed, score, ratePerMin} | null,
//     recentHistory: [{lessonId, completedAt, confidenceDelta}] }
//
// The verified chord shapes the open lesson teaches, taken off that lesson's
// own `chords` block. Facts about the page, not about the student, and the
// reason server-side guardrail.js will let Sage name Em to a beginner who has
// no recorded number for it yet — and the reason Sage states the real
// fingering instead of guessing one. Same fail-safe posture as everything
// else here: anything malformed is dropped, and bad input yields [] rather
// than throwing.
function pickFretArray(raw) {
  if (!Array.isArray(raw) || raw.length !== 6) return null;
  const out = [];
  for (const v of raw) {
    if (v === null) { out.push(null); continue; }
    if (typeof v !== 'number' || !Number.isInteger(v) || v < 0 || v > 24) return null;
    out.push(v);
  }
  return out;
}

function pickLessonChords(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  const seen = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue;
    const name = typeof entry.chord === 'string' ? entry.chord.trim() : '';
    if (!name || name.length > 12) continue;
    if (seen.indexOf(name) !== -1) continue;
    seen.push(name);
    const shape = { chord: name };
    const frets = pickFretArray(entry.frets);
    if (frets) shape.frets = frets;
    const fingers = pickFretArray(entry.fingers);
    if (fingers) shape.fingers = fingers;
    out.push(shape);
    if (out.length >= 24) break;
  }
  return out;
}

// buildCoachEnvelope() accepts {anonId, learnerProfile, lessonId, mastery,
// justHappened, recentHistory}. anonId is picked through verbatim when it's
// a non-empty string within server/src/schema.js's MAX_ANON_ID_LEN (128
// chars) — never generated here; callers source it from telemetry.js's
// getAnonId() (the same stable per-device id already used for event
// logging). When the caller passes no anonId (or an invalid one), it's
// simply omitted — same fail-safe posture as every other field — and the
// server's schema rejects the request as missing `anonId`, so askCoach
// degrades to the local template, same as before this was wired up.
//
// Fixed 2026-09-07: previously this signature had no anonId parameter at
// all, so every request from any caller (practice screen, lesson screen)
// was rejected by the server and silently fell back to template prose. See
// docs/plans/STATUS.md's Wave 6 close-out notes.
//
// mastery is on a 0-100 confidence scale (see adaptivePlan.js's
// CONFIDENCE_FLOOR=60) — never rescaled to 0-1 here.
//
// Malformed/missing input (mastery not an array, justHappened not an
// object, etc.) must never throw: buildCoachEnvelope degrades to a safe,
// empty-but-well-typed envelope for that field instead.

import { askCoach } from './chatEngine.js';

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function pickLearnerProfile(raw) {
  if (!isPlainObject(raw)) return undefined;
  const out = {};
  if (typeof raw.ageBand === 'string') out.ageBand = raw.ageBand;
  if (typeof raw.experience === 'string') out.experience = raw.experience;
  if (typeof raw.goal === 'string') out.goal = raw.goal;
  if (typeof raw.minutesPerDay === 'number') out.minutesPerDay = raw.minutesPerDay;
  return out;
}

function pickMasteryItem(raw) {
  if (!isPlainObject(raw)) return null;
  const out = {};
  let ok = false;
  if (typeof raw.chord === 'string') { out.chord = raw.chord; ok = true; }
  if (typeof raw.label === 'string') { out.label = raw.label; ok = true; }
  if (typeof raw.confidence === 'number' && Number.isFinite(raw.confidence)) {
    out.confidence = raw.confidence;
    ok = true;
  }
  return ok ? out : null;
}

function pickMastery(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (const item of raw) {
    const v = pickMasteryItem(item);
    if (v) out.push(v);
  }
  return out;
}

function pickJustHappened(raw) {
  if (!isPlainObject(raw)) return null;
  const out = {};
  if (typeof raw.drillId === 'string') out.drillId = raw.drillId;
  if (typeof raw.passed === 'boolean') out.passed = raw.passed;
  if (typeof raw.score === 'number' && Number.isFinite(raw.score)) out.score = raw.score;
  if (typeof raw.ratePerMin === 'number' && Number.isFinite(raw.ratePerMin)) out.ratePerMin = raw.ratePerMin;
  return Object.keys(out).length ? out : null;
}

function pickHistoryItem(raw) {
  if (!isPlainObject(raw)) return null;
  const out = {};
  if (typeof raw.lessonId === 'string') out.lessonId = raw.lessonId;
  if (typeof raw.completedAt === 'string') out.completedAt = raw.completedAt;
  if (typeof raw.confidenceDelta === 'number' && Number.isFinite(raw.confidenceDelta)) out.confidenceDelta = raw.confidenceDelta;
  return out;
}

function pickRecentHistory(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (const item of raw) {
    const v = pickHistoryItem(item);
    if (v) out.push(v);
  }
  return out;
}

// server/src/schema.js's MAX_ANON_ID_LEN — duplicated here (not imported)
// because the server is deployed independently from this static client
// bundle and shares no code across that boundary (see server/README.md).
const MAX_ANON_ID_LEN = 128;

function pickAnonId(raw) {
  return (typeof raw === 'string' && raw.length > 0 && raw.length <= MAX_ANON_ID_LEN) ? raw : undefined;
}

// server/src/schema.js's MAX_QUESTION_LEN — duplicated here for the same
// reason MAX_ANON_ID_LEN is (no shared code across the client/server
// boundary). Trimmed and length-checked but never rewritten: the student's
// own words are what the server quotes to the model, so altering them here
// would change the question being answered. Over-length input is dropped
// rather than truncated, which degrades to the ordinary no-question call —
// the same fail-safe posture as every other field on this envelope.
const MAX_QUESTION_LEN = 300;

function pickQuestion(raw) {
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  return (trimmed.length > 0 && trimmed.length <= MAX_QUESTION_LEN) ? trimmed : undefined;
}

// buildCoachEnvelope — pure, never throws. Assembles exactly the facts
// envelope shape server/src/schema.js validates, passing through only
// fields literally present on the input. Never invents a field.
export function buildCoachEnvelope({ anonId, learnerProfile, lessonId, lessonChords, mastery, justHappened, recentHistory, question } = {}) {
  const envelope = {};

  const id = pickAnonId(anonId);
  if (id) envelope.anonId = id;

  const lp = pickLearnerProfile(learnerProfile);
  if (lp) envelope.learnerProfile = lp;

  if (typeof lessonId === 'string') envelope.lessonId = lessonId;

  const q = pickQuestion(question);
  if (q) envelope.question = q;

  envelope.lessonChords = pickLessonChords(lessonChords);

  envelope.mastery = pickMastery(mastery);

  const jh = pickJustHappened(justHappened);
  if (jh) envelope.justHappened = jh;

  envelope.recentHistory = pickRecentHistory(recentHistory);

  return envelope;
}

// getCoachMessage — calls chatEngine.js's askCoach(envelope, localTemplate, {})
// and returns just {text, source}. Never throws: askCoach itself never
// throws (coachClient swallows all network/parse errors) and falls back to
// localTemplate whenever the service is unreachable/errors/times out.
export async function getCoachMessage(envelope, localTemplate) {
  const result = await askCoach(envelope, localTemplate, {});
  return { text: result.text, source: result.source };
}

// ---------------------------------------------------------------------------
// TIER-1B Wave 5, task 5B — "Sage speaks" client wiring.
//
// speakText() calls the /coach/speak route 5A built (server/src/voiceGen.js,
// server/src/router.js). It never regenerates or rewords the text it's
// given: the caller passes exactly the prose already rendered on screen
// (chatEngine.js's askCoach()/coachClient() already produced it; this only
// synthesizes speech for it), and returns the real generated audio URL.
//
// createSpeakControl() is the shared tap-to-play button both coach surfaces
// (lesson-runner.js's lesson chat, drillRunner.js's practice screen) use for
// every rendered coach answer. Built once here, per the task doc's own
// invitation ("if there's an obvious place to share this logic... you may
// add it to coachSurface.js instead of duplicating it"), because both
// surfaces need byte-identical behavior and CSS class names — the CSS added
// to 07-app/index.html for this control targets these exact classes, so two
// independent implementations would risk the two surfaces visibly
// diverging over time. This is the first DOM-touching code in this file;
// everything above stays pure data assembly.
// ---------------------------------------------------------------------------

// Where the coach service's voice route lives. Resolved the SAME way
// jamSession.js's defaultJamSessionUrl() resolves its own sibling route off
// chatEngine.js's defaultCoachUrl() (read as this task's named pattern
// reference): a deployment sets globalThis.GUITARAPP_COACH_URL to the
// /coach endpoint, and this derives /coach/speak on the same origin rather
// than assuming a bare hostname, so it keeps working under the exact same
// deployment configuration with zero extra wiring. Local development (no
// GUITARAPP_COACH_URL set) falls back to the loopback address the server
// listens on by default (server/src/config.js's PORT default, 8787), same
// as chatEngine.js's FALLBACK_COACH_URL and jamSession.js's
// FALLBACK_JAM_SESSION_URL.
const FALLBACK_SPEAK_URL = 'http://127.0.0.1:8787/coach/speak';

export function defaultSpeakUrl() {
  const configured = (typeof globalThis !== 'undefined') ? globalThis.GUITARAPP_COACH_URL : null;
  if (typeof configured === 'string' && configured) {
    // GUITARAPP_COACH_URL is documented (chatEngine.js) as pointing at the
    // coach service's /coach endpoint; swap that path for this route's own
    // rather than assuming callers set a bare origin. Identical regex to
    // jamSession.js's defaultJamSessionUrl().
    return configured.replace(/\/coach\/?$/, '') + '/coach/speak';
  }
  return FALLBACK_SPEAK_URL;
}

// server/src/config.js's FAL_TTS_POLL_TIMEOUT_MS is 60_000 — this
// client-side budget stays above it (plus network round-trip margin), same
// reasoning as jamSession.js's DEFAULT_GEN_TIMEOUT_MS staying above the
// server's FAL_POLL_TIMEOUT_MS: a request the server would have finished
// successfully must never get cut off here first.
const DEFAULT_SPEAK_TIMEOUT_MS = 65_000;

/**
 * Typed error thrown by speakText() on any failure. `.code` is one of:
 *   - SPEAK_INVALID_INPUT      — text isn't a non-empty string (caller bug).
 *   - SPEAK_NO_FETCH           — no fetch implementation in this environment.
 *   - SPEAK_NETWORK_ERROR      — the request itself failed (offline, DNS,
 *     aborted/timed out).
 *   - SPEAK_SERVER_ERROR       — the server responded with a non-200 status.
 *   - SPEAK_MALFORMED_RESPONSE — a 200 body that wasn't valid JSON, or had
 *     no usable `audioUrl`.
 * Mirrors jamSession.js's generateResponse(): a broken speakText() has
 * nothing safe to fall back to (there is no local template for "here is
 * some audio"), so this always throws rather than inventing a fake/empty
 * audioUrl or silently no-op'ing. Callers are expected to catch this and
 * show an honest "couldn't load audio" state — never to hide it.
 */
export class SpeakError extends Error {
  constructor(message, code, { cause, status } = {}) {
    super(message);
    this.name = 'SpeakError';
    this.code = code;
    if (cause) this.cause = cause;
    if (status !== undefined) this.status = status;
  }
}

/**
 * speakText(text, options?) -> Promise<{audioUrl: string}>
 *
 * POSTs already-shown coach prose to /coach/speak and resolves to the real
 * generated audio URL. Never invents a fallback audioUrl: any failure
 * throws a SpeakError (see above).
 *
 * @param {string} text  The exact prose already rendered on screen. Never
 *   regenerated, trimmed of meaning, or reworded here — passed through
 *   verbatim (aside from the emptiness check below).
 * @param {{voice?: string, url?: string, fetchImpl?: Function, timeoutMs?: number}} [options]
 *   Deployment/test seams, same shape as chatEngine.js's coachClient()
 *   options and jamSession.js's generateResponse() options.
 */
export async function speakText(text, options = {}) {
  if (typeof text !== 'string' || !text.trim()) {
    throw new SpeakError('speakText: expected non-empty text', 'SPEAK_INVALID_INPUT');
  }

  const url = options.url || defaultSpeakUrl();
  const timeoutMs = typeof options.timeoutMs === 'number' ? options.timeoutMs : DEFAULT_SPEAK_TIMEOUT_MS;
  const fetchImpl = options.fetchImpl || (typeof fetch === 'function' ? fetch : null);
  if (!fetchImpl) {
    throw new SpeakError('speakText: no fetch implementation available in this environment', 'SPEAK_NO_FETCH');
  }

  const body = JSON.stringify(
    typeof options.voice === 'string' && options.voice ? { text, voice: options.voice } : { text }
  );

  const controller = (typeof AbortController === 'function') ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

  let res;
  try {
    res = await fetchImpl(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      signal: controller ? controller.signal : undefined,
    });
  } catch (err) {
    throw new SpeakError(`speakText: request to ${url} failed: ${err && err.message}`, 'SPEAK_NETWORK_ERROR', { cause: err });
  } finally {
    if (timer) clearTimeout(timer);
  }

  if (!res || !res.ok) {
    let bodyText = '';
    try { bodyText = await res.text(); } catch (e) { /* best-effort only */ }
    throw new SpeakError(
      `speakText: server responded HTTP ${res ? res.status : 'unknown'}${bodyText ? ` — ${bodyText}` : ''}`,
      'SPEAK_SERVER_ERROR',
      { status: res ? res.status : null },
    );
  }

  let data;
  try {
    data = await res.json();
  } catch (err) {
    throw new SpeakError('speakText: server response was not valid JSON', 'SPEAK_MALFORMED_RESPONSE', { cause: err });
  }

  if (!data || typeof data.audioUrl !== 'string' || !data.audioUrl) {
    throw new SpeakError('speakText: server response had no usable audioUrl', 'SPEAK_MALFORMED_RESPONSE');
  }

  return { audioUrl: data.audioUrl };
}

const SPEAK_IDLE_LABEL = '🔊 Play answer';
const SPEAK_REPLAY_LABEL = '🔊 Replay';
const SPEAK_LOADING_LABEL = 'Loading audio…';
const SPEAK_ERROR_LABEL = "Couldn't load audio — tap to retry";

/**
 * createSpeakControl(getText, options?) -> HTMLButtonElement | null
 *
 * Builds one tap-to-play control (never autoplay, per Wave 5's locked
 * decision — nothing plays until this button is actually clicked). Both
 * coach surfaces call this for every rendered coach answer rather than
 * building their own button, so the feature looks and behaves identically
 * on the lesson chat and the practice screen.
 *
 * Non-destructive by construction: this function only ever creates and
 * later mutates the button element it returns. It never touches, and has
 * no reference to, the text node the caller already rendered — a fetch or
 * playback failure inside the control can only ever change *this button's*
 * state (to a "couldn't load audio — tap to retry" label), never the
 * answer text sitting next to it.
 *
 * @param {() => string} getText  Called at click/retry time to read the
 *   exact prose currently on screen. A function rather than a captured
 *   string so a long-lived control (e.g. the practice screen's control,
 *   recreated per answer but conceivably reused) always speaks the CURRENT
 *   text, never a stale closed-over one.
 * @param {{voice?: string, speak?: Function, AudioCtor?: Function}} [options]
 *   `speak` defaults to speakText (test seam); `AudioCtor` defaults to the
 *   global `Audio` (test seam / non-browser environments).
 * @returns {HTMLButtonElement|null} null when `document` doesn't exist
 *   (Node tests) — callers must tolerate that, same fail-safe posture as
 *   every other degrade path in this module.
 */
export function createSpeakControl(getText, options = {}) {
  if (typeof document === 'undefined' || typeof document.createElement !== 'function') return null;

  const speak = typeof options.speak === 'function' ? options.speak : speakText;
  const AudioCtor = options.AudioCtor || (typeof Audio !== 'undefined' ? Audio : null);
  const voice = typeof options.voice === 'string' ? options.voice : undefined;

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'coach-speak-btn';
  button.textContent = SPEAK_IDLE_LABEL;

  let cachedUrl = null;

  function setState(state) {
    button.classList.remove('is-loading', 'is-error', 'is-ready');
    button.disabled = false;
    if (state === 'loading') {
      button.classList.add('is-loading');
      button.disabled = true;
      button.textContent = SPEAK_LOADING_LABEL;
    } else if (state === 'error') {
      button.classList.add('is-error');
      button.textContent = SPEAK_ERROR_LABEL;
    } else if (state === 'ready') {
      button.classList.add('is-ready');
      button.textContent = SPEAK_REPLAY_LABEL;
    } else {
      button.textContent = SPEAK_IDLE_LABEL;
    }
  }

  function playAudio(url) {
    if (!AudioCtor) return;
    try {
      const audio = new AudioCtor(url);
      const p = audio.play();
      // A blocked/failed *playback* (a strict autoplay policy even on a
      // real click, a decode hiccup, ...) is not the same failure as a
      // failed *fetch* above: the real audioUrl was already obtained, so
      // this is swallowed rather than flipped to the error state. The
      // button already shows "Replay" either way.
      if (p && typeof p.catch === 'function') p.catch(() => {});
    } catch (e) { /* non-fatal, see above */ }
  }

  async function handleClick() {
    if (button.disabled) return;
    const text = typeof getText === 'function' ? getText() : getText;
    if (typeof text !== 'string' || !text.trim()) return;

    if (cachedUrl) { playAudio(cachedUrl); return; }

    setState('loading');
    try {
      const result = await speak(text, voice ? { voice } : {});
      const audioUrl = result && result.audioUrl;
      if (typeof audioUrl !== 'string' || !audioUrl) {
        throw new Error('speak() resolved with no audioUrl');
      }
      cachedUrl = audioUrl;
      setState('ready');
      playAudio(cachedUrl);
    } catch (e) {
      setState('error'); // honest failure state; the text answer next to this button is untouched.
    }
  }

  button.addEventListener('click', handleClick);
  return button;
}

/**
 * mountSpeakControlAfter(anchorEl, id, getText, options?) -> HTMLButtonElement | null
 *
 * Small DOM-glue wrapper around createSpeakControl(): removes any earlier
 * control sharing `id` (so a fresh answer never keeps a stale control's
 * cached audio/error state), creates a new one, gives it `id`, and inserts
 * it immediately after `anchorEl`. Shared by both coach surfaces for the
 * same reason createSpeakControl() itself is shared — identical mount
 * behavior, not two hand-rolled copies.
 *
 * @returns {HTMLButtonElement|null} null under a non-DOM environment or
 *   when `anchorEl` isn't attached — never throws.
 */
export function mountSpeakControlAfter(anchorEl, id, getText, options) {
  if (typeof document === 'undefined' || !anchorEl || !anchorEl.parentNode) return null;
  const old = document.getElementById(id);
  if (old && old.parentNode) old.parentNode.removeChild(old);
  const control = createSpeakControl(getText, options);
  if (!control) return null;
  control.id = id;
  anchorEl.insertAdjacentElement('afterend', control);
  return control;
}

export default {
  buildCoachEnvelope,
  getCoachMessage,
  speakText,
  SpeakError,
  defaultSpeakUrl,
  createSpeakControl,
  mountSpeakControlAfter,
};
