# HANDOFF — Rolling Grill sessions #1–#4 + Sage/Mystery integration (2026-08-24)

## Where we are

The "rolling grill" method (one question at a time, plain language, answers redlined in real time) has
completed **four grill subjects**. All four are now recorded on disk as ADRs and/or tickets. The most
recent work (this session, 2026-08-24) was: finishing Grill #3 (Mystery Mode) into a real ADR, naming
the teacher **Sage**, and patching the Grill #4 ticket file to integrate the Mystery Mode decisions.

**BLOCKER — the "8 subjects" list is incomplete.** The owner said there are 8 grill subjects and we've
done the first 4. Subjects 1–4 are identified below. **Subjects 5–8 are NOT identified anywhere** (not on
disk, not in chat). The next session MUST get the owner to name subjects 5–8 before doing any more
grilling. Do NOT invent them.

## What's DECIDED and LOCKED (per grill)

### Grill #1 — Student Memory (ADR-0001, ratified)
- Memory follows the student across devices (phone → desktop → memory present).
- Sync is ALWAYS ON; no opt-in/off toggle.
- Privacy by device-side encryption (PocketBase stores only ciphertext it can't decrypt).
- Recovery key: human-readable 4–6 word phrase, set up only when adding a 2nd device.
- Mastery shape: label (`mastered`/`needs_work`/`not_started`) + confidence (0–100).

### Grill #2 — Practice Delivery (ADR-0002, ratified)
- 1:1 practice lesson per teaching lesson; drills cumulative chords.
- 11-drill menu; ≥3 options per lesson; order: warm-up → accuracy → retrieval → speed → weak-pair.
- Listening-driven default for chord drills; mic once-per-session + global toggle + sim fallback.
- Voice-first practice controls (talk to the AI like a teacher); Chatterbox voice.
- Local-first store now; converges to ADR-0001 encrypted sync when app shell ships.

### Grill #3 — Mystery Mode (ADR-0003, ratified THIS session)
- Advanced ear-training lane, unlocks ONLY after capstone (lesson 25). Independent challenge.
- Songs unlock progressively by difficulty inside the mode (not all 10 at once).
- Two modes: pick-from-list (default/first) AND play-along (optional, needs mic).
- 3-hint ladder (chord count → one named chord → key); 3rd miss = full reveal.
- NO fail/"gave up" state — every mystery ends "solved." Progress = clean vs helped solves.
- **Sage SPEAKS all lines** (Chatterbox); progress saves to Student Memory (ADR-0001).
- After a solve, Sage offers to PLAY THE SOLVED SONG TOGETHER (reuses Path B duet).
- Sage re-engages via Student Memory when a new mystery unlocks.
- Deferred (not v1): mystery badge on songs, creativity seed.

### Grill #4 — The Teacher / World 1 Emerald Hollow (ADR-0004, proposed → owner said "write the tickets")
- World 1 = Emerald Hollow (cozy Celtic fantasy tavern-in-the-woods, animated/Godot, not photo-real v1).
- **Teacher name: Sage** (chill, warm, encouraging; one Chatterbox built-in voice; named 2026-08-24).
- Performance ladder: Level 1 after lesson 6, Level 2 after lesson 13, Level 3 capstone (lesson 25, band).
- Duet: Path B (pre-built smart accompaniment, loops/waits/simplifies) ships v1; Path A (live adaptive)
  is a roadmap item with a clear "revisit when…" trigger.
- 4 owner decisions recorded (T-A1=B FLUX→Wan; T-A2=lesson 6/13; T-A3=A full 10-song catalog;
  T-A4=pre-built per song).
- Tickets written (T-B1…T-B9 + roadmap T-C1/C2/C3); T-B9 (mystery→Sage play-together bridge) added
  THIS session to connect Grill #3 to the teacher system.

## Files on disk (all in Desktop/GuitarApp/)

| File | What it is |
|------|-----------|
| `docs/adr/0001-always-on-encrypted-sync.md` | Student Memory decision record (ratified) |
| `docs/adr/0002-practice-delivery.md` | Practice Delivery decision record (ratified) |
| `docs/adr/0003-mystery-mode.md` | Mystery Mode decision record (ratified 2026-08-24) |
| `docs/adr/0004-the-teacher-world-1-emerald-hollow.md` | The Teacher / World 1 (proposed; Sage name added) |
| `.scratch/teacher/tickets.md` | Grill #4 build tickets (T-B1…T-B9, T-C1/C2/C3) — patched this session |
| `CONTEXT.md` | Glossary (Teacher, Performance ladder, Path A/B duet, Emerald Hollow, etc.) |
| `02-spec/guitar-app-spec-AMENDMENT-17.md` | World 1 + performance ladder spec |
| `brand-references/emerald-hollow/` | World 1 reference kit (palette lock — SURVIVED transfer) |
| `HANDOFF-grill4-teacher-20260823.md` | Prior Grill #4 handoff (superseded by this file for state) |

## Active next step

**Get the owner to name grill subjects 5–8.** We have completed 1–4. The "8 subjects" list is the
owner's; it was never written down. Once named, grill #5 the same way (one question at a time, plain
language, redline answers, write an ADR, then tickets if it's a build subject).

If the owner says "subject 5 is X," start a fresh grill: interview → ADR → (tickets if build) → review,
all in one chat.

## Palette lock (DO NOT violate — measured, not guessed; for Emerald Hollow assets)
- Brightness 75–120/255 (dark-to-moody). Saturation 0.14–0.33 (muted-to-moderate).
- Dominant: near-black #202020, mid-dark stone #404040, forest greens #204020/#406040, olive-tan #404020/#606040, fog #c0c0c0.
- Warm accents (firelight, lantern, wood) are the contrast — NOT saturated color.
- Full hex table in `brand-references/emerald-hollow/world-emerald-hollow.md`.

## What NOT to do
- Do NOT invent grill subjects 5–8. Get them from the owner.
- Do NOT claim FLUX/Wan pipeline has run or assets exist without verifying on disk
  (`ls -d ~/re/flux`, `test -d assets`). As of 2026-08-24 the pipeline is NOT run; no assets in-repo.
- Do NOT claim the `07-app/godot/` scaffold exists — it did NOT survive the PC transfer. Owner opens in
  Godot 4.7.x when available.
- Do NOT re-ask the locked Grill #1–#4 decisions.
- Do NOT generate a hand/finger for Sage with FLUX (hand-safe rule). Fretboard diagram is the precision
  reference for fingerings.
- Do NOT let GuitarApp "Sage" (teacher) be confused with the team-ops "Sage" (Sherry's chief of staff) —
  completely separate, no overlap.

## Hard rules still live (from AGENTS.md — always on)
- Rule 5: LLM prose only; cites stored numbers only. Sage's praise lines MUST cite a stored fact
  (clean/helped solve flag, confidence number) — never freelanced praise ("you did really well" alone
  breaks this).
- Rule 9: Voice license blocklist = copyright law. Chatterbox (MIT) = shipping voice. ElevenLabs blocked
  for paid app. Never re-propose.
- Rule 2: No camera, no hand tracking.
- AMENDMENT-07: FLUX.1[schnell] only for image gen. Midjourney excluded.
- AMENDMENT-14: Hint text + Sage lines get a human lyric read-through before ship.

## Dependency / blocker note
- **ADR-0001 (encrypted cross-device sync)** is a dependency for "Sage remembers you across devices"
  (Mystery re-engagement, performance progress). Until built, those features use local-first data.
- **The 8-subject list is the open blocker.** Everything else for grills 1–4 is recorded and consistent.
