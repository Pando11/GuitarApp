# BOARD-AGENDA — maverick-tc-br (GuitarApp Growth Board)

**Repo:** `C:/Users/Hendrickson/Desktop/GuitarApp`
**Fire date:** 2026-08-26
**Branch build target:** `boardroom/growth-2026-08-26`

== OPEN ITEMS (fold into this fire's debate) ==

- **[OPEN] Student song-creation (Suno-style) feature (2026-08-17).** Source proposal:
  `maverick-tc-br/BOARD-PROPOSAL-suno-style-music-2026-08-17.md`
  (repro from `03-research/ai-features-20-monetization-ideas.md` item #22 +
  `PROPOSED-FEATURES.md` §22). Board questions: (a) approve the "hum a song → lesson"
  direction? (b) budget a small cloud-GPU trial for phase-2 backing tracks? (c) any
  music-IP concern to route to counsel before ship?
  **Verdict due this fire:** RECOMMENDATION (pursue / defer / reject) + reasoning grounded
  in AGENTS.md / PROPOSED-FEATURES.md / verified licenses.

== CLOSED THIS FIRE (carry forward only if unresolved) ==

- (none yet — first fire)

== SHIP GATES (run every fire) ==

1. `node 06-prototypes/step0/run-chord-check.js` → 0 errors AND 0 warnings.
2. `node 07-app/test/fidelity.mjs` → 48/0 (ports 1:1 with proven engines).
3. `node tools/verify-curriculum-order.js` → 0 errors.
4. `node tools/verify-song-progressions.js` → 0 errors AND 0 warnings.

== DECIDER NOTE (filled by Hermes decider) ==

SHIP vs STOP with each seat's evidence + real gate output. One page.
