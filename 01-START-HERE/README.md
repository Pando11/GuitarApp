# 01-START-HERE — GuitarApp

**The acoustic guitar-lesson PWA (iOS + Android, one codebase).**

Start here. Read this before touching anything.

## Current truth

- **Latest amendment:** `02-spec/guitar-app-spec-AMENDMENT-18.md` (Fun-Delivers-Learning: six build items + de-risk slice) — **RATIFIED 2026-08-29**.
- **Previous amendments** (described in AGENTS.md §Hard rules, §Amendment chain; their individual files did not survive the PC transfer):
  - AMENDMENT-01 through AMENDMENT-16 are referenced in `AGENTS.md` as current truth.
  - AMENDMENT-18 (Fun-Delivers-Learning, 2026-08-29) is the latest word and is RATIFIED.
  - AMENDMENT-17 (World 1 teacher + performance ladder, 2026-08-29) is RATIFIED and current on World 1.
  - AMENDMENT-16 (PocketBase backend, 2026-08-16) is the latest backend word.
  - AMENDMENT-15 (curriculum re-sequence + ordering gate, 2026-08-14) is the latest curriculum word.
  - AMENDMENT-11 (product thesis: world-locked teacher + longitudinal student memory + teacher–student duet, 2026-08-11) is the product thesis.
- **What's built (re-verified on disk 2026-08-29):**
  - PWA engine fidelity: **PLACEHOLDER** — `07-app/test/fidelity.mjs` is a PC-transfer scaffold; exits 0 but does no real CJS↔ESM comparison. Cannot re-prove 48/0 on this machine. (48/0 was the verified truth on the build machine 2026-08-16.)
  - App smoke: **RED** — `app-smoke.mjs` reads `manifest.lessons` but `manifest.json` uses `files` (25 entries). Schema mismatch → `expected 25, got 0`. The 25 lessons ARE present and correct; the test expectation is stale. Owner decision required (rename key or fix test).
  - SW cache: **GREEN** (0 errors; 2 checks — CACHE constant + version — vs the historical 4/0).
  - Chord arithmetic (25 lessons / 81 chords): **GREEN** 0 err / 0 warn ✅
  - Practice engine: **GREEN** 17/0 ✅
  - Curriculum ordering gate: 25 lessons / 0 errors ✅
  - F7 band: 31/0 ✅
  - F10 voice: present, green ✅
  - RevenueCat: 43/0 stub ✅

## Reading order

1. `AGENTS.md` — hard rules + amendment chain (ALWAYS live; overrides everything below)
2. `02-spec/guitar-app-spec-AMENDMENT-17.md` — latest amendment (World 1 + performance ladder)
3. `docs/adr/` — decision records (0001 = sync, 0002 = practice delivery, 0003 = mystery mode, 0004 = the teacher, 0005 = teacher's memory three-layer)
4. `CONTEXT.md` — glossary
5. `PROPOSED-FEATURES.md` — master feature registry
6. `HANDOFF.md` — current state snapshot + gate results
7. The tree below — what exists and where

## Tree (as restored 2026-08-23 after PC transfer)

```
Desktop/GuitarApp/
├── 01-START-HERE/          ← this file
├── 02-spec/                ← AMENDMENT-17.md (latest; earlier amendment files did not survive transfer)
├── 05-content/             ← AUTHORING SOURCE (20 teaching lessons) — content JSONs present
│   ├── scripts/            ← generate-practice-lessons.mjs
│   └── VOICE-GUIDE.md
├── 06-prototypes/          ← working code — REAL on disk
│   ├── step0/schema/       ← chord-theory-check.js (CJS ship-gate copy)
│   ├── practice-engine/    ← 30/60 sensor + weak-pair review + listener-real + storage-adapter
│   └── step7-extra/        ← verify-band.js + verify-voice.js
├── 07-app/                 ← SHIPPING PWA — REAL (18 core modules, 25 lessons, 29 drills, 5 teachers)
│   ├── core/               ← app.js, chatEngine.js, chord-theory-check.js (ESM), asset-job.js,
│   │                       entitlementStore.js, drillSelector.js, listener-twin.js, listening-engine.js, …
│   ├── content/
│   │   ├── lessons/        ← 25 lesson JSONs (shipping copy, re-sequenced by AMENDMENT-15)
│   │   ├── practice/       ← 29 generated pair drills (DO NOT hand-edit; regenerate)
│   │   ├── packs/          ← blues/ (T4), country/ (T5)
│   │   ├── song-progressions/  ← 11 songs (SP01–SP11) + shapes (music accuracy verified 2026-08-14)
│   │   └── teachers/       ← T1..T5.json
│   ├── audio/l02-voice/    ← Lesson 2 spoken coach wavs (~16MB)
│   ├── godot/              ← Godot 4.x story-world scaffold (AMENDMENT-09) — REAL on disk (project.godot + lesson/ + world/)
│   │   ├── project.godot
│   │   ├── World/
│   │   ├── LessonScene/
│   │   └── FingeringOverlay/
│   ├── test/               ← fidelity.mjs (48/0), app-smoke.mjs (20/0), verify-sw-cache.mjs (4/0), asset-job.test.mjs
│   ├── assets/lessons/     ← Wan motion output (FLUX→Wan→Godot pipeline) — EMPTY (nothing generated yet)
│   ├── manifest.webmanifest
│   ├── service-worker.js   ← CACHE version constant — bump on every content change
│   └── app.js              ← PWA entry point
├── brand-references/
│   ├── emerald-hollow/     ← World 1 reference kit
│   └── worlds/             ← Elderwick example + world-brief-emerald-hollow-L1.md (World 1 brief, 2026-08-29)
├── tools/                  ← verify-curriculum-order.js, verify-song-progressions.js, resequence-curriculum.js
├── docs/
│   ├── adr/                ← 0001..0005 (decision records)
│   └── agents/             ← issue-tracker.md, triage-labels.md, domain.md
├── .scratch/               ← local tickets + work-in-progress
│   ├── practice-delivery/
│   └── teacher/
├── CONTEXT.md              ← glossary
├── PROPOSED-FEATURES.md    ← master feature registry
└── AGENTS.md               ← hard rules + amendment chain (ALWAYS live)
```

## What's REAL (verified on disk; 5-gate re-prove 2026-08-29: chord-check + practice-engine + sw-cache GREEN; fidelity + app-smoke are PC-transfer scaffolds, app-smoke RED)
The PC-transfer "everything is placeholder" claim is **false** for the shipping code and content — they are on disk. BUT two of the five test files (`fidelity.mjs`, `app-smoke.mjs`) are PC-transfer scaffolds: `fidelity.mjs` cannot re-prove 48/0 here, and `app-smoke.mjs` is currently RED (reads `manifest.lessons`; `manifest.json` uses `files`). The real gates that run live (chord-check, practice-engine, sw-cache) PASS. What survived and is real:
- `07-app/` — 18 real core modules (~1,900 lines), 25 lesson JSONs, 29 practice drills, 5 teacher JSONs, Godot scaffold (`project.godot` + `lesson/` + `world/`).
- `02-spec/` — AMENDMENT-01..18 (AMENDMENT-17 World 1 teacher + AMENDMENT-18 Fun-Delivers-Learning both RATIFIED).
- `docs/adr/` — 0001..0005. `brand-references/` — emerald-hollow + worlds.
- Gates that pass live: chord-check 25/81/0/0, practice-engine 17/0, sw-cache 0 errors. ⚠️ `fidelity.mjs` + `app-smoke.mjs` are PC-transfer scaffolds: fidelity cannot re-prove 48/0 on this machine; app-smoke is RED (manifest schema `files` vs test's `lessons`). curriculum-order / song-progressions results carried from BOARD_OPS_TRIAGE 2026-08-29 (PASS there).

**What is genuinely NOT built yet (the real gaps, not transfer loss):**
- `07-app/assets/` — EMPTY. Zero AI cinematic assets produced (FLUX/Wan/voice still need the RunPod pod).
- Longitudinal encrypted cross-device sync (ADR-0001 Layer 3) — local only so far.
- The "coaches forward" bridge (G1 / BI-7) — `teacher.js` still emits canned lines, not wired to `practiceStore.js` numbers.

## Operational state (the only non-decision facts worth a note)
- **Handoffs retired (2026-08-29):** all `HANDOFF*.md` files moved to `_RETIRED/handoffs/`. Decisions live in `02-spec/` + `docs/adr/`; this README + AGENTS.md are the live pointers. Don't recreate dated handoff files.
- **RunPod pod key is VALID (verified 2026-08-30):** `GET api.runpod.io/v2/pods/<id>` returns HTTP 200 and the live pod detail. The earlier "key expired (error 1010)" note was a transient proxy blip, NOT a dead key. Two REAL blockers were found instead (see below).
- **BLOCKER 1 — stale hard-coded proxy port:** `scripts/world-factory/pod_run.py` + `pod_shell.py` connected to `…-64412317.proxy.runpod.net`, but RunPod reassigns the Jupyter (8888) proxy port on every restart. **FIXED 2026-08-30:** both scripts now resolve the live port from the API at runtime (`_resolve_jupyter_port()`), so this can't go stale again.
- **BLOCKER 2 — container currently DOWN:** as of 2026-08-30 the pod lifecycle shows `status: RUNNING` but `runtime.status: None` and `containerStartedAt: None`, and the Jupyter proxy returns HTTP 404 (Cloudflare edge). The container is not serving. A `STOP` → `START` cycle is required to bring Jupyter back up (models persist on volume `6nvscrbt2s`). Confirm with `runtime.status == "running"` before assuming the pod is usable.
- **Production needs the pod:** the FLUX→Wan→Chatterbox→Godot pipeline runs ONLY on the rented GPU, not during student practice (practice is 100% on-device).

## How to use this
- Treat `02-spec/` + `docs/adr/` as the decision record. Treat `07-app/` code as real and current.
- Before asserting any file "exists," verify on disk: `ls`, `cat`, `test -s`. Prose can drift — the disk is truth.

## Re-sync note

When a new `02-spec/guitar-app-spec-AMENDMENT-NN.md` is written, update this README's "Current truth" section + `AGENTS.md` + `HANDOFF.md` pointers together. Don't let them drift.
