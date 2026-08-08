# Guitar Lesson Apps — Reverse-Engineering Research (MASTER / CONSOLIDATED)
Date: 2026-08-04
Purpose: single durable artifact holding ALL data collected while reverse-engineering
the top guitar-lesson apps and their platforms, to feed the Guitar School spec + build plan.

This file aggregates:
  (1) The reverse-engineering method + what was done (proof)
  (2) Competitive teardown of the top platforms (Yousician, Fender Play, JustinGuitar, Simply Guitar)
  (3) Platform build analysis — reverse-engineered architecture patterns mapped to OUR build
  (4) Repo inventory (5 open-source analogs cloned to disk) + derived spec/plan files
Everything below was pulled from the live files on Desktop/guitar-research/, not from memory.

================================================================
PART 1 — REVERSE-ENGINEERING PLAYBOOK (method + proof of work)
================================================================
# Reverse-Engineering Playbook — Guitar Lesson Platforms
Date: 2026-08-04 · For: Guitar School app spec + build plan
Status: METHODOLOGY + what was actually done this session.

## What "reverse engineering" means here (and does NOT mean)
We are studying how existing guitar-learning products *deliver lessons* and *build their
platform*, then extracting the *architecture and patterns* to inform OUR build. We are NOT
copying their code (closed-source anyway) or cloning their content/branding. The output is
understanding + a better spec/plan — not a copy.

## The method (5 steps)
1. **Separate the layers.** Every lesson platform has 3 distinct layers:
   - (a) *Content model* — how a lesson/exercise/chord is represented as data.
   - (b) *Delivery model* — how a learner moves through content (path, level, feedback loop).
   - (c) *Platform/build* — the tech stack and services that serve it.
   Tear each down separately; they rarely depend on each other.
2. **Clone the open-source analogs** (real code you can read) as build references. Closed-source
   incumbents can only be torn down at the UX/marketing layer — use the OSS repos for the *how*.
3. **Static read of the analogs:** schemas, data models, folder structure, dependency manifests
   (package.json / pyproject.toml). This tells you the *real* architecture, not the pitch.
4. **Market read of incumbents:** public sites, App Store pages, credible reviews. Extract lesson
   *delivery* mechanics and what they explicitly do / do NOT do.
5. **Find the gap = your moat.** Overlap across incumbents shows the commoditized layer; the
   absent layer is where differentiation lives.

## What was done this session (proof)
- Cloned open-source analogs to `C:\Users\The Yoda Trader\Desktop\guitar-research\repos\`:
  - `book-of-frets-x`  — schema-driven song/chord content (JSON Schema → generated pages)
  - `learnhouse`      — real LMS platform (Next 16 + React 19 + FastAPI + SQLModel + Postgres + Redis + Stripe + Sentry + pydantic-ai)
  - `react-guitar`    — interactive fretboard React component
  - `alphaTab`        — tablature/notation rendering engine
  - `reverse-engineering` — general RE resource index (methodology anchor)
- Read the actual schemas/models: `book-of-frets-x/project/schemas/*.json`,
  `learnhouse/apps/api/src/db/courses/{activities,blocks}.py`, `learnhouse/apps/api/pyproject.toml`.
- Market-read: Yousician, Fender Play, JustinGuitar, Simply Guitar (public sites + reviews).
- Cross-checked: does ANY incumbent use front-camera chord-shape verification? **No.**

## Reusable rule
When you reverse-engineer any product category: **clone the OSS analog, read its schemas,
then read the incumbent's UX. The OSS repo shows you HOW TO BUILD; the incumbent shows you
WHAT USERS EXPECT and WHERE THE GAP IS.**

================================================================
PART 2 — COMPETITOR TEARDOWN (top platforms)
================================================================
# Competitive Teardown — Top Guitar Lesson Platforms
Date: 2026-08-04 · Reverse-engineered for the Guitar School app spec/plan.

## Scope
Top 2-3 by reach + one bonus, plus what each does/does NOT do on lesson delivery and platform.
All four are closed-source; their *build* is inferred from public stack + UX. Open-source build
references are in `REVERSE_ENGINEERING_PLAYBOOK.md` (book-of-frets-x, learnhouse).

================================================================
## 1. YOUSICIAN  (audio-recognition leader)
================================================================
LESSON DELIVERY
- "Personal learning path": 10 levels, curricula authored by real music teachers.
- Thousands of lessons / exercises / videos; explore by topic and song, every level.
- Gamified: rewards, high scores, leveling up.
- **Real-time audio recognition**: listens via mic, gives instant feedback on pitch (accuracy)
  and timing. Adjustable tempo (slow down / speed up). Play-along.
- Cross-platform: iOS, Android, PC. No cables/mics required.
- 7-day Premium+ trial; subscription.

PLATFORM / BUILD (inferred)
- Proprietary on-device audio engine (pitch + onset detection). This is their core IP.
- Multi-platform native apps sharing one lesson-content pipeline.

WHAT THEY DO NOT DO
- **No front-camera / hand-tracking.** Feedback is ears-only. They never SEE your hands.
- No technique/pose correction — only "did you hit the right note at the right time."

LESSON UNIT (pattern to note)
- Bite-sized exercise → scored against expected note/timing → looped until mastered.

================================================================
## 2. FENDER PLAY  (structured video curriculum)
================================================================
LESSON DELIVERY
- **Forced structured onboarding**: quiz on skill level + genre → assigns a "Path."
- Hierarchy: **Path → Level → Course → Activity.** (e.g. Acoustic Path, Level 1, Course, Activity)
- Each Activity: video player with multi-cam views of teacher + hands, chords/tabs,
  downloadable tone presets.
- Concise lessons; structured progression; user can pick start level.
- Web + app unified experience.

PLATFORM / BUILD (inferred)
- Content-centric: long-form filmed video is the lesson unit. Light interactivity (tabs synced).
- Subscription (~$150/yr cited in reviews).

WHAT THEY DO NOT DO
- No real-time audio recognition of your playing (light/none).
- **No camera hand verification.**
- Video = filmed human (opposite of our "zero filmed footage" decision, spec §0).

================================================================
## 3. JUSTINGUITAR  (free, teacher-led, community)
================================================================
LESSON DELIVERY
- Free, **grade-based curriculum**: Grade 1 → Grade 3+, each grade = modules/lessons.
- Video lessons (YouTube-hosted), practice routines, "Nitsuj" practice assistant.
- Companion app: day-by-day lessons, progress tracking, song app.
- Teacher-led (Justin Sandercoe); huge free library; paid app/books.

PLATFORM / BUILD (inferred)
- Low-tech: WordPress + YouTube + companion app. Content = long-form video + PDFs.
- App is mostly progress tracking, not interactive recognition.

WHAT THEY DO NOT DO
- **No interactive recognition at all** (audio or camera). App = tracking/progress only.
- Proof that a solo teacher + free content can scale to 2M+ users — but no feedback engine.

================================================================
## 4. SIMPLY GUITAR (JoyTunes)  — bonus, closest audio competitor
================================================================
LESSON DELIVERY
- "Place device in front of you and play; the app recognizes what you play; feedback to improve."
- Beginner-focused, adaptive; if a chord note buzzes/mutes it suggests arpeggiating to diagnose.
- Listen-and-recognize engine (ears-only), like Yousician but simpler.

WHAT THEY DO NOT DO
- Still **ears-only. No camera.** The "diagnose" is audio, not visual hand geometry.

================================================================
## THE GAP = OUR MOAT (confirmed by this teardown)
================================================================
Across ALL FOUR incumbents (teardown dated 2026-08-04):
  (a) Feedback is EARS-ONLY and REAL-TIME-DURING-PLAY (audio recognition as you play).
  (b) Content = filmed human video OR song tabs. None are synthetic/avatar-led at scale.
  (c) None verify CHORD SHAPE via hand geometry (front camera unused by all four).

================================================================
## (MOAT — CORRECTED 2026-08-05 — supersedes the framing above) [HISTORICAL: RETIRED by AMENDMENT-04 same day]
> ⚠️ **This entire MOAT section is HISTORICAL.** It describes the async record-a-take critique as "the
> actual v1 moat." That mechanic was **RETIRED 2026-08-05 by AMENDMENT-04** — the owner never committed
> to it. The current product is a **SEQUENCED LESSON APP** (free tuner+metronome, progressive avatar-led
> curriculum, streaks/adaptive practice). Do not treat anything in this section as the current moat. Keep
> only the durable competitor facts (no incumbent does async-unlimited critique; camera chord-shape is
> un-contested-but-deferred). See `02-spec/guitar-app-spec-AMENDMENT-04.md` + `guitar-app-first-20-lessons-2026-08-05.md`.

This teardown's original conclusion called the FRONT CAMERA "the entire bet / our moat."
That is **OUTDATED**. On 2026-08-04 (Amendment 01) the camera was deferred to v2 and the
v1 differentiator became **async record-a-take → audio critique (note accuracy, chord
correctness, timing) with confidence gating**, delivered same-day, unlimited.

WHY THE CAMERA IS NO LONGER THE v1 MOAT:
- Fretting fingers are self-occluded on phone video; barre chords are invisible; every
  published system that works restricts to ~5 chords or needs a depth sensor.
- A false "your finger is wrong" destroys trust in one session. Vision-for-chords is a
  v2 arm at best (scope order: posture → strumming → fretting), and is non-blocking — a v2
  consideration, not a gated v1 decision (the interview validation gate was retired 2026-08-05;
  the Reddit post is optional extra info, not validation).

THE ACTUAL v1 MOAT (open and un-contested as of 2026-08-05):
- Incumbents (Yousician, Simply, Fender, Justin, Gibson) give feedback **in real time while
  you play**. NONE offer an **async recorded-take critique you can submit and get back same
  day, as many times as you want**, with explicit confidence honesty ("not sure, play again")
  instead of a false red X.
- Our accuracy claim ("accurate when theirs isn't") rests on a DIFFERENT mechanism, not the
  camera: we do CONSTRAINED matching against the known target chord + tempo (basic-pitch/
  librosa vs the exercise's fixed MIDI grid). Open-ended transcription ~50% accurate industry-
  wide — we never do it (spec/AGENTS hard rule). This must be PROVEN by a tech spike before
  the build (see HANDOVER.md gap I).
- Pickup Music (1 video/week, ~1 week to grade) and TrueFire ($39/exchange) ration feedback;
  we make it unlimited + same-day. That async-unlimited positioning is the wedge.

NEW ENTRANT NOT IN THE ORIGINAL TEARDOWN — Gibson App (added 2026-08-05):
- Gibson App (gibson.app) launched 2021; pitches as "best guitar app 2026" in direct
  comparison to Yousician/Fender/Simply/Justin. Real-time mic feedback, AI personalised
  post-session reports, ~270 tracked skills, built-in amp/effects, licensed songs, artist-
  taught lessons. Price ~$19.99/mo or $129.99/yr. Claims 100,000+ users / 4.6★ (10K+ ratings).
- Threat: Gibson is the closest thing to a full-featured incumbent and its "AI personalised
  report" is adjacent to our async-critique idea — but it is still REAL-TIME-in-app, not
  async record-a-take submission. Our wedge (async + unlimited + confidence honesty) still
  holds. Full teardown: `03-research/competitors/gibson-app-teardown-2026-08-05.md`.

DO NOT let a business reading this file build the camera-first product. The v1 bet is the
async audio critique. The camera is a deferred, confidence-gated, non-blocking v2 arm.

## Threats / what to respect
- Yousician's audio engine is mature; do NOT claim audio parity at v1. Scoping pitch/timing to
  on-device basic-pitch (CoreML) per spec §5 is the right call.
- Fender's "forced onboarding → path" improves completion; we can borrow the *structure*
  (Level→Lesson→Exercise) without the genre sprawl (we're beginner-acoustic only).
- JustinGuitar proves free/top-of-funnel + teacher trust scales — reinforces our free
  tuner+metronome funnel (spec §2/§3).

## Open-source build references (cloned, on disk)
`C:\Users\The Yoda Trader\Desktop\guitar-research\repos\`
  - book-of-frets-x : schema-driven song/chord content — the content-model pattern to steal.
  - learnhouse      : full LMS platform architecture — the platform pattern to study.
  - react-guitar    : interactive fretboard component.
  - alphaTab        : tablature/notation rendering.
See `PLATFORM_BUILD_ANALYSIS.md` for how these map to our build.

================================================================
PART 3 — PLATFORM BUILD ANALYSIS (architecture → our build)
================================================================
# Platform Build Analysis — Reverse-Engineered Architecture → Our Build
Date: 2026-08-04 · Derived from cloned OSS analogs + incumbent teardown.

This extracts the *how they build it* patterns and maps each to OUR guitar app spec
(`Desktop/guitar-app-spec.md`). Where the spec already agrees, we confirm. Where there's a gap,
we recommend an addition.

================================================================
PATTERN A — CONTENT-AS-DATA (from book-of-frets-x)
================================================================
WHAT THEY DO
- Every song is JSON validated by JSON Schema (`project/schemas/song.schema.json`):
  version, contributors, chordIDs, strumms (D/U/- patterns), sections{name,times,entries},
  order, res (source links). Chords index stores per-string frets.
- Pages are GENERATED from data via `project/tools/song/astro/generate_all_song_pages.py`.
  SINGLE SOURCE OF TRUTH → rendered many ways (web, PDF, themes).
- Sample (`public/songs/as-it-was/config.json`): chordIDs ["Dsus2","Bm7","E","A"],
  strumms as beat arrays, sections with renderer+data.

MAPS TO OUR BUILD
- Your `guitar-lesson-01-faster-chord-changes.json` already follows this exact shape
  (lesson → chords → pivot_points → exercises → coaching → qa_block). **This is correct.**
- Recommendation: formalize a JSON Schema for lessons/exercises/chords (like book-of-frets)
  and treat the curriculum as data the app RENDERS — not hardcoded screens.
- The app renders: 2D fretboard diagrams (react-guitar / alphaTab pattern), avatar coaching
  copy (from `avatar_coaching_copy`), drills (from `exercises[]`). Provably correct by
  construction — matches spec §4 (data-driven diagrams, no animated hands).

================================================================
PATTERN B — FLEXIBLE CONTENT BLOCKS (from learnhouse)
================================================================
WHAT THEY DO
- Hierarchy: Course → Chapter → Activity → Block.
- `Activity.content` and `Block.content` are **JSON/JSONB dicts** (not rigid columns).
  Activity types: VIDEO, DOCUMENT, DYNAMIC, ASSIGNMENT, CUSTOM, SCORM.
- `AIGeneration` table stores (prompt → artifact) — i.e. LLM-generated content is a first-class,
  versioned record.

MAPS TO OUR BUILD
- Do NOT hardcode lesson screens. Define a Lesson/Exercise/Drill schema (Pattern A) + a
  renderer per `app_feature_mapping` type (pitch/timing, camera-check, metronome, adaptive).
- Your lesson JSON's `app_feature_mapping` field already does this mapping — keep + formalize.
- LLM coaching endpoint (spec §5: practice summary in → coaching text out) mirrors learnhouse's
  `AIGeneration` pattern. Add: store generated coaching copy against the lesson + user session
  for QA review (spec §6 needs the guitarist to review AI output).

================================================================
PATTERN C — STRUCTURED PROGRESSION HIERARCHY (from Fender Play)
================================================================
WHAT THEY DO
- Path (genre/instrument) → Level → Course → Activity. Forced onboarding quiz → assigns Path.
  User can pick start level.

MAPS TO OUR BUILD
- Adopt: **Level → Lesson → Exercise** progression with adaptive difficulty (spec §3).
- Onboarding: a 1-tap skill/goal question (borrow Fender's structure) — but we're beginner-
  acoustic only, so keep it minimal (no genre Path sprawl).
- Streaks / practice logging (spec §3) = the retention substitute for Fender's "path progress."

================================================================
PATTERN D — REAL-TIME FEEDBACK LOOP (from Yousician / Simply)
================================================================
WHAT THEY DO
- Mic capture → on-device pitch/onset detection → compare to expected note/timing → score →
  loop. Adjustable tempo. (Ears-only.)

MAPS TO OUR BUILD
- Audio arm: on-device basic-pitch (CoreML) per spec §5. Scope to pitch/timing only (correct).
- **Camera arm (novel):** MediaPipe Hands (21 landmarks) → small on-device chord classifier →
  binary "shape X yes/no" + one hint. This is the layer NO incumbent has. It is the moat and
  the risk (spec R1/R3/R4) — a v2 consideration, not gated by a v1 step (the interview gate was
  retired 2026-08-05; the Reddit post is optional extra info, not validation).

================================================================
PATTERN E — PLATFORM STACK OPTIONS (from learnhouse)
================================================================
WHAT THEY DO (learnhouse stack, read from pyproject.toml + package.json)
- Web: Next 16 + React 19 + Tailwind 4 + TanStack Query.
- API: FastAPI + SQLModel + Alembic + Postgres + Redis.
- Payments: Stripe. Observability: Sentry. LLM: pydantic-ai (openai/anthropic/google/mistral).
- Multi-tenant orgs, auth, billing, AI generations store.

MAPS TO OUR BUILD
- OUR spec chose **native iOS + Supabase + RevenueCat + Cloudflare Workers + PostHog + Sentry**
  (spec §5). That is the RIGHT call for an App Store funnel + solo dev — do NOT copy learnhouse's
  web/LMS stack. Copy its *discipline*: flexible JSON content model, LLM-as-a-record, clean
  separation of content vs platform.
- Note: learnhouse uses Stripe; we use **RevenueCat** for App Store IAP — correct (StoreKit edge
  cases, spec §5). Don't regress to Stripe for in-app subs.

================================================================
INTEGRATION CHECKLIST → SPEC / PLAN
================================================================
1. §5 (Architecture): add "Curriculum = JSON schemas (lesson/exercise/chord) as single source of
   truth; renderer-per-content-type." (Already nascent in L01 JSON — formalize + add a JSON Schema.)
2. §3 (Roadmap): add progression hierarchy Level→Lesson→Exercise with adaptive difficulty +
   1-tap onboarding (Pattern C).
3. §1 (Moat): add competitive confirmation — audited Yousician/Fender/JustinGuitar/Simply; none
   use camera; moat un-contested (Pattern D gap).
4. Build plan: add "Step 0 — content schema + renderer" BEFORE the lesson player (Pattern A/B).
   The lesson player just renders the JSON; building the schema first de-risks everything.
5. §6 (QA): store LLM-generated coaching against lesson + session for guitarist review
   (Pattern B AIGeneration pattern).

================================================================
PART 4 — REPO INVENTORY (proof of clones on disk) + DERIVED FILES
================================================================
Cloned to C:\Users\The Yoda Trader\Desktop\guitar-research\repos\  (all verified present, git cloned):
  - book-of-frets-x      — schema-driven song/chord content (JSON Schema → generated pages)
  - learnhouse           — real LMS platform (Next 16 + React 19 + FastAPI + SQLModel + Postgres + Redis + Stripe + Sentry + pydantic-ai)
  - react-guitar         — interactive fretboard React component
  - alphaTab             — tablature/notation rendering engine
  - reverse-engineering  — general RE resource index (methodology anchor)

Derived deliverables on Desktop (referenced by the playbook, for the spec/plan):
  - ..\guitar-app-spec.md        (262 lines) — spec with competitive RE folded into §11
  - ..\guitar-build-plan.md      (52 lines)  — execution plan enriched with RE insights
  - ..\guitar-lesson-01-faster-chord-changes.json — lesson content model (the schema to formalize)

This master file = consolidated copy of:
  COMPETITOR_TEARDOWN.md + PLATFORM_BUILD_ANALYSIS.md + REVERSE_ENGINEERING_PLAYBOOK.md
kept here so all collected research lives in one durable artifact.
