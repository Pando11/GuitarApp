# GuitarApp execution board — Wave 1

## Goal

Finish the first shippable slice:
- phone-ready,
- World 1 / Emerald Hollow,
- Sage present,
- 5 lessons,
- first porch performance,
- same recurring song (**Em→C first song**),
- local save + reopen proof,
- basic Path B loop/wait behavior.

## Branch-safe task list

### W1-E1 — Reusable world lesson runner
**Status:** Ready now
**Primary goal:** Build one reusable lesson runner inside the existing World 1 flow so lessons can be plugged in without hand-wiring each one.
**Primary files/surfaces:**
- `07-app/godot/**`
- `07-app/core/world-view-tracker.js`
- any minimal world-to-lesson bridge file created for this runner
**Do not touch:** lesson content, song choice logic, proof scripts
**Proof:** runner can load a lesson step in the existing world shell
**Dependency:** none

### W1-E2 — Lessons 1–5 script pack
**Status:** Ready now
**Primary goal:** Finalize the first 5 lesson scripts and make them compatible with the reusable runner.
**Primary files/surfaces:**
- `05-content/guitar-lesson-01-welcome-anatomy-tuning.json`
- `05-content/guitar-lesson-02-holding-the-pick.json`
- `05-content/guitar-lesson-03-first-chord-em.json`
- `05-content/guitar-lesson-04-second-chord-first-song.json`
- `05-content/guitar-lesson-05-strumming-in-time.json`
- matching shipped lesson copies under `07-app/content/lessons/`
**Do not touch:** Godot world scaffolding, duet engine, proof harness
**Proof:** all 5 lessons load with the runner contract and preserve the intended 5-lesson arc
**Dependency:** can begin in parallel with W1-E1, then finish against the runner contract

### W1-E3 — Sage voice and copy wiring
**Status:** Blocked by W1-E1 and W1-E2
**Primary goal:** Put Sage's welcome, coaching, encouragement, and transition lines into the 5-lesson slice.
**Primary files/surfaces:**
- `07-app/core/sageCoach.js`
- `07-app/core/teacher.js`
- `07-app/core/messages.js`
- `07-app/audio/` and any voice assets used for proof
**Do not touch:** recurring song logic, band behavior, gate scripts unless needed for a direct proof fix
**Proof:** Sage appears in the 5-lesson flow with the right tone and the lines trigger in the right places
**Dependency:** W1-E1 and W1-E2

### W1-E4 — First porch performance and basic Path B duet
**Status:** Blocked by W1-E2 and W1-E3
**Primary goal:** Add the first porch performance using the same recurring song and basic Path B loop/wait behavior.
**Primary files/surfaces:**
- `07-app/core/jamSession.js`
- `07-app/core/band-engine.js`
- `07-app/core/celebration.js`
- recurring-song definition file for the **Em→C first song**
**Do not touch:** unrelated lesson files, long-range cross-device sync work
**Proof:** the porch performance runs, the accompaniment loops/waits, and the student is not punished for falling behind
**Dependency:** W1-E2 and W1-E3

### W1-E5 — Proof pack and phone verification
**Status:** Blocked by W1-E1, W1-E2, W1-E3, W1-E4
**Primary goal:** Produce the required done-proof bundle for the whole first slice.
**Primary files/surfaces:**
- `07-app/test/`
- `.scratch/guitarapp-software-factory/system/proof-checklist.md`
- any captured proof artifacts stored under a task-specific proof folder
**Do not touch:** product behavior except for direct verification fixes found during proof
**Proof:**
1. gate output,
2. visible walkthrough proof,
3. reopen/save proof on phone
**Dependency:** all earlier tasks complete

## Execution order

### Parallel wave A
- W1-E1
- W1-E2

### Parallel wave B
- W1-E3

### Parallel wave C
- W1-E4

### Final verification wave
- W1-E5

## Rules for this wave

- One branch per task.
- Separate verifier pass on every task.
- No task is done from prose alone.
- If a task discovers a major student-facing design fork, stop and ask Heidi.
- If a task discovers money spend, legal risk, or real-device human-test dependence, stop and ask Heidi.

## Open choices still outside this board

- Exact Chatterbox built-in voice for Sage.
- Exact lesson ID for Performance Level 2 inside the ratified ~10–12 range.
