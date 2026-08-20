# Board Proposal — Suno-style AI music feature for GuitarApp
**Date:** 2026-08-17
**Status:** Awaiting board decision
**Owner:** Heidi Hendrickson

---

## The opportunity
I've been seeing ads for **Suno** — an app where you type a prompt and it writes a
whole song (music + singing). People are using it to make their own music, and the
category is clearly heating up. There's a real chance for GuitarApp to offer something
similar *inside* our lesson app. This is a proposal to explore that, not a done deal.

## What we are NOT doing
We are **not** buying Suno or any paid subscription. Our rule is everything stays free
and commercially clean, and Suno breaks that rule two ways:
- It is a **paid subscription** (free tier = personal, non-commercial, must credit Suno).
- It has a **messy copyright history** — sued by major record labels (RIAA) over
  training on unlicensed music; a Munich court ruled against it for using copyrighted
  songs without a license; it has since settled some suits and signed a Warner Music
  licensing deal. That's exactly the legal risk we avoid.

## What we'd build instead
The *capability* (type a prompt, get a song) is buildable with **open-source models
that are free and cleared for commercial use**. I checked the actual license files in
each project's repo — not a blog summary:

| Model | License (verified at source) | Commercial use in a paid app? |
|---|---|---|
| **ACE-Step** (original) | Apache-2.0 | Yes |
| **ACE-Step-1.5** (fork, 12.2k stars) | MIT | Yes (MIT = most permissive) |
| **YuE** ("open full-song music gen, like Suno but open") | Apache-2.0 | Yes |
| Suno (the ad) | Paid subscription, NC free tier | No — disqualified |

## Two phases
**Phase 1 (lightweight, start here):** Student hums a tune → app matches it to chords
and turns it into a lesson. This already overlaps our roadmap item "Hum a song → instant
lesson" (unblocked 2026-08-16).

**Phase 2 (bigger swing):** App generates original practice backing tracks / full songs
so students play along to a real band. Needs a rented cloud GPU (same situation as our
FLUX/Wan video models — the mini-PC has no graphics card). Nice-to-have, not the start.

## Recommendation
Pursue Phase 1 now (cheap, fits what's already planned, respects our free+clean rule).
Treat Phase-2 backing tracks as a budgeted trial after Phase 1 proves out.

## Questions for the board
1. Do we approve the "hum a song → lesson" direction (Phase 1)?
2. Should we budget a small cloud-GPU trial for Phase-2 backing tracks?
3. Any music-IP concern we should route to counsel before we ship?

---
*Tracking note: also added to `PROPOSED-FEATURES.md` as feature #22, and corrected the
music-gen license references on #11 and #18 (MusicGen is CC BY-NC = non-commercial, so
it is disqualified — ACE-Step/YuE are the correct candidates).*
