# Spec — Practice-Delivery (from grill-with-docs, 2026-08-21)

Derived from a grill session on the §5.2 practice-lesson menu. Supersedes any
looser "build the practice screen" wording elsewhere; the **legal floor**
(Rules 5, 9, 2) and the §5.2 drill menu (locked in
`03-research/curriculum/CURRICULUM-AND-PRACTICE-STRUCTURE.md`) are unchanged.
See `docs/adr/0002-practice-local-first-store.md`.

## Problem Statement

The repo has the listening mechanic, the §5.2 drill menu (11 drills), a working
prototype at `06-prototypes/practice-engine/` (17/17 tests), and per-lesson
chord-pair JSONs at `07-app/content/practice/*.json`. What it does NOT have is a
**canonical, double-clickable `file://` practice UI** that runs those drills and
wires in the student-memory moat. This spec defines v1.

## Solution

Promote the prototype into the canonical form: canonical `drills/*.mjs` modules
wrapping the (untouched) engine-math, a root `practice-ui.html` that is fully
self-contained, and a generator that bakes the chord-pair JSONs inline so the
page needs no `fetch`.

### v1 scope (phased)

Ship **5 of the 11 §5.2 drills** that together exercise every pattern, stub the
other 6 as "coming soon" panels:

| # | Drill | Pattern | Listening? |
|---|-------|---------|-----------|
| 1 | One-Minute Changes | arithmetic gate (30/min advance, 60/min goal) | **YES** — listener counts actual changes; the gate is arithmetic, no human QA |
| 2 | Chord-Perfect | accuracy (place shape, fix buzz/mute) | **YES** — listener verifies chord + detects errors |
| 3 | Air Changes | retrieval (form whole shape in air) | **NO** — no guitar; physical/visual self-check |
| 4 | Weak-Pair Review | adaptive, driven by student memory (the moat) | **YES** — listener verifies the played chord |
| 5 | Muted Strum | rhythm (timing isolated from chord errors) | **YES** — listener checks tempo against the beat |

Stubbed (v2+): Tempo-Scaled Section Loop, Wait-To-Play, Anchor/Pivot, Spider
warm-up, Metronome Ladder, Count-Out-Loud. (Count-Out-Loud and the stubbed audio
drills follow the same listening-default rule — see "Listening split" below.)

### Architecture decisions (locked in grill)

- **Q2 — Promote, don't rebuild.** The engine-math files
  (`practice-loop.mjs`, `fluency-store.mjs`, `pair-key.mjs`,
  `one-minute-changes.mjs`, `listener-real.mjs`, `listener-sim.mjs`) live in
  `06-prototypes/practice-engine/` and are **imported, never edited** (hard rule).
  Each v1 drill is a new `drills/<drill>.mjs` that imports from them and returns
  the envelope `{drill, params, events, metrics, ratePerMin, score, passed, summary}`.
- **Q3 — Baked data, no fetch.** `scripts/generate-practice-ui.mjs` reads all
  `07-app/content/practice/*.json` and emits an inline `window.PRACTICE_DATA`
  global inside `practice-ui.html`. The page is self-contained and runs from
  `file://` with no network call.
- **Q4 — Listening is the default.** Any drill that produces a chord or strum is
  **listening-driven**; only drills with no guitar sound (Air Changes in v1) are
  silent. Owner corrected an earlier under-use of audio: counting and rhythm are
  *time*, and time is audio — a visual-only metronome cannot verify a student is
  actually on the beat. So 4 of the 5 v1 drills use the listener.
- **Q5 — Local-first store.** Weak-Pair Review reads/writes a device-local
  fluency store through `store.selectWeakest()` (ADR-0002). No sync in v1;
  converges to the ADR-0001 encrypted cross-device sync at app-shell ship.
- **Q6 — File layout.**
  - `drills/<drill>.mjs` (root, new) — the 5 canonical modules + `drills/<drill>.test.mjs`
  - `practice-ui.html` (root, new) — the double-clickable deliverable, inline
    mirrors per drill + baked `window.PRACTICE_DATA` + `#review-nudge`/`#storage-status`
  - `06-prototypes/practice-engine/*` — engine math, imported as-is
  - `scripts/generate-practice-ui.mjs` (new) — bakes JSON → inline global

## User Stories

1. As a student, I want to double-click one HTML file and practice drills for the
   chords I'm learning, so I can practice offline on any device with no install.
2. As a student, I want the app to *hear* my One-Minute Changes and tell me my
   real count (not ask me to count myself), so the 30/min gate means something.
3. As a student, I want Weak-Pair Review to bring back the chords I keep
   fumbling, so practice targets my actual weak spots.
4. As a student, I want a metronome/rhythm drill that checks I'm on the beat, so
   my timing actually improves.
5. As the owner, I want the practice page to be a single self-contained file
   (no server, no fetch), so a student's phone can open it from a shared drive.

## Hard constraints (from AGENTS.md — non-negotiable)

- `file://`-only deliverable. No localhost servers.
- ES `import` is CORS-blocked over `file://` → canonical logic in `.mjs` (Node
  tests) + **inline mirror** in the HTML. No external `<script type="module" src>`.
- Never edit the engine-math files. Build new modules; import FROM them.
- License blocklist applies — original code only, no external deps.
- Listening is on-device, audio never uploaded.

## Verification (per `guitarapp-practice-delivery` skill harness)

- `node --test "drills/*.test.mjs"` → 0 fail
- `python3 verify-ui.py` → "ALL UI CHECKS PASSED" (loads via file://, no console error)
- `grep -c "review-nudge" practice-ui.html` ≥ 1 and `grep -c "storage-status" practice-ui.html` ≥ 1
- Pre-existing `node --test practice-engine.test.mjs` stays 17/17
