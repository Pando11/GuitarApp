# NEXT CONVERSATION — Build World 1 (Emerald Hollow) assets

**Purpose:** handoff for the next Hermes conversation. The goal is to actually PRODUCE World 1
(Emerald Hollow + Sage) assets by running the FLUX → Wan2.2 → Chatterbox → Godot pipeline.
Everything below is verified as of 2026-08-29.

## Read these three files first (all committed, all current truth)
1. `brand-references/worlds/world-brief-emerald-hollow-L1.md` — owner's directions: palette lock,
   cold-open (BLOCK 00/01/02), L2–L5 lesson beat, @Sage/@EmeraldHollow/@Student locked instances,
   voice line, animation beats.
2. `brand-references/worlds/RUNPOD-ACCESS.md` — exact steps to start the pod + reach Jupyter.
3. `brand-references/worlds/WORLD-1-BUILD-SPEC.md` — what pipeline to build, model paths, verified gaps.

(These are also pointed to from `AGENTS.md` → "World 1 (Emerald Hollow) — where to find everything".)

## Verified state (real, not assumed)
- Pod `xgcitppkl4lcm9` (awkward_scarlet_louse), RTX PRO 4000 24GB, $0.57/hr, EU-RO-1.
- STOPPED at handoff time. Restart via RUNPOD-ACCESS.md before building.
- Models DOWNLOADED + COMPLETE on volume `6nvscrbt2s` @ `/workspace`:
  - `flux-schnell/` (FLUX.1[schnell], Apache-2.0)
  - `Wan2.2-I2V-A14B/` (Wan2.2-I2V, Apache-2.0)
- API host = `api.runpod.io` (NOT api.runpod.dev — 404s). Key in `Desktop/GuitarApp/.env` WORKS.
- License gate `07-app/core/asset-job.js` already approves FLUX.1[schnell] + Wan2.2 + Chatterbox (MIT).

## The missing piece (why not "ready" yet)
There is NO generation pipeline script in the repo. To create the world you must BUILD it:
`scripts/world-factory/build-world-1.*` (orchestrator) + per-stage modules (FLUX stills, Wan2.2
motion, Chatterbox voice, Godot shell). See WORLD-1-BUILD-SPEC.md for the full plan. 0 world
assets produced to date.

## Build order (from BUILD SPEC)
1. Write `scripts/world-factory/build-world-1.*` + per-stage modules.
2. Start pod; confirm `/workspace` models present.
3. Dry-run Stage 1 on ONE still (@Sage porch beat) → eyeball palette + negative-prompt compliance.
4. Expand to all brief shots; run Stages 2–4.
5. Land outputs in `07-app/assets/worlds/emerald-hollow/`; wire Godot; re-run `asset-job.js` gate.
6. Commit. Update "0 produced" count.

## Hard constraints (don't violate — copyright/Rule law, not preference)
- Palette lock: only the 7 hexes in the brief; warm-lantern is the only contrast. No neon/vibrant.
- Negative prompt MANDATORY on every FLUX/Wan call.
- @Sage/@EmeraldHollow/@Student are LOCKED instances — identical across every shot & lesson.
- Rule 2: @Student is a generic avatar, never the real user's face. No camera, no hand tracking.
- Rule 5: voice lines cite stored numbers, never invent musical opinion.
- All models commercial-clean (Apache-2.0 / MIT) — enforced by asset-job.js.

## FIRST ACTION when this conversation starts
1. Read the three files above.
2. Start the pod (RUNPOD-ACCESS.md) and confirm `/workspace/flux-schnell` + `/workspace/Wan2.2-I2V-A14B` exist.
3. Begin writing `scripts/world-factory/build-world-1.*` per the BUILD SPEC.

Owner preference: no preference on Python vs Node for the orchestrator (Python recommended for
torch/transformers on the pod). Confirm with owner only if it matters.
