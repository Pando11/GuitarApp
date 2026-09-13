// practiceTimer.test.mjs — covers startTimer/getRemainingSeconds/
// getRemainingMinutes/isExpired/stopTimer using an injected `now` so the
// test doesn't depend on real wall-clock timing.
import assert from 'node:assert/strict';
import test from 'node:test';
import { PracticeTimer } from './practiceTimer.js';

test('startTimer sets duration; getRemainingSeconds counts down', () => {
  const timer = new PracticeTimer();
  const t0 = 1_000_000;
  timer.startTimer(30, t0); // 30 minutes = 1800s
  assert.equal(timer.getRemainingSeconds(t0), 1800);
  assert.equal(timer.getRemainingSeconds(t0 + 60_000), 1740); // 1 minute elapsed
});

test('getRemainingMinutes rounds up remaining seconds', () => {
  const timer = new PracticeTimer();
  const t0 = 0;
  timer.startTimer(1, t0); // 60s
  assert.equal(timer.getRemainingMinutes(t0 + 1000), 1); // 59s left -> ceil to 1
});

test('isExpired is false before the duration elapses, true at/after it', () => {
  const timer = new PracticeTimer();
  const t0 = 0;
  timer.startTimer(5, t0); // 300s
  assert.equal(timer.isExpired(t0 + 299_000), false);
  assert.equal(timer.isExpired(t0 + 300_000), true);
  assert.equal(timer.isExpired(t0 + 500_000), true);
  assert.equal(timer.getRemainingSeconds(t0 + 500_000), 0);
});

test('stopTimer clears running state', () => {
  const timer = new PracticeTimer();
  timer.startTimer(10, 0);
  timer.stopTimer();
  assert.equal(timer.getRemainingSeconds(5000), 0);
  assert.equal(timer.isExpired(5000), false);
});

test('startTimer rejects non-positive/invalid minutes', () => {
  const timer = new PracticeTimer();
  assert.throws(() => timer.startTimer(0));
  assert.throws(() => timer.startTimer(-5));
  assert.throws(() => timer.startTimer('nope'));
});

test('toJSON/fromJSON round-trips timer state', () => {
  const timer = new PracticeTimer();
  timer.startTimer(20, 1000);
  const restored = PracticeTimer.fromJSON(timer.toJSON());
  assert.equal(restored.getRemainingSeconds(1000 + 5000), timer.getRemainingSeconds(1000 + 5000));
});
