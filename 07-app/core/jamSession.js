// jamSession.js — V2-JAM call-and-response jam session (A4.2).
//
// UNBLOCKED 2026-09-10 (TIER-1B, Wave 3). This file previously described
// generateResponse() as BLOCKED pending a cloud GPU. That is no longer true:
// server/src/musicGen.js (Wave 3A) is a real, verified client for fal.ai's
// hosted ACE-Step model, wired in at POST /jam-session/generate
// (server/src/router.js), and this file's generateResponse() (Wave 3B, below)
// makes a real fetch call to that route. A live round trip has produced real,
// fetchable audio/wav (see server/README.md's "Jam session generation"
// section for the full request/response transcript). No GPU/RunPod is
// involved — fal.ai is a managed per-request API — and no client-side stub
// or fake audioUrl remains.
//
// PART A (ON-DEVICE — no mic needed to grade a supplied phrase):
//   gradeStudentPhrase(heardChords, knownChords): chord-name arithmetic grading.
//   emitFacts(grade): facts-to-cloud payload. Audio NEVER leaves the device
//                     (AMENDMENT-05 — "The App That Listens"). Only facts are sent.
//
// PART B (GENERATIVE — real, server-backed):
//   generateResponse(facts): POSTs the emitFacts()-shaped payload to the coach
//   service's /jam-session/generate route and returns the real generated
//   { audioUrl } fal.ai hands back. Never invents/fakes an audioUrl: any
//   network error, non-200 response, or malformed body throws a clear typed
//   error instead (same "never invents, fails safe" posture as
//   coachSurface.js/chatEngine.js's coach call).
//
// Chord vocabulary (root + quality) is aligned with 07-app/core/chord-theory-check.js
// (KNOWN_QUALITY_TOKEN). Grading is pure label arithmetic — no audio inference engine
// and no live microphone are required for PART A.

// ---------------------------------------------------------------------------
// Chord-name arithmetic helpers (no mic, no audio inference)
// ---------------------------------------------------------------------------

// Fold minor aliases the same way chord-theory-check tokenizes them.
const MINOR_ALIAS = { min: 'm' };
// Root = A-G optionally followed by # or b (e.g. "C", "F#", "Bb").
const ROOT_RE = /^([A-Ga-g][#b]?)/;

/**
 * normalizeChord(name) -> canonical chord label string.
 *   "C"   -> "C"
 *   "Em"  -> "Em"
 *   "cmin"-> "Cm"
 *   "AM"  -> "Am"
 * Used so grading compares chord identities, not string casing/spelling.
 */
export function normalizeChord(name) {
  if (typeof name !== 'string') return '';
  const s = name.trim();
  const m = s.match(ROOT_RE);
  if (!m) return s; // not a recognizable chord label; keep as-is for a fair miss
  const root = m[1].toUpperCase();
  let quality = s.slice(m[1].length).toLowerCase();
  if (MINOR_ALIAS[quality]) quality = MINOR_ALIAS[quality];
  return quality ? root + quality : root;
}

// ---------------------------------------------------------------------------
// PART A — On-device phrase grading
// ---------------------------------------------------------------------------

/**
 * gradeStudentPhrase(heardChords, knownChords)
 *
 * Grades the student's played phrase (a list of chord labels they actually
 * performed) against the lesson's known chord set (the canonical "call").
 *
 * @param {string[]} heardChords - chord labels the student played, in order.
 * @param {string[]} knownChords - chord labels that make up the lesson phrase.
 * @returns {{ matched: string[], missed: string[], accuracy: number }}
 *   matched  : heard chords that belong to the known set (in heard order).
 *   missed   : heard chords that are NOT in the known set (wrong/extra chords).
 *   accuracy : matched.length / known.length, clamped to [0, 1].
 *              (Known set of length 0 -> 0; nothing to match against.)
 *
 * Pure chord-name arithmetic. No audio is read, no mic is touched.
 */
export function gradeStudentPhrase(heardChords, knownChords) {
  const heard = Array.isArray(heardChords) ? heardChords : [];
  const known = Array.isArray(knownChords) ? knownChords : [];
  const knownNorm = known.map(normalizeChord);

  const matched = [];
  const missed = [];
  for (const h of heard) {
    const hn = normalizeChord(h);
    if (knownNorm.includes(hn)) matched.push(hn);
    else missed.push(hn);
  }

  const accuracy = known.length === 0 ? 0 : matched.length / known.length;
  return { matched, missed, accuracy };
}

// ---------------------------------------------------------------------------
// PART A — Facts-to-cloud payload (audio never leaves the device)
// ---------------------------------------------------------------------------

/**
 * emitFacts(grade)
 *
 * Converts an on-device grade into the ONLY thing that travels off the device:
 * a small, audio-free fact object. Per AMENDMENT-05 the raw audio must never be
 * uploaded — this payload is the honest, minimal summary the cloud receives.
 *
 * @param {{ matched: string[], missed: string[], accuracy: number }} grade
 * @returns {{ chordsMatched: string[], chordsMissed: string[], accuracy: number }}
 *   chordsMatched : labels the student got right.
 *   chordsMissed  : labels the student played that weren't in the phrase.
 *   accuracy      : 0..1 grade accuracy.
 *
 * The returned object contains FACTS ONLY — there is deliberately no `audio`,
 * `audioUrl`, `blob`, or any other audio-bearing field.
 */
export function emitFacts(grade) {
  if (!grade || typeof grade !== 'object') {
    throw new Error('emitFacts: expected a grade object from gradeStudentPhrase()');
  }
  const { matched = [], missed = [], accuracy = 0 } = grade;
  return {
    chordsMatched: Array.isArray(matched) ? matched : [],
    chordsMissed: Array.isArray(missed) ? missed : [],
    accuracy: typeof accuracy === 'number' && isFinite(accuracy) ? accuracy : 0,
  };
}

// ---------------------------------------------------------------------------
// PART B — Generative response (REAL — calls the coach service's
// /jam-session/generate route, server/src/router.js -> server/src/musicGen.js
// -> fal.ai's hosted ACE-Step model)
// ---------------------------------------------------------------------------
// Contract:
//   input  : facts  — the object returned by emitFacts() (chordsMatched,
//                     chordsMissed, accuracy). Audio never leaves the device
//                     (AMENDMENT-05) — this is the only thing sent.
//   output : { audioUrl: string }  — URL of a generated musical "response"
//                                    clip that answers the student's phrase
//                                    (the call-and-response "call" -> real
//                                    generated "response").
//
// Mirrors coachSurface.js/chatEngine.js's coachClient() fetch envelope shape
// (options.url/options.fetchImpl/options.timeoutMs, an AbortController-backed
// timeout, JSON body/response handling) with one deliberate difference: that
// coach path degrades silently to a local template on any failure, because a
// missing coach line is harmless. A missing/broken jam-session response has
// nothing safe to fall back to — there is no local template for "here is
// some music" — so this function follows Rule 5's "never invents" posture by
// THROWING a clear, typed error on any failure (network error, non-200, or a
// malformed/missing audioUrl) instead of silently returning a fake or empty
// audioUrl. Callers (jamSessionView.js) are expected to catch this and show
// an honest error state.

// Where the coaching service's jam-session route lives. Resolved the same
// way chatEngine.js's defaultCoachUrl() resolves the /coach URL: a
// deployment sets globalThis.GUITARAPP_COACH_URL (see chatEngine.js) to that
// service's /coach endpoint, and this derives the sibling
// /jam-session/generate route on the same origin rather than assuming a bare
// hostname — so this keeps working under the same deployment configuration
// with zero extra wiring. Local development (no GUITARAPP_COACH_URL set)
// falls back to the loopback address the server listens on by default
// (server/src/config.js's PORT default, 8787), same as chatEngine.js's own
// FALLBACK_COACH_URL.
const FALLBACK_JAM_SESSION_URL = 'http://127.0.0.1:8787/jam-session/generate';

export function defaultJamSessionUrl() {
  const configured = (typeof globalThis !== 'undefined') ? globalThis.GUITARAPP_COACH_URL : null;
  if (typeof configured === 'string' && configured) {
    // GUITARAPP_COACH_URL is documented (chatEngine.js) as pointing at the
    // coach service's /coach endpoint; swap that path for this route's own
    // rather than assuming callers set a bare origin.
    return configured.replace(/\/coach\/?$/, '') + '/jam-session/generate';
  }
  return FALLBACK_JAM_SESSION_URL;
}

// fal.ai's ACE-Step call is an async submit -> poll -> fetch-result round
// trip server-side (server/src/musicGen.js), measured at ~2-4s end-to-end in
// live testing (server/README.md). This client-side budget stays generous —
// well above that measured time plus headroom for real network/queue
// variance — so the service always gets to finish or fail on its own terms
// rather than being cut off from here, same reasoning as chatEngine.js's
// DEFAULT_COACH_TIMEOUT_MS.
const DEFAULT_GEN_TIMEOUT_MS = 45_000;

/**
 * generateResponse(facts)
 *
 * POSTs the emitFacts()-shaped payload to the coach service's
 * /jam-session/generate route and returns the real generated audio URL.
 * Never invents/synthesizes an audioUrl — any failure throws.
 *
 * @param {{ chordsMatched: string[], chordsMissed: string[], accuracy: number }} facts
 * @param {{ url?: string, fetchImpl?: Function, timeoutMs?: number }} [options]
 *   Test/deployment seams, same shape as chatEngine.js's coachClient options.
 * @returns {Promise<{ audioUrl: string }>}
 * @throws {Error} typed via `.code`:
 *   - `GEN_INVALID_INPUT`  — facts isn't an object (caller bug, not a network issue).
 *   - `GEN_NO_FETCH`       — no fetch implementation available in this environment.
 *   - `GEN_NETWORK_ERROR`  — the request itself failed (offline, DNS, aborted/timed out).
 *   - `GEN_SERVER_ERROR`   — the server responded with a non-200 status.
 *   - `GEN_MALFORMED_RESPONSE` — a 200 response whose body isn't valid JSON,
 *     or is valid JSON but has no usable `audioUrl` string.
 */
export async function generateResponse(facts, options = {}) {
  if (!facts || typeof facts !== 'object') {
    const err = new Error('generateResponse: expected a facts object from emitFacts()');
    err.code = 'GEN_INVALID_INPUT';
    throw err;
  }

  const url = options.url || defaultJamSessionUrl();
  const timeoutMs = typeof options.timeoutMs === 'number' ? options.timeoutMs : DEFAULT_GEN_TIMEOUT_MS;
  const fetchImpl = options.fetchImpl || (typeof fetch === 'function' ? fetch : null);
  if (!fetchImpl) {
    const err = new Error('generateResponse: no fetch implementation available in this environment');
    err.code = 'GEN_NO_FETCH';
    throw err;
  }

  // Only ever send the exact facts shape emitFacts() produces — never the
  // raw `facts` object verbatim, so an accidental extra field (e.g. if a
  // caller passed something audio-bearing by mistake) can never leave the
  // device. AMENDMENT-05.
  const body = JSON.stringify({
    chordsMatched: Array.isArray(facts.chordsMatched) ? facts.chordsMatched : [],
    chordsMissed: Array.isArray(facts.chordsMissed) ? facts.chordsMissed : [],
    accuracy: typeof facts.accuracy === 'number' && isFinite(facts.accuracy) ? facts.accuracy : 0,
  });

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
    const wrapped = new Error(`generateResponse: request to ${url} failed: ${err && err.message}`);
    wrapped.code = 'GEN_NETWORK_ERROR';
    wrapped.cause = err;
    throw wrapped;
  } finally {
    if (timer) clearTimeout(timer);
  }

  if (!res || !res.ok) {
    let bodyText = '';
    try { bodyText = await res.text(); } catch (e) { /* best-effort only */ }
    const err = new Error(
      `generateResponse: server responded HTTP ${res ? res.status : 'unknown'}${bodyText ? ` — ${bodyText}` : ''}`,
    );
    err.code = 'GEN_SERVER_ERROR';
    err.status = res ? res.status : null;
    throw err;
  }

  let data;
  try {
    data = await res.json();
  } catch (err) {
    const wrapped = new Error('generateResponse: server response was not valid JSON');
    wrapped.code = 'GEN_MALFORMED_RESPONSE';
    wrapped.cause = err;
    throw wrapped;
  }

  if (!data || typeof data.audioUrl !== 'string' || !data.audioUrl) {
    const err = new Error('generateResponse: server response had no usable audioUrl');
    err.code = 'GEN_MALFORMED_RESPONSE';
    throw err;
  }

  return { audioUrl: data.audioUrl };
}
