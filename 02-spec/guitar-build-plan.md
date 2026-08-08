# Guitar School App — BUILD PLAN (execution)
Date: 2026-08-04 · RE-ALIGNED 2026-08-05 to AMENDMENT-04 (record-a-take critique RETIRED).
Status: DRAFT. Product = SEQUENCED LESSON APP. No audio recording/grading; no camera in v1.

>> SUPERSEDED by AMENDMENT-04 (2026-08-05): the record-a-take audio critique is RETIRED, not
>> deferred. The build order below reflects a lesson app, not an audio-feedback service. The
>> earlier "STEP 3 audio critique" is deleted. License blocklist (Rule 3) still applies to any
>> future audio work, but no audio pipeline ships in v1.

## 0. Reverse-engineering inputs (done — see guitar-research/)
- Audited: Yousician, Fender Play, JustinGuitar, Simply Guitar (COMPETITOR_TEARDOWN.md).
- Cloned OSS build refs: book-of-frets-x, learnhouse, react-guitar, alphaTab.
- Lesson-ordering research (2026-08-05): `03-research/market/guitar-lesson-ordering-research-2026-08-05.md`.
- First-20 curriculum: `02-spec/guitar-app-first-20-lessons-2026-08-05.md`.

## 1. Goal (from spec §1/§2, AMENDMENT-04)
iOS app teaching absolute-beginner acoustic guitar. Avatar-led synthetic lessons in a correctly-sequenced
curriculum + free tuner/metronome funnel + progress/streaks/practice logging. $12/mo.
Bar: 1,000 engaged monthly users in 18 months (~$144K/yr, >90% margin).

## 2. Build order (lesson app; schema first)
STEP 0 — CONTENT SCHEMA + RENDERER
  - Define JSON Schemas: lesson, exercise, chord, pivot_point, coaching_copy, qa_block.
  - Build a lesson JSON → UI renderer (fretboard diagram, exercise player, coaching text).
  - Validate with `guitar-lesson-01-faster-chord-changes.json` as the first fixture.
STEP 1 — Free tuner + metronome (funnel front door, spec §3).
STEP 2 — Lesson player + avatar shell (Lottie/SwiftUI-Canvas, Amendment 03 §3).
STEP 3 — SEQUENCED CURRICULUM renderer + first 20 lessons (the core product; see first-20 doc).
STEP 4 — Progress / streaks / practice logging / adaptive review (retention engine).
STEP 5 — Subscriptions (RevenueCat, spec §5).
NOTE: camera/hand/posture is NOT a v1 step (AMENDMENT-04). Do not reintroduce recording-based features
without explicit owner go-ahead via a new amendment.

## 3. Platform / services (spec §5 — confirmed correct vs learnhouse)
iOS: Swift + SwiftUI · AVAudioEngine (tuner only) · AudioKitEX (tuner) · Lottie/SwiftUI-Canvas (avatar).
Backend: Supabase (Postgres+auth+storage+RLS) · RevenueCat (subs) · Cloudflare Workers (LLM
lesson/coaching content) · PostHog (funnels/retention) · Sentry (crash). Do NOT copy learnhouse's
web/LMS stack or Stripe-for-subs. NOTE: no audio-analysis pipeline in v1 (AMENDMENT-04).

## 4. Content pipeline (spec §6)
LLM generates curriculum/scripts/exercises/diagrams/coaching → contract guitarist QA
($40-60/hr, ~$200-500/mo). Store generated coaching per lesson+session for review (Pattern B).
Founder dogfoods as target-user (non-player flow test); guitarist is correctness test.

## 5. Reddit post (optional extra info, NO gate)
The "10 interviews / 30 days" validation gate is RETIRED (founder never agreed to interviews).
`04-validation/guitar-reddit-recruitment.md` is a discussion post we may put up for extra
context — what people liked/hated in other apps + $12/mo interest. It is OPTIONAL EXTRA INFO
ONLY: not a demand signal, validation, or go/no-go. Feedback-engine code is NOT gated on it
(AGENTS rule 7 — proceeds on owner go-ahead).

## 6. Risks (re-pointed to the lesson-app scope, AMENDMENT-04)
R1 Differentiation/retention risk if curriculum is poorly sequenced or thin → mitigated by the
  lesson-ordering research + first-20 plan (proven teacher order); keep the streak loop central.
R2 Content cost/QA throughput → guitarist QA is the real recurring cost (see content-cost model);
  hire/retain one reliable QA guitarist before scaling lesson velocity.
R3 App Store 3.1.2 subscription rejection → ship a visible weekly content cadence + free tuner/
  metronome; see `03-research/appstore/app-store-3.1.2-risk-2026-08-05.md`. (No audio service to
  lean on for "ongoing value" now — the ongoing value is the sequential curriculum + practice tools.)
R4 CAC/retention is the binding constraint (TAM is ample) — see TAM doc §4.

## 7. Next actions (ordered)
1. Decide teacher character art (FLUX.1[schnell] Apache-2.0 vs illustrator). 2. Hire/retain QA guitarist;
  start LLM curriculum + QA loop on the first 20 lessons. 3. Build Steps 0→5 above. 4. Revisit spec after
  first 50 beta users.
