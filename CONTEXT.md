# CONTEXT.md — GuitarApp Glossary

Project vocabulary, agreed once, used everywhere so the agent, the code, and the
team stop re-deriving the same words. Glossary only — no implementation detail,
no spec. Decisions that are hard-to-reverse / surprising / a real trade-off live
in `docs/adr/`, not here.

## Core terms

- **Performance ladder** — the per-world reward arc: Level 1 → Level 2 → Level 3 capstone. Each world owns its own ladder, whose lesson gates map to that world's lesson count; worlds do not share ladders. See `docs/adr/0004`.

- **Student memory** — the per-student profile the app keeps so the teacher can
  coach *forward* ("last lesson you had E minor solid"). Defined by
  `02-spec/guitar-app-spec-STUDENT-MEMORY.md`. Always-on, encrypted, cross-device.
- **Mastery** — per-chord state. Has two parts: a `label`
  (`mastered` / `needs_work` / `not_started`) that drives the rules, and a
  `confidence` (0–100) that drives the teacher's *tone* ("solid" vs "shaky").
- **Confidence (0–100)** — numeric shade of how well a chord is known. The
  teacher cites this number under Rule 5; it never freelances a musical opinion.
- **Listening engine** — on-device chord/tempo matcher (AMENDMENT-05). Source of
  all mastery numbers. Audio is never uploaded.
- **Coaching format** — the teaching *approach* that worked for a student
  (e.g. "30-min/day" vs "exercises"). Remembered as data. NOT a personality label.
- **Preferred format** — the delivery the student *asked* for (video / sheet-music
  / replay). Consent-based, asked gradually. Never inferred.
- **Encrypted sync** — student memory is locked on-device with a key only the
  student's devices hold; PocketBase stores only ciphertext it cannot decrypt
  (zero-knowledge). See `docs/adr/0001-always-on-encrypted-sync.md`.
- **Legal floor** — the three guardrails that survive any rewrite: Rule 5
  (LLM prose-only, cites stored numbers), Rule 9 (license blocklist = copyright
  law), Rule 2 (no camera, no hand tracking).
- **Practice lesson** — a practice session assembled from the §5.2 drill menu
  in a fixed evidence order (warm-up → accuracy → retrieval → speed →
  weak-pair). Distinct from a *technique lesson* and from a *song*. Defined by
  `02-spec/guitar-app-spec-PRACTICE-DELIVERY.md`.
  _Avoid_: "practice mode", "drill session"
- **Drill** — one self-contained exercise from the §5.2 menu (e.g. One-Minute
  Changes, Chord-Perfect). Canonical form is `drills/<drill>.mjs` returning an
  engine envelope `{drill, params, events, metrics, ratePerMin, score, passed,
  summary}`. _Avoid_: "exercise", "activity"
- **file://-mirror** — a self-contained copy of a module's logic inlined into
  `practice-ui.html` (classic `<script>` or inline module with NO external
  import), because ES `import` is CORS-blocked over `file://`. The canonical
  `.mjs` stays for Node tests; the mirror is what the page actually runs.
  _Avoid_: "inline copy", "duplicate"
- **Local-first store** — v1 practice persists the fluency/weak-pair data to
  the device (same `fluencyStore.selectWeakest()` interface as the final
  design). Converges to the ADR-0001 encrypted cross-device sync when the app
  shell ships. _Avoid_: "local storage", "cache"
- **Listening-driven drill** — a drill that uses the on-device listening engine
  to verify the played chord/tempo (Chord-Perfect, One-Minute Changes,
  Weak-Pair Review, Muted Strum, Count-Out-Loud). The DEFAULT for any drill
  that produces a chord or strum. _Avoid_: "audio exercise"
- **Silent drill** — a drill needing no guitar sound (Air Changes: form the
  shape in the air). The exception, not the rule. _Avoid_: "non-audio"
- **Mystery Mode** — an ADVANCED, opt-in lane for students who finished the
  core 25-lesson curriculum (capstone done). The app blanks a song's chord
  names; the student IDs the progression by ear (pick-from-list, no guitar
  required) or plays along (listening engine verifies). A reveal then plays the
  progression + shows the chord names + a one-line "why it works." Progress
  (mysteries solved, success rate) saves to Student Memory, encrypted
  cross-device. Defined by `docs/adr/0003-mystery-mode.md`. _Avoid_: "song
  quiz", "ear test", "mystery song game"
- **Mystery pool** — the 10 songs from the song-progression track
  (`07-app/content/song-progressions/`). Each unlocks only after every chord it
  uses is taught (AMENDMENT-13 prereq gate). House of the Rising Sun is public
  domain (no disclaimer); the other 9 need the "not affiliated / not endorsed"
  line on the select card + reveal. _Avoid_: "song list"
- **Mystery difficulty** — ranked by chord count + how atypical the order is
  (2 chords = easy, 4 = monster). Drives the teacher's "let's step it up"
  encouragement, drawn from Student Memory. _Avoid_: "level", "tier"
- **Mystery hint ladder** — up to 3 wrong guesses; each miss reveals one more
  hint (chord count → one named chord → the key), full reveal on the 3rd miss.
  Every hint text passes a HUMAN lyric read-through (AMENDMENT-14) before ship.
  _Avoid_: "clue", "cheat"
|- **Encouraging copy** — the teacher's voice in Mystery Mode (and everywhere):
  warm, builds the student up, *invites* the harder challenge rather than
  stating it clinically. e.g. "You did really great on the first three — let's
  step it up a little bit and try to solve the four-chord monster." _Avoid_:
  flat praise-free statements like "cleared easy ones, here's a 4-chord monster"
|- **Teacher (world-locked)** — the animated on-app instructor the student
  learns from. Lives inside a story-world (Godot 4.x shell per AMENDMENT-09),
  present throughout regular lessons AND performances. One teacher per world;
  different worlds can have different teachers (different personalities, voices,
  looks). Defined by `docs/adr/0004-the-teacher-world-1-emerald-hollow.md`.
  Voice = Chatterbox (MIT) built-in voices; photo-real optional track, not v1.
  _Avoid_: "avatar", "instructor character", "AI teacher"
|- **Sage** — the named World 1 teacher in Emerald Hollow. Chill, warm,
  encouraging, and present through regular lessons and performances. Sage is the
  first proof that the app feels like a teacher in a world, not a lesson list.
  Defined by `docs/adr/0004-the-teacher-world-1-emerald-hollow.md`.
  _Avoid_: generic "teacher" when the world-specific identity matters
|- **Performance ladder** — the escalating reward arc: Level 1 (~5–6 lessons)
  → Level 2 (~10–12) → Level 3/capstone (L25, full band). Each level is a
  performance/invitation the teacher extends when the student is doing well.
  The same recurring performance song returns across the ladder so practice compounds.
  The current chosen ladder song is the simple **Em→C first song**.
  Level 1 is fixed at the end of Lesson 5 for the first shipped slice. Level 2
  stays open inside the ~10–12 band. Defined by
  `docs/adr/0004-the-teacher-world-1-emerald-hollow.md`.
  _Avoid_: "reward", "level up", "unlock"
|- **Path B duet (v1)** — pre-built teacher accompaniment tracks for each
  performance, smart (loops/waits/simplifies so the student isn't punished for
  falling behind). Teacher is visible + encouraging. Accompaniment is NOT live
  adaptive. Ships in v1. Defined by `docs/adr/0004-the-teacher-world-1-emerald-hollow.md`.
  _Avoid_: "live duet", "adaptive teacher"
|- **Path A duet (goal / roadmap)** — live adaptive teacher: the app listens to
  the student's guitar in real time and the teacher's part adapts (slows, waits,
  adjusts, pushes). The hardest engineering piece in Grill #4; the goal. Has a
  visible "revisit when…" trigger in the ADR; NOT blocking v1. Defined by
  `docs/adr/0004-the-teacher-world-1-emerald-hollow.md`.
  _Avoid_: "smart duet", "real duet", "true duet"
|- **Emerald Hollow** — World 1. The enchanted medieval Celtic village from the
  owner's YouTube reference ("The Heart of an Enchanted Medieval Village |
  Emerald Hollow"). Cozy fantasy tavern-in-the-woods: half-timbered cottage with
  moss-covered sod roofs, hanging flower baskets, wooden barrels, cobblestone
  street, volumetric mist, overcast soft light, early-morning damp. Pixel-
  measured palette locked in
  `brand-references/emerald-hollow/world-emerald-hollow.md` (brightness 75–120/255,
  saturation 0.14–0.33, muted/earthy). Defined by
  `docs/adr/0004-the-teacher-world-1-emerald-hollow.md`.
  _Avoid_: "Emerald", "Hollow", "the forest world", "magic world"
|- **World factory** — the FLUX→Wan→Chatterbox→Godot pipeline that produces
  lesson-world stills + motion + voice + Godot scene. Spec'd/enforced/scaffolded
  but NOT RUN as of 2026-08-23 (no AI cinematic assets exist in-repo). FLUX.1
  [schnell] (Apache-2.0) + Wan2.1-I2V (Apache-2.0) + Chatterbox (MIT) +
  Godot 4.x (MIT) = the only commercial-clean stack. Requires rented cloud GPU
  (~$0.50 per 20-lesson set) for FLUX/Wan. Defined by `AGENTS.md` stack section.
  _Avoid_: "asset pipeline", "movie pipeline", "image pipeline"

## Banned vocabulary (do not use)

- **"Visual learner" / "auditory learner" / learning-style label** — profiling.
  Banned. Store `preferred_format` instead (what they *asked* for).
- **Personality / psychology profile** — banned. No cross-lesson psychological
  inference about the student.
- **Sheet music with tab / lyrics / melody** — copyright violation. Email only
  chord/progression charts we are licensed to teach.
