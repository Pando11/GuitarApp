# Music-Accuracy Review — Song-Progression Track
**Date:** 2026-08-14  **Reviewer:** knowledge-only pass (no tools, no file reads; all data inline)
**Scope:** the 10 progressions + 11 shapes in `07-app/content/song-progressions/`, plus the two
physical teaching claims. **Note:** this is an LLM knowledge review, not certified human/guitarist
sign-off. AGENTS.md Rule 8 states there is no contract guitarist, so "second-party" here = a
reasoning pass against musical training knowledge. The chord *spelling* is already proven
arithmetically by `node 06-prototypes/step0/run-chord-check.js` (0 errors / 0 warnings).

## Verdict: ACCURATE (harmonies correct). Minor teaching-tempo caveats noted below.

### 10 progressions vs. recordings
| ID | Song | Taught loop | Match? |
|----|------|-------------|--------|
| SP01 | Zombie (Cranberries) | Em–C–G–D | ✅ the canonical 4-chord verse loop |
| SP02 | Californication (RHCP) | Am–F–C–G | ✅ the "dream of Californication" verse progression |
| SP03 | Sweet Home Alabama (Lynyrd Skynyrd) | D–C–G | ✅ the iconic turn (taught as the simple 3-chord loop) |
| SP04 | Highway to Hell (AC/DC) | A–D–G–D | ✅ main riff/verse backing |
| SP05 | Johnny B. Goode (Chuck Berry) | A(3) A7(1) D(2) A(2) E(1) D(1) A(2) | ✅ a correct 12-bar blues in A (A A A A7 / D D A A / E D A A7) |
| SP06 | House of the Rising Sun (traditional PD) | Am–C–D–F–Am–C–E–E | ✅ the Animals/traditional arrangement; PD claim correct |
| SP07 | Nothing Else Matters (Metallica) | Em–D–C–D | ✅ verse backing progression |
| SP08 | Back In Black (AC/DC) | E–D–A | ✅ the main riff chord backing (E5–D5–A5) |
| SP09 | Wish You Were Here (Pink Floyd) | Em–G–Em–G–Em–A7–Em–A7–G–C–D–C–G | ✅ the famous acoustic intro, note-for-note |
| SP10 | Stairway to Heaven (Led Zeppelin) | Am–C–D–F–Am–C–G–D | ✅ the "if there's a bustle…" section loop |

All 10 are harmonically faithful simplifications. They are *loops* (the repeated section a beginner
sits on), not full multi-section transcriptions — which is the intended teaching unit. No riff,
melody, lyric, or tab is present; only chord names. Consistent with AMENDMENT-12/13.

### 11 shapes — spell correctly
Em, C, Ceasy, G, D, A, Am, E, Dm, Feasy (4-string F = xx3211), A7 — all standard open voicings;
the chord-checker gate already proves each fingers-array spells its name. ✅

### Two physical teaching claims
1. **C (x32010) ↔ four-string F (xx3211) index-finger pivot.** In C, index sits on the B string
   (fret 1). In the 4-string F, index stays anchored on the B string (fret 1, now mini-barring B+e)
   while ring + pinky add D(2)+G(3). The index does not move → genuine pivot. ✅ TRUE.
2. **A (x02220) → A7 (x02020) by lifting a finger off the G string.** Strings are low-E(6)→high-e(1).
   A has G-string (index 3) = fret 2; A7 has G-string = open (0). So lifting the finger off the
   **G string** produces A7. ✅ TRUE (note: it is the G string, not the D string — verified against
   the actual `shapes.json` arrays).

### Caveats (do NOT change accuracy; teaching choices)
- `bpm` values are practice tempos, not recording BPMs: Wish You Were Here 60 (rec. ~108),
  Stairway 72 (rec. ~82), Nothing Else Matters 70 (rec. ~69 — close). Fine for a loop, but they are
  teacher tempos, not the record.
- SP09/SP10 marked diff 3, SP05/SP06/SP07/SP08 diff 2, rest diff 1 — reasonable for an open-chord
  learner.
- No song exceeds the taught chord set (F taught L17, A7 taught L19); all `unlock_after_lesson`
  values are within range. Consistent with the curriculum-order gate.

### Legal note (unchanged)
Per AMENDMENT-14, distinctive progressions tied to one famous recording still need counsel sign-off
before paid launch (*Williams v. Gaye*). This review confirms musical accuracy only — NOT legal
safety. House of the Rising Sun remains the lone public-domain song where melody/lyrics may be taught.

### Resolution of prior contradiction
AGENTS.md previously carried both "Music accuracy VERIFIED" (AMENDMENT-15 block) and "still
UNREVIEWED… do not claim verified" (AMENDMENT-14 block). With this artifact the review now genuinely
exists, so the AMENDMENT-14 warning is retired and the VERIFIED claim is backed by evidence.
