// adviceLedger.js — tracks every suggestion Sage (the AI coach) gives, whether
// it worked, and whether it's currently allowed to be given again.
//
// Same storage pattern as practiceStore.js / storyMemory.js: a pure
// in-memory class with toJSON()/fromJSON(). ZERO network, ZERO direct
// localStorage access here — a caller (e.g. app.js) owns persistence, the
// same as PracticeStore.
//
// Judging a suggestion: after logAdvice() a suggestion is "pending". The
// caller feeds it the next 5 verdicts for that chord via
// recordVerdictSinceAdvice(chord, verdict) (verdicts come from wherever
// PracticeStore attempts are already being recorded — this module doesn't
// read PracticeStore directly, it just accepts verdicts as they happen).
// 3+ passes out of those next 5 => the suggestion "worked". Otherwise it
// "failed" and that (chord, kind) pair goes off the table for the rest of
// the current session plus the next 3 sessions on that chord, then becomes
// available again. Session boundaries are tracked via beginSession(), which
// a caller should call once per new practice session (mirrors
// PracticeStore#startSession conceptually, but this ledger only needs a
// counter, not full session objects).

import { canonChord } from './chord-canon.js';

// A small, OPEN set of known advice kinds. This is a starting vocabulary for
// callers/tests, not an enforced enum — logAdvice() accepts any non-empty
// string kind so new advice types don't require editing this file.
export const ADVICE_KINDS = Object.freeze({
  THUMB_PLACEMENT: 'thumb_placement',
  PRESS_NEARER_FRET: 'press_nearer_fret',
  SLOW_DOWN: 'slow_down',
  ONE_FINGER_AT_A_TIME: 'one_finger_at_a_time',
});

const VERDICT_WINDOW = 5;
const PASSES_NEEDED = 3;
// "off the table for the rest of the current session AND for the next 3
// sessions": blocked during offTableAtSession, +1, +2, +3; available again
// once currentSession has advanced 4 sessions past the session it failed in.
const COOLDOWN_SESSIONS = 4;

export class AdviceLedger {
  constructor(initial) {
    const i = initial || {};
    // Keyed by canonical chord -> array of advice entries.
    this.ledger = {};
    const src = i.ledger || {};
    for (const key of Object.keys(src)) {
      this.ledger[key] = (src[key] || []).map(e => ({ ...e, verdicts: (e.verdicts || []).slice() }));
    }
    this.currentSession = i.currentSession || 0;
    this._nextId = i._nextId || 1;
  }

  // Call once per new practice session so cooldowns can expire correctly.
  beginSession() {
    this.currentSession++;
    return this.currentSession;
  }

  logAdvice({ chord, kind, timestamp } = {}) {
    if (!chord || typeof chord !== 'string' || !chord.trim()) throw new Error('bad chord: ' + chord);
    if (!kind || typeof kind !== 'string' || !kind.trim()) throw new Error('bad kind: ' + kind);
    const key = canonChord(chord);
    if (!this.ledger[key]) this.ledger[key] = [];
    const entry = {
      id: 'a' + (this._nextId++),
      chord: key,
      kind,
      timestamp: timestamp || Date.now(),
      loggedAtSession: this.currentSession,
      verdicts: [],
      status: 'pending', // 'pending' | 'worked' | 'failed'
      offTableAtSession: null,
    };
    this.ledger[key].push(entry);
    return { ...entry, verdicts: entry.verdicts.slice() };
  }

  // Feed a verdict (pass/fail/unsure) for a chord. Every still-pending advice
  // entry for that chord collects it into its own next-5 window and gets
  // judged independently once it reaches 5.
  recordVerdictSinceAdvice(chord, verdict) {
    if (!['pass', 'fail', 'unsure'].includes(verdict)) throw new Error('bad verdict: ' + verdict);
    const key = canonChord(chord);
    const entries = this.ledger[key] || [];
    for (const e of entries) {
      if (e.status !== 'pending') continue;
      if (e.verdicts.length >= VERDICT_WINDOW) continue;
      e.verdicts.push(verdict);
      if (e.verdicts.length === VERDICT_WINDOW) {
        const passes = e.verdicts.filter(v => v === 'pass').length;
        if (passes >= PASSES_NEEDED) {
          e.status = 'worked';
        } else {
          e.status = 'failed';
          e.offTableAtSession = this.currentSession;
        }
      }
    }
  }

  isAdviceAvailable(chord, kind) {
    const key = canonChord(chord);
    const entries = this.ledger[key] || [];
    for (const e of entries) {
      if (e.kind !== kind) continue;
      if (e.status === 'failed') {
        const availableAgainAtSession = e.offTableAtSession + COOLDOWN_SESSIONS;
        if (this.currentSession < availableAgainAtSession) return false;
      }
    }
    return true;
  }

  getLedgerForChord(chord) {
    const key = canonChord(chord);
    return (this.ledger[key] || []).map(e => ({ ...e, verdicts: e.verdicts.slice() }));
  }

  toJSON() {
    const ledger = {};
    for (const key of Object.keys(this.ledger)) {
      ledger[key] = this.ledger[key].map(e => ({ ...e, verdicts: e.verdicts.slice() }));
    }
    return { ledger, currentSession: this.currentSession, _nextId: this._nextId };
  }
  static fromJSON(o) { return new AdviceLedger(o); }
}
