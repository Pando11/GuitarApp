# Next conversation — Wave 4 parallel execution
Date: 2026-09-02

## Purpose
Resume from the Wave 3 GREEN on-disk state and finish the next verification + proof hardening slice **without regressing Wave 1/Wave 2 gates**.

This is the **master resume note**. It tells the next agent to fan out work in parallel, then verify everything on disk and rerun the real gates before reporting done.

---
## Current GREEN baseline (re-run before editing)
On this machine, from the Wave 3 run:
- `node 07-app/test/app-smoke.mjs` => **28 passed / 0 failed**
- `node 07-app/test/fidelity.mjs` => **48 passed / 0 failed**
- `node 07-app/core/studentMemorySync.test.mjs` => **14 passed / 0 failed**
- `node .scratch/guitarapp-software-factory/wave1_full_verify.mjs` => **GREEN (0 failures)**
- `bash 07-app/test/chord-check.sh` => PASS
- `bash 07-app/test/curriculum-order.sh` => OK
- `bash 07-app/test/song-progressions.sh` => PASS

Important:
- There is **no new commit yet** for Wave 3 changes. Treat “GREEN” as **current working tree on disk**, not a git ref.
- Latest verified commit pointer from Wave 3 handoff remains `1640f11` (re-run gates anyway).

Proof bundle from Wave 3 (use as reference):
- `.scratch/guitarapp-software-factory/proof-wave3/`

---
## What the next agent must do first
1. Load skills:
   - `guitarapp`
   - `verify-delegated-work`
   - `handoff`
2. Read:
   - `AGENTS.md`
   - `docs/adr/0001-always-on-encrypted-sync.md`
   - `docs/adr/0004-the-teacher-world-1-emerald-hollow.md`
   - `.scratch/guitarapp-software-factory/proof-wave3/WAVE3-A-encrypted-sync-proof.md`
3. Re-run the green baseline above **before any edits**.
4. Then spawn **3 parallel agents**.

---
## Parallel fan-out rule
- Spawn **exactly 3 separate agents** in parallel.
- Each agent gets a disjoint write scope.
- After all three report back:
  - do **not** trust the subagent summaries
  - verify the real files on disk
  - re-run the relevant gates yourself
  - only then report done

---
## Agent A — hostile browser integration verify (encrypted sync)
Task file:
- `.scratch/guitarapp-software-factory/WAVE4-A-encrypted-sync-integration-verify.md`

Goal:
- Verify end-to-end that the app’s **real lesson/performance flow** triggers **encrypted pull on open** and **encrypted push after meaningful performance-state update**.
- Prefer a headless browser (Playwright) to catch “it passed unit tests but integration failed”.

Hard requirements:
- Must use **real local PocketBase**.
- No plaintext upload.
- Must include a negative check: plaintext tokens like `"chordName":"easyC"` and `"chordName":"Em"` must NOT appear in PB ciphertext field.

Expected scope (writes only):
- New/updated proof + test harness files under:
  - `.scratch/guitarapp-software-factory/proof-wave4/`
  - `07-app/test/` OR `07-app/core/` (ONLY if absolutely required for the integration harness)

Stop rules:
- If PocketBase binary / Playwright cannot be used in this environment, write an honest BLOCKED note and fall back to the best available deterministic integration harness (JSdom + real PocketBase HTTP fetch), but still prove via real PB record read-back.

---
## Agent B — performance shell deepen pass (UI proof, no behavior regressions)
Task file:
- `.scratch/guitarapp-software-factory/WAVE4-B-performance-shell-ui-proof.md`

Goal:
- Prove the UI improvements from Wave 3 B actually render and behave:
  - invitation block is visible before completion
  - progress line updates while looping
  - completion block appears after target loops
  - required selectors and existing gates still pass

Hard requirements:
- No sync transport file edits.
- No teaching copy regression (teacher remains Sage; World 1 Emerald Hollow).

Expected scope (writes only):
- `07-app/test/` harness updates if needed
- Proof screenshots/DOM dumps under `.scratch/guitarapp-software-factory/proof-wave4/`

---
## Agent C — gate re-run + repo hygiene confirmation
Task file:
- `.scratch/guitarapp-software-factory/WAVE4-C-gates-and-hygiene.md`

Goal:
- Re-run the **full Wave 1 / Wave 2 gate set** after the A+B integrations.
- Confirm `.env` was not staged, read, modified, or deleted.
- Confirm repo cleanup from Wave 3 did not delete required content.

Expected scope (writes only):
- `.scratch/guitarapp-software-factory/proof-wave4/` proof notes

---
## Constraints that must not drift
- Latest verified commit pointer stays `1640f11` (but re-run gates for current working tree)
- World 1 = Emerald Hollow
- teacher = Sage
- Path B ships first; Path A stays visible
- Level 1 stays at Lesson 5
- Level 2 stays at Lesson 12
- encrypted sync stays device-side first; PB stores ciphertext only
- report real proof, not agent summaries

---
## What not to do
- Do not recreate retired `HANDOFF-*.md` files
- Do not do blind `git add .`
- Do not mass-delete untracked trees
- Do not touch `.env` (secret-sensitive red line)
- Do not claim anything is verified unless you re-ran the real gates yourself
