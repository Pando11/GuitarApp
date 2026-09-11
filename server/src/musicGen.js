// musicGen.js — thin client for fal.ai's hosted ACE-Step model. This is jam
// session's generative half (V2-JAM, A4.2): it takes the audio-free facts
// payload 07-app/core/jamSession.js's emitFacts() produces (chordsMatched,
// chordsMissed, accuracy — audio itself NEVER leaves the device, per
// AMENDMENT-05) and returns a generated instrumental "response" clip's URL.
//
// --- Backend choice (2026-09-10) ---
// fal.ai was checked FIRST, before RunPod, per explicit owner instruction and
// the real prior RunPod failure documented in
// brand-references/worlds/WORLDFACTORY-DIAGNOSIS-2026-08-30.md (a stale
// hardcoded proxy port, a dead container, and a genuine EU-RO-1 GPU-capacity
// shortage that blocked pod start outright). fal.ai turned out to have a
// hosted ACE-Step endpoint, so RunPod was never needed for this task:
//
//   - Model: `fal-ai/ace-step` — text/tags (+ optional lyrics) -> audio.
//     Docs verified live: https://fal.ai/models/fal-ai/ace-step/api
//   - License: Apache-2.0, from the upstream project's own LICENSE file
//     (github.com/ace-step/ACE-Step/blob/main/LICENSE, fetched and read
//     directly — fal's own model page does not print a license string).
//     This matches the bound commercial-clean stack named in
//     02-spec/guitar-app-spec-AMENDMENT-18.md ("...Godot + ACE-Step/YuE").
//   - Live test call, 2026-09-10 (see server/README.md's "Jam session
//     generation" section for the full request/response transcript):
//     POST https://queue.fal.run/fal-ai/ace-step -> HTTP 200 IN_QUEUE ->
//     polled /status -> COMPLETED (inference_time 1.89s) -> GET the result
//     -> real `audio.url` (a .wav) -> HEAD on that URL -> HTTP 200,
//     Content-Type audio/wav, Content-Length ~1.9 MB. Real audio, not mocked.
//   - Cost: $0.0002 / second of generated audio (fal's own pricing page),
//     i.e. a 20s response clip (DEFAULT_DURATION_S below) costs ~$0.004.
//
// --- fal's queue API contract (async) ---
// Same submit -> poll -> fetch-result shape fal_stage2.py used for Wan I2V
// video (docs/archive/2026-09-pre-tier0/FAL-AI-WORLD1-PLAN.md / fal.md),
// reimplemented here with plain fetch() rather than the Python fal_client
// SDK, since this is a Node service:
//   1. POST  https://queue.fal.run/{model}                       -> {status, status_url, response_url}
//   2. GET   {status_url}, poll until status === 'COMPLETED'
//   3. GET   {response_url}                                      -> the model's real output JSON

import { FAL_KEY, FAL_ACE_STEP_MODEL, FAL_POLL_INTERVAL_MS, FAL_POLL_TIMEOUT_MS, FAL_MUSICGEN_DURATION_S } from './config.js';

const QUEUE_BASE = 'https://queue.fal.run';

/** Thrown when FAL_KEY is unset. The route must fail clearly, never silently stub audio. */
export class MusicGenConfigError extends Error {
  constructor(message = 'FAL_KEY is not set — cannot call fal.ai') {
    super(message);
    this.name = 'MusicGenConfigError';
    this.code = 'MUSICGEN_CONFIG_MISSING';
  }
}

/** Thrown when fal.ai itself fails, times out, or returns a shape we don't recognize. */
export class MusicGenError extends Error {
  constructor(message, { cause } = {}) {
    super(message);
    this.name = 'MusicGenError';
    this.code = 'MUSICGEN_UPSTREAM_FAILED';
    if (cause) this.cause = cause;
  }
}

function authHeaders() {
  if (!FAL_KEY) throw new MusicGenConfigError();
  return { Authorization: `Key ${FAL_KEY}`, 'Content-Type': 'application/json' };
}

// Turns the facts envelope into ACE-Step's freeform `tags` string. accuracy
// steers mood/energy so a rough phrase gets a gentler response and a clean
// one gets a brighter one; chordsMatched are named so the response reads as
// answering *this* phrase specifically. This never claims the model heard
// the student's actual audio (it never does — AMENDMENT-05) — only that the
// generated clip is shaped by the derived facts, same as the /coach prose.
export function buildTags(facts) {
  const { chordsMatched = [], accuracy = 0 } = facts || {};
  const mood = accuracy >= 0.75
    ? 'bright, upbeat, confident'
    : accuracy >= 0.4
      ? 'warm, encouraging, steady'
      : 'gentle, patient, supportive';
  const chordLine = Array.isArray(chordsMatched) && chordsMatched.length
    ? `answering chords ${chordsMatched.slice(0, 6).join(' ')}, `
    : '';
  return `acoustic guitar, instrumental, folk, call-and-response, ${chordLine}${mood}, gentle strum`;
}

async function submit(facts) {
  let res;
  try {
    res = await fetch(`${QUEUE_BASE}/${FAL_ACE_STEP_MODEL}`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        tags: buildTags(facts),
        duration: FAL_MUSICGEN_DURATION_S,
      }),
    });
  } catch (err) {
    throw new MusicGenError(`fal ace-step submit request failed: ${err.message}`, { cause: err });
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new MusicGenError(`fal ace-step submit failed: HTTP ${res.status} ${body}`);
  }
  return res.json();
}

async function pollUntilComplete(statusUrl) {
  const deadline = Date.now() + FAL_POLL_TIMEOUT_MS;
  while (Date.now() < deadline) {
    let res;
    try {
      res = await fetch(statusUrl, { headers: authHeaders() });
    } catch (err) {
      throw new MusicGenError(`fal ace-step status request failed: ${err.message}`, { cause: err });
    }
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new MusicGenError(`fal ace-step status check failed: HTTP ${res.status} ${body}`);
    }
    const status = await res.json();
    if (status.status === 'COMPLETED') return status;
    if (status.status === 'ERROR' || status.status === 'FAILED') {
      throw new MusicGenError(`fal ace-step generation failed: ${JSON.stringify(status)}`);
    }
    await new Promise((resolve) => setTimeout(resolve, FAL_POLL_INTERVAL_MS));
  }
  throw new MusicGenError(`fal ace-step generation did not complete within ${FAL_POLL_TIMEOUT_MS}ms`);
}

/**
 * generateResponse(facts) -> { audioUrl }
 *
 * @param {{chordsMatched: string[], chordsMissed: string[], accuracy: number}} facts
 *   The emitFacts()-shaped payload from 07-app/core/jamSession.js. Facts
 *   only — no audio field is ever read from or sent to this function.
 * @returns {Promise<{audioUrl: string}>}
 * @throws {MusicGenConfigError} if FAL_KEY is unset.
 * @throws {MusicGenError} if fal.ai fails, times out, or returns an
 *   unrecognized shape. Never fabricates a fallback audioUrl.
 */
export async function generateResponse(facts) {
  if (!FAL_KEY) throw new MusicGenConfigError();

  const submitted = await submit(facts);
  const { status_url: statusUrl, response_url: responseUrl } = submitted || {};
  if (!statusUrl || !responseUrl) {
    throw new MusicGenError(`fal ace-step submit returned no status_url/response_url: ${JSON.stringify(submitted)}`);
  }

  await pollUntilComplete(statusUrl);

  let res;
  try {
    res = await fetch(responseUrl, { headers: authHeaders() });
  } catch (err) {
    throw new MusicGenError(`fal ace-step result fetch failed: ${err.message}`, { cause: err });
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new MusicGenError(`fal ace-step result fetch failed: HTTP ${res.status} ${body}`);
  }
  const result = await res.json();
  const audioUrl = result && result.audio && result.audio.url;
  if (!audioUrl) {
    throw new MusicGenError(`fal ace-step result had no audio.url: ${JSON.stringify(result)}`);
  }
  return { audioUrl };
}

export default { generateResponse, buildTags, MusicGenConfigError, MusicGenError };
