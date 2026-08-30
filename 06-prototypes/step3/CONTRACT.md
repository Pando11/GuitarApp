# STEP 3 CONTRACT — Lesson player + 3-teacher roster shell (F3)

Authority: `02-spec/FEATURES-LOCKED-v1-2026-08-07.md` §F3 + `02-spec/PLAN-from-locked-spec-2026-08-07.md` STEP 3.
All Step 3 work lives in `Desktop/GuitarApp/06-prototypes/step3/`. Nothing on Desktop root or `~`.
Step 3 REUSES Step 0 (`../step0/engine/renderer.js`, `../step0/schema/validate.js`, `../step0/lessons/*.json`).
Step 0 is NOT modified by Step 3.

## Files (fixed names — do not rename)
- `teachers/T1.json`, `teachers/T2.json`, `teachers/T3.json` — persona + art ONLY (no lesson content)
- `engine/teacher.js`   — CommonJS: `{ loadTeacher, applyTeacher, LESSON_CONTENT_KEYS }`
- `engine/session.js`   — CommonJS: `{ createSession }` — position state + fire/hire mid-lesson
- `engine/lipsync.js`   — CommonJS: `{ lipsyncFrames }` — mouth openness from VOICE AUDIO SAMPLES
- `player3.html`        — self-contained double-clickable file:// player, 3 skins + fire/hire settings
- `verify-step3.js`     — DONE BAR harness (evaluator-owned)

## Hard invariant — TEACHER IS COSMETIC ONLY
`applyTeacher(manifest, teacher)` returns a VIEW MODEL. It must not mutate the manifest and
must not change any lesson-content field. Lesson-content fields (frozen across all teachers):

    scene.id, scene.kind, scene.caption, scene.chord (name/frets/fingers/qa_status),
    scene.tempoBpm, scene.beats, scene.durationMs, manifest.lessonId,
    manifest.totalDurationMs, scene ORDER

The view model may add ONLY teacher-owned fields: `teacherId`, `voice`, `persona`,
`skin`, `speech.style`, `speech.persona_line`. Every persona line must be traceable to a
string present in the teacher JSON — never derived from lesson data.

## Fire/hire
`createSession(manifest, teacher)` tracks `sceneIndex` + `elapsedInSceneMs`.
`session.hire(newTeacher)` swaps the teacher and MUST preserve `sceneIndex` and
`elapsedInSceneMs` exactly, and emit the new teacher's `handoff_line`
("so you're my new student"), which comes from the teacher JSON.

## Lip-sync is DRIVEN BY VOICE AUDIO — not by text
`lipsyncFrames(samples, sampleRate, fps)` -> `[{ tMs, openness }]`, openness in 0..1 derived
from the RMS envelope of the audio samples. Proofs required:
- silence -> all openness 0 (mouth shut)
- same audio + different text -> IDENTICAL frames (text has no influence)
- same text + different audio -> DIFFERENT frames (audio drives it)

## HARD BANS (8) — unchanged, enforced
No camera/hand-tracking/AI-drawn fingers · no open transcription · no audio upload ·
no copyrighted songs · LLM prose cites real data only · no false red X · qa_status/qa_block
required · no paid/GPL/non-commercial libs. ZERO npm deps. Fretboard code-driven from JSON only.

## Open items carried in (non-blocking)
Teacher NAMES and final art are owner decisions — T1/T2/T3 ship as codenames with
persona + palette placeholders. Voice = OpenAI TTS at build time (approved, Rule 9).
