// comeback-nudge.test.mjs — unit tests for the churn-risk / "save your streak"
// helper (feature #6: churn-prediction nudges). Canonical source = review-scheduler.mjs.
// Run: node --test 06-prototypes/practice-engine/comeback-nudge.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';

import { comebackNudge, COMEBACK_DEFAULTS } from './review-scheduler.mjs';

// ---------- SAVE-day nudge (streak alive, idle within grace) ----------
test('SAVE: idle 1 day with a 5-day streak fires a protect nudge', () => {
  const n = comebackNudge(5, 1);
  assert.equal(n.atRisk, true);
  assert.equal(n.broken, false);
  assert.ok(n.message.includes('5-day streak'));
});

test('SAVE: default grace window (graceDays=1) means yesterday is the save day', () => {
  const n = comebackNudge(3, 1, { graceDays: 1 });
  assert.equal(n.atRisk, true);
  assert.equal(n.broken, false);
});

// ---------- silent when safe ----------
test('SILENT: practiced today -> no nudge', () => {
  const n = comebackNudge(10, 0);
  assert.equal(n.atRisk, false);
  assert.equal(n.broken, false);
  assert.equal(n.message, null);
});

test('SILENT: no streak yet -> nothing to protect', () => {
  const n = comebackNudge(0, 2);
  assert.equal(n.atRisk, false);
  assert.equal(n.broken, false);
  assert.equal(n.message, null);
});

// ---------- BROKEN nudge (idle past grace) ----------
test('BROKEN: idle 2 days with graceDays=1 -> streak lapsed', () => {
  const n = comebackNudge(7, 2);
  assert.equal(n.atRisk, true);
  assert.equal(n.broken, true);
  assert.ok(n.message.includes('slipped'));
});

test('BROKEN: idle exactly at grace+1 with extended grace window', () => {
  // graceDays=3 -> idle 1..3 still alive; idle 4 is past the window.
  const n = comebackNudge(4, 4, { graceDays: 3 });
  assert.equal(n.broken, true);
  const alive = comebackNudge(4, 3, { graceDays: 3 });
  assert.equal(alive.broken, false);
});

// ---------- defaults ----------
test('comeback defaults sane', () => {
  assert.equal(COMEBACK_DEFAULTS.graceDays, 1);
});
