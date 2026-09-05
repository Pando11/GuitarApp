import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRateLimiter } from '../src/rateLimiter.js';

test('first max calls allowed', () => {
  let t = 0;
  const limiter = createRateLimiter({ windowMs: 1000, max: 3, now: () => t });
  assert.equal(limiter.allow('a'), true);
  assert.equal(limiter.allow('a'), true);
  assert.equal(limiter.allow('a'), true);
  limiter.stop();
});

test('max+1th call denied', () => {
  let t = 0;
  const limiter = createRateLimiter({ windowMs: 1000, max: 3, now: () => t });
  limiter.allow('a');
  limiter.allow('a');
  limiter.allow('a');
  assert.equal(limiter.allow('a'), false);
  limiter.stop();
});

test('different anonIds are independent', () => {
  let t = 0;
  const limiter = createRateLimiter({ windowMs: 1000, max: 1, now: () => t });
  assert.equal(limiter.allow('a'), true);
  assert.equal(limiter.allow('b'), true);
  assert.equal(limiter.allow('a'), false);
  assert.equal(limiter.allow('b'), false);
  limiter.stop();
});

test('after injected-clock window elapses, allowed again', () => {
  let t = 0;
  const limiter = createRateLimiter({ windowMs: 1000, max: 1, now: () => t });
  assert.equal(limiter.allow('a'), true);
  assert.equal(limiter.allow('a'), false);
  t = 1001;
  assert.equal(limiter.allow('a'), true);
  limiter.stop();
});
