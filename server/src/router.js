// router.js — tiny path/method dispatch. No framework: one real route plus
// a health check doesn't earn Express.

import { sendJson } from './coachHandler.js';
import { ALLOWED_ORIGINS } from './config.js';

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

export function createRouter({ coachHandler, allowedOrigins = ALLOWED_ORIGINS }) {
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

    return sendJson(res, 404, { error: 'not_found' });
  };
}
