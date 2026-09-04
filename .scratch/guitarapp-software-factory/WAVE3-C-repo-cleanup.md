# WAVE3-C — Dirty repo cleanup

## Goal

Clean the repo honestly and safely. The repo is still dirty with many unrelated tracked modifications and a large untracked restore tree.

## Read first

- `AGENTS.md`
- `.scratch/guitarapp-software-factory/NEXT-CONVERSATION-WAVE3-PARALLEL.md`
- `.scratch/guitarapp-software-factory/proof-wave2/gate-trust-matrix.md`

## Current dirty state snapshot

Observed after commit `1640f11`:
- tracked modified files still include docs/spec/gates such as:
  - `01-START-HERE/README.md`
  - `02-spec/guitar-app-spec-AMENDMENT-17.md`
  - `AGENTS.md`
  - `CONTEXT.md`
  - `HANDOFF.md`
  - `07-app/core/chord-theory-check.js`
  - `07-app/service-worker.js`
  - `07-app/test/fidelity.mjs`
  - `tools/verify-curriculum-order.js`
  - `tools/verify-song-progressions.js`
- very large untracked trees exist under:
  - `05-content/`
  - `06-prototypes/`
  - `07-app/content/`
  - `07-app/core/`
  - `scripts/`
  - `tools/`
  - `.scratch/`
- secret-sensitive file present:
  - `.env`

## Write scope

Only write inside:
- `.scratch/guitarapp-software-factory/cleanup-*`
- `.gitignore` if justified

Do NOT delete files until the inventory exists and the parent agent has something concrete to verify.

## Required cleanup method

1. inventory first
2. group paths into:
   - keep for future commit
   - ignore locally
   - archive elsewhere
   - safe to delete now
   - needs Heidi review
3. identify obvious junk under `.scratch/` separately from likely-restored source trees
4. propose `.gitignore` additions if they reduce future noise
5. if safe, execute only narrow cleanup of obvious junk
6. produce before/after `git status --short`

## Red lines

- never stage or print `.env` contents
- do not delete likely-source trees just because they are untracked
- do not do `git clean -fdx`
- do not do `git add .`
- do not guess totals — count from real tool output

## Proof required

- inventory file
- grouped cleanup recommendation
- before/after git status proof
- explicit note of what was intentionally untouched
