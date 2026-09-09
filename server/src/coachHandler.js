// coachHandler.js — POST /coach. Always resolves to a 200 with prose in the
// success, timeout, AND guardrail-rejected cases, so chatEngine.js's future
// coachClient seam (T1.4) never has to branch on error vs success — it gets
// prose back either way, tagged with `source`. Only malformed input, rate
// limiting, and body-size overflow return non-200s, and none of those ever
// reach the model.

import { validateFactsEnvelope } from './schema.js';
import { checkInventedFacts } from './guardrail.js';
import { getFallbackProse } from './templateFallback.js';
import { MAX_BODY_BYTES, MODEL_TIMEOUT_MS, MODEL_TIMEOUT_QUESTION_MS } from './config.js';
import { logger as defaultLogger } from './logger.js';

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) });
  res.end(payload);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let total = 0;
    const chunks = [];
    let rejected = false;

    req.on('data', (chunk) => {
      if (rejected) return;
      total += chunk.length;
      if (total > MAX_BODY_BYTES) {
        rejected = true;
        reject(Object.assign(new Error('payload too large'), { code: 'TOO_LARGE' }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', () => {
      if (rejected) return;
      resolve(Buffer.concat(chunks).toString('utf8'));
    });

    req.on('error', (err) => {
      if (rejected) return;
      reject(err);
    });
  });
}

/**
 * Build a request handler for POST /coach. Dependencies are injected so
 * tests never make a real network call.
 *
 * @param {object} deps
 * @param {{allow: (anonId: string) => boolean}} deps.rateLimiter
 * @param {(envelope: object, opts?: object) => Promise<{prose: string, usage: object}>} deps.callCoach
 * @param {object} [deps.logger]
 * @param {number} [deps.modelTimeoutMs]
 */
export function createCoachHandler({
  rateLimiter,
  callCoach,
  logger = defaultLogger,
  modelTimeoutMs = MODEL_TIMEOUT_MS,
  questionTimeoutMs = MODEL_TIMEOUT_QUESTION_MS,
}) {
  return async function handleCoach(req, res) {
    let rawBody;
    try {
      rawBody = await readBody(req);
    } catch (err) {
      if (err && err.code === 'TOO_LARGE') {
        return sendJson(res, 413, { error: 'payload_too_large' });
      }
      return sendJson(res, 400, { error: 'invalid_json' });
    }

    let parsed;
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      return sendJson(res, 400, { error: 'invalid_json' });
    }

    const { ok, value: envelope, errors } = validateFactsEnvelope(parsed);
    if (!ok) {
      return sendJson(res, 400, { error: 'schema_validation', details: errors });
    }

    if (!rateLimiter.allow(envelope.anonId)) {
      return sendJson(res, 429, { error: 'rate_limited', retryAfterMs: 60_000 });
    }

    // Two budgets, picked per request: see config.js. A student waiting on an
    // answer they typed tolerates a longer wait than an unprompted nudge does,
    // and gets a far worse fallback when the call is cut short.
    const timeoutMs = envelope.question ? questionTimeoutMs : modelTimeoutMs;

    let modelProse = null;
    try {
      const result = await callCoach(envelope, { timeoutMs });
      modelProse = result.prose;
    } catch (err) {
      logger.warn('coach model call failed, falling back to template', { reason: err && err.name });
      return sendJson(res, 200, { prose: getFallbackProse(envelope), source: 'template' });
    }

    const guardrailResult = checkInventedFacts(modelProse, envelope);
    if (!guardrailResult.ok) {
      logger.warn('coach guardrail rejected model prose, falling back to template', { reason: guardrailResult.reason });
      return sendJson(res, 200, { prose: getFallbackProse(envelope), source: 'template' });
    }

    return sendJson(res, 200, { prose: modelProse, source: 'model' });
  };
}

export { sendJson };
