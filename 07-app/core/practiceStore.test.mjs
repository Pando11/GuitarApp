// practiceStore.test.mjs — Wave 2 task E. Covers existing PracticeStore
// behavior (sessions/attempts/skill map) plus the new per-pair fluency
// surface (recordDrillResult/getWeakPairs) added on top of
// practiceFluencyBridge.js.
import assert from 'node:assert/strict';
import test from 'node:test';
import { PracticeStore } from './practiceStore.js';

test('startSession/logAttempt/getSkillMap still work unchanged', () => {
  const store = new PracticeStore();
  const id = store.startSession('lesson1');
  store.logAttempt(id, { chordName: 'C', verdict: 'pass' });
  store.logAttempt(id, { chordName: 'C', verdict: 'fail' });
  const map = store.getSkillMap();
  assert.equal(map.C.clean, 1);
  assert.equal(map.C.fail, 1);
});

test('toJSON/fromJSON round-trips existing fields unchanged', () => {
  const store = new PracticeStore();
  const id = store.startSession('lesson1');
  store.logAttempt(id, { chordName: 'G', verdict: 'pass' });
  store.finalizeSession(id, { completed: true, durationSec: 60 });
  const json = store.toJSON();
  const restored = PracticeStore.fromJSON(json);
  assert.deepEqual(restored.getSkillMap(), store.getSkillMap());
  assert.equal(restored.lessonCompleted('lesson1'), true);
});

test('recordDrillResult updates getWeakPairs() output', () => {
  const store = new PracticeStore({
    practiceFluency: { knownPairs: [['Em', 'C'], ['Em', 'G'], ['Em', 'D'], ['Em', 'A']] },
  });
  // Before recording anything, all 4 pairs are cold (equally weak).
  const before = store.getWeakPairs(3);
  assert.equal(before.length, 3);

  // Record a strong result for Em-C so it should drop out of the weakest 3.
  store.recordDrillResult({ pairKey: 'Em::C', ratePerMin: 40, cleanChanges: 40, drillId: 'weak-pair-review', passed: true, score: 1 });
  const after = store.getWeakPairs(3);
  assert.equal(after.length, 3);
  assert.ok(!after.some(p => (p.pairKey || p.key) === 'Em::C'), 'Em::C should no longer be among the 3 weakest after a strong result');
});

test('recordDrillResult also appends a session attempt like logAttempt does', () => {
  const store = new PracticeStore({ practiceFluency: { knownPairs: [['Em', 'C']] } });
  const before = store.sessions.length;
  store.recordDrillResult({ pairKey: 'Em::C', ratePerMin: 30, drillId: 'tempo-loop', passed: true, score: 0.8 });
  assert.ok(store.sessions.length >= before);
  const last = store.sessions[store.sessions.length - 1];
  const attempt = last.attempts[last.attempts.length - 1];
  assert.equal(attempt.pairKey, 'Em::C');
  assert.equal(attempt.drillId, 'tempo-loop');
  assert.equal(attempt.verdict, 'pass');
});

test('fromJSON(store.toJSON()) round-trip preserves fluency data', () => {
  const store = new PracticeStore({ practiceFluency: { knownPairs: [['Em', 'C'], ['Em', 'G'], ['Em', 'D']] } });
  store.recordDrillResult({ pairKey: 'Em::C', ratePerMin: 50, passed: true });
  const before = store.getWeakPairs(3);

  const restored = PracticeStore.fromJSON(store.toJSON());
  const after = restored.getWeakPairs(3);

  assert.deepEqual(after, before);
});
