# PLAN — AI Guitar Lessons App + YouTube Channel → $4,500/mo

Date: 2026-08-07 · Owner: Heidi Hendrickson · Status: PLAN — awaiting go-ahead
Lives at: `Desktop/GuitarApp/02-spec/PLAN-app-plus-youtube-4500-2026-08-07.md`
Builds on: Amendments 01–04 (current truth), `guitar-app-first-20-lessons-2026-08-05.md`,
`03-research/competitors/competitive-moat-2026-08-05.md`.

---

## 0. ONE-PARAGRAPH VERSION (plain English)

We build an iPhone app that teaches total beginners acoustic guitar, using short movie-like
animated lessons instead of filmed human teachers. An AI "lesson director" picks the camera
angles, backgrounds, and pacing for each lesson; the fretboard diagrams are always drawn by
code from verified data so a wrong fingering can never be shown. A friendly cartoon coach
(with a real AI voice) talks the student through it. A YouTube channel publishes free
"teaser" lessons made with the exact same pipeline — each video ends with "the full 20-lesson
path, the tuner, the metronome, and your streak tracker are in the app, $12/month." YouTube
is the free billboard; the app is the store. Goal: **375 paying subscribers × $12 = $4,500/mo.**

---

## 1. THE MONEY MATH (how $4,500/mo actually happens)

App Store takes 30% year one, 15% after (or 15% from day one under the Small Business Program
— we enroll, so assume 15%). To **net** $4,500/mo we need about **$5,300/mo gross ≈ 440
subscribers at $12**. Round target: **450 paying subscribers.**

Funnel, using honest beginner-app numbers:

| Stage | Rate | People |
|---|---|---|
| YouTube views / month (steady state) | — | 100,000 |
| Click through to app page | 2% | 2,000 |
| Install free tuner/metronome | 50% | 1,000 |
| Start free trial of lessons | 20% | 200 |
| Convert to paying | 35–40% | ~75–80 new subs/mo |

At ~77 new subscribers/month and normal churn (~6%/mo), the subscriber count crosses **450 in
about 8–9 months** of steady publishing. That's the realistic path — not month 1. A
100k-views/mo guitar-teaching channel is very achievable: JustinGuitar and Andy Guitar built
multi-million-subscriber channels on exactly this content, and both still rank for every
beginner search because demand is endless (~1.5M people pick up guitar each year in the US
alone; "guitar lessons for beginners" is searched ~40k times/mo).

Secondary revenue the same content produces without extra work:
- YouTube ad revenue once monetized (1k subs + 4k watch-hours): ~$300–800/mo at 100k views.
- Affiliate links (tuners, capos, beginner guitars): ~$100–300/mo.
So even at 70% of plan, the combined number lands near the goal.

**Why $12/mo is right (already locked in the spec):** Yousician is $19.99/mo, Fender Play
$12.99, Simply Guitar $14.99. One clean price, no tiers — part of the wedge.

---

## 2. WHAT THE APP IS (recap of locked decisions)

Per Amendments 01–04 — these are settled, not re-opened:

- **iOS only, acoustic only, $12/mo.** Free tuner + metronome is the front door.
- **v1 is a sequenced lesson app.** No recording, no audio grading, no camera. The product
  is the *correctly-ordered curriculum + avatar-led delivery + streaks*, not a recorder.
- **20-lesson beginner path already written** (`guitar-app-first-20-lessons-2026-08-05.md`):
  first 2-chord song by Lesson 3, full open-chord set by Lesson 10, real strumming patterns
  by 12, fingerpicking intro by 18.
- **One cartoon coach.** AI voice = OpenAI TTS (~$0.36 per lesson's lines — pennies).
- **All music content QA'd by a contracted guitarist** — non-negotiable, because you can't
  verify fingerings yourself and one viral "this app taught me wrong" screenshot is fatal.
- **No song library** (licensing = existential risk). Exercises and public-domain only.

## 3. HOW AI IS THE HEART OF IT (this is the part you asked for)

This is the "age of AI" pipeline from Amendment 03, and it's genuinely different from every
competitor — they all film humans or ship game-y note-highways. Ours:

1. **Every lesson starts as data, not video.** A small JSON file: which chord, what tempo,
   the coaching script, the mood.
2. **An AI "Lesson Director"** reads that JSON and chooses the shots, camera moves, and
   backgrounds from a curated library — like a film director planning a scene — and writes
   a scene plan.
3. **AI image models** (FLUX / Qwen — free, open-license, no subscriptions) paint the
   backgrounds and atmosphere: golden-hour studio, midnight practice room, greenroom.
   Three of these are already generated and sitting in the prototypes folder.
4. **The animation engine** (GSAP on web, SwiftUI in the app) moves the camera, fades
   scenes, and animates the coach — deterministically, from the plan.
5. **The fretboard is drawn by code from verified chord data. Always.** No AI ever draws
   fingers. This is the one hard rule that keeps the product honest — AI is brilliant at
   atmosphere and terrible at finger positions, so each does what it's good at.
6. **The coach speaks** with an AI voice, lip-synced.

What this means for you, practically: **a new lesson costs hours, not a film shoot.** No
camera, no studio, no editor. And every YouTube video below is made with this same machine —
so the marketing and the product are literally the same content factory.

## 4. THE YOUTUBE CHANNEL (the funnel)

**Concept:** *"Learn guitar with [Coach Name]"* — short, beautiful, genuinely useful
beginner lessons, each 3–6 minutes, each one a real lesson from the app's curriculum.

- **Cadence:** 2 videos/week for the first 6 months (lessons 1–20 = 10 weeks of core content,
  then technique one-offs: "why your chord buzzes," "the 1-minute chord-change drill").
- **Format:** the exact lesson-player output, exported as video (the pipeline renders to
  screen; we record the render — no extra tooling).
- **Every video:** pinned comment + end card → "Free tuner + metronome, and the full
  step-by-step path: [app link]."
- **SEO reality:** beginner guitar searches are evergreen and huge. We target the long tail
  first ("em chord keeps buzzing," "how to change chords faster") where a small channel can
  actually rank, then the big terms as authority builds.
- **Shorts:** each lesson yields one 45-second vertical cut (a single tip + fretboard
  close-up). Shorts are the discovery engine; long-form does the converting.
- **Honest expectation:** channels in this niche typically take 3–5 months to reach
  consistent 4-figure weekly views. The plan's math assumes steady state at month ~6.

**Channel rules:** the coach character is the face (never you on camera — consistent with the
no-filmed-humans product decision). All fingerings shown come from the same QA'd data as the
app. No copyrighted songs — teach the chord *concepts*, use public-domain examples.

## 5. WHAT GETS BUILT, IN WHAT ORDER

Same build order as Amendment 04 §5, with the channel slotted in:

| Phase | Deliverable | When |
|---|---|---|
| 0 | Lesson-JSON schema + renderer (exists as prototype; harden it) | Weeks 1–2 |
| 1 | **Lesson #1 end-to-end through the full AI pipeline** (director → AI background → animation → TTS voice → fretboard) as both an app screen AND a YouTube video | Weeks 2–4 |
| 2 | Free tuner + metronome app shell (AudioKitEX) | Weeks 3–6 |
| 3 | YouTube channel live; publish L1–L4 (Phase 1 of curriculum) | Weeks 4–8 |
| 4 | Lesson player + avatar in-app; lessons 1–10 authored & QA'd | Weeks 6–12 |
| 5 | Streaks / progress / practice logging | Weeks 10–14 |
| 6 | Subscriptions (RevenueCat) + paywall; lessons 11–20 | Weeks 12–16 |
| 7 | Public launch: 20 lessons, 12–16 videos live, trial on | Month 4–5 |

The single biggest risk (named in Amendment 03 and still true): **pipeline sprawl** — three
toolchains that must all work. That's why Phase 1 exists: prove one lesson through the whole
machine before authoring the rest.

## 6. WHAT IT COSTS

- Contracted guitarist QA: ~$50–75/lesson × 20 = **$1,000–1,500** one-time (the one real
  must-pay cost).
- OpenAI TTS: **< $10** for all 20 lessons.
- AI images: **$0** (open-license models, already generated on this machine).
- Apple developer account: $99/yr. RevenueCat: free tier covers us past first revenue.
- Animation stack: **$0** (GSAP free, Lottie free, SwiftUI native).
- Optional: freelance character artist for the coach's final design (~$300–800) OR keep the
  AI-generated character — decision still open (Amendment 02 §6).

**Total to launch: roughly $1,500–2,500, almost all of it the human QA.**

## 7. DECISIONS I MADE FOR YOU (override any)

1. **YouTube is the primary funnel**, not TikTok/ads — because the content is already made,
   and this niche's buyers search YouTube.
2. **Coach is the channel's face** — keeps product and marketing one consistent character.
3. **Launch target month 4–5** with the full 20-lesson path, not a drip — the "correctly
   sequenced path" IS the pitch; launching with 4 lessons undercuts it.
4. **No paid ads in the plan** — the funnel math works organically; ads are a later
   accelerator, not a foundation.
5. **Niche expansion ("takes them to a different niche")** — the same machine later teaches
   ukulele, then other instruments or skills; that's the post-$4.5k growth story, not v1.

## 8. WHAT I NEED FROM YOU (only 3 things)

1. **Go-ahead** on this plan (or tell me what to change).
2. **The coach**: do you want to pick the final character design now (I'll generate options),
   or after Lesson #1 is watchable?
3. **Channel name** — I'll propose 5 options with available handles if you want.
