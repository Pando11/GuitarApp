// config.js — every env-derived and constant setting in one place.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const PORT = Number(process.env.PORT) || 8787;

export const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';

// Optional. Some Anthropic API keys are org-level rather than scoped to one
// workspace; when the org has more than one workspace, such a key is
// rejected with a 400 asking for an `anthropic-workspace-id` header (real
// error, hit while verifying W6.1 — see docs/plans/TIER-W-emerald-hollow.md).
// Setting this in server/.env resolves it without further code changes; the
// value comes from the Anthropic Console (`wrkspc_...`), which is an owner
// action — no code here can discover or guess it.
export const ANTHROPIC_WORKSPACE_ID = process.env.ANTHROPIC_WORKSPACE_ID || '';

// Browser origins allowed to call /coach. The app is a static bundle served
// from its own origin (scripts/serve.mjs on :5173 in development, GitHub Pages
// in production) while this service listens on :8787, so every call from the
// page is cross-origin and dies at the preflight without this. An explicit
// allow-list, not a wildcard: this service is the one process holding the API
// key, and `*` would let any page on the machine spend it.
//
// Set COACH_ALLOWED_ORIGINS to a comma-separated list to override — required
// when the app is served from anywhere but the local dev server.
const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:8000',
  'http://127.0.0.1:8000',
];

export const ALLOWED_ORIGINS = (process.env.COACH_ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)
  .concat(process.env.COACH_ALLOWED_ORIGINS ? [] : DEFAULT_ALLOWED_ORIGINS);

export const RATE_LIMIT_PER_MIN = Number(process.env.COACH_RATE_LIMIT_PER_MIN) || 10;
export const RATE_LIMIT_WINDOW_MS = 60_000;

// Model constants (T1.1 spec). Do not change without an owner decision —
// see docs/plans/TIER-1-make-ai-real.md T1.1.
// Swapped Opus 5 -> Haiku 4.5 (owner decision, 2026-09-07): the real Opus
// call measured 4.1-4.4s, blowing past MODEL_TIMEOUT_MS below, so every real
// coaching moment was silently discarded in favor of template text. This
// task (2-3 sentences of templated, fact-citing prose) doesn't need Opus's
// reasoning depth; Rule 5 is enforced in code (guardrail.js) independent of
// model choice, and Haiku is both far cheaper and far faster. Verifying
// real latency/quality against this before treating it as final.
export const MODEL_ID = 'claude-haiku-4-5-20251001';
export const MODEL_MAX_TOKENS = 512;
// Haiku 4.5 rejects thinking:{type:'adaptive'} (400 "adaptive thinking is
// not supported on this model") — these were Opus-specific extended-
// thinking controls. Haiku doesn't need them for a short prose-generation
// task; modelClient.js only sends thinking/output_config to the API when
// these are truthy.
export const MODEL_THINKING = null;
export const MODEL_OUTPUT_CONFIG = null;

// Latency budget for an unprompted nudge. Raised 2300 -> 6000 on 2026-09-08
// after measuring the real Haiku call end to end: the direct calls came back
// at 1.9s and 2.3s, so once HTTP and JSON framing were added the old 2300ms
// ceiling was under the real cost of a call and the nudge path timed out
// essentially every time. The live smoke test served template prose on every
// run. 6s is generous headroom over the measured 2.4s worst case; the
// student is not blocked on this call, so the cost of waiting is low and the
// cost of always falling back is a coach that never says anything real.
// Paired with chatEngine.js's DEFAULT_COACH_TIMEOUT_MS — raise them together.
export const MODEL_TIMEOUT_MS = 6000;

// A student who typed a question and is watching for an answer gets a much
// longer budget than an unprompted nudge does. Two reasons the 2300ms above
// cannot serve both: an answer is several sentences where a nudge is one, so
// it takes measurably longer to generate (measured 2.0-2.4s against the real
// API on 2026-09-08, i.e. straddling the old ceiling); and the fallback for a
// question is an apology rather than useful prose, so timing out costs the
// student far more here than it does on the nudge path. Paired with
// chatEngine.js's own per-request client timeout — raise them together.
export const MODEL_TIMEOUT_QUESTION_MS = 12_000;

// Body size cap, bytes. Facts envelopes are small; 16 KB is generous headroom.
export const MAX_BODY_BYTES = 16 * 1024;

// --- Jam session generation (TIER-1B 3A) — fal.ai / ACE-Step ---
// The repo's .env already has a live, previously-tested FAL_KEY from the
// World 1 (Emerald Hollow) fal.ai build (docs/archive/2026-09-pre-tier0/
// FAL-AI-WORLD1-PLAN.md) — reused here, not re-requested. musicGen.js fails
// with a typed MusicGenConfigError (not a silent stub) when this is unset.
//
// index.js's `dotenv/config` only loads server/.env (which has never held
// FAL_KEY — that key lives in the repo-root .env, alongside RUNPOD_*, from
// the World 1 build). This task's file-ownership list doesn't include
// server/.env or index.js, so rather than writing a secret into a file
// outside that list, this reads the repo-root .env directly as a fallback —
// the exact pattern scripts/world-factory/fal_common.py's _ensure_key() and
// pod_run.py/pod_shell.py already use for this same key. process.env always
// wins when set; the file is only consulted when it isn't.
function readFalKeyFromRootEnv() {
  try {
    const here = path.dirname(fileURLToPath(import.meta.url)); // server/src
    const rootEnvPath = path.join(here, '..', '..', '.env'); // repo root
    const raw = readFileSync(rootEnvPath, 'utf8');
    for (const line of raw.split('\n')) {
      const s = line.trim();
      if (s.startsWith('FAL_KEY=')) return s.slice('FAL_KEY='.length).trim().replace(/^["']|["']$/g, '');
    }
  } catch {
    // repo-root .env not present (e.g. a deployment that ships server/ only) — fine,
    // FAL_KEY just stays unset and musicGen.js throws MusicGenConfigError.
  }
  return '';
}

export const FAL_KEY = process.env.FAL_KEY || readFalKeyFromRootEnv();

// Verified live against the real fal.ai API 2026-09-10 (see server/README.md
// "Jam session generation"): `fal-ai/ace-step`, Apache-2.0 upstream license
// (github.com/ace-step/ACE-Step/blob/main/LICENSE), matching the bound stack
// named in 02-spec/guitar-app-spec-AMENDMENT-18.md ("...ACE-Step/YuE"). Do
// not change without re-verifying the replacement model's license.
export const FAL_ACE_STEP_MODEL = 'fal-ai/ace-step';

// Queue poll cadence/budget for the async fal.ai request (mirrors the
// submit -> poll-status -> fetch-result pattern fal_stage2.py used for Wan
// I2V video). Actual inference is ~2-5s, but fal's shared queue wait before
// a worker even picks up the job is a separate, more variable cost — an
// independent verification run (2026-09-10) observed ~46-50s of pure queue
// wait on a live call, which a 45s budget clipped as a false-timeout 502.
// 120s gives real headroom above that observed worst case; a slow queue
// should still surface as a clear timeout eventually, not hang forever.
export const FAL_POLL_INTERVAL_MS = 2000;
export const FAL_POLL_TIMEOUT_MS = 120_000;

// Response clip length, seconds. ACE-Step is billed at $0.0002/second
// (fal.ai's own pricing page, checked 2026-09-10), so 20s costs ~$0.004 —
// short enough to answer a single played phrase without racking up cost.
export const FAL_MUSICGEN_DURATION_S = 20;

// --- Coach voice (TIER-1B Wave 5, 5A) — fal.ai / Kokoro TTS ---
// Speaks prose Sage has already generated (POST /coach/speak — see
// router.js). Same FAL_KEY as jam session's ACE-Step generation above; no
// new secret needed. Verified live 2026-09-10 (see server/README.md "Coach
// voice"): `fal-ai/kokoro`, real HEAD-confirmed audio/wav returned in ~2s.
export const FAL_KOKORO_MODEL = 'fal-ai/kokoro';

// af_heart is the exact voice already used for the 61 pre-recorded lesson
// narration clips (Wave 1B), so Sage's scripted lines and live spoken
// answers sound like the same person. 20 voices are available from fal.ai's
// Kokoro model (af_alloy, af_bella, am_adam, ...) if a caller ever wants to
// override; voiceGen.js's generateSpeech() takes an optional `voice`.
export const FAL_KOKORO_VOICE = 'af_heart';

// Queue poll cadence/budget for Kokoro. Same submit -> poll-status ->
// fetch-result shape as FAL_POLL_INTERVAL_MS/FAL_POLL_TIMEOUT_MS above, but
// Kokoro's own inference is much faster (~2s observed live, vs. ACE-Step's
// 2-5s) so polling more often (1s vs. 2s) catches completion sooner without
// meaningfully increasing request volume. The timeout is shortened from
// musicGen's 120s but not down to the ~2s inference time: fal's shared
// queue-wait cost (observed up to ~46-50s on a live ACE-Step call, a cost
// that comes from the shared fal.ai queue infrastructure, not the specific
// model) can in principle affect Kokoro requests too, and no equivalent
// multi-run queue-wait sample exists yet for Kokoro specifically. 60s keeps
// real headroom above the queue-wait worst case observed elsewhere on this
// same account/infrastructure (roughly double it) while still being half of
// musicGen's budget, reflecting that Kokoro is the lighter, faster model of
// the two. A slow queue should still surface as a clear timeout, not hang.
export const FAL_TTS_POLL_INTERVAL_MS = 1000;
export const FAL_TTS_POLL_TIMEOUT_MS = 60_000;
