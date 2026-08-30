Type: research  
Status: resolved  
Blocked by:  

## Findings — On Disk vs. Prose

### FLUX / Wan / Assets (AI pipeline)
| Item | Expected (prose) | On Disk | Verdict |
|------|------------------|---------|---------|
| `~/re/flux` — FLUX install dir | AMENDMENT-07 says FLUX.1[schnell] is the legal image gen; AMENDMENT-06 implies teacher asset pipeline | **MISSING** | absent — not needed for this map (wayfinder is app-scaffold + content; FLUX pipeline is a separate future ticket) |
| `~/re/wan` — Wan model dir | AMENDMENT-09 says Wan2.1-I2V motion + Godot story-world | **MISSING** | absent — not needed for this map |
| `assets/` — FLUX/Wan output dir | Should contain generated teacher/world assets if pipeline ran | **MISSING** | absent — pipeline never executed on this machine (consistent with FLUX/Wan dirs missing) |

### Voice Stack
| Item | Expected (prose) | On Disk | Verdict |
|------|------------------|---------|---------|
| `.venv-kokoro/Lib/site-packages/{kokoro,whisper,chatterbox}` | AMENDMENT-06 says Chatterbox = shipping voice; kokoro + whisper are the voice stack | **MISSING** — all three globs returned "No such file or directory" | absent — voice stack not installed on this machine; `.venv-kokoro` dir itself may not exist (probe couldn't even enter site-packages) |

### Godot
| Item | Expected (prose) | On Disk | Verdict |
|------|------------------|---------|---------|
| `command -v godot` | AMENDMENT-09 mentions Godot story-world; `07-app/godot/` scaffold exists | **NOT ON PATH** | absent — Godot engine not installed/concurrently available; scaffold tree exists but cannot be opened/run without Godot |

### 07-app/godot/ scaffold contents (deep probe — ticket asked for contents, not just existence)
```
07-app/godot/
├── data/
│   └── lesson_manifest.json          ✅ present
├── FingeringOverlay/                ⚠️ EMPTY (0 files)
├── LessonScene/                     ⚠️ EMPTY (0 files)
├── world/
│   ├── World.gd                     ✅ present
│   └── World.tscn                   ✅ present
├── lesson/
│   ├── FingeringOverlay.gd         ✅ present
│   ├── FingeringOverlay.tscn       ✅ present
│   ├── LessonScene.gd              ✅ present
│   └── LessonScene.tscn            ✅ present
├── worlds/
│   └── elderwick-market/
│       ├── world.config.json       ✅ present
│       └── world.gd                ✅ present
├── project.godot                   ✅ present
└── README.md                       ✅ present
```
**Note:** The three ticket-named subdirectories (FingeringOverlay/, LessonScene/, World/) are NOT all empty — World/ has content but FingeringOverlay/ and LessonScene/ at the top level are empty. The actual scene/script files live under `lesson/` (FingeringOverlay.gd/tscn, LessonScene.gd/tscn) and `world/` (World.gd/tscn). So the scaffold is present and wired, but the top-level dir names the ticket probed are decoys/empty — the real files are one level deeper. This is worth flagging: if AGENTS.md or spec describes `07-app/godot/FingeringOverlay/` as containing files, that's prose that doesn't match disk.

### Spec Amendments
| Item | Expected (prose) | On Disk | Verdict |
|------|------------------|---------|---------|
| `02-spec/ | grep -c AMENDMENT` | AGENTS.md lists AMENDMENT-01 through -16 + base spec; ticket expected 1 (AMENDMENT-17 only) | **18 files** (AMENDMENT-01 through -17, plus AMENDMENT-06-evidence-loop.md) | **present — verified** (the ticket's "known on disk" note was stale; the full amend tree DID survive the transfer) |

### ADRs
| Item | Expected (prose) | On Disk | Verdict |
|------|------------------|---------|---------|
| `docs/adr/` | Ticket expected 4 ADRs (0001–0004) | **4 files**: 0001-always-on-encrypted-sync.md, 0002-practice-delivery.md, 0003-mystery-mode.md, 0004-the-teacher-world-1-emerald-hollow.md | **present — verified** |

### 05-content/ tree
| Item | Expected (prose) | On Disk | Verdict |
|------|------------------|---------|---------|
| songs/ | Ticket expected songs/ present | **present** (song-seed-S1-em-easyc-first.md, song-seed-S2-four-chord-gdEmC.md, README.md) | **present — verified** |
| graduation doc | Ticket expected graduation doc | **present**: graduation-easyc-to-c.md | **present — verified** |
| scripts/ | Ticket expected scripts/ present | **present**: _adversarial.js, _step4-author.js, _step4-verify.js, generate-practice-lessons.mjs | **present — verified** |
| blues-pack/ | Not probed by ticket | **present**: 3 lesson JSONs + teachers/T4.json | present |
| country-pack/ | Not probed by ticket | **present**: 3 lesson JSONs | present |
| VOICE-GUIDE.md | Not probed by ticket | **present** | present |
| 20-group spine at top level | Ticket asked "songs/ + graduation doc?" | **NOT a top-level directory** — songs are under 05-content/songs/, lessons are individual JSON files at top level, not a numbered spine | present but organized differently than a "20-group spine" directory |

### Song Progressions (07-app/content/song-progressions/)
| Item | Expected (prose) | On Disk | Verdict |
|------|------------------|---------|---------|
| 10 songs + 11 shapes | AMENDMENT-12 says 10 song progressions + 11 shapes | **present**: progressions.json, shapes.json, chord-prereqs.json, song-progressions-preview.html | **present — verified** (gate confirms 11 songs in progressions.json + 11 shapes) |

### Lesson JSON Catalog (07-app/content/lessons/)
| Item | Expected (prose) | On Disk | Verdict |
|------|------------------|---------|---------|
| Lesson catalog present | AMENDMENT-15 says 25 lessons | **present**: 25 lesson JSON files + manifest.json = 26 entries | **present — verified** (gate confirms 25 lessons, filenames match canonical order) |

### Voice Audio (07-app/audio/)
| Item | Expected (prose) | On Disk | Verdict |
|------|------------------|---------|---------|
| Any voice audio present | AMENDMENT-06 says Chatterbox = shipping voice; audio should exist if voice was generated | **present**: l02-voice/ with 7 .wav files (l02-01-intro through l02-06-wrap + l02-full.wav + _check.wav), plus asr-proof.log, l02-gen.log, l02-regen.log | **present — verified** (one lesson's worth of voice audio — L02 — exists) |

### Core ESM Ports (07-app/core/)
| Item | Expected (prose) | On Disk | Verdict |
|------|------------------|---------|---------|
| chord-theory-check, chatEngine, drillSelector, etc. | AGENTS.md references chord-theory-check.js as the chord correctness gate; AMENDMENT-15/13 reference chatEngine, drillSelector | **present** (19 files): adaptivePlan.js, asset-job.js, band-engine.js, chatEngine.js, chord-canon.js, chord-theory-check.js, comeback.js, content-attribution.js, entitlementStore.js, listening-engine.js, messages.js, practiceStore.js, renderer.js, streaks.js, teacher.js, tuner-engine.js, voice-command.js, world-view-tracker.js | **present — verified** |

### 06-prototypes/ tree
| Item | Expected (prose) | On Disk | Verdict |
|------|------------------|---------|---------|
| practice-engine, step0, step7-extra, etc. | Ticket expected full tree | **present** (full tree confirmed): practice-engine/ (with drills/, storage-adapter, listener-real, etc.), step0/ (engine, schema, lessons, tests, run-chord-check.js), step2/ through step9/, step7-extra/ (band-engine, voice-command, verify-voice.js, etc.), animated-teacher-demo*.html, assets/, curriculum-review/, evidence-loop/, kanban, lesson-*.html, render-warm.js, verify-prototype-chords.mjs | **present — verified** |

### 03-research/
| Item | Expected (prose) | On Disk | Verdict |
|------|------------------|---------|---------|
| Exists? What's in it? | AGENTS.md §5 references `03-research/curriculum/CURRICULUM-AND-PRACTICE-STRUCTURE.md` as source of truth for owner-locked curriculum directives | **present** (full tree): ai-features-20-monetization-ideas.md, animation-voice/, appstore/, cloud-gpu-wan2.1.md, competitors/, COMPLAINTS-TO-FEATURES.md, curriculum/ (CURRICULUM-AND-PRACTICE-STRUCTURE.md + CURRICULUM-REVIEW-2026-08-12.md + raw-research + sources/), feedback-tech/, guitar-app-world-prototype-mobile.html, lesson-preview/ (with _clips/, fonts/, .mp4), market/, midjourney/ | **present — verified**. `03-research/curriculum/CURRICULUM-AND-PRACTICE-STRUCTURE.md` EXISTS. |

### Ship Gates — Results
| Gate | Expected | Result |
|------|----------|--------|
| `node tools/verify-song-progressions.js` | 0 errors AND 0 warnings | ✅ **PASSED** — 0 errors, 0 warnings. 11 songs in progressions.json, 11 shapes, all chords within L25 taught set, Mystery Mode + legal flags checked |
| `node tools/verify-curriculum-order.js` | 0 errors | ✅ **PASSED** — 0 errors. 25 lessons, filenames match canonical order, manifest matches, no forward prereqs, capstone last, no absolute-beginner after capstone, pedagogical order OK |
| `node 06-prototypes/step0/run-chord-check.js` | 0 errors AND 0 warnings | ✅ **PASSED** — 0 errors, 0 warnings. 25 lessons, 81 chords checked, all OK |

## Summary

**What's on disk and verified:**
- Full spec amend tree (AMENDMENT-01 through -17 + evidence-loop) — 18 files, NOT the 1 the ticket expected
- 4 ADRs (0001–0004)
- 05-content/ with songs/, graduation doc, scripts/, blues-pack/, country-pack/, VOICE-GUIDE.md
- 07-app/content/song-progressions/ with 11 songs + 11 shapes (gate-verified)
- 07-app/content/lessons/ with 25 lesson JSONs + manifest (gate-verified)
- 07-app/audio/ with one lesson's voice audio (L02, 7 WAVs)
- 07-app/core/ with 19 ESM modules including chord-theory-check.js, chatEngine.js, drillSelector.js (note: drillSelector is in 06-prototypes/step6/, not in 07-app/core/ — core has adaptivePlan.js, streaks.js, practiceStore.js, messages.js, entitlementStore.js, etc.)
- 06-prototypes/ full tree including practice-engine/, step0/ through step9/, step7-extra/
- 03-research/ full tree including curriculum/CURRICULUM-AND-PRACTICE-STRUCTURE.md
- tools/ with all 3 ship gates + test scripts + inventory tools
- All 3 ship gates PASS with 0 errors / 0 warnings

**What's missing (absent — not needed for this wayfinder map):**
- `~/re/flux` — FLUX install dir (AI image generation pipeline never executed on this machine)
- `~/re/wan` — Wan model dir (AI video pipeline never executed)
- `assets/` — FLUX/Wan output dir (no generated assets; consistent with above)
- `.venv-kokoro/Lib/site-packages/{kokoro,whisper,chatterbox}` — voice stack not installed (Chatterbox = shipping voice per AMENDMENT-06, but the Python env isn't here)
- `godot` on PATH — Godot engine not installed (scaffold tree exists but can't be opened)

**One discrepancy worth noting:**
The ticket probed `07-app/godot/FingeringOverlay/`, `07-app/godot/LessonScene/`, and `07-app/godot/World/` as "scaffold subdirectories." On disk:
- `FingeringOverlay/` (top-level) = **empty**
- `LessonScene/` (top-level) = **empty**
- `World/` (top-level) = has World.gd + World.tscn

The actual FingeringOverlay and LessonScene files live under `07-app/godot/lesson/` (FingeringOverlay.gd/tscn, LessonScene.gd/tscn). If any prose describes the top-level dirs as containing files, that prose is wrong — but the scaffold IS present and wired, just organized differently than a naive probe expects.

**DrillSelector note:** The ticket asked whether `drillSelector` is in `07-app/core/`. It is NOT — drillSelector.js lives in `06-prototypes/step6/drillSelector.js`. The core/ dir has the other modules (adaptivePlan, chatEngine, streaks, practiceStore, messages, entitlementStore, band-engine, voice-command, world-view-tracker, etc.).

**Resolution:** Ticket 01 is resolved. The repo is healthy — all three ship gates pass, all content and scaffold the wayfinder map needs is on disk. The missing items (FLUX, Wan, kokoro voice env, Godot) are all explicit out-of-scope for this map and do not block any downstream ticket in the wayfinder effort.