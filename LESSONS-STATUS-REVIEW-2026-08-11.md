# GUITAR APP — LESSONS STATUS REVIEW
Date: 2026-08-11  |  Reviewer: autonomous Hermes session (resumed from handoff)
Scope: chord-correctness + content completeness of the lesson library.
Project root: C:\Users\The Yoda Trader\Desktop\GuitarApp

=====================================================================
1. VERDICT (one line)
=====================================================================
Lesson chord DATA is ARITHMETICALLY CORRECT across the whole shipping
curriculum (0 errors). The committed "ship gate" was, however, silently
checking the wrong files (3 stale prototypes, not the 23 real lessons) —
a false-assurance defect now FIXED and GREEN. Content is structurally
complete for lessons 1–23; pedagogy/voice/UI still await owner sign-off.

=====================================================================
2. CHORD-CORRECTNESS — the ship gate (AGENTS.md Rule 8)
=====================================================================
Rule 8: `node run-chord-check.js` must report 0 errors AND 0 warnings.

DEFECT FOUND + FIXED this run:
  OLD gate scanned only 06-prototypes/step0/lessons/{L01,L02,L03}.json
  — 3 stale prototype files. It printed "CHORDS-VERIFIED-OK — safe to
  ship" while never touching a single one of the 23 real lessons. That
  is false assurance: the gate could pass while every shipping lesson was
  broken.
  NEW gate reads 07-app/content/lessons/manifest.json (the canonical
  shipping set) and checks every named lesson.

PROOF (run on disk, this session):
  > node 06-prototypes/step0/run-chord-check.js
  23 lessons | 71 chords checked | 0 errors | 0 warnings
  CHORDS-VERIFIED-OK — safe to ship   (exit 0)

Full-curriculum sweep (my temp scanner, since removed) over 46 chord-
bearing lesson files (149 chords total) also returned 0 errors, 2 warnings.

=====================================================================
3. LESSON INVENTORY
=====================================================================
A. SHIPPING SET — 07-app/content/lessons/ (manifest = 23 lessons)
   All 23 present, all parse, all pass the chord gate (0 errors/0 warns).
   01 Welcome/Anatomy/Tuning      13 Dynamics + alternating bass
   02 First Chord Em              14 Capo Basics
   03 Second Chord + First Song   15 Faster Chord Changes
   04 Strumming in Time           16 New Chord E
   05 Chord Changes Em<->easyC    17 Minor Prog + Dm
   06 New Chord G                 18 Fingerpicking (Travis)
   07 New Chord D                 19 Read Chord Chart/TAB
   08 New Chord A                 20 Consolidation/Performance
   09 New Chord Am (Big Four)     21 Holding the Pick
   10 Four-Chord Songs            22 Switching Em<->C
   11 Up-Strums                   23 First 3-Chord Song
   12 Strumming Patterns
   Notes: 01, 21 have no chords (anatomy/pick grip — correct). Every other
   lesson carries verified fingerings. Exercises per lesson: 2–4.

B. AUTHORING MIRROR — 05-content/ (20 lessons, 01–20)
   Mirrors 07-app lessons 01–20 exactly (same titles/chords). The 3 newer
   shipping lessons (21–23) exist only in 07-app, not yet mirrored to
   05-content. Not a defect for shipping, but the two authoring copies can
   drift — recommend 05-content be the single source and 07-app be a
   generated copy, or drop the duplicate.

C. BONUS PACKS (not in core manifest)
   blues-pack/  (3 lessons, E7/A7/12-bar) — 0 errors/0 warns.
   country-pack/ (3 lessons, G/C/I-IV-V) — 0 errors, 2 benign warnings:
     c3 "D" = A D F# flagged: (1) lowest note A not root D — intentional
     I-IV-V walk (root not always bottom); (2) finger 3 behind finger 4 —
     playable voicing. Both are acceptable voicings, not bugs.

=====================================================================
4. WHAT IS NOT VERIFIED BY THIS REVIEW (honest limits)
=====================================================================
This review verifies ARITHMETIC chord correctness + file/structure sanity
only (Rule 8 + "arithmetic replaces a guitarist"). It does NOT, and cannot,
certify:
  - Teaching quality / pedagogy ordering (owner/Human judgement)
  - Audio engine, voice assets, avatar rendering (build, not lesson data)
  - App UI/phone rendering (separate test suite under 07-app/test)
Those are flagged in prose per project rules, never as a red "unverified"
box in the UI.

=====================================================================
5. REPO / BUILD STATE (observed on disk)
====================================================================
  - Branch: master. HEAD ff69a02 (SW EADDRINUSE hardening).
  - Working tree is HEAVY WIP and UNCOMMITTED: 10 modified tracked files
    (README.md, AGENTS.md, lesson 02 x2, LAN docs, start-lan.bat, app-smoke)
    + ~30 untracked (AMENDMENT-06..10, godot/, audio/, asset-job.js, etc.).
  - This run committed ONLY the ship-gate fix (run-chord-check.js). It did
    NOT touch the unrelated WIP. Owner should review/commit the amendment +
    godot + audio work separately.
  - Git user config: not set in this env — commit used default identity;
    verify author before pushing.

=====================================================================
6. OPEN ITEMS RELEVANT TO LESSONS READINESS
====================================================================
  - [BLOCKER-none] chord data: GREEN.
  - [DECISION] 05-content vs 07-app duplication — pick one source of truth.
  - [DECISION] Bonus packs (blues/country) — in or out of v1 manifest?
  - [AWAITING OWNER] Heidi's go-ahead to ship; teacher character art;
    real-guitar mic calibration sign-off (logic proven, 2-min room test).
  - [RECOMMEND] Wire the fixed gate into CI so "safe to ship" can never
    again mean "3 stale prototypes pass."

=====================================================================
7. NEXT STEP
====================================================================
Gate is green and now actually covers the shipping lessons. Standing
decision for owner: commit the WIP amendments/godot/audio as discrete
commits, decide the 05-content/07-app duplication, and green-light the
audio-engine + phone smoke tests before any ship decision.
