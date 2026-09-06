# AMENDMENT-08 — Midjourney Reverse-Engineering: EXCLUDED (license/ToS/closed-source)

**Date:** 2026-08-10
**Supersedes:** nothing (additive). Reinforces Rule 9 (license blocklist, copyright law), AMENDMENT-07 (bound OSS image stack).
**Source of truth:** `03-research/midjourney/MIDJOURNEY-TEARDOWN-2026-08-10.md` + `midjourney-teardown.html` (prototype).

---

## 1. DECISION

The owner asked to "reverse engineer mid-journey." Result of that work:

- **Midjourney is NOT a build target for the GuitarApp.** It is a closed, closed-weights product with **no OSS analog to clone** (unlike Flux), and its own Terms of Service **expressly forbid reverse engineering and competitive research**.
- This amendment **binds Midjourney as EXCLUDED** so no future agent re-suggests it. The *product/UX* was torn down from public sources; the *model* cannot and will not be adopted.
- The **learnable delivery patterns** (variation grid, upscale/vary loop, character consistency, stylization control) are mapped onto our already-license-clean OSS stack — not onto Midjourney.

## 2. WHY (verified, not opinion)

| Fact | Source | Consequence |
|---|---|---|
| 16 public repos in `github.com/midjourney`, all OSS forks (JAX/Flax/transformers/flash-attn/SageAttention) — **0 model repos** | `gh api orgs/midjourney/repos` (this session) | Nothing to clone; no architecture to read |
| **Hugging Face: no official Midjourney org** (`author=midjourney` → `[]`); ~40 community "midjourney" models are all **style mimics** built on FLUX.1-dev / SDXL / SD1.5 with NC/OpenRAIL/"other" licenses; **0 Apache-2.0/MIT, 0 on the legal schnell base** | HF API (this session) | No fork to adopt; no license-clean Midjourney-look asset exists |
| "You may not use the Services for competitive research. You may not reverse engineer the Services or the Assets." | `midjourney/docs` raw `terms-of-service-discord.md` | Literal RE is contractually prohibited |
| No public API; ToS bans third-party automation | ToS + product state | Cannot embed programmatically |
| Paid tiers license *your* outputs commercially — not a model license | ToS | No path to ship their generator in a paid app |

## 3. LICENSE GATE (COPYRIGHT LAW + contract — survives all amendments)

`midjourney` is added to `07-app/core/asset-job.js` `BLOCKED_VENDORS`. Any `AssetJob` whose `model` references a blocked vendor is rejected by `validateAssetJob()`. This mirrors the Flux gate in AMENDMENT-07.

## 4. LEGAL SUBSTITUTION (binding — unchanged from AMENDMENT-07 + video HANDOFF)

| Need | Legal OSS (allowed) | License |
|---|---|---|
| Teacher/lesson/promo stills | FLUX.1[schnell] (server-side) | Apache-2.0 |
| Character consistency | `AssetJob.conditioning.characterJsonRef` + `styleAnchor` | schema |
| Talking/video teacher | TalkingHead (MIT) + RPM  ·or·  Wan2.1 / LTX-Video / Mochi | MIT / Apache-2.0 |
| Voice | Chatterbox (MIT) | MIT |
| Editing/consistency | Qwen-Image | Apache-2.0 |

## 5. WHAT THIS AMENDMENT DOES

- Excludes Midjourney from the GuitarApp (closed + ToS + no embed license).
- Encodes the exclusion into the asset-job license gate (`BLOCKED_VENDORS = ['midjourney']`), verified live: a `midjourney-v7` job is rejected while a legal `flux.1-schnell` job still passes.
- Maps MJ's UX patterns onto the bound OSS stack.
- Records the HF result (no fork, no license-clean mimic) so the question is closed.
- Does **not** change AMENDMENT-07 or the video HANDOFF (AMENDMENT-09 planned there).

## 6. OPEN ITEM RESOLVED

README §7 note: Midjourney reverse-engineering requested + **excluded** (license/ToS/closed-source). The video-model reverse-engineering from the HANDOFF remains AMENDMENT-09 (renumbered to avoid collision with this amendment).
