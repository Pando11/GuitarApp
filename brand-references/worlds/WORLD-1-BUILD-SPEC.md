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

## Status update — 2026-08-30 session (fal.ai build, DONE)
RunPod was abandoned (EU-RO-1 GPU supply constraint). World 1 assets were generated
via **fal.ai managed API** instead (key in `.env` as FAL_KEY). The old on-pod torch
scripts (build-world-1.py, stage2_wan.py) are SUPERSEDED by:
  - `scripts/world-factory/fal_common.py`  (auth, FLUX + Wan I2V calls, 7-hex palette lock)
  - `scripts/world-factory/fal_stage1.py`  (4 stills)
  - `scripts/world-factory/fal_stage2.py`  (3 Wan2.2-I2V clips)
Verified live: fal-ai/flux/schnell (HTTP 200), fal-ai/wan/v2.2-a14b/image-to-video
(async queue -> mp4). Wan REQUIRES 16:9 (rejects 4:3) — stills generated at landscape_16_9.

PRODUCED (real, on disk, under 07-app/assets/worlds/emerald-hollow/):
  stills/  sage_porch.palette.png, coldopen_walk.palette.png, twoshot.palette.png,
           sage_charsheet.palette.png  (+ raw .png) — all 100% palette-locked (off_palette=0)
  clips/   B00_walkin.mp4 (4.0MB), B01_meetsage.mp4 (2.9MB), B02_twoshot.mp4 (3.8MB)
           — 1280x720, 81 frames, 16fps, ~5.0s each; motion verified (frame diff > 0)
  manifest.json in each dir records model + palette coverage + license tags.
License gate (07-app/core/asset-job.js): flux.1-schnell + wan2.2-i2v -> BOTH PASS.
Cost: ~4 stills + 3 short clips ≈ well under $1 (fal per-megapixel + per-second).

KNOWN TRADE-OFFS (honest, not blockers):
  - Palette-lock snaps every pixel to 7 flat hexes -> smooth FLUX gradients become
    posterized/blocky (by design, per brief mandate). Skin reads "painted".
  - FLUX schnell @ 4 steps -> hands slightly clumpy (inherent); acceptable for stylized world.
  - sage_charsheet came out mostly misty-blue-grey (the "plain grey bg" got absorbed into
    the palette). A cleaner char sheet needs a dedicated neutral-hex pass — deferred.
  - Wan upsized 16:9 input to 1280x720 automatically.

REMAINING (not yet built this session): Stage 3 Chatterbox voice, Stage 4 Godot wiring.
The dry-run-only Stage-1 outputs stranded on the pod (2026-08-29) are obsolete; replaced
by these fal.ai assets.

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
