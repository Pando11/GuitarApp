# Animation Research — Open-Source Repos + 3-Way Debate (2026-08-04)

Scope: which open-source GitHub animation tech fits a "movie-like" guitar lesson
(beyond one static avatar), under the owner's hard constraint: **open-source /
NO membership fees**, iOS-only, $12/mo.

## 1. Open-source animation repos researched (live GitHub star counts, Aug 2026)
Web/UI:
- anime.js (juliangarnier/anime) — 71.8k★, JS, MIT — lean JS animation engine
- Motion (motiondivision/motion, ex-Framer Motion) — 33.1k★, TS, MIT — React/JS/Vue
- react-spring (pmndrs/react-spring) — 29.1k★, TS, MIT — spring physics
- GSAP (greensock/GSAP) — 27.4k★, JS, **FREE since 2025 (Webflow), all plugins, commercial OK**
- Lenis (darkroomengineering/lenis) — 15.3k★, TS, MIT — smooth scroll
- auto-animate (formkit/auto-animate) — 13.9k★, TS, MIT — zero-config
- Shifty (jeremyckahn/shifty) — 1.5k★, TS, MIT — tiny tween engine
Lottie:
- lottie-web (airbnb/lottie-web) — 32k★, JS, MIT — AE → native render
- lottie-react (LottieFiles/lottie-react) — 0.8k★, TS, MIT
Canvas/2D engines:
- PixiJS (pixijs/pixijs) — 47.9k★, TS, MIT — 2D WebGL renderer
- p5.js (processing/p5.js) — 23.8k★, JS, LGPL-2.1 — creative coding
- Babylon.js — 25.9k★, TS, Apache-2.0 — 3D engine
Code-driven video:
- Motion Canvas (motion-canvas/motion-canvas) — 18.9k★, TS, MIT — animate w/ code → MP4
- Manim (3b1b/manim) — 89.1k★, Python, MIT — math explainer videos
- Manim Community — 39.9k★, Python, MIT
Standalone 2D software: OpenToonz, Synfig, Pencil2D (C++, GPL) — desktop apps, not embeddable
AI image (open-source, commercial-OK): FLUX.1[schnell] (Apache-2.0), Qwen-Image (Apache-2.0),
SDXL (OpenRAIL), FLUX.2[klein] 4B (Apache-2.0). Midjourney = PAID, excluded.
Frameworks w/ built-in animation: Svelte (87.9k★), Vue (54.1k★).

## 2. The three-way debate (agents, 2026-08-04)
Full papers: debate/position-cinematic-code-driven.md, debate/position-realtime-rive-first.md,
and the AI-native summary (below).

- **Cinematic / code-driven (Camp 1):** Motion Canvas → render MP4 → iOS AVPlayer; Rive only
  for the one reactive avatar. Pros: deterministic, pixel-identical, scales via template+JSON.
  Cons: not reactive, bundle bloat, fights audio-first loop.
- **Real-time / Rive-first (Camp 2):** Rive state machines choreograph the "movie" live.
  Pros: reactive, small payload, binds to lesson JSON at runtime. Cons: Rive now $9/mo to
  EXPORT (membership fee) → REJECTED under owner's no-fee rule; dropped from stack.
- **AI-native / outside-the-box (Camp 3 — OWNER'S PICK):** AI generates atmosphere (FLUX/
  Qwen, Apache-2.0, $0), deterministic code composes motion, fretboard is a permanent correct
  overlay. A "lesson director" LLM recombines a curated asset library from lesson JSON.
  Top picks: Motion Canvas (server-render→streamed) + lesson-director LLM + Rive-native
  fretboard overlay. Biggest risk: pipeline sprawl (mitigated: build lesson #1 end-to-end first).

## 3. Verdict (owner decided)
- Adopt **Camp 3** pipeline. Fretboard stays code-driven/correct forever (replaces old bans).
- Stack = GSAP (free) + Lottie (MIT) + SwiftUI/Canvas + FLUX.1[schnell]/Qwen-Image (Apache-2.0).
- Rive DROPPED (membership fee). Rules 10 & 11 removed from AGENTS.md.
- Recorded in 02-spec/guitar-app-spec-AMENDMENT-03.md.
- See 06-prototypes/lesson-director-v4.html for the working proof (director → manifest → render).
