# SPEC AMENDMENT 03 — AI-NATIVE "MOVIE-LIKE" LESSON + OPEN-SOURCE / NO-FEE STACK
Date: 2026-08-04 · Amends `guitar-app-spec.md` §4 (avatar) and §stack.
Status: ACTIVE. Supersedes the hand/fretboard + AI-video bans previously in AGENTS.md Rules 10 & 11 (now removed).

## 1. THE NEW DIRECTION (owner's words)
"This is the age of AI — think outside the box, don't be like everyone else."
Goal: lessons that feel "almost like a movie that teaches the class" — richer and
more animated than a single static cartoon avatar. Multiple characters/scenes, cinematic
direction, AI-generated atmosphere.

## 2. RULES 10 & 11 REMOVED FROM AGENTS.md
- Rule 10 (never animate a hand) — REMOVED. Replaced by a conditional (see §3).
- Rule 11 (never use AI video gen) — REMOVED. Rationale: both were "right for the wrong
  reason." The real invariant is correctness, not a blanket ban.
- Why safe to remove: the invariant is preserved by §3's conditional, not by a prohibition.

## 3. NEW HARD CONSTRAINT — "FRETBOARD IS DETERMINISTIC, FOREVER"
The correctness guarantee that replaces the old bans:
- Fingering display = code-driven 2D fretboard dots from lesson JSON. Correct by construction.
  NEVER rendered by a generative model. (AI video still can't render correct fingering —
  AVGen-Bench 2026 — so it may NOT touch the fretboard.)
- IF a hand is ever animated, it must be a RIGGED hand with IK constrained to real fret
  coordinates, team-controlled and contract-guitarist-QA'd. NEVER an AI-generated hand.
- Everything ELSE (atmosphere, characters, camera, backgrounds, style) is open season for AI.

## 4. STACK MANDATE — OPEN-SOURCE / NO MEMBERSHIP FEES
Owner: "I really don't want to start adding up a whole bunch of membership fees."
Therefore:
- NO Rive — dropped 2026-08-04. $9/mo Cadet shipping fee violates the no-subscription rule.
  (Rive runtime is free, but EXPORTS require paid plan; that's a recurring fee.)
- Animation stack = open-source / $0:
  - GSAP — 100% free since 2025 (Webflow), all plugins, commercial OK. Backbone for
    cinematic sequencing / camera moves / parallax in prototypes AND web.
  - Lottie (airbnb/lottie-web ~32k★, MIT; lottie-ios native) — vector set-dressing.
  - Native SwiftUI / Canvas for the avatar + fretboard in the iOS app.
  - AI style frames: FLUX.1[schnell] (Apache-2.0) or Qwen-Image (Apache-2.0) — both free
    for commercial use, self-hostable, NO fee. Midjourney is OUT (paid, non-OS).
- Voice: OpenAI TTS (~$0.36 / 200 lines) per Amendment 02; Kokoro-82M (Apache-2.0) free hedge.
  (This is a per-call API cost, NOT a membership — acceptable. Revisit if owner objects.)

## 5. PIPELINE (the AI-native "lesson director")
1. Lesson content authored as JSON (chord, tempo, beats, script, mood).
2. LLM acts as DIRECTOR: selects shots/camera/backgrounds from a curated, human-QA'd
   asset library; emits a scene manifest. (Deterministic render from manifest.)
3. AI generates style frames (FLUX/Qwen) for backgrounds/characters/environments.
4. GSAP (web/proto) or SwiftUI (app) composes motion deterministically from the manifest.
5. Code-driven fretboard overlay sits on top — always correct.
- Localization = text-swap + TTS re-render. No re-shoot.

## 6. BIGGEST RISK (named by debate agent, accepted)
Pipeline sprawl: image-gen + composer + native runtime = 3 toolchains; one broken link
stalls all lesson production. MITIGATION: build lesson #1 END-TO-END before authoring #2.

## 7. PROTOTYPE
`06-prototypes/lesson-scene-movie-v3.html` — double-clickable file:// demo of one
"movie-like" lesson scene: AI-frame slot + GSAP camera/parallax + rigged-style teacher
(lip-syncs to TTS) + data-driven C-chord fretboard. Verified: JS syntax OK, fretboard
coordinates correct (x32010), no Rive dependency, GSAP free CDN.
NOTE: the AI background is SIMULATED with a gradient here (no GPU at prototype time);
the frameTag documents exactly where a FLUX[schnell]/Qwen render drops in.

## 8. NEXT
- Run lesson #1 fully: generate a real FLUX[schnell] style frame, wire it in, prove the
  director→manifest→compose loop with zero fees.
- Decide teacher character art (illustrator or AI-generated, Apache-2.0 model).
