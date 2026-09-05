import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateFactsEnvelope } from '../src/schema.js';

function fullEnvelope(overrides = {}) {
  return {
    anonId: 'anon-123',
    learnerProfile: {
      ageBand: '18-34',
      experience: 'never-held-one',
      goal: 'play campfire songs',
      minutesPerDay: 15,
    },
    lessonId: 'L01',
    stepId: 'intro',
    mastery: [{ chord: 'G', label: 'needs_work', confidence: 40 }],
    justHappened: { drillId: 'chord-perfect-1', passed: true, score: 88, ratePerMin: 12 },
    recentHistory: [{ lessonId: 'L00', completedAt: '2026-09-01T00:00:00.000Z', confidenceDelta: 5 }],
    ...overrides,
  };
}

test('valid full envelope passes', () => {
  const result = validateFactsEnvelope(fullEnvelope());
  assert.equal(result.ok, true);
  assert.equal(result.value.lessonId, 'L01');
  assert.equal(result.value.mastery[0].chord, 'G');
});

test('valid envelope with justHappened:null and recentHistory:[] passes', () => {
  const input = fullEnvelope({ justHappened: null, recentHistory: [] });
  const result = validateFactsEnvelope(input);
  assert.equal(result.ok, true);
  assert.equal(result.value.justHappened, null);
  assert.deepEqual(result.value.recentHistory, []);
});

test('valid envelope with justHappened and recentHistory entirely absent applies defaults', () => {
  const input = fullEnvelope();
  delete input.justHappened;
  delete input.recentHistory;
  const result = validateFactsEnvelope(input);
  assert.equal(result.ok, true);
  assert.equal(result.value.justHappened, null);
  assert.deepEqual(result.value.recentHistory, []);
});

test('missing required field (lessonId) rejected', () => {
  const input = fullEnvelope();
  delete input.lessonId;
  const result = validateFactsEnvelope(input);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.startsWith('lessonId')));
});

test('wrong type (minutesPerDay as wrong type) rejected', () => {
  const input = fullEnvelope();
  input.learnerProfile.minutesPerDay = '15';
  const result = validateFactsEnvelope(input);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes('minutesPerDay')));
});

test('out-of-range confidence rejected', () => {
  const input = fullEnvelope();
  input.mastery = [{ chord: 'G', label: 'needs_work', confidence: 150 }];
  const result = validateFactsEnvelope(input);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes('confidence')));
});

test('unknown top-level field passes but is stripped from output', () => {
  const input = fullEnvelope({ somethingSneaky: 'drop-me' });
  const result = validateFactsEnvelope(input);
  assert.equal(result.ok, true);
  assert.equal(result.value.somethingSneaky, undefined);
});

test('unknown nested field in mastery[] item dropped', () => {
  const input = fullEnvelope();
  input.mastery = [{ chord: 'G', label: 'needs_work', confidence: 40, extra: 'nope' }];
  const result = validateFactsEnvelope(input);
  assert.equal(result.ok, true);
  assert.equal(result.value.mastery[0].extra, undefined);
});

test('oversized goal string rejected', () => {
  const input = fullEnvelope();
  input.learnerProfile.goal = 'x'.repeat(201);
  const result = validateFactsEnvelope(input);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes('goal')));
});

test('non-object body (array/string/null) rejected', () => {
  assert.equal(validateFactsEnvelope([]).ok, false);
  assert.equal(validateFactsEnvelope('nope').ok, false);
  assert.equal(validateFactsEnvelope(null).ok, false);
});
