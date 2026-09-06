Type: research
Status: resolved
Blocked by:

## Question

`07-app/godot/` exists on disk (verified 2026-08-24) but the subdirectories (FingeringOverlay, LessonScene, World) appear empty on a surface listing. AMENDMENT-09 + ADR-0004 say the scaffold should have `project.godot` + World/LessonScene/FingeringOverlay scenes (MIT) as the production vehicle. Before we plan the first Godot scene, verify what's actually in the scaffold on this machine — does it match what the spec says, or did the scaffold contents not survive the transfer?

Specifically: read `07-app/godot/project.godot` if it exists; list the contents of FingeringOverlay/, LessonScene/, World/ in full; check for `scene/` files, `.gd` scripts, any `.tscn`/`.scn` scenes. Compare against what ADR-0004 §Production vehicle + the Godot scaffold bullet describe.

If the scaffold is empty or partial, that's a blocker for the world-factory pipeline ticket (08) — we can't drop FLUX stills into a Godot scene that doesn't exist. The resolution either confirms the scaffold is ready, or flags "scaffold needs to be restored/recreated" as a blocker before 08 can proceed.

**Dependencies:** Feeds 08. Independent of the grilling tickets (02, 03, 05, 07).

## Answer

**Verdict: scaffold is present and wired — not empty, not partial. The surface probe that spawned this ticket was misleading.**

### What's actually on disk (2026-08-26, `ls -laR 07-app/godot/`)

```
07-app/godot/
  project.godot            # ✅ exists — 29 lines, Godot 4 config, main_scene=res://world/World.tscn
  README.md                # ✅ exists — full scaffold doc (AMENDMENT-09)
  data/
    lesson_manifest.json   # ✅ 1 lesson placeholder (L01-open-c) — data-driven entry point
  FingeringOverlay/        # ⚠️ EMPTY dir (0 files) — top-level decoy
  lesson/                  # ✅ REAL location of FingeringOverlay + LessonScene
    LessonScene.gd         # ✅ 45 lines, loads clip+voice+fingering from lesson JSON
    LessonScene.tscn       # ✅ 14 lines, Node2D + VideoStreamPlayer + FingeringOverlay instance
    FingeringOverlay.gd   # ✅ 10 lines, render(fingering[]) from verified OR AI-drawn data
    FingeringOverlay.tscn # ✅ 10 lines, Control node, anchors preset 15
  LessonScene/             # ⚠️ EMPTY dir (0 files) — top-level decoy
  world/                   # ✅ REAL location of World root
    World.gd               # ✅ 50 lines, reads lesson_manifest.json, instantiate LessonScene on enter
    World.tscn             # ✅ 8 lines, Node2D + Camera2D, script = World.gd
  worlds/
    elderwick-market/      # ✅ concrete world instance (not a generic "worlds/" dir)
      world.config.json    # ✅ 50 lines, flux.1-schnell + wan2.2-i2v + chatterbox slots, scaffold_authored
      world.gd             # ✅ 20 lines, WORLD_ID="elderwick-market", attribution hook constant
```

### Comparison vs. what the ticket expected vs. what ADR-0004 / AMENDMENT-09 say

| What the ticket's surface probe expected | What's actually there | Match? |
|---|---|---|
| `FingeringOverlay/` at top level with files | Empty dir; real files are under `lesson/FingeringOverlay.gd` + `.tscn` | **Misleading probe — files exist, just deeper** |
| `LessonScene/` at top level with files | Empty dir; real files are under `lesson/LessonScene.gd` + `.tscn` | **Misleading probe — files exist, just deeper** |
| `World/` at top level with files | Dir is named `world/` (lowercase); World.gd + World.tscn present | **Name case differs, contents present** |
| `scene/` files or `.scn` files | No `.scn` — Godot 4 uses `.tscn` (text scene format). All 3 scenes present as `.tscn` | **Format difference, not missing** |
| `.gd` scripts | 4 `.gd` scripts present: World.gd, LessonScene.gd, FingeringOverlay.gd, elderwick-market/world.gd | ✅ |
| `.tscn`/`.scn` scenes | 3 `.tscn` scenes: World.tscn, LessonScene.tscn, FingeringOverlay.tscn | ✅ |

### ADR-0004 §Production vehicle (line 139–142) — STALE negative statement

ADR-0004 currently says:
> "The Godot scaffold (`project.godot` + World/LessonScene/FingeringOverlay scenes, per AMENDMENT-09) is **NOT present** on this machine as of 2026-08-23 — the full `07-app/godot/` tree did not survive the PC transfer."

**This is now false.** The scaffold IS present and wired. The ADR's negative statement was true as of 2026-08-23 (the PC transfer) but the tree did survive — it was just organized deeper than the naive top-level `ls 07-app/godot/*/` probe expected. The empty `FingeringOverlay/` and `LessonScene/` top-level dirs are decoys; the real files live under `lesson/` and `world/` exactly as the README's layout diagram shows. **ADR-0004 §Production vehicle should be updated from "NOT present" to "present and wired"** — or the negative line should be struck. (This is a prose re-sync task, not a disk-probe finding — flag it, don't silently fix it in the ADR.)

### Is the scaffold ready for ticket 08 (world-factory pipeline)?

**Yes — the scaffold is ready.** The wiring is coherent end-to-end:

```
project.godot (main_scene=World.tscn)
  → world/World.tscn + World.gd (reads lesson_manifest.json, enter_lesson(id))
    → lesson/LessonScene.tscn + LessonScene.gd (plays clip + voice + fingering overlay)
      → lesson/FingeringOverlay.tscn + FingeringOverlay.gd (renders verified/AI-drawn dots)
```

The only thing missing is **asset content** (FLUX stills, Wan motion clips, Chatterbox voice), which is by-design pending cloud-GPU generation — that's ticket 08's job, not a scaffold defect. The scaffold itself is structurally complete: every `.gd` has its matching `.tscn`, every scene references its script via `ExtResource`, `project.godot` points at `World.tscn`, and `World.gd` preloads `LessonScene.tscn` and calls `instantiate()` on lesson select. The `elderwick-market/` concrete world instance is also wired (config + world.gd with WORLD_ID constant + attribution hook documented).

### Bottom line

- **Scaffold state: PRESENT and WIRED.** Not empty, not partial.
- **Root cause of the confusion:** a surface `ls 07-app/godot/FingeringOverlay/` / `ls 07-app/godot/LessonScene/` / `ls 07-app/godot/World/` probe returned empty because those top-level dirs are empty — but the README's layout diagram (and the actual files) put FingeringOverlay + LessonScene under `lesson/` and World under `world/`. The probe asked about the wrong paths.
- **ADR-0004 §Production vehicle has a stale "NOT present" line that should be updated** — flag for prose re-sync, not a disk issue.
- **Ticket 08 is NOT blocked by a missing scaffold.** It's blocked by missing *assets* (FLUX/Wan/Chatterbox output), which is the cloud-GPU generation task, not a scaffold-restore task.
