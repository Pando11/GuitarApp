# HANDOFF — 2026-08-09 — AI Stack Research + AMENDMENT-06 (avatar/voice unlock)

**Read this + `02-spec/guitar-app-spec-AMENDMENT-06.md` + `AGENTS.md` to resume cold.**

## [STATE] What shipped this session
- **4 research agents completed** (reverse-engineering, TTS, avatars, image/video). Findings +
  license verdicts consolidated in `HANDOFF-2026-08-09-ai-stack-research.md` (same dir).
  Stars/licenses live-verified via GitHub API 2026-08-09; VRAM figures are model-knowledge (±).
- **AMENDMENT-06 WRITTEN** — `02-spec/guitar-app-spec-AMENDMENT-06.md`. Owner directive, now
  the LATEST WORD, supersedes AMENDMENT-05 §8 + old avatar guardrails.
- **AGENTS.md UPDATED** in 3 places: amendment chain (§ Hard rules 1), voice blocklist (Rule 9),
  product guardrails (cartoon + fingering bans replaced).
- **Hardware verified, not assumed:** desktop GPU = **NVIDIA GTX 970, 4GB VRAM**.

## [CORRECTED PREMISES] — do not re-litigate
1. **Cartoon-teacher mandate is VOID.** It was adopted before any repo research existed —
   ignorance, not a product decision. Realistic/photoreal/3D/cartoon ALL permitted now.
   **TalkingHead (MIT) + Ready Player Me are IN SCOPE.** Target adult students with a
   credible realistic instructor.
2. **Fingering-demonstration ban is VOID.** Avatars MAY demonstrate fingerings. Surviving bar is
   engineering-only: drive the animation FROM verified `chord-theory-check.js` data so hand and
   diagram cannot disagree. "Rigged avatar always plays perfectly" is now an ASSET, not a flaw.
3. **Voice: current app voices rejected by owner as not realistic enough.**
   Shipping target = **Chatterbox (Resemble AI)**, MIT on code AND weights, zero-shot cloning +
   emotion, ~200ms streaming, ~6GB VRAM. This IS the ElevenLabs replacement. Kokoro-82M
   (Apache-2.0, CPU) = no-GPU fallback. OpenAI TTS demoted to permitted stopgap.
4. **License blocklist SURVIVES AMENDMENT-06 — it is copyright law, not preference.**
   Owner explicitly thanked for this; do NOT relax it. XTTS-v2 (CPML non-commercial, Coqui
   defunct = unbuyable), F5-TTS (CC-BY-NC), Fish-Speech (CC-BY-NC-SA), Piper (GPL-3.0 since
   Oct 2025), IndexTTS-2 (no license), Wav2Lip (no license), FLUX.1 dev/Krea (non-commercial
   weights → use FLUX.1[schnell] or Qwen-Image, both Apache-2.0).
5. **Standing principle added:** constraints adopted for lack of options MUST be revisited when
   options appear. Propose upgrades, don't defend old limits. Licensing is the only permanent one.
6. Research agents did NOT know the spec — they ranked F5-TTS #3 and called Piper MIT. Both wrong
   for this app. Always re-check agent output against AGENTS.md before acting.

## [CURRENT STATE] In progress
- **Realistic-teacher prototype — BUILT & VERIFIED (2026-08-09).**
  Deliverable: `06-prototypes/realistic-teacher-demo-v3.html` (double-clickable `file://`, 26KB).
  Built ON v2 (did not restart). Mara = stylized-realistic adult instructor (cartoon "Riff" retired
  for this skin); her hand DEMONSTRATES the fingering.
  - VERIFIED by screenshot (vision) + geometry: for C major the 3 fingertips land at the EXACT dot
    coords `(289.75,78.4)`,`(204.25,112.8)`,`(118.75,181.6)`; finger 4 correctly rests off-board
    (C has no 4th-finger note). Hand + diagram read the SAME `CHORDS` object → cannot disagree.
  - Chord data proven against `07-app/core/chord-theory-check.js` FIRST: `verify-prototype-chords.mjs`
    reports **0 errors AND 0 warnings** (v2's D had a latent bug — open low-E that isn't in D; fixed by
    expressing muted strings as `null`, the checker's contract). Ship gate: Rule 8 PASS.
  - SVG transform ATTRIBUTE used for arm/hand (Rule 10); Caught + fixed a real bug via render:
    TDZ error from calling `drawBoard()` before `handG`/`PALM` were declared → board drew with 0 dots.
    Hoisted declarations + added explicit `drawBoard()` call. Re-rendered clean.
  - Voice: browser TTS for demo (female voice pick); shipping = Chatterbox, fallback = Kokoro-82M.
    Rive dropped (noted in UI). Blocklist preserved in code comments.
  - NOTE: `file://` is blocked by the browser sandbox; verified via a TEMP localhost server
    (python3 -m http.server 8765) then killed. Deliverable remains the `file://` HTML (phone rule).

## [OPEN ITEMS] Next actions
1. **Build the TalkingHead realistic-teacher prototype.** Owner said yes to a working demo.
   Deliverable = double-clickable `file://` HTML (NOT localhost — her phone can't reach it).
   Verify with a SCREENSHOT, not numeric checks (AGENTS.md Rule 10: CSS transforms silently
   fail on SVG `<g>`; use the SVG transform ATTRIBUTE).
2. **Acemagic S3A mini PC — OWNER-SUPPLIED SPECS (2026-08-09):**
   - CPU: **AMD Ryzen 7 5700U** (Zen 2 / Renoir, 8C/16T, 15W). CORRECTS the earlier wrong guess of
     "Intel N-series" — that prior was unverified reasoning from the model class and is now void.
     Confirmed from the machine itself, not a spec sheet.
   - Graphics: **Vega 8 integrated (iGPU), NO discrete VRAM** (shared system RAM). The "integrated /
     no VRAM" prediction HOLDS. GPU-heavy work (Chatterbox ~6GB, Qwen-Image, Wan 2.2) stays on
     RENTED cloud GPU, NOT this box.
   - **RAM: NOT CAPTURED** — owner reported "0", which is impossible (no PC has 0 RAM) → the
     sticker/BIOS wasn't actually read. RAM is the deciding capacity spec:
     **8GB = upgrade or return, 16GB workable, 32GB comfortable** for always-on Hermes + browser/CPU.
     RE-READ before relying on this box. (NOTE: a `wmic` query was run 2026-08-09 but returned the
     CURRENT DESKTOP's specs — Ryzen 5 3600, 16GB, GTX 970 — NOT the S3A. Do not copy those onto
     the S3A; they are two different machines.)
   - **ROM (storage): NOT CAPTURED** — also reported "0"; re-read.
   - Assessment: 5700U is a strong always-on host (8C/16T), notably more capable than the N100 floor
     I'd budgeted — good for TalkingHead browser-side render (zero GPU), Kokoro CPU TTS, concurrent
     light tasks. Capacity still gated on the (unknown) RAM.
3. **Voice library:** batch-render teacher lines with Chatterbox on a RENTED cloud GPU
   (RunPod/Vast ~$0.30-0.70/hr, est. $20-40 one-off), ship audio files. Kokoro on CPU for
   live/dynamic lines. No hardware purchase required.
4. **Track 3 (images/video), deferred:** Qwen-Image + Wan 2.2 via ComfyUI/SwarmUI on rented GPU
   for teacher art + YouTube teaser.
5. **Track 4 (reverse-engineering), deferred:** no target URL yet. Owner wants the CAPABILITY
   standing by. Pipeline = httpx/WhatWeb → katana → sourcemapper (fallback webcrack+wakaru) →
   mitmproxy → SingleFile → screenshot-to-code. Only the last step needs an API key.

## Reference docs
- `HANDOFF-2026-08-09-ai-stack-research.md` — full 4-track findings + corrections section
- `C:\Users\The Yoda Trader\talking-avatar-research.md`
- `C:\Users\The Yoda Trader\tts-research.md`
