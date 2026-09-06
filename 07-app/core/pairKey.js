// pairKey.js — normalized chord-pair key.
// PORTED 1:1 from 06-prototypes/practice-engine/pair-key.mjs.
// do not change behavior, fidelity.mjs diffs it.
//
// A chord change is unordered: A<->B must equal B<->A in memory, or the
// weak-pair store splits one real pair into two phantom pairs.
//
// 2026-08-12 ROOT-CAUSE FIX (curriculum-review C-IDENTITY-SPLIT): the same
// musical chord appears under TWO on-disk tokens — `easyC` (Lauren's 2-finger
// C) and `C` (standard). They MUST collapse to one pair key or the weak-pair
// review moat fragments. We canon-ify both sides so easyC↔Em == C↔Em.
import { canonChord, canonPairKey } from './chord-canon.js';

export { canonChord, canonPairKey };

export function pairKey(a, b) {
  return canonPairKey(a, b);
}

export function parsePair(key) {
  const [a, b] = key.split('::');
  return { a, b };
}
