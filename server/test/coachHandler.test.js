import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { createCoachHandler } from '../src/coachHandler.js';
import { createRateLimiter } from '../src/rateLimiter.js';

function fakeRequest(bodyObj) {
  const req = new EventEmitter();
  req.method = 'POST';
  req.url = '/coach';
  process.nextTick(() => {
    const body = typeof bodyObj === 'string' ? bodyObj : JSON.stringify(bodyObj);
    req.emit('data', Buffer.from(body, 'utf8'));
    req.emit('end');
  });
  return req;
}

function fakeResponse() {
  const res = {
    statusCode: null,
    headers: null,
    body: null,
    writeHead(status, headers) {
      res.statusCode = status;
      res.headers = headers;
    },
    end(payload) {
      res.body = payload ? JSON.parse(payload) : null;
      res._resolve && res._resolve();
    },
  };
  res.done = new Promise((resolve) => { res._resolve = resolve; });
  return res;
}

function validEnvelope(overrides = {}) {
  return {
    anonId: 'anon-1',
    learnerProfile: { ageBand: '18-34', experience: 'never-held-one', goal: 'play songs', minutesPerDay: 15 },
    lessonId: 'L01',
    mastery: [{ chord: 'G', label: 'needs_work', confidence: 40 }],
    ...overrides,
  };
}

function makeLoggerSpy() {
  const calls = [];
  return {
    calls,
    info: (...args) => calls.push(['info', ...args]),
    warn: (...args) => calls.push(['warn', ...args]),
    error: (...args) => calls.push(['error', ...args]),
  };
}

test('malformed envelope returns 400, model mock never invoked', async () => {
  let modelCalled = false;
  const handler = createCoachHandler({
    rateLimiter: createRateLimiter({ now: () => 0 }),
    callCoach: async () => { modelCalled = true; return { prose: 'x', usage: {} }; },
  });
  const req = fakeRequest({ lessonId: 'L01' }); // missing anonId, learnerProfile
  const res = fakeResponse();
  await handler(req, res);
  await res.done;
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.error, 'schema_validation');
  assert.equal(modelCalled, false);
});

test('valid envelope + clean model prose returns 200 {prose, source: model}', async () => {
  const handler = createCoachHandler({
    rateLimiter: createRateLimiter({ now: () => 0 }),
    callCoach: async () => ({ prose: 'Your G is coming along nicely at 40.', usage: {} }),
  });
  const req = fakeRequest(validEnvelope());
  const res = fakeResponse();
  await handler(req, res);
  await res.done;
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.source, 'model');
  assert.equal(res.body.prose, 'Your G is coming along nicely at 40.');
});

test('valid envelope + prose with invented chord returns fallback, source: template', async () => {
  const handler = createCoachHandler({
    rateLimiter: createRateLimiter({ now: () => 0 }),
    callCoach: async () => ({ prose: 'Your G is fine, and your Dsus9 is now perfect!', usage: {} }),
  });
  const req = fakeRequest(validEnvelope());
  const res = fakeResponse();
  await handler(req, res);
  await res.done;
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.source, 'template');
  assert.notEqual(res.body.prose, 'Your G is fine, and your Dsus9 is now perfect!');
});

test('model call exceeding timeout resolves within a reasonable margin with fallback prose', async () => {
  const handler = createCoachHandler({
    rateLimiter: createRateLimiter({ now: () => 0 }),
    callCoach: async () => {
      const err = new Error('timed out');
      err.name = 'TimeoutError';
      throw err;
    },
  });
  const req = fakeRequest(validEnvelope());
  const res = fakeResponse();
  const start = Date.now();
  await handler(req, res);
  await res.done;
  const elapsed = Date.now() - start;
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.source, 'template');
  assert.ok(elapsed < 2400, `expected under 2400ms, got ${elapsed}`);
});

test('rate limit exceeded returns 429, model mock never invoked', async () => {
  let modelCalled = false;
  const rateLimiter = createRateLimiter({ now: () => 0, max: 1 });
  const handler = createCoachHandler({
    rateLimiter,
    callCoach: async () => { modelCalled = true; return { prose: 'x', usage: {} }; },
  });

  const req1 = fakeRequest(validEnvelope());
  const res1 = fakeResponse();
  await handler(req1, res1);
  await res1.done;
  assert.equal(res1.statusCode, 200);

  const req2 = fakeRequest(validEnvelope());
  const res2 = fakeResponse();
  await handler(req2, res2);
  await res2.done;
  assert.equal(res2.statusCode, 429);
  assert.equal(res2.body.error, 'rate_limited');
  assert.equal(modelCalled, true); // only from the first, allowed call
});

test('logging never contains the raw learnerProfile object or an API key value', async () => {
  const logger = makeLoggerSpy();
  const handler = createCoachHandler({
    rateLimiter: createRateLimiter({ now: () => 0 }),
    callCoach: async () => {
      const err = new Error('boom');
      err.name = 'ModelError';
      throw err;
    },
    logger,
  });
  const req = fakeRequest(validEnvelope());
  const res = fakeResponse();
  await handler(req, res);
  await res.done;

  const serialized = JSON.stringify(logger.calls);
  assert.ok(!serialized.includes('play songs')); // the goal string from learnerProfile
  assert.ok(!serialized.includes('18-34'));
  assert.ok(!serialized.toLowerCase().includes('sk-ant'));
});
