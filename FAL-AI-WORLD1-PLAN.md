# World 1 (Emerald Hollow) — Build Plan via fal.ai

**Owner:** Heidi Hendrickson · **Builder:** Hermes · **Date:** 2026-08-30
**Status:** PLAN — awaiting fal.ai API key from Heidi.

## Why fal.ai (verified)
- Runs **FLUX.1[schnell]** (12B, **Apache-2.0**, commercial OK) and **Wan** video as a managed
  API — no pod, no 30 GB model download, no GPU-capacity gambling.
- Cost: ~**$0.003 / image** (billed per megapixel) + **~$0.05 / video-second**.
- RunPod is BLOCKED tonight: pod `xgcitppkl4lcm9` can't start (host has no free GPU — HTTP 400),
  and EU-RO-1 has **zero capacity on every GPU type** with the volume attached (real
  `SUPPLY_CONSTRAINT`). Volume `6nvscrbt2s` is region-locked to EU-RO-1, so a fresh pod there
  also can't be placed. Switching to fal.ai sidesteps all of it.

## YOUR STEPS (Heidi) — do first, then paste the key
1. Go to **https://fal.ai** → **Sign up** (email or GitHub).
2. Dashboard → **API Keys** → **Create key**. Copy it (starts with `fk-...`).
3. **Paste the key in chat.** That's the only thing I need from you.

## HERMES STEPS — run the moment the key arrives

### Phase A — Setup & prove connectivity
- **A1.** Append `FAL_KEY=<key>` to `Desktop/GuitarApp/.env` (secret-handled, not logged).
- **A2.** One TEST call: `POST https://fal.run/fal-ai/flux/schnell` with a 1-line prompt →
  confirm HTTP 200 + image URL. Proves auth + connectivity + correct header
  (`Authorization: Key <FAL_KEY>` — confirm format on this call, don't assume).
- **A3.** ✅ DONE (2026-08-30): fal **Wan I2V** id is `fal-ai/wan/v2.2-a14b/image-to-video`
  (Apache-2.0, verified: queued + returned a 5.4 MB mp4). Uses ASYNC queue. Stills must be 16:9
  (`landscape_16_9`) or Wan rejects the 4:3 size. Luma is deprecated — do NOT use it.
  Replicate fallback no longer needed (fal has Wan I2V natively).

### Phase B — Stage 1: FLUX stills
- **B1.** Read the brief + spec for the shot list, the **7 palette hexes**, and the locked
  instances (`@Sage`, `@EmeraldHollow`, `@Student`):
  `brand-references/worlds/world-brief-emerald-hollow-L1.md`, `WORLD-1-BUILD-SPEC.md`.
- **B2.** Write `scripts/world-factory/fal_stage1.py` — for each shot: call `fal-ai/flux/schnell`
  (`num_inference_steps=4`, `guidance_scale=0`, size per spec), download the returned image.
- **B3.** **Palette-lock:** reuse `quantize_to_palette()` — snap every pixel to the 7 brief hexes.
  Save to `07-app/assets/worlds/emerald-hollow/stills/`.
- **B4.** **Verify by pixel count** (not by eye): confirm every PNG resolves to exactly the 7 hexes.
  Re-run any shot that drifts.

### Phase C — Stage 2: Wan video
- **C1.** Write `scripts/world-factory/fal_stage2.py` — for each still: call fal Wan **I2V** with
  the still as the first frame + brief motion (slow dolly / pull-out), mandatory negative prompt.
  Use the **async queue** (`/queue/submit` + poll) since video takes longer than images.
- **C2.** Download clips → `07-app/assets/worlds/emerald-hollow/clips/`
  (`B00_walkin.mp4`, `B01_meetsage.mp4`, `B02_twoshot.mp4`, …).

### Phase D — Land & gate
- **D1.** Run `07-app/core/asset-job.js` license gate: FLUX.1[schnell] + Wan both Apache-2.0 → PASS.
- **D2.** Update GAP-REGISTER: "0 produced" → real still/clip counts.
- **D3.** Leave the RunPod pod **EXITED** + volume intact ($0, models safe if we ever return).
  Optionally fix `relocate_pod.py` wrong-API-schema bug so RunPod stays a usable fallback.
- **D4.** Report final file list + sizes + palette-coverage proof.

## Cost estimate
~4 stills + 3 short clips ≈ **under $1** total. fal bills per-megapixel (image) and per-second (video).

## Honest risks
- fal **Wan I2V model id is unconfirmed** — verified in A3 before any commit.
- Exact video motion/easing depends on fal's Wan params; may need 1–2 prompt-tuning passes.
- If fal lacks Wan I2V, Replicate is the drop-in fallback (same models, ~$0.003/image).

## Files touched
- NEW: `scripts/world-factory/fal_stage1.py`, `fal_stage2.py`
- EDIT: `Desktop/GuitarApp/.env` (add `FAL_KEY`)
- OUT: `07-app/assets/worlds/emerald-hollow/stills/*.png`, `…/clips/*.mp4`
- REF: `world-brief-emerald-hollow-L1.md`, `WORLD-1-BUILD-SPEC.md`, `07-app/core/asset-job.js`
