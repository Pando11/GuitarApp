// struggleLadder.test.mjs — Ticket 6 (issue #9) self-test for struggleLadder.js.
// Plain node:test, same convention as adviceLedger.test.mjs.
import assert from 'node:assert/strict';
import test from 'node:test';
import { StruggleLadder, RUNG_KINDS, MAX_RUNG, rungForNumber } from './struggleLadder.js';
import { AdviceLedger } from './adviceLedger.js';

// ---------------------------------------------------------------------------
// Trigger: exactly 5 consecutive fails.
// ---------------------------------------------------------------------------

test('fewer than 5 consecutive fails never escalates', () => {
  const ladder = new StruggleLadder();
  for (let i = 0; i < 4; i++) {
    const r = ladder.recordVerdict('Em', 'fail');
    assert.equal(r.response, 'continue');
    assert.equal(r.rung, null);
  }
  assert.equal(ladder.consecutiveFails('Em'), 4);
});

test('the 5th consecutive fail escalates to rung 1', () => {
  const ladder = new StruggleLadder();
  let last;
  for (let i = 0; i < 5; i++) last = ladder.recordVerdict('Em', 'fail');
  assert.equal(last.response, 'escalate');
  assert.equal(last.rung.rung, 1);
  assert.equal(last.rung.kind, RUNG_KINDS.SLOW_DOWN);
  // Streak resets after firing so the next trigger needs a fresh 5.
  assert.equal(ladder.consecutiveFails('Em'), 0);
});

test('a pass resets the streak — 4 fails then a pass then 4 more fails never triggers', () => {
  const ladder = new StruggleLadder();
  for (let i = 0; i < 4; i++) ladder.recordVerdict('C', 'fail');
  const afterPass = ladder.recordVerdict('C', 'pass');
  assert.equal(afterPass.response, 'continue');
  assert.equal(ladder.consecutiveFails('C'), 0);
  let last;
  for (let i = 0; i < 4; i++) last = ladder.recordVerdict('C', 'fail');
  assert.equal(last.response, 'continue');
  assert.equal(ladder.consecutiveFails('C'), 4);
});

// ---------------------------------------------------------------------------
// 'unsure' does NOT count toward the trigger — gets 'play_again', and does
// not reset an in-progress fail streak either.
// ---------------------------------------------------------------------------

test("'unsure' returns play_again and does not count toward the trigger", () => {
  const ladder = new StruggleLadder();
  const r = ladder.recordVerdict('G', 'unsure');
  assert.equal(r.response, 'play_again');
  assert.equal(r.rung, null);
  assert.equal(ladder.consecutiveFails('G'), 0);
});

test("interspersed 'unsure' verdicts do not reset an in-progress fail streak, and 5 fails still trigger", () => {
  const ladder = new StruggleLadder();
  ladder.recordVerdict('G', 'fail');
  ladder.recordVerdict('G', 'fail');
  const mid = ladder.recordVerdict('G', 'unsure');
  assert.equal(mid.response, 'play_again');
  assert.equal(ladder.consecutiveFails('G'), 2, 'unsure must not reset the fail streak');
  ladder.recordVerdict('G', 'fail');
  ladder.recordVerdict('G', 'fail');
  const last = ladder.recordVerdict('G', 'fail');
  assert.equal(last.response, 'escalate');
  assert.equal(last.rung.rung, 1);
});

test("5 'unsure' verdicts alone never escalate", () => {
  const ladder = new StruggleLadder();
  let last;
  for (let i = 0; i < 5; i++) last = ladder.recordVerdict('D', 'unsure');
  assert.equal(last.response, 'play_again');
  assert.equal(ladder.consecutiveFails('D'), 0);
});

// ---------------------------------------------------------------------------
// Rung ordering / escalation across repeated triggers, using the real
// AdviceLedger so this also proves the ledger integration (not a fake).
// ---------------------------------------------------------------------------

test('rungs escalate in fixed order 1..5 across repeated triggers, then hold at 5', () => {
  const ladder = new StruggleLadder();
  const ledger = new AdviceLedger();
  const seenRungs = [];
  for (let round = 0; round < 7; round++) {
    let last;
    for (let i = 0; i < 5; i++) last = ladder.recordVerdict('Em', 'fail', ledger);
    assert.equal(last.response, 'escalate');
    seenRungs.push(last.rung.rung);
  }
  assert.deepEqual(seenRungs, [1, 2, 3, 4, 5, 5, 5], 'never exceeds MAX_RUNG, holds at pivot forever');
  assert.equal(MAX_RUNG, 5);
});

test('rung kinds are logged into the real AdviceLedger via its own logAdvice API', () => {
  const ladder = new StruggleLadder();
  const ledger = new AdviceLedger();
  for (let i = 0; i < 5; i++) ladder.recordVerdict('Am', 'fail', ledger);
  const entries = ledger.getLedgerForChord('Am');
  assert.equal(entries.length, 1);
  assert.equal(entries[0].kind, RUNG_KINDS.SLOW_DOWN);
  assert.equal(entries[0].status, 'pending');
});

// ---------------------------------------------------------------------------
// The advice ledger is what prevents restarting at rung 1: a fresh
// StruggleLadder instance (e.g. a new session/page load) must still pick up
// where the persisted ledger left off, never back at rung 1.
// ---------------------------------------------------------------------------

test('a fresh StruggleLadder reads prior ledger history and starts one rung higher, not back at rung 1', () => {
  const ledger = new AdviceLedger();
  // Simulate "last time": the ladder escalated to rung 2 for this chord.
  ledger.logAdvice({ chord: 'Em', kind: RUNG_KINDS.SLOW_DOWN });
  ledger.logAdvice({ chord: 'Em', kind: RUNG_KINDS.ISOLATE_FINGER });

  // New session: brand-new StruggleLadder instance, same persisted ledger.
  const ladder = new StruggleLadder();
  let last;
  for (let i = 0; i < 5; i++) last = ladder.recordVerdict('Em', 'fail', ledger);
  assert.equal(last.response, 'escalate');
  assert.equal(last.rung.rung, 3, 'must escalate past the highest rung already recorded, not restart at 1');
});

test('rung choice is per-chord: a streak on one chord never escalates a different chord', () => {
  const ladder = new StruggleLadder();
  const ledger = new AdviceLedger();
  for (let i = 0; i < 5; i++) ladder.recordVerdict('Em', 'fail', ledger);
  assert.equal(ladder.consecutiveFails('C'), 0);
  const r = ladder.recordVerdict('C', 'fail', ledger);
  assert.equal(r.response, 'continue');
});

test('chord identity is canonicalized (easyC and C share the same streak/rung state)', () => {
  const ladder = new StruggleLadder();
  const ledger = new AdviceLedger();
  for (let i = 0; i < 4; i++) ladder.recordVerdict('easyC', 'fail', ledger);
  const last = ladder.recordVerdict('C', 'fail', ledger);
  assert.equal(last.response, 'escalate');
});

// ---------------------------------------------------------------------------
// Pending-rung surfacing (trigger and surfacing can happen at different call
// sites/times in the real app).
// ---------------------------------------------------------------------------

test('peekPendingRung/consumePendingRung let a caller surface a trigger that fired elsewhere', () => {
  const ladder = new StruggleLadder();
  assert.equal(ladder.peekPendingRung('Em'), null);
  for (let i = 0; i < 5; i++) ladder.recordVerdict('Em', 'fail');
  const peeked = ladder.peekPendingRung('Em');
  assert.ok(peeked);
  assert.equal(peeked.rung, 1);
  // peek is non-destructive
  assert.ok(ladder.peekPendingRung('Em'));
  const consumed = ladder.consumePendingRung('Em');
  assert.equal(consumed.rung, 1);
  assert.equal(ladder.consumePendingRung('Em'), null, 'consuming clears it');
});

// ---------------------------------------------------------------------------
// rungForNumber() and message content sanity.
// ---------------------------------------------------------------------------

test('rungForNumber() returns the fixed ladder in the spec order', () => {
  assert.equal(rungForNumber(1).kind, RUNG_KINDS.SLOW_DOWN);
  assert.equal(rungForNumber(2).kind, RUNG_KINDS.ISOLATE_FINGER);
  assert.equal(rungForNumber(3).kind, RUNG_KINDS.REFRAME_PHYSICAL);
  assert.equal(rungForNumber(4).kind, RUNG_KINDS.CHANGE_EXERCISE);
  assert.equal(rungForNumber(5).kind, RUNG_KINDS.PIVOT);
  assert.equal(rungForNumber(6), null);
});

test('rung 5 (pivot) message names the Slice 1 pivot target: tuning -> open strings -> back to E minor', () => {
  const r = rungForNumber(5);
  const lower = r.message.toLowerCase();
  assert.ok(lower.includes('tun'), 'mentions tuning check');
  assert.ok(lower.includes('open'), 'mentions open-string strumming');
  assert.ok(lower.includes('e minor') || lower.includes('em'), 'mentions returning to E minor');
});

// ---------------------------------------------------------------------------
// HARD BAN: no code path in this module can end/pause the session, tell the
// student to stop, or suggest coming back tomorrow.
// ---------------------------------------------------------------------------

const BANNED_PHRASES = [
  'stop practicing', "that's enough for today", 'come back tomorrow',
  'take a break', 'end the session', 'end this session', 'session is over',
  'good enough for now', 'call it a day', "we're done", 'see you tomorrow',
  'stop for now', 'quit', 'goodbye',
];

test('no rung message contains a session-ending/stop/come-back-tomorrow phrase', () => {
  for (let n = 1; n <= MAX_RUNG; n++) {
    const msg = rungForNumber(n).message.toLowerCase();
    for (const phrase of BANNED_PHRASES) {
      assert.equal(msg.includes(phrase), false, `rung ${n} message must not contain "${phrase}"`);
    }
  }
});

test('the module exposes no method capable of ending, pausing, or skipping a session/rung', () => {
  const ladder = new StruggleLadder();
  const proto = Object.getPrototypeOf(ladder);
  const methodNames = Object.getOwnPropertyNames(proto).filter((n) => n !== 'constructor');
  // Strip "Pending" first — both real methods are named *PendingRung and
  // "Pending" itself contains the substring "end", which would otherwise be
  // a false positive against the /end/ check below.
  const dangerous = /end|stop|pause|quit|skip|abort|terminate/i;
  const offenders = methodNames.filter((n) => dangerous.test(n.replace(/Pending/g, '')));
  assert.deepEqual(offenders, [], 'StruggleLadder must expose no end/stop/pause/skip-shaped method');
});

test('escalate is the only response that ever carries a rung — the model is never handed a choice, only the rung already chosen', () => {
  const ladder = new StruggleLadder();
  const responses = ['continue', 'play_again'];
  for (let i = 0; i < 4; i++) {
    const r = ladder.recordVerdict('F', 'fail');
    assert.ok(responses.includes(r.response) || r.response === 'escalate');
    if (r.response !== 'escalate') assert.equal(r.rung, null);
  }
});
