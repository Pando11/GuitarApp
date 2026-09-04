// chord-canon.js — canonical chord identity for the practice/fluency memory.
//
// ROOT CAUSE FIX (curriculum-review 2026-08-12, finding C-IDENTITY-SPLIT /
// NO-C-GRADUATION-LESSON): the on-disk curriculum uses TWO different tokens for
// the same musical chord — `easyC` (Lauren's 2-finger reduction) and `C`
// (standard 6-string voicing). They spell the SAME chord (C E G, proven by
// chord-theory-check). But the practice memory keys fluency by the LITERAL
// chord name, so a student's easyC progress in L03-07 was stored in a different
// slot than the `C` they play from L08 on. The weak-pair review moat —
// "adaptively review YOUR weak chord pairs" — silently fragmented: one musical
// chord = two phantom memories, and review could never see that easyC↔Em and
// C↔Em are the SAME pair to the learner.
//
// FIX: canonicalize at the memory boundary. `canonChord('easyC') ===
// canonChord('C')` so both tokens collapse to a single memory slot. A reverse
// map (canonChord -> display label) preserves the learner-facing wording
// ("easy C" early, "C" later) without ever splitting memory.
//
// This is the SAME fix the prototype engine needs (06-prototypes/practice-engine/
// pair-key.mjs) — both layers must agree or the moat bug returns.

// Map of teaching-label aliases -> canonical chord root.
// Extend here as new "easy" reductions appear (e.g. easyG -> G).
const ALIASES = {
  easyc: 'C',
  easyg: 'G',
  easyam: 'Am',
  easyem: 'Em',
  easygm: 'Gm',
};

// Display preference: which label to show for a canonical root.
// We surface the LEARNER-EARLY label first (easyC) so a beginner still sees
// "easy C" in review copy, then the standard label once they've graduated.
const PREFERRED_DISPLAY = {
  C: 'easyC', // early learner sees "easy C"; standard C is the same slot
  G: 'G',
  Am: 'Am',
  Em: 'Em',
};

export function canonChord(name) {
  if (!name) return name;
  const key = String(name).trim().toLowerCase();
  if (ALIASES[key]) return ALIASES[key];
  // Normalize a stray "easy" prefix already handled above; otherwise return as-is.
  return name;
}

// A stable pair key that canon-checks BOTH sides (unordered).
// canonPairKey('easyC','Em') === canonPairKey('C','Em') — the moat-safe key.
export function canonPairKey(a, b) {
  if (!a || !b) throw new Error('canonPairKey requires two non-empty chord names');
  const [x, y] = [canonChord(a), canonChord(b)].sort();
  return `${x}::${y}`;
}

// Display label for a canonical chord: prefer the learner-friendly alias, else root.
export function displayChord(canon) {
  if (!canon) return canon;
  return PREFERRED_DISPLAY[canon] || canon;
}
