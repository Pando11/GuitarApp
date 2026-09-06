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

## Outputs in this folder
- `COMPETITOR_TEARDOWN.md`        — the top platforms, lesson delivery + platform, and the gap.
- `PLATFORM_BUILD_ANALYSIS.md`    — reverse-engineered architecture patterns → our build.
- (spec updated) `..\guitar-app-spec.md` §11 — competitive RE findings folded into the spec.
- (plan created) `..\guitar-build-plan.md` — execution plan enriched with RE insights.

## Reusable rule
When you reverse-engineer any product category: **clone the OSS analog, read its schemas,
then read the incumbent's UX. The OSS repo shows you HOW TO BUILD; the incumbent shows you
WHAT USERS EXPECT and WHERE THE GAP IS.**
