// index.js — process entry point. Wires the rate limiter, the real model
// client, and the router, then starts listening. This is the ONLY process
// that ever holds ANTHROPIC_API_KEY.

// Load server/.env into process.env before anything else runs. This MUST be
// the first import in the file: ES module dependency evaluation runs every
// imported module (in source order) before any of this module's own code,
// so config.js (the next import below) only sees a populated process.env if
// dotenv's own module body — which calls config() as a side effect — has
// already run. A plain function-call statement placed after the imports
// would be too late: config.js would already have read process.env by then.
// Without this, `npm start` alone (no flags, no --env-file) would silently
// see an empty ANTHROPIC_API_KEY and serve template prose — the exact trap
// this fixes. dotenv never overrides a var that's already set in the
// environment, so on Render (which injects env vars directly, with no .env
// file on disk) this import is a harmless no-op, never a source of
// surprise overrides.
import 'dotenv/config';
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
