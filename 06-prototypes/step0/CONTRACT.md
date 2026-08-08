# STEP 0 CONTRACT — Lesson-JSON schema + renderer hardening (2026-08-07)

Authority: `02-spec/FEATURES-LOCKED-v1-2026-08-07.md` + `02-spec/PLAN-from-locked-spec-2026-08-07.md` STEP 0.
All Step 0 work lives in `Desktop/GuitarApp/06-prototypes/step0/`. Nothing on Desktop root or `~`.

## Files (fixed names — do not rename)
- `schema/lesson.schema.json`   — the schema document (Draft-07 style, hand-checkable)
- `schema/validate.js`          — CommonJS: `module.exports = { validateLesson }` (zero npm deps)
- `engine/renderer.js`          — CommonJS: `module.exports = { buildManifest, CHORD_SVG_DOTS }` (zero npm deps, NO DOM access)
- `player.html`                 — self-contained double-clickable file:// player that inlines renderer.js logic
- `lessons/L01.json`, `lessons/L02.json`, `lessons/L03.json`, `lessons/BROKEN.json`
- `verify-step0.js`             — written by the EVALUATOR, not by builders

## Shared data contract
Chord object (6 entries, index 0 = low E (6th string) → index 5 = high e (1st string)):
```
{ "name": "E minor", "frets": [0,2,2,0,0,0], "fingers": [0,2,3,0,0,0], "qa_status": "verified-standard" }
```
`null` in `frets` = muted string. `0` = open. `fingers` uses 1..4, 0 = open/none, null = muted.

Required top-level keys of a lesson JSON: `lesson`, `chords`, `exercises`, `avatar_coaching_copy`, `qa_block`.
Required inside `lesson`: `id`, `title`, `level`, `lesson_type` (must be `"technique"`), `objectives` (non-empty array), `estimated_minutes`.
`chords` is an object of chordName -> chord object (the `_schema` string key is allowed and ignored).
Each exercise requires: `id`, `name`, `purpose`, `params`, `coaching`, `qa_status`.
`qa_block` requires: `must_verify` (non-empty array) and `guitarist_signoff` (string or null).

## buildManifest(lessonJson) -> manifest
Pure function, no hand-built scenes. Returns:
```
{ lessonId, title, estimatedMinutes,
  scenes: [ { id, kind: "intro"|"chord"|"exercise"|"wrap",
              caption: <string>,
              chord: <null | { name, frets, fingers, qa_status }>,   // COPIED VERBATIM from lesson.chords
              tempoBpm: <number|null>, beats: <number|null>, durationMs: <number> } ],
  totalDurationMs }
```
Rules: one `chord` scene per entry in `chords` (skipping `_schema`), one `exercise` scene per exercise, `intro` first and `wrap` last, captions sourced from `avatar_coaching_copy` / exercise `coaching` — never invented per-lesson code. Pacing: durationMs derived from tempo/beats when present, else a fixed default constant.

## Failure behavior (LOUD)
`validateLesson(obj)` returns `{ valid: bool, errors: [strings] }`. `buildManifest` MUST call it and `throw new Error("LESSON SCHEMA INVALID: " + errors.join("; "))` on failure. No silent defaults, no partial render.

## HARD BANS (8) — enforced every step
1 No camera / hand tracking / AI-drawn fingers. 2 No open-ended transcription (constrained target-matching only).
3 No audio upload — on-device only. 4 No copyrighted song material. 5 LLM prose only, cites real practice-data keys only.
6 No false red X — confidence gating. 7 No shipping AI musical content without contract-guitarist QA (qa_status/qa_block required).
8 No paid/subscription or GPL/non-commercial libs (Rive, Essentia, aubio, XTTS-v2 etc.). Zero npm deps in Step 0.

Fretboard is code-driven from JSON data ONLY — correct-by-construction, never generative.
