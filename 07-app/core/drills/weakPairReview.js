// weakPairReview.js — §5.2 drill #9: Weak-Pair Review.
// PORTED 1:1 from 06-prototypes/practice-engine/drills/weak-pair-review.mjs,
// do not change behavior, fidelity.mjs diffs it.
//
// Pulls the K weakest pairs from the fluency store and drills them. The UI
// DISPLAY already exists (practice-ui.html card 2 / reviewList) — this module
// is the DATA / runDrill layer only; it does NOT rebuild the display.
//
// selectWeakest is exposed by the fluency store instance (per fluency-store.mjs
// design: it is a closure returned from createFluencyStore, not a standalone
// named export, so we call store.selectWeakest — the engine's own API).
// NOTE: do not modify fluencyStore.js (engine math file) to add an export;
// using the store method is the correct, rule-compliant path.
//
// runDrill(params) -> engine-compatible envelope.
import { createFluencyStore } from '../fluencyStore.js';

export const DRILL = 'weak-pair-review';

export function runDrill(params = {}) {
  const {
    knownPairs = [],
    store = null,
    K = 3,
    now = () => Date.now(),
    // optional: record these samples first (e.g. from a just-finished drill)
    samples = [],
  } = params;

  const s = store || createFluencyStore({ knownPairs, now });
  for (const smp of samples) {
    if (s.record) s.record(smp.pair, { ratePerMin: smp.ratePerMin }, now());
  }
  // store.selectWeakest IS the engine's weak-pair selector (DECISION 3: K weakest).
  const weakest = s.selectWeakest(K, now());
  const pairs = weakest.map((w) => w.pair);
  const fluencies = weakest.map((w) => w.fluency);

  return {
    drill: DRILL,
    params: { ...params, K },
    events: [],
    metrics: { weakest, pairs, fluencies },
    ratePerMin: null,
    score: null,
    passed: null,
    summary: `Weakest ${K} pairs: ${pairs.join(', ') || '(none yet)'} — drill these next.`,
  };
}
