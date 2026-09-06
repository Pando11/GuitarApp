# AMENDMENT-12 — The Song-Progression Track + Mystery Mode

**Date:** 2026-08-14
**Status:** CURRENT TRUTH (supersedes nothing; extends AMENDMENT-11's SONGS position)
**Owner directive:** Heidi, 2026-08-14 — "let's start working on the progressions and
then also in regards to the other ones we could state that you know like a mystery and
that they would start learning it and figure out what it is"

---

## 1. Why this amendment exists

The five spider reports (see `scale-100/HANDOFF-2026-08-13-spider-report-contents.md`)
delivered a demand list of 50 real, most-requested songs — and **no chord data for any
of them**. AMENDMENT-11's SONGS track answered the licensing problem by teaching only
our own original 8-chord loops. That is legally safe but commercially weak: nobody
searches for "Riff in A minor."

This amendment opens the narrow, legally defensible path between those two positions.

## 2. The legal line (the whole point of this amendment)

Three distinct things were being conflated. They are not the same:

| Thing | Protected? | Our position |
|---|---|---|
| Song **title** | **No** — titles are not copyrightable | We name songs freely and honestly |
| Bare **chord progression** (e.g. Am–F–C–G) | **Generally no** — functional harmony is a building block, shared by thousands of songs | **We teach this** |
| **Riff / melody / arrangement / tab** | **Yes** — this is the composition | **We never teach or reproduce this** |

Corollary decisions, recorded so they are not relitigated:

- **Renaming a song does NOT launder its riff.** Teaching Enter Sandman's riff under a
  fake name is the same infringement with a lie attached. Explicitly rejected.
- **We do not need to rename anything.** Titles are facts. Honest naming is both legal
  and better product.
- **No tab site is ever scraped for content.** The `popular_songs` report's deep
  Songsterr links are used as provenance/demand signal only — never fetched for tab.
- Each progression carries an `honest_claim` field stating in plain language what the
  lesson teaches and what it deliberately does not. This field is **mandatory** and
  gate-enforced.

## 3. What ships

`07-app/content/song-progressions/`
- `shapes.json` — shared open-chord shape library (11 shapes), every one verified by
  the canonical arithmetic checker. Reuses the exact shapes already shipping in the
  25-lesson curriculum; no second source of truth for fingerings.
- `progressions.json` — 11 song progressions drawn from the top of the verified
  `popular_songs` demand list, ordered by difficulty (1→3).

The 11: Zombie, Californication, Sweet Home Alabama, Highway to Hell, Johnny B. Goode,
The House of the Rising Sun, Nothing Else Matters, Back In Black, Wish You Were Here,
Stairway to Heaven, Amazing Grace.

**Two — The House of the Rising Sun and Amazing Grace — are fully public domain**, flagged
`"public_domain": true`. On those songs we may also teach melody, words, and a full
arrangement with zero restriction. It is the bridge between report #2 (demand) and
report #3 (safe supply), and it is the template for expanding the PD catalog later.

## 4. Mystery Mode (owner-directed, this amendment)

Every progression carries a `mystery` block: `hint_1`, `hint_2`, `reveal`.

The student learns the loop **blind** — no title, no artist. They get one hint, then a
second, then the reveal. The pedagogy is deliberate: it forces attention onto the sound
and the changes instead of onto the song's reputation, and the payoff ("*that's*
Stairway?") is the motivation hook that a loop named "vi-IV-I-V" can never deliver.

Mystery Mode is a **presentation toggle over the same verified data**, not a separate
content set. Gate-enforced rules:
- a hint may never contain the song's title (checked, fails the build)
- the reveal must name the song (checked, fails the build)
- all three fields must be present (checked, fails the build)

## 5. Verification (AGENTS.md Rule 8 extended to song lessons)

Gate: `node tools/verify-song-progressions.js` — must report **0 errors AND 0 warnings**.
It proves, arithmetically:
1. every chord shape spells the chord its name claims (delegated to the canonical
   `chord-theory-check.js` — no reimplementation),
2. every shape referenced by a progression exists,
3. every chord named in a `loop` is declared, and every declared chord is actually used
   (this caught 3 real content-drift defects on first run),
4. Mystery Mode completeness + no early title leak,
5. the legal redline: no field contains tab/riff notation.

**The gate is proven to bite:** `bash tools/test-song-progression-gate.sh` mutates a
sandboxed copy and requires the gate to go RED on each defect (including the unlock-rule
regressions in AMENDMENT-13), plus a control proving pristine content goes GREEN.
Current result: **16 passed / 0 failed — GATE-PROVEN-TO-BITE**. A gate that has never
been observed failing is not evidence.

Preview: `node tools/build-song-progression-preview.js` → double-clickable
`song-progressions-preview.html` (per AGENTS.md: `file://`, not localhost).

## 6. Open items (not blocking)

- 40 remaining songs from the verified demand list are not yet worked up.
- Progressions are authored from knowledge, not scraped; the arithmetic gate proves the
  chord *shapes* are correct but cannot prove a progression matches a recording. That
  remains a judgement call, flagged in prose per Rule 8 — never as a red UI box.
- PD catalog expansion: the `public_domain_songs` report (302 titles) is the supply
  pool for more House-of-the-Rising-Sun-class lessons, where nothing is restricted.
