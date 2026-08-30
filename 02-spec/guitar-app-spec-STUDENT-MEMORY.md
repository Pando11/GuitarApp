# Spec — Student Memory (from grill-with-docs, 2026-08-21)

Derived from a grill session. Supersedes the *product-style* wording of
AMENDMENT-11 §4 (v1 cap) where it conflicts; the **legal floor** (Rules 5, 9, 2)
and the rest of AMENDMENT-11 are unchanged. See `docs/adr/0001-always-on-encrypted-sync.md`.

## Problem Statement

The GuitarApp is a recurring AI teacher who remembers the student and coaches
forward. Today the repo has the listening mechanic and lesson content, but **no
student-memory / progress-profile module exists** (AMENDMENT-11 Red Line 1). The
owner requires the memory to follow the student across devices automatically and
to let the teacher individualize coaching — without crossing legal or privacy
lines.

## Solution

A per-student memory module that:
1. Stores mastery per chord as a **label + 0–100 confidence**.
2. Syncs **always-on, encrypted, zero-knowledge** across the student's devices.
3. Remembers which **coaching format** and **preferred format** worked — asked of
   the student gradually, never inferred.
4. Is written by the listening engine **after every session**.
5. Drives teacher copy under Rule 5 (stored numbers only, no freelancing).

## User Stories

1. As a student, I want my practice progress to follow me from my phone to my
   desktop automatically, so that the teacher remembers me on any device.
2. As a student, I want the teacher to say "you had E minor solid" vs "you were
   shaky on C," so the coaching feels personal and true.
3. As a student, I want the app to remember that video practice (or sheet music)
   worked for me, so it offers that again without me re-explaining.
4. As a student, I want strumming practice as a replayable video I can play along
   with, so I can drill at home.
5. As the owner, I want the server to never read plaintext practice data, so a
   breach cannot expose students.
6. As the owner, I want the teacher to only ever cite stored mastery numbers, so
   it cannot freelance musical opinions or launder copyrighted material.

## Implementation Decisions

- **Storage shape** (per student):
  ```
  {
    chord: { label: "mastered"|"needs_work"|"not_started", confidence: 0..100 },
    last_lesson: <id>,
    weak_spots: [<chord>],
    practice_history: [<session summary>],
    coaching_format_that_worked: "30-min/day" | "exercises" | ...,
    preferred_format: "video" | "sheet-music" | "replay"
  }
  ```
- **Sync:** always-on, encrypted client-side, zero-knowledge at rest in
  PocketBase. No toggle UI. (ADR-0001.)
- **Recovery:** on first sync the app shows a plain-language recovery phrase the
  student saves; entering it on a new device restores the encrypted memory. No
  server-side key custody. (ADR-0001.)
- **Write path:** listening engine (AMENDMENT-05, on-device) updates mastery
  **after every session**, then the encrypted blob syncs.
- **Teacher copy:** generated from the stored JSON only (Rule 5). "Solid" /
  "shaky" derived from `confidence`; format offers derived from
  `coaching_format_that_worked` / `preferred_format`.
- **Preferred format is asked, not inferred:** gradually over lessons; we may
  "always go back and offer the other ways" (video / sheet-music / replay).
- **Sheet-music email:** chords / progressions ONLY — never tab, lyrics, or
  melody (Rule 9 / AMENDMENT-12/14). State this in-product.

## Banned (legal / privacy redlines)

- NO personality or psychology profiling of the student.
- NO "visual/auditory learner" label — store `preferred_format` instead.
- NO camera, NO hand tracking (Rule 2).
- NO freelanced teacher opinions — Rule 5.
- NO copyrighted material in emails (tab/lyrics/melody) — Rule 9.

## Testing Decisions

- On-device match writes correct `label` + `confidence` after a session.
- Encrypted blob at rest in PocketBase is not decryptable by the server.
- Editing on phone appears on desktop within sync (always-on, no toggle).
- Teacher copy cites only stored fields; never invents a judgement.

## Out of Scope (v1)

- Behavioral profiling, mood inference, psychology.
- Duet — gated on listening-engine ship + calibration (AMENDMENT-11 Red Line 3).

## Further Notes

- This is the first of a rolling set of grilled feature specs. Later features
  (practice-delivery, mystery mode, teacher, audio-first, curriculum, song
  track, backend) build on this glossary.
- "Erase old rules" directive is honored for *product-style* rules only; the
  legal floor (Rules 5/9/2) is deliberately retained and re-ratified here.
