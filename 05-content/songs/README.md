# Songs — separate category (parallel track)

Per curriculum owner directive (§0) and `CURRICULUM-AND-PRACTICE-STRUCTURE.md`,
**songs are a SEPARATE CATEGORY** — a parallel track outside the 20 technique
lesson groups. They never count as a technique lesson or as practice.

## Why a separate dir
The 20 lesson groups teach *technique* (one chord family / skill per group).
Songs are *application* of that technique. Mixing them into the teaching spine
diluted the pedagogy (L03 "YOUR FIRST SONG" and L10 "Four-Chord Songs" were
shipping as technique lessons). They now live here as their own category so:
- the practice-engine validation (which checks the 20-lesson spine 1:1) stays clean, and
- songs can be added/removed/re-ranked without touching technique ordering.

## Seed songs (reconciled from the teaching spine)
| Song | Chord set it applies | Origin |
|------|---------------------|--------|
| `song-seed-S1-em-easyc-first.md` | Em, easyC | the original L03 "first song" (Em→easyC) |
| `song-seed-S2-four-chord-gdEmC.md` | G, D, Em, C | L10 "Four-Chord Songs" milestone (G–D–Em–C loop) |

These are *seed* entries — the real song library (licensing-aware, properly
cleared) is a separate content effort and out of scope for the practice engine.

## Practice integration
Songs are intentionally NOT in the practice UI menu yet (the UI spine is
demo-only). When wired, a song selects its chord set and feeds the same
`one-minute-changes` / `weak-pair-review` engine — songs are just another
chord-set to drill, never a new mechanic.
