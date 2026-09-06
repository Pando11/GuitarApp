Type: research
Status: resolved
Blocked by:

## Answer

**Verdict (2026-08-26):** The full spec tree survived the PC transfer — the worry that "only AMENDMENT-17 is on disk" is false. Verified by ticket 01's probes:

- `02-spec/` — 18 amendments on disk (AMENDMENT-01 through -17 + AMENDMENT-06-evidence-loop), NOT just AMENDMENT-17.
- `03-research/` — present in full, including `curriculum/CURRICULUM-AND-PRACTICE-STRUCTURE.md` (the §5 source of truth for owner-locked curriculum directives).
- `05-content/` — complete (songs/, graduation-easyc-to-c.md, scripts/, blues-pack/, country-pack/, VOICE-GUIDE.md, 20 lesson JSONs at top level).
- `07-app/content/lessons/` — 25 lesson JSONs + manifest.json (gate-verified).
- `07-app/content/song-progressions/` — progressions.json + shapes.json + chord-prereqs.json (11 songs + 11 shapes, gate-verified).
- `07-app/audio/` — one lesson's voice audio present (L02, 7 WAVs).
- `07-app/core/` — 19 ESM modules including chord-theory-check.js, chatEngine.js (drillSelector.js is in `06-prototypes/step6/`, not core).
- `06-prototypes/` — full tree including practice-engine/, step0/ through step9/, step7-extra/.
- `tools/` — all 3 ship gates + test scripts + inventory tools present.
- All 3 ship gates PASS with 0 errors / 0 warnings.

**What's missing (absent — out-of-scope for this map, none block downstream tickets):** `~/re/flux`, `~/re/wan`, `assets/`, `.venv-kokoro` voice stack, `godot` on PATH.

**Resolution:** Ticket 10 is resolved. The foundation is safe for the AI-augmented app build — every built piece the plan sits on survived the transfer. No repo-restore blocker remains.

Only AMENDMENT-17 is on disk in `02-spec/` (verified 2026-08-24). The full spec tree is AMENDMENT-01 through -16 + the base `guitar-app-spec.md` + `FEATURES-LOCKED-v1-2026-08-07.md`. Before we plan the AI-augmented app build, verify what survived the transfer — because the AI-augmented app build sits on top of the existing spec's AI features (AMENDMENT-05's nine features, many marked built), the curriculum (AMENDMENT-15), the song track (AMENDMENT-12/13/14), the backend (AMENDMENT-16), and the practice engine (06-prototypes/).

Specifically verify:
- `02-spec/` — full file list (how many amendments + base spec + FEATURES-LOCKED are actually on disk, vs. the 16+ amendments the prose says exist)
- `03-research/` — does it exist? What's in it? (The repo's AGENTS.md references `03-research/curriculum/CURRICULUM-AND-PRACTICE-STRUCTURE.md` §5 as the source of truth for owner-locked curriculum directives.)
- `05-content/` — full tree (songs/, graduation-easyc-to-c.md, the 20-group teaching spine?)
- `07-app/content/lessons/` — lesson JSON catalog (the app speaks via live TTS from lesson JSON, not pre-rendered wavs — the lesson JSON is the source of truth for the agent's content)
- `07-app/content/song-progressions/` — progressions.json + shapes.json (10 songs + 11 shapes)
- `07-app/audio/` — any voice audio (proof artifact, not what the phone hears)
- `07-app/core/` — the ESM ports (chord-theory-check.js, chatEngine.js, drillSelector.js, listener-twin.js, etc.)
- `06-prototypes/practice-engine/` — the practice engine (30/60 sensor, weak-pair review, the drill menu)
- `tools/` — the ship gates (verify-song-progressions.js, verify-curriculum-order.js, run-chord-check.js, etc.)

This ticket exists because the AI-augmented app build is a *build on top of the existing spec*, and if the existing spec's built pieces didn't survive the transfer, the AI-augmented app plan is being built on a foundation that may be partially gone. The resolution either confirms "everything survived, the plan is safe" or "some pieces are gone — that's a repo-restore blocker, not a plan bug."

**Dependencies:** Feeds every ticket that touches existing built pieces (02, 03, 04, 05, 06, 07, 08). Independent of the others — dispatch in parallel with 01 and 09.
