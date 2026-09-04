# W2-E4 Performance Level 2 proof

## Chosen lesson gate

- **Level 2 lesson ID:** `L12-new-chord-am-big-four`
- **Lesson number:** `12`
- **Reason:** it sits inside the ratified `L10–L12` band and lands after the student has the big beginner set in hand, which makes the second performance feel earned without drifting into the later spine.

## Wiring

- Lesson metadata added in:
  - `07-app/content/lessons/guitar-lesson-12-new-chord-am-big-four.json`
  - `05-content/guitar-lesson-12-new-chord-am-big-four.json`
- Runner carries `lesson.app_feature_mapping` through `07-app/core/lesson-runner.js`
- Flow hook reads `performance_ladder` metadata in `07-app/core/wave1-flow.js`
- New Level 2 storage key: `guitarapp.wave2.pathb.level2`
- Level 2 config:
  - recurring song: `em-easyc-first-song`
  - chord cycle: `Em -> easyC`
  - tempo target: `84 bpm`
  - target loops: `3`

## Proof

- `07-app/test/app-smoke.mjs` passed `24 passed / 0 failed`
- Smoke gate asserts:
  - Lesson 12 metadata mounts the Level 2 performance panel
  - `configFromModel(model12).lessonNumber === 12`
  - local save key `guitarapp.wave2.pathb.level2` is written
  - Level 2 reaches `loopsCompleted === 3`
- Visual proof:
  - screenshot: `w2-e4-lesson12-level2.png`
  - DOM/state dump: `visual-proof.json`
  - command log: `visual-proof-command.log`

## No-regression proof

- Wave 1 verifier stayed GREEN: `wave1-full-verify.txt`
- Level 1 visual proof still passes:
  - `w2-e1-lesson5-level1-before.png`
  - `w2-e1-lesson5-level1-after.png`
  - `w2-e1-lesson5-level1-reopen.png`
- Chord / curriculum / song gates stayed green in this same pass.
