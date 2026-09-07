// config.js — every env-derived and constant setting in one place.

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

// Latency budget: the client gives the coaching call 2.5s total. We time out
// a bit earlier so there's room to fall back and still respond within 2.5s.
export const MODEL_TIMEOUT_MS = 2300;

// Body size cap, bytes. Facts envelopes are small; 16 KB is generous headroom.
export const MAX_BODY_BYTES = 16 * 1024;
