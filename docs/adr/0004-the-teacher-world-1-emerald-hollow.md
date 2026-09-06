# docs/adr/0004-the-teacher-world-1-emerald-hollow.md

**Status:** RATIFIED (2026-08-29 by owner Heidi; the Grill #4 direction is also recorded as
accepted by the owner on 2026-09-02) — was proposed Grill #4 2026-08-23. Ratified with the
world-building-prompt routing change (see AMENDMENT-17). World 1 = Emerald Hollow (animated,
palette locked), teacher = Sage, performance ladder (L1 porch ~5-6 / L2 village ~10-12 /
L3 capstone L25 full band), Path B duet v1 / Path A roadmap — all locked as written.
**Supersedes:** nothing (new ADR)
**Related:** ADR-0001 (always-on encrypted sync), ADR-0002 (practice delivery),
ADR-0003 (mystery mode), AMENDMENT-06 (avatar/voice unlock),
AMENDMENT-09 (Wan2.1 + Godot story-world), AMENDMENT-11 (world-locked teacher thesis)

---

## Context

AMENDMENT-11's product thesis bundles three things: (1) world-locked teacher,
(2) longitudinal student memory, (3) teacher–student duet. Student memory (Grill #1)
and practice delivery (Grill #2) are done. Mystery mode (Grill #3) is done this session.
Grill #4 = the teacher.

The owner wants a **credible real-ish instructor** who lives inside an **animated world
that feels real and high quality**, with **different teachers in different worlds** down
the road. The first world + first teacher are the proof. The owner also wants the teacher
to **play along with the student** (duet) and escalate to a **performance/bar/band** as the
student progresses through the curriculum.

This ADR locks the **what** for World 1 + the first teacher. The **how** (build spec, tickets)
follows in the spec.

---

## Decision

### World 1 = "Emerald Hollow"

The first world is the **enchanted medieval Celtic village** from the owner's YouTube
reference ("The Heart of an Enchanted Medieval Village | Emerald Hollow"). It is a **cozy
fantasy tavern-in-the-woods** world: half-timbered cottage/tavern with moss-covered sod roofs,
hanging flower baskets, wooden barrels, cobblestone street, volumetric mist, overcast soft
light, early-morning damp atmosphere. Branded internally as **Emerald Hollow**.

- **Medium:** High-end animated production (Godot 4.x). Not photo-real for World 1 — that is
  a separate track to try later.
- **Why this world:** Owner explicitly pointed to it as the starting world. It has a clear,
  documentable mood (cozy fantasy, verdant, mystical, welcoming) that translates to a lesson
  setting. The tavern porch gives a natural place for the teacher to stand and teach.
- **Palette lock:** Documented in `brand-references/emerald-hollow/world-emerald-hollow.md`
  (measured from 5 video segments, 24fps, 640×360). Key facts: brightness 75–120/255
  (dark-to-moody), saturation 0.14–0.33 (muted-to-moderate), dominant colors are near-black
  shadow (#202020), mid-dark stone (#404040), forest greens (#204020, #406040), and muted
  olive-tan (#404020, #606040). Any generated still must respect this muted/earthy range.

### First teacher = Sage

- **Name: Sage.** The chill, warm, encouraging instructor of Emerald Hollow (World 1). Named 2026-08-24
  (Grill #3, Mystery Mode grill — Sage is the teacher across lessons, performances, AND mystery mode).
- **Personality:** Chill, warm, encouraging — inherits the Grill #3 teacher-voice rule
  ("warm and encouraging, never clinical"). Praise the past win, soften the turn, invite the
  next step.
- **Voice:** One Chatterbox built-in voice (MIT, zero-shot clone + emotion). No voice cloning
  from a real person for World 1. Voice matches personality + world (chill voice in a cozy
  forest tavern).
- **Look:** High-quality animated character. Personality + look + voice + world must be
  internally consistent — a chill teacher in a cozy forest-tavern world.
- **Presence:** The teacher is in the world **throughout** — during regular lessons AND
  performances. World-locked means the teacher is always there in that world.

### Performance ladder

| Level | Approx. lesson gate | Setting | What happens |
|-------|--------------------|---------|-------------|
| Level 1 | ~5–6 lessons (TBD by Hermes vs actual curriculum) | Tavern porch in Emerald Hollow | Student performs what they've learned; teacher accompanies. Low pressure. |
| Level 2 | ~10–12 lessons (TBD) | Same or expanded Emerald Hollow moment | Student plays more chords/song; teacher encourages harder pace. |
| Level 3 (capstone) | Lesson 25 (curriculum capstone) | Bar/stage with full band | Student "joins the band" — bass, drums, teacher on second guitar. The same recurring performance song returns in front of a crowd. |

- **Level 1 and Level 2 timing bands are ratified here.** Level 1 happens early, around lessons
  5–6, and for the first shipped slice it lands at the end of **Lesson 5**. Level 2 happens in the
  middle, around lessons 10–12, with the exact lesson ID still open.
- **Level 1 is the first reward moment.** The student practices through their first set of
  lessons, the teacher senses they're doing well, and invites them to perform on the porch.
- **Level 1 uses a curated small set.** The first performance moment should feel guided and easy
  to win, not like a giant song menu.
- **All three performance rewards use the same song.** Repetition is intentional: the student grows
  with one recurring performance song so the capstone feels earned and familiar.

### Duet — Path A (goal) vs Path B (v1 ships)

- **Path A (the goal):** Live adaptive teacher. The app listens to the student's guitar in
  real time; the teacher's part adapts — slows down when the student slows, waits when the
  student stops, adjusts when the student struggles, pushes gently when the student is ready.
  This is the hardest engineering piece in Grill #4 and the most valuable.
- **Path B (v1 ships):** Pre-built teacher accompaniment tracks for each performance, but
  **smart** — the track doesn't punish the student for falling behind (it loops, waits, or
  simplifies). The teacher is visible and encouraging (using the same voice/dialogue system),
  but the accompaniment is pre-built per performance, not generated live. This is what actually
  ships in v1.
- **Path A is NOT dropped.** It gets a **visible roadmap item** in this ADR with a clear
  "revisit when…" trigger: *Revisit Path A when (a) student memory is live and encrypted
  cross-device, (b) the on-device listening engine reliably classifies clean chord changes in
  real time, and (c) the adaptive accompaniment model is prototyped.* Until those three are
  true, Path A stays on the roadmap but does not block v1.

### Multiple teachers / worlds = World 2+

- Different teachers, different personalities, different voices, different clothes, male and
  female teachers = **World 2 and beyond.** NOT in World 1.
- World 1 proves the concept: one teacher, one world, one performance ladder, one voice.
- World 2 brings a new personality, new look, new voice, new setting.
- **Fun future option (not committed):** A forest world where the teacher is a talking Beaver.
  Polemical, not serious — but signals the range the owner wants.

---

## Consequences

### Positive

- World 1 is concrete and documentable (measured palette, described setting, literal YouTube
  reference locked in `brand-references/emerald-hollow/`). No hand-waving about "a world."
- The performance ladder gives the student a **real reward arc** — practice → perform → grow →
  capstone band. This is the product's emotional core.
- Path B ships a working duet in v1 without blocking on the hardest adaptive-accompaniment
  engineering. Path A stays on the roadmap and gets revisited when the prerequisites are true.

### Negative / trade-offs

- **Path B is not "the teacher really adapts."** It's a pre-built smart accompaniment. If the
  owner wants true live adaptation in v1, Path B will feel like a compromise — we need to be
  honest about that.
- **World 1 is one world.** The owner's "lots of worlds, lots of storylines" vision is deferred
  to World 2+. We need to make sure the architecture supports adding worlds/teachers without
  rewriting World 1.
- **Animated production is a build.** High-quality animated character + animated world in Godot
  is real work. **Updated 2026-09-06 (world/app merge):** the pipeline HAS been run for the
  World 1 cold open — `07-app/godot/assets/worlds/emerald-hollow/` holds three Theora clips
  (`B00_walkin`, `B01_meetsage`, `B02_twoshot`), four stills, and five Chatterbox voice takes,
  and the Godot project plays them via the `W1-coldopen` manifest entry. The earlier
  "NOT YET RUN — no AI cinematic assets exist in-repo as of 2026-08-29" note is superseded.
  Still ungenerated: per-lesson cinematics (`assets/lessons/L01-open-c.mp4`), which is why
  `lesson_manifest.json` carries a `_todo_blocked` marker on `L01-open-c`. Producing those
  needs the RunPod pod restarted (cloud GPU for FLUX/Wan) or hand-authored assets.
- **Chatterbox built-in voice only for World 1.** If the owner later wants a specific cloned
  voice, that's a new decision + the voice license blocklist still applies (no ElevenLabs for
  a paid app).

### Neutral

- **ADR-0001 (encrypted sync)** is a dependency — performance progress saves to student memory
  (encrypted cross-device). Until ADR-0001 is built, performances can still work locally but
  the "memory follows you across devices" piece is absent.
- **AMENDMENT-09 (Godot story-world)** is the production vehicle. The Godot scaffold IS
  present and wired on this machine (verified 2026-08-29): `07-app/godot/project.godot` points
  at `World.tscn`; real scripts+scenes live under `lesson/` (FingeringOverlay, LessonScene) and
  `world/` (World) — the top-level `FingeringOverlay/`/`LessonScene/` folders are empty decoys.
  The earlier "did not survive the PC transfer" note (2026-08-23) was wrong. Owner opens in
  Godot 4.7.x.

---

## Open items (to resolve in spec/tickets phase)

1. **Choose the exact lesson ID for Level 2** — Level 1 is now fixed at the end of Lesson 5.
   Level 2 stays open inside the ratified ~10–12 range.
2. **Who is in the Level 3 band, exactly?** Bass + drums + teacher on second guitar is the
   owner's picture. Confirm: is the band pre-built per song, or assembled by the app?
3. **Student picks the song at Level 3** — from the song-progression catalog (11 songs, 11
   shapes)? Or from a smaller "you know these chords" subset? Constraint: the song's chords
   must all be taught by that point (AMENDMENT-13 prereq gate).
4. **Animated character source:** Hand-authored Godot character rig? AI-generated stills
   (FLUX) + motion (Wan)? Or a mix? Not decided — depends on what "high quality animated"
   means in production and what the pipeline produces when run.
5. **Path A revisit trigger — refine the three prerequisites.** Currently: (a) student memory
   live + encrypted cross-device, (b) listening engine reliably classifies clean chord changes
   in real time, (c) adaptive accompaniment prototype exists. Owner may want to sharpen these.

**Resolved 2026-09-02 by owner:** use the simple **Em→C first song** as the recurring performance
song for the ladder.

---

## Red lines inherited from AGENTS.md (always live)

- Rule 5: LLM writes prose only; cites stored numbers only. The teacher's encouragement cites
  mastery/confidence from student memory — never freelances a musical opinion.
- Rule 9: Voice license blocklist is copyright law. Chatterbox (MIT) = shipping target.
  ElevenLabs blocked for paid app. Never re-propose.
- Rule 2: No camera, no hand tracking.
- AMENDMENT-06: Realistic/photoreal avatars + Chatterbox IN SCOPE (overrides old cartoon-only
  mandate). Avatars MAY demonstrate fingerings — driven from chord-theory-check.js data, not
  free-generated.
- AMENDMENT-07: FLUX.1[schnell] only for image generation. Midjourney excluded.
