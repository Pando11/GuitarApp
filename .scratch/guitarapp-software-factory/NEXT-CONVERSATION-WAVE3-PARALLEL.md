# Next conversation — Wave 3 parallel execution

Date: 2026-09-02

## Purpose

Resume from the verified Wave 2 baseline and push **three workstreams at the same time**:
1. browser-app live encrypted sync
2. deeper performance shell
3. repo cleanup

This file is the **master resume note**. It tells the next agent to fan out the work in parallel, then verify every artifact before claiming done.

---

## Current verified baseline

Latest commit on `master`:
- `1640f11` — `feat: advance wave 2 performance and live sync`

Verified in the last run:
- Wave 1 verifier: `GREEN`
- `07-app/test/app-smoke.mjs`: `28 passed / 0 failed`
- `07-app/test/fidelity.mjs`: `48 passed / 0 failed`
- live PocketBase transport: `12 passed / 0 failed`
- `07-app/core/studentMemorySync.test.mjs`: `14 passed / 0 failed`
- chord gate: `25 lessons / 81 chords / 0 errors / 0 warnings`
- curriculum gate: `0 errors`
- song gate: `0 errors / 0 warnings`

Proof bundle:
- `.scratch/guitarapp-software-factory/proof-wave2/`

Important working files from Wave 2:
- `07-app/app.js`
- `07-app/index.html`
- `07-app/core/wave1-flow.js`
- `07-app/core/lesson-runner.js`
- `07-app/core/pocketbaseSync.js`
- `07-app/core/studentMemorySync.js`
- `07-app/test/pocketbase-live-sync.mjs`
- `07-app/test/app-smoke.mjs`

---

## What the next agent must do first

1. Load skills:
   - `guitarapp`
   - `verify-delegated-work`
   - `handoff`
2. Read:
   - `AGENTS.md`
   - `01-START-HERE/README.md`
   - `02-spec/guitar-app-spec-AMENDMENT-17.md`
   - `docs/adr/0001-always-on-encrypted-sync.md`
   - `docs/adr/0004-the-teacher-world-1-emerald-hollow.md`
   - `.scratch/guitarapp-software-factory/proof-wave2/gate-trust-matrix.md`
3. Re-run the green baseline before editing.
4. Then spawn **3 parallel agents** with the exact workstreams below.

---

## Parallel fan-out rule

Use **three separate agents** at once.

Each agent gets a **disjoint write scope**:
- Agent A writes only sync-related files
- Agent B writes only performance-shell files
- Agent C writes only cleanup/audit files until it is ready to apply cleanup

After all three report back:
- do **not** trust the summaries
- verify the real files on disk
- re-run the relevant gates yourself
- only then report done

If delegated agents stall, return empty, or write nothing, stop re-dispatching and finish the failed stream in the foreground session.

---

## Agent A — browser app live encrypted sync

Task file:
- `.scratch/guitarapp-software-factory/WAVE3-A-browser-live-sync.md`

Goal:
- move from "transport proven by test" to "the real browser lesson/performance flow actually pushes and pulls encrypted student memory"

Expected scope:
- `07-app/app.js`
- `07-app/core/studentMemorySync.js`
- `07-app/core/pocketbaseSync.js`
- new small helper files if needed under `07-app/core/`
- sync-focused tests under `07-app/test/` or `07-app/core/`

Hard requirements:
- no plaintext upload
- local-first behavior preserved
- session-end push + app-open pull per ADR-0001
- must use PocketBase, not a fake stub
- must prove read-back with a real local PocketBase server

Proof required:
- real browser/session path or deterministic shell path showing pull on open and push after lesson/performance state change
- encrypted record confirmed on the PocketBase side
- no plaintext strings in stored ciphertext
- updated logs under `.scratch/guitarapp-software-factory/proof-wave3/`

---

## Agent B — deepen the performance shell

Task file:
- `.scratch/guitarapp-software-factory/WAVE3-B-performance-shell.md`

Goal:
- push the performance shell past the current rail/panel state so it feels more like a real product flow

Target areas:
- performance invitation state
- completion cards
- next-step messaging
- sync-aware progress text
- smoother bridge between Level 1, Level 2, and the future Level 3 capstone

Expected scope:
- `07-app/index.html`
- `07-app/app.js`
- `07-app/core/wave1-flow.js`
- `07-app/core/lesson-runner.js`
- lesson JSON only if truly needed
- smoke/visual proof scripts if UI changed

Hard requirements:
- Path B ships first
- Path A stays visible on the roadmap
- World 1 remains Emerald Hollow
- teacher remains Sage
- Level 1 stays at Lesson 5
- Level 2 stays pinned at Lesson 12
- no regression to Wave 1 flow

Proof required:
- fresh screenshots
- updated visual walkthrough
- updated app-smoke assertions
- all green gates again

---

## Agent C — dirty repo cleanup

Task file:
- `.scratch/guitarapp-software-factory/WAVE3-C-repo-cleanup.md`

Goal:
- clean the repo honestly without deleting the wrong things or losing work

Current dirty state to reconcile:
- tracked modified files still present in docs/spec/gates
- a very large untracked restore tree under `05-content/`, `06-prototypes/`, `07-app/content/`, `07-app/core/`, `scripts/`, `tools/`, and `.scratch/`
- secret-sensitive file present: `.env`

Cleanup rules:
- **never stage or expose `.env`**
- do not mass-delete blindly
- classify first: keep / ignore / archive / remove / commit-later
- write the cleanup inventory before destructive cleanup
- prefer `.gitignore` + structured inventory + narrow deletes
- verify counts from real `git status` output, not estimates

Expected outputs:
- cleanup inventory doc
- recommended `.gitignore` updates if needed
- a narrow cleanup execution plan
- if safe, actual cleanup of obvious junk only
- post-cleanup `git status` proof

Proof required:
- before/after `git status --short`
- inventory file with grouped paths
- explicit note of what was intentionally not touched

---

## Suggested spawn shape

The next agent should spawn all three at once with self-contained prompts based on the three task files above.

Plain English instruction to include in the parent prompt:
- "Spawn three agents now, one per task file. Keep their write scopes separate. When they finish, verify all outputs yourself on disk and rerun the real gates before you tell Heidi anything is done."

---

## Constraints that must not drift

- latest verified commit remains `1640f11`
- World 1 = Emerald Hollow
- teacher = Sage
- Chatterbox is the shipping voice target
- Path B ships first
- Path A stays visible
- Level 1 = Lesson 5
- Level 2 = Lesson 12
- encrypted sync stays client-side before upload
- chord correctness remains arithmetic-gated
- report real proof, not agent summaries

---

## What not to do

- do not recreate retired `HANDOFF-*.md` files
- do not trust delegated-agent success messages without disk proof
- do not let parallel agents write the same file
- do not claim live sync is done from unit tests alone
- do not delete `.env`
- do not do a blind `git add .`
- do not regress the Wave 2 green set while improving UI

---

## Resume cue

To resume:
1. verify the current green baseline
2. read the three task files
3. spawn the three agents in parallel
4. verify their artifacts yourself
5. rerun gates
6. only then summarize results for Heidi
