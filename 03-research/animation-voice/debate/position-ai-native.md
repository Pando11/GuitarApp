# AI-Native "Lesson Director" Position (Camp 3 — owner's pick, 2026-08-04)

Thesis: "movie-like" ≠ generative video. Separate AI-generated ATMOSPHERE from
deterministic MOTION; keep the fretboard a code-driven layer forever.

Three builds argued:
1. AI style frames (Flux/Midjourney/Qwen) + deterministic tweening (Motion Canvas/GSAP).
   Output reproducible — same JSON, same frames, every language.
2. A "lesson director" LLM over a reusable, human-QA'd asset library. Lesson = JSON;
   LLM selects shots/camera/cutaways, emits a scene manifest; rendering is mechanical.
   The only way hundreds of lessons scale; localization = text-swap + TTS re-render.
3. Guaranteed-correct fretboard overlay on top of rich atmosphere. Rule (a) [animate hands]
   liftable ONLY under a rigged, IK-constrained, QA-controlled hand — never generated.

iOS reality: Rive = honest native answer for interactive; server-rendered video STREAMED
(never bundled) for cinematic intros. Biggest risk: pipeline sprawl.

Top 3: (1) deterministic composition engine fed by AI art, (2) lesson-director LLM,
(3) Rive-native correct fretboard overlay. The owner subsequently dropped Rive (fee) and
adopted GSAP/Lottie/SwiftUI + FLUX[schnell]/Qwen instead — see AMENDMENT-03.
