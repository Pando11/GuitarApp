// index.js — process entry point. Wires the rate limiter, the real model
// client, and the router, then starts listening. This is the ONLY process
// that ever holds ANTHROPIC_API_KEY.

import http from 'node:http';
import { PORT, RATE_LIMIT_PER_MIN, RATE_LIMIT_WINDOW_MS, ANTHROPIC_API_KEY } from './config.js';
import { createRateLimiter } from './rateLimiter.js';
import { callCoach } from './modelClient.js';
import { createCoachHandler } from './coachHandler.js';
import { createRouter } from './router.js';
import { logger } from './logger.js';

const rateLimiter = createRateLimiter({ windowMs: RATE_LIMIT_WINDOW_MS, max: RATE_LIMIT_PER_MIN });

if (!ANTHROPIC_API_KEY) {
  logger.warn('ANTHROPIC_API_KEY is not set — every /coach request will fall back to template prose');
}

const coachHandler = createCoachHandler({ rateLimiter, callCoach });
const router = createRouter({ coachHandler });

const server = http.createServer((req, res) => {
  router(req, res);
});

server.listen(PORT, () => {
  logger.info(`coach service listening on port ${PORT}`);
});

export default server;
