// router.js — tiny path/method dispatch. No framework: two real routes plus
// a health check don't earn Express.

import { sendJson } from './coachHandler.js';
import { ALLOWED_ORIGINS, MAX_BODY_BYTES } from './config.js';
import { generateResponse as defaultGenerateResponse, MusicGenConfigError, MusicGenError } from './musicGen.js';
import { generateSpeech as defaultGenerateSpeech, VoiceGenConfigError, VoiceGenError } from './voiceGen.js';

// The app page and this service always sit on different origins (see
// config.js), so every real call arrives cross-origin and a JSON content type
// makes it a preflighted one. Answer the preflight and echo the origin back on
// the real response, for allowed origins only — an origin we don't recognize
// gets no CORS headers at all and the browser refuses the response, which is
// the behavior we want for a process holding an API key.
function applyCorsHeaders(req, res, allowedOrigins) {
  const origin = req.headers && req.headers.origin;
  if (!origin || !allowedOrigins.includes(origin)) return;
  res.setHeader('Access-Control-Allow-Origin', origin);
  // Tell caches the response body varies by requesting origin, so a response
  // minted for one allowed origin is never replayed to another.
  res.setHeader('Vary', 'Origin');
}

// --- POST /jam-session/generate (TIER-1B 3A) ---
// coachHandler.js owns the /coach request lifecycle (body read, parse,
// validate, respond) as its own module wired in from index.js; this route
// follows the same shape but is built here instead of a new handler module,
// since this task's file-ownership list covers router.js/musicGen.js/
// config.js and not index.js or a new handler file. createMusicGenHandler
// takes an injectable `generate` for testability, defaulting to the real
// musicGen.js client — index.js's existing `createRouter({ coachHandler })`
// call keeps working unchanged; this route activates with zero index.js
// changes.

function readBody(req, maxBytes) {
  return new Promise((resolve, reject) => {
    let total = 0;
    const chunks = [];
    let rejected = false;

    req.on('data', (chunk) => {
      if (rejected) return;
      total += chunk.length;
      if (total > maxBytes) {
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

// The emitFacts()-shaped payload (07-app/core/jamSession.js): chordsMatched/
// chordsMissed are chord-label arrays, accuracy is a 0..1 number. Audio is
// deliberately never part of this shape (AMENDMENT-05 — audio never leaves
// the device) — this checks exactly the fields emitFacts() actually emits,
// not a full schema.js-grade validator, since the envelope is this small.
function isValidFacts(body) {
  if (!body || typeof body !== 'object') return false;
  const { chordsMatched, chordsMissed, accuracy } = body;
  if (!Array.isArray(chordsMatched) || !Array.isArray(chordsMissed)) return false;
  if (typeof accuracy !== 'number' || !Number.isFinite(accuracy)) return false;
  return true;
}

export function createMusicGenHandler({ generate = defaultGenerateResponse } = {}) {
  return async function handleMusicGen(req, res) {
    let rawBody;
    try {
      rawBody = await readBody(req, MAX_BODY_BYTES);
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

    if (!isValidFacts(parsed)) {
      return sendJson(res, 400, {
        error: 'schema_validation',
        details: ['expected {chordsMatched: string[], chordsMissed: string[], accuracy: number}'],
      });
    }

    try {
      const { audioUrl } = await generate(parsed);
      return sendJson(res, 200, { audioUrl });
    } catch (err) {
      if (err instanceof MusicGenConfigError) {
        // Config genuinely missing — fail clearly, never fake a response.
        return sendJson(res, 503, { error: 'musicgen_not_configured' });
      }
      if (err instanceof MusicGenError) {
        return sendJson(res, 502, { error: 'musicgen_upstream_failed' });
      }
      return sendJson(res, 500, { error: 'musicgen_failed' });
    }
  };
}

// --- POST /coach/speak (TIER-1B Wave 5, 5A) ---
// A separate endpoint, not a `speak: true` flag folded into /coach, chosen
// deliberately (see server/README.md's "Coach voice" section for the full
// reasoning): it decouples voice failure from the text response completely
// — the student's already-generated prose answer is produced and sent by
// /coach independent of whether this route is ever called or ever
// succeeds. This route does NOT call the Anthropic model; it only
// synthesizes speech for text the client already has and already shows.

// { text: string, voice?: string }. `voice` is optional and defaults inside
// voiceGen.js (FAL_KOKORO_VOICE); only its type is checked here, not its
// value, so newly-added fal.ai voices work without a code change here.
function isValidSpeakBody(body) {
  if (!body || typeof body !== 'object') return false;
  const { text, voice } = body;
  if (typeof text !== 'string' || text.trim().length === 0) return false;
  if (voice !== undefined && typeof voice !== 'string') return false;
  return true;
}

export function createVoiceGenHandler({ generate = defaultGenerateSpeech } = {}) {
  return async function handleVoiceGen(req, res) {
    let rawBody;
    try {
      rawBody = await readBody(req, MAX_BODY_BYTES);
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

    if (!isValidSpeakBody(parsed)) {
      return sendJson(res, 400, {
        error: 'schema_validation',
        details: ['expected {text: string (non-empty), voice?: string}'],
      });
    }

    try {
      const opts = parsed.voice !== undefined ? { voice: parsed.voice } : undefined;
      const { audioUrl } = await generate(parsed.text, opts);
      return sendJson(res, 200, { audioUrl });
    } catch (err) {
      if (err instanceof VoiceGenConfigError) {
        // Config genuinely missing — fail clearly, never fake a response.
        return sendJson(res, 503, { error: 'voicegen_not_configured' });
      }
      if (err instanceof VoiceGenError) {
        return sendJson(res, 502, { error: 'voicegen_upstream_failed' });
      }
      return sendJson(res, 500, { error: 'voicegen_failed' });
    }
  };
}

export function createRouter({ coachHandler, musicGenHandler = createMusicGenHandler(), voiceGenHandler = createVoiceGenHandler(), allowedOrigins = ALLOWED_ORIGINS }) {
  return function handleRequest(req, res) {
    const url = req.url ? req.url.split('?')[0] : '/';

    applyCorsHeaders(req, res, allowedOrigins);

    if (req.method === 'OPTIONS') {
      // Preflight. 204 with no body; the allow headers are only meaningful
      // when applyCorsHeaders recognized the origin, and harmless otherwise.
      res.writeHead(204, {
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '600',
      });
      return res.end();
    }

    if (req.method === 'GET' && url === '/healthz') {
      return sendJson(res, 200, { ok: true });
    }

    if (req.method === 'POST' && url === '/coach') {
      return coachHandler(req, res);
    }

    if (req.method === 'POST' && url === '/jam-session/generate') {
      return musicGenHandler(req, res);
    }

    if (req.method === 'POST' && url === '/coach/speak') {
      return voiceGenHandler(req, res);
    }

    return sendJson(res, 404, { error: 'not_found' });
  };
}
