# Next conversation — Wave 1 build start (W1-E1 + W1-E2)

## Why this file exists

Context is high. This file is the clean restart point for the next session.

The next session should begin execution of **Wave 1**, starting with:
- **W1-E1 — Reusable world lesson runner**
- **W1-E2 — Lessons 1–5 script pack**

Do **not** restart planning from scratch unless a real contradiction shows up on disk.

---

## What is already decided and locked

Source of truth:
- `.scratch/guitarapp-software-factory/map.md`
- `.scratch/guitarapp-software-factory/execution-board-wave1.md`
- `02-spec/guitar-app-spec-AMENDMENT-17.md`
- `docs/adr/0004-the-teacher-world-1-emerald-hollow.md`
- `CONTEXT.md`

Locked decisions:
- World 1 is **Emerald Hollow**.
- The World 1 teacher is **Sage**.
- **Path B** ships in v1.
- **Path A** stays visible on the roadmap.
- The first shippable slice is **5 lessons**.
- That slice ends with the **first porch performance**.
- The same recurring ladder song is the **simple Em→C first song**.
- For the first slice, **local save + reopen proof is enough**.
- The duet requirement for the first slice is **basic Path B loop/wait**.
- Hermes stops only for:
  - money spend
  - legal risk
  - real-device human testing
  - major student-facing design fork
- Every task needs a **separate verifier pass**.
- Student-facing proof always requires:
  1. gate output
  2. visible walkthrough proof
  3. reopen/save proof

---

## What the next session should do first

### Step 1
Read these files in this order:
1. `AGENTS.md`
2. `01-START-HERE/README.md`
3. `.scratch/guitarapp-software-factory/execution-board-wave1.md`
4. `.scratch/guitarapp-software-factory/system/task-template.md`
5. `.scratch/guitarapp-software-factory/system/proof-checklist.md`

### Step 2
Start **W1-E1** and **W1-E2** only.

Do not start W1-E3, W1-E4, or W1-E5 yet.

---

## W1-E1 — Reusable world lesson runner

### Goal
Build one reusable lesson runner inside the **existing World 1 flow** so lessons can be plugged in without hand-wiring each lesson separately.

### Verified files/surfaces already seen on disk
- `07-app/godot/`
- `07-app/core/world-view-tracker.js`
- `07-app/app.js`
- `07-app/index.html`

### Godot/world evidence already seen on disk this session
The world is not imaginary. Files seen this session include:
- `07-app/godot/assets/worlds/emerald-hollow/clips/B02_twoshot.ogv`
- multiple `sage_*.wav` imports under `07-app/godot/.godot/imported/`
- multiple palette image imports under `07-app/godot/.godot/imported/`

Important: most of what was listed this session under `07-app/godot/` was `.godot` import/cache material. The next session must verify whether the actual editable scene/script files exist beyond imports before deciding the runner shape.

### What W1-E1 must produce
- one lesson-runner contract
- one clean world-to-lesson bridge
- proof that the existing world shell can load at least one lesson step through that runner

### Do not do in W1-E1
- do not rewrite lesson content
- do not choose a new world
- do not build the performance flow yet
- do not drift into Path A

---

## W1-E2 — Lessons 1–5 script pack

### Goal
Finalize the first 5 lesson scripts so they can plug into the reusable runner.

### Target lesson files
- `05-content/guitar-lesson-01-welcome-anatomy-tuning.json`
- `05-content/guitar-lesson-02-holding-the-pick.json`
- `05-content/guitar-lesson-03-first-chord-em.json`
- `05-content/guitar-lesson-04-second-chord-first-song.json`
- `05-content/guitar-lesson-05-strumming-in-time.json`

### Related shipped copies to inspect
- matching lesson files under `07-app/content/lessons/`

### What W1-E2 must produce
- the 5-lesson arc is clear and consistent
- lesson data fits the runner contract
- the 5th lesson leads naturally into the first porch performance of the **Em→C first song**

### Do not do in W1-E2
- do not wire voice assets yet unless needed to understand lesson timing
- do not implement duet behavior yet
- do not broaden beyond lessons 1–5

---

## Recommended execution pattern

### Parallel start
W1-E1 and W1-E2 can start in parallel.

### Then merge on the contract
Once the runner contract is known, make the lesson scripts match it exactly.

### Then stop and hand off to the next wave
After W1-E1 and W1-E2 are done and separately verified, the next session can move to:
- W1-E3 — Sage voice and copy wiring

---

## Files on disk to keep close

### Planning / truth
- `AGENTS.md`
- `01-START-HERE/README.md`
- `02-spec/guitar-app-spec-AMENDMENT-17.md`
- `docs/adr/0004-the-teacher-world-1-emerald-hollow.md`
- `CONTEXT.md`
- `.scratch/guitarapp-software-factory/map.md`
- `.scratch/guitarapp-software-factory/execution-board-wave1.md`

### Factory system files
- `.scratch/guitarapp-software-factory/system/task-template.md`
- `.scratch/guitarapp-software-factory/system/status-board.md`
- `.scratch/guitarapp-software-factory/system/proof-checklist.md`
- `.scratch/guitarapp-software-factory/system/closeout-template.md`
- `.scratch/guitarapp-software-factory/system/blocker-template.md`

### Build surfaces
- `07-app/godot/`
- `07-app/core/world-view-tracker.js`
- `07-app/app.js`
- `07-app/index.html`
- `05-content/guitar-lesson-01-welcome-anatomy-tuning.json`
- `05-content/guitar-lesson-02-holding-the-pick.json`
- `05-content/guitar-lesson-03-first-chord-em.json`
- `05-content/guitar-lesson-04-second-chord-first-song.json`
- `05-content/guitar-lesson-05-strumming-in-time.json`

---

## Constraints that must not drift

Keep these in view, but do not copy the whole rulebook again:
- `AGENTS.md` is still the top rule file.
- Free + commercial-clean legal floor stays locked.
- Rule 5: the LLM writes prose only.
- Rule 8: chord correctness must pass the arithmetic gate.
- Rule 9: voice blocklist is law.
- World 1 is **Emerald Hollow**.
- Teacher is **Sage**.
- The recurring performance song is the **Em→C first song**.
- Level 1 performance lands at the end of **Lesson 5**.

---

## What not to do next session

- Do not reopen the World 1 / Sage / Path B decisions. They are already locked.
- Do not expand past lessons 1–5.
- Do not start W1-E3, W1-E4, or W1-E5 before W1-E1 and W1-E2 are real.
- Do not claim the world structure from memory; inspect the actual files.
- Do not mark anything done without a separate verifier pass.
- Do not call the first slice done without the 3-part proof bundle.

---

## Suggested skills to load next session

- `guitarapp`
- `faithful-answering`
- `writing-for-agents`
- `implement`
- `codebase-design`

---

## Resume cue

**To resume:** verify the editable files under `07-app/godot/`, define the reusable lesson-runner contract for W1-E1, and in parallel inspect lessons 1–5 to shape W1-E2 against that contract.
