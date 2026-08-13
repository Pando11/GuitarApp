# GUITAR LESSON APP — READ THIS FIRST

**You are an AI agent picking up this project. This file is your entry point.**
Everything about this product lives under `Desktop/GuitarApp/`. Nothing lives outside it.

Last updated: 2026-08-13 (re-synced to AMENDMENT-05/06/11 — see §2B chain; Android IS in v1, avatar style is OPEN)
Owner: Heidi Hendrickson. Full autonomy — decide and execute, don't ask for sign-off.

---

## 1. WHAT THIS PROJECT IS

An iOS + Android app that teaches absolute beginners **acoustic** guitar.
Avatar-led synthetic lessons in a correctly-sequenced beginner path. v1 has **no recording, no audio grading, no camera** — the record-a-take critique was RETIRED by AMENDMENT-04 (2026-08-05). The product is the pedagogy + lesson ordering + streaks, not a recorder.

Business bar: **1,000 engaged monthly users in 18 months @ $12/mo** (~$144K/yr, >90% margin).
Founder is a non-guitarist. Chord/technical correctness is verified by ARITHMETIC
(`chord-theory-check.js`), NOT a contracted guitarist — owner directive (AMENDMENT-11 era):
no human QA gate. Judgement calls the checker cannot decide (tone, feel, teaching quality)
are flagged in prose, never as blocking red boxes (AGENTS.md Rule 8).

Status: **SPEC AMENDED. RESEARCH PARTIAL. BUILD IN PROGRESS — Steps 0,1,2,3,4,5 DONE (Step 5 = in-lesson listening, F2 full, the $12/mo feature).** Steps 6 (chat/adaptive/messages/streaks), 7 (subscriptions), 8 (style packs), 9 (YouTube) remain. What is done: spec + 11 amendments, 11 playable prototypes, real lesson-JSON template, full audio engine (tuner/metronome/listening), 20 authored lessons (23 shipping), and the in-lesson listening verifier (proven browser-free, 24/24 + adversarial 0 HITS). What is NOT done: Heidi's go-ahead to ship, real-guitar mic calibration sign-off (logic proven, 2-min in-room test), teacher character art.
(root) for the current state, the 3 new gap-closing docs (TAM, content-cost, App Store 3.1.2), and
the still-open items. Note: there is NO interview validation gate — the Reddit post is optional
extra info only, not a demand signal or validation.
NOTE: the v1 differentiator is a **correctly-sequenced, avatar-led beginner path** (pedagogy + lesson ordering + fast first-song wins + streaks), NOT audio grading and NOT the camera. The async record-a-take critique was RETIRED by AMENDMENT-04 (2026-08-05). The consolidated research doc's old "camera = our moat" framing was corrected 2026-08-05 — read that doc's §(MOAT — CORRECTED 2026-08-05).

---

## 2. THE THREE THINGS YOU MUST KNOW BEFORE YOU WRITE ANYTHING

### A. There is NO audio grading and NO camera in v1
The original spec was built around a front-camera chord-shape checker; AMENDMENT-01 (2026-08-04)
replaced that with a record-a-take audio critique as the moat. **AMENDMENT-04 (2026-08-05) retired
the record-a-take critique entirely** — the owner never committed to it. v1 is a **sequenced lesson
app**: no recording, no audio grading, no camera, no hand tracking. A future camera/audio arm is
**NOT assumed** and would require a fresh owner amendment.

### B. AMENDMENTS override the base spec — read them in order
The base spec still contains the old camera-first / audio-first decisions. It is kept for history.
**On any conflict, the latest AMENDMENT wins.** The current chain: AMENDMENT-01 (audio-first v1) →
AMENDMENT-02 (animated teacher + voice) → AMENDMENT-03 (AI-native movie-like lesson, open-source/
no-fee stack, bans removed) → **AMENDMENT-04 (record-a-take critique RETIRED — sequenced lesson app).**
AMENDMENT-04 is the current truth on product scope. Read the amendments, never the base spec alone.
The chain continues: AMENDMENT-05 (App That Listens) → AMENDMENT-06 (avatar/voice unlock) →
AMENDMENT-07 (Flux pipeline) → AMENDMENT-08 (Midjourney excluded) → AMENDMENT-09 (motion + Godot
story-world) → AMENDMENT-10 (AI-drawn fingering permitted) → **AMENDMENT-11 (2026-08-11 — world-locked
teacher + longitudinal student memory + teacher–student duet; the product thesis, with redlines).**

### C. There is a LICENSE BLOCKLIST — read it before choosing an audio library
Essentia (AGPL-3.0), aubio (GPL-3.0), TarsosDSP (GPL-3.0), pedalboard (GPL-3.0),
dtw-python (GPL-3.0), madmom (non-commercial only) are **ALL UNUSABLE** in this paid
closed-source iOS app — and they are exactly what tutorials recommend.

**Approved:** spotify/basic-pitch (Apache-2.0), librosa (ISC), CREPE (MIT),
AudioKitEX (MIT). Details in `03-research/feedback-tech/guitar-feedback-stack-research.md`.

---

## 3. READING ORDER

| # | File | Why |
|---|---|---|
| 1 | THIS FILE | orientation |
| 2 | `02-spec/guitar-app-spec-AMENDMENT-01.md` | **current truth** — audio-first v1 |
| 3 | `02-spec/guitar-app-spec-AMENDMENT-02.md` | **current truth** — animated teacher + voice |
| 3b| `02-spec/guitar-app-spec-AMENDMENT-03.md` | **current truth** — AI-native "movie-like" lesson, open-source/no-fee stack, Rules 10&11 removed |
| 3c| `02-spec/guitar-app-spec-AMENDMENT-04.md` | product scope. record-a-take critique RETIRED; v1 = sequenced lesson app (no recording/audio grading/camera) |
| 3d| `02-spec/guitar-app-spec-AMENDMENT-05.md` | **listening returns** (constrained, in-lesson, on-device) + iOS **AND** Android, one codebase |
| 3e| `02-spec/guitar-app-spec-AMENDMENT-06.md` | **avatar/voice UNLOCKED** — realistic/photoreal OK, fingering-demo OK; Chatterbox = shipping voice |
| 3f| `02-spec/guitar-app-spec-AMENDMENT-07.md` | FLUX.1[schnell] (Apache-2.0) = only legal image gen; Qwen-Image for edits |
| 3g| `02-spec/guitar-app-spec-AMENDMENT-08.md` | Midjourney EXCLUDED (no OSS/embed license) |
| 3h| `02-spec/guitar-app-spec-AMENDMENT-09.md` | motion = Wan2.1-I2V (Apache-2.0); story-engine = Godot (MIT) |
| 3i| `02-spec/guitar-app-spec-AMENDMENT-10.md` | AI-drawn fingers/fretboards PERMITTED (owner override); chord-theory-check.js stays a verification pass |
| 3j| `02-spec/guitar-app-spec-AMENDMENT-11.md` | **THE PRODUCT THESIS** — world-locked teacher + longitudinal student memory + duet (redlines) |
| 4 | `02-spec/guitar-app-spec.md` | base spec — historical, superseded in parts |
| 5 | `02-spec/guitar-build-plan.md` | execution plan (build order superseded by Amdt 01 §7) |
| 6 | `03-research/feedback-tech/` + `03-research/animation-voice/` | the evidence (incl. animation-repos-and-debate.md + debate/) |
| 7 | `01-START-HERE/SESSION-2026-08-04-animation-direction.md` | **session log** — how we picked the AI-native "movie-like" lesson direction |

---

## 4. FOLDER MAP

```
GuitarApp/
├── HANDOFF.md           ← CURRENT-STATE POINTER (read first when resuming; re-synced 2026-08-13)
├── HANDOFF-ARCHIVE/     dated session handoffs (historical; not current state)
├── 01-START-HERE/     ← you are here (orientation)
├── 02-spec/           spec + amendments 01-11 + build plan  (CURRENT TRUTH)
├── 03-research/
│   ├── feedback-tech/    audio stack, video feasibility, feedback competitors (2026-08-04)
│   ├── animation-voice/  animated teacher vs filmed human, animation pipelines,
│   │                     TTS/voice licensing (2026-08-04); NEW: animation-repos-and-debate.md
│   │                     + debate/ (3-way agent debate → Camp 3 AI-native pick)
│   ├── competitors/      Yousician/Fender/Simply/Justin teardowns + GIBSON (2026-08-05)
│   │                     + PICKUP MUSIC & TRUEFIRE (2026-08-05)
│   ├── market/           marketing, business models, consolidated data, build patterns
│   ├── curriculum/       curriculum + practice structure + 2026-08-12 review (CURRICULUM-REVIEW)
│   └── reference-repos/  alphaTab, learnhouse, react-guitar, book-of-frets-x
│                         (READ-ONLY build references — NOT dependencies, check licenses; gitignored)
├── 04-validation/     Reddit demand post (informational, no gate)  (GATE removed 2026-08-05)
├── 05-content/        AUTHORING SOURCE: 20 teaching lessons + generator scripts + VOICE-GUIDE.md
│                         (promote lessons to 07-app/content/lessons; practice is GENERATED, not hand-edited)
├── 06-prototypes/     proven Node engines (step0..step9, F7 band, F10 voice) + practice-engine + README
├── 07-app/            LIVE PWA (what ships): core/ engines, content/, godot/ story-world, tests
└── 07-archive/        original raw notes, superseded docs
```

---

## 5. WHAT V1 SHIPS

- Free tuner + metronome (App Store funnel front door)
- LLM-generated beginner acoustic curriculum, guitarist-QA'd
- One teacher coach (AVATAR STYLE OPEN per AMENDMENT-06: cartoon / realistic / photoreal all permitted) — Rive dropped 2026-08-04 (no membership fees). If a hand is ever animated it MUST be a rigged hand, IK-constrained to real fret coordinates, team-controlled and guitarist-QA'd (never AI-generated). Data-driven 2D fretboard stays the correctness source. See Amendment 03 §3.
- **Sequenced beginner curriculum** of avatar-led lessons (LLM-generated + guitarist-QA'd), progressive
  teaching order — first 20 defined in `guitar-app-first-20-lessons-2026-08-05.md`; ordering research in
  `03-research/market/guitar-lesson-ordering-research-2026-08-05.md`.
- **Progress / streaks / practice logging / adaptive review** as the return-and-retention engine.
- NO recording, NO audio grading, NO camera in v1 (record-a-take critique RETIRED — Amendment 04, 2026-08-05).

NOT in v1: camera of any kind, fret buzz diagnosis, real-time note scoring, audio recording/grading,
electric guitar, songs-as-licensed-library (licensing), live jams.

**Positioning:** *"The clean, correctly-sequenced path from zero to your first songs — with a coach
who never gets impatient."* The product is a SEQUENCED LESSON APP (record-a-take critique RETIRED per
AMENDMENT-04, 2026-08-05). Why it's open: Justin is free but unstructured; Yousician/Fender/Simply are
song/game-led and price-fragmented; Andy proves a clean single-price sequenced path converts. Our wedge is
pedagogy + ordering + one obvious $12/mo + fast first-song wins + streaks — not audio grading.

---

## 6. BUILD ORDER (AMENDMENT-04 §5 — record-a-take critique RETIRED)

0. Content schema + lesson-JSON renderer ← **schema first, de-risks everything**
1. Free tuner + metronome (AudioKitEX) — funnel front door
2. Lesson player + avatar shell
3. **Sequenced curriculum renderer + first 20 lessons** (the core product)
4. Progress / streaks / practice logging / adaptive review — the return-and-retention engine
5. Subscriptions (RevenueCat)
6. *(v2, OPTIONAL)* camera/posture — only with explicit owner direction; NOT assumed

LLM coaching note: the LLM writes only coaching **prose**, and may only cite data present in the
lesson/coaching JSON (no invented musical judgement). Auditable. There is **no audio pipeline** in v1 —
no DSP, no recording, no transcription (basic-pitch/librosa only matter if a future amendment reintroduces audio analysis).

---

## 7. OPEN ITEMS — PICK THESE UP NEXT

1. **No interview script.** `04-validation/guitar-interview-script.md` was retired 2026-08-05 —
   the founder never agreed to interviews. Demand is validated via the **Reddit post**
   (`guitar-reddit-recruitment.md`, rewritten same day): ask players what they liked/hated in
   other apps + gauge $12/mo interest. Informational only; no gate, no kill criterion.
2. **Teacher character art — DECIDED (AMENDMENT-07, 2026-08-10).** Reverse-engineering of
   `black-forest-labs/flux` + `huggingface/diffusers` confirms **FLUX.1[schnell] (Apache-2.0)** is the
   ONLY legal image generator for the paid app; dev/kontext/fill/redux/krea are **non-commercial and
   blocked (Rule 9, copyright law)**. Editing/consistency needs → **Qwen-Image (Apache-2.0)**.
   Pipeline: FLUX.1[schnell] server-side (cloud GPU worker) → teacher still → **TalkingHead (MIT) + RPM**
   browser-side (the actual "video") + **Chatterbox (MIT)** voice. Fingering overlays driven from
   `chord-theory-check.js`, never AI-drawn. Enforcement: `07-app/core/asset-job.js` (license gate,
   hard ship gate) + `07-app/content/teachers/*.assetjob.json` + `07-app/test/asset-job.test.mjs`
   (PASS). Open question for owner (art direction only, not model choice): freelance vs AI stills — but
   the *generator* is now bound and license-gated regardless.
3. **Fret buzz recording/labeling plan.** Not written yet, deliberately deferred.
   No public labeled fret-buzz dataset exists, which is exactly why it's the durable
   moat: a data-collection problem, not a coding problem. Plan is to have the
   contracted guitarist record clean-vs-buzzy examples during QA.
4. **Reddit post = optional extra info, not a signal or gate.** There is NO interview gate and
   no validation step. The founder never agreed to 10 interviews. `04-validation/guitar-reddit-
   recruitment.md` is a discussion post (what people liked/hated in other apps + $12/mo interest)
   we may put up for extra context — it is NOT a demand signal, validation, or go/no-go. The old
   `guitar-interview-script.md` is in `07-archive/`.
7. **NEXT RESEARCH QUEUED (B):** Pickup Music + TrueFire teardown — DONE 2026-08-05
   (`03-research/competitors/pickup-truefire-teardown-2026-08-05.md`). Confirms our async-
   automated-unlimited critique is distinct from every incumbent (Yousician/Gibson=real-time-
   in-app; Pickup=async-HUMAN ~48h; TrueFire=live workshops). Also corrects the stale
   "Pickup 1 video/wk ~1wk" and "$39/exchange = TrueFire sub" notes.
7b. **MIDJOURNEY REVERSE-ENGINEERING — DONE + EXCLUDED (2026-08-10, AMENDMENT-08).** Owner
   asked to RE Midjourney. Verdict: **not adoptable** in the paid app. No OSS analog (official
   GitHub = 16 OSS-fork repos, 0 model; Hugging Face has no official org + only NC/OpenRAIL
   "style-mimic" LoRAs on FLUX.1-dev). ToS forbids RE + competitive research; no embed license.
   Excluded in `07-app/core/asset-job.js` (`BLOCKED_VENDORS=['midjourney']`, verified live).
   Product/UX teardown + the legal OSS map live in `03-research/midjourney/` + AMENDMENT-08.
   The actual *video* model RE (Wan2.1/LTX/Mochi/…) remains queued in the video HANDOFF
   (`AppData\Local\hermes\handoffs\HANDOFF-reverse-engineer-video-guitarapp.md`) — AMENDMENT-09.
8. **NEXT RESEARCH QUEUED (C):** App Store Guideline 3.1.2 subscription-rejection risk for a
   subscription guitar app (sources gathered 2026-08-05; not yet written up). Then D (basic-pitch
   vs SwiftF0 on-device pitch). **(E) re-verify FLUX.1[schnell]/Qwen-Image Apache-2.0 — DONE via
   AMENDMENT-07:** schnell = Apache-2.0 confirmed from cloned `model_cards/FLUX.1-schnell.md`;
   Qwen-Image Apache-2.0 per Stack. License gate enforced in code (`asset-job.js`).**
8b. **MOTION + STORY-ENGINE — DONE (2026-08-10, AMENDMENT-09).** Owner: RE = whole-app technique,
   app is a game-like story-world (teacher = one character; single example's aesthetic is NOT a
   spec rule). Motion = **Wan2.1-I2V (Apache-2.0, verified via GitHub+HG API)**; SVD = LICENSE:other
   → blocked (memory error corrected); LTX/Hunyuan/CogVideoX = "other" → unverified, blocked.
   Story shell = **Godot (MIT)** chosen over Ink (Ink = story-only + dead inkjs runtime). Midjourney
   excluded (AMENDMENT-08). asset-job.js extended: ALLOWED_VIDEO_MODELS=['wan2.1-i2v'], STORY_ENGINE='godot',
   video jobs gated to cloud-gpu-worker + fps 8–30. Verified live (wan2.1-i2v passes, svd rejected,
   schnell still passes). See 02-spec/guitar-app-spec-AMENDMENT-09.md.
8c. **GODOT SCAFFOLD — BUILT (2026-08-10).** `07-app/godot/` = Godot 4.7.x project (MIT):
   `project.godot` (main_scene=World.tscn), `world/World.gd` (story-world root, loads
   `data/lesson_manifest.json`, `enter_lesson(id)`), `lesson/LessonScene.gd` (plays Wan2.1 clip +
   Chatterbox voice + FingeringOverlay), `lesson/FingeringOverlay.gd`, `data/lesson_manifest.json`
   (schema-first). Static-verified. **Godot NOT installed here** → not run-executed; owner opens in Godot 4.7.x.
8d. **AMENDMENT-10 (owner override) — AI-drawn fingers/fretboards NOW PERMITTED.** Owner: "erase
   rule 7, age of AI, don't limit ourselves." Lifted the no-AI-drawn-fingering restriction. AI may
   generate fingering/fretboards. chord-theory-check.js kept as a *verification pass* (quality gate).
   Rule 7 (recording) + Rule 9 (license law) LEFT INTACT (scope + copyright, not AI limits).
8e. **AMENDMENT-11 (2026-08-11) — THE PRODUCT THESIS, CAPTURED WITH REDLINES.** Owner: "capture this
   thesis — the relationship the student builds with the teacher/AI." Binds three parts: (1) **world-locked
   teacher** — lessons 1–20 = one coherent "old village" world; the teacher is a villager, scene/hand/voice
   share one `styleAnchor`; the *hand that reaches the neck matches the world's art* (synced to the
   coaching words, fingering still data-correct from chord-theory-check.js). (2) **longitudinal student
   memory** — a per-student progress profile (mastered/needs-work chords, last lesson, weak spots) fed by
   the listening engine, so the teacher coaches *forward* ("you had E minor solid, C needs work"). (3) **teacher–student
   duet** — the eventual payoff (teacher plays along). REDLINES (owner demanded, not rubber-stamped):
   R1 the memory module is a REQUIRED NEW BUILD, not already-existing infra; R2 Rule 5 stays hard — the
   "you need more C" line is generated FROM stored mastery numbers, never the LLM's vibe; R3 the duet is
   LAST, gated on listening-engine ship + calibration (no open transcription). v1 memory capped to last 3
   lessons + per-chord mastery + assigned practice (no behavioral profiling). See
   `02-spec/guitar-app-spec-AMENDMENT-11.md`.
8e. **PHONE-VIEWABLE PROTOTYPE — BUILT + VERIFIED.** `03-research/guitar-app-world-prototype-mobile.html`
   = self-contained `file://` (no server/internet). World→lesson flow, Wan2.1 cinematic look, AI-style
   fretboard (post-AMENDMENT-10). Node DOM-mock verified: 4 doors, fretboard draws, lesson opens, 0
   external fetches. Transfer to phone + open in browser to view. See HANDOFF-optionA-complete.md.

---

## 8. CONVENTIONS FOR WHOEVER WORKS HERE NEXT

- Never edit the base spec to reflect new decisions — **write a new
  `guitar-app-spec-AMENDMENT-NN.md` in `02-spec/` and update this file's §7.**
  Amendments are append-only history; the reasoning is as valuable as the decision.
- New research goes in the right `03-research/` subfolder, never loose on the Desktop.
- Update this file whenever the current truth changes. It is the contract with the
  next agent.
