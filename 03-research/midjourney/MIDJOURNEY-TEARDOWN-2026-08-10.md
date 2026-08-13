# Midjourney Reverse-Engineering — Teardown & License Redline

**Date:** 2026-08-10
**Author:** Hermes (current session)
**Trigger:** Owner: "Also reverse engineer mid-journey."
**Method:** `reverse-engineering-products` skill (3-layer split: content / delivery / platform).
**Verdict up front:** Midjourney is a **closed, non-adoptable** product. There is **no OSS analog to clone** (unlike Flux), and its own ToS **forbids reverse engineering + competitive research**. This doc tears down the *product/UX only* from public sources and maps the *learnable patterns* onto our license-clean OSS stack. **Midjourney is NOT a build target for the GuitarApp** (paid app → copyright law + ToS).

---

## 0. REDLINE — what "reverse engineer" can and cannot mean here

- A literal RE of the **model/weights** is **impossible + contractually forbidden**:
  - The model is **closed-source, closed-weights**. No repo, no model card, no published architecture. (Verified: `gh api orgs/midjourney` → 16 public repos, all upstream OSS libs they fork — JAX/Flax/transformers/flash-attention/SageAttention/xDiT/einops/nanobind — **none is the Midjourney model**.)
  - Midjourney ToS (official `midjourney/docs`, raw `terms-of-service-discord.md`):
    > "You may not use the Services for competitive research. You may not reverse engineer the Services or the Assets."
  - No public API (the beta API is closed to new programmatic use; the ToS also bans third-party automation/scraping).
- So this teardown is a **product/UX teardown from public info** (Wikipedia, ToS, their open repos, observed product behavior) — the *approach*, not the weights. That is the lawful and useful limit.
- **License gate (COPYRIGHT LAW + contract):** In a **paid** app ($12/mo), embedding Midjourney is off the table:
  - You cannot self-host or bake their model in (closed weights, ToS bans RE + competitive use).
  - Paid tiers license *you* to use *your own* outputs commercially, but that is a **content license, not a model license** — it does not let you ship their generator inside your product.
  - Result: **BLOCKED**, same discipline as Rule 9 / AMENDMENT-07's Flux gate. Do not re-litigate this.

---

## 1. CONTENT MODEL — how a generation is represented as data

Source: observed product behavior + ToS (raw). Midjourney has **no JSON schema** — it is prompt + CLI flags.

| Field | Form | Notes |
|---|---|---|
| Prompt | free text | Natural-language + `--no` (negative) |
| Aspect | `--ar W:H` | Multi-aspect (MFA) outputs |
| Stylize | `--s` (0–1000) | Aesthetic strength |
| Chaos | `--c` (0–100) | Variation across the 4-grid |
| Version | `--v N` | v4 / v5 / v5.1 / v6 / v6.1 / v7 |
| Style | `--style raw\|cute\|...` | Flavor switch |
| Character ref | `--cref <url>` + `--cw` | **Consistency mechanic** |
| Style ref | `--sref <url>` | Cross-image style lock |
| Seed | `--seed N` | Reproducibility |

- **Job → 4-image grid** (latent batch), then per-image asset id.
- **Asset** = image URL + job id + seed + params. No lesson/content schema (it is a *generator*, not a teaching product).
- **Ownership (ToS):** "You own all Assets you create with the Services. This does not apply if you fall under the exception [commercial tiers]." MJ retains rights to use your assets for training under some tiers. Irrelevant to us — we cannot adopt the model anyway.

**Takeaway for GuitarApp:** our `AssetJob.conditioning` (structured `characterJsonRef` + `styleAnchor`) is the **legal, schema-driven equivalent** of MJ's `--cref/--sref`. We already out-architect them on the data-model layer.

---

## 2. DELIVERY MODEL — how the user moves through content

Source: Wikipedia (curl) + product behavior.

1. **Discord-first:** `/imagine <prompt>` → bot returns a 4-image grid with **U1–U4** (upscale) + **V1–V4** (variation) buttons.
2. **Web app** (`midjourney.com`) for organize / edit / pan-zoom / redo / editorial remix.
3. **Iteration loop:** imagine → upscale → vary (subtle/strong) → pan/zoom → redo → editor. Tight creative loop.
4. **Consistency:** `--cref` keeps a character/face stable across images — the single most *teacher-relevant* pattern (a consistent instructor look).
5. **NO curriculum / progression / teaching layer.** MJ is a generative tool. It has no lessons, no sequencing, no pedagogy.

**Takeaway for GuitarApp:** steal the *loop* (generate → pick → refine → lock consistency) and the *consistency mechanic*, but we supply the missing layer MJ will never have — **sequenced lessons + verified fingering**. That absence is our moat, not MJ's strength.

---

## 2b. HUGGING FACE SEARCH — are there usable "forks"/clones? (owner follow-up)

Owner asked whether HF has Midjourney forks that "might help." Checked the HF API directly (no key).

- **No official Midjourney org on HF** — `api/models?author=midjourney` → `[]`. You cannot fork a model that was never open.
- **~40 community "midjourney" models exist, but every one is a STYLE MIMIC**, not Midjourney's model. Spot-check of top downloads + their real base/license:
  | Repo | License | Built on | Clean for paid app? |
  |---|---|---|---|
  | strangerzonehf/Flux-Midjourney-Mix2-LoRA | other | **FLUX.1-dev** | ❌ dev = non-commercial (Rule 9) |
  | Keltezaa/midjourney-v6-1-meets-flux-sdxl | cc-by-nc-nd-4.0 | **FLUX.1-dev** | ❌ NC + dev |
  | Jovie/Midjourney | other | **FLUX.1-dev** | ❌ |
  | Muapi/midjourney-mimic | openrail++ | SDXL-base-1.0 | ⚠️ OpenRAIL (NC-style restrictions) |
  | Kvikontent/midjourney-v7 | openrail | SD1.5 | ⚠️ OpenRAIL |
- **Filter for CLEAN license (apache/mit) built on the legal `schnell` base → 0 matches.** Filter for any apache-2.0/mit "midjourney" repo → 0.
- **Conclusion:** HF does **not** have a Midjourney fork, and has **no license-clean Midjourney-look asset** either. The best-looking mimics sit on the already-banned FLUX.1-dev. So "look at HF" does not change the exclusion — there is nothing adoptable there. If the owner wants a Midjourney-*style* teacher look on the legal stack, the correct move is a **Flux-schnell character pipeline (AMENDMENT-07) tuned to a consistent style anchor** — not any HF "midjourney" repo.

## 3. PLATFORM / BUILD — the tech stack (from public signals, not source)

| Signal | Evidence | What it tells us |
|---|---|---|
| Closed latent-diffusion | No repo/model card; Wikipedia "Open-source: No" | Proprietary, no OSS path |
| Trained on Google TPUs | Wikipedia | Heavy closed infra; not reproducible locally |
| v4/v5/v6 "trained from scratch" | Wikipedia (version cadence) | Major version jumps = full retrains |
| Discord bot + web app delivery | Wikipedia + product | They build on Discord + a React-ish web UI |
| Their GitHub = OSS forks | `gh api orgs/midjourney` (16 repos) | They **use** JAX/Flax/transformers/flash-attn/SageAttention — the same open foundations we can use; only the *model* is private |
| No public API | ToS (automation ban) | Cannot embed programmatically |

**Architecture (inferred only — flag as UNVERIFIED):** latent diffusion, likely U-Net/DiT-class, proprietary tokenizer/VAE, multi-aspect training. **Do not assert dims** — the real values live in gated/closed weights; unlike Flux, no paper publishes them. Cite nothing as "verified."

---

## 4. THE GAP = OUR MOAT (skill step 5)

- **MJ's gap (for our use):** closed, non-embeddable, ToS-locked, **no teaching layer**, no commercial-embed license. It is a *generator*, not a *product*.
- **What we steal (legally):** the delivery UX — variation grid, upscale/vary loop, character-consistency (`--cref` → our `characterJsonRef`), stylization control (`--s`/`--style` → our `palette`/`styleAnchor`).
- **What we already have that MJ lacks:** sequenced beginner curriculum, `chord-theory-check.js` verified fingering, license-clean OSS (Flux schnell + TalkingHead/RPM + Chatterbox, or open video candidates). The teacher is a *pedagogy delivery device*, not a prompt playground.

---

## 5. LEGAL SUBSTITUTION (already bound — do not re-decide)

| MJ capability | Legal OSS substitute (binding) | License |
|---|---|---|
| Image generation | **FLUX.1[schnell]** (server-side cloud GPU worker) | Apache-2.0 ✅ |
| Character consistency | `AssetJob.conditioning.characterJsonRef` + `styleAnchor` | — (schema) |
| Talking/video teacher | **TalkingHead (MIT) + RPM** (browser, zero GPU) *or* open video (Wan2.1 / LTX-Video / Mochi) | MIT / Apache-2.0 ✅ |
| Voice | **Chatterbox (MIT)** | MIT ✅ |
| Editing/consistency | **Qwen-Image** (Apache-2.0) | Apache-2.0 ✅ |

See `02-spec/guitar-app-spec-AMENDMENT-07.md` (enforced in `07-app/core/asset-job.js`) + the video HANDOFF (AMENDMENT-09 planned) for the gated pipeline.

---

## 6. ENFORCEMENT (mirrors asset-job.js license gate)

Midjourney is added to the documented blocklist so a future agent cannot "just try MJ":

```js
// 07-app/core/asset-job.js (AMENDMENT-08 addition)
export const BLOCKED_VENDORS = ['midjourney']; // closed-source, ToS forbids RE+competitive research, no commercial-embed license
// Any AssetJob.model referencing a BLOCKED_VENDOR is rejected by validateAssetJob().
```

---

## 7. VERIFICATION

- ✅ Official Midjourney GitHub org enumerated via `gh api orgs/midjourney/repos` — 16 OSS-fork repos, **0 model repos**.
- ✅ ToS clause ("may not reverse engineer… competitive research") pulled from `midjourney/docs` raw `terms-of-service-discord.md`.
- ✅ Wikipedia confirms Discord delivery, Google TPU training, no open-source, no public API.
- ✅ `file://` prototype (`midjourney-teardown.html`) runs in Node DOM mock — 3 layer cards + redline + 5-row legal map render without runtime error.
- ⚠️ Architecture dims are **UNVERIFIED** (closed weights) — flagged, not asserted.

---

## 8. WHAT THIS DOC DOES NOT DO

- Does not recommend adopting Midjourney (legally impossible in a paid app).
- Does not decompile or attempt ToS-forbidden RE — this is a public-info product teardown.
- Does not change the bound OSS stack (AMENDMENT-07 + video HANDOFF stand).
