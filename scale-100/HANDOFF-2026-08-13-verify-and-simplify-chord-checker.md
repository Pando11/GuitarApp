# HANDOFF — Verify the extended-chord-checker work, then SIMPLIFY it (GOAL 2026-08-13 H2)

Date: 2026-08-13
Project: GuitarApp (`~/Desktop/GuitarApp`)
Prerequisite context: `scale-100/HANDOFF-2026-08-13-extend-chord-checker.md` (the original blocker brief).

---

## TL;DR — current real state (verified by running it, 2026-08-13)

The extended-chord extension is **done and passing**. A prior hop already committed the core
work as **`4c848e5`** ("chord-checker: close 45-name reference gap + short-form fixtures").
This session RE-VERIFIED it and added a parallel ESM mirror + a duplicate test set. Net truth:

- **CJS checker** (`06-prototypes/step0/schema/chord-theory-check.js`) — extended recipes
  committed in `4c848e5`. This session's edits to it are byte-identical to that commit (no
  divergence). Verified green.
- **ESM mirror** (`07-app/core/chord-theory-check.js`) — extended recipes added by THIS
  session, **UNCOMMITTED** (modified, not staged, not committed). It was NOT touched by
  `4c848e5`. This is the one real uncommitted code change and must be committed + kept in sync.
- **Tests are DUPLICATED across two locations** and must be reconciled (simplify target):
  - `06-prototypes/step0/tests/verify-chord-ref-45.js` + `tests/fixtures-shortform.js` (committed, `4c848e5`)
  - `04-validation/regression-extended-chords.js` + `04-validation/check-esm-mirror.mjs` (uncommitted, this session)

---

## Prove-it-first acceptance gate (run BEFORE any simplification)

Run these 5 commands from `~/Desktop/GuitarApp`. All 5 were green on 2026-08-13 — confirm
they are still green, otherwise DO NOT simplify, fix first.

```bash
# 1. 45-name reference regression (committed, long-form names from FINAL_chord_ref.jl)
(cd 06-prototypes/step0 && node tests/verify-chord-ref-45.js)
#    expect: CHORD-REF-45-OK — rows parsed 45 | distinct 23 | degrade 0 | fail-closed 0

# 2. short-form fixtures (committed): C Aug/Cdim/C6/C9/Cm7b5/C13 correct -> ok:true; wrong -> ok:false
(cd 06-prototypes/step0 && node tests/fixtures-shortform.js)
#    expect: SHORTFORM-FIXTURES-OK

# 3. ESM mirror parity (uncommitted, this session): ESM parse == CJS parse over 45 names
node 04-validation/check-esm-mirror.mjs
#    expect: ESM syntax OK. 45-name equivalence vs CJS: IDENTICAL

# 4. this session's long-form regression (uncommitted) — overlaps #2, keep one
node 04-validation/regression-extended-chords.js
#    expect: EXTENDED-REGRESSION-OK

# 5. THE SHIP GATE (AGENTS.md Hard Rule 8) — must be 0 errors / 0 warnings
(cd 06-prototypes/step0 && node run-chord-check.js)
#    expect: 23 lessons | 71 chords checked | 0 errors | 0 warnings | CHORDS-VERIFIED-OK
```

Guardrail: if ANY of #1–#5 fails, the checker is broken — revert your simplify edits, do not
continue. The 45-name reference file is `~/scraping-stack/harvester/out/FINAL_chord_ref.jl`
(45 rows, 23 distinct chords; root F from the mislabeled "f Diminished" row is expected and
correct — the reference row is wrong, the parser is right).

---

## What the extension actually added (so simplify preserves behavior)

In BOTH checker copies, these maps grew:
- `QUALITIES`: added `m6, 6, 6/9, m6/9, aug, dim, 7#5, 7b5, 7sus4, dim7, m7b5, 9, m9, maj9, 11,
  m11, 13, m13, add9, madd9` (tensions spelled octave-normalized: 9→14, 11→17, 13→21 so the
  checker verifies the real pitch a string sounds, not just the chord class).
- `REQUIRED`: defining tones now hard-ERROR if missing (6th, b7, 9, 11, 13, #5, etc.). Non-
  defining tensions (e.g. the 9th of a 13th) are optional (warning only).
- `KNOWN_QUALITY_TOKEN`: all extended tokens moved from `UNKNOWN` → `KNOWN` (so they no longer
  fail-closed or silently degrade). `UNKNOWN_QUALITY_TOKEN` now only contains `aug7` (genuinely
  unsupported).
- `parseChordName` quality block: extended branches added BEFORE base branches, specific-first
  (dim7/m7b5/aug/dim/7#5/7b5/7sus4/6-9-family/m6/6/add9/m-add9/9-family/11/13), then min7/maj7/
  min/maj/sus/7/5. Handles both numeric ("C9") and worded ("C Ninth", "C Six") labels.

Known real bug already fixed in `4c848e5`: short-form `Cm7b5` was silently degrading to `dim7`
because the `dim.*7` regex ate it; now `m7b5` is its own branch above the dim7 branch.

---

## SIMPLIFY pass (only after #1–#5 are green)

Goal: remove duplication, keep behavior identical, keep the ship gate at 0/0. Concrete steps:

1. **De-duplicate the test sets.** You have the SAME assertions in two places:
   - `06-prototypes/step0/tests/` (committed, authoritative — keep these)
   - `04-validation/regression-extended-chords.js` + `check-esm-mirror.mjs` (this session,
     uncommitted — mostly redundant)
   Decide ONE home. Recommendation: keep `tests/` as the canonical regression and fold the
   ESM-parity check into it (or delete `04-validation/regression-extended-chords.js` if its
   cases are a subset of `fixtures-shortform.js`). **Do not delete `check-esm-mirror.mjs`
   until the ESM mirror is committed and proven in sync** — it is the only guard that the
   `07-app/core` copy matches the ship-gate copy.
2. **Commit the ESM mirror** (`07-app/core/chord-theory-check.js`) and add a CI/guard check
   that fails if the two copies diverge. The two copies MUST stay 1:1 (the CJS is the live
   ship-gate; the ESM is what the browser app imports). Today they are kept in sync by hand —
   that is the fragile part.
3. **Consolidate the quality-detection regexes.** They are a long if/else ladder with many
   near-duplicate alternations (`\bnine\b`, `\bninth\b`, `\b9\b` etc.). A simplification that
   preserves behavior: derive the quality from a single ordered table of
   `{pattern, quality}` pairs (specific-first) rather than 25 hand-written `else if`s. Verify
   against `verify-chord-ref-45.js` + a SHORT-form name set after any refactor.
4. **Remove dead branches.** After the extension, check whether the original base branches
   (`min7/maj7/min/maj/sus/7/5`) are still reachable and not shadowed. If a branch can never
   fire, delete it. Same for `UNKNOWN_QUALITY_TOKEN` — only `aug7` remains; confirm nothing
   else should be there.
5. **One-line behavior contract test.** Add a tiny assertion file (or a row in an existing one)
   that pins the CONTRACT: "extended chord without its defining tone = ERROR, not warning;
   a plain major shape misnamed as an extended chord = ok:false". This is what makes future
   simplify passes safe.

After simplifying: re-run #1–#5. If still 0 degrade / 0 fail-closed / 0 errors / 0 warnings,
and the duplicate tests are gone, the simplify is done. THEN commit (no push — repo is PRIVATE,
never push public).

---

## Things to NOT touch / guardrails

- Do NOT weaken the checker to make a previously-silent lesson pass. AGENTS.md Rule 8: missing
  defining tone = ERROR. If the ship gate now flags a lesson, FIX THE LESSON DATA, not the checker.
- `FINAL_chord_ref.jl` voicings are descriptive strings ("C Augmented chord diagrams"), NOT
  parseable finger coords. Do not try to auto-import them as chord shapes.
- SONGS lessons = ORIGINAL 8-chord loops; never transcribe lyrics/tabs/audio.
- LLM prose-only; cite only DSP/checker metric keys; never invent musical judgement.
- Keep both checker copies in sync; the ESM one is currently the lagging/uncommitted one.

## Provenance / honesty notes

- The original handoff's "57% fail-open" figure was overstated; real pre-fix baseline (this
  session, hand-verified) was 3 fail-closed + 32 degrade + 10 clean out of 45. Now: 0/0/45.
- The "DONE ... commit 4c848e5" log you saw was a PRIOR hop that already did the core extension
  and the `Cm7b5` short-form fix. This session re-verified it (5 gates green) and added the ESM
  mirror (uncommitted) + a parallel test set (the thing the simplify pass should collapse).

## AS-BUILT (2026-08-13, simplify executed)

The simplify pass is DONE. Summary of what actually happened vs the plan:

1. **Found a REAL, previously-missed divergence.** The handoff claimed the ESM mirror was
   "IDENTICAL" to the CJS copy, but empirical comparison proved `Cm7b5` parsed as `dim7` in the
   ESM copy and `m7b5` in the CJS copy. Root cause: the ESM `dim7` regex wrongly included
   `\bm7b5` (the CJS copy had already moved it to its own branch on 2026-08-13). Worse, the old
   `check-esm-mirror.mjs` read its name list from `/tmp/chord_ref_names.json`, which was gone, so
   it looped ZERO times and printed a vacuous "IDENTICAL" with exit 0 — the one guard that should
   have caught the drift was silently passing on empty input. This is exactly the hand-sync
   fragility Heidi flagged.
2. **Refactored the quality ladder in BOTH copies** from a 25-branch hand-written `else if`
   ladder to one ordered `QUALITY_PATTERNS` table (regexes copied verbatim → behavior preserved by
   construction). This removed the divergence surface and fixed the ESM `Cm7b5` bug at the same
   time. Behavior verified identical vs a captured 82-name pre-refactor baseline (0 changes).
3. **Rewrote the divergence guard to be hermetic + non-vacuous** (`04-validation/check-esm-mirror.mjs`):
   it now compares the `QUALITIES`/`REQUIRED`/`QUALITY_PATTERNS` tables AND `parseChordName` over a
   *committed* 38-name list, and exits 1 on any mismatch. Result: 38/38 IDENTICAL.
4. **Wired it as a git pre-commit hook** (`.git/hooks/pre-commit`) that runs the divergence guard
   AND the ship gate and aborts the commit on failure. Hand-sync can no longer drift silently —
   the guard is now structural, not advisory.
5. **Consolidated the duplicate tests.** Deleted `04-validation/regression-extended-chords.js`
   (it was a subset of `fixtures-shortform.js`). Added `tests/contract-extended-chords.cjs`
   pinning the behavior contract (defining-tone-missing = ERROR; misnamed-shape = false-pass
   blocked). Canonical regression now lives in `tests/`.

Final state (all gates green):
- G1 45-ref: 0 degrade / 0 false-pass / 0 fail-closed
- G2 shortform: OK
- G3 divergence guard: 38/38 IDENTICAL
- Contract: OK
- G5 ship gate: 23 lessons / 71 chords / 0 errors / 0 warnings / CHORDS-VERIFIED-OK
- Commit: `chord-checker: simplify to single QUALITY_PATTERNS table + hermetic ESM divergence guard`
  (no `4c848e5`; this is a NEW commit, unpushed — repo private, never push public).
