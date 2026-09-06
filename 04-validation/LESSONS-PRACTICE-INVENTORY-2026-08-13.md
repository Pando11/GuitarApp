# GuitarApp — Lessons & Practice Inventory

**Generated:** 2026-08-13T15:26:58+00:00  |  **Verified on disk:** yes (all counts match manifests, 0 missing files)

## Summary (all verified against `07-app/content/` manifests and files on disk)

| Track | Count | Source |
|---|---|---|
| Technique lessons (spine L01–L20) | 20 | `lessons/manifest.json` |
| Technique-support lessons (L21, L22) | 2 | `lessons/manifest.json` |
| Song lesson shipped as technique (L23) | 1 | `lessons/manifest.json` |
| **Total lessons in manifest** | **23** | `lessons/manifest.json` |
| Practice drills (chord-pair) | 28 | `practice/index.json` |
| Content packs (blues 3 + country 3) | 6 | `packs/*/manifest.json` |
| Teachers (skins) | 3 | `teachers/manifest.json` |

**Practice coverage proof:** the 28 practice drills are EXACTLY every unique pair of the
8 taught chords (C, D, Dm, E, Em, G, A, Am) -> C(8,2) = 28. Full combinatorial coverage, no gaps, no dupes.
All drills use engine `one-minute-changes` with a 30/60 changes-per-minute gate (arithmetic, no human QA).

## Lessons (23 in manifest)

| # | Title | Exercises | New chord | Category |
|---|---|---|---|---|
| 1 | Welcome, Anatomy & Tuning | 3 | - | technique spine |
| 2 | Your First Chord: Em + One Strum | 2 | - | technique spine |
| 3 | Second Chord + YOUR FIRST SONG | 2 | - | technique spine |
| 4 | Strumming in Time | 2 | - | technique spine |
| 5 | Chord Changes: Em ↔ easy C (anchor fingers) | 3 | - | technique spine |
| 6 | New Chord: G + Em ↔ G | 3 | - | technique spine |
| 7 | New Chord: D + Changes | 2 | - | technique spine |
| 8 | New Chord: A + Changes | 2 | - | technique spine |
| 9 | New Chord: Am + the Big Four | 2 | - | technique spine |
| 10 | Four-Chord Songs (MILESTONE) | 2 | - | technique spine |
| 11 | Up-Strums + D-DU-UDU | 2 | - | technique spine |
| 12 | Strumming Patterns Library | 2 | - | technique spine |
| 13 | Dynamics + "THE Pattern" (alternating bass) | 2 | - | technique spine |
| 14 | Capo Basics (play in any key) | 2 | - | technique spine |
| 15 | Faster Chord Changes (SPEED BUILDER) | 3 | - | technique spine |
| 16 | New Chord: E + cowboy set complete | 2 | - | technique spine |
| 17 | Minor Progressions + Dm | 2 | - | technique spine |
| 18 | Fingerpicking Intro (Travis pattern) | 2 | - | technique spine |
| 19 | Read Any Chord Chart / TAB | 3 | - | technique spine |
| 20 | Consolidation + Your First "Performance" + What's Next | 3 | - | technique spine |
| 21 | Holding the Pick | 3 | - | technique-support (grip/posture) |
| 22 | Switching Between Em and C | 4 | - | technique-support (transition drill) |
| 23 | Your First 3-Chord Song | 4 | - | SONG (lives in technique dir — §5.6 gap) |

## Practice drills (28 — every chord pair)

All `practice-*.json` exist on disk and match `practice/index.json` (0 missing). Each is `lesson_type: technique`,
`engine: one-minute-changes`, `estimated_minutes: 3`, and references the lesson it practices via `practice_of`.

| Pair | File | Introduced at |
|---|---|---|
| C::Em | practice-C-Em.json | L3 |
| C::G | practice-G-C.json | L6 |
| Em::G | practice-G-Em.json | L6 |
| C::D | practice-D-C.json | L7 |
| D::Em | practice-D-Em.json | L7 |
| D::G | practice-D-G.json | L7 |
| A::C | practice-A-C.json | L8 |
| A::D | practice-A-D.json | L8 |
| A::Em | practice-A-Em.json | L8 |
| A::G | practice-A-G.json | L8 |
| A::Am | practice-Am-A.json | L9 |
| Am::C | practice-Am-C.json | L9 |
| Am::D | practice-Am-D.json | L9 |
| Am::Em | practice-Am-Em.json | L9 |
| Am::G | practice-Am-G.json | L9 |
| A::E | practice-E-A.json | L16 |
| Am::E | practice-E-Am.json | L16 |
| C::E | practice-E-C.json | L16 |
| D::E | practice-E-D.json | L16 |
| E::Em | practice-E-Em.json | L16 |
| E::G | practice-E-G.json | L16 |
| A::Dm | practice-Dm-A.json | L17 |
| Am::Dm | practice-Dm-Am.json | L17 |
| C::Dm | practice-Dm-C.json | L17 |
| D::Dm | practice-Dm-D.json | L17 |
| Dm::E | practice-Dm-E.json | L17 |
| Dm::Em | practice-Dm-Em.json | L17 |
| Dm::G | practice-Dm-G.json | L17 |

**Drills by introduction lesson:**
- L3: C::Em
- L6: Em::G, C::G
- L7: D::Em, C::D, D::G
- L8: A::Em, A::C, A::G, A::D
- L9: Am::Em, Am::C, Am::G, Am::D, A::Am
- L16: E::Em, C::E, E::G, D::E, A::E, Am::E
- L17: Dm::Em, C::Dm, Dm::G, D::Dm, A::Dm, Am::Dm, Dm::E

## Content packs (6 lessons, outside the 20-group spine)

- **Blues pack** (`packs/blues/`): B1 E7, B2 A7, B3 12-bar — teacher T4
- **Country pack** (`packs/country/`): C1 G, C2 C, C3 I–IV–V — teacher T5
- Manifests present and list their files; both include a teacher asset JSON.

## Teachers (3 skins, shared curriculum)

- T1 Maggie Cole, T2 Ellis Nakamura, T3 Ray Boudreaux (`teachers/manifest.json`).

## Known gaps (tracked, non-blocking)

1. **Songs category not yet realized on disk (LOW, §5.6).** Curriculum mandates songs as a separate
   category. `05-content/songs/` holds 2 seed docs (S1 Em→easyC, S2 G–D–Em–C) but `07-app/content/songs/`
   does not exist. L23 "Your First 3-Chord Song" still ships inside the technique lessons dir (chords G, Em, easyC).
   Closing action: create `07-app/content/songs/`, move L23 there. No effect on the 20-group spine or 1:1 ratio.
2. **All 28 practice drills use only the `one-minute-changes` engine.** The §5.2 menu defines 11 drill types
   (Chord-Perfect, Air Changes, Tempo Loop, Wait-To-Play, Weak-Pair Review, etc.); only the counted
   changes drill is generated so far. Practice breadth is the next build item, not a correctness gap.
3. **No dedicated Practice Mode UI** (competitor parity gap, noted in curriculum §3) — drills exist as
   content; no standalone 'just practice' surface yet.

## Verification status

- Manifest↔files: all 23 lesson files + 28 practice files present (0 missing).
- Ship gate `node run-chord-check.js` lives at `06-prototypes/step0/schema/`; practice generation at
  `06-prototypes/practice-engine/` (17 tests per curriculum review). Re-run those gates to assert 0 errors/0 warnings.
- This inventory is a static count/coverage report; it does not re-run the audio/arithmetic gates.

---
*Produced by `tools/inventory_scan.py` + `tools/gen_inventory_report.py`.*