// guardrail.test.js — proves the invented-fact guardrail actually fires on
// adversarial cases (a chord not in mastery, a number not derivable from the
// envelope) and does NOT false-positive on ordinary safe prose. This is a
// best-effort heuristic, not a formal proof: it can only catch chord-shaped
// tokens (A-G with optional quality suffix) and literal digit sequences —
// it cannot verify semantic correctness. These tests document that scope.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkInventedFacts } from '../src/guardrail.js';

function envelope(overrides = {}) {
  return {
    learnerProfile: { ageBand: '18-34', experience: 'never-held-one', goal: 'play songs', minutesPerDay: 15 },
    lessonId: 'L01',
    stepId: null,
    mastery: [{ chord: 'G', label: 'needs_work', confidence: 40 }],
    justHappened: null,
    recentHistory: [],
    ...overrides,
  };
}

test('prose citing only in-envelope chords/numbers is ok', () => {
  const result = checkInventedFacts('Your G is at 40 and coming along nicely. Keep going at 15 minutes a day.', envelope());
  assert.equal(result.ok, true);
});

test('prose inventing a chord not in mastery[] is rejected', () => {
  const env = envelope();
  const result = checkInventedFacts('Your G is coming along, and your Dsus4 is already solid.', env);
  assert.equal(result.ok, false);
  assert.match(result.reason, /^invented_token:/);
});

test('prose inventing a numeric score/percentage not derivable from envelope is rejected', () => {
  const env = envelope();
  const result = checkInventedFacts('Your G confidence just jumped to 95%, amazing work!', env);
  assert.equal(result.ok, false);
  assert.match(result.reason, /^invented_token:/);
});

test('prose citing a specific chord when mastery is empty and justHappened is null is rejected', () => {
  const env = envelope({ mastery: [], justHappened: null });
  const result = checkInventedFacts('Your Em is sounding great today!', env);
  assert.equal(result.ok, false);
});

test('generic safe prose with no chord/number mentions is not falsely flagged', () => {
  const env = envelope({ mastery: [], justHappened: null });
  const result = checkInventedFacts('Nice work today — keep that same relaxed pace and we will check in again soon.', env);
  assert.equal(result.ok, true);
});

test('numbers derived from justHappened are allowed', () => {
  const env = envelope({
    mastery: [],
    justHappened: { drillId: 'd1', passed: true, score: 88, ratePerMin: 12 },
  });
  const result = checkInventedFacts('Nice, you hit a score of 88 at a rate of 12 per minute.', env);
  assert.equal(result.ok, true);
});
