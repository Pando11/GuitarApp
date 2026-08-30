# Research — Cheapest Cloud GPU for Wan2.1-I2V-14B (GuitarApp motion layer)

**Date:** 2026-08-10 · **Author:** Hermes (live research) · **Owner:** Heidi Hendrickson
**Deliverable for:** next agent standing up the `cloud-gpu-worker` (gated by `07-app/core/asset-job.js:88` → `run === 'cloud-gpu-worker'`).

---

## 0. VERIFIED PREMISE (live, this session)

| Claim | Source | Result |
|---|---|---|
| Motion model = **Wan2.1-I2V** (Apache-2.0) | `02-spec/guitar-app-spec-AMENDMENT-09.md:17`; HF API `Wan-AI/Wan2.1-I2V-14B-480P` `cardData.license`=`apache-2.0` | ✅ commercial-clean |
| Video AssetJobs MUST run on `cloud-gpu-worker` | `07-app/core/asset-job.js:88` (`if (job.run !== 'cloud-gpu-worker') errors.push(...)`) | ✅ hard gate |
| Local GPU too small | Memory: GTX 970 4GB desktop; Acemagic S3A mini-PC = Vega iGPU, **no discrete VRAM** | ✅ both ruled out |
| fp16 weights size | HF `Wan2.1-I2V-14B-480P` `index.json` `metadata.total_size` | **65.58 GB** (confirms 24 GB+ needed for fp16) |

> Note: `web_extract`/`web_search` are **unavailable** in this env (no Firecrawl key). All pricing below is from **live `curl`/API calls or `gh`-style HTTP**, per the handoff hard constraint. RunPod's public price page is JS-rendered → cited as published list price, flagged for live re-verify.

---

## 1. VRAM REALITY (the handoff's "24 GB min" is fp16-only)

Full-precision (fp16/fp8) Wan2.1-I2V-14B-480P needs **≥24 GB** (65.58 GB weights, ~24 GB resident with offload). BUT **GGUF quantization is real and shrinks this dramatically** — verified file sizes from `city96/Wan2.1-I2V-14B-480P-gguf` (77,597 downloads, cardData `license: apache-2.0`):

| Quant | File size (real, HEAD on HF) | Fits on |
|---|---|---|
| **Q4_K_M** | **11.34 GB** | 16 GB card (RTX 4060 Ti 16G, A4000 16G) |
| Q5_K_M | 12.74 GB | 16 GB card |
| Q6_K | 14.23 GB | 16 GB card (tight) |
| Q8_0 | 18.14 GB | 24 GB card |
| F16 | 33.28 GB | 24 GB card w/ offload (or 32 GB+) |

**Implication:** the "24 GB minimum" assumption in the handoff is only true for fp16/fp8. A **16 GB card runs Q4–Q6** with quality trade-off acceptable for stylized lesson-scene drift. However — **the GGUF loader is almost always ComfyUI, which is GPL-3.0 = BLOCKED in this project (AMENDMENT-09 §1)**. License-clean quantized runners:
- **DiffSynth-Studio** (ModelScope) — **Apache-2.0** (confirmed via github API `spdx_id`), supports Wan2.1 **FP8** inference. ✅
- Official `Wan-Video/Wan2.1` `generate.py` — Apache-2.0, supports `--offload_model True --t5_cpu` to cut VRAM (confirmed in repo args). ✅ fp16 path, needs 24 GB.
- **ComfyUI** — GPL-3.0 → **DO NOT USE** in the paid app (license blocklist).

**Recommendation:** default to **24 GB card + official Apache-2.0 fp16 (or DiffSynth FP8)** for quality; 16 GB + Q4/Q6 only as a fallback if a 24 GB slot is unavailable/expensive.

---

## 2. LIVE PRICING TABLE (providers price-checked)

### 2a. Vast.ai — marketplace (LIVE API `console.vast.ai/api/v0/bundles`, 2026-08-10)

Distinct 20 GB+ on-demand offers parsed from 64 live offers:

| GPU (VRAM) | $/hr (low→high seen) | dlperf | Note |
|---|---|---|---|
| RTX 3090 (24 GB) | **$0.016** – $0.29 | 44–140 | cheapest fitting card; spot-like churn |
| RTX 4090 (24 GB) | **$0.136** – $0.54 | 97–310 | faster; ~2–3 min/clip |
| RTX 5090 (32 GB) | $0.34 – $1.34 | 187–646 | overkill for 480P |
| Tesla V100 (32 GB) | **$0.024** – $0.22 | 26–206 | cheapest 32 GB; older arch, slower |
| L40 (48 GB) | $0.13 | 93 | cheap high-VRAM |
| RTX PRO 6000 (96 GB) | $0.74 – $1.20 | 279 | massive overkill |
| H100 (80 GB) | $1.94 – $2.94 | 378–643 | way over-spec |

**Vast takeaway:** RTX 3090 at **$0.016–0.05/hr** is the floor; reliable on-demand 3090 ~$0.14, 4090 ~$0.27. Spot/preemptible fine (re-runnable asset gen).

### 2b. RunPod (Secure Cloud) — published list price (JS-rendered page; VERIFY LIVE before buy)

| GPU | VRAM | Secure Cloud $/hr (published) | Note |
|---|---|---|---|
| RTX 3090 | 24 GB | ~$0.22 | community cheaper |
| RTX 4090 | 24 GB | ~$0.34 | template ecosystem |
| RTX A4000 | 16 GB | ~$0.17 | could run Q4 |
| L40S | 48 GB | ~$0.69 | |
| A100 80G | 80 GB | ~$1.19 | over-spec |

> GraphQL gpus query requires auth (anonymous rejected). Template: `runpod/pytorch` + pip Wan2.1. Stable, predictable, good for a standing worker.

### 2c. Lambda Labs (on-demand) — API now **401 (auth-walled)** as of 2026-08-10

Historically: A10 (24 GB) ~$0.40/hr, 4090 ~$0.40/hr, A100 40G ~$1.10/hr. **Could not pull live** — Lambda moved pricing behind auth. Flag: re-verify if used. Probably not cheapest vs Vast.

### 2d. Massed Compute / Cudo / FluidStack

Pricing pages JS-rendered; no clean parse. Known market: **generally 10–30% below RunPod** for same cards (RTX 4090 ~$0.20–0.28). Unverified live this session → secondary option.

### 2e. Cloudflare R2 + serverless GPU

App already uses Cloudflare Workers (AGENTS.md). Options:
- **Workers AI** does NOT host Wan2.1 (no open video-diffusion model in their catalog) → not viable for the motion layer.
- **R2 = storage only** (cheap egress: first 10 GB/mo free, ~$0.015/GB egress after). Use R2 as the clip sink regardless of compute host.
- Serverless GPU (e.g. Banana/Replicate-style) for Wan2.1: Replicate hosts Wan2.1-I2V at **~$0.05–0.10/run** but ToS may restrict commercial output and it's a black-box SaaS (violates "run OUR weights" spirit). **Not recommended** for the licensed pipeline.

---

## 3. ARCHITECTURE (split roles — decision 2026-08-10, owner-approved)

One box is NOT the backbone. Split by workload shape:

| Role | Workload | Host | Why |
|---|---|---|---|
| **Batch video** | 20-lesson motion-asset gen (60 clips), re-runnable | **Vast.ai RTX 3090 (24 GB), on-demand ~$0.14/hr** (spot floor $0.016) | cheapest fitting card; batch is re-runnable so marketplace churn is acceptable |
| **Standing/live video** | on-demand per-request rendering if the app needs it later | **RunPod Secure Cloud RTX 4090 (~$0.34/hr)** | fixed datacenter, no churn, reliable restart story |
| **Voice** | Chatterbox (~6 GB) / **Kokoro-82M (Apache-2.0, CPU-viable)** | **CPU or a small light instance — NEVER the 24 GB card** | paying $0.14–0.34/hr to idle a 3090 for 6 GB voice is wasteful; Kokoro runs on CPU free |

> **Recommended pick (video):** Vast RTX 3090 for the one-shot 20-lesson batch; RunPod 4090 as the standing worker if live per-request rendering ships. **Voice: offload off the GPU entirely** (Kokoro CPU, or a tiny Vast CPU/GPU instance).

License sanity: hosts just run **our Apache-2.0 / MIT weights** (Wan2.1-I2V, DiffSynth-Studio Apache-2.0 runner, Chatterbox/Kokoro MIT/Apache-2.0). Vast/RunPod/Lambda are raw compute, not SaaS output vendors — their ToS don't forbid commercial use of generated output. ✅

> **Capability note (owner question — can the flagged host do everything?):** Vast is **raw GPU compute**, not a restricted SaaS. You install the models; both Wan2.1-I2V (24 GB) and Chatterbox (6 GB) run on it. So *capability* is never the issue — the only real risk is **marketplace instance churn** for anything live. That's exactly why video is split: batch (re-runnable) on Vast, live on RunPod. Voice doesn't need Vast at all.

---

## 4. 20-LESSON COST MODEL

Assumptions (state them so the next agent can re-tune):
- **20 lessons × 3 clips = 60 clips** (one `lesson_scene` + ambient/promo per lesson; adjust `clips_per_lesson`).
- **480P, 3–4 s clip, fps 24.** Throughput on 24 GB fp16: community benchmark ~2–4 min/clip on RTX 4090; **use 3 min/clip avg** (includes model load + VAE decode). Total compute ≈ **3.0 GPU-hours** for the full set.
- **Voice:** Chatterbox (~6 GB) or **Kokoro-82M on CPU** (free, no GPU). Assume 20 lessons × ~3 min narration = 60 min audio. Kokoro CPU ~real-time → negligible cost; Chatterbox on a tiny GPU instance ~$0.02 total.
- Storage: 60 clips × ~5 MB (480P H.264) ≈ **300 MB → free tier on R2**, egress negligible.

### 4a. Video (split by role)

| Host (24 GB) | $/hr | 20-lesson set | Role |
|---|---|---|---|
| Vast RTX 3090 **spot** ($0.016–0.05) | 0.05 | **~$0.15** | batch, best case, churn risk |
| Vast RTX 3090 **on-demand** ($0.14) | 0.14 | **~$0.42** | **batch — recommended** |
| Vast RTX 4090 on-demand ($0.27) | 0.27 | ~$0.81 | batch, faster |
| RunPod 4090 (~$0.34) | 0.34 | ~$1.02 | **standing/live fallback** |
| Lambda 4090 (~$0.40, unverified) | 0.40 | ~$1.20 | re-verify |

### 4b. Voice (off-GPU)

| Path | Cost | Note |
|---|---|---|
| **Kokoro-82M on CPU** (Apache-2.0) | ~$0 | no GPU; runs on the app server / any CPU |
| Chatterbox on a light GPU instance (~6 GB, e.g. Vast A4000) | ~$0.02 / 20 lessons | only if zero-shot cloning needed |

### 4c. Total
- **Batch everything (Vast video + Kokoro CPU voice): ~$0.42 + $0 ≈ under $0.50** for the full 20-lesson asset set.
- Add standing RunPod video only if live per-request rendering ships (then ~$1–2/mo idle + per-render).

**Bottom line:** generating the entire 20-lesson set — video AND voice — costs **well under $1** (vs. the $400/file business model). GPU burn is a rounding error. The bottleneck is human/asset design time, not compute cost. Voice is essentially free off-GPU.

---

## 5. EXACT NEXT-STEP SETUP (next agent executes)

### Role map
- **Worker VIDEO-BATCH** → Vast RTX 3090, one-shot 20-lesson gen.
- **Worker VIDEO-LIVE** (optional, later) → RunPod 4090, standing.
- **Worker VOICE** → Kokoro-82M on CPU (or tiny Chatterbox GPU instance). Separate, never on the 24 GB card.

### Option A — Vast.ai RTX 3090 (VIDEO-BATCH, recommended)

```bash
# 1. Create Vast account, add SSH key, set VAST_API_KEY.
# 2. Launch an on-demand 3090 offer (24GB, dlperf>=80, rentable):
curl -X POST "https://console.vast.ai/api/v0/asks/$OFFER_ID/accept" \
  -H "Authorization: Bearer $VAST_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"image":"pytorch/pytorch:2.3.1-cuda12.1-cudnn8-devel","onstart_cmd":"pip install huggingface_hub diffusers transformers accelerate")"}'

# 3. SSH in, run the Apache-2.0 pipeline (OFFICIAL repo, not ComfyUI/GPL):
git clone https://github.com/Wan-Video/Wan2.1 && cd Wan2.1
pip install -r requirements.txt
huggingface-cli download Wan-AI/Wan2.1-I2V-14B-480P --local-dir ./weights/i2v-480p

# 4. Generate (license-clean fp16; --offload_model cuts VRAM):
python generate.py --task i2v-14B --size 832*480 --ckpt_dir ./weights/i2v-480p \
  --image <flux-still.png> --prompt "<scene drift>" --offload_model True --t5_cpu

# 5. Ship clip to R2 (cheap sink):
aws s3 cp output.mp4 s3://guitarapp-clips/lessonNN/scene.mp4 --endpoint-url https://<acct>.r2.cloudflarestorage.com
```

### Option B — RunPod (VIDEO-LIVE standing worker, reliable fallback)

```bash
# Use RunPod console: template "PyTorch 2.3", GPU RTX 4090, deploy.
# Same official Wan2.1 steps as Option A. Use for always-on / per-request rendering.
# DiffSynth-Studio (Apache-2.0) is an alternative runner if you want FP8 on a 16 GB card:
#   pip install diffsynth-studio && diffsynth --model Wan2.1-I2V-14B-480P --fp8
```

### Option C — Voice worker (OFF-GPU, separate)

```bash
# Kokoro-82M (Apache-2.0) — runs on CPU, no GPU needed.
pip install kokoro soundfile
python -c "from kokoro import KPipeline; p=KPipeline(lang_code='a'); \
  for _,_,audio in p('<narration text>', voice='af_heart'): soundfile.write('lessonNN.wav', audio, 24000)"

# Only if zero-shot cloning (Chatterbox MIT) is required — use a tiny 6 GB instance, NOT the 24 GB card:
#   pip install chatterbox-tts && python -m chatterbox.tts --text "<text>" --audio_prompt <ref.wav>
```

> Rule: **voice never rides the 24 GB Wan2.1 card.** That card exists only for video.

### Hard guardrails for the worker
- **NEVER ComfyUI** (GPL-3.0, blocked). Use official `Wan-Video/Wan2.1` or DiffSynth-Studio (Apache-2.0).
- **NEVER SVD / LTX / Hunyuan / Midjourney** (license-blocked per AMENDMENT-09 / asset-job.js).
- Output model string must be `wan2.1-i2v` to pass `validateAssetJob` (AMENDMENT-09 §4).
- Run as `run: 'cloud-gpu-worker'` or the job is rejected (`asset-job.js:88`).

---

## 6. OPEN ITEMS / CAVEATS
1. **RunPod & Lambda live prices unverified** (JS-rendered / 401). Re-pull before committing budget.
2. **16 GB + Q4 path** is viable via DiffSynth FP8/GGUF but needs a license-clean GGUF loader verified — ComfyUI is out. Test DiffSynth GGUF support before relying on 16 GB.
3. **Throughput (3 min/clip) is a community estimate**, not measured on our worker. Re-time on first real clip and update §4.
4. **Vast spot churn**: for a one-shot 20-lesson batch, spot is fine; for an ongoing per-lesson worker, use on-demand or RunPod.
