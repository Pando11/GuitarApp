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

test('an absent question defaults to null', () => {
  const result = validateFactsEnvelope(fullEnvelope());
  assert.equal(result.ok, true);
  assert.equal(result.value.question, null);
});

test('a typed question is carried through verbatim', () => {
  const result = validateFactsEnvelope(fullEnvelope({ question: 'Why does my G buzz?' }));
  assert.equal(result.ok, true);
  assert.equal(result.value.question, 'Why does my G buzz?');
});

test('an over-long question is rejected rather than truncated', () => {
  const result = validateFactsEnvelope(fullEnvelope({ question: 'x'.repeat(301) }));
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.startsWith('question')));
});

test('a non-string question is rejected', () => {
  const result = validateFactsEnvelope(fullEnvelope({ question: { text: 'hi' } }));
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.startsWith('question')));
});

test('an absent lessonId is allowed and defaults to null (the practice screen has no lesson)', () => {
  const input = fullEnvelope();
  delete input.lessonId;
  const result = validateFactsEnvelope(input);
  assert.equal(result.ok, true);
  assert.equal(result.value.lessonId, null);
});

test('a present but non-string lessonId is still rejected', () => {
  const result = validateFactsEnvelope(fullEnvelope({ lessonId: 7 }));
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.startsWith('lessonId')));
});

test('anonId is still required — it is what the rate limiter keys on', () => {
  const input = fullEnvelope();
  delete input.anonId;
  const result = validateFactsEnvelope(input);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.startsWith('anonId')));
});

test('a student with no profile at all is accepted (onboarding is skippable)', () => {
  const result = validateFactsEnvelope(fullEnvelope({ learnerProfile: {} }));
  assert.equal(result.ok, true);
  assert.deepEqual(result.value.learnerProfile, {});
});

test('a partial profile keeps the fields that are there', () => {
  const result = validateFactsEnvelope(fullEnvelope({ learnerProfile: { experience: 'returning-player' } }));
  assert.equal(result.ok, true);
  assert.deepEqual(result.value.learnerProfile, { experience: 'returning-player' });
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

// --- lessonChords (2026-09-08) -------------------------------------------

test('lessonChords is optional and defaults to an empty array', () => {
  const input = fullEnvelope();
  delete input.lessonChords;
  const result = validateFactsEnvelope(input);
  assert.equal(result.ok, true);
  assert.deepEqual(result.value.lessonChords, []);
});

test('a verified chord shape passes through intact', () => {
  const shape = { chord: 'Em', frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0] };
  const result = validateFactsEnvelope(fullEnvelope({ lessonChords: [shape] }));
  assert.equal(result.ok, true);
  assert.deepEqual(result.value.lessonChords, [shape]);
});

test('a chord named without a diagram is allowed', () => {
  const result = validateFactsEnvelope(fullEnvelope({ lessonChords: [{ chord: 'Em' }] }));
  assert.equal(result.ok, true);
  assert.deepEqual(result.value.lessonChords, [{ chord: 'Em' }]);
});

test('a muted string (null) is a valid fret entry', () => {
  const result = validateFactsEnvelope(fullEnvelope({ lessonChords: [{ chord: 'C', frets: [null, 3, 2, 0, 1, 0] }] }));
  assert.equal(result.ok, true);
  assert.deepEqual(result.value.lessonChords[0].frets, [null, 3, 2, 0, 1, 0]);
});

test('lessonChords that is not an array is rejected', () => {
  const result = validateFactsEnvelope(fullEnvelope({ lessonChords: 'Em' }));
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes('lessonChords')));
});

test('a bare string entry is rejected — a shape is an object', () => {
  const result = validateFactsEnvelope(fullEnvelope({ lessonChords: ['Em'] }));
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes('lessonChords[0]')));
});

test('an entry with no chord name is rejected', () => {
  const result = validateFactsEnvelope(fullEnvelope({ lessonChords: [{ frets: [0, 2, 2, 0, 0, 0] }] }));
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes('lessonChords[0].chord')));
});

test('an over-long chord name is rejected', () => {
  const result = validateFactsEnvelope(fullEnvelope({ lessonChords: [{ chord: 'x'.repeat(13) }] }));
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes('lessonChords')));
});

test('a frets array that is not six entries is rejected', () => {
  const result = validateFactsEnvelope(fullEnvelope({ lessonChords: [{ chord: 'Em', frets: [0, 2] }] }));
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes('frets')));
});

test('a non-integer fret is rejected', () => {
  const result = validateFactsEnvelope(fullEnvelope({ lessonChords: [{ chord: 'Em', frets: [0, 2.5, 2, 0, 0, 0] }] }));
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes('frets[1]')));
});

test('an out-of-range fret is rejected', () => {
  const result = validateFactsEnvelope(fullEnvelope({ lessonChords: [{ chord: 'Em', frets: [0, 99, 2, 0, 0, 0] }] }));
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes('frets[1]')));
});

test('too many lessonChords entries is rejected', () => {
  const many = Array.from({ length: 25 }, (_, i) => ({ chord: 'c' + i }));
  const result = validateFactsEnvelope(fullEnvelope({ lessonChords: many }));
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes('lessonChords')));
});
