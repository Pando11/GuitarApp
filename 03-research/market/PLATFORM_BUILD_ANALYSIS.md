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
  the risk (spec R1/R3/R4) — the validation gate Q4/Q5 guards it.

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

See `REVERSE_ENGINEERING_PLAYBOOK.md` for method, `COMPETITOR_TEARDOWN.md` for the incumbents.
