# HANDOFF-wayfinder-20260826.md

## Where we are

Wayfinder map "AI-augmented GuitarApp" — research phase complete (3 of 3 AFK research tickets resolved), now on the HITL grill phase. The next ticket to work is **03 — Song discovery by taste** (claimed, Q1-Q4 locked, Q5 prototype ready to run against real content). All research tickets (01, 09, 10) are resolved; the map's Decisions-so-far has them.

## What's decided and locked

From ticket 02 (resolved):
- The agent is a **lesson director** (not just a chat tutor) — picks the next step, adjusts pacing, notices when the student is stuck, sequences the five features. The in-session part already exists via Loop A / renderChat; the expansion is across-lesson directing.
- What the teacher remembers: **three layers** — (1) what it saw the student struggle with (mastery + confidence from listening/practice data), (2) what practice it assigned last time (drill/session/chord focus), (3) how it went when it checked back (did it sound better? did the student practice hard?). Speaks warmly from what it knows — "it seems to me you like more upbeat stuff" is OK because it remembers the student's taste; "you're a natural," "you're ready for a real performance," "I bet you'd love this song" are guesses with nothing behind them (Rule 5).
- Who speaks: **Sage** (World 1 = Emerald Hollow), one Chatterbox built-in voice (MIT, no cloning), one persona (chill/warm/encouraging). Same persona in Godot animated world AND in-app chat text. Agent is Sage-extended, not a new persona.
- Where the teacher's brain lives: **on the device** — thinking + listening + voice all on-device. PocketBase (AMENDMENT-16) keeps student memory synced across devices. Audio never leaves the device (AMENDMENT-05). Heavy compute (e.g. generating music on the fly for call-and-response) is a separate decision when we get to that feature.
- Constraint boundary (fence lines): no made-up musical opinions (Rule 5), no camera/hand tracking (Rule 2), audio never leaves device (AMENDMENT-05), only teaches what's allowed (AMENDMENT-12/14 — chords, progressions, song titles; no riffs/melodies/lyrics/tabs; band names = trademarks + disclaimer), only uses approved tools (Rule 9 — Chatterbox, FLUX/Wan, Godot; no ElevenLabs/Midjourney/Suno).
- One teacher per world, one memory per student across all worlds. Within World 1 = Sage sticks with the student. Across-world teacher switch is a future decision but the memory architecture (student-owned, world-agnostic) supports it now.
- [Source for all fence lines: AGENTS.md hard rules + AMENDMENT-05/06/09/11/12/14/16 + ADR-0001/0003/0004.]

From ticket 03 (claimed, Q1-Q4 locked):
- **Q1 — How does the student express taste? (LOCKED):** Voice-primary, buttons as fallback. Student tells Sage what they like in their own words ("I like campfire songs," "nothing I can name, just surprise me") — spoken, because the app is voice-first. Buttons for "calm / upbeat / classic / I don't know" as fallback. "Surprise me" either spoken or tapped. No free-text typing. Keeps it simple for kids and older adults.
- **Q2 — What's the AI matching against? (LOCKED):** Both. The 10-song progression catalog (AMENDMENT-12) AND the chords the student has taught so far (cumulative through the 25-lesson curriculum). Two lanes: "play today" (songs whose chords you already have) and "next step" (the smallest unlock toward something you'd love).
- **Q3 — Legal boundary (LOCKED):** AI stays inside the approved 10-song track. Surfaces chord progressions + song titles only (no riffs/melodies/lyrics/tabs, per AMENDMENT-12/14). Band names = trademarks, nominative use + "not affiliated / not endorsed" disclaimer on the select card. If a taste match lands outside the track, the AI says "that's not in your lessons yet, but here's the closest one you *can* play" — pointing back to the track. Public-domain or original content beyond what's there is a later content-creation step, not a discovery judgment call.
- **Q4 — Feed existing track or extend? (LOCKED):** Feed the existing 10-song track for now — reorder + personalization layer. Extend later when there's more legally-cleared content.

From tickets 01, 09, 10 (all resolved — see map Decisions-so-far):
- **01:** Repo healthy — 18 amendments on disk, 4 ADRs, all content dirs present (25 lessons, 11 songs + 11 shapes, practice drills, teachers, packs), 19 core ESM modules, full 06-prototypes/ tree, full 03-research/ tree, all 3 ship gates green (0 errors / 0 warnings). Missing: FLUX/Wan dirs, `assets/`, `.venv-kokoro` voice stack, `godot` on PATH — all out-of-scope, none block downstream tickets. drillSelector.js is in `06-prototypes/step6/`, not `07-app/core/`.
- **09:** Godot scaffold present and wired — `project.godot` (Godot 4, `main_scene=res://world/World.tscn`), 4 `.gd` scripts + 3 `.tscn` scenes all wired via `ExtResource`, `World.gd` preloads `LessonScene.tscn`, `worlds/elderwick-market/world.config.json` present (50 lines, `scaffold_authored` status, FLUX/Wan/Chatterbox asset slots pinned), `data/lesson_manifest.json` with 1 placeholder lesson. FingeringOverlay/ and LessonScene/ at top level are empty decoys — real files are in `lesson/` and `world/`. Scaffold matches ADR-0004 §Production vehicle + AMENDMENT-09. No blocker for 08.
- **10:** Full spec tree survived the PC transfer — 18 amendments (AMENDMENT-01 through -17 + evidence-loop), 03-research/ present with full curriculum/ subdir, 05-content/ complete (20 lessons, songs, scripts, blues/country packs, graduation doc, VOICE-GUIDE.md), 26 lesson JSONs, song progressions (progressions.json + shapes.json + chord-prereqs.json), voice audio (7 WAVs, L02), 19 ESM core modules, full practice-engine tree, all ship gates present. Foundation safe for the AI-augmented app build.

## Files on disk

| File | What it is |
|------|-----------|
| `.scratch/wayfinder/map.md` | Wayfinder map — index, Decisions-so-far, tickets, frontier, fog, out-of-scope |
| `.scratch/wayfinder/issues/01-install-state-verification.md` | Ticket 01 — resolved, full findings table |
| `.scratch/wayfinder/issues/02-personalized-ai-agent-definition.md` | Ticket 02 — resolved, all 6 sub-questions answered |
| `.scratch/wayfinder/issues/03-song-discovery-by-taste.md` | Ticket 03 — claimed, Q1-Q4 locked, Q5 prototype on hold |
| `.scratch/wayfinder/issues/04-call-and-response-jam.md` | Ticket 04 — open, blocked on 02 |
| `.scratch/wayfinder/issues/05-stylistic-explorer.md` | Ticket 05 — open, unblocked |
| `.scratch/wayfinder/issues/06-celebration-moments.md` | Ticket 06 — open, blocked on 02 |
| `.scratch/wayfinder/issues/07-practice-remix.md` | Ticket 07 — open, unblocked |
| `.scratch/wayfinder/issues/08-world-factory-first-scene.md` | Ticket 08 — open, now unblocked (01 cleared, 09 scaffold verified), FLUX prompt draft exists at `.scratch/teacher/t-b1-flux-prompt-draft.md` |
| `.scratch/wayfinder/issues/09-godot-scaffold-state.md` | Ticket 09 — resolved, full findings (scaffold present and wired) |
| `.scratch/wayfinder/issues/10-amendment-survival-repo-restore.md` | Ticket 10 — resolved, all 11 probes ran clean |
| `07-app/content/song-progressions/progressions.json` | The 10-song progression catalog (11 songs total) — real content for 03's Q5 prototype |
| `07-app/content/song-progressions/shapes.json` | 11 chord shapes |
| `07-app/content/song-progressions/chord-prereqs.json` | Prereq map for the songs |
| `02-spec/guitar-app-spec-AMENDMENT-17.md` | Current amendment — World 1 teacher + performance ladder (proposed, not yet ratified) |
| `docs/adr/0001-always-on-encrypted-sync.md` | Student memory ADR |
| `docs/adr/0004-the-teacher-world-1-emerald-hollow.md` | World 1 + Sage + performance ladder + Path A/B + animated production |
| `brand-references/emerald-hollow/world-emerald-hollow.md` | Measured palette (brightness 75–120/255, saturation 0.14–0.33, muted/earthy) + teacher placement + scene composition |
| `03-research/curriculum/CURRICULUM-AND-PRACTICE-STRUCTURE.md` | Source of truth for owner-locked curriculum directives (§5) |

## Active ticket — what it needs to proceed

- **03 — Song discovery by taste** (grilling + prototype, claimed): READY TO CONTINUE. Q1-Q4 are locked (see "What's decided and locked" above). **Q5 (prototype) is the only open piece** — "a rough take of the taste-input → match output, so the owner can react to how it feels." The 10-song catalog is back on disk (`07-app/content/song-progressions/progressions.json`), so the prototype can now react to real content instead of a placeholder.

  Next action: grill Q5 in-chat (one question at a time, grilling style) — what should the rough take look like? Then call the **prototype skill** to make a throwaway artifact the owner can react to. When Q5 is answered, record under `## Answer`, set `Status: resolved`, and append the gist + link to the map's Decisions-so-far.

  Dependencies: independent of 02 (already resolved). Can flow in-chat in parallel with 05, 07.

## Palette lock / constraints that must NOT drift

(Not applicable to 03 directly — this is a content/personalization feature, not a visual world feature. The relevant constraints are the legal and agent-fence ones from ticket 02, already listed above. No measured palette to carry.)

## What NOT to do

- **Don't re-grill Q1-Q4 of ticket 03.** They're already locked (voice-primary, both-lanes matching, stays inside the 10-song track, feeds existing catalog). Jump straight to Q5.
- **Don't re-ask ticket 02's decisions.** The agent design is resolved — lesson director, Sage's voice, on-device + PocketBase sync, three-layer memory, full fence lines. Don't reopen.
- **Don't skip the prototype for Q5.** The wayfinder says HITL tickets with a prototype sub-question call the prototype skill. Q5 is explicitly "a rough take... so the owner can react to how it feels." That's a prototype, not a prose answer.
- **Don't resolve more than one ticket this session.** The wayfinder's rule: one ticket per session. If the session wants to also touch 05 or 07, stop at 03 and leave the rest for later.
- **Don't claim FLUX/Godot/whatever exist on disk without checking.** The install-state discipline from 01 still applies — `ls`/`find`/`test -d` before asserting. (For 03 it's less likely to come up, but the discipline holds.)
- **Don't start 04 or 06 before 03/05/07 are further along.** 04 and 06 are blocked on 02 (resolved now), but the map's ordering puts the five-feature grills first (03, 05, 07), then the blocked ones (04, 06).

## Hard rules still live (brief — not a copy)

- **Rule 5:** teacher copy cites stored mastery/confidence numbers only — never freelances a musical opinion. (Applies to the agent's taste-matching suggestions — it can only surface what's on the approved track or what the student has.)
- **Rule 9:** voice license blocklist = copyright law. Chatterbox (MIT) = shipping voice. ElevenLabs blocked.
- **Rule 2:** no camera, no hand tracking.
- **AMENDMENT-12/14:** song-progression track legal position. House of the Rising Sun = public domain; 9 others = "not affiliated / not endorsed" disclaimer. No riffs/melodies/lyrics/tabs.
- **AMENDMENT-15:** 25-lesson curriculum order gated. The AI-augmented app build sits on top of this curriculum.
- **AMENDMENT-16:** PocketBase backend (MIT, self-hosted).
- **AMENDMENT-05:** the nine approved AI features are the base the five new features build on.

## Dependencies / blockers

- **Ticket 02 (resolved)** unblocks 04 and 06. 04 and 06 are still open — they're ready to grill once we get to them, but the map's order is 03 → 05 → 07 first, then 04 → 06.
- **Ticket 01 (resolved)** cleared 08's blocker. 08 is now unblocked — FLUX/Wan/`assets/` are missing (pipeline never executed on this machine), so 08 is "rent cloud GPU (~$0.50/20-lesson set, one-time) + write first FLUX prompt + prototype it." The FLUX prompt draft already exists at `.scratch/teacher/t-b1-flux-prompt-draft.md`.
- **No PC-transfer blocker remains.** Tickets 01, 09, 10 all confirmed the repo is fully restored — 18 amendments, all content dirs, all scaffold, all gates green. The old worry (only AMENDMENT-17 survived) is false.

## Resume cue

To resume: open ticket 03, skip to Q5 (the prototype sub-question), grill it one question at a time, then call the prototype skill to make a rough take of taste-input → match output using the real 10-song catalog (`07-app/content/song-progressions/progressions.json`). When Q5 is answered, record under `## Answer`, set `Status: resolved`, and append the gist + link to the map's Decisions-so-far (`.scratch/wayfinder/map.md`). Then the frontier moves to 05 (stylistic explorer) — next HITL ticket.
