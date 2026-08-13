// practice-loop.mjs — wires the sensor (30/60) to the consumer (weak-pair review).
//
// DECISION 1 (diagnostic, not a wall): a 30/min miss does NOT block the next
//   technique lesson (our spine is linear; blocking would wall the student when
//   a new chord adds up to 6 new pairs at once). It is a progress signal that
//   feeds the memory store so weak-pair review picks it up.
// DECISION 2 (measure the WEAKEST pair): when a lesson teaches chord X, we run
//   1-min-changes on EVERY new pair (X-old) and record each; the weakest pair
//   is what surfaces in review. This is the truest signal and the moat driver.
// DECISION 3 (K=3): a review session targets the 3 weakest pairs.

import { pairKey } from './pair-key.mjs';
import { measureOneMinute } from './one-minute-changes.mjs';
import { createFluencyStore } from './fluency-store.mjs';

export function createPracticeLoop({ knownPairs = [], K = 3, now } = {}) {
  const store = createFluencyStore({ knownPairs, now });

  // Run 1-min-changes for a taught chord X against all prior chords `olds`.
  // Returns per-pair measurements and updates memory. cadencePerMin/skill are
  // provided by the live listener in production; here by listener-sim in tests.
  function measureLessonPair(X, olds, simulateFn) {
    const results = [];
    for (const old of olds) {
      const key = pairKey(X, old);
      const strumEvents = simulateFn(X, old); // -> [{chord,confident,t}]
      const m = measureOneMinute([X, old], strumEvents);
      store.record(key, { ratePerMin: m.ratePerMin });
      results.push({ pair: key, ...m });
    }
    // DECISION 2: weakest pair = lowest rate among those just measured.
    const weakest = results.slice().sort((a, b) => a.ratePerMin - b.ratePerMin)[0];
    return { results, weakest };
  }

  // DECISION 3: a review session = the K weakest pairs right now.
  function buildReviewSession() {
    const weak = store.selectWeakest(K);
    return {
      pairs: weak.map((w) => w.pair),
      fluencies: weak.map((w) => w.fluency),
    };
  }

  return {
    store,
    measureLessonPair,
    buildReviewSession,
    snapshot: store.snapshot,
    toJSON: store.toJSON,
  };
}
