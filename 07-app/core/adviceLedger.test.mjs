// adviceLedger.test.mjs — covers logAdvice/recordVerdictSinceAdvice judging,
// the off-table cooldown (rest of session + next 3 sessions), and
// getLedgerForChord/toJSON round-trip.
import assert from 'node:assert/strict';
import test from 'node:test';
import { AdviceLedger, ADVICE_KINDS } from './adviceLedger.js';

test('logAdvice records a pending entry; isAdviceAvailable is true before judging', () => {
  const ledger = new AdviceLedger();
  ledger.logAdvice({ chord: 'Em', kind: ADVICE_KINDS.THUMB_PLACEMENT, timestamp: 1000 });
  assert.equal(ledger.isAdviceAvailable('Em', ADVICE_KINDS.THUMB_PLACEMENT), true);
  const entries = ledger.getLedgerForChord('Em');
  assert.equal(entries.length, 1);
  assert.equal(entries[0].status, 'pending');
});

test('3+ passes out of next 5 verdicts => advice worked, stays available', () => {
  const ledger = new AdviceLedger();
  ledger.logAdvice({ chord: 'Em', kind: 'slow_down' });
  ['pass', 'pass', 'fail', 'pass', 'unsure'].forEach(v => ledger.recordVerdictSinceAdvice('Em', v));
  const entries = ledger.getLedgerForChord('Em');
  assert.equal(entries[0].status, 'worked');
  assert.equal(ledger.isAdviceAvailable('Em', 'slow_down'), true);
});

test('fewer than 3 passes out of next 5 => advice failed and goes off the table', () => {
  const ledger = new AdviceLedger();
  ledger.logAdvice({ chord: 'Em', kind: 'press_nearer_fret' });
  ['fail', 'fail', 'pass', 'fail', 'unsure'].forEach(v => ledger.recordVerdictSinceAdvice('Em', v));
  const entries = ledger.getLedgerForChord('Em');
  assert.equal(entries[0].status, 'failed');
  assert.equal(ledger.isAdviceAvailable('Em', 'press_nearer_fret'), false);
});

test('off-table advice is blocked for the rest of the session plus next 3 sessions, then available again', () => {
  const ledger = new AdviceLedger();
  ledger.logAdvice({ chord: 'C', kind: 'one_finger_at_a_time' });
  ['fail', 'fail', 'fail', 'pass', 'unsure'].forEach(v => ledger.recordVerdictSinceAdvice('C', v));
  assert.equal(ledger.isAdviceAvailable('C', 'one_finger_at_a_time'), false, 'blocked in the session it failed');

  ledger.beginSession(); // +1
  assert.equal(ledger.isAdviceAvailable('C', 'one_finger_at_a_time'), false);
  ledger.beginSession(); // +2
  assert.equal(ledger.isAdviceAvailable('C', 'one_finger_at_a_time'), false);
  ledger.beginSession(); // +3
  assert.equal(ledger.isAdviceAvailable('C', 'one_finger_at_a_time'), false);
  ledger.beginSession(); // +4: available again
  assert.equal(ledger.isAdviceAvailable('C', 'one_finger_at_a_time'), true);
});

test('a different kind for the same chord is unaffected by another kind failing', () => {
  const ledger = new AdviceLedger();
  ledger.logAdvice({ chord: 'G', kind: 'slow_down' });
  ['fail', 'fail', 'fail', 'fail', 'fail'].forEach(v => ledger.recordVerdictSinceAdvice('G', v));
  assert.equal(ledger.isAdviceAvailable('G', 'slow_down'), false);
  assert.equal(ledger.isAdviceAvailable('G', 'thumb_placement'), true);
});

test('chord identity is canonicalized (easyC and C share a slot)', () => {
  const ledger = new AdviceLedger();
  ledger.logAdvice({ chord: 'easyC', kind: 'slow_down' });
  const entries = ledger.getLedgerForChord('C');
  assert.equal(entries.length, 1);
  assert.equal(ledger.isAdviceAvailable('easyC', 'slow_down'), ledger.isAdviceAvailable('C', 'slow_down'));
});

test('toJSON/fromJSON round-trips ledger state', () => {
  const ledger = new AdviceLedger();
  ledger.logAdvice({ chord: 'Em', kind: 'slow_down' });
  ['fail', 'fail', 'fail', 'pass', 'unsure'].forEach(v => ledger.recordVerdictSinceAdvice('Em', v));
  ledger.beginSession();
  const restored = AdviceLedger.fromJSON(ledger.toJSON());
  assert.deepEqual(restored.getLedgerForChord('Em'), ledger.getLedgerForChord('Em'));
  assert.equal(restored.isAdviceAvailable('Em', 'slow_down'), ledger.isAdviceAvailable('Em', 'slow_down'));
});
