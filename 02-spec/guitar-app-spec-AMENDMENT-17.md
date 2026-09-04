# 02-spec/guitar-app-spec-AMENDMENT-17.md

**Status:** RATIFIED (2026-09-02 by owner Heidi; Grill #4 direction accepted)
**Supersedes:** nothing (new amendment; builds on AMENDMENT-11 product thesis)
**Latest word:** AMENDMENT-16 (PocketBase backend) remains current on backend;
AMENDMENT-15 (curriculum re-sequence + ordering gate) remains current on curriculum;
this amendment adds the **world-locked teacher for World 1 + first performance ladder**.

---

## What this amends

AMENDMENT-11's product thesis: world-locked teacher + longitudinal student memory +
teacher–student duet. Student memory (Grill #1), practice delivery (Grill #2), and
mystery mode (Grill #3) are specified and built. This amendment specifies **the teacher
for World 1 (Emerald Hollow) + the first performance ladder + the v1 duet (Path B)**.

This amendment does NOT cover: World 2+ (different teachers/worlds), photo-real teacher
track, or Path A live adaptive duet (those are future; Path A is a visible roadmap item).

**Decision record:** `docs/adr/0004-the-teacher-world-1-emerald-hollow.md` (hard-to-reverse
decisions). **Vocabulary:** `CONTEXT.md` glossary (Teacher (world-locked), Performance ladder,
Path B duet, Path A duet, Emerald Hollow, World factory).

---

## World 1 = Emerald Hollow

### Setting

The first world is the **enchanted medieval Celtic village** from the owner's YouTube
reference: "The Heart of an Enchanted Medieval Village | Medieval Celtic Music for Study &
Focus | Emerald Hollow" — https://youtu.be/X3Q9-xj_XwM.

It is a **cozy fantasy tavern-in-the-woods**: half-timbered cottage/tavern with moss-covered
sod roofs, hanging flower baskets, wooden barrels, cobblestone street, volumetric mist,
overcast soft light, early-morning damp atmosphere. Internally branded **Emerald Hollow**.

- **Medium:** High-end animated production (Godot 4.x, per AMENDMENT-09). NOT photo-real for
  World 1 — photo-real is a separate track to try later.
- **Why this world:** Owner explicitly pointed to it as the starting world. It has a clear,
  documentable mood (cozy fantasy, verdant, mystical, welcoming) that translates to a lesson
  setting. The tavern porch gives a natural place for the teacher to stand and teach.
- **Reference captured on disk:** `brand-references/emerald-hollow/` — README + full pixel-
  to-palette analysis + 2 key frame captures from the reference video.

### Palette lock (measured, not guessed)

The world-emerald-hollow.md analysis measured 5 video segments at 24fps, 640×360:

- **Brightness:** 75–120/255 across all segments → **dark-to-moody**. Never bright.
- **Saturation:** 0.14–0.33 across all segments → **muted-to-moderate**. Never vibrant.
- **Dominant colors:** near-black shadow (#202020, ~20-24% of frame), mid-dark stone (#404040,
  ~12-15%), forest greens (#204020, #406040), muted olive-tan (#404020, #606040), light grey
  fog (#808080, ~2-3%).
- **Production palette:** Deep Forest Green, Weathered Wood Brown, Mossy Lime, Slate/Cobblestone
  Grey, Misty Blue-Grey, Near-Black Shadow, Stone Chimney Warm. Full hex table in the
  brand-references file.

**Rule:** Any generated still or built scene for Emerald Hollow MUST respect this muted/earthy
range. A vibrant/neon world breaks the reference. Warm accents (firelight, lantern, wood warmth)
are the contrast — not saturated color.

### Architecture in the world

- **Main building:** Tavern/cottage hybrid, half-timbered (dark beams over weathered plaster),
  moss-covered sod roof (multiple gables, stone chimney), wooden porch/balcony with railing +
  flower boxes, heavy stone foundations, arched stone doorway, small deep-set leaded-glass
  windows.
- **Foreground:** Wooden barrels along the front wall (tavern = serves ale/mead), rustic wooden
  shelter structure (well/cart shed) with moss-covered sloped roof.
- **Street:** Irregular grey cobblestones (old, worn). Wicker hanging baskets from eaves/beams
  overflowing with flowers/greenery. Window boxes on upper windows.
- **Background:** Misty mountains/hills through fog. Tall dark evergreen trees framing the scene.
  Village street leads eye from bottom-right into center background — strong depth.
- **Atmosphere:** Volumetric fog/mist essential. Soft ambient occlusion in corners. Diffuse
  overcast light, no harsh shadows. Smoke from chimney.

### Teacher placement in Emerald Hollow

**Primary:** Eye-level shot of the tavern porch — teacher framed center or center-right, porch
railing + flower boxes behind, barrels to one side, misty greens behind. Inviting, not imposing.

**Secondary option:** Interior — inside a half-timbered cottage, by a leaded-glass window looking
out at the misty street, or on a covered interior porch with warm firelight.

**Suggested first proof scene:** Teacher on the porch, eye-level, world readable, lesson starts
with a lantern glow. Leaves rustling slightly, smoke from chimney.

---

## First teacher = Sage

### Personality

Chill, warm, encouraging. Inherits the Grill #3 teacher-voice rule: "warm and encouraging, never
clinical." Praise the past win, soften the turn, invite the next step. Defined in
`references/guitarapp-teacher-voice.md` + `CONTEXT.md` glossary term "Encouraging copy."

**Example (Emerald Hollow, after a good first lesson):**
"You did really great on those first two chords — let's step it up a little bit and try a simple
strum pattern on the porch. You've got this."

**Example (before a first performance, Level 1):**
"You've been practicing those chords for a few lessons now and they're feeling a lot more solid.
How about we try playing them together on the porch — no pressure, just you and me."

### Voice

One Chatterbox built-in voice (MIT, zero-shot clone + emotion). No voice cloning from a real
person for World 1. Voice matches personality + world (chill voice in a cozy forest tavern).

- Chatterbox = shipping voice target (AMENDMENT-06). Kokoro-82M (Apache-2.0, CPU) = fallback
  if Chatterbox isn't available.
- **Voice license blocklist is LAW (Rule 9 / copyright):** ElevenLabs blocked for a paid app.
  Never re-propose. Chatterbox + Kokoro + OpenAI TTS + MeloTTS/StyleTTS2 (MIT) = approved.

### Look

High-quality animated character. Personality + look + voice + world must be internally consistent
— a chill teacher in a cozy forest-tavern world.

- AMENDMENT-06: realistic/photoreal avatars + Chatterbox IN SCOPE (overrides old cartoon-only
  mandate). For World 1 we choose animated, not photo-real, but the door is open.
- The teacher MAY demonstrate fingerings (AMENDMENT-06) — driven from the arithmetically-verified
  `chord-theory-check.js` data, not free-generated. The 2D fretboard diagram remains the precision
  reference.

### Presence

The teacher is in the world **throughout** — during regular lessons AND performances. World-locked
means the teacher is always there in that world. Not a pop-up for performances only.

---

## Performance ladder

### Structure (locked; exact gates TBD)

| Level | Approx. lesson gate (TBD) | Setting | What happens |
|-------|---------------------------|---------|-------------|
| Level 1 | ~5–6 lessons (map vs actual curriculum) | Tavern porch, Emerald Hollow | Teacher senses student is doing well; invites them to perform what they've learned on the porch. Teacher accompanies. Low pressure. |
| Level 2 | ~10–12 lessons (map vs actual curriculum) | Same or expanded Emerald Hollow moment | Student plays more chords / a simple song; teacher encourages a harder pace. Confidence building. |
| Level 3 (capstone) | Lesson 25 (curriculum capstone, AMENDMENT-15) | Bar/stage with full band | Student "joins the band": bass, drums, teacher on second guitar. The same recurring performance song returns in front of a crowd. |

- **Level 1 is the first reward moment.** The student practices through their first set of lessons;
  the teacher senses they're doing well (via mastery/confidence from student memory, Rule 5); the
  teacher invites them to perform on the porch.
- **Level 1 and Level 2 timing bands are now ratified.** Level 1 happens early, around lessons 5–6.
  For the first shipped slice, Level 1 lands at the end of **Lesson 5**. Level 2 stays in the middle,
  around lessons 10–12, with the exact lesson ID still open.
- **Level 3 is fixed:** Lesson 25 capstone. The band = bass + drums + teacher on second guitar
  (owner's picture). The same recurring performance song comes back for the crowd moment.
- **Level 1 should feel guided, not overwhelming.** The first performance moment should use a small,
  curated set rather than dumping the student into a big song list.
- **All three performance rewards use the same song.** Repetition is part of the design: the student
  grows with one recurring performance song so the capstone feels earned, familiar, and practiced.

### Song constraint at Level 3

The performance ladder uses one recurring song across Level 1, Level 2, and Level 3. The song's
chords must ALL be taught by Lesson 25 (they are — the 25-lesson curriculum teaches F at L17 and A7
at L19, so all 10 song-progression songs are within the taught set per AMENDMENT-13). The
song-progression gate (`node tools/verify-song-progressions.js`) enforces this. House of the Rising
Sun is public domain (unrestricted); the other 9 need the "not affiliated / not endorsed"
disclaimer where relevant (AMENDMENT-12/14).

**Open:** Which exact recurring song should the ladder use? The structure is now decided; the title is
still a ticket-phase choice.

### How the teacher extends the invitation (Rule 5)

The teacher's invitation cites stored mastery/confidence numbers — never freelances a musical
opinion. Correct:

- "You've been practicing those chords for a few lessons now and they're feeling a lot more solid
  (your Em confidence is up to 72) — how about we try playing them together on the porch?"
- "Your C and G swaps are getting smoother — let's try a simple song on the porch and see how it
  feels."

Wrong:

- "You're ready for a real performance now." (no data cited)
- "You're a natural." (freelanced praise)

---

## Duet — Path B ships in v1, Path A is the roadmap goal

### Path B (v1 ships this)

Pre-built teacher accompaniment tracks for each performance, but **smart** — the track doesn't
punish the student for falling behind:

- **Loops:** if the student stops or falls behind, the accompaniment loops the current section
  rather than running ahead.
- **Waits:** if the student pauses, the teacher's part waits (not a hard cut).
- **Simplifies:** if the student is struggling (low confidence on the chords in play), the
  accompaniment can simplify (fewer layers, quieter) rather than overloading.

The teacher is visible and encouraging (using the same voice/dialogue system as regular lessons),
but the accompaniment is pre-built per performance, not generated live.

**What this gives v1:** A working duet experience — the student performs with a visible, encouraging
teacher who plays along, and the experience doesn't punish them when they're learning. The student
feels like they're playing with someone, not alone.

**What this is NOT:** True live adaptation. The teacher's part is pre-built; it responds with smart
rules (loop/wait/simplify), not by hearing the student's exact playing and adapting to it in real
time.

### Path A (roadmap goal — not blocking v1)

Live adaptive teacher: the app listens to the student's guitar in real time; the teacher's part
adapts — slows when the student slows, waits when the student stops, adjusts when the student
struggles, pushes gently when the student is ready.

This is the hardest engineering piece in Grill #4 and the most valuable. It is NOT dropped — it gets
a **visible roadmap item** with a clear "revisit when…" trigger:

**Revisit Path A when ALL three are true:**
1. Student memory is live + encrypted cross-device (ADR-0001 built).
2. The on-device listening engine (AMENDMENT-05) reliably classifies clean chord changes in real
   time (the 30/60 sensor + weak-pair engine are proven; real-device run (#4) is Heidi-authorized
   and done).
3. An adaptive accompaniment model is prototyped (the math exists: given the student's current
   chord + tempo + confidence, the teacher's next bar adapts).

Until all three are true, Path A stays on the roadmap but does not block v1. Path B ships.

### Path A reminder mechanism

To make sure Path A is NOT forgotten (owner's explicit request): the ADR (`docs/adr/0004-...`) has
a dedicated "Duet — Path A (goal) vs Path B (v1 ships)" section. The tickets file has a roadmap
ticket explicitly tagged `#roadmap-path-a` that is never marked complete until the three prerequisites
are met and the owner has reviewed a Path A prototype. Any agent working in this repo that touches
the duet/performance surface should see the ADR and the roadmap ticket.

---

## Multiple teachers / worlds = World 2+

- Different teachers, different personalities, different voices, different clothes, male and female
  teachers = **World 2 and beyond.** NOT in World 1.
- World 1 proves the concept: one teacher, one world, one performance ladder, one voice.
- World 2 brings a new personality, new look, new voice, new setting. The architecture must support
  adding worlds/teachers without rewriting World 1.
- **Fun future option (not committed):** A forest world where the teacher is a talking Beaver.
  Not serious — but signals the range the owner wants. Not in this amendment.

---

## Animated character + world production

### Path to assets

The asset pipeline (FLUX.1[schnell] → Wan2.1-I2V → Chatterbox → Godot 4.x) is spec'd/enforced/
scaffolded but **NOT RUN** as of 2026-08-23 (see `AGENTS.md` install-state note + `brand-references/
emerald-hollow/README.md`). No AI cinematic assets exist in-repo.

The first proof needs either:
- (a) Manual animation assets authored directly in Godot (character rig + world scene), OR
- (b) The pipeline executed: FLUX stills (Apache-2.0) → Wan motion (Apache-2.0) → Chatterbox voice
  (MIT) → Godot scene (MIT). Requires a rented cloud GPU for FLUX/Wan (~$0.50 per 20-lesson set —
  one-time generation, NOT a subscription).

**Animated character source is NOT decided in this amendment.** See tickets — the first ticket asks
the owner to decide: hand-authored Godot rig vs AI-generated stills+motion vs a mix. This decision
drives the build approach.

### Godot scaffold

Per AMENDMENT-09, the Godot story-world scaffold (`project.godot` + World/LessonScene/
FingeringOverlay scenes, MIT) is the production vehicle. **As of 2026-08-23 on this
machine, the `07-app/godot/` tree does NOT exist on disk** (the full repo did not survive
the PC transfer — only the 7 root files are present). The engine is NOT installed. Owner
opens in Godot 4.7.x. If/when the scaffold is restored or recreated, the agent prepares the
scene files + character rig + FLUX stills for the owner to open in Godot.

---

## Red lines inherited from AGENTS.md (always live)

- **Rule 5:** LLM writes prose only; cites stored numbers only. The teacher's encouragement cites
  mastery/confidence from student memory — never freelances a musical opinion.
- **Rule 9:** Voice license blocklist is copyright law. Chatterbox (MIT) = shipping target.
  ElevenLabs blocked for paid app. Never re-propose.
- **Rule 2:** No camera, no hand tracking.
- **AMENDMENT-06:** Realistic/photoreal avatars + Chatterbox IN SCOPE (overrides old cartoon-only
  mandate). Avatars MAY demonstrate fingerings — driven from chord-theory-check.js data, not
  free-generated.
- **AMENDMENT-07:** FLUX.1[schnell] only for image generation. Midjourney excluded.
- **AMENDMENT-05:** Listening is BACK — constrained target-matching only, on-device, audio never
  uploaded. The duet (Path B or Path A) respects this: the teacher's accompaniment is app-generated
  or pre-built, not a recording of a real person uploaded to a server.
- **AMENDMENT-11:** The world-locked teacher + longitudinal student memory + teacher–student duet
  thesis this amendment implements. Red lines in AMENDMENT-11 survive.
- **AMENDMENT-15:** 25-lesson curriculum order is gated. The performance ladder's exact lesson gates
  must be mapped against the AMENDMENT-15 order. Capstone is L25, last.
- **AMENDMENT-12/14:** Song-progression track legal position. Level 3 song pick respects the band-name
  trademark nominative-use + disclaimer rule, and the distinct-progression-counsel-sign-off rule.
- **AMENDMENT-16:** PocketBase backend (MIT, self-hosted). Performance progress saves toward student
  memory; until ADR-0001 is built, performances work locally but cross-device encrypted sync is absent.

---

## Open items (resolve in tickets phase)

1. **Choose the exact lesson ID for Level 2** — Level 1 is now fixed at the end of Lesson 5.
   Level 2 stays open inside the ratified ~10–12 range.
2. **Choose the recurring performance song** — the same song returns at Level 1, Level 2, and the
   Level 3 crowd moment.
3. **Level 3 band composition** — owner's picture (bass + drums + teacher on second guitar) is the
   starting point. Is the band pre-built per song or assembled by the app?
4. **Animated character source** — hand-authored Godot rig vs AI-generated stills+motion (FLUX+Wan)
   vs a mix? Owner decision. Drives the build approach.
5. **Path A revisit trigger** — refine the three prerequisites. Owner may want to sharpen.
6. **Emerald Hollow scene author** — who builds the first Godot scene + character? Owner opens in
   Godot 4.7.x; agent prepares the scene files + character rig + the Path B accompaniment data.
