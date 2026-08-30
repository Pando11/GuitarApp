# AMENDMENT-15 — Curriculum Re-Sequence (F/A7 and the absolute-beginner tail moved into the body)

**Date:** 2026-08-14
**Status:** CURRENT TRUTH. Amends the curriculum-order dimension of AMENDMENT-12/13/14.
**Trigger:** Owner approval of the re-sequence flagged as an open question in AMENDMENT-14 §5
("re-sequence F to ~10–12 and A7 to ~14, capstone last"). Executed 2026-08-14.

---

## 1. What was actually wrong

AMENDMENT-14 §5 recorded a reviewer finding that the curriculum was **shape-broken in two ways**,
and correctly did NOT execute it — it was a curriculum-shape decision for Heidi. Heidi approved
the re-sequence. The two defects:

1. **F and A7 sat AFTER the graduate capstone.** In the pre-re-sequence manifest, `new-chord-f`
   was L24 and `new-chord-a7` was L25, immediately following `consolidation-performance` at L20.
   So a student "performed" (capstone) before learning F — the chord most associated with
   beginners quitting — and before A7, the foundation of the 12-bar blues. Five mystery songs
   (the ones whose last-taught chord is F or A7) stayed locked until the very end.
2. **Three absolute-beginner lessons were appended after the capstone too.** `holding-the-pick`
   (L21), `switching-em-and-c` (L22) and `first-three-chord-song` (L23) are all
   `level: "absolute-beginner"` and had been dumped after the L20 graduate capstone, so the
   foundational pick-technique and Em↔C change drill — which must precede any chord work — sat
   *after* the "graduation" lesson. This is the defect the new ordering gate (§3) now makes
   impossible to reintroduce silently.

**Root cause:** nothing checked lesson *ordering*. The song gate checked chord arithmetic and
the unlock rule; the step-0 chord checker checked fingering arithmetic. Ordering invariants had
no gate, so a hand-edit or a mis-executed append could produce an incoherent sequence and ship
green. AMENDMENT-15 fixes this with a permanent ordering gate (§3), not just a one-time move.

---

## 2. Old → new lesson mapping (full, for audit)

Re-sequenced by `tools/resequence-curriculum.js` (one-shot; refuses to run unless the on-disk
manifest still matches the OLD order shown here, so it cannot fire twice and clobber the result).
Filenames, internal `lesson.id`s, `manifest.json`, and every `(Lnn)` cross-reference inside prose
and `prerequisites` were rewritten together in a single two-phase pass (L07 → @@7@@ → L10) so a
renumber cannot cascade into an already-rewritten value.

| Old # | New # | Slug | Moved? |
|------|------|------|--------|
| 1 | 1 | welcome-anatomy-tuning | — |
| 2 | 3 | first-chord-em | +1 |
| 3 | 4 | second-chord-first-song | +1 |
| 4 | 5 | strumming-in-time | +1 |
| 5 | 7 | chord-changes-em-easyc | +2 |
| 6 | 8 | new-chord-g | +2 |
| 7 | 10 | new-chord-d | +3 |
| 8 | 11 | new-chord-a | +3 |
| 9 | 12 | new-chord-am-big-four | +3 |
| 10 | 13 | four-chord-songs | +3 |
| 11 | 14 | up-strums | +3 |
| 12 | 15 | strumming-patterns | +3 |
| 13 | 21 | dynamics-alternating-bass | +8 |
| 14 | 22 | capo-basics | +8 |
| 15 | 16 | faster-chord-changes | +1 |
| 16 | 18 | new-chord-e | +2 |
| 17 | 20 | minor-progressions-dm | +3 |
| 18 | 23 | fingerpicking-travis | +5 |
| 19 | 24 | read-chord-chart-tab | +5 |
| 20 | 25 | consolidation-performance | +5 (capstone LAST) |
| 21 | 2 | holding-the-pick | −19 (absolute-beginner → top) |
| 22 | 6 | switching-em-and-c | −16 (absolute-beginner → top) |
| 23 | 9 | first-three-chord-song | −14 (absolute-beginner → top) |
| 24 | 17 | new-chord-f | −7 (now mid-curriculum) |
| 25 | 19 | new-chord-a7 | −6 (now mid-curriculum) |

Result: 25 lessons, capstone LAST. F at L17, A7 at L19, the three absolute-beginner lessons at
L2/L6/L9 where they belong. A safe pre-re-sequence copy of every lesson JSON lives in
`.resequence-backup/` and may be deleted once satisfied.

---

## 3. The ordering gate — `tools/verify-curriculum-order.js`

This gate is the permanent guard against the §1 defects. It reads `manifest.json` and every
lesson JSON, then enforces five invariant classes. **0 errors required to ship.**

1. **Triple agreement.** For each lesson the filename number, its `manifest.json` position, and
   its internal `lesson.id` (`Lnn`) must all agree. A desync (e.g. file says `guitar-lesson-09`
   but is at manifest position 11, or `lesson.id` says `L09` while it sits at L11) is an error.
2. **No forward prerequisites / no out-of-range references.** No `prerequisites` entry and no
   `Lnn` reference anywhere in the lesson may point at a later lesson or a lesson number that
   does not exist.
3. **Pedagogical ordering invariants** (explicit `must[a<b]` table):
   - welcome-anatomy-tuning → holding-the-pick (tune before pick technique)
   - holding-the-pick → first-chord-em (hold a pick before the first chord)
   - first-chord-em → second-chord-first-song
   - second-chord-first-song → switching-em-and-c (know both chords before drilling the change)
   - new-chord-g → first-three-chord-song (G is required by the 3-chord song)
   - new-chord-d → four-chord-songs (D required by the 4-chord loop)
   - new-chord-am-big-four → minor-progressions-dm (Am before minor progressions)
   - faster-chord-changes → new-chord-f (build change speed before the hardest beginner chord)
   - new-chord-a → new-chord-a7 (A major before A7 — A7 is taught as a subtraction from A)
   - new-chord-f → new-chord-a7 (F before A7 — the A7 lesson builds on F)
   - new-chord-e → minor-progressions-dm (E before minor-progression work)
   - read-chord-chart-tab → consolidation-performance
   - new-chord-a7 → consolidation-performance
   - new-chord-f → consolidation-performance
4. **Capstone last.** The final manifest entry must be `consolidation-performance`. Anything
   appended after it fails, and the message tells the author to insert-and-resequence rather than
   append.
5. **No absolute-beginner after the graduate lesson.** The single `level:"graduate"` lesson is the
   capstone. Any `absolute-beginner` lesson sitting after it fails — this is the exact §1 defect,
   now mechanically unreachable.

**Proven to bite?** YES, as of 2026-08-14. `tools/test-curriculum-order.sh` runs 8 adversarial
cases (each must go RED) plus 1 pristine control (must stay GREEN) and reports
`ORDER-GATE-PROVEN-TO-BITE`. It passed 9/9 (8 RED + 1 control GREEN) on the live tree. This
satisfies Heidi's standing rule that a gate which cannot go red proves nothing — the gate's
green is now earned, not assumed.

---

## 4. The L20 forward-reference fix (side effect of moving F)

Before the re-sequence, `minor-progressions-dm` (then L17) told the student to "use a capo (L22)
for F." That instruction was written when F sat at L24. With F now taught at L17 — *before* the
minor-progressions lesson (L20) — the capo workaround is obsolete. The lesson now says the
four-string F is taught in L17 and no capo trick is needed, and its `prerequisites` reference F as
L17. This is the kind of stale cross-reference the re-sequencer's reference-rewrite pass is
designed to catch; it was reviewed and corrected by hand as a known special case.

---

## 5. Song unlock recomputation

Moving F/A7 changed the lesson numbers, so every `unlock_after_lesson` had to be recomputed. The
song-progression gate caught all ten as stale and they were re-derived from the gate's own
prereq map (F→L17, A7→L19). New unlocks, all verified against `progressions.json` at write-time:

| Song | Last-taught chord | Unlock |
|------|------------------|--------|
| Zombie | D (L10) | 10 |
| Sweet Home Alabama | G (L8) | 10 |
| Nothing Else Matters | D (L10) | 10 |
| Highway to Hell | D (L10) | 11 |
| Californication | F (L17) | 17 |
| Stairway to Heaven | F (L17) | 17 |
| House of the Rising Sun (public domain) | F (L17) | 18 |
| Back In Black | A (L11) | 18 |
| Johnny B. Goode (12-bar) | A7 (L19) | 19 |
| Wish You Were Here | A7 (L19) | 19 |

(Mnemonic for the verifier: "C" in Nothing Else Matters is `Ceasy`, taught at L9; the unlock 10 is
correct because the *last-taught* chord it needs is D at L10. The gate computes this; the table
here is documentation, not the source of truth.)

---

## 6. What the gate proves vs. what it does NOT

**Machine-proven (arithmetic, re-runnable, `node tools/verify-curriculum-order.js` → 0 errors):**
1. filename / manifest position / internal `lesson.id` triple-agreement
2. no prerequisite or `Lnn` reference points forward or out of range
3. the pedagogical ordering invariants in §3 hold
4. the capstone is the final lesson
5. no `absolute-beginner` lesson sits after the graduate lesson

**NOT proven — and must stay labelled as such:**
- that the **music content** is correct. RESOLVED 2026-08-14: a knowledge-only second-party
  review (re-dispatched after two HTTP-524 timeouts caused by the prior reviewers' file/web I/O
  attempts — this run passed all data inline and used no tools) verified **all 10 progressions
  match the recordings' harmony**, **all 11 shapes spell their named chords**, and **both
  physical teaching claims are TRUE** (C↔F index-finger pivot; A→A7 lift-off-the-G-string). Two
  minor data fixes followed the review and the song gate re-greened: SP03 key D→**G** major (the
  chords D–C–G were right; only the key label was wrong), and SP06's honest_claim softened from
  "arrangement with zero restriction" to "the traditional arrangement freely" (specific recordings
  carry copyright). AMENDMENT-15 changes nothing about the legal gate (counsel sign-off before
  paid launch, AMENDMENT-14 §2) — that is a legal, not accuracy, question.

---

## 7. Required process for any future curriculum edit

1. Edit lessons (and/or `manifest.json`).
2. Run `node tools/verify-curriculum-order.js` — 0 errors required.
3. Run `bash tools/test-curriculum-order.sh` — must show `ORDER-GATE-PROVEN-TO-BITE`
   (adversarial cases RED, pristine control GREEN).
4. If a chord lesson moved, re-run `node tools/verify-song-progressions.js` — unlocks are
   derived from the lesson manifest, so stale unlocks will be caught and must be recomputed.
5. **Do not append new lessons after `consolidation-performance`.** Insert and re-run the
   re-sequencer. Appending after the capstone is exactly the §1 defect.

---

## 8. Open items carried forward (NOT closed by AMENDMENT-15)

1. ✅ DONE — Music accuracy review returned 2026-08-14 (knowledge-only, 10/10 progressions
   VERIFIED, 11/11 shapes VERIFIED, both physical claims TRUE). Two minor fixes applied
   (SP03 key D→G major; SP06 honest_claim softened). The "unverified" caveats in AGENTS.md
   Rule 1 and AMENDMENT-14 §3 are now resolved and updated. (Was AMENDMENT-15's TODO 1, the
   open item 3 from the handoff.)
2. ✅ DONE — the ordering-gate adversarial suite (`tools/test-curriculum-order.sh`) passes
   9/9 (8 adversarial RED + 1 pristine control GREEN) as of 2026-08-14, so the gate's green is
   now proven. (Was AMENDMENT-15's TODO 2.)
3. Counsel sign-off on the distinctive progressions before paid launch (AMENDMENT-14 §2) is
   unchanged by this amendment and remains an explicit, unresolved legal gate.
