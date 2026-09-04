# 01-START-HERE — GuitarApp

**The acoustic guitar-lesson PWA (iOS + Android, one codebase).**

Start here. Read this before touching anything.

## Current truth

- **Latest amendment:** `02-spec/guitar-app-spec-AMENDMENT-17.md` (ratified World 1 teacher Sage + first performance ladder)
- **Previous amendments** (described in AGENTS.md §Hard rules, §Amendment chain; their individual files did not survive the PC transfer):
  - AMENDMENT-01 through AMENDMENT-16 are referenced in `AGENTS.md` as current truth.
  - AMENDMENT-16 (PocketBase backend, 2026-08-16) is the latest backend word.
  - AMENDMENT-15 (curriculum re-sequence + ordering gate, 2026-08-14) is the latest curriculum word.
  - AMENDMENT-11 (product thesis: world-locked teacher + longitudinal student memory + teacher–student duet, 2026-08-11) is the product thesis.
- **What's built (per HANDOFF.md, 2026-08-16 — re-verified GREEN):**
  - PWA engine fidelity: 48/0 ✅
  - App smoke: 20/0 ✅
  - SW cache: 4/0 ✅
  - Chord arithmetic (25 lessons / 81 chords): 0 err / 0 warn ✅
  - Practice engine: 17/0 ✅
  - Curriculum ordering gate: 25 lessons / 0 errors ✅
  - F7 band: 31/0 ✅
  - F10 voice: present, green ✅
  - RevenueCat: 43/0 stub ✅

## Reading order

1. `AGENTS.md` — hard rules + amendment chain (ALWAYS live; overrides everything below)
2. `02-spec/guitar-app-spec-AMENDMENT-17.md` — latest amendment (World 1 + performance ladder)
3. `docs/adr/` — decision records (0001 = sync, 0002 = practice delivery, 0003 = mystery mode, 0004 = the teacher)
4. `CONTEXT.md` — glossary
5. `PROPOSED-FEATURES.md` — master feature registry
6. `HANDOFF.md` — current state snapshot + gate results
7. The tree below — what exists and where

## Tree (as restored 2026-08-23 after PC transfer)

```
Desktop/GuitarApp/
├── 01-START-HERE/          ← this file
├── 02-spec/                ← AMENDMENT-17.md (latest; earlier amendment files did not survive transfer)
├── 05-content/             ← AUTHORING SOURCE (20 teaching lessons) — PLACEHOLDERS, real files lost in transfer
│   ├── scripts/            ← generate-practice-lessons.mjs — PLACEHOLDER
│   └── VOICE-GUIDE.md      ← PLACEHOLDER
├── 06-prototypes/          ← working code — PLACEHOLDERS, real files lost in transfer
│   ├── step0/schema/       ← chord-theory-check.js (CJS ship-gate copy)
│   ├── practice-engine/    ← 30/60 sensor + weak-pair review + listener-real + storage-adapter
│   └── step7-extra/        ← verify-band.js + verify-voice.js
├── 07-app/                 ← SHIPPING PWA — PLACEHOLDERS, real files lost in transfer
│   ├── core/               ← app.js, chatEngine.js, chord-theory-check.js (ESM), asset-job.js,
│   │                       entitlementStore.js, drillSelector.js, listener-twin.js
│   ├── content/
│   │   ├── lessons/        ← 25 lesson JSONs (shipping copy, re-sequenced by AMENDMENT-15)
│   │   ├── practice/       ← 29 generated pair drills (DO NOT hand-edit; regenerate)
│   │   ├── packs/          ← blues/ (T4), country/ (T5)
│   │   ├── song-progressions/  ← 10 songs + 11 shapes (music accuracy verified 2026-08-14)
│   │   └── teachers/       ← T1..T5.json
│   ├── audio/l02-voice/    ← Lesson 2 spoken coach wavs (~16MB)
│   ├── godot/              ← Godot 4.x story-world scaffold (AMENDMENT-09)
│   │   ├── project.godot
│   │   ├── World/
│   │   ├── LessonScene/
│   │   └── FingeringOverlay/
│   ├── test/               ← fidelity.mjs (48/0), app-smoke.mjs (20/0), verify-sw-cache.mjs (4/0), asset-job.test.mjs
│   ├── assets/lessons/     ← Wan motion output (FLUX→Wan→Godot pipeline)
│   ├── manifest.webmanifest
│   ├── service-worker.js   ← CACHE version constant — bump on every content change
│   └── app.js              ← PWA entry point
├── brand-references/
│   └── emerald-hollow/     ← World 1 reference kit (SURVIVED transfer)
├── tools/                  ← verify-curriculum-order.js, verify-song-progressions.js, resequence-curriculum.js
├── docs/
│   ├── adr/                ← 0001..0004 (decision records)
│   └── agents/             ← issue-tracker.md, triage-labels.md, domain.md
├── HANDOFF.md              ← current state snapshot
├── HANDOFF-ARCHIVE/        ← dated session handoffs (history, not current state)
├── .scratch/               ← local tickets + work-in-progress
│   ├── practice-delivery/
│   └── teacher/
├── CONTEXT.md              ← glossary
├── PROPOSED-FEATURES.md    ← master feature registry
└── AGENTS.md               ← hard rules + amendment chain (ALWAYS live)
```

## What's REAL vs PLACEHOLDER

After the PC transfer (2026-08-23), only the 7 root-level files + `brand-references/emerald-hollow/` + `docs/adr/` survived. Everything under `05-content/`, `06-prototypes/`, `07-app/`, `tools/`, `01-START-HERE/`, `HANDOFF-ARCHIVE/`, `docs/agents/` is a **scaffold placeholder** — the directory exists, a stub file marks what was there, but the actual code/content did not survive.

**Real (survived):** `02-spec/guitar-app-spec-AMENDMENT-17.md`, `AGENTS.md`, `CONTEXT.md`, `docs/adr/0001/0002/0004`, `HANDOFF.md`, `PROPOSED-FEATURES.md`, `brand-references/emerald-hollow/*`, `.scratch/teacher/*`.

**Placeholder (re-scaffolded from spec descriptions):** everything else. The scaffold marks filenames + purpose so we know what to re-author or restore. See `HANDOFF.md` §VERIFIED STATE for what the real files proved (gate results) — that truth is intact even though the files are gone.

## How to use this

- Treat every file under `05-content/`, `06-prototypes/`, `07-app/`, `tools/` as **PLACEHOLDER** until re-authored or restored from backup.
- The spec (`02-spec/`) + skill (`software-development/guitarapp`) describe what each file does — use those to re-author.
- Before asserting any directory or file "exists" and has content, verify on disk: `ls`, `cat`, `test -s`.
- The install-state gotcha applies: prose (HANDOFF.md, AGENTS.md) may claim a full tree that isn't on disk. Verify before trusting.

## Re-sync note

When a new `02-spec/guitar-app-spec-AMENDMENT-NN.md` is written, update this README's "Current truth" section + `AGENTS.md` + `HANDOFF.md` pointers together. Don't let them drift.
