// practiceFluencyBridge.js — Wave 2 task D. Composes fluencyStore.js (via
// practiceLoop.js) + reviewScheduler.js into the single API named in the
// Wave 1/2 contract (docs/plans/quizzical-skipping-balloon.md). This is the
// ONLY module practiceStore.js (Wave 2 task E) may call into for fluency —
// it must never reach into fluencyStore.js / reviewScheduler.js directly.
//
// Not a port: original composition code, so no fidelity.mjs entry.
//
// Note: reviewScheduler.js's computeReviewState/pairNeedsReview logic is not
// needed to satisfy the exact 4-method contract below (getWeakPairs already
// gets weakest-first ordering straight from fluencyStore's selectWeakest via
// practiceLoop.js) — it stays available in 07-app/core/reviewScheduler.js for
// a future nudge/streak UI to import on its own.

import { createPracticeLoop } from './practiceLoop.js';

// Internal: build the bridge's public surface on top of an already-constructed
// practiceLoop (so both createPracticeFluencyBridge and fromJSON share one
// implementation instead of duplicating it).
function _buildBridge(loop, { storageKey, knownPairs }) {
  const now = () => Date.now();

  function recordDrillResult({ pairKey: pk, ratePerMin, cleanChanges } = {}) {
    if (!pk) return null;
    // ratePerMin is the primary signal fluencyStore consumes. If only
    // cleanChanges is provided (no explicit rate), fall back to treating
    // cleanChanges as the per-minute rate directly (a 1-minute drill's
    // clean-change count already IS its per-minute rate).
    const rate = typeof ratePerMin === 'number' ? ratePerMin : (cleanChanges || 0);
    return loop.store.record(pk, { ratePerMin: rate }, now());
  }

  function getWeakPairs(k = 3) {
    return loop.store.selectWeakest(k, now());
  }

  function toJSON() {
    return {
      storageKey,
      knownPairs,
      fluency: loop.toJSON(),
    };
  }

  return { recordDrillResult, getWeakPairs, toJSON };
}

export function createPracticeFluencyBridge({ knownPairs = [], storageKey } = {}) {
  const loop = createPracticeLoop({ knownPairs, K: 3, now: () => Date.now() });
  return _buildBridge(loop, { storageKey, knownPairs });
}

// contract: "static fromJSON(o)" — attached to the factory function since
// this module has no class to hang a real static method off of.
createPracticeFluencyBridge.fromJSON = function fromJSON(o) {
  const saved = o || {};
  const knownPairs = saved.knownPairs || [];
  const loop = createPracticeLoop({ knownPairs, K: 3, now: () => Date.now() });
  if (saved.fluency) loop.store.load(saved.fluency);
  return _buildBridge(loop, { storageKey: saved.storageKey, knownPairs });
};
