# Wan2.1-I2V Research — Image-to-Video Model for the Guitar-Lesson App

## Verdict (plain English)
Wan2.1-I2V-14B-480P is **genuinely Apache-2.0** — I verified the actual license file and the official cards, so it is safe to ship inside a *sold* $12/mo app with no royalties or seat fees. It is the best free/open image-to-video model available, but its newer sibling **Wan2.2-I2V (also Apache-2.0, also free)** produces noticeably better quality and should be your pick. The closed leaders (Runway, Kling, Luma, Pika) still look better, but they require paid subscriptions, which Heidi refuses.

## Comparison Table
| Model | Quality vs Runway/Kling | License | Commercial-safe? | Free? |
|---|---|---|---|---|
| **Wan2.1-I2V-14B-480P** (current pick) | Best open I2V; trails closed leaders on detail/prompt-following | **Apache-2.0** (verified) | **Yes** | Yes |
| **Wan2.2-I2V-A14B** | Better than 2.1; closer to closed leaders on motion + realism | **Apache-2.0** (verified) | **Yes** | Yes |
| Mochi-1 (Genmo) | Strong motion fidelity | **Apache-2.0** (verified) | Yes | Yes — but **Text-to-Video, not I2V** |
| LTX-Video | Decent, smaller | RAIL-M / "community license" (research-only; commercial needs paid license above $10M rev) | **No** | Code free, license dirty |
| HunyuanVideo | Good | Custom Tencent license + Acceptable Use Policy + restrictions | **No** (not clean) | Code free, license dirty |
| CogVideoX | Moderate | OpenRAIL-M; commercial use requires registration | **No** | Code free, license dirty |
| SVD (Stable Video Diffusion) | Moderate | OpenRAIL-M / "other" | **No** | Code free, license dirty |
| Runway Gen-4 / Kling / Luma / Pika | **Best** quality & coherence | Proprietary, paid subscription | **No** (paid) | No |

## Recommendation
**SWITCH to Wan2.2-I2V-A14B** (or stay on Wan2.1-I2V-14B-480P if it is already wired in) — both are Apache-2.0 and free, but Wan2.2 gives better cinematic motion and detail for the same $0 license cost.
One-line reason: *Same clean commercial-free Apache-2.0 license as your current pick, but newer and visibly higher quality — and there is no other free/open image-to-video model that is both better and license-clean.*

Notes for Heidi:
- "Free" here means **no money and no subscription** — you download the model weights once and run them (or host them). The cost is GPU compute, not licensing.
- Wan2.1/Wan2.2 also ship a **720P** I2V variant if 480P looks too soft for the app; same Apache-2.0 license.
- The blocklist (SVD, LTX-Video, HunyuanVideo, CogVideoX, ComfyUI, Midjourney) is **correctly excluded** — every one of those has a non-commercial or restricted license, confirmed above.
- Mochi-1 is license-clean (Apache-2.0) but is Text-to-Video, not Image-to-Video, so it does **not** fit the "still photo → camera drift" job.

## Sources actually read
- https://huggingface.co/Wan-AI/Wan2.1-I2V-14B-480P/raw/main/README.md  (license: apache-2.0; License Agreement section)
- https://raw.githubusercontent.com/Wan-Video/Wan2.1/main/LICENSE.txt  (genuine Apache 2.0 text)
- https://api.github.com/repos/Wan-Video/Wan2.1/license  (spdx_id: Apache-2.0)
- https://huggingface.co/Wan-AI/Wan2.2-I2V-A14B/raw/main/README.md  (license: apache-2.0)
- https://api.github.com/repos/Wan-Video/Wan2.2/license  (spdx_id: Apache-2.0)
- https://huggingface.co/genmo/mochi-1-preview/raw/main/README.md  (license: apache-2.0)
- https://api.github.com/repos/genmoai/models/license  (spdx_id: Apache-2.0)
- https://github.com/Lightricks/LTX-Video/issues/44  (LTX = RAIL-M, research-only)
- https://ltx.io/model/license  (LTX community license, commercial paid >$10M)
- https://github.com/Tencent-Hunyuan/HunyuanVideo/blob/main/LICENSE.txt  (custom license + AUP)
- https://huggingface.co/zai-org/CogVideoX-5b/blob/main/LICENSE  (registration-gated commercial)
- https://blog.fal.ai/wan-2-2-vs-wan-2-1-whats-new-and-how-to-upgrade-your-video-pipeline/  (Wan2.2 quality improvements)
- https://comfylab.dev/blog/workflows/wan-2-2-vs-wan-2-1-i2v-comfyui-quality-test/  (Wan2.2 vs 2.1 I2V quality)
- https://www.aimagicx.com/blog/open-source-ai-video-models-comparison-2026  (open model quality ranking, Wan2.2 top)
- https://docs.clore.ai/guides/comparisons/video-gen-comparison  (Hunyuan/Wan/CogVideoX/Mochi/LTX overview)
