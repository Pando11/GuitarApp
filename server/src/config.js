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
export const MODEL_ID = 'claude-opus-5';
export const MODEL_MAX_TOKENS = 512;
export const MODEL_THINKING = { type: 'adaptive' };
export const MODEL_OUTPUT_CONFIG = { effort: 'low' };

// Latency budget: the client gives the coaching call 2.5s total. We time out
// a bit earlier so there's room to fall back and still respond within 2.5s.
export const MODEL_TIMEOUT_MS = 2300;

// Body size cap, bytes. Facts envelopes are small; 16 KB is generous headroom.
export const MAX_BODY_BYTES = 16 * 1024;
