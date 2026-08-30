# AMENDMENT-07 — Flux Reverse-Engineering → GuitarApp Asset Pipeline (binding)

**Date:** 2026-08-10
**Supersedes:** nothing (additive). Reinforces Amendment 03 §8, Amendment 06 (avatar/voice unlock), Rule 9 (license blocklist).
**Source of truth for this amendment:** reverse-engineering of `black-forest-labs/flux` (cloned) + `huggingface/diffusers` `FluxTransformer2DModel` (public, ungated) + paper Esser et al. 2403.03206. Findings in `C:\Users\The Yoda Trader\re\FLUX-TO-GUITARAPP.md` and `re/flux-dims/CLOSEOUT.md`.

---

## 1. DECISION

The GuitarApp teacher-art + avatar pipeline is built on the **reverse-engineered Flux architecture**, used *appropriately*:

- **Flux (schnell, Apache-2.0) = the ONLY image generator for teacher stills / lesson thumbnails / promo art.** It runs **server-side on a cloud GPU worker** (the 12B transformer cannot fit the GTX 970 4GB; per env notes, GPU-heavy work → rented cloud GPU only).
- **TalkingHead (MIT) + Ready Player Me (RPM)** animate the Flux still **browser-side, zero GPU** — this is the actual "video."
- **Chatterbox (MIT) = voice** (Rule 9). Flux is image-only and irrelevant to voice.
- **Demonstrated fingering** (AMENDMENT-06) is driven from `chord-theory-check.js` verified data, **never AI-drawn** — Flux/AI image models never generate fingers or fretboards.

## 2. LICENSE GATE (COPYRIGHT LAW — owner cannot lift; survives AMENDMENT-06)

From the cloned `model_cards/`: `FLUX.1 [dev]`, `kontext-dev`, `krea-dev`, `flux-dev-fill`, `redux` are **non-commercial**. Only **`FLUX.1 [schnell]` is Apache-2.0**. In a **paid** app ($12/mo), the rule is absolute:

| Need | Allowed (Apache-2.0) | BLOCKED (non-commercial) → fallback |
|---|---|---|
| Teacher/lesson/promo stills | **FLUX.1 [schnell]** | dev/krea blocked → use schnell |
| Character-consistent editing | — | kontext blocked → **Qwen-Image (Apache-2.0)** |
| Inpainting (swap bg/guitar) | — | fill blocked → Qwen-Image / compositing |
| Image→prompt | — | redux blocked → authored prompts |
| Talking avatar / video | — | Flux is static → TalkingHead + RPM |
| Voice | — | Flux n/a → **Chatterbox (MIT)** |

**Enforcement:** a schema validator (`07-app/core/asset-job.schema.json` + `asset-job.js`) rejects any `AssetJob` whose `model` is not on the allowlist. This is a hard ship gate, exactly like `chord-theory-check.js`.

## 3. ARCHITECTURE (source-verified, not README claims)

Flux architecture confirmed across 3 independent sources (BFL repo, diffusers, paper):

| Param | Value |
|---|---|
| in/out channels | 64 (16 latent × 4 patch) |
| double blocks (MM-DiT) | 19 |
| single blocks | 38 |
| attention heads | 24 |
| attention_head_dim | 128 → inner_dim 3072 |
| joint_attention_dim (T5-XXL) | 4096 → projected to 3072 |
| pooled_projection_dim (CLIP-L) | 768 |
| guidance_embeds | False (schnell) / True (dev) |
| axes_dims_rope | (16, 56, 56) |

**Why this matters for the app:** the dual-conditioning (CLIP global + T5 sequence) is the pattern we adopt for **structured teacher conditioning** — condition image gen on a *structured character JSON* (not free text) so teacher art stays consistent across lessons. The `guidance_embeds=False` + 1–4 step LADD property of schnell is what makes server-side gen **low-latency/low-cost** enough for an app.

## 4. ASSETJOB SCHEMA (data-driven, mirrors teacher.js invariant)

Every generated asset is described by an `AssetJob` JSON — the same config-driven discipline Flux uses (checkpoint ← config). Required fields:

```
AssetJob = {
  id, teacherId,                   // links to teacher (cosmetic only)
  purpose: "teacher_still"|"lesson_thumb"|"promo",
  model: "flux.1-schnell",         // allowlist ONLY; see §2
  fallbackModel: "qwen-image",     // for editing/consistency needs
  t5MaxLength: 256,                // schnell = 256 (dev=512, fill=128)
  steps: 4,                        // schnell 1–4; dev=50
  shift: false,                    // schnell=false
  guidance: 0.0,                   // schnell guidance-distilled
  conditioning: {                  // structured, not free text
    characterJsonRef: "content/teachers/T1.json",
    skin: "rig-A", palette: {...}, pose: "half-body-bust",
    styleAnchor: "consistent-teacher-art-v1"
  },
  run: "cloud-gpu-worker",         // never on-device
  output: "assets/teachers/T1.png" // flux still → TalkingHead/RPM source
}
```

Validator (`asset-job.js`) enforces: `model ∈ {flux.1-schnell, qwen-image}`, `teacherId` present, `run === "cloud-gpu-worker"`, and that the referenced teacher file contains **no FORBIDDEN lesson-content keys** (reuses teacher.js invariant). Fails the build otherwise.

## 5. PIPELINE (correct-by-construction)

```
AssetJob (JSON)
   └─> cloud GPU worker: FLUX.1[schnell] (Apache-2.0) txt2img
        └─> teacher still .png  ──> TalkingHead/RPM texture (browser, zero GPU)
                                       └─> animated talking teacher (the "video")
        └─> (editing/consistency) Qwen-Image (Apache-2.0) if needed
Chatterbox (MIT) ──> voice track, synced to TalkingHead
chord-theory-check.js ──> demonstrated fingering overlay (NEVER AI-drawn)
```

## 6. OPEN ITEMS RESOLVED

- README §7 #2 ("Teacher character art still needed… FLUX.1[schnell]/Qwen-Image per Amdt 03 §8") → **RESOLVED by this amendment**: the model choice is now bound, license-gated, and schema-enforced.
- README §7 #6 (E: "re-verify FLUX.1[schnell]/Qwen-Image still Apache-2.0") → **DONE**: schnell = Apache-2.0 confirmed from cloned `model_cards/FLUX.1-schnell.md`; Qwen-Image Apache-2.0 per existing Stack note.

## 7. WHAT THIS AMENDMENT DOES NOT DO

- Does **not** add Flux to voice (Chatterbox only).
- Does **not** use dev/kontext/fill/redux/krea anywhere in the paid build (illegal).
- Does **not** let AI draw fingers/fretboards (AMENDMENT-05 §8). (The "Rule 7" citation here is stale — Rule 7 was deleted 2026-08-16; AI-drawn fingering is now governed by AMENDMENT-10, which permits it subject to the chord-theory-check arithmetic gate.)
- Does **not** change the teacher.js hard invariant (teacher = cosmetic; FORBIDDEN_TEACHER_KEYS unchanged). The `AssetJob` references a teacher but may not embed lesson content.
