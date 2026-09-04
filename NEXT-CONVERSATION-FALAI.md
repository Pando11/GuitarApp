# NEXT CONVERSATION — Build World 1 (Emerald Hollow) via fal.ai

**Owner:** Heidi Hendrickson · **Builder:** Hermes · **Date:** 2026-08-30 (PM)
**Status:** fal.ai API key RECEIVED + TESTED 2026-08-30 (HTTP 200 image gen). Ready to build Stage 1.

## TL;DR (read this first)
RunPod is **dead tonight** for one concrete reason: the pod's EU-RO-1 host has no free GPU
(HTTP 400 on every `start`), and EU-RO-1 has **zero capacity on every GPU type** with the
volume attached (real `SUPPLY_CONSTRAINT`). The volume `6nvscrbt2s` is **region-locked to
EU-RO-1**, so a fresh pod there also can't be placed. Decision: switch to **fal.ai** (managed
FLUX + Wan API — no pod, no 30 GB download, no capacity gambling). Heidi is creating a fal.ai
account and will paste the `fk-...` key to start the build.

## What was DECIDED this conversation
- **GuitarApp needs GPU, not CPU.** FLUX + Wan are GPU workloads (12B + video). The earlier
  "cloud CPU" framing was wrong; corrected.
- **FLUX.1[schnell] only** (Apache-2.0, commercial OK). `FLUX.1-dev` is non-commercial → banned
  by AMENDMENT-07.
- **Wan 2.2** (Apache-2.0) — use **image-to-video (I2V)**: feed a FLUX still as the first frame.
- **fal.ai chosen** over RunPod because RunPod can't get a GPU in EU-RO-1 right now. Cost ~$0.003/
  image + ~$0.05/video-second; full world ≈ **under $1**.
- **Replicate = fallback** if fal.ai has no Wan I2V (same models, ~$0.003/image).
- The world must be **Emerald Hollow**, teacher **@Sage**, locked palette (7 hexes), locked
  instances `@Sage` / `@EmeraldHollow` / `@Student`. Source of truth files below.

## VERIFIED facts (do NOT re-derive — confirmed live this session)
- RunPod `RUNPOD_API_KEY` is **valid** (control-plane GET → HTTP 200). "Signed out" was the pod
  UI session, NOT the key.
- Pod `xgcitppkl4lcm9` (RTX PRO 4000 Blackwell 24GB, EU-RO-1, ~$0.57/hr) → `start` = HTTP 400.
- Volume `6nvscrbt2s` holds `flux-schnell/` + `Wan2.2-I2V-A14B/` (both COMPLETE) — region-locked
  EU-RO-1. Models stay safe; pod left EXITED ($0).
- Repo's `scripts/world-factory/relocate_pod.py` has a **WRONG API SCHEMA** (422) — never
  validated against live RunPod. Fix before trusting RunPod as a fallback.
- Jupyter proxy port is **DYNAMIC** — resolve at runtime, never hard-code.

## fal.ai ACCOUNT SETUP (Heidi's step — already in progress)
1. https://fal.ai → Sign up (email or GitHub).
2. Dashboard → API Keys → Create key (starts `fk-...`).
3. Paste the key in chat. (No key on disk yet — `.env` has only RunPod vars.)

## BUILD PLAN (full version in `fal.md` + `FAL-AI-WORLD1-PLAN.md`)
**Phase A — Setup & prove:** A1 add `FAL_KEY` to `.env`; A2 test call `fal-ai/flux/schnell`
→ image URL; A3 confirm fal **Wan I2V** model id (Apache-2.0) before building.
**Phase B — Stage 1 stills:** `fal_stage1.py` per shot → palettelock to 7 hexes → verify by
pixel count → `07-app/assets/worlds/emerald-hollow/stills/`.
**Phase C — Stage 2 video:** `fal_stage2.py` still→Wan I2V (slow dolly/pull-out + neg prompt,
async queue) → `07-app/assets/worlds/emerald-hollow/clips/`.
**Phase D — Land & gate:** run `07-app/core/asset-job.js` (Apache-2.0 → PASS); update
GAP-REGISTER "0 produced" → real counts; report file list + palette proof.

## Source-of-truth files (read before acting)
- Brief: `brand-references/worlds/world-brief-emerald-hollow-L1.md`
- Build spec (shot list, gaps): `brand-references/worlds/WORLD-1-BUILD-SPEC.md`
- RunPod access (fallback): `brand-references/worlds/RUNPOD-ACCESS.md`
- License gate: `07-app/core/asset-job.js`
- Plan: `fal.md`, `FAL-AI-WORLD1-PLAN.md`
- AGENTS.md hard rules (AMENDMENT-07 schnell-only; AMENDMENT-06 photoreal OK; palette lock).

## FIRST ACTION when the key arrives
Run Phase A2 test call. Do NOT write generation scripts until A3 confirms the Wan I2V model id.
If fal lacks Wan I2V → switch to Replicate, same plan.

## Open unknowns to re-check
- Exact fal Wan I2V model id (unconfirmed).
- Video motion/easing params on fal (may need 1–2 tuning passes).
- Whether Heidi wants Stage 3 (Chatterbox voice) now or deferred.
