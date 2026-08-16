# Model & Asset Pipeline — VERIFIED CHOICES (2026-08-15)

**Owner one-pager.** Read this the moment the Acemagic S3A + 16GB RAM + 512GB SSD arrive.
These four free tools generate the "cinematic old-village guitar lesson" content. ALL FOUR are
**free and commercial-clean** (no subscription, no royalty, no per-seat fee) — verified against the
*actual license files* on 2026-08-15, not blog summaries.

## The four pieces (what each does + verdict)

| # | Tool | Job | Runs on | License | Verdict |
|---|------|-----|---------|---------|---------|
| 1 | **FLUX.1[schnell]** | Paints the village / guitarist / student STILLS | cloud GPU | Apache-2.0 | **KEEP** |
| 2 | **Wan2.2-I2V** (was Wan2.1) | Turns stills into cinematic MOVEMENT | cloud GPU | Apache-2.0 | **UPGRADE to 2.2** |
| 3 | **Chatterbox** | Teacher's VOICE (reads lessons, clones + emotion) | cloud GPU or mini PC (Kokoro = free CPU backup) | MIT | **KEEP** |
| 4 | **Godot 4.7** | The STORY WORLD you walk into | the mini PC | MIT | **KEEP** |

## Quality vs the paid leaders (honest)
- **Image (FLUX) vs Midjourney:** Midjourney prettier, but paid-only + its license bans commercial use.
  FLUX is free + legal. Fix any flatness with an "old village" style prompt + a free LoRA.
  Quality upgrade = **Qwen-Image** (also Apache-2.0, already on the allowlist) — only if FLUX looks too flat.
- **Video (Wan2.2) vs Runway/Kling:** closed leaders slightly better, but subscription. Wan2.2 is the
  best free option.
- **Voice (Chatterbox) vs ElevenLabs:** at/near parity in blind listener tests; ElevenLabs leads only on
  number of languages (irrelevant — English app). No free model beats it.
- **World (Godot) vs Unity/Unreal:** Unity = paid subscription; Unreal = 5% royalty after $1M revenue.
  Godot = free + clean.

## Hardware reality (read before you panic)
The mini PC (S3A, 16GB) has **NO graphics card**, so it CANNOT run FLUX or Wan2.2 (those need a 24GB
cloud GPU). That was always the plan:
- **FLUX + Wan2.2 run on a rented cloud GPU** (~$0.50 for all 20 lessons — see
  `03-research/cloud-gpu-wan2.1.md`).
- **Godot + the app run ON the mini PC.** Chatterbox/Kokoro voice also runs there (or on cloud).
- 16GB RAM + 512GB SSD is plenty for the mini PC's real job.

## What to install on the barebone when the parts arrive
1. An **OS** (Linux is free + works for Godot + the PWA). No OS ships with the barebone.
2. **Godot 4.7.**
3. **Kokoro** (voice backup — already in `.venv-kokoro`).
Then stand up the cloud GPU worker for FLUX + Wan2.2.

## Two legal cautions
- **Never use FLUX.1-dev** — its license forbids paid-app use. We use schnell. (Enforced in `asset-job.js`.)
- **Voice cloning:** MIT lets you clone commercially, BUT cloning a *real person's* voice needs their
  written consent (right-of-publicity, not a license issue).

## Full research (detailed, with sources read)
- `02-spec/RESEARCH-godot-engine.md`
- `02-spec/RESEARCH-wan2.2-i2v.md`
- `02-spec/RESEARCH-chatterbox-tts.md`
