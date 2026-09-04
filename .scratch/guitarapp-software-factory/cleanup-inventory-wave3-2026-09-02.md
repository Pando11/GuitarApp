# Wave 3 (parallel resume) — Cleanup inventory

Date: 2026-09-02
Branch: `master`
Latest verified baseline commit (from Wave 3 master handoff): `1640f11`

## Current repo signal (from `git status --porcelain=v1`)
- Modified tracked files: **15**
- Untracked paths: **211**
- Secret-sensitive red line present: **`.env` is untracked** (NOT touched)

### Modified files (explicit list)
- `01-START-HERE/README.md`
- `02-spec/guitar-app-spec-AMENDMENT-17.md`
- `07-app/app.js`
- `07-app/core/chord-theory-check.js`
- `07-app/core/wave1-flow.js`
- `07-app/index.html`
- `07-app/service-worker.js`
- `07-app/test/app-smoke.mjs`
- `07-app/test/fidelity.mjs`
- `AGENTS.md`
- `CONTEXT.md`
- `HANDOFF.md`
- `docs/adr/0004-the-teacher-world-1-emerald-hollow.md`
- `tools/verify-curriculum-order.js`
- `tools/verify-song-progressions.js`

## Untracked paths — what we will NOT delete
These appear to be restored/working trees or content required by the app/tests. We are **intentionally leaving them alone** for this wave:
- Likely source/content trees: `05-content/`, `06-prototypes/`, `07-app/content/`, `07-app/core/`, `scripts/`, `tools/`
- Proof & working state: `.scratch/guitarapp-software-factory/`
- PocketBase local workspace: `.scratch/pocketbase-live/`

## Narrow, safe cleanup candidate (obvious junk only)
**Delete candidates** (directly under `.scratch/`, small “single-purpose scratch json” artifacts):
- `.scratch/a.json`
- `.scratch/at.json`
- `.scratch/at2.json`
- `.scratch/c.json`
- `.scratch/cr.json`
- `.scratch/d.json`
- `.scratch/e.json`
- `.scratch/f.json`
- `.scratch/g.json`
- `.scratch/h.json`
- `.scratch/p.json`
- `.scratch/s.json`
- `.scratch/t.json`
- `.scratch/v.json`
- `.scratch/vols.json`
- `.scratch/vq.json`
- `.scratch/x.json`

### Red lines honored
- `.env` is NOT staged, NOT read, NOT deleted.
- No mass delete (`git clean -fdx`), no `git add .`, no deletes inside likely-source trees.

## Proposed `.gitignore` updates
No `.gitignore` changes recommended yet.
Reason: the untracked large trees under `05-content/`, `06-prototypes/`, and `07-app/content/` are still needed by the current test harness; hiding them in `.gitignore` would reduce future visibility and risk deleting the wrong thing later.

## Expected next actions (in this order)
1. Delete only the 17 narrow scratch json artifacts listed above.
2. Re-run `git status --short` (or `git status --porcelain=v1`) to capture post-cleanup proof.
