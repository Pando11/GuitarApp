# Wayfinder map: AI-augmented GuitarApp

**Effort:** AI-augmented GuitarApp — personalized AI teaching agent + five new AI features + the world-factory pipeline, all on the commercial-clean stack.
**Charted:** 2026-08-24
**Status:** charted, 10 tickets resolved (01, 02, 03, 04, 05, 06, 07, 08, 09, 10); 0 open on the frontier

---

## Destination

An AI-augmented GuitarApp where a **personalized AI teaching agent** (built on the free + commercial-clean stack — Apache-2.0 / MIT only) uses **five new AI features** to make learning guitar genuinely fun and sticky for students of all ages, backgrounds, and experience levels, on top of the **nine approved AI features** from AMENDMENT-05 that already exist in the spec:

1. **Song discovery by taste** — the student says what music they love (or can't name it, just "pick something I'll like"), and the AI matches them to progressions/chords they already know and can play *today*, or to the smallest next step to unlock something they'd love.
2. **Call-and-response jam** — the AI plays a two-bar phrase using chords the student knows; the student answers with their own phrase; the AI responds back. Creative play, not a drill.
3. **Stylistic explorer** — for the same chord progression, the AI shows different approaches (folk strum, blues feel, punk rhythm) as teaching tools — no copying specific artists.
4. **Celebration moments** — after a good week, the app puts together a tiny "look what you did" from stored numbers (Rule 5) + a backing groove + the teacher voice, so progress lands emotionally instead of as a badge.
5. **Practice remix** — the same weak spots, framed six different ways (rhythm game, call-and-response, play-along, tempo challenge, performance moment, calm slow), sequenced by preferred format + what actually engaged last time.

…fed by the **world-factory pipeline** (FLUX.1[schnell] → Wan2.1-I2V → Chatterbox → Godot 4.x) so the animated Emerald Hollow world (World 1, teacher = Sage) is real on screen, and the **existing spec AI features** (listening engine, talk-to-coach chat, adaptive practice, AI lesson generation, the band that follows you, niche packs, human-feeling progress reports, voice-first controls, encouraging notifications) are the base this builds on.

**The one thing that exists at the end of this map:** a decision-locked build plan for the AI-augmented app — every fog cleared, every ticket resolved — so the build can proceed ticket-by-ticket without re-asking. Not the build itself; the plan.

---

## Notes

**Domain — read before naming anything:**
- `CONTEXT.md` at repo root — project glossary. Use its vocabulary. Don't drift to synonyms it avoids.
- `docs/adr/0001-always-on-encrypted-sync.md` — student memory (the agent's memory source).
- `docs/adr/0004-the-teacher-world-1-emerald-hollow.md` — World 1 + Sage + performance ladder + Path A/B + animated production.
- `brand-references/emerald-hollow/world-emerald-hollow.md` — measured palette (brightness 75–120/255, saturation 0.14–0.33, muted/earthy) + teacher placement + scene composition.
- `02-spec/guitar-app-spec-AMENDMENT-17.md` — current amendment for World 1 teacher + performance ladder.

**Skills every session should consult:** grilling + domain-modeling (in-chat, for HITL decisions); prototype (throwaway artifact to react to); research (AFK subagent for background facts); handoff (when context runs long).

**Standing preferences (from the repo):**
- One question at a time, plain language, offer suggestions, redline every answer (Grill method, 2026-08-24).
- Ticket by name, never by bare number.
- Legal floor: Rule 5 (LLM prose-only, cites stored numbers, no invented musical opinion), Rule 9 (license blocklist = copyright law — FLUX.1[schnell] + Wan2.1-I2V + Chatterbox + Kokoro-82M + Godot 4.x + ACE-Step + YuE are the commercial-clean set; Midjourney/SVD/ElevenLabs/MusicGen/Suno blocked), Rule 2 (no camera, no hand tracking).
- AMENDMENT chain is current truth: AMENDMENT-05 (nine AI features, listening back), AMENDMENT-06 (avatar/voice unlock — real/photoreal + Chatterbox IN SCOPE), AMENDMENT-09 (Wan motion + Godot story-world), AMENDMENT-11 (world-locked teacher + memory + duet thesis), AMENDMENT-12/13 (song-progression track + mystery mode), AMENDMENT-14 (song-track legal position — lyrics/riffs/melodies/tabs are NOT teachable; band names = trademarks, nominative use + disclaimer), AMENDMENT-15 (25-lesson curriculum, gated, capstone L25 last), AMENDMENT-16 (PocketBase backend), AMENDMENT-17 (World 1 teacher + performance ladder — proposed, not yet ratified).
- ADR conflicts: surface explicitly, never silently override. ("Contradicts ADR-0004, but worth reopening because…")
- Install-state verification discipline: **no assertion about a model/dir/scaffold exists until `ls`/`find`/`test -d` confirms it on this machine.** The PC transfer means prose truth (AGENTS.md, spec amendments, README) may describe a tree that did NOT survive. Probes for this effort: `ls -d ~/re/flux`, `ls -d ~/re/wan`, `ls .venv-kokoro/Lib/site-packages/{kokoro,whisper,chatterbox}*`, `command -v godot`, `test -d assets`, `ls 07-app/godot/*/` (contents, not just existence), `ls 02-spec/ | grep -c AMENDMENT`, `ls docs/adr/`, `ls 05-content/`, `ls 07-app/content/song-progressions/`, `ls 07-app/content/lessons/`.

**What's locked from prior grills/decisions (pre-existing, not decisions of this map):**
- Teacher of World 1 = **Sage** — chill/warm/encouraging, one Chatterbox built-in voice (MIT, no cloning).
- World 1 = Emerald Hollow (cozy fantasy Celtic village, animated not photo-real for v1).
- Performance ladder: Level 1 porch (~5–6 lessons, TBD gates) → Level 2 village (~10–12) → Level 3 capstone band (L25, bass + drums + Sage on second guitar, student picks song).
- Path B duet ships v1; Path A live adaptive is a roadmap item (revisit when: memory live + listening engine classifies clean changes in real time + adaptive accompaniment prototype exists).
- Nine AI features (AMENDMENT-05) are approved; build status per PROPOSED-FEATURES.md §C.
- Student memory: always-on, encrypted cross-device (PocketBase stores only ciphertext), overrides AMENDMENT-11 local-only wording. OPEN: key/recovery if student loses only device; mastery shape = label + 0–100 confidence.

---

## Decisions so far

- [01 — Install-state verification](.scratch/wayfinder/issues/01-install-state-verification.md): Repo is healthy — 18 amendments on disk (full tree survived, not just AMENDMENT-17), 4 ADRs, all content dirs present (25 lessons, 11 songs + 11 shapes, practice drills, teachers, packs), 19 core ESM modules, full 06-prototypes/ tree, full 03-research/ tree, all 3 ship gates green (0 errors / 0 warnings). Missing: FLUX/Wan dirs, `assets/`, `.venv-kokoro` voice stack, `godot` on PATH — all out-of-scope for this map, none block downstream tickets. Godot scaffold present and wired (`07-app/godot/project.godot` + `lesson/` + `world/` + `worlds/elderwick-market/`), just organized deeper than the naive top-level probe expected. drillSelector.js is in `06-prototypes/step6/`, not `07-app/core/`.
- [02 — Personalized AI agent definition](.scratch/wayfinder/issues/02-personalized-ai-agent-definition.md): **Resolved (2026-08-26).** Agent = lesson director (not just a chat tutor), voiced by Sage (Chatterbox) in Emerald Hollow, lives on-device with PocketBase memory sync, one teacher per world / one memory per student across worlds, three-layer memory (observed + assigned + outcome), speaks warmly from what it knows (not cold data quoting, not invented praise, not student profiling), full Rule 2/5/9 + AMENDMENT fence lines. Unblocks 04 and 06.
- [03 — Song discovery by taste](.scratch/wayfinder/issues/03-song-discovery-by-taste.md): **Resolved (2026-08-26).** Q1-Q4 locked earlier (voice-primary + buttons fallback; match against both the 10-song catalog and cumulative taught chords in two lanes — play today / next step; stays inside the approved track with not-affiliated disclaimer + public-domain flag; feeds existing track as a reorder + personalization layer). Q5 prototype built and reacted to: `06-prototypes/song-discovery-q5-prototype.html` — a throwaway HTML file (open offline by double-clicking) that takes a taste phrase (voice-primary, buttons as backup) and returns two lanes against the real 10-song catalog (`progressions.json`), each match carrying a per-match "why Sage picked this" note. Verified logic straight from disk: at lesson 10 (Em, easyC, G, D), "surprise me" → Sweet Home Alabama / Amazing Grace / Zombie / Nothing Else Matters in play-today, Highway to Hell as the smallest next unlock; "calm" → Amazing Grace + Nothing Else Matters in play-today, Wish You Were Here as next step; "upbeat" at lesson 10 surfaces NO real taste match in play-today (the driving/heavy songs need A/E/A7 not yet taught) — the honest-empty feel the two-lane design is meant to surface — and next step points to Highway to Hell / Back In Black / Johnny B. Goode; "classic" → Amazing Grace first, House of the Rising Sun as next step. Owner verdict: "it looks great." Validated decision carried forward: taste → two-lane match (play today / next step) with a per-match why-note; voice-primary, buttons backup; stays inside the 10-song track with the disclaimer; public-domain songs flagged. Prototype is throwaway — real build swaps typed phrase for actual voice (Chatterbox + on-device speech recognition when in the stack) and reads the student's real taught-chord set from PocketBase memory instead of the lesson dropdown.
- [04 — Call-and-response jam](.scratch/wayfinder/issues/04-call-and-response-jam.md): **Resolved (2026-08-26).** Generate fresh each time (A) — ACE-Step/YuE, cloud GPU authorized (~$0.50/20-lesson set, one-time). AI grades the student's phrase against what it knows they can play (stays in key, uses current chords, respects tempo) — creative play, no single right answer, but the AI pays attention and responds, citing only real data (no invented praise, Rule 5). Round-trip: on-device listening → facts (no audio) sent to cloud → cloud generates response → audio back to device (AMENDMENT-05 holds — audio never leaves). If cloud drops, AI waits or falls back. Weaves into regular lessons (not a separate jam mode). Path B duet moved from pre-built to generative — same pipeline, different use (duet = sustained accompaniment that follows the student; call-and-response = phrase/response conversation). Generative-music decision shared across 04, 06, 07.
- [05 — Stylistic explorer](.scratch/wayfinder/issues/05-stylistic-explorer.md): **Resolved (2026-08-26).** Strumming pattern + rhythm feel, taught one bar at a time with counts; style-as-category (no artist names, no signature rhythms — AMENDMENT-14); within-lesson tool on whatever the student is currently learning, not a feed to the existing niche packs and not a separate "explore styles" mode. Prototype built (`06-prototypes/song-styles-q5-prototype.html`) showing G–D–Em–C three ways (folk / blues / punk), each as a labeled card with pattern + counts + "why this feels like X" note + "Sage says" line, and owner-reacted-to (deferred verdict — "the shape is right, try it yourself").
|- [07 — Practice remix](.scratch/wayfinder/issues/07-practice-remix.md): **Resolved (2026-08-26).** Q1-Q5 all resolved. Q1: all six framings stay (rhythm game, call-and-response, play-along groove, tempo challenge, performance moment, calm slow). Q2: sequencer picks from engagement data only — preferred format (user-set, consent-based), quality-weighted engagement (did it move the rate up), variety (no repeat), random shuffle floor; no personality/mood inference, no "how they learn" typing. Q3: built on the existing practice engine — verified on disk (`06-prototypes/practice-engine/`): one-minute-changes.mjs (30/60 sensor), fluency-store.mjs (per-pair memory, spacing decay, selectWeakest), listener-real.mjs (constrained on-device listener, 347 lines), storage-glue.js + storage-adapter.mjs (localStorage + memory fallback), review-scheduler.mjs (weak-pair surfacing + streak), practice-ui.html (679 lines, all 11 §5.2 drills). The six framings are a presentation layer on top of existing drills — not new drill types. Two framings need companion audio hooks the engine doesn't have yet (call-and-response needs a chord-cue playback; play-along groove needs a groove player) — that's new audio capability, not new drills. Q4: practice remix is a presentation/reframing layer on top of the adaptive practice plan (AMENDMENT-05 #4), not a separate thing — two stacked decisions: (1) which weak spot (adaptive plan via fluency store + review scheduler), (2) which framing (remix). Build it that way; revisit after the first set of lessons if the shape needs changing. Q5: prototype built and reacted to — `06-prototypes/practice-engine/practice-remix-q5-prototype.html` (one weak spot G↔D, fluency 0.25, 15/min, shown three framings: Tempo challenge, Play-along groove, Calm slow). Owner verdict: "It all looks good." Prototype is throwaway.
- [09 — Godot scaffold state](.scratch/wayfinder/issues/09-godot-scaffold-state.md): **Resolved (2026-08-26).** Scaffold present and wired — not empty, not partial. The surface probe that spawned the ticket was misleading: `FingeringOverlay/` and `LessonScene/` at top level are empty decoys; the real files live under `lesson/` (FingeringOverlay.gd/tscn, LessonScene.gd/tscn) and `world/` (World.gd/tscn). `project.godot` points at `World.tscn`, all 4 `.gd` scripts have matching `.tscn` scenes wired via `ExtResource`, `World.gd` preloads `LessonScene.tscn`. ADR-0004 §Production vehicle has a stale "NOT present" line that should be updated. Ticket 08 is NOT blocked by a missing scaffold — it's blocked by missing assets (FLUX/Wan/Chatterbox output), which is the cloud-GPU generation task.
- [10 — Amendment survival / repo-restore scope](.scratch/wayfinder/issues/10-amendment-survival-repo-restore.md): **Resolved (2026-08-26).** Full spec tree survived the PC transfer — 18 amendments on disk (AMENDMENT-01 through -17 + evidence-loop), 4 ADRs, all content dirs present (25 lessons, 11 songs + 11 shapes, practice drills, teachers, packs), 19 core ESM modules, full 06-prototypes/ tree, full 03-research/ tree, all 3 ship gates green (0 errors / 0 warnings). The worry that "only AMENDMENT-17 survived" is false. Foundation safe for the AI-augmented app build; no repo-restore blocker remains.

---

## Tickets (specifiable now)

All 10 tickets are resolved — see `.scratch/wayfinder/issues/` for the child files (each carries its full `## Answer`). Every decision lives in its ticket; the map only gists it in [Decisions so far](.scratch/wayfinder/issues/) above.

---

## Not yet specified (fog)

*(dim view of decisions that hang off questions still open. Graduates as the frontier advances. All of this is in scope — just not sharp enough to ticket yet.)*

**Genesis of "AI wasn't available until now"** — resolved by owner clarification (2026-08-24): there is no *specific* capability that landed on/around August 26th. The point is general: AI capability has crossed a threshold where a personalized teaching agent is now *plausible in a way it wasn't before*, and the five features on this map (song discovery by taste, call-and-response jam, stylistic explorer, celebration moments, practice remix) + the nine approved AI features already in the spec are what we build toward. This fog piece is **cleared** — no longer blocking ticket 02. The agent ticket proceeds on the basis of the listed features, not on a specific named capability.
- **Agent run-location** — on-device vs. PocketBase backend vs. cloud GPU vs. a split. Affects 02, 04, 06, 08.
- **Scope of the five features vs. the nine existing** — which of the five are genuinely new surfaces and which are refinements of existing features (e.g., is practice remix (07) a new dimension on adaptive practice (AMENDMENT-05 #4), or a replacement)? Affects sizing.
- **Student memory readiness** — is ADR-0001's encrypted sync built enough to be the agent's memory source, or is the agent gated on it? Affects 02, 06.

---

## Out of scope

*(work ruled beyond this destination. Closed, never graduates. Returns only if the destination is redrawn — as a fresh effort, not a resumption.)*

- **Leveling / titles / front-screen skins / named band-member characters** — "Guitar" → "Guitar Master", new names for the student per level, the front screen looking different per level, named musicians (Rory the drummer, Lena the bassist) as new animated characters with voices. **Decision:** parked in the parking lot. Owner's call: this doesn't help retain in its current "Guitar → Guitar Master" two-step form; the existing Performance Ladder (porch → village → band, ADR-0004) already delivers the escalating-reward mechanic. Revisit after the initial AI-augmented app build is underway, when we can see what actually moves retention. **Reason for out-of-scope:** the two-step title form doesn't add retention over the existing ladder; named band-member characters are new animated characters + voices = World 2+ scope (ADR-0004: "Different teachers = World 2 and beyond. NOT in World 1.") — real build, not worth it before the core AI agent exists.
- **World 2+** — different teachers, different worlds, different personalities/voices/looks. ADR-0004 defers this to after World 1 proves the concept.
- **Photo-real teacher track** — separate track to try later. ADR-0004: "NOT photo-real for World 1."
- **Path A live adaptive duet** — roadmap item, not blocking. ADR-0004 §Duet: revisit when memory is live + listening engine classifies clean changes in real time + adaptive accompaniment prototype exists. The five AI features may feed Path A eventually, but this map's destination is the agent + five features + world-factory pipeline, not Path A.
- **New curriculum lessons / new drills / new songs** — not part of this map unless a feature specifically needs them. The AI-augmented app build is on top of the existing curriculum + song track + practice engine. If a feature needs new content, that's a sub-ticket of that feature, not a general curriculum-expansion effort.
- **Monetization / paywall / RevenueCat / pricing** — not in this map. The AI-augmented app is the product; monetization is a separate concern (the PROPOSED-FEATURES.md §A 20(+1) brainstorm covers some of it).
- **Android port / V2 / V3 roadmap items** — deferred per the repo's roadmap (PROPOSED-FEATURES.md §E). This map is the iOS+Android one-codebase app (AMENDMENT-05).

---

## Frontier (as of 2026-08-26, after all resolutions)

The frontier is the open, unblocked, unclaimed tickets, first by number:

**Empty — destination reached.** All 10 tickets resolved. No open tickets remain.

Resolved (complete list):
|||| # | Name | Type | Resolved |
|||||---|---|---|---|
||||| 01 | Install-state verification | research (AFK) | 2026-08-26 (repo healthy — 18 amendments, 4 ADRs, all content dirs, 19 core ESM modules, all 3 ship gates green; FLUX/Wan/assets/voice-stack/godot missing but out-of-scope) |
||||| 02 | Personalized AI agent definition | grilling (HITL) | 2026-08-26 (lesson director, Sage/Chatterbox, on-device + PocketBase sync, full fence lines; unblocks 04 + 06) |
||||| 03 | Song discovery by taste | grilling + prototype | 2026-08-26 (two-lane match with per-match why-note; voice-primary/buttons backup; stays on approved track; Q5 prototype + owner verdict "it looks great") |
||||| 04 | Call-and-response jam | grilling (HITL) | 2026-08-26 (generate fresh — ACE-Step/YuE, cloud GPU authorized; AI grades against known chords; on-device listening → facts-to-cloud round-trip → audio back; weaves into lessons; Path B duet moved to generative; shared with 06 + 07) |
||||| 05 | Stylistic explorer | grilling + prototype | 2026-08-26 (strum pattern + rhythm feel, one bar with counts; style-as-category; within-lesson tool; Q1-Q4 resolved; prototype + deferred verdict) |
||||| 06 | Celebration moments | grilling (HITL) | 2026-08-26 (all 5 sub-questions locked: stored-number data sources, push delivery as teacher's lesson opener, rendered-moment shareable via OS share sheet, augments existing #8 monthly summary, two-layer privacy model) |
||||| 07 | Practice remix | grilling + prototype | 2026-08-26 (all six framings stay; engagement-data-only sequencer; built on existing practice engine; reframing layer on adaptive plan; Q5 prototype + owner verdict "It all looks good") |
||||| 08 | World factory pipeline first scene | prototype + task | 2026-08-26 (porch confirmed as first scene; FLUX+Wan generates Sage playing, fretboard overlay carries accuracy; Sage voice line locked; cloud GPU approved for first proof) |
||||| 09 | Godot scaffold state | research (AFK) | 2026-08-26 (scaffold present and wired — files in lesson/ and world/, not empty top-level decoys; ADR-0004 stale "NOT present" line flagged; 08 not blocked by scaffold) |
||||| 10 | Amendment survival / repo-restore scope | research (AFK) | 2026-08-26 (full spec tree survived — 18 amendments, 4 ADRs, all content dirs, all 3 ship gates green; "only AMENDMENT-17 survived" is false; foundation safe) |

Blocked: none.

**Research tickets:** all resolved (01, 09, 10). Research phase complete — no remaining AFK tickets.

**HITL tickets to grill in-chat, one at a time:** None — all resolved. The map is done; the destination (a decision-locked build plan for the AI-augmented GuitarApp) is reached.

---

## How to work this map

1. **Research phase:** complete — 01, 09, 10 all resolved. No remaining AFK tickets.
2. **02 resolved** — agent design locked (lesson director, Sage/Chatterbox, on-device + PocketBase, full fence lines). Unblocked 04 and 06; both now done.
3. **03, 05, 06, 07 all resolved** — four of the five new features locked. Q5 prototypes built and owner-verdicted for 03 and 07; 05 prototype built with deferred verdict; 06 all 5 sub-questions locked (stored-number data sources, push delivery as teacher's lesson opener, rendered-moment shareable via OS share sheet, augments existing #8 monthly summary, two-layer privacy model).
4. **04 resolved** — call-and-response jam locked (generative fresh music, AI grading, round-trip shape, weaves into lessons, Path B duet now generative). Generative-music decision shared with 06 and 07.
5. **08 resolved** — world factory pipeline first scene locked (porch confirmed, FLUX+Wan for teacher character with fretboard overlay carrying accuracy, Sage voice line locked, cloud GPU approved for first proof).
6. **All 10 tickets resolved.** Destination reached: a decision-locked build plan for the AI-augmented GuitarApp. No frontier tickets remain. Next step is to hand off to build sessions.
7. **Re-sync on any new ADR:** if the map produces a new `docs/adr/000N-*.md`, re-sync AGENTS.md + 01-START-HERE/README.md + HANDOFF.md before considering it live (the SPEC/README re-sync gotcha). The map itself lives under `.scratch/` and is not committed prose — it can be re-derived from the closed tickets.

---

*This map is the index. Detail lives in the ticket files under `.scratch/wayfinder/issues/`. The map never restates a decision — it gists it and links. When all tickets are resolved and no fog remains, the destination is reached: a decision-locked build plan for the AI-augmented GuitarApp.*
