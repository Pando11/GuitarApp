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
