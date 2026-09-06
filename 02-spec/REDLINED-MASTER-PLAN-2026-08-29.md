# GuitarApp — Redlined Master Plan (single source of truth)

**Date:** 2026-08-29
**Owner:** Heidi Hendrickson
**Author:** Hermes (Boris working discipline + wayfinder plan-not-build)
**Replaces:** the three overlapping maps under `.scratch/` (wayfinder, guitarapp-consolidation, guitarapp-wayfind) — those are now ARCHIVED. This file is the one plan to read.

---

## 0. Why this file exists

Three separate wayfinder maps had drifted apart and disagreed with each other and with what's actually on disk. This is the reconciled, owner-approved (2026-08-29) master plan: what's decided, what's built and verified, what's still open, and what gets built next. It is a **plan, not a build** — no production code was written to produce it.

Every claim below was re-verified on THIS machine on 2026-08-29 (the PC-transfer discipline: prose is not proof; `ls`/`node` is). Where a prior map's claim was wrong, it's marked **[CORRECTED]**.

---

## 1. Destination (unchanged, restated clean)

An AI-augmented GuitarApp: a **personalized AI teaching agent** (Sage) who lives inside a **world** (Emerald Hollow), remembers the student, and teaches guitar. Built on a **commercial-clean free stack** (Apache-2.0 / MIT only). Five new AI features on top of the nine already-approved AMENDMENT-05 features, fed by the **world-factory pipeline** (world-building-prompt skill → FLUX.1[schnell] → Wan2.2-I2V → Chatterbox → Godot).

**World 1 first.** World 2+ comes after World 1 proves the template.

### The clarified goal (AMENDMENT-18, owner 2026-08-29)

What a finished-World-1 student should tell a friend: **"I actually learned to play, and it was fun."** Learning is the goal; the **world is the delivery mechanism that makes learning fun** (it serves the learning, it is not the point). Both must be true — they got better AND enjoyed it enough to return. Audience: BOTH a 10-year-old and a 45-year-old.

### Six build items added (AMENDMENT-18, all ratified 2026-08-29)
1. **BI-1** "Look what you can do now" proof-of-progress moment.
2. **BI-2** The world REACTS to progress (fun baked into learning, not decoration).
3. **BI-3** First 60 seconds: fastest path to one proud sound.
4. **BI-4** Emotional continuity — Sage remembers the STORY (milestones, comeback, nemesis chord), all from stored numbers.
5. **BI-5** Two registers from one Sage (kid vs adult), prose-template switch.
6. **BI-6** De-risk the listening engine INSIDE the first slice (real-phone test).

---

## 2. Ground truth — verified on disk 2026-08-29

| Thing | Status | Evidence (re-run 2026-08-29) |
|---|---|---|
| Chord checker | ✅ GREEN | `06-prototypes/step0/run-chord-check.js` → 25 lessons / 81 chords / 0 errors / 0 warnings |
| Curriculum-order gate | ✅ GREEN | `tools/verify-curriculum-order.js` → 0 errors |
| Song-progression gate | ✅ GREEN | `tools/verify-song-progressions.js` → 0 errors AND 0 warnings |
| Amendments on disk | ✅ 18 | `02-spec/` (AMENDMENT-01..17 + evidence-loop) |
| ADRs on disk | ✅ 4 | `docs/adr/` (0001–0004) |
| Shipping lessons | ⚠️ DATA only | `07-app/content/lessons/` — 25 lesson JSONs (chords/exercises/coaching copy/Q&A = the *script*). **ZERO produced** as animated+voiced+in-world experience: `assets/` empty, only 8 old proof wavs, Godot world = code skeleton no art. "No lessons built" is TRUE in the way that matters. |
| Authoring-source lessons | ✅ 20 | `05-content/` (pre-re-sequence numbering; promoted → 25 shipping) |
| Songs | ✅ 11 | `progressions.json` SP01–SP11, all carry `honest_claim` |
| Core PWA modules | ✅ 18 | `07-app/core/*.js` |
| **app.js** | ✅ EXISTS | `07-app/app.js` **[CORRECTED — consolidation map wrongly said MISSING; it was looking in `07-app/core/`]** |
| Godot scaffold | ✅ wired | `07-app/godot/` — real files in `lesson/` + `world/`, top-level `FingeringOverlay/`+`LessonScene/` are empty decoys |

**Real gaps (expected — the build blockers, not drift):**
- No FLUX / Wan model dirs on this machine (they live on the RunPod pod — FLUX done, Wan2.2 ~12% synced; see RunPod handoff).
- No `assets/` output dir (nothing generated yet).
- No `.venv-kokoro` voice stack locally; no `godot` on PATH locally.
- `practice-remix-q5-prototype.html` — **[CORRECTED]** owner confirms she saw + approved it; file lost in PC transfer. Decision stands; file = rebuild task.

---

## 3. Locked decisions (the route already walked)

### 3.1 The five new AI features (all resolved in wayfinder, verified)
1. **Song discovery by taste** — two-lane match (play today / next step) with per-match "why Sage picked this"; voice-primary, buttons backup; stays inside the 11-song approved track w/ disclaimer + PD flag. Prototype exists + owner "it looks great."
2. **Call-and-response jam** — generate fresh music (ACE-Step / YuE, cloud GPU authorized); AI grades student phrase against known chords; on-device listening → facts-to-cloud → audio back (audio never leaves device, AMENDMENT-05 holds); weaves into lessons. Path B duet is now generative from the same pipeline.
3. **Stylistic explorer** — strum pattern + rhythm feel, one bar w/ counts; style-as-category (no artist names — AMENDMENT-14); within-lesson tool. Prototype exists (deferred verdict).
4. **Celebration moments** — stored-number data only (Rule 5); push delivery as teacher's lesson opener; shareable via OS share sheet; augments existing #8 monthly summary; two-layer privacy model.
5. **Practice remix** — six framings; engagement-data-only sequencer (no personality/mood inference); presentation layer on the adaptive practice plan. **Decision valid; prototype file to be rebuilt.**

### 3.2 The agent (Sage)
Lesson director (not just a chat tutor), voiced by Sage (Chatterbox MIT built-in voice, no cloning), lives on-device with PocketBase memory sync, one teacher per world / one memory per student across worlds, three-layer memory (observed + assigned + outcome), speaks warmly from stored numbers only. Full Rule 2/5/9 fence.

### 3.3 World 1 + performance ladder — RATIFIED 2026-08-29 (was AMENDMENT-17 / ADR-0004 "proposed")
- **World 1 = Emerald Hollow** — enchanted medieval Celtic village, cozy fantasy tavern; **high-end animated (NOT photo-real) for v1**; palette LOCKED from measured video reference (brightness 75–120/255, saturation 0.14–0.33, muted/earthy).
- **Teacher = Sage** — chill/warm/encouraging, one MIT Chatterbox built-in voice, high-quality animated character, present throughout.
- **Performance ladder** — Level 1 tavern porch (~5–6 lessons, teacher accompanies, low pressure) → Level 2 expanded village (~10–12 lessons, harder pace) → Level 3 capstone at Lesson 25 (bar/stage, full band: bass + drums + Sage on second guitar, student picks song).
- **Duet** — Path B ships v1 (pre-built smart accompaniment: loops/waits/simplifies). Path A (live adaptive) = visible roadmap goal, revisit when 3 prerequisites met (student memory live + encrypted cross-device; on-device listening reliably classifies clean chord changes in real time; adaptive-accompaniment prototype exists).
- **★ NEW CHANGE (owner, 2026-08-29): World creation MUST route through the `world-building-prompt` skill.** The Emerald Hollow world brief is produced FIRST via that skill's L2→L5 template (with the warm-palette lock + L5 `@Sage` / `@EmeraldHollow` locked instances). Only THEN does the FLUX→Wan→Chatterbox→Godot pipeline consume the brief. The **animated-character source** (hand-authored Godot rig vs AI-generated FLUX+Wan stills+motion vs mix) is decided INSIDE that skill run (the L5 character sheet), not pre-decided here.

### 3.4 Backend + memory
PocketBase (AMENDMENT-16, MIT, self-hosted, no recurring fee). Student memory always-on, encrypted client-side (ciphertext only in PocketBase), mastery = label + 0–100 confidence (ADR-0001). Recovery = 4–6 word phrase set at 2nd-device add.

**Teacher's memory = three layers (ADR-0005, 2026-08-29):**
- **Layer 1 SKILL MEMORY (numbers)** — ALREADY BUILT: `07-app/core/practiceStore.js` (per-chord clean/fail/unsure, states, streaks, help requests).
- **Layer 2 STORY MEMORY (meaning)** — NEW, small (~60-80 lines): reads Layer 1, derives milestones + comeback (>7 days away) + nemesis chord. This is BI-4. Runs on LOCAL storage first.
- **Layer 3 SYNC + PRIVACY SHELL** — NEW: encrypt Layer 1+2 blob on-device, PocketBase stores ciphertext only, recovery phrase (ADR-0001).
- **Build order:** Layer 2 (local) FIRST → validate in Wave 0 slice → Layer 3 (encrypted sync) AFTER.
- **Rejected:** Obsidian/note-tools for student memory (breaks zero-knowledge privacy; wrong shape; outside paid dependency). Note-tools are fine for the OWNER's planning notes only.
- **Sacred guardrail:** Story Memory derives ONLY from playing data — NEVER mood/personality inference (banned).

### 3.5 Song track
**11 songs** (SP01–SP11), all with `honest_claim`, gate green. **[CORRECTED — spec wording still says "10"; update to 11.]** SP06 (House of the Rising Sun) + SP11 (Amazing Grace) are public domain. All others: band names = trademarks, nominative use + "not affiliated" disclaimer required; counsel sign-off before paid launch (AMENDMENT-14).

---

## 4. Legal floor (never violated — copyright law, not preference)
- **Rule 5** — LLM writes prose only, cites stored numbers, never invents musical opinion.
- **Rule 9** — license blocklist = copyright law. Commercial-clean + free ONLY. **Approved:** FLUX.1[schnell], Wan2.1/2.2-I2V, Chatterbox, Kokoro-82M, Godot 4.x, ACE-Step, YuE, basic-pitch, librosa, CREPE, AudioKitEX. **Blocked:** XTTS-v2, F5-TTS, Fish Speech, Piper, IndexTTS-2, Wav2Lip, FLUX dev/Krea, Midjourney, SVD, MusicGen, Suno, ElevenLabs, Essentia/aubio/TarsosDSP/madmom.
- **Rule 2** — no camera, no hand tracking.
- **Rule 8** — chord correctness via arithmetic checker, 0 errors/0 warnings to ship.
- Every new song needs a HUMAN lyric read-through (a regex can't catch a paraphrased lyric — AMENDMENT-14 CRITICAL).

---

## 5. Redline — what was fixed in this consolidation

1. **[CORRECTED] app.js is NOT missing** — it's `07-app/app.js`. Removed the false blocker.
2. **[CORRECTED] practice-remix prototype** — decision valid (owner saw it); file lost in transfer → rebuild task, not a reopened decision.
3. **[CORRECTED] song count = 11, not 10** — spec wording to update.
4. **[RATIFIED] AMENDMENT-17 / ADR-0004** — flip both from "proposed" to "ratified 2026-08-29" (with the world-building-prompt routing added). Requires the re-sync gotcha (below).
5. **[MERGED] three maps → one** — this file. The three `.scratch/` maps are archived.
6. **[STALE] ADR-0004 §Production vehicle "scaffold NOT present"** — Godot scaffold IS present and wired; update that line.
7. **[OPEN] guitarapp-wayfind ticket 03** (ratify AMENDMENT-17) — resolved by decision #4 above.

### Re-sync gotcha (do when ratifying, before calling it "live")
On ratifying AMENDMENT-17 / ADR-0004, re-sync ALL THREE pointers or they drift a full amendment behind:
1. `AGENTS.md` — the "latest word" amendment line
2. `01-START-HERE/README.md` — date line + amendment reading table + chain
3. `HANDOFF.md` — header + chain
Then re-run the three ship gates (they encode current truth).

---

## 6. Open items (still genuinely undecided)

- **Animated-character source for Sage** — resolved by running the world-building-prompt skill (L5 character sheet), not before.
- **Exact Level 1 / Level 2 lesson gate numbers** — ladder shape locked (~5-6 / ~10-12); exact lesson boundaries mapped against the 25-lesson curriculum at spec time.
- **Level 3 band assembly** — pre-built per song vs assembled by app.
- **Level 3 song pick** — full 11-song catalog vs curated subset.
- **Encrypted-sync key exchange detail** — ADR-0001 shape locked; the client-side crypto handshake is a build-design item.
- **05-content (20) → 07-app (25) promotion path** — verify the authoring→shipping re-sequence mapping holds after AMENDMENT-15.

---

## 7. Out of scope (ruled beyond this destination)
World 2+; photo-real teacher track; Path A live duet (roadmap only); new curriculum lessons/drills/songs unless a feature needs them; monetization/paywall/pricing; Android-specific V2/V3 roadmap items; leveling/titles/named band-member characters (parked).

---

*This is the plan. The sub-agent build/deploy plan lives in `02-spec/SUBAGENT-BUILD-PLAN-2026-08-29.md`. Neither file builds anything — they decide and sequence. Building happens in separate sessions.*
