# AMENDMENT-13 — Song-Progression Readiness Gate (Mystery Mode unlock rule)

**Date:** 2026-08-14
**Status:** CURRENT TRUTH (extends AMENDMENT-12's Mystery Mode)
**Owner directive:** Heidi, 2026-08-14 — "this would only be people that are already
learning the program … an opt-in thing for people that are more experienced … I'm
working with an avatar on these new mystery songs."

---

## 1. What this amendment settles

AMENDMENT-12 opened the song-progression track and Mystery Mode. The owner then
corrected the framing: Mystery Mode is **not a hook for newcomers**. It is an
**opt-in advanced lane** for students already inside the program, surfaced with the
avatar, and only fair if the student has already been taught every chord the song
uses. This amendment turns that correction into an enforced, arithmetic rule.

## 2. The rule (enforced, not advisory)

For every song in `07-app/content/song-progressions/progressions.json`:

1. **Every chord the song requires must already be taught** in the 23→25-lesson
   curriculum. If a song needs a chord the curriculum never covers, the build fails.
   This is the fairness guarantee: a mystery loop never contains a chord the student
   has never seen.
2. `unlock_after_lesson` must equal the lesson at which the song's **last-taught**
   chord is first introduced. The gate recomputes that lesson from the derived
   prereq map and fails if the stored value disagrees — so the field cannot silently
   drift out of date when lessons are reordered or added.

## 3. Why this works (and why it cannot drift)

`chord-prereqs.json` is **derived**, never hand-written: `node
tools/derive-chord-prereqs.js` reads `07-app/content/lessons/manifest.json` and
records, for every shape, the lesson that first teaches it. The gate reads that
derived map. Because both the gate and the map come from the same source of truth
(the lesson manifest), a moved or newly-added lesson is automatically reflected —
and if `unlock_after_lesson` is not updated to match, the gate goes RED.

## 4. Curriculum reality this depends on

The original 23-lesson curriculum taught A, Am, C, G, D, Dm, E, Em only — **F and A7
were absent**. At the time of AMENDMENT-12 that meant five of the eleven songs
(Californication, Johnny B. Goode, House of the Rising Sun, Wish You Were Here,
Stairway to Heaven) required chords the student had never been taught. Two lessons
were added to close that gap:

- `guitar-lesson-24-new-chord-f.json` — teaches **F** (and reuses C, Am, G).
- `guitar-lesson-25-new-chord-a7.json` — teaches **A7** (and reuses A, D, E, Em, G).

The manifest now lists **25 lessons**. With F (lesson 24) and A7 (lesson 25 taught,
all eleven songs use only chords that exist in the curriculum, and the unlock rule can
be satisfied honestly for every one of them. The opt-in advanced lane is therefore
fully stocked without renaming, re-voicing, or scraping anything.

## 5. Verification

Gate: `node tools/verify-song-progressions.js` — must report **0 errors AND 0 warnings**.
The gate proves arithmetically: shape spelling, referential integrity, loop/dead-chord
drift, mystery completeness + no title leak, the legal redline, **and** the unlock rule
above.

**Proven to bite:** `bash tools/test-song-progression-gate.sh` mutates a sandboxed copy
16 different ways (including 5 unlock-rule regressions) and requires the gate to go RED
on each, plus a control proving pristine content goes GREEN. Current result:
**16 passed / 0 failed — GATE-PROVEN-TO-BITE**.

Rebuild preview: `node tools/build-song-progression-preview.js` → double-clickable
`song-progressions-preview.html`.
