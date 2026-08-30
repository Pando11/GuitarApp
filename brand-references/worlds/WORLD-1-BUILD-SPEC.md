# World 1 (Emerald Hollow) — Asset Pipeline BUILD SPEC

**Status:** spec only. Written 2026-08-29 before pod shutdown so the next session can build
without re-deriving anything. NO world assets produced yet (see bottom: "Verified gaps").

**Why this file exists:** The models are downloaded and the world brief is written, but the
*code that turns the brief into assets* does not exist in the repo. This is the missing piece.
Build it per the steps below, then run it on the running pod.

---

## Source of truth (read these first)
- World brief (your directions): `brand-references/worlds/world-brief-emerald-hollow-L1.md`
  — palette lock, cold-open BLOCK 00/01/02, L2–L5 lesson beat, @Sage/@EmeraldHollow/@Student
  locked instances, voice line, animation beats.
- Model/license decisions: `02-spec/MODEL-PIPELINE-DECISIONS.md`
- Wan2.2 research: `02-spec/RESEARCH-wan2.2-i2v.md`
- License gate (already enforced): `07-app/core/asset-job.js` — validates IMAGE + VIDEO model
  choices (FLUX.1[schnell] Apache-2.0 + Wan2.2-I2V Apache-2.0 are the approved set). Chatterbox
  (voice, MIT) is the approved shipping voice per AGENTS.md hard rule 9 — it is NOT in asset-job.js
  (that file gates image/video only); do not expect to find it there.
- RunPod access (how to reach the pod): `brand-references/worlds/RUNPOD-ACCESS.md`

## Where the models live on the pod (verified 2026-08-29)
- Pod `xgcitppkl4lcm9`, network volume `6nvscrbt2s` at `/workspace` (persists across stop/start).
- `flux-schnell/` — COMPLETE (transformer 3 shards, text_encoder, text_encoder_2, vae, ae.safetensors).
- `Wan2.2-I2V-A14B/` — COMPLETE (high_noise_model + low_noise_model 6 shards each, Wan2.1_VAE.pth,
  google/umt5-xxl, T5).

## The pipeline to BUILD (does not exist yet)
A single orchestrator that, given the brief, produces World 1 assets. Suggested shape:

1. **`scripts/world-factory/build-world-1.mjs`** (or `.py` — pick one, Python likely easier for
   torch/transformers on the pod) — the orchestrator. Sequentially calls the three stages below
   and writes outputs to `07-app/assets/worlds/emerald-hollow/`.
2. **Stage 1 — FLUX stills.** For each brief shot (cold-open BLOCK 00/01/02, L2 lesson beat,
   L5 character sheet: @Sage front/back/face, @Student, porch/village/stage locations):
   build a FLUX.1[schnell] prompt = subject + scene + palette hexes + lighting + negative prompt
   (from brief). Paint stills. Output: `assets/worlds/emerald-hollow/stills/*.png`.
   - MUST pass through `asset-job.js` model check (FLUX.1[schnell] only — NOT dev/krea).
3. **Stage 2 — Wan2.2 motion.** For each animated BLOCK (slow dolly-in, pull-out two-shot):
   feed the FLUX still + BLOCK action/lighting as I2V condition. Wan2.2-I2V A14B on the pod.
   Output: `assets/worlds/emerald-hollow/clips/*.mp4` (or frames).
   - Keep SLOW dolly/pan per brief — NOT fast whip-cuts (anti-style warning in skill).
4. **Stage 3 — Chatterbox voice.** From the brief VOICE line: render @Sage lines (kid + adult
   registers) with the built-in MIT voice (NO cloning of a real person). Output:
   `assets/worlds/emerald-hollow/voice/*.wav`. Kokoro-82M is the CPU fallback.
5. **Stage 4 — Godot shell.** Drop stills/clips into `07-app/godot/` scene states; wire
   animation beats (lantern-per-lesson, village wakes, crowd clap) per brief.

## Hard constraints (from the brief + licenses)
- Palette lock: use ONLY the 7 hexes in the brief. Warm-lantern is the only contrast. No neon/vibrant.
- Negative prompt MANDATORY on every FLUX/Wan call (see brief L4/L5 negative list).
- @Sage / @EmeraldHollow / @Student are LOCKED instances — identical across every shot & lesson.
  Generate the character sheet ONCE, reuse the reference, never re-describe as a "type."
- Rule 2: @Student is a generic avatar, never the real user's face. No camera, no hand tracking.
- Rule 5: voice lines cite stored numbers, never invent musical opinion.
- All models commercial-clean (Apache-2.0 / MIT) — enforced by asset-job.js.

## Verified gaps (why we are NOT "ready to create the world" yet)
- NO orchestrator script exists in repo (no scripts/world-factory/, no produce/world-factory).
- 07-app/assets/ has only a stale `lessons/` dir — no world output pipeline.
- No FLUX/Wan2.2 runner wired to the pod's `/workspace` model paths.
- Godot world is a code skeleton (World.gd/World.tscn present, no real art).
- 0 AI cinematic assets produced to date.

## Status update — 2026-08-30 session
Stage 1 dry-run is now **PROVEN WORKING** (was blocked by two bugs, both fixed):
- BUG FIX 1: `enable_model_cpu_offload()` DEADLOCKS on torch 2.8 cu128 + Blackwell
  (pipe() hung at 0% GPU). Switched to `enable_sequential_cpu_offload()` — renders
  768x448 in ~92s, peak VRAM ~370MiB. Placing FLUX fully on GPU OOMs at ~23.4GiB, so
  offload is required, not optional.
- BUG FIX 2: palette lock was NOT enforced by prompt alone (FLUX emitted bright-pink
  flowers, orange guitar, bright lantern). Added `quantize_to_palette()` which snaps every
  pixel to the nearest of the 7 brief hexes — VERIFIED 100% palette coverage, 0 outside.
- A full Stage-1 run (`--stage 1`, all 4 shots: sage_porch / coldopen_walk / twoshot /
  sage_charsheet) completed on the pod with JOB_DONE and wrote a 4-shot manifest + `.palette.png`
  for each. 1 still (sage_porch, 768x448 dry-run) is pulled back locally and verified compliant;
  the other 3 + full-res versions were stranded when the pod container went DOWN
  (Jupyter proxy 404 / control-plane 403) and are in ephemeral /tmp — recoverable only after a
  pod STOP->START cycle.
- Stages 2-4 (Wan2.2 / Chatterbox / Godot) remain SCAFFOLDS — NOT built this session.

## Build order for next session
1. Write `scripts/world-factory/build-world-1.*` (orchestrator) + per-stage modules.
2. Start pod (see RUNPOD-ACCESS.md), confirm `/workspace` models present.
3. Dry-run Stage 1 on ONE still (e.g. @Sage porch beat) → eyeball palette/negative compliance.
4. Expand to all brief shots; run Stages 2–4.
5. Land outputs in `07-app/assets/worlds/emerald-hollow/`; wire Godot; re-run asset-job.js gate.
6. Commit. Update GAP-REGISTER "0 produced" → count produced.

## Pod state note
Pod was RUNNING at spec-write time (~$0.57/hr). Intentionally STOPPED after this spec was
committed — models are safe on volume `6nvscrbt2s`. Restart via RUNPOD-ACCESS.md when building.
