// struggleLadder.js — Ticket 6 (issue #9): struggle-ladder policy module.
//
// Trigger: 5 CONSECUTIVE fail verdicts on the same chord. An 'unsure'
// verdict does NOT count toward the trigger (it neither advances nor resets
// the fail streak) — the caller should just say "play that again" for those,
// not escalate the ladder. A 'pass' resets the streak to zero.
//
// The rung is chosen HERE, in code — deterministically — never by the model.
// A caller (drillRunner.js) hands the model only the rung's already-written
// `message` (and, where real stored data supports it, a real `action`) to
// voice; the model never sees the raw fail-streak logic and has no way to
// pick a different rung or skip one.
//
// Ladder (fixed order, per issue #9):
//   1. slow_down            — drop tempo / take the metronome off.
//   2. isolate_finger       — one finger at a time: place and check, then add.
//   3. reframe_physical     — a different concrete image for the same problem
//                             (press nearer the fret wire, thumb behind the
//                             neck, lift and re-plant).
//   4. change_exercise      — same skill, different angle.
//   5. pivot                — only once the ladder is genuinely exhausted.
//                             Slice 1's pivot target: tuning check -> open
//                             string strumming with the metronome -> back to
//                             E minor.
//
// The advice ledger (adviceLedger.js) is what makes "start one rung higher
// next time, not back at the top" possible: every rung this module hands out
// is logged into the ledger (via its real logAdvice() API — this module
// never reinvents ledger storage), and the NEXT time the ladder trigger
// fires for that chord, the rung chosen is one past the highest ladder rung
// already found in the ledger for that chord — regardless of whether that
// earlier rung was judged 'worked', 'failed', or is still 'pending', and
// regardless of session boundaries (the ledger already persists across
// sessions; this module just reads it).
//
// HARD BAN (non-negotiable, owner-specified): nothing in this module may end
// the session, tell the student to stop, or suggest coming back tomorrow.
// There is no method here that can do any of those things, and once rung 5
// (pivot) is reached, further triggers simply hand out rung 5 again forever
// — the ladder never runs out and never asks the student to leave.

import { canonChord } from './chord-canon.js';
import { ADVICE_KINDS } from './adviceLedger.js';

const TRIGGER_STREAK = 5;

// Ladder-specific advice-ledger kinds. adviceLedger.js's ADVICE_KINDS is
// documented as an OPEN set ("a starting vocabulary... not an enforced
// enum") — logAdvice() accepts any non-empty string kind, so these new
// kinds need no change to adviceLedger.js. Two rungs (1 and 2) already have
// a matching name in ADVICE_KINDS' starting vocabulary, so those are reused
// verbatim rather than inventing a synonym; rungs 3-5 get their own.
export const RUNG_KINDS = Object.freeze({
  SLOW_DOWN: ADVICE_KINDS.SLOW_DOWN, // 'slow_down'
  ISOLATE_FINGER: ADVICE_KINDS.ONE_FINGER_AT_A_TIME, // 'one_finger_at_a_time'
  REFRAME_PHYSICAL: 'reframe_physical',
  CHANGE_EXERCISE: 'change_exercise',
  PIVOT: 'pivot_tuning_open_string',
});

// The fixed, in-order ladder. `message` is the exact wording handed to the
// caller to surface (directly, or as the seed a model re-voices) — written
// here in code so the model is never asked to choose or word the escalation
// policy itself, only to speak the line it's given.
const RUNGS = Object.freeze([
  {
    rung: 1,
    kind: RUNG_KINDS.SLOW_DOWN,
    message: "Let's slow this down — drop the tempo, or take the metronome off if it's adding pressure.",
  },
  {
    rung: 2,
    kind: RUNG_KINDS.ISOLATE_FINGER,
    message: 'One finger at a time: place the first finger and check it, then add the next one on top.',
  },
  {
    rung: 3,
    kind: RUNG_KINDS.REFRAME_PHYSICAL,
    message: 'Try pressing nearer the fret wire, keep your thumb behind the neck, and lift and re-plant the whole shape.',
  },
  {
    rung: 4,
    kind: RUNG_KINDS.CHANGE_EXERCISE,
    message: "Let's come at the same skill from a different angle with a different exercise.",
  },
  {
    rung: 5,
    kind: RUNG_KINDS.PIVOT,
    message: "Let's reset: a quick tuning check, then some open-string strumming with the metronome, then back to E minor.",
  },
]);

const RUNG_BY_KIND = Object.freeze(
  RUNGS.reduce((m, r) => { m[r.kind] = r.rung; return m; }, {})
);

// Defense-in-depth self-check (also exercised by struggleLadder.test.mjs):
// none of the ladder's own wording may contain a session-ending phrase.
// This is not the ONLY thing enforcing the hard ban (the real enforcement is
// architectural — this module exposes no method that can end/pause a
// session — see the header), but it also guards against that wording ever
// drifting to sound like one.
const BANNED_PHRASES = [
  'stop practicing', "that's enough for today", 'come back tomorrow',
  'take a break', 'end the session', 'end this session', 'session is over',
  'good enough for now', 'call it a day', "we're done", 'see you tomorrow',
];
for (const r of RUNGS) {
  const lower = r.message.toLowerCase();
  for (const phrase of BANNED_PHRASES) {
    if (lower.includes(phrase)) {
      // Fail loudly at import time — a banned phrase in the ladder's own
      // fixed wording is a bug in this file, not a runtime condition.
      throw new Error('struggleLadder.js: banned phrase "' + phrase + '" found in rung message');
    }
  }
}

export const MAX_RUNG = RUNGS.length;

function keyFor(chord) {
  return canonChord(chord);
}

/**
 * StruggleLadder — per-chord consecutive-fail tracking + deterministic rung
 * selection. Pure in-memory state (no I/O), same posture as AdviceLedger.
 */
export class StruggleLadder {
  constructor() {
    // canonical chord -> current consecutive-fail count.
    this._streak = {};
    // canonical chord -> rung descriptor waiting to be surfaced by a caller
    // (set the moment a trigger fires; cleared once the caller consumes it).
    this._pending = {};
  }

  consecutiveFails(chord) {
    return this._streak[keyFor(chord)] || 0;
  }

  /**
   * recordVerdict(chord, verdict, adviceLedger) -> {
   *   response: 'play_again' | 'continue' | 'escalate',
   *   rung: rungDescriptor | null,
   * }
   *
   * Feed one real verdict ('pass' | 'fail' | 'unsure') for `chord`.
   *   - 'unsure' never counts toward the trigger and never resets it either
   *     — the caller should just ask the student to play that again.
   *   - 'pass' resets the streak to zero.
   *   - 'fail' advances the streak; once it reaches 5 CONSECUTIVE fails, the
   *     ladder fires: the streak resets (so the next trigger needs another 5
   *     fresh consecutive fails), the chosen rung is logged into
   *     `adviceLedger` (when supplied) via its real logAdvice() API, and the
   *     rung descriptor is both returned and stashed as "pending" for that
   *     chord (see peekPendingRung/consumePendingRung below) so a caller
   *     that finds out about the fail via one code path (e.g. drillRunner's
   *     drill-result handling) can still surface it later via another
   *     (e.g. askCoachAbout()).
   *
   * Never ends, pauses, or skips anything on its own — the ONLY things this
   * method can return are "play that again", "keep going", or "here is the
   * next rung", per the hard ban in this file's header.
   */
  recordVerdict(chord, verdict, adviceLedger) {
    if (!chord || typeof chord !== 'string') throw new Error('bad chord: ' + chord);
    if (!['pass', 'fail', 'unsure'].includes(verdict)) throw new Error('bad verdict: ' + verdict);
    const key = keyFor(chord);

    if (verdict === 'unsure') {
      return { response: 'play_again', rung: null };
    }
    if (verdict === 'pass') {
      this._streak[key] = 0;
      return { response: 'continue', rung: null };
    }

    // verdict === 'fail'
    const next = (this._streak[key] || 0) + 1;
    this._streak[key] = next;
    if (next < TRIGGER_STREAK) {
      return { response: 'continue', rung: null };
    }

    // Trigger: reset the streak (debounce — the next trigger needs a fresh
    // run of 5) and choose the next rung.
    this._streak[key] = 0;
    const rung = this._chooseRung(key, adviceLedger);
    if (adviceLedger && typeof adviceLedger.logAdvice === 'function') {
      adviceLedger.logAdvice({ chord: key, kind: rung.kind });
    }
    this._pending[key] = rung;
    return { response: 'escalate', rung };
  }

  // Deterministic rung choice: one past the highest ladder rung already
  // recorded for this chord in the advice ledger (worked/failed/pending all
  // count — this module never re-litigates whether an earlier rung
  // "counted"), capped at the last rung (pivot repeats forever rather than
  // running out). With no ledger, or nothing recorded yet, starts at rung 1.
  _chooseRung(key, adviceLedger) {
    let highest = 0;
    if (adviceLedger && typeof adviceLedger.getLedgerForChord === 'function') {
      let entries = [];
      try { entries = adviceLedger.getLedgerForChord(key) || []; } catch (e) { entries = []; }
      for (const e of entries) {
        const r = e && RUNG_BY_KIND[e.kind];
        if (r && r > highest) highest = r;
      }
    }
    const nextRung = Math.min(highest + 1, MAX_RUNG);
    return RUNGS[nextRung - 1];
  }

  /** Non-destructive peek at a chord's pending (not-yet-surfaced) rung. */
  peekPendingRung(chord) {
    return this._pending[keyFor(chord)] || null;
  }

  /** Returns and clears a chord's pending rung, or null if there is none. */
  consumePendingRung(chord) {
    const key = keyFor(chord);
    const rung = this._pending[key] || null;
    if (rung) delete this._pending[key];
    return rung;
  }
}

export function rungForNumber(n) {
  return RUNGS[n - 1] || null;
}

export default { StruggleLadder, RUNG_KINDS, MAX_RUNG, rungForNumber };
