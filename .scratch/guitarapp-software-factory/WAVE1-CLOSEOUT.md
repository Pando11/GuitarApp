# Wave 1 closeout (W1-E1 to W1-E5)

Date: 2026-09-02

## Scope completed

- W1-E1: Reusable lesson runner
- W1-E2: Lessons 1-5 aligned to runner contract
- W1-E3: Sage voice/copy wiring in lesson flow
- W1-E4: First porch performance + basic Path B loop/wait with local save
- W1-E5: Proof bundle with runnable verification output

## Files changed

- `07-app/core/lesson-runner.js` (new)
- `07-app/core/wave1-flow.js` (new)
- `07-app/index.html` (runner + Wave 1 flow wiring)
- `05-content/guitar-lesson-03-first-chord-em.json` (added `lesson.app_feature_mapping`)
- `05-content/guitar-lesson-01-welcome-anatomy-tuning.json` (parity text sync)
- `05-content/guitar-lesson-05-strumming-in-time.json` (wrap leads to porch performance)
- `07-app/content/lessons/guitar-lesson-05-strumming-in-time.json` (same wrap update)

## Runner contract

- Contract doc: `.scratch/guitarapp-software-factory/W1-E1-lesson-runner-contract.md`
- Wave 1 unlocks: first 5 lessons (`LESSON_UNLOCK_COUNT=5`)
- Runner API: `openLesson(index)`, `currentLesson()`, normalized lesson model

## Path B behavior shipped

- Recurring cycle: `Em -> easyC`
- Correct chord: action=`follow`
- Wrong chord: action=`wait`
- State persisted in localStorage key: `guitarapp.wave1.pathb`
- Reopen/load keeps loop count and next expected chord

## Proof bundle

Folder: `.scratch/guitarapp-software-factory/proof-wave1/`

- `wave1_full_verify.txt`
- `chord_gate.txt`
- `curriculum_gate.txt`
- `song_gate.txt`
- `visible-walkthrough.md`

## Commands run

- `node --check 07-app/core/lesson-runner.js`
- `node --check 07-app/core/wave1-flow.js`
- `node .scratch/guitarapp-software-factory/wave1_full_verify.mjs`
- `cd 06-prototypes/step0 && node run-chord-check.js`
- `node tools/verify-curriculum-order.js`
- `node tools/verify-song-progressions.js`

## Results summary

- `wave1_full_verify.mjs`: GREEN (0 failures)
- Chord gate: 25 lessons, 81 chords, 0 errors, 0 warnings
- Curriculum gate: passed, 0 errors
- Song-progression gate: passed, 0 errors, 0 warnings

## Known limitation still requiring desktop interaction

- Browser screenshots and phone click-through proof could not be captured in this run because Chrome remote-debug permission requires a manual popup click on the desktop.
- All non-interactive proof and persistence checks were completed.
