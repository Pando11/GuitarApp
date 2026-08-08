# GUITAR LESSON APP — READ THIS FIRST

**You are an AI agent picking up this project. This file is your entry point.**
Everything about this product lives under `Desktop/GuitarApp/`. Nothing lives outside it.

Last updated: 2026-08-05
Owner: Heidi Hendrickson. Full autonomy — decide and execute, don't ask for sign-off.

---

## 1. WHAT THIS PROJECT IS

An iOS app that teaches absolute beginners **acoustic** guitar.
Avatar-led synthetic lessons in a correctly-sequenced beginner path. v1 has **no recording, no audio grading, no camera** — the record-a-take critique was RETIRED by AMENDMENT-04 (2026-08-05). The product is the pedagogy + lesson ordering + streaks, not a recorder.

Business bar: **1,000 engaged monthly users in 18 months @ $12/mo** (~$144K/yr, >90% margin).
Founder is a non-guitarist — a contracted guitarist QAs all AI-generated content.
This is NON-NEGOTIABLE and is why the content pipeline has a human gate.

Status: **SPEC AMENDED. RESEARCH PARTIAL. BUILD IN PROGRESS — Steps 0,1,2,3,4,5 DONE (Step 5 = in-lesson listening, F2 full, the $12/mo feature).** Steps 6 (chat/adaptive/messages/streaks), 7 (subscriptions), 8 (style packs), 9 (YouTube) remain. What is done: spec + 6 amendments, 11 playable prototypes, real lesson-JSON template, full audio engine (tuner/metronome/listening), 20 authored lessons, and the in-lesson listening verifier (proven browser-free, 24/24 + adversarial 0 HITS). What is NOT done: Heidi's go-ahead to ship, real-guitar mic calibration sign-off (logic proven, 2-min in-room test), teacher character art.
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
| 3c| `02-spec/guitar-app-spec-AMENDMENT-04.md` | **CURRENT TRUTH — product scope.** record-a-take critique RETIRED; v1 = sequenced lesson app (no recording/audio grading/camera) |
| 4 | `02-spec/guitar-app-spec.md` | base spec — historical, superseded in parts |
| 5 | `02-spec/guitar-build-plan.md` | execution plan (build order superseded by Amdt 01 §7) |
| 6 | `03-research/feedback-tech/` + `03-research/animation-voice/` | the evidence (incl. animation-repos-and-debate.md + debate/) |
| 7 | `01-START-HERE/SESSION-2026-08-04-animation-direction.md` | **session log** — how we picked the AI-native "movie-like" lesson direction |

---

## 4. FOLDER MAP

```
GuitarApp/
├── 01-START-HERE/     ← you are here
├── 02-spec/           spec + amendments + build plan  (CURRENT TRUTH)
├── 03-research/
│   ├── feedback-tech/    audio stack, video feasibility, feedback competitors (2026-08-04)
│   ├── animation-voice/  animated teacher vs filmed human, animation pipelines,
│   │                     TTS/voice licensing (2026-08-04); NEW: animation-repos-and-debate.md
│   │                     + debate/ (3-way agent debate → Camp 3 AI-native pick)
│   ├── competitors/      Yousician/Fender/Simply/Justin teardowns + GIBSON (2026-08-05)
│   │                     + PICKUP MUSIC & TRUEFIRE (2026-08-05)
│   ├── market/           marketing, business models, consolidated data, build patterns
│   └── reference-repos/  alphaTab, learnhouse, react-guitar, book-of-frets-x
│                         (READ-ONLY build references — NOT dependencies, check licenses)
├── 04-validation/     Reddit demand post (informational, no gate)  (GATE removed 2026-08-05)
├── 05-content/        lesson JSON fixtures
├── 06-prototypes/     playable HTML demos + README.md index
│                         (latest: lesson-director-v4.html — "Lesson Director" AI-native pipeline;
│                          kanban-guitar-lessons.html — interactive project kanban board,
│                          drag-drop + localStorage, seeded with GuitarApp workstreams)
└── 07-archive/        original raw notes, superseded docs
```

---

## 5. WHAT V1 SHIPS

- Free tuner + metronome (App Store funnel front door)
- LLM-generated beginner acoustic curriculum, guitarist-QA'd
- One 2D cartoon avatar coach — Rive dropped 2026-08-04 (no membership fees). If a hand is ever animated it MUST be a rigged hand, IK-constrained to real fret coordinates, team-controlled and guitarist-QA'd (never AI-generated). Data-driven 2D fretboard stays the correctness source. See Amendment 03 §3.
- **Sequenced beginner curriculum** of avatar-led lessons (LLM-generated + guitarist-QA'd), progressive
  teaching order — first 20 defined in `guitar-app-first-20-lessons-2026-08-05.md`; ordering research in
  `03-research/market/guitar-lesson-ordering-research-2026-08-05.md`.
- **Progress / streaks / practice logging / adaptive review** as the return-and-retention engine.
- NO recording, NO audio grading, NO camera in v1 (record-a-take critique RETIRED — Amendment 04, 2026-08-05).

NOT in v1: camera of any kind, fret buzz diagnosis, real-time note scoring, audio recording/grading,
Android, electric guitar, songs-as-licensed-library (licensing), live jams.

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
2. **Teacher character art still needed.** `06-prototypes/animated-teacher-demo-v2.html`
   validates the FORMAT (character + fretboard, no filmed human) but the art is
   placeholder. Next: decide teacher character art — freelance illustrator OR an
   Apache-2.0 AI model (FLUX.1[schnell] / Qwen-Image) — per Amendment 03 §8. Rive is
   dropped (no membership fees). Open questions for the owner are listed in Amendment 02 §6.
3. **Fret buzz recording/labeling plan.** Not written yet, deliberately deferred.
   No public labeled fret-buzz dataset exists, which is exactly why it's the durable
   moat: a data-collection problem, not a coding problem. Plan is to have the
   contracted guitarist record clean-vs-buzzy examples during QA.
4. **Reddit post = optional extra info, not a signal or gate.** There is NO interview gate and
   no validation step. The founder never agreed to 10 interviews. `04-validation/guitar-reddit-
   recruitment.md` is a discussion post (what people liked/hated in other apps + $12/mo interest)
   we may put up for extra context — it is NOT a demand signal, validation, or go/no-go. The old
   `guitar-interview-script.md` is in `07-archive/`.
5. **NEXT RESEARCH QUEUED (B):** Pickup Music + TrueFire teardown — DONE 2026-08-05
   (`03-research/competitors/pickup-truefire-teardown-2026-08-05.md`). Confirms our async-
   automated-unlimited critique is distinct from every incumbent (Yousician/Gibson=real-time-
   in-app; Pickup=async-HUMAN ~48h; TrueFire=live workshops). Also corrects the stale
   "Pickup 1 video/wk ~1wk" and "$39/exchange = TrueFire sub" notes.
6. **NEXT RESEARCH QUEUED (C):** App Store Guideline 3.1.2 subscription-rejection risk for a
   subscription guitar app (sources gathered 2026-08-05; not yet written up). Then D (basic-pitch
   vs SwiftF0 on-device pitch), E (re-verify FLUX.1[schnell]/Qwen-Image still Apache-2.0).

---

## 8. CONVENTIONS FOR WHOEVER WORKS HERE NEXT

- Never edit the base spec to reflect new decisions — **write a new
  `guitar-app-spec-AMENDMENT-NN.md` in `02-spec/` and update this file's §7.**
  Amendments are append-only history; the reasoning is as valuable as the decision.
- New research goes in the right `03-research/` subfolder, never loose on the Desktop.
- Update this file whenever the current truth changes. It is the contract with the
  next agent.
