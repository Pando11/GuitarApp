# AMENDMENT-11 — World-Locked Teacher + Longitudinal Student Memory + Teacher–Student Duet (binding)

**Date:** 2026-08-11
**Supersedes:** nothing (additive). Reinforces AMENDMENT-05 (listening engine), AMENDMENT-06 (avatars may demonstrate fingerings), AMENDMENT-07 (styleAnchor-driven world art), AMENDMENT-09 (Godot story-world), AMENDMENT-10 (AI-drawn fingering permitted), Rule 5 (LLM prose-only), Rule 9 (license blocklist = copyright law).
**Source of truth:** owner direction in the 2026-08-11 lesson-wording session. The user explicitly asked to "capture this thesis — the relationship the student is building with the teacher/AI" and directed that it be captured WITH redlines (not rubber-stamped).
**Author:** Hermes, on explicit owner directive. Final (owner directive > prior guardrail where it overrides; license/scope rules below survive).

---

## 1. THE THESIS (what the product actually is)

The GuitarApp is NOT a stack of disconnected lessons. It is a **recurring AI teacher who lives inside a world, remembers the student, and coaches forward.** This relationship — not the chord diagrams — is the product and the differentiator no competitor has (Yousician grades you in a void; we build a character who watches you improve).

Three load-bearing parts:

1. **World-locked teacher.** The teacher is a *character bound to a world*, not a floating narrator. Lessons 1–20 = one coherent "old village" world: the corner guitarist *is* a villager; the scene, the buildings, the reaching hand, his clothes, his voice all share one `styleAnchor` (AMENDMENT-07). Later lessons / worlds may use different personas — that is allowed, but each lesson's visuals are internally one world.
2. **The AI remembers the student (longitudinal memory).** The teacher pulls the student's *actual* performance history and coaches *forward*: "Last lesson we did E minor — you had it solid. This lesson we add C." Memory is sourced from the constrained listening engine (AMENDMENT-05: on-device chord/tempo match, audio never uploaded).
3. **Teacher–student duet (the payoff).** Eventually the teacher *plays along with* the student — teacher's part a beat ahead, student plays along — as the emotional close of the arc. This is the fusion nobody else ships.

---

## 2. THE "HAND MATCHES THE WORLD" VISUAL RULE (owner-specified, 2026-08-11)

While the teacher is *saying* the fingering ("hold your guitar up like this… middle finger on the A string, second fret…"), a **hand reaches around the neck on screen** and physically shows the grab + finger placement, synced to the words. A layer "comes up front" so the student sees exactly how the hand sits.

The hand's **art style = the lesson's scene art style.** This L02 lesson is an *old village* — so the hand looks like it belongs in that village: same art direction as the buildings, the stone, the crates, the lighting (weathered, period-appropriate), not a generic studio hand floating in. When lesson 9 is a different world, its hand matches *that* world.

Enforcement: the hand is generated from the same `styleAnchor` as the rest of the lesson's assets (AMENDMENT-07 §4/§5) — one coherent world per lesson. The hand is NOT a separate art decision. Its *skin/age/clothing/lighting* inherit the world; its *finger positions* are still driven from the **`chord-theory-check.js` verified data** (correct-by-construction, AMENDMENT-06) so the on-screen hand and the 2D fretboard diagram cannot disagree.

Note on "anime not an animated" (owner's wording): logged as *realistic / world-matched hand art*, not a cartoon mascot. AI-drawn hands are permitted (AMENDMENT-10); they must still be data-correct. Re-confirm art direction (photoreal vs stylized-3D vs anime) per world when that asset is actually generated.

---

## 3. REDLINES (owner demanded these — NOT just "yes good")

These are binding constraints on the build. The assistant attached them and the owner approved.

**RED LINE 1 — The memory is a REAL data module that does not exist yet. Do not write this amendment as if it is already built.**
- The repo today has the *listening* mechanic (constrained match, on-device) and the *lesson* content, but NO "student memory / progress profile" module has been found.
- This amendment therefore states it as a **REQUIRED NEW BUILD**: a per-student profile storing `{chord: mastery, last_lesson, weak_spots, practice_history}` fed by the listening engine.
- If we document it as "already happens," the build skips it. So: BUILD THIS. It is the core differentiator. Treat as a fresh decision/amendment-scale task, not assumed infrastructure.

**RED LINE 2 — Rule 5 bound stays HARD. The teacher's "you need more C" line is generated FROM stored mastery numbers, not decided by the LLM on a vibe.**
- The LLM writes prose only and may cite only metric keys present in the DSP output / progress-profile JSON (AGENTS.md Rule 5).
- The teacher never *infers* a musical judgement. "You need more C" is produced from the stored `mastery` field, not from the model's opinion.
- This keeps the memory honest and inside the license/architecture already locked. Nobody "improves" the teacher by letting it freelance.

**RED LINE 3 — The duet is the LAST stage, gated on the listening engine being proven.**
- Teacher-plays-along requires the app to know, in real time, that the student is in time / on-chord. That is the constrained listening loop (AMENDMENT-05), NOT open transcription (banned by Rule 4).
- Mark the duet as **"dependent on listening-engine ship + calibration sign-off"** — not "free to promise at v1." Selling duet before the listener works reproduces the #1 competitor complaint we specifically built to avoid.

---

## 4. SCOPE CAP (assistant suggestion, owner-approved-in-spirit)

The *village guy remembering you* is the magic — but cap v1 memory so it stays warm, not surveillance:
- Remember only: last **3** lessons, per-chord mastery (`mastered` / `needs_work` / `not_started`), and the teacher's assigned practice.
- NO behavioral profiling ("we noticed you practice at 11pm when sad"). No cross-lesson psychological inference.
- Keeps the relationship human-scale and within privacy expectations; expansion is a later decision, not v1.

---

## 5. WHAT THIS AMENDMENT DOES / DOES NOT

- DOES: bind the world-locked-teacher + longitudinal-student-memory + teacher–student-duet thesis as product truth; bind the "hand matches the world" visual rule; attach the 3 redlines + the v1 memory cap.
- DOES NOT: imply the memory module or duet already exist — both are flagged as builds gated per Red Lines 1 and 3.
- DOES NOT: relax Rule 4 (no open transcription), Rule 5 (LLM prose-only), Rule 7 (no v1 recording/camera/hand-tracking), or Rule 9 (license blocklist = copyright law — Midjourney/SVD/FLUX-dev-krea/LTX-Hunyuan-CogVideoX stay BLOCKED).
- DOES NOT: change the bound stack (Flux-schnell + Wan2.1-I2V + Chatterbox + Godot) or AMENDMENT-07/08/09/10.

## 6. FOLLOW-UP TASKS (open, not yet built)

- [ ] Design + build the per-student progress-profile module (Red Line 1). Schema, storage (on-device; never uploaded), and the listener→profile write path.
- [ ] Wire the profile into lesson coaching generation (Rule 5-bound): teacher reads `{mastery, last_lesson, weak_spots}` and emits forward-coaching copy.
- [ ] Prototype the synced "hand reaches the neck" overlay for L02 (world-matched art, data-correct fingering) — see §2.
- [ ] Gate + build the teacher–student duet behind listening-engine ship + calibration (Red Line 3).
- [ ] Capture the L01/L02 human-voice wording rewrites (VOICE-GUIDE.md tone) and the roll-out pattern to remaining lessons as a separate copy task.
