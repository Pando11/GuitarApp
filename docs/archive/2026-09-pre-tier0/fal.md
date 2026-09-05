# fal.ai — GuitarApp World Build (research + plan)

**Owner:** Heidi Hendrickson · **Builder:** Hermes · **Date:** 2026-08-30

## Why fal.ai (verified by live research)
- Runs **FLUX.1[schnell]** (12B, **Apache-2.0**, commercial OK) and **Wan** video as a managed
  API — no pod, no 30 GB model download, no GPU-capacity gambling.
- Cost: ~**$0.003 / image** (billed per megapixel) + **~$0.05 / video-second**.
- RunPod is BLOCKED tonight: pod `xgcitppkl4lcm9` can't start (host has no free GPU — HTTP 400),
  and EU-RO-1 has **zero capacity on every GPU type** with the volume attached (real
  `SUPPLY_CONSTRAINT` on PRO-4500). Volume `6nvscrbt2s` is region-locked to EU-RO-1, so a fresh
  pod there also can't be placed. fal.ai sidesteps all of it.

## Model requirements (verified from HuggingFace)
- **FLUX.1**: 12B rectified-flow transformer. `FLUX.1-schnell` = **Apache-2.0** (commercial OK).
  `FLUX.1-dev` = **non-commercial** → must use **schnell** for GuitarApp. Smooth run ~24 GB VRAM.
  fal model id: `fal-ai/flux/schnell`. Default params: `num_inference_steps=4`, `guidance_scale=0`,
  size e.g. `landscape_4_3` / `1024x768`. Billed per megapixel.
- **Wan 2.2**: **Apache-2.0**. For GuitarApp use **image-to-video (I2V)** — feed a FLUX still as
  the first frame. **fal Wan I2V id (VERIFIED 2026-08-30):**
  `fal-ai/wan/v2.2-a14b/image-to-video` (and a `/turbo` variant). Older `fal-ai/wan-i2v` = Wan 2.1.
  Luma (`fal-ai/luma-dream-machine`) is DEPRECATED on fal — do not use.
  **CRITICAL:** Wan requires `aspect_ratio` ∈ {16:9, 9:16, 1:1}. A 4:3 FLUX still (1024x768) is
  REJECTED ("resolved output size ... not supported"). → Generate FLUX stills at `landscape_16_9`
  (1024x576) so they feed Wan directly. Wan is ASYNC: POST to `https://queue.fal.run/fal-ai/wan/...`,
  poll `.../requests/<id>/status` until COMPLETED, then GET `.../requests/<id>` for the video URL.
  A test run took ~95s end-to-end and returned a 5.4 MB mp4.

## fal.ai auth
- Sign up at https://fal.ai → Dashboard → API Keys → create key.
- **KEY FORMAT (verified 2026-08-30):** fal.ai keys are a `UUID:hex` string
  (e.g. `19589d68-6dc6-4ef3-8d47-29c50a62ef09:<hex>`), NOT `fk-...`. Don't reject a
  real key just because it lacks the `fk-` prefix.
- Send as header: `Authorization: Key <FAL_KEY>` (verified working format).
- **Key received + tested 2026-08-30:** `POST fal-ai/flux/schnell` returned HTTP 200 + image URL.
- Store in `Desktop/GuitarApp/.env` as `FAL_KEY=<key>` (secret-handled, not logged).

## STEP-BY-STEP PLAN

### YOUR STEPS (Heidi) — first
1. https://fal.ai → Sign up (email or GitHub).
2. Dashboard → API Keys → Create key.
3. Paste the `fk-...` key in chat.

### HERMES STEPS — on key arrival

**Phase A — Setup & prove connectivity**
- A1. Append `FAL_KEY=<key>` to `Desktop/GuitarApp/.env`.
- A2. TEST call: `POST https://fal.run/fal-ai/flux/schnell` → confirm HTTP 200 + image URL.
- A3. Confirm fal **Wan I2V** model id (query model list / dashboard). Must be I2V + Apache-2.0.
  If fal has no Wan I2V, fall back to Replicate.

**Phase B — Stage 1: FLUX stills**
- B1. Read brief + spec: `world-brief-emerald-hollow-L1.md`, `WORLD-1-BUILD-SPEC.md`
  (7 palette hexes, locked instances `@Sage` / `@EmeraldHollow` / `@Student`).
- B2. Write `scripts/world-factory/fal_stage1.py`: per shot → `fal-ai/flux/schnell`.
- B3. Palette-lock: reuse `quantize_to_palette()` — snap every pixel to the 7 hexes.
  Save to `07-app/assets/worlds/emerald-hollow/stills/`.
- B4. Verify by pixel count that every PNG resolves to exactly the 7 hexes; re-run drift.

**Phase C — Stage 2: Wan video**
- C1. Write `scripts/world-factory/fal_stage2.py`: per still → fal Wan **I2V**, still as first
  frame + slow dolly/pull-out motion + mandatory negative prompt. Use async queue
  (`/queue/submit` + poll) — video is slower than images.
- C2. Download clips → `07-app/assets/worlds/emerald-hollow/clips/`
  (`B00_walkin.mp4`, `B01_meetsage.mp4`, `B02_twoshot.mp4`, …).

**Phase D — Land & gate**
- D1. Run `07-app/core/asset-job.js` license gate: FLUX.1[schnell] + Wan → Apache-2.0 → PASS.
- D2. Update GAP-REGISTER: "0 produced" → real counts.
- D3. Leave RunPod pod EXITED + volume intact ($0, models safe). Optionally fix
  `relocate_pod.py` wrong-API-schema bug so RunPod stays a fallback.
- D4. Report final file list + sizes + palette-coverage proof.

## Cost estimate
~4 stills + 3 short clips ≈ **under $1** total (per-megapixel image, per-second video).

## Honest risks
- fal Wan I2V model id unconfirmed → verified in A3 before any commit.
- Video motion/easing depends on fal's Wan params → may need 1–2 prompt-tuning passes.
- If fal lacks Wan I2V → Replicate is the drop-in fallback (same models).

## RunPod state (for reference / fallback)
- Pod `xgcitppkl4lcm9`, RTX PRO 4000 Blackwell 24GB, EU-RO-1, ~$0.57/hr.
- Volume `6nvscrbt2s` (flux-schnell/ + Wan2.2-I2V-A14B/, both COMPLETE) — region-locked EU-RO-1.
- `relocate_pod.py` has a WRONG API SCHEMA (422) — never validated. Fix before reusing RunPod.
- Jupyter proxy port is DYNAMIC — resolve at runtime, never hard-code.
- If Heidi "signed out": re-auth (RUNPOD_API_KEY still valid per live 200 check), then retry
  `POST /v2/pods/<id>/action {"action":"start"}`. If still HTTP 400 → host still full → fal.ai.
