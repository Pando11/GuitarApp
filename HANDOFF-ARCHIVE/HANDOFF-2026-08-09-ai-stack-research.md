# HANDOFF — GuitarApp AI Stack Research (2026-08-09)

Four research agents completed. Verdicts below. **Track 1 (avatars) is IN PROGRESS. Tracks 2-4 are DEFERRED, not cancelled.**

## Hardware reality (checked, not assumed)
- Current desktop: **NVIDIA GTX 970, 4GB VRAM** (2014 Maxwell). Too weak for Chatterbox (6GB), Qwen-Image (12-16GB), Wan 2.2 (24GB).
- Incoming: **Acer mini PC** (model TBD — Heidi to send sticker model no./SNID). Expect integrated graphics, no VRAM. Will be the always-on Hermes host.
- **Governing strategy: SPLIT BY WHERE IT RUNS.**
  - Runs on user's device / always-on box -> must be CPU or browser-based.
  - Authored-once assets -> generate in batches on a RENTED cloud GPU (RunPod/Vast, ~$0.30-0.70/hr; est. $20-40 for the whole first asset library), ship the files.

---

## ⚠️ CORRECTIONS AFTER READING AGENTS.md + AMENDMENT-05 (do not skip)
The research agents did not know the project spec. Three of their recommendations CONFLICT with locked truth:

1. **Ready Player Me / photoreal 3D avatars are WRONG for this app.** AMENDMENT-05 §8 + AGENTS.md
   specify **CARTOON teachers (monsters/creatures/characters), multiple, as SKINS over ONE shared
   skeleton/rig**, rendered with **Lottie (MIT) + native canvas / code-driven fretboard**. Rive was
   dropped 2026-08-04 ($9/mo violates no-subscription rule). TalkingHead's value here is the
   **viseme/lip-sync technique and the audio->mouth-shape driver**, NOT its RPM 3D humans.
   Also: an avatar must NEVER demonstrate fingerings (a rigged cartoon plays perfectly by
   construction and undercuts the promise). Fingerings stay as data-driven 2D fretboard diagrams.
2. **F5-TTS is on the project VOICE BLOCKLIST** (CC-BY-NC) — agent ranked it #3. Do not use.
3. **Piper is GPL-3.0 since Oct 2025**, not MIT as the agent stated, and is blocklisted. Do not use.
   Corrected voice truth (AGENTS.md Rule 9): shipping choice = **OpenAI TTS** (~$0.36 per 200 lesson
   lines). Free hedge = **Kokoro-82M** (Apache-2.0). Also approved: Chatterbox / MeloTTS / StyleTTS2 (MIT).
   ElevenLabs explicitly rejected ($264-$1,188/yr for no benefit). The XTTS-v2 CPML trap the agent
   found was ALREADY known and blocklisted — good corroboration, not new.
4. Existing prior art to build on, NOT restart: `06-prototypes/animated-teacher-demo-v2.html` (20KB).
5. SVG gotcha (AGENTS.md Rule 10): CSS transforms silently fail on SVG `<g>` in some engines —
   use the SVG `transform` ATTRIBUTE and verify with a screenshot; numeric checks pass while nothing moves.

**Net effect on Track 3:** unchanged and now confirmed — spec already names
**FLUX.1[schnell] / Qwen-Image (Apache-2.0)** for images, matching the agent's commercial-safe pick.

---

## TRACK 1 — TALKING AVATARS ✅ IN PROGRESS (scope corrected per above)
**Technique source: TalkingHead (met4citizen)** — 1,464*, **MIT**
https://github.com/met4citizen/TalkingHead
- Browser-based (Three.js + Ready Player Me). **ZERO GPU**, client-side => scales to any user count at zero server cost.
- Real-time visemes. Companion `HeadAudio` does audio-driven visemes = works with ANY TTS stream.
- Companion `HeadTTS` (Kokoro, WebGPU) if we want in-browser voice too.

Runner-up / later: **OpenAvatarChat** (3,695*, Apache-2.0) full ASR+LLM+TTS+avatar WebRTC stack, ~2.2s response, installs via uv. Its **LiteAvatar** handler does 30fps on CPU only.
Photoreal tier (needs A10/4090-class GPU PER concurrent session — hero video only, not in-app): MuseTalk 6,328* MIT.

🚨 AVOID: **Wav2Lip — NO LICENSE FILE** (commercial risk). **Unreal MetaHuman** — EULA forbids export outside Unreal + 5% royalty. **Duix** (8k-14k*) non-OSI community license.

Full report: `C:\Users\The Yoda Trader\talking-avatar-research.md`

---

## TRACK 2 — TTS / ELEVENLABS REPLACEMENT ⏸ DEFERRED
**Pick when GPU exists: Chatterbox (Resemble AI)** — 25.9k*, **MIT on code AND weights** (rare + exactly right for commercial). Zero-shot cloning + emotion control, ~200ms streaming, ~6GB VRAM.
**Pick for CPU-only (i.e. now): Kokoro-82M** — 8.3k*, Apache-2.0, 54 preset voices, CPU-viable, NO cloning.
Hybrid plan: pre-render lesson VO with Chatterbox on rented GPU; Kokoro for live/dynamic lines.

🚨 LICENSE TRAPS (would have poisoned the app):
- **XTTS-v2 / Coqui** — repo says MPL-2.0 but **WEIGHTS ARE CPML = NON-COMMERCIAL**, and Coqui is defunct so no license can be purchased. HARD NO.
- **Fish-Speech / OpenAudio** — NOASSERTION; S1-mini weights CC-BY-NC-SA. NO.
- **IndexTTS-2** — 22.5k* but NOASSERTION license. Do not ship without legal review.
- **Piper** — MIT/CPU but sounds cheap => fails Heidi's quality bar.
Others: Higgs Audio v2 (Apache, most expressive, ~24GB, not a streamer); F7... F5-TTS (15.1k*, MIT code, Emilia CC-BY-NC dataset provenance flag); Orpheus (Apache, best latency, needs WSL2 for vLLM on Windows).

Wiring: Hermes `tts.providers.<name>.command` custom provider + per-persona reference WAVs; run a persistent FastAPI server to avoid 5-10s cold starts. Confirm config key names against the `hermes-agent` skill.
Full report: `C:\Users\The Yoda Trader\tts-research.md`

---

## TRACK 3 — MIDJOURNEY REPLACEMENT (stills + animation) ⏸ DEFERRED
**Commercial-safe stills: Qwen-Image** (8,220*, **Apache-2.0**), 12-16GB via GGUF. Best-in-class text-in-image => good for chord charts / lesson cards / teaser titles.
**Animation: Wan 2.2** (17,036*, **Apache-2.0**), 24GB+ for A14B; 5B TI2V ~8-12GB; Wan 2.1 1.3B fits 8GB. 3-5s clips.
**Pipeline: ComfyUI** (125,409*, GPL-3.0 — Hermes already has a `comfyui` skill) with **SwarmUI** (4,437*, MIT) on top for Midjourney-like UX. Add ComfyUI-Manager + city96/ComfyUI-GGUF (low-VRAM quant loader).

🚨 NON-COMMERCIAL — DO NOT SHIP: **FLUX.1 [dev]** and **FLUX.1 Krea [dev]** (best aesthetics available, Krea explicitly kills the "AI look" — but weights are NON-COMMERCIAL). Commercial-safe FLUX = **FLUX.1 [schnell]** (Apache-2.0, ~MJ v5 class).
Also flagged: HunyuanVideo (Tencent Community License, regional + MAU limits), LTX-Video (rev-capped), SD 3.5 (Stability Community License, paid over ~$1M rev).
Dead ends: Fooocus (unmaintained 2025-12, SDXL-only), A1111 (stagnating), AnimateDiff (dead 2024-07), Mochi-1 (not consumer-viable).

---

## TRACK 4 — REVERSE-ENGINEERING CAPABILITY ⏸ DEFERRED (no target URL yet)
**Truth: no tool does "point at URL -> correct rebuild."** LLM cloners copy pixels and hallucinate the backend. 80% of value is two tools:
- **mitmproxy** (44,622*, MIT) — real API contract. Nothing else gives you this.
- **sourcemapper** (1,433*, BSD-3) — if target leaks `.js.map` (Next.js/Vite often do), recovers ORIGINAL TS/JSX verbatim.
- Fallback if no maps: **webcrack** (2,842*, MIT, deobfuscate) -> **wakaru** (948*, Apache-2.0, unbundle/un-minify).
- Scaffold: **screenshot-to-code** (73,922*, MIT) — ONLY step needing an API key (OpenAI/Anthropic/Gemini). Steps 1-4 are free + local.
- Recon: httpx (10,256*), katana (17,300*), WhatWeb (6,770*), SingleFile (22,119*, AGPL — tool only, don't vendor).

🚨 STALE INTEL CORRECTED: **Wappalyzer went closed-source and its repo was DELETED**; live successor is enthec/webappanalyzer (558*). Ignore npm packages claiming to be official Wappalyzer. **unwebpack-sourcemap is ARCHIVED (2022)** — use sourcemapper.

Pipeline: `httpx/WhatWeb -> katana -> sourcemapper (fallback webcrack+wakaru) -> mitmproxy -> SingleFile -> screenshot-to-code`

---

## NEXT ACTIONS
1. [IN PROGRESS] TalkingHead teacher-avatar prototype (no GPU, no spend, transfers to mini PC untouched).
2. [BLOCKED] Get Acer mini PC model no. from Heidi -> confirm CPU/RAM/graphics. **RAM matters most; 8GB = upgrade or return, 16GB workable, 32GB comfortable.**
3. [LATER] Track 2 TTS: Kokoro CPU now, Chatterbox on rented GPU for pre-rendered VO.
4. [LATER] Track 3: rent cloud GPU, batch-generate teacher art + teaser with Qwen-Image + Wan 2.2.
5. [LATER] Track 4: stand up the RE toolchain when a target URL exists.
