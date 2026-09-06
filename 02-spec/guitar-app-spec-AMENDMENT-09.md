# AMENDMENT-09 — Motion Layer + Story-Engine Backbone (whole-app, not teacher-only)

**Date:** 2026-08-10
**Supersedes:** nothing (additive). Reinforces AMENDMENT-07 (Flux stills), AMENDMENT-08 (Midjourney excluded), Rule 9 (license blocklist = copyright law).
**Source of truth:** this session's reverse-engineering — `gh api` + HF API license checks; Godot/Ink repo inspection; `07-app/core/asset-job.js` (extended gate).
**Vision correction (owner, this session):** "reverse engineer X" = whole-app technique/tooling. The app is a **game-like story-world the student enters**; lessons are embedded in the narrative; the **teacher is one character**, not the product. A single reference video's aesthetic (e.g. medieval village) is the owner's *taste for that example* — **NOT a spec rule**. Do not bake "all lessons must be X-world" into this amendment.

> **UPDATE 2026-08-15 (live 4-agent license+quality research, verified against actual license files):**
> - **Motion model bumped to Wan2.2-I2V** (Apache-2.0, same $0 license as 2.1, visibly better cinematic motion/detail). Wan2.1-I2V stays allowlisted as a fallback; Wan2.2 is the recommended pick. `07-app/core/asset-job.js` `ALLOWED_VIDEO_MODELS` now = `['wan2.1-i2v','wan2.2-i2v']`.
> - **Ink/inkjs correction:** the "inkjs is dead (last push 2022)" claim in §3 is **WRONG** — inkjs is maintained, zero-dependency, runs in all browsers. It may be used *alongside* Godot for branching lesson dialogue (MIT, complements rather than replaces Godot). The Godot pick stands.
> - Full owner one-pager: `02-spec/MODEL-PIPELINE-DECISIONS.md`. Detailed reports: `RESEARCH-godot-engine.md`, `RESEARCH-wan2.2-i2v.md`, `RESEARCH-chatterbox-tts.md`.
> - All four pipeline tools (FLUX.1[schnell], Wan2.2-I2V, Chatterbox, Godot 4.7) confirmed **free + commercial-clean** (Apache-2.0 / MIT). No subscription, royalty, or per-seat fee. Rejected paid leaders: Midjourney (image, sub+commercial-ban), Runway/Kling/Luma/Pika (video, sub), ElevenLabs (voice, sub), Unity (Pro sub), Unreal (5% royalty).

---

## 1. DECISION

The GuitarApp is rebuilt as a **game-like narrative world** (the student enters it; lessons trigger as scenes). Three licensed-clean layers, all verified this session:

| Layer | Choice | License | Verified how |
|---|---|---|---|
| World/character art (still) | **FLUX.1[schnell]** | Apache-2.0 | AMENDMENT-07 (cloned model_cards) |
| **Motion** (still → cinematic drift) | **Wan2.1-I2V** | Apache-2.0 | GitHub API `Wan-Video/Wan2.1` → "Apache License 2.0"; HF `Wan-AI/Wan2.1-I2V-14B-480P` cardData = apache-2.0 |
| **Story shell** (the "game-like" backbone) | **Godot** | MIT | GitHub API `godotengine/godot` → MIT; v4.7.1-stable; exports iOS/Android/Web |
| Teacher voice | Chatterbox | MIT | AMENDMENT-06 |

**Excluded at owner direction + license:** Midjourney (AMENDMENT-08), SVD (LICENSE:other), ComfyUI (GPL-3.0), LTX/Hunyuan/CogVideoX (license "other" → UNVERIFIED, blocked until LICENSE read).

## 2. MOTION LAYER — why Wan2.1-I2V, why not SVD/LTX

- **Wan2.1-I2V (Apache-2.0)** does **image-to-video + text-to-video**, 14B, server-side on cloud GPU. It produces exactly the "slow cinematic camera drift over a painted Flux scene" look from the owner's reference videos. **Commercial-clean — adopted.**
- **SVD** was initially assumed MIT (memory error, corrected this session): HF shows `license:other` (OpenRAIL-M-class). **BLOCKED** in the closed paid app, same class as FLUX dev.
- **LTX-Video / HunyuanVideo / CogVideoX**: HF `license: "other"` → **UNVERIFIED**. Blocked until the actual LICENSE file is read. Not adopted.
- **Runway / Kling / Luma / Pika / Topaz**: closed SaaS. Fine as *upstream studio tools* the owner uses to make assets, but **not embeddable** in the app.

## 3. STORY-ENGINE — Godot chosen over Ink (owner delegated the call)

Both MIT ✅. Deciding factors (real repo inspection):
- **Godot (chosen):** complete 2D/3D engine, **one-click export to iOS + Android + Web**, alive (last push 2026-08-10, 115k★, v4.7.1-stable). It IS the renderer + scene/lesson-trigger system — one backbone, no second engine.
- **Ink (considered, dropped):** story-logic only; emits a JSON narrative graph you must render with *another* engine. Its JS runtime **inkjs is stale (last push 2022, 4★)** — a dead embed dependency for a 2026 app. Would force a second renderer anyway.

**Conclusion:** Godot is the single license-clean backbone that does the whole job. Ink would have left us wiring a renderer on top of a dead JS port.

## 4. ENFORCEMENT (asset-job.js extended)

- `ALLOWED_VIDEO_MODELS = ['wan2.1-i2v']` — any other video model rejected.
- `BLOCKED_VENDORS = ['midjourney']` — closed/ToS-forbidden.
- `STORY_ENGINE = 'godot'`, `STORY_ENGINE_LICENSE = 'MIT'` — documented backbone constant.
- `validateAssetJob` now branches on video purposes (`lesson_scene | promo_clip | ambient_loop`): requires `model ∈ ALLOWED_VIDEO_MODELS`, `run === 'cloud-gpu-worker'`, `fps 8–30`. Verified live: a `wan2.1-i2v` scene job passes; an `svd` job is rejected; a legal `flux.1-schnell` job still passes (no regression).

## 5. PIPELINE (whole app)

```
Flux-schnell (Apache-2.0, cloud)  ──> painted scene still
Wan2.1-I2V (Apache-2.0, cloud)    ──> cinematic motion of that scene
Chatterbox (MIT)                  ──> teacher voice, synced
Godot (MIT)                       ──> wraps scenes into a walkable world; lessons trigger as scenes
                                       (teacher = one character; NOT a medieval-village rule)
chord-theory-check.js             ──> demonstrated fingering overlay (quality gate). NOTE:
                                       AMENDMENT-10 (later, owner override) LIFTED the old
                                       "never AI-drawn" rule — AI may now draw fingering too.
```

## 6. WHAT THIS AMENDMENT DOES / DOES NOT

- DOES: bind the motion layer (Wan2.1-I2V) + story backbone (Godot) for the **whole app**, license-gated and code-enforced.
- DOES NOT: mandate any single world aesthetic (medieval or otherwise) — that is per-lesson art direction via `styleAnchor`, not a global rule.
- DOES NOT: adopt SVD / LTX / Hunyuan / CogVideoX / ComfyUI / Midjourney (blocked or unverified).
- DOES NOT: change AMENDMENT-07 (Flux stills) or AMENDMENT-08 (Midjourney excluded).
