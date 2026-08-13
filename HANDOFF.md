# HANDOFF — GuitarApp (current state, re-synced 2026-08-13)

Single source-of-truth pointer file (per owner preference). The current TRUTH is:
`02-spec/FEATURES-LOCKED-v1-2026-08-07.md` + `PLAN-from-locked-spec-2026-08-07.md`,
the amendment chain through **AMENDMENT-11**, the live PWA in `07-app/`, and this file.

> This file was RE-WRITTEN on 2026-08-13. The prior version was frozen at the Aug-8 PWA spike
> and did NOT reflect AMENDMENT-09/10/11, the Godot story-world, or the practice-engine (Aug 12).
> Dated session handoffs are archived under `HANDOFF-ARCHIVE/` — they are history, not current state.

## VERIFIED STATE RIGHT NOW (re-run 2026-08-13, real output)
| Gate | Command | Result |
|---|---|---|
| PWA engine fidelity | `cd 07-app/test && node fidelity.mjs` | **48/0** |
| PWA app smoke | `cd 07-app/test && node app-smoke.mjs` | **20/0** |
| PWA SW cache (no stale-phone break) | `cd 07-app && node verify-sw-cache.mjs` | **4/0** |
| Chord arithmetic (shipping 23-lesson set) | `cd 06-prototypes/step0 && node run-chord-check.js` | **23 lessons / 71 chords / 0 err / 0 warn** |
| Practice engine (node) | `cd 06-prototypes/practice-engine && node practice-engine.test.mjs` | **17/0** |
| F7 band (gate) | `cd 06-prototypes/step7-extra && node verify-band.js` | 31/0 (proven clean) |
| F10 voice (gate) | `cd 06-prototypes/step7-extra && node verify-voice.js` | present, green (was MISSING before; built Aug 9–12) |
| RevenueCat | `cd 06-prototypes/step7 && node verify-step10-revenuecat.js` | 43/0 stub (owner-blocked on live keys) |

All prototype gates (step0..step9, F7, F10, practice-engine) re-run GREEN. Working tree
managed via git; commit as you go.

## WHAT EXISTS (as of 2026-08-13)
- **Live PWA: `07-app/`** — installable on iOS Safari + Android Chrome. Runs the proven engines
  via Web Audio + mic + Web Speech. Engine layer stays SDK-agnostic for a later native rewrite.
  Detail in `07-app/HANDOFF-07app.md`.
- **Spec + 11 amendments** (`02-spec/`), appendix chain ending at **AMENDMENT-11** (world-locked
  teacher + longitudinal student memory + teacher–student duet; the product thesis, with redlines).
- **20 authored lessons** in `05-content/guitar-lesson-*.json` (authoring source) → shipped as
  `07-app/content/lessons/guitar-lesson-01..23.json` (23 = 20 spine + L21 Holding the Pick,
  L22 Em↔C switch, L23 first 3-chord song).
- **Practice engine** (`06-prototypes/practice-engine/`): 30/60 weak-pair review + longitudinal
  memory moat. Generates `07-app/content/practice/*.json` (29 pair drills) via
  `05-content/scripts/generate-practice-lessons.mjs`.
- **Style packs**: `07-app/content/packs/blues` (T4), `country` (T5).
- **Godot story-world** (`07-app/godot/`, MIT): `project.godot` + World/LessonScene/FingeringOverlay
  scenes. NOT run-executed here (Godot not installed) — owner opens in Godot 4.7.x.
- **Teacher roster**: `07-app/content/teachers/T1..T3.json` + `T4`(blues)/`T5`(country) in packs.
- **Audio voice clips**: `07-app/audio/l02-voice/*.wav` (Lesson 2 spoken coach; ~16MB).

## CONTENT FLOW (single source → generate → ship)
```
05-content/guitar-lesson-*.json        <- AUTHORING SOURCE (20 teaching lessons) + VOICE-GUIDE.md
   │  (manually promoted)              <- edit here, then sync to 07-app/content/lessons/
   ▼
07-app/content/lessons/               <- SHIPPING COPY (23 lessons) — what the PWA loads
   │
05-content/scripts/generate-practice-lessons.mjs  <- reads 05-content, WRITES:
   ▼
07-app/content/practice/*.json        <- GENERATED practice drills (do not hand-edit; regenerate)
07-app/content/practice/index.json    <- practice manifest
```
**Rule:** lessons are authored in `05-content/` then promoted to `07-app/content/lessons/`.
Practice drills are GENERATED (never hand-edited) — rerun the generator after editing source lessons.
`05-content/practice/` was a stale, ungenerated duplicate and has been DELETED (2026-08-13).

## KEY CARRY-FORWARD (open items)
1. **Content sync drift**: L01/L02 already differ between `05-content` and `07-app/content/lessons`
   (authoring added a Chatterbox/TTS note the shipping copy lacks). Re-sync before next content pass.
2. **RevenueCat live keys** — build is code-complete in stub mode; needs `appl_…`/`goog_…` public
   keys to flip live. (NOT `sk_` secrets.)
3. **Real-guitar mic calibration** — logic proven, in-room sign-off still pending.
4. **Godot run-execution** — static-verified only; needs Godot 4.7.x on owner's machine.
5. **Teacher art** — generator locked to FLUX.1[schnell] (Apache-2.0) + Qwen-Image; license-gated in
   `07-app/core/asset-job.js`. Freelance-vs-AI-stills = art-direction call, not generator choice.
6. **No YouTube channel name/handle yet.**

## CONVENTIONS (unchanged, enforced)
- Addy Osmani: spec→plan→build→test→review→simplify→ship. Never skip.
- Free tier STRICT: tuner + metronome + L01 only (`FEATURE_TIER` in `07-app/core/entitlementStore.js`).
- Verification is ARITHMETIC, not human. No "unverified" warning boxes.
- Hostile re-review mandatory before "done".
- License blocklist is COPYRIGHT LAW (Rule 9), survives every amendment. Chatterbox = shipping voice.
- New decisions → new `02-spec/guitar-app-spec-AMENDMENT-NN.md`; never rewrite the base spec.
