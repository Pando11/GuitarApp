// oneMinuteChanges.js — measureOneMinute / countChanges — the 30/60 SENSOR.
// PORTED 1:1 from 06-prototypes/practice-engine/one-minute-changes.mjs.
// do not change behavior, fidelity.mjs diffs it.
//
// Contract: the constrained listener (AMENDMENT-05) has ALREADY matched
// each strum against the KNOWN target pair. Every event carries the actual chord
// name it heard plus a confidence flag:
//   { chord: <name> | null, confident: bool, t: ms }
// The listener only ever emits one of the two known chord names (or null when it
// could NOT confidently hear the target chord — Rule 6: "play that again").
//
// A change counts ONLY when two CONSECUTIVE CONFIDENT strums differ. This makes
// 30/min the real JustinGuitar benchmark instead of a button-mash: spamming one
// chord yields zero changes, and lazily hitting the wrong chord with low
// confidence is simply not counted.

export const ADVANCE_PER_MIN = 30; // ready to advance (diagnostic, not a wall)
export const GOAL_PER_MIN = 60;    // one clean change per second

export function countChanges(strumEvents, pair) {
  const pairSet = pair
    ? new Set([pair[0], pair[1]])
    : null;
  let changes = 0;
  let confidentStrums = 0;
  let lastClean = null; // chord name | null
  for (const e of strumEvents) {
    const isKnown = pairSet ? pairSet.has(e.chord) : e.chord != null;
    const isClean = e.confident === true && isKnown;
    if (!isClean) {
      // Ignore unreliable strums but KEEP lastClean: an unclean strum between
      // two clean strums of different chords is still a real change.
      continue;
    }
    confidentStrums += 1;
    const cur = e.chord;
    if (lastClean !== null && cur !== lastClean) changes += 1;
    lastClean = cur;
  }
  return { changes, confidentStrums };
}

// durationMin: the measured window length (default 1.0 = 60s).
// pair: optional [nameA, nameB] to validate strum names against.
export function measureOneMinute(pair, strumEvents, durationMin = 1.0) {
  const { changes, confidentStrums } = countChanges(strumEvents, pair);
  const rate = durationMin > 0 ? changes / durationMin : 0;
  const confidentRatio = strumEvents.length
    ? confidentStrums / strumEvents.length
    : 0;
  return {
    pair: Array.isArray(pair) ? pair.join('::') : pair,
    changes,
    ratePerMin: Math.round(rate * 100) / 100,
    advance: rate >= ADVANCE_PER_MIN, // diagnostic flag (see DECISION 1)
    goal: rate >= GOAL_PER_MIN,
    confidentStrums,
    totalStrums: strumEvents.length,
    confidentRatio: Math.round(confidentRatio * 1000) / 1000,
  };
}
