// config.js — every env-derived and constant setting in one place.

export const PORT = Number(process.env.PORT) || 8787;

export const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';

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
