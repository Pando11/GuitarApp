Type: prototype + task
Status: open
Blocked by: (none) — 01 resolved; pipeline install state is now known

## Question

The first generated Emerald Hollow moment: FLUX paints the porch scene (respecting the measured palette — brightness 75–120/255, saturation 0.14–0.33, the dominant + production palette from world-emerald-hollow.md), Wan turns it into slow cinematic motion, Chatterbox gives Sage a voice line, Godot is where the student walks in.

This ticket has two parts:

- **Part A (task):** get the pipeline state clear — what's installed, what needs a cloud GPU, what's the first scene prompt. **01 resolved this:** FLUX (`~/re/flux`), Wan (`~/re/wan`), `assets/`, and `.venv-kokoro` voice stack are all MISSING on this machine — the AI cinematic pipeline has never been executed here. So Part A becomes: rent a cloud GPU (~$0.50 per 20-lesson set, one-time, NOT a subscription) + write the first FLUX prompt + prototype it. Godot scaffold IS present on disk (`07-app/godot/project.godot` + `lesson/` + `world/` + `worlds/elderwick-market/`) but Godot itself isn't on PATH — scaffold can't be opened without the engine installed.
- **Part B (prototype):** the first FLUX prompt draft for the porch scene — eye-level, teacher framed center-right, tavern porch behind, barrels to one side, misty greens behind, lantern glows as lesson starts. The prompt must respect the palette lock. This is a prototype the owner reacts to before any generation. The prompt draft already exists at `.scratch/teacher/t-b1-flux-prompt-draft.md` — it's palette-locked and hand-safe (no hands visible on guitar).

Open sub-questions (for after the install-state ticket clears):

1. First scene = the porch (from ADR-0004 + world-emerald-hollow.md scene composition). Confirm? Or a different first scene?
2. Character: hand-authored Godot rig vs AI stills+motion (FLUX+Wan) vs a mix? ADR-0004 §Open items #4 — this is an owner decision that drives the build approach. (The pipeline produces the *world* stills + motion; the *teacher character* may be a different source.)
3. Voice line: what does Sage say on the porch for the first proof? A greeting? The start of a lesson? A "come learn with me" invitation? The line must cite nothing (it's a greeting, not a musical opinion) and match Sage's chill/warm/encouraging personality.
4. Cloud GPU budget: FLUX + Wan need a rented cloud GPU (~$0.50 per 20-lesson set, one-time generation, NOT a subscription). Is that budget approved for the first proof, or do we start with hand-authored Godot assets and run the pipeline later?

**Dependencies:** 01 resolved — pipeline state is now known (FLUX/Wan/`assets/` MISSING, Godot scaffold present but engine not on PATH). Part B (the prompt draft) can proceed as a prototype in parallel — the prompt is independent of whether the models are installed. The generation itself waits on cloud GPU rental.
