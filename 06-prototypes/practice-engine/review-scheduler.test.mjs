// review-scheduler.test.mjs — unit tests for the review-reminder / streak-nudge
// pure module. Run: node --test 06-prototypes/practice-engine/review-scheduler.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';

import { computeReviewState, computeStreak, pairNeedsReview, DEFAULTS } from './review-scheduler.mjs';

const DAY = 24 * 3600 * 1000;
const NOW = 1_000_000_000_000; // arbitrary fixed "now"

// A snapshot row shape mirrors fluency-store.snapshot():
//   { pair, fluency, samples, lastPracticed }
const fresh = (pair = 'C::Em', fluency = 0.95, lastPracticed = NOW) => ({
  pair, fluency, samples: 4, lastPracticed,
});
const weak = (pair = 'A::Em', fluency = 0.12, lastPracticed = NOW) => ({
  pair, fluency, samples: 3, lastPracticed,
});
const stale = (pair = 'G::Em', fluency = 0.8, lastPracticed = NOW - 10 * DAY) => ({
  pair, fluency, samples: 5, lastPracticed,
});
const unpracticed = (pair = 'D::Em') => ({
  pair, fluency: 0, samples: 0, lastPracticed: null,
});

// ---------- FIRES for decayed / low-fluency ----------
test('FIRES: low-fluency pair needs review', () => {
  const st = computeReviewState([weak(), fresh()], NOW);
  assert.equal(st.needsReview, true);
  assert.ok(st.reviewPairs.some((r) => r.pair === 'A::Em' && r.reason === 'weak'));
});

test('FIRES: stale (high-fluency but long-idle) pair needs review', () => {
  const st = computeReviewState([stale(), fresh()], NOW);
  assert.equal(st.needsReview, true);
  assert.ok(st.reviewPairs.some((r) => r.pair === 'G::Em' && r.reason === 'stale'));
});

test('FIRES: never-practiced pair is surfaced (no false-negative framing)', () => {
  const st = computeReviewState([unpracticed(), fresh()], NOW);
  assert.equal(st.needsReview, true);
  // Crucially: we do NOT claim the un-practiced pair is fine.
  assert.ok(st.reviewPairs.some((r) => r.pair === 'D::Em' && r.reason === 'unpracticed'));
  assert.equal(st.level, 'cold');
});

// ---------- STAYS QUIET for a fresh one ----------
test('QUIET: a single fresh pair does NOT need review', () => {
  const st = computeReviewState([fresh()], NOW);
  assert.equal(st.needsReview, false);
  assert.equal(st.reviewPairs.length, 0);
  assert.equal(st.level, 'ok');
});

test('QUIET: all-fresh snapshot stays quiet (no false alarm)', () => {
  const st = computeReviewState([fresh('C::Em'), fresh('G::Em'), fresh('D::Em')], NOW);
  assert.equal(st.needsReview, false);
  assert.equal(st.total, 3);
  assert.equal(st.fresh, 3);
  assert.ok(st.message.includes('fresh'));
});

// ---------- streak / consistency ----------
test('streak counts consecutive practice days ending today', () => {
  // practiced today, yesterday, day-before; gap 2 days before that
  const snap = [
    { pair: 'C::Em', fluency: 0.9, samples: 2, lastPracticed: NOW },
    { pair: 'G::Em', fluency: 0.9, samples: 2, lastPracticed: NOW - 1 * DAY },
    { pair: 'D::Em', fluency: 0.9, samples: 2, lastPracticed: NOW - 2 * DAY },
  ];
  assert.equal(computeStreak(snap, NOW), 3);
});

test('streak allows today-not-yet-done (counts back from yesterday)', () => {
  const snap = [
    { pair: 'G::Em', fluency: 0.9, samples: 2, lastPracticed: NOW - 1 * DAY },
    { pair: 'D::Em', fluency: 0.9, samples: 2, lastPracticed: NOW - 2 * DAY },
  ];
  assert.equal(computeStreak(snap, NOW), 2);
});

test('streak is 0 with no practice data', () => {
  assert.equal(computeStreak([], NOW), 0);
  const st = computeReviewState([], NOW);
  assert.equal(st.streakDays, 0);
  // empty store -> warm/start, never "ok/fine"
  assert.equal(st.level, 'warm');
  assert.equal(st.needsReview, false);
});

// ---------- pairNeedsReview reasons ----------
test('pairNeedsReview reasons are mutually exclusive and correct', () => {
  assert.deepEqual(pairNeedsReview(unpracticed(), NOW), { review: true, reason: 'unpracticed' });
  assert.deepEqual(pairNeedsReview(weak(), NOW), { review: true, reason: 'weak' });
  assert.deepEqual(pairNeedsReview(stale(), NOW), { review: true, reason: 'stale' });
  assert.deepEqual(pairNeedsReview(fresh(), NOW), { review: false, reason: 'fresh' });
});

// ---------- K caps the surfaced list, weakest first ----------
test('topK surfaces the K weakest pairs, weakest first', () => {
  const snap = [
    fresh('C::Em', 0.95, NOW),
    weak('A::Em', 0.10, NOW),
    weak('D::Em', 0.20, NOW),
    weak('G::Em', 0.30, NOW),
    unpracticed('B::Em'),
  ];
  const st = computeReviewState(snap, NOW, { K: 3 });
  assert.equal(st.topK.length, 3);
  // lowest fluency first -> 0 (B::Em unpracticed), then 0.10 (A), then 0.20 (D)
  assert.deepEqual(st.topK, ['B::Em', 'A::Em', 'D::Em']);
});

// ---------- defaults sanity ----------
test('defaults are sane', () => {
  assert.equal(DEFAULTS.fluencyThreshold, 0.4);
  assert.equal(DEFAULTS.staleDays, 3);
  assert.equal(DEFAULTS.K, 3);
});
