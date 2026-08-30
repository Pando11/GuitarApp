# .scratch/teacher/tickets.md

**Feature:** Grill #4 — The Teacher (World 1: Emerald Hollow)
**Spec:** `02-spec/guitar-app-spec-AMENDMENT-17.md`
**ADR:** `docs/adr/0004-the-teacher-world-1-emerald-hollow.md`
**ADR (related):** `docs/adr/0003-mystery-mode.md` (Grill #3 — ratified 2026-08-24; Sage is the teacher across lessons, performances, AND mystery mode)
**Teacher name:** Sage (chill, warm, encouraging; one Chatterbox built-in voice — named 2026-08-24, Grill #3)
**Grill:** #4 of rolling list (student memory #1, practice delivery #2, mystery mode #3, teacher #4)
**Status:** in build — owner decisions resolved 2026-08-23; Grill #3 (Mystery Mode) ratified 2026-08-24 + integrated below (T-B3 Sage lines, T-B9 mystery→duet bridge); T-B1 (Emerald Hollow scene) starting
**Issue tracker:** local file (this file) per `AGENTS.md` issue-tracker note. No GitHub needed.

---

## Legend

- **Owner-decision** = blocked until owner confirms. Agent does NOT guess.
- **Build** = agent implements. Ship gates apply where relevant.
- **Roadmap** = visible future item; never marked complete until its trigger is met.
- **Shipped** = behind a feature flag or dogfood, not necessarily paid-launch-ready.

---

## A. Owner decisions (block the build — resolve first)

These have to be decided before the build tickets below can be sized. Agent surfaces them here;
owner picks. No default — each has a real choice.

### T-A1: Animated character source — how do we make the first teacher?

**Why it blocks:** Drives the entire production approach — Godot rig vs AI stills+motion vs a mix.

**Choices:**
- **A. Hand-authored Godot character rig.** Build the teacher as a Godot character (skeleton, rig,
  animations) authored directly in `07-app/godot/`. No FLUX/Wan pipeline needed for the character.
  More control, slower to iterate on look.
- **B. AI-generated stills + motion (FLUX → Wan).** FLUX.1[schnell] (Apache-2.0) paints the teacher +
  world stills from a prompt; Wan2.1-I2V (Apache-2.0) animates them; Chatterbox (MIT) provides voice;
  Godot displays. Needs rented cloud GPU (~$0.50 per 20-lesson set). Pipeline is spec'd but NOT RUN
  as of 2026-08-23 (no assets in-repo).
- **C. Mix —** e.g. AI-generated teacher stills (FLUX) placed into a hand-built Godot world scene, OR
  hand-built character in an AI-generated world. Hybrid.

**Owner picks A, B, or C.** If B or C, confirm the cloud GPU budget is approved (one-time ~$0.50;
  no subscription). Note: the pipeline install-state is NOT RUN — even if a model dir exists, verify
  on disk before claiming it works (see `AGENTS.md` install-state gotcha: `test -d assets` is the
  execution probe).

**Acceptance:** Owner choice recorded in this file (replace "TBD" below). If B or C, a FLUX prompt
sketch is drafted and the palette lock from `brand-references/emerald-hollow/world-emerald-hollow.md`
is attached to the prompt (muted/earthy range, brightness 75–120/255, saturation 0.14–0.33).

---

### T-A2: Exact lesson gates for Level 1 and Level 2

**Why it blocks:** The performance ladder's Level 1 and Level 2 gates aren't decided in the spec
(not guessed — the spec said "map vs actual curriculum"). The build needs to know when the teacher
extends the Level 1 and Level 2 invitations.

**What to do:** Hermes maps the ladder against the actual 25-lesson AMENDMENT-15 curriculum order.
Current order (from `AGENTS.md`): 01 welcome-anatomy-tuning, 02 holding-the-pick, 03 first-chord-em,
04 second-chord-first-song, 05 strumming-in-time, 06 switching-em-and-c, 07 chord-changes-em-easyc,
08 new-chord-g, 09 first-three-chord-song, 10 new-chord-d, 11 new-chord-a, 12 new-chord-am-big-four,
13 four-chord-songs, 14 up-strums, 15 strumming-patterns, 16 faster-chord-changes, 17 new-chord-f,
18 new-chord-e, 19 new-chord-a7, 20 minor-progressions-dm, 21 dynamics-alternating-bass, 22 capo-basics,
23 fingerpicking-travis, 24 read-chord-chart-tab, 25 consolidation-performance (capstone LAST).

**Suggested starting point (NOT decided — owner confirms or changes):**
- **Level 1 gate:** After lesson 6 (switching-em-and-c, the first real two-chord fluency moment).
  Student has Em, C, and basic strumming. A porch performance with those two chords + a simple strum
  pattern is a real, achievable first reward.
- **Level 2 gate:** After lesson 13 (four-chord-songs) or lesson 16 (faster-chord-changes). Student
  has a wider chord set and more fluency. A bigger Emerald Hollow performance with a simple four-chord
  song.

**Acceptance:** Owner confirms or changes the Level 1 and Level 2 lesson numbers. Recorded in this
file. The numbers feed T-B4 (performance ladder flow).

**Blocker note:** The student memory ADR-0001 is a dependency for "the teacher senses the student is
doing well" — mastery/confidence numbers come from student memory. Until ADR-0001 is built, the
invitation logic can use local-first fluency data (the practice engine already has `fluencyStore`
with per-pair state). So the ladder can ship with local data + graduate to encrypted cross-device
memory when ADR-0001 lands. Don't block T-A2 on ADR-0001 being built.

---

### T-A3: Level 3 song pick scope

**Why it blocks:** The build needs to know what song list to show the student at the Level 3 bar
performance.

**Choices:**
- **A. Full 10-song song-progression catalog.** Student picks any of the 10 songs in
  `07-app/content/song-progressions/`. All 10 are within the taught set by Lesson 25 (F at L17,
  A7 at L19). The song-progression gate (`node tools/verify-song-progressions.js`) enforces the
  chord-prereq check. House of the Rising Sun = public domain (no disclaimer); the other 9 need the
  "not affiliated / not endorsed" disclaimer on the select card + reveal (AMENDMENT-12/14).
- **B. Curated subset.** A smaller "songs you're ready to perform" list, hand-picked for the
  performance moment (e.g. 3–4 songs that feel like "bar songs" — confident, recognizable). Still
  constrained: all chords must be taught by L25.

**Owner picks A or B.** If B, the curated subset is authored and the song-progression gate still runs
on every song in it (the gate proves mechanics, not legal safety — legal disclaimer still required for
the 9 non-public-domain songs).

**Acceptance:** Owner picks A or B. If B, the subset is listed in this file.

---

### T-A4: Level 3 band composition

**Why it blocks:** The build needs to know what the band looks like — what tracks/instruments are in
the accompaniment at the capstone bar performance.

**Owner's picture:** Bass + drums + teacher on second guitar. Student = first guitar. Student picks
the song.

**Confirm:**
- Is the band **pre-built per song** (each song has its own bass/drums/teacher-guitar accompaniment
  track), or **assembled by the app** (the app generates/composes the band part for the chosen song)?
- Path B (v1) = pre-built accompaniment tracks (the smart loop/wait/simplify system). So if the owner
  picks pre-built-per-song, each song in scope (T-A3) needs its own accompaniment track authored. If
  the owner picks assembled-by-app, that's closer to Path A territory and needs a prototype decision.

**Owner confirms:** pre-built per song (Path B, v1) or assembled by app (Path A-adjacent, later).

**Acceptance:** Owner choice recorded. If pre-built-per-song and T-A3 = full catalog (10 songs), that's
10 accompaniment tracks to author — a real scope number that should be visible.

---

## B. Build tickets (in build order)

These depend on A1–A4 being resolved. Agent picks up where the owner decisions land.

### T-B1: Emer Hollow scene — first Godot world proof

**Depends on:** T-A1 (character source), T-A2 (Level 1 gate, so we know the scene is for Level 1
performances on the porch).

**What:** Build the first Emerald Hollow Godot scene — the tavern porch where Level 1 performances
happen. Per AMENDMENT-09, the Godot story-world scaffold (`project.godot` + World/LessonScene/
FingeringOverlay scenes, MIT) is the production vehicle. **As of 2026-08-23 on this machine,
the `07-app/godot/` tree does NOT exist on disk** (the full repo did not survive the PC
transfer — only the 7 root files are present). The engine is NOT installed. Owner opens in
Godot 4.7.x. If/when the scaffold is restored or recreated, the agent prepares the scene files.

**Scene content (from the spec + brand-references analysis):**
- Tavern porch, eye-level, teacher framed center or center-right.
- Porch railing + flower boxes with greenery behind the teacher.
- Wooden barrels to one side (tavern = serves ale/mead).
- Moss-covered sod roof (multiple gables, stone chimney) visible behind/above the porch.
- Half-timbered cottage walls (dark beams + weathered plaster).
- Cobblestone ground (irregular grey stones).
- Hanging wicker baskets from eaves.
- Background: misty greens, tall evergreens, volumetric fog.
- Mood: overcast soft light, no harsh shadows, early-morning damp.

**Palette constraint (measured, not guessed):** Brightness 75–120/255 (dark-to-moody). Saturation
0.14–0.33 (muted-to-moderate). Dominant colors: near-black shadow (#202020), mid-dark stone (#404040),
forest greens (#204020, #406040), muted olive-tan (#404020, #606040). Full palette in
`brand-references/emerald-hollow/world-emerald-hollow.md`. Any generated or authored asset must respect
this range.

**If T-A1 = B or C (FLUX/Wan pipeline):** Draft the FLUX prompt for the first teacher-on-porch still.
Attach the palette lock. The prompt must stay within the commercial-clean stack (FLUX.1[schnell]
Apache-2.0 only; AMENDMENT-07; Midjourney excluded per AMENDMENT-08). Note in the ticket whether the
pipeline has actually been executed (verify on disk: `test -d assets` — its absence means zero assets
exist even if a model dir does).

**If T-A1 = A (hand-authored Godot rig):** The character rig + scene are authored in Godot. The
character's look must match the world (chill teacher in a cozy forest tavern) — clothing, posture,
palette all consistent with Emerald Hollow.

**Acceptance:**
- A Godot scene file (or scene + tile/prop set) for the Emerald Hollow porch is on disk
  **in `07-app/godot/` (or a subfolder) once that tree exists on this machine** (the full
  `07-app/` tree did not survive the PC transfer), ready for the owner to open in Godot 4.7.x.
- The scene reads as Emerald Hollow: porch + barrels + moss roof + flower boxes + misty greens behind.
- The palette respects the measured range (spot-check a screenshot against the hex table).
- Either a character is visible in the scene (hand-authored or FLUX still placed), or the scene is
  empty-but-correct and the character ticket (T-B2) is the next step.

**Out of scope for this ticket:** animation (idle/sway/etc.), the teacher's voice/dialogue (T-B3),
the accompaniment (T-B4/T-B5), the performance ladder flow (T-B6). This ticket is the visual world
proof.

---

### T-B2: First teacher character — look + rig (Emerald Hollow)

**Depends on:** T-A1 (character source), T-B1 (scene, so we know where the character stands).

**What:** The first teacher character for Emerald Hollow — one chill instructor, high-quality animated
look, consistent with the world.

**What "consistent" means (spec section "First teacher = one chill instructor"):**
- **Personality:** Chill, warm, encouraging (Grill #3 rule).
- **Look:** High-quality animated. Clothing, posture, expression all read as "chill teacher in a cozy
  forest tavern" — not a mismatch (e.g. not a bright neon character in a dark moody world).
- **Voice:** One Chatterbox built-in voice (T-B3 handles the voice integration; this ticket is the
  look/rig).
- **Fingering demonstrations (if any):** Driven from the arithmetically-verified
  `chord-theory-check.js` data (AMENDMENT-06), not free-generated. The 2D fretboard diagram remains
  the precision reference. For the first proof, fingerings may be out of scope (T-B2 is the character;
  fingering demos are a later pass).

**If T-A1 = A (hand-authored Godot rig):** Character skeleton + rig + base animations (idle, maybe
  hold-guitar pose) authored in Godot. Placed in the T-B1 scene.

**If T-A1 = B (FLUX → Wan):** FLUX prompt for the teacher character still (on the porch, holding a
guitar, chill posture). Palette lock attached. Wan2.1-I2V animates the still (motion: slight sway,
breathing, guitar shift). The character still + motion are produced via the pipeline (cloud GPU for
FLUX/Wan if not already run).

**If T-A1 = C (mix):** The relevant combination — e.g. FLUX teacher still placed into the hand-built
Godot scene, with hand-authored idle animation in Godot.

**Character source NOT decided in the spec** — T-A1 is the owner decision. This ticket is blocked on
T-A1. Once T-A1 lands, this ticket is sized by the choice.

**Acceptance:**
- A first-teacher character is on disk and visible in (or placeable into) the Emerald Hollow scene.
- The character reads as a chill teacher in a cozy forest-tavern world (not a mismatch).
- If hand-authored: rig + base idle animation in Godot.
- If FLUX-based: still on disk, palette respects the measured range, prompt + palette lock attached to
  the ticket.
- Fingering demos are NOT required for this ticket (they're a later pass; the 2D fretboard diagram is
  the precision reference meanwhile).

**Out of scope:** voice/dialogue (T-B3), accompaniment (T-B4/T-B5), ladder flow (T-B6).

---

### T-B3: Teacher voice + dialogue system — Chatterbox integration + encouraging copy

**Depends on:** T-A1 (voice = Chatterbox built-in for World 1). Mostly independent of T-B1/T-B2
(voice doesn't require the scene to be finished — the dialogue system can be built and tested
alongside).

**What:** The system that makes **Sage** speak — Chatterbox (MIT) built-in voice for World 1, with
the encouraging-copy tone rule (Grill #3) enforced. Sage is the teacher across regular lessons,
performances, AND Mystery Mode (ADR-0003) — one voice, one personality, all of World 1.

**Core behavior:**
- The teacher speaks during regular lessons AND performances (world-locked = always present).
- All teacher copy is **warm and encouraging, never clinical** (Grill #3 rule). Praise the past win,
  soften the turn, invite the next step.
- The teacher's copy **cites stored mastery/confidence numbers (Rule 5)** when it references the
  student's progress — never freelances a musical opinion. Correct: "your Em confidence is up to 72."
  Wrong: "you're a natural."
- The teacher's voice is **one Chatterbox built-in voice** for World 1 (no cloning from a real person).

**What to build:**
- A dialogue/line system: **Sage** has a set of lines for each context — regular lesson coaching,
  pre-performance invitation, post-performance encouragement, performance-adapt messages, AND
  mystery-mode lines (present the mystery, react to the solve, speak the "why it works" reveal line,
  and re-engage the student when a new mystery unlocks — see ADR-0003). Lines are authored as data
  (not hardcoded prose in code), so they can be tuned.
- Chatterbox voice integration: the line text is sent to Chatterbox (MIT, zero-shot + emotion) and the
  resulting audio plays. Kokoro-82M (Apache-2.0, CPU) = fallback if Chatterbox isn't available.
- Emotion range (opt-in): Chatterbox supports emotion — warm/encouraging is the baseline; the system
  could vary tone by context (celebratory on a win, gentle on a struggle). For World 1, start with
  warm/encouraging baseline; emotion variation is a later pass unless the owner wants it now.
- Voice license blocklist check: Chatterbox (MIT) = approved. ElevenLabs = blocked (Rule 9, copyright
  law, never re-propose). The ticket should note the approved list from `AGENTS.md` (Chatterbox, Kokoro,
  OpenAI TTS, MeloTTS/StyleTTS2 = MIT approved) and confirm the integration uses an approved voice.

**AMENMENT-05 constraint:** Audio is on-device, never uploaded. The teacher's voice is generated by
Chatterbox (server-side or device `speechSynthesis` fallback) — the student's guitar audio for the duet
is on-device only. The teacher's voice and the student's guitar are separate streams; only the student's
guitar audio is constrained by the "never uploaded" rule.

**Acceptance:**
- A dialogue/line system is on disk: teacher lines authored as data for each context (regular lesson,
  pre-performance invitation, post-performance encouragement, performance adapt).
- A Chatterbox integration path is on disk (or Kokoro fallback): line text → voice audio → plays.
- Spot-check: pick a few lines at random and read them aloud (or transcribe the output) — they are warm
  and encouraging, NOT clinical. Lines that reference student progress cite a stored number (or are
  written to cite one once student memory is live).
- No ElevenLabs or blocked-voice dependency in the integration.
- Voice license check documented in the ticket (approved voice used, blocklist respected).

**Out of scope:** the accompaniment (T-B4/T-B5), the performance ladder flow (T-B6), student memory
integration (T-B7 — that's the ADR-0001 dependency).

---

### T-B4: Path B duet — pre-built smart accompaniment (Level 1 porch performance)

**Depends on:** T-A2 (Level 1 gate), T-A3 (song scope if Level 1 uses a song), T-A4 (band composition
if Level 1 has accompaniment parts), T-B2 (teacher character so the teacher is visible), T-B3 (teacher
voice so the teacher can speak during the performance).

**What:** The Path B duet for Level 1 — pre-built teacher accompaniment for the first porch performance,
with smart loop/wait/simplify behavior so the student isn't punished for falling behind.

**What the student sees/hears at Level 1:**
- The teacher is on the porch (T-B1 scene + T-B2 character), visible.
- The teacher speaks (T-B3 voice): pre-performance encouragement, then the performance starts.
- The teacher plays along (pre-built accompaniment track) — smart: loops the section if the student
  stops/falls behind, waits if the student pauses, simplifies if the student is struggling (low
  confidence on the chords in play).

**What to build:**
- The Level 1 accompaniment track: a pre-built audio arrangement the teacher "plays" during the porch
  performance. For Level 1, the student has ~2 chords (Em, C) + basic strumming (after lesson 6). The
  accompaniment is simple — guitar comping the two chords in a strum pattern, at a pace the beginner
  can follow.
- The smart loop/wait/simplify controller: a system that watches the student's progress (via the
  on-device listening engine, AMENDMENT-05, OR via a simpler "student is playing / stopped" signal for
  the first proof) and adjusts the accompaniment: loops the current section, waits, or simplifies.
- The performance flow: teacher invites → student performs → teacher accompanies smartly → performance
  ends → teacher gives post-performance encouragement (T-B3 lines).

**Listening engine constraint (AMENDMENT-05):** The student's guitar audio is on-device, never uploaded.
The accompaniment is app-generated/pre-built — not a recording of a real person uploaded to a server.
The duet is the app playing along with the student's on-device audio.

**Path B honesty:** This ticket is Path B — pre-built smart accompaniment, NOT live adaptive. The ticket
must note this clearly so nobody later claims "the teacher adapts live" when it doesn't yet. The Path A
roadmap ticket (T-C1) is the live-adaptive future.

**Acceptance:**
- A Level 1 accompaniment track is on disk (pre-built, simple, beginner-appropriate for the Level 1 chord
  set).
- The smart loop/wait/simplify controller is on disk and wired to the performance flow.
- End-to-end: launch the Level 1 performance → teacher invites → student plays → teacher accompanies with
  smart behavior → performance ends → teacher encourages. Verified on the actual device/browser (file://
  if that's the delivery target per `AGENTS.md`, or the LAN server if the live app is used).
- The ticket notes Path B vs Path A clearly.

**Out of scope:** Level 2 and Level 3 accompaniment (separate tickets — T-B5), live adaptive (T-C1).

---

### T-B5: Path B duet — Level 2 + Level 3 accompaniment (capstone band)

**Depends on:** T-A2 (Level 2 gate), T-A3 (song scope for Level 3), T-A4 (band composition for Level 3),
T-B4 (Level 1 Path B system — Level 2/3 extend the same system), T-B2/T-B3 (teacher visible + voice).

**What:** Extend the Path B duet system to Level 2 (bigger Emerald Hollow performance) and Level 3
(capstone bar with full band: bass + drums + teacher on second guitar).

**Level 2:**
- Bigger performance than Level 1 — more chords (after lesson ~13 or ~16), a simple four-chord song.
- Accompaniment is fuller than Level 1 (more layers) but still Path B (pre-built, smart loop/wait/simplify).
- Same scene (Emerald Hollow porch or an expanded moment).

**Level 3 (capstone, Lesson 25):**
- Bar/stage setting — a new scene or an expanded Emerald Hollow moment that reads as "the bar" (the spec
  calls this "bar/stage with full band"). The world is still Emerald Hollow (World 1), but the moment is
  the "join the band" capstone.
- Full band: bass + drums + teacher on second guitar. Student = first guitar.
- Student picks the song (T-A3 scope — full catalog or curated subset; all chords must be taught by L25).
- The band's accompaniment is pre-built per song (Path B) OR assembled by the app (Path A-adjacent) — per
  T-A4 owner decision.

**What to build:**
- Level 2 accompaniment track(s) — pre-built, fuller than Level 1.
- Level 3 band accompaniment — pre-built per song (if T-A4 = pre-built per song) for each song in the
  Level 3 scope. If T-A4 = assembled by app, this ticket is re-scoped (that's closer to Path A and may
  need a prototype decision before build).
- The band scene/moment (bar/stage) — new scene or expanded Emerald Hollow moment. The teacher on second
  guitar is visible, the student is on first guitar, the band (bass/drums) is present.

**Acceptance:**
- Level 2 performance works end-to-end (teacher invites → student performs → teacher accompanies smartly →
  teacher encourages).
- Level 3 band performance works end-to-end: student picks a song (within T-A3 scope) → band plays the
  pre-built accompaniment → teacher on second guitar visible → student plays first guitar → smart
  loop/wait/simplify → performance ends → teacher encourages.
- Level 3 song pick respects the AMENDMENT-12/14 legal position (House of the Rising Sun = public domain,
  no disclaimer; the other 9 = "not affiliated / not endorsed" disclaimer on the select card + reveal).
- Each Level 3 song in scope passes the song-progression gate (`node tools/verify-song-progressions.js` →
  0 errors AND 0 warnings) — the gate proves mechanics (the band accompaniment is a separate thing from
  the gate; the gate is about the song's chord progression data, not the audio).
- The ticket notes Path B vs Path A clearly for both levels.

**Out of scope:** live adaptive (T-C1). The band-assembled-by-app case (if T-A4 picks that) may need a
separate prototype decision — flag it in the ticket if it comes up.

---

### T-B6: Performance ladder flow — when and how the teacher invites the student

**Depends on:** T-A2 (Level 1 and Level 2 lesson gates), T-B4 (Level 1 Path B system), T-B5 (Level 2/3
Path B system). The flow is the wiring that connects "student reaches lesson X" → "teacher extends
invitation" → "performance happens."

**What:** The logic that decides when the teacher invites the student to perform, and the flow that plays
out.

**Flow:**
1. Student completes the lesson that hits the Level 1 gate (T-A2 number).
2. The system checks: is the student doing well enough to invite? (Mastery/confidence on the chords in
   play — from student memory if live, else local-first fluency data. Rule 5: cite a stored number if
   referencing progress.)
3. If yes: **Sage** extends the Level 1 invitation (T-B3 voice line — warm, encouraging, cites the
   number). "You've been practicing those chords and they're feeling more solid (your Em confidence is
   up to 72) — how about we try playing them together on the porch?"
4. Student accepts → Level 1 performance (T-B4 Path B duet).
5. After performance: teacher gives post-performance encouragement (T-B3 line).
6. Performance progress saves (T-B7 — toward student memory; local-first until ADR-0001).
7. Same shape for Level 2 (T-A2 number) and Level 3 (Lesson 25, fixed).

**"The teacher senses they're doing well":** This is the invitation trigger. It's not a subjective call
by the LLM (Rule 5 — no freelancing). It's a data check: the chords in play have reached a confidence
threshold (e.g. confidence ≥ some number, or the last N strums were confident). The threshold is a
tunable number — not decided in this ticket, but the mechanism is: check stored confidence → invite if
above threshold → cite the number in the invitation.

**Acceptance:**
- When the student reaches the Level 1 lesson gate (T-A2 number), the system checks the confidence data
  and (if above threshold) the teacher extends a warm, encouraging invitation that cites a stored number.
- The invitation is voice (T-B3) + visible (T-B2 character in the T-B1 scene).
- Student accepts → Level 1 performance (T-B4) plays out.
- After performance: teacher encourages, progress saves (T-B7).
- Same shape for Level 2 and Level 3.
- The invitation threshold is tunable (a named number somewhere, not hardcoded prose).
- The system does NOT invite if the data says the student isn't ready (e.g. confidence below threshold) —
  the teacher instead says something encouraging but non-performance ("keep at it, you're getting there").

**Out of scope:** student memory encrypted cross-device (T-B7 — ADR-0001 dependency). This ticket uses
local-first fluency data as the source until ADR-0001 lands.

---

### T-B7: Performance progress → student memory (local-first until ADR-0001)

**Depends on:** T-B6 (the flow that saves progress). This ticket is the persistence piece.

**What:** When a performance happens (Level 1/2/3), the performance progress saves so the teacher can
reference it later ("last time you played X, you were solid").

**Two phases:**
- **Phase 1 (v1, local-first):** Performance progress saves to the device's local store (the same
  local-first store pattern from the practice delivery grill — `fluencyStore`-adjacent, in-memory +
  localStorage). The teacher can reference it within the device session. This works now.
- **Phase 2 (when ADR-0001 lands):** Performance progress joins the encrypted cross-device student memory
  (ADR-0001 — always-on, encrypted, cross-device, PocketBase stores only ciphertext). Until ADR-0001 is
  built, cross-device sync is absent — the progress is local-only.

**What's saved (per performance):** level reached, song (if any), chords in play, confidence at time of
performance, outcome (how it went). All as data — the teacher cites these numbers (Rule 5), never
freelances.

**Acceptance:**
- After a performance, the performance progress is saved to the local store (Phase 1).
- The saved data is retrievable and citable by the teacher dialogue system (T-B3) — e.g. "last time you
  played the porch, your Em was at 72."
- The architecture is ADR-0001-ready: the local save has the same shape the encrypted sync will use, so
  when ADR-0001 lands, the local save converges to encrypted cross-device without a rewrite. (This is the
  local-first store pattern from the practice delivery grill.)
- The ticket notes Phase 1 (local-first) vs Phase 2 (ADR-0001 encrypted sync) clearly.

**Out of scope:** ADR-0001 itself (that's a separate grill/build). This ticket is the local-first phase
+ the ADR-0001-ready shape.

---

### T-B8: World 2 architecture prep — make adding worlds/teachers additive

**Depends on:** T-B1 (Emerald Hollow scene) + T-B2 (first teacher character). We know what World 1 looks
like; this ticket makes sure World 2+ can be added without rewriting World 1.

**What:** A lightweight architecture pass so that:
- A new world = a new scene (Godot, **once the `07-app/godot/` scaffold is available on
  this machine**) + new palette reference (brand-references/<world>/).
- A new teacher = a new character + new voice (Chatterbox built-in) + new personality (dialogue lines).
- One world's teacher does NOT leak into another world (owner's rule: "one teacher will not go into
  another world with the student").

**What to build (lightweight — not a full abstraction layer):**
- A world/teacher registry or data file: a small data structure that maps world → scene → teacher →
  voice → personality → palette reference. World 1 (Emerald Hollow) is the first entry.
- The performance ladder flow (T-B6) is world-aware: it knows which world the student is in and uses that
  world's teacher + scene + palette.
- New worlds/teachers are added by adding entries to the registry + new scene/character/voice assets —
  not by editing World 1's code.

**Acceptance:**
- A world/teacher registry or data file exists with World 1 (Emerald Hollow) as the first entry.
- The performance ladder flow reads from the registry (world-aware).
- Adding a World 2 (new scene + new teacher + new voice + new palette reference) is a data + asset add,
  not a code rewrite of World 1.
- The "one teacher doesn't cross worlds" rule is structurally enforced (the registry maps teacher → world;
  a teacher asset is not referenced outside its world).

**Out of scope:** actually building World 2 (that's a future grill). This ticket is the architecture prep
so it's additive when it happens.

---

### T-B9: Mystery Mode → Sage play-together bridge

**Depends on:** ADR-0003 (Mystery Mode, ratified 2026-08-24), T-B3 (Sage voice/dialogue), T-B4/T-B5
(Path B duet system).

**What:** After a student solves a Mystery Mode song (clean or helped), Sage offers to play the solved
song together with them (ADR-0003 decision #9). This is the core practice moment — they heard it by ear,
now they play it with Sage. Sage's lines here MUST cite stored numbers (Rule 5): e.g. "you cracked that
one clean — let's play it together" vs "you got it with a little help — let's try it together."

**Reuse, don't rebuild:** The play-together uses the **Path B smart accompaniment** (loops/waits/simplifies)
from T-B4/T-B5 — NOT a new engine. Sage is visible + encouraging (same voice/dialogue system as regular
lessons and performances).

**Sage re-engagement (ADR-0003 decision #11):** When a new mystery unlocks, Sage references the student's
*past* solve from Student Memory (ADR-0001, encrypted cross-device) and invites them to the next one
("you solved your first mystery clean — want to try another with me?"). This is the "teacher remembers
you and comes back" sell. All such lines cite stored numbers (Rule 5).

**Acceptance:**
- After a mystery solve, Sage speaks the offer to play together (voice, Chatterbox) and the Path B
  accompaniment plays the solved song with smart loop/wait/simplify.
- Sage's re-engagement line fires when a new mystery unlocks, citing a stored solve fact.
- No new duet engine — reuses T-B4/T-B5 Path B system.
- All Sage lines in this ticket pass the AMENDMENT-14 human lyric read-through AND cite stored numbers
  (Rule 5).

**Out of scope:** the Mystery Mode feature itself (that's ADR-0003 / Grill #3); this ticket is only the
teacher-system bridge (Sage's voice + the duet reuse).

---

## C. Roadmap tickets (visible future — never closed until trigger met)

### T-C1: Path A — live adaptive teacher duet (roadmap)

**Status:** roadmap — NOT blocking v1. Path B (T-B4/T-B5) ships in v1.

**Goal:** Live adaptive teacher. The app listens to the student's guitar in real time; the teacher's part
adapts — slows when the student slows, waits when the student stops, adjusts when the student struggles,
pushes gently when the student is ready.

**Revisit trigger (all three must be true before this ticket is picked up):**
1. Student memory is live + encrypted cross-device (ADR-0001 built).
2. The on-device listening engine (AMENDMENT-05) reliably classifies clean chord changes in real time
   (the 30/60 sensor + weak-pair engine are proven; the real-device run (#4) is Heidi-authorized and
   done).
3. An adaptive accompaniment model is prototyped (the math exists: given the student's current chord +
   tempo + confidence, the teacher's next bar adapts).

**What's on disk now:** The ADR (`docs/adr/0004-...`) has the Path A section. This ticket is the roadmap
tracker.

**Acceptance (when it runs):** NOT markable until the three prerequisites are met AND the owner has reviewed
a Path A prototype. Until then, this ticket stays open as a visible reminder — exactly what the owner asked
for ("somehow you're going to have to remind me about Path A").

**Never do:** Claim Path A is "done" when only Path B is built. Path B is pre-built smart accompaniment;
Path A is live adaptive. They are different.

---

### T-C2: Photo-real teacher track (roadmap / separate experiment)

**Status:** roadmap — separate from World 1 (animated).

**Goal:** Try a photo-real person as a teacher (in a real-world setting), as a separate track from the
animated Emerald Hollow teacher. AMENDMENT-06 made realistic/photoreal avatars IN SCOPE. This is an
experiment, not v1.

**Not decided:** When to try it, which world/setting, which voice, whether it's a second teacher or a
re-rendering of the same teacher. All TBD.

**Acceptance:** Not markable until a photo-real teacher proof exists on disk. Until then, roadmap.

---

### T-C3: World 2+ — different teachers, different worlds (roadmap)

**Status:** roadmap — World 1 must ship first.

**Goal:** Different teachers (different personalities, voices, looks, male/female) in different worlds.
Owner's vision: "lots of worlds, lots of storylines."

**Not decided:** How many worlds, which worlds, which teachers, the sequence. World 1 (Emerald Hollow,
chill teacher) is the first. World 2 is the next proof.

**Acceptance:** Not markable until a second world + second teacher exists on disk. Until then, roadmap.
T-B8 (architecture prep) is the enabler — World 2 should be a data + asset add, not a rewrite.

---

## D. Blockers / notes

- **T-A1 through T-A4 are owner decisions.** Agent does NOT guess. Pick up the build tickets only after
  the relevant owner decision is recorded in this file.
- **PC transfer note:** The full `02-spec/` tree (with AMENDMENT-01 through AMENDMENT-16) did NOT survive
  the PC transfer — only the 7 root files are on this machine (`AGENTS.md`, `CONTEXT.md`, `HANDOFF.md`,
  `PROPOSED-FEATURES.md` + backups). AMENDMENT-17 (this spec) is being created fresh on this machine. If
  the full repo is restored later, confirm AMENDMENT-17 is consistent with the restored amendments (no
  conflict with AMENDMENT-11 thesis, AMENDMENT-06 avatar/voice unlock, AMENDMENT-09 Godot story-world).
- **ADR-0001 dependency:** Performance progress → student memory (T-B7) is local-first until ADR-0001
  (always-on encrypted cross-device sync) is built. The ladder flow (T-B6) uses local-first fluency data as
  the invitation source until then. Don't block the ladder on ADR-0001 being built.
- **Path A honesty:** T-B4 and T-B5 are Path B (pre-built smart accompaniment). The tickets must note Path B
  vs Path A clearly. T-C1 is the live-adaptive roadmap. Never conflate them.

---

## Owner sign-off (filled — 2026-08-23)

- T-A1 (character source): **B** (AI-generated stills + motion — FLUX→Wan→Chatterbox→Godot) — decided by owner on: 2026-08-23
- T-A2 (Level 1 gate): **lesson 6** — decided by owner on: 2026-08-23
- T-A2 (Level 2 gate): **lesson 13** — decided by owner on: 2026-08-23
- T-A3 (Level 3 song scope): **A** (full 10-song song-progression catalog) — decided by owner on: 2026-08-23
- T-A3 (if B, curated subset): N/A (T-A3 = A)
- T-A4 (Level 3 band): **pre-built per song** (Path B, v1) — decided by owner on: 2026-08-23

**Status update:** All four owner decisions recorded. Build tickets T-B1 through T-B8 may now be picked up.
T-A1 = B → T-B1 and T-B2 use the FLUX→Wan pipeline (cloud GPU required; verify on disk before claiming install).
T-A2 = lesson 6 / lesson 13 → T-B4/T-B5/T-B6 use these triggers.
T-A3 = A → Level 3 song pick = full 10-song catalog (house-of-the-rising-sun public domain; 9 others need disclaimer).
T-A4 = pre-built per song → Level 3 needs 10 accompaniment tracks (one per song); T-B5 scoped accordingly.
