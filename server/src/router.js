// router.js — tiny path/method dispatch. No framework: one real route plus
// a health check doesn't earn Express.

import { sendJson } from './coachHandler.js';

export function createRouter({ coachHandler }) {
  return function handleRequest(req, res) {
    const url = req.url ? req.url.split('?')[0] : '/';

    if (req.method === 'GET' && url === '/healthz') {
      return sendJson(res, 200, { ok: true });
    }

    if (req.method === 'POST' && url === '/coach') {
      return coachHandler(req, res);
    }

    return sendJson(res, 404, { error: 'not_found' });
  };
}
