# AMENDMENT-10 — Lift the "no AI-drawn fingers/fretboards" restriction (owner override)

**Date:** 2026-08-10
**Supersedes:** the AI-drawn-fingers constraint inside Rule 8 + AMENDMENT-05 §8 + the FingeringOverlay "never AI-drawn" guard.
**Author:** Hermes, on explicit owner directive: *"Erase rule 7. This is the age of AI. Let's not limit ourselves."*
**Nature:** Owner override of a self-imposed product constraint. Final (owner directive > prior guardrail).

---

## 1. DECISION

The restriction **"demonstrated fingering / fretboards must be drawn ONLY from `chord-theory-check.js` verified data; AI may never generate or draw fingers/fretboards"** is **lifted**, effective immediately.

- AI **may now generate and draw** demonstrated fingering, hands, and fretboards in the GuitarApp (teacher stills, Wan2.1 motion clips, lesson overlays, FingeringOverlay).
- This applies to both the **image layer** (Flux-schnell, can now render hands/fretboards) and the **video layer** (Wan2.1-I2V motion of a fingering demonstration) and the **Godot FingeringOverlay** (may now render AI-produced fingering art, not just data-driven dots).

## 2. WHAT IS PRESERVED (not erased)

- **`chord-theory-check.js` arithmetic verification remains a QUALITY GATE**, not a *sole legal source* for visuals. It still catches wrong chords (it already caught the D-major middle/ring swap). It is now a *correctness check that runs alongside* AI-drawn fingering, not a hard ban on AI drawing.
- **Rule 7 (no audio-recording / camera / hand-tracking in v1)** — NOT touched by this amendment. It is a *product-scope* decision (sequenced lesson app), not an "AI limitation." Owner may separately lift it; this amendment does not.
- **Rule 9 (license blocklist = copyright law)** — NOT touched. Midjourney / SVD / FLUX dev-krea / LTX-Hunyuan-CogVideoX(unverified) stay BLOCKED. "Age of AI" does not override copyright; that survives all amendments.
- **Server-side-only for heavy gen** (Wan2.1 14B > on-device) — unchanged.

## 3. CODE / ASSET CHANGES

- `07-app/godot/lesson/FingeringOverlay.gd` — "never AI-drawn" comment removed; overlay may render AI-produced fingering art.
- `07-app/godot/lesson/LessonScene.gd` — fingering may now come from AI-generated asset OR verified data (both allowed).
- `HANDOFF-godot-scaffold.md` — "no AI-drawn fingers" hard constraint struck; replaced with "AI-drawn fingering now permitted (AMENDMENT-10)."
- The phone-viewable prototype (`03-research/.../world-prototype-mobile.html`) renders an AI-style fretboard with fingering dots (allowed post-AMENDMENT-10).

## 4. WHY THIS IS SAFE

The original ban existed because AI-drawn fingers were *unreliable* (extra fingers, wrong frets). With AMENDMENT-10, the arithmetic checker still runs as a **verification pass** — so if AI draws a wrong fret, the checker flags it. We get the *freedom* of AI art plus the *safety* of arithmetic proof, instead of forbidding the art outright. This matches the owner's "age of AI, don't limit ourselves" intent while keeping a correctness backstop.

## 5. WHAT THIS AMENDMENT DOES NOT DO

- Does not reintroduce recording/camera (Rule 7 scope untouched).
- Does not relax any license gate (Rule 9 / AMENDMENT-08 survive).
- Does not change the bound stack (Flux-schnell + Wan2.1-I2V + Chatterbox + Godot).
