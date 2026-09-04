# WAVE4-B — performance shell UI proof

## Goal
Prove that the performance shell deepen UI from Wave 3 B is visible and behaves correctly.

Specifically check:
- invitation block is visible before completion
- progress line updates after each correct chord click
- completion block becomes visible after reaching target loops
- required status text still includes: `next expected:` and `loops completed:`

## Read first
- `07-app/core/wave1-flow.js`
- `07-app/test/app-smoke.mjs` (it is already green)

## Write scope (disjoint)
Only write:
- `.scratch/guitarapp-software-factory/proof-wave4/`
- Optional: `07-app/test/` harnesses if you need DOM assertions for specific selectors

## Verification checklist
- Run `node 07-app/test/app-smoke.mjs` after any UI harness edits
- Add proof output showing:
  - Level 1 selectors present (`#pathb-l1-invite`, `#pathb-l1-progress`, `#pathb-l1-complete`)
  - Level 2 selectors present (`#pathb-l2-invite`, `#pathb-l2-progress`, `#pathb-l2-complete`)
  - completion toggles after enough correct chord clicks

## Stop rules
- If you cannot reliably click through completion in a non-interactive harness, write honest BLOCKED + at least do the DOM presence checks.
