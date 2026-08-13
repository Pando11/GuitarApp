// fluency-store.mjs — on-device student memory for chord-pair fluency.
// Pure arithmetic, no audio, no network, no deps. Designed to run identically
// in Node (tests) and the browser (localStorage). The "audio never uploaded"
// rule is satisfied by construction: this module never touches audio.

import { pairKey } from './pair-key.mjs';

// Spacing effect (VERIFIED-LEARNING-SCIENCE: Wikipedia "Spacing effect"):
// memory decays with disuse. tau = 3 days => after 3 days idle a pair's
// fluency falls to ~37% of its last value, surfacing it for review.
const TAU_MS = 3 * 24 * 60 * 60 * 1000;
// EMA learning rate: how fast a new sample pulls fluency toward it.
const ALPHA = 0.4;

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

export function createFluencyStore({ knownPairs = [], now = () => Date.now() } = {}) {
  // mem: Map pairKey -> { fluency, lastPracticed, samples }
  const mem = new Map();

  // Cold-start: every taught pair begins at fluency 0 (unknown = weakest),
  // so the review queue always has real material to surface before any data
  // exists. This is the bootstrap that prevents an empty first review.
  for (const p of knownPairs) {
    const k = typeof p === 'string' ? p : pairKey(p[0], p[1]);
    if (!mem.has(k)) mem.set(k, { fluency: 0, lastPracticed: null, samples: 0 });
  }

  function decay(nowMs = now()) {
    for (const rec of mem.values()) {
      if (rec.lastPracticed == null) continue;
      const dt = Math.max(0, nowMs - rec.lastPracticed);
      rec.fluency = rec.fluency * Math.exp(-dt / TAU_MS);
    }
  }

  // sample: { ratePerMin } from a 1-minute-changes measurement (or any drill
  // that yields a per-minute clean-change rate). 60/min => score 1.0, 30 => 0.5.
  function record(pair, sample, nowMs = now()) {
    const k = typeof pair === 'string' ? pair : pairKey(pair[0], pair[1]);
    const score = clamp((sample.ratePerMin || 0) / 60, 0, 1);
    let rec = mem.get(k);
    if (!rec) {
      rec = { fluency: 0, lastPracticed: null, samples: 0 };
      mem.set(k, rec);
    }
    rec.fluency =
      rec.lastPracticed == null ? score : ALPHA * score + (1 - ALPHA) * rec.fluency;
    rec.lastPracticed = nowMs;
    rec.samples += 1;
    return rec;
  }

  // Decay-then-rank; return the K weakest pairs (lowest fluency first).
  function selectWeakest(K = 3, nowMs = now()) {
    decay(nowMs);
    return [...mem.entries()]
      .map(([key, rec]) => ({ pair: key, fluency: rec.fluency, samples: rec.samples }))
      .sort((a, b) => a.fluency - b.fluency)
      .slice(0, K);
  }

  function snapshot(nowMs = now()) {
    decay(nowMs);
    return [...mem.entries()].map(([key, rec]) => ({
      pair: key,
      fluency: rec.fluency,
      samples: rec.samples,
      lastPracticed: rec.lastPracticed,
    }));
  }

  function load(saved) {
    // restore a previously serialized store (browser localStorage / node fs)
    if (!saved) return;
    for (const [k, v] of Object.entries(saved)) {
      mem.set(k, {
        fluency: v.fluency ?? 0,
        lastPracticed: v.lastPracticed ?? null,
        samples: v.samples ?? 0,
      });
    }
  }

  function toJSON() {
    const out = {};
    for (const [k, rec] of mem.entries()) {
      out[k] = { fluency: rec.fluency, lastPracticed: rec.lastPracticed, samples: rec.samples };
    }
    return out;
  }

  return { record, selectWeakest, snapshot, decay, load, toJSON };
}
