# Milestone beat — "You've graduated from easyC to C"

**Category:** teaching beat (non-blocking, beginner clarity nicety)
**Chord canonicalization:** `easyC` and `C` are arithmetically the SAME chord
(spell C–E–G). AMENDMENT-11 / the practice engine's `canonChord` collapses them
so a student's fluency on the 2-finger easyC carries straight over to the full
C — no memory reset, no re-grinding the pair.

**When it triggers:** the first time the student's fluency on the `C`/`easyC`
spelling (whichever they practiced) crosses the advance threshold (≥30/min) on
the relevant change pair (e.g. Em↔C, G↔C, Am↔C). It is a *celebration moment*,
not a gate — practice continues uninterrupted.

## The beat (copy for the app)
> 🎓 **Graduation moment:** You've outgrown the 2-finger "easy C." From here on,
> the full **C major** shape is yours — same chord you already mastered, just
> with the ring finger adding the high C (2nd string, 1st fret). Your fluency
> carried over automatically; you don't start over. Try the full C in your next
> Em↔C change.

## Why it exists
- Beginner clarity: without this beat, the silent swap from easyC→C looks like a
  brand-new chord and can spook a student into thinking they "lost" progress.
- The engine already guarantees continuity via `canonChord`; this beat makes that
  invisible continuity *legible* to the human.

## Wiring notes
- Content only — does NOT edit `practice-ui.html` and does NOT change engine math.
- Recommended: surface as a one-time nudge (the review-nudge mount point already
  exists in the UI) keyed on the first `canonChord('easyC')==='C'` advance event.
- Register in the curriculum spine as a milestone marker (see
  `CURRICULUM-AND-PRACTICE-STRUCTURE.md` §0 note below).
