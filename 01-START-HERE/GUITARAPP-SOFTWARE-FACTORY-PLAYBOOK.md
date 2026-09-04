# GuitarApp Software Factory Playbook

## What this is

This is the operating manual for building, operating, and managing GuitarApp with a tighter agent system.

It borrows the best part of Michael Shimeles's approach: **a repeatable workflow, reusable skills, isolated task execution, and proof before trust**.[1][3][4]

It is **not** a copy of his exact stack.

For GuitarApp, the right move is:
- keep Hermes as the control layer,
- keep GuitarApp's hard rules in charge,
- make repeated work run through named skills,
- require evidence before anything is called done,
- and keep one clear line between what we are building now and what stays on the roadmap.

---

## The one-sentence rule

**One task, one work area, one proof bundle, one clear closeout.**

That is the system.

---

## The three lanes

Michael's four-beat loop fits inside three bigger lanes for GuitarApp:

1. **Building** — make or change something.
2. **Operating** — keep the system moving every day.
3. **Managing** — decide, approve, and keep the truth straight.

---

## Lane 1: Building

This lane is for code, content, curriculum, teacher scenes, voice, and world-building work.

### The build flow

Every build task follows the same path:

1. **Intake**
   - Write the task in plain language.
   - Name the user-facing result.
   - Name the proof required.

2. **Isolate**
   - One task gets one branch or one isolated work area.
   - Never build on `main`.
   - Never let two agents freely edit the same task surface at once.[4][7]

3. **Build**
   - Keep business decisions in the action layer.
   - Keep reusable mechanics in shared services.[5]
   - Do not let agents invent structure from scratch every time.

4. **Prove**
   - Run the real gate or live check.
   - Capture the actual output, screen, audio transcript, or measured result.[6][8]
   - "The agent said it works" does not count.

5. **Review**
   - Compare the result against the task.
   - Check legal redlines, lesson truth, and user-facing behavior.
   - If it is visible, show before and after.[8]

6. **Close out**
   - Mark the task as one of four states:
     - done
     - blocked
     - waiting on Heidi
     - needs review
   - Save the evidence with the task.

### GuitarApp build rules

These are always live:
- `AGENTS.md` is the top rulebook.
- `02-spec/` amendments and `docs/adr/` hold design truth.
- Disk is truth before prose is truth: if a file or tool is claimed to exist, verify it on disk before trusting a note about it.
- Chord correctness must pass the arithmetic gate.
- Voice and asset choices must stay inside the free, commercial-clean legal floor.
- Path A live duet stays visible on the roadmap, but it does not block a good v1.

### Build roles

Use these as named seats, even if Hermes handles more than one seat in practice:

- **Builder** — makes the change.
- **Verifier** — proves the change with gates or live evidence.
- **Reviewer** — checks scope, truth, and quality.
- **Archivist** — updates the spec, ADR, skill, or task record if the work changed the truth.

Builder and Verifier should be treated as separate passes on **every** task, even simple work.
Speed matters less than honest proof.

---

## Lane 2: Operating

This lane is for keeping the app project healthy every day.

### The operating queues

Every open item belongs in exactly one queue:

- **Ready now** — unblocked and well-defined.
- **In progress** — one active owner, one active branch/work area.
- **Needs proof** — built but not verified.
- **Waiting on Heidi** — needs a decision, approval, or manual test.
- **Blocked** — cannot move because something real is missing.
- **Done** — verified and closed.

### Daily operating rhythm

1. Review the open queues.
2. Pick the highest-value unblocked task.
3. Verify the starting truth before editing.
4. Run the build flow.
5. Attach the proof.
6. Update the queue state.
7. If the task exposed a recurring pattern, turn it into a skill or update an existing skill.

### What operations should track

For GuitarApp, operations should watch these surfaces:
- spec truth vs disk truth,
- ship gates,
- world asset pipeline state,
- voice pipeline state,
- curriculum/content drift,
- student-memory backend state,
- blocked items that need Heidi.

### Operating rule for long-running work

Anything expensive, slow, or easy to fake must leave a trail:
- exact command or script,
- resulting file path or artifact,
- pass/fail output,
- next step.

---

## Lane 3: Managing

This lane is for decisions, approvals, and keeping the whole effort precise.

### Management responsibilities

1. **Choose the slice**
   - Pick one build slice at a time.
   - Do not start five major themes at once.

2. **Lock the truth**
   - Ratify important decisions into an amendment or ADR.
   - Re-sync the pointers when the latest word changes.

3. **Enforce evidence**
   - No green check without real proof.
   - No vague "mostly done."

4. **Control autonomy**
   - Hermes can execute inside the guardrails.
   - Hermes stops only for money spend, legal risk, real-device human testing, or a major student-facing design fork.

5. **Shrink confusion over time**
   - If the same confusion happens twice, it becomes a skill, checklist, or gate.

### The management meeting question set

When deciding what happens next, ask only these:
- What single slice are we trying to finish?
- What does done look like on the screen or in the student's hands?
- What proof will settle it?
- What is blocked by Heidi, and what is not?
- What must be true now, and what can wait?

---

## The GuitarApp factory stack

### A. Truth layer

These files are the control layer for truth:
- `AGENTS.md`
- `01-START-HERE/README.md`
- latest amendment in `02-spec/`
- `docs/adr/`
- `CONTEXT.md`
- `.scratch/` maps and task files

### B. Build layer

This is the work itself:
- `07-app/` for the shipping app
- `06-prototypes/` for proof-first experiments
- `05-content/` for lesson/source content
- `brand-references/` for world references
- `tools/` for gates and checks

### C. Proof layer

Every meaningful change should leave one or more of these:
- gate output,
- screenshot pair,
- transcript,
- generated asset,
- test output,
- task closeout note.

---

## What we build first

The first useful factory version for GuitarApp is **not** a giant autonomous system.

It is this:

1. a clean task map,
2. a clean status system,
3. the same build flow every time,
4. proof attached to every closeout,
5. a clear split between **v1 ships now** and **roadmap later**.

That is enough to make the project much more precise.

---

## The first development arrangement for GuitarApp

Use this order.

### Phase 0 — truth pass

Before building more, verify the live repo state:
- what files are real,
- what gates are real,
- what docs are stale,
- what proposed decisions still need ratification.

### Phase 1 — lock the current product slice

Settle the exact v1 slice:
- World 1 = Emerald Hollow,
- first teacher,
- first performance ladder,
- Path B duet in v1,
- Path A visible on roadmap,
- student memory stays in scope.

### Phase 2 — install the factory rules

Create the local operating system:
- one task template,
- one proof checklist,
- one task-state vocabulary,
- one closeout format,
- one blocker/escalation format.

### Phase 3 — build one full student-facing loop

Pick one end-to-end loop and finish it fully.

Recommended first full loop:
- student opens World 1,
- meets the teacher,
- completes one lesson/practice step,
- receives an encouraging response,
- progress is stored,
- proof shows it all working.

### Phase 4 — add the first performance moment

After the base loop is real:
- add the first low-pressure performance invitation,
- ship Path B accompaniment behavior,
- prove the teacher waits/loops/simplifies instead of punishing the student.

### Phase 5 — expand only after proof

Only after the first loop is proven:
- widen content,
- widen world assets,
- widen song/performance surfaces,
- revisit Path A prototype.

---

## What precision means here

For GuitarApp, precision means:
- the right task is being worked,
- the task lives in the right place,
- the same rules are applied each time,
- the result is proven,
- and the truth files match reality.

It does **not** mean more complex prompting.

---

## Immediate next action

Use the map in `.scratch/guitarapp-software-factory/` as the planning board for this rollout.

That map breaks the development arrangement into decision tickets so we can move one clear step at a time without losing the thread.

---

## Sources

External:
- [1] Podcast: https://youtu.be/blI10_91xgA?is=qG_ZZ5KuT40M4R2b
- [3] Skills repo: https://github.com/michaelshimeles/skills
- [4] Workflow file: https://raw.githubusercontent.com/michaelshimeles/skills/main/AGENTS.md
- [5] Code structure skill: https://raw.githubusercontent.com/michaelshimeles/skills/main/code-structure/SKILL.md
- [6] Evidence-driven testing skill: https://raw.githubusercontent.com/michaelshimeles/skills/main/evidence-driven-testing/SKILL.md
- [7] New-feature skill: https://raw.githubusercontent.com/michaelshimeles/skills/main/new-feature/SKILL.md
- [8] Before-and-after skill: https://raw.githubusercontent.com/michaelshimeles/skills/main/before-and-after/SKILL.md

Internal GuitarApp truth used to personalize this playbook:
- `AGENTS.md`
- `01-START-HERE/README.md`
- `02-spec/guitar-app-spec-AMENDMENT-17.md`
- `docs/adr/0001-always-on-encrypted-sync.md`
- `docs/adr/0002-practice-delivery.md`
- `docs/adr/0004-the-teacher-world-1-emerald-hollow.md`
