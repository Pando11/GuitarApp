# WAVE3-B — Performance shell deepen pass

## Goal

Push the performance shell beyond the current rail and lesson panels so the flow feels closer to a product, not just a proof harness.

## Read first

- `AGENTS.md`
- `02-spec/guitar-app-spec-AMENDMENT-17.md`
- `docs/adr/0004-the-teacher-world-1-emerald-hollow.md`
- `.scratch/guitarapp-software-factory/proof-wave2/w2-e4-level2-proof.md`
- `.scratch/guitarapp-software-factory/proof-wave2/visual-walkthrough.md`

## Current truth

Already working:
- home performance rail exists
- Level 1 is pinned at Lesson 5
- Level 2 is pinned at Lesson 12
- Path B state persists for both levels
- Path A is visible as roadmap text

## Write scope

Only write inside:
- `07-app/index.html`
- `07-app/app.js`
- `07-app/core/wave1-flow.js`
- `07-app/core/lesson-runner.js`
- lesson JSON only if truly required
- proof files under `.scratch/guitarapp-software-factory/proof-wave3/`

Do NOT edit sync transport files unless the parent agent explicitly reassigns scope.

## Target improvements

Choose the smallest set that materially improves the shell, then prove them:
- invitation card before a level starts
- completion card after a level finishes
- clearer bridge from Level 1 -> Level 2
- sync-aware progress line if the sync agent exposes a usable flag
- stronger capstone teaser for Level 3
- better next-step CTA after a completed performance

## Constraints

- World 1 stays Emerald Hollow
- teacher stays Sage
- Chatterbox remains the voice target
- Path B ships first
- Path A stays visible
- Level 1 must remain Lesson 5
- Level 2 must remain Lesson 12
- no regression to the current green Wave 2 flow

## Proof required

- fresh screenshots
- updated visual walkthrough
- updated smoke assertions
- all green gates again

## Verification

Must re-run at least:
- `node 07-app/test/app-smoke.mjs`
- `node .scratch/guitarapp-software-factory/wave1_full_verify.mjs`
- chord / curriculum / song gates
