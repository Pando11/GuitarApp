# WAVE4-C — gates and hygiene

## Goal
Re-run gates and confirm repo hygiene rules after A+B integration.

## Hard requirements
- Re-run all real gates that define GREEN for this project:
  - `node 07-app/test/app-smoke.mjs`
  - `node 07-app/test/fidelity.mjs`
  - `node 07-app/core/studentMemorySync.test.mjs`
  - `.scratch/guitarapp-software-factory/wave1_full_verify.mjs`
  - `bash 07-app/test/chord-check.sh`
  - `bash 07-app/test/curriculum-order.sh`
  - `bash 07-app/test/song-progressions.sh`

## Red lines
- `.env` must never be staged, read into logs, modified, or deleted.
- No blind cleanup deletes. No `git add .`.

## Write scope (disjoint)
Only write:
- `.scratch/guitarapp-software-factory/proof-wave4/` proof notes and a short post-gate command output dump.

## Proof required
- Capture `git status --porcelain=v1` output (with a note that `.env` is unmodified)
- Capture gate outputs with pass/fail counts
