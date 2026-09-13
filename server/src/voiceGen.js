// voiceGen.js — thin client for fal.ai's hosted Kokoro TTS model. This is
// Wave 5's server-side half (TIER-1B 5A): it takes prose text Sage has
// already generated (chatEngine.js's askCoach()/coachHandler.js's `prose`,
// already shown to the student as text) and returns a synthesized spoken
// version's URL. Text only ever flows in this direction — this module never
// calls the Anthropic model itself, it only speaks text callers already have.
//
// --- Backend choice (2026-09-10, see docs/plans/TIER-1B-close-the-gaps.md
// Wave 5) ---
// fal.ai was checked first, same account already used for jam session's
// ACE-Step generation (musicGen.js) and the World 1 fal.ai build — turned
// out to host Kokoro TTS directly, so no new provider/key was needed:
//
//   - Model: `fal-ai/kokoro` — text -> speech.
//   - Voice: `af_heart` (default here) — the exact voice already used for
//     the 61 pre-recorded lesson narration clips fixed in Wave 1B, so
//     Sage's scripted lines and live spoken answers sound like the same
//     person. 20 voices are available from fal.ai's Kokoro model if a
//     voice override is ever wanted (af_alloy, af_bella, am_adam, ...).
//   - Live test call, 2026-09-10 (see server/README.md's "Coach voice"
//     section for the full request/response transcript): POST
//     https://queue.fal.run/fal-ai/kokoro -> HTTP 200 IN_QUEUE -> polled
//     /status -> COMPLETED (~2s) -> GET the result -> real `audio.url` (a
//     .wav) -> HEAD on that URL -> HTTP 200, Content-Type audio/wav. Real
//     audio, not mocked.
//   - Cost: $0.02 / 1000 characters (fal's own pricing page) — a typical
//     coaching answer (a few hundred characters) costs a fraction of a cent.
//
// --- fal's queue API contract (async) ---
// Same submit -> poll -> fetch-result shape musicGen.js already uses for
// ACE-Step (itself reimplementing fal_stage2.py's pattern for this Node
// service):
//   1. POST  https://queue.fal.run/{model}                       -> {status, status_url, response_url}
//   2. GET   {status_url}, poll until status === 'COMPLETED'
//   3. GET   {response_url}                                      -> the model's real output JSON

import {
  FAL_KEY,
  FAL_KOKORO_MODEL,
  FAL_KOKORO_VOICE,
  FAL_TTS_POLL_INTERVAL_MS,
  FAL_TTS_POLL_TIMEOUT_MS,
} from './config.js';
// FAL_KOKORO_VOICE_SAGE is read via a namespace import rather than a named
// one: voiceGen.test.mjs's existing "FAL_KEY unset" test (child process,
// --experimental-test-module-mocks) mocks config.js with an exports object
// that predates this constant, and a static named import of a binding the
// mock doesn't provide is a hard SyntaxError at module load — it would break
// that existing test, which this ticket's file-ownership list doesn't allow
// editing. A namespace property read simply comes back undefined when
// absent, so this stays additive/back-compatible with that mock.
import * as configNS from './config.js';
const FAL_KOKORO_VOICE_SAGE = configNS.FAL_KOKORO_VOICE_SAGE;

// Named speaker -> voice ID lookup, additive to the raw `voice` override
// generateSpeech() already accepted. Lets callers ask for "sage" without
// having to import/know the specific fal.ai voice ID constant. Only 'sage'
// exists today (this ticket's scope); other teachers keep using the default
// FAL_KOKORO_VOICE (af_heart) via the existing plain `voice` override, or no
// override at all.
const SPEAKER_VOICES = {
  sage: FAL_KOKORO_VOICE_SAGE,
};

const QUEUE_BASE = 'https://queue.fal.run';

/** Thrown when FAL_KEY is unset. The route must fail clearly, never silently stub audio. */
export class VoiceGenConfigError extends Error {
  constructor(message = 'FAL_KEY is not set — cannot call fal.ai') {
    super(message);
    this.name = 'VoiceGenConfigError';
    this.code = 'VOICEGEN_CONFIG_MISSING';
  }
}

/** Thrown when fal.ai itself fails, times out, or returns a shape we don't recognize. */
export class VoiceGenError extends Error {
  constructor(message, { cause } = {}) {
    super(message);
    this.name = 'VoiceGenError';
    this.code = 'VOICEGEN_UPSTREAM_FAILED';
    if (cause) this.cause = cause;
  }
}

function authHeaders() {
  if (!FAL_KEY) throw new VoiceGenConfigError();
  return { Authorization: `Key ${FAL_KEY}`, 'Content-Type': 'application/json' };
}

async function submit(text, voice) {
  let res;
  try {
    res = await fetch(`${QUEUE_BASE}/${FAL_KOKORO_MODEL}`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ prompt: text, voice }),
    });
  } catch (err) {
    throw new VoiceGenError(`fal kokoro submit request failed: ${err.message}`, { cause: err });
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new VoiceGenError(`fal kokoro submit failed: HTTP ${res.status} ${body}`);
  }
  let body;
  try {
    body = await res.json();
  } catch (err) {
    throw new VoiceGenError(`fal kokoro submit returned invalid JSON: ${err.message}`, { cause: err });
  }
  return body;
}

async function pollUntilComplete(statusUrl) {
  const deadline = Date.now() + FAL_TTS_POLL_TIMEOUT_MS;
  while (Date.now() < deadline) {
    let res;
    try {
      res = await fetch(statusUrl, { headers: authHeaders() });
    } catch (err) {
      throw new VoiceGenError(`fal kokoro status request failed: ${err.message}`, { cause: err });
    }
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new VoiceGenError(`fal kokoro status check failed: HTTP ${res.status} ${body}`);
    }
    let status;
    try {
      status = await res.json();
    } catch (err) {
      throw new VoiceGenError(`fal kokoro status returned invalid JSON: ${err.message}`, { cause: err });
    }
    if (status.status === 'COMPLETED') return status;
    if (status.status === 'ERROR' || status.status === 'FAILED') {
      throw new VoiceGenError(`fal kokoro generation failed: ${JSON.stringify(status)}`);
    }
    await new Promise((resolve) => setTimeout(resolve, FAL_TTS_POLL_INTERVAL_MS));
  }
  throw new VoiceGenError(`fal kokoro generation did not complete within ${FAL_TTS_POLL_TIMEOUT_MS}ms`);
}

/**
 * generateSpeech(text, opts?) -> { audioUrl }
 *
 * @param {string} text The already-generated coaching prose to speak. This
 *   function never calls the Anthropic model — it only synthesizes speech
 *   for text the caller already has.
 * @param {{voice?: string, speaker?: 'sage'}} [opts] Optional voice
 *   override. Defaults to FAL_KOKORO_VOICE ('af_heart' — the same voice used
 *   for the app's pre-recorded lesson narration by other teachers); that
 *   default is unchanged by this option. Pass an explicit fal.ai voice ID
 *   via `voice` (e.g. 'am_adam'), or the shorthand `speaker: 'sage'` to get
 *   Sage's male voice (FAL_KOKORO_VOICE_SAGE) without needing to know its
 *   raw voice ID. If both are given, `voice` wins.
 * @returns {Promise<{audioUrl: string}>}
 * @throws {VoiceGenConfigError} if FAL_KEY is unset.
 * @throws {VoiceGenError} if fal.ai fails, times out, or returns an
 *   unrecognized shape. Never fabricates a fallback audioUrl.
 */
export async function generateSpeech(text, { voice, speaker } = {}) {
  if (!FAL_KEY) throw new VoiceGenConfigError();

  const resolvedVoice = voice || (speaker && SPEAKER_VOICES[speaker]) || FAL_KOKORO_VOICE;

  const submitted = await submit(text, resolvedVoice);
  const { status_url: statusUrl, response_url: responseUrl } = submitted || {};
  if (!statusUrl || !responseUrl) {
    throw new VoiceGenError(`fal kokoro submit returned no status_url/response_url: ${JSON.stringify(submitted)}`);
  }

  await pollUntilComplete(statusUrl);

  let res;
  try {
    res = await fetch(responseUrl, { headers: authHeaders() });
  } catch (err) {
    throw new VoiceGenError(`fal kokoro result fetch failed: ${err.message}`, { cause: err });
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new VoiceGenError(`fal kokoro result fetch failed: HTTP ${res.status} ${body}`);
  }
  let result;
  try {
    result = await res.json();
  } catch (err) {
    throw new VoiceGenError(`fal kokoro result returned invalid JSON: ${err.message}`, { cause: err });
  }
  const audioUrl = result && result.audio && result.audio.url;
  if (!audioUrl) {
    throw new VoiceGenError(`fal kokoro result had no audio.url: ${JSON.stringify(result)}`);
  }
  return { audioUrl };
}

export default { generateSpeech, VoiceGenConfigError, VoiceGenError, SPEAKER_VOICES };
