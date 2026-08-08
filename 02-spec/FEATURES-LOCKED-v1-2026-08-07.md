# GUITAR APP — LOCKED FEATURE SPEC (v1)
Date: 2026-08-07 · Owner: Heidi Hendrickson · Status: LOCKED — this is the build contract.
Basis: Amendments 01–05 + owner decisions of 2026-08-07 (teacher roster, fire/hire, guest teachers).
Purpose: complete enough to hand to a lower-cost builder (AI or human) without further product decisions.

---

## 0. ONE-PARAGRAPH PRODUCT
A cross-platform (iOS + Android) phone app that teaches absolute beginners acoustic guitar.
Animated lessons are directed by AI (movie-like scenes, not filmed humans). The app LISTENS
through the microphone and verifies playing against the current lesson's known target. A roster
of cartoon teacher characters — each with a distinct personality and AI voice — teaches; the
student can fire and swap teachers at will; guest teachers appear for special lessons. The app
adapts practice daily, sends personalized encouraging texts/notifications, and never runs out
of lessons because new ones are generated through the same pipeline. $12/month, single tier;
free tuner + metronome as the funnel front door.

---

## F1 — Sequenced animated lessons (the core)
- The first-20-lesson beginner path (`02-spec/guitar-app-first-20-lessons-2026-08-05.md`):
  first 2-chord song by Lesson 3, core open chords by Lesson 10, strumming by 12,
  fingerpicking intro by 18, self-serve chord-chart reading by 20.
- Every lesson is a JSON document: chords (6-string fingering data), tempo, beats, coaching
  script, mood. Rendered by the lesson player — no hand-built scenes.
- **AI Lesson Director:** reads the lesson JSON and emits a scene manifest (shots, camera
  moves, background pick, teacher actions, captions, TTS lines). Renderer plays it
  deterministically. Working prototype: `06-prototypes/lesson-director-v4.html`.
- **Fretboard is code-driven forever.** Dots drawn from the fingering data in the JSON. No
  generative model ever renders fingers, hands, or fretboards. This is the product's
  correctness guarantee (hard rule).
- Backgrounds/atmosphere: AI-generated style frames from open-license models
  (FLUX.1[schnell] / Qwen-Image, Apache-2.0, $0). Three real frames already in
  `06-prototypes/assets/`.
- Video-style structure per lesson (from the YouTube-craft research): hook (hear the result)
  → teach one thing → slow play-along → win/praise. Lessons are 3–6 minutes.
- Acoustic only. No copyrighted songs — original/public-domain exercises only (licensing
  is an existential risk; non-negotiable).
- Contract-guitarist QA of every lesson's musical content before it ships (owner cannot
  verify fingerings; this is a budget line, not optional).

## F2 — The app listens (headline feature)
- Microphone input, processed ON-DEVICE; audio is never uploaded.
- Pitch detection per note/string (autocorrelation-class algorithm; proof-of-concept already
  built and note-math-verified: `06-prototypes/listening-proof-demo.html`).
- **Constrained verification only:** the app checks what it hears against the KNOWN target
  the lesson just asked for ("play Em now" → verifies the Em strings ring clean at tempo).
  NEVER open-ended transcription of arbitrary playing (~50% accurate industry-wide; banned).
- Feedback is specific and kind: "3rd string buzzing — press closer to the fret," never a
  bare red X. Below confidence threshold: "not sure — play that again" (honesty is a feature).
- Free tuner + metronome built on the same engine = the App Store funnel front door.

## F3 — The teacher roster (owner decision, 2026-08-07)
- **Multiple cartoon teacher characters** (monster / creature / character designs — final
  art decided later; generated with open-license AI models, $0).
- **Each teacher has a distinct personality and voice** (encouraging best-friend, calm
  zen coach, drill-sergeant-but-kind, blues cat, etc.). Personalities defined as short
  persona docs that drive both the coaching scripts and the AI voice style.
- **Fire/hire:** the student can swap teachers anytime from settings; the new teacher
  picks up mid-curriculum with a "so you're my new student" handoff line. Teacher choice
  is cosmetic-only — same curriculum, same fretboard data, zero extra QA cost per teacher.
- **Guest teachers:** special lessons/packs are taught by a guest character (e.g. a blues
  character teaches the blues pack). Roster additions ship as content updates — the
  retention engine is also the marketing beat ("new teacher dropped").
- One shared skeleton/rig per character body-type so animation cost per new teacher is low.
  Mouth/lip-sync driven by the voice audio.

## F4 — Talk to your teacher (AI chat coach)
- In-app chat (text; voice later) with the student's CURRENT teacher, in that teacher's
  personality. Answers beginner questions in plain words ("why does this chord buzz?",
  "my fingers hurt").
- Context-aware: knows the student's lesson position, recent practice results, and common
  beginner failure points. The LLM writes prose only and may only cite real practice data —
  it never invents musical judgements (hard rule).
- Guardrailed to guitar/learning topics; canned redirect otherwise.

## F5 — Adaptive practice plan
- After each session, the student's plan is reordered nightly based on what the listening
  engine recorded them flubbing (slow chord changes → tomorrow opens with a change drill).
- Practice prescriptions are chosen from the existing lesson/drill library + AI-generated
  variants. Simple rules engine first; ML later if data justifies it.

## F6 — Encouraging messages (owner's feature)
- Personalized push notifications (free, primary channel) + opt-in SMS (Twilio ~1¢) +
  weekly progress email.
- Every message cites something TRUE from practice data: "Your strumming got steadier this
  week — Lesson 6 is ready when you are," with a one-tap deep link into the exact lesson.
- Frequency-capped, kind by default, one-tap mute. Explicit opt-in at onboarding
  (store compliance). In the teacher's voice/personality.

## F7 — The band that follows you
- AI-generated backing tracks (drums/bass/chords) in the practice tempo the student
  actually played at last — not a fixed click. Practicing alone is the #1 quit-driver;
  a patient band is the fix.
- v1 implementation: tempo-following loop engine (deterministic, generated stems);
  full generative music is a later upgrade.

## F8 — Style packs (niche branches, owner decision)
- After the shared core path: "Which sound do you love?" → Blues / Country /
  Fingerstyle-Folk / Spanish-inspired. Each pack = lessons generated through the same
  pipeline + a guest teacher (F3). Blues first (audience skews older/pays).
- Packs are content, not new code. This is how "niche" ships without a rebuild.

## F9 — Progress reports that feel human
- Weekly/monthly in plain words: chords learned, songs played, streaks, honest milestones
  ("Most people quit before lesson 5 — you didn't"). Generated from real practice data only.
- Shareable card (free marketing) + emailed version (F6).

## F10 — Voice-first practice controls
- Hands are on the guitar, so: "slower" / "again" / "what's next" / "tune my guitar" spoken
  aloud control the lesson player. Wake-free (tap-to-talk mic button) in v1; always-listening
  wake word is v2 (battery/permissions).

## F11 — Progress, streaks, practice log
- Streaks, lesson completion, practice minutes, skill map (which chords are "clean" per the
  listening engine). This is the return-and-retention engine and the data source that feeds
  F4/F5/F6/F9.

## F12 — Money
- Single tier: $12/month, free trial. Free tier = tuner + metronome + Lesson 1 only.
- Cross-platform subscriptions (RevenueCat or equivalent), Apple Small Business Program
  (15% cut). Target: 450 paying subscribers ≈ $4,500/mo net.

## F13 — YouTube channel (the funnel, same machine)
- 2 videos/week, rendered by the SAME lesson-director pipeline (F1) with the roster teachers
  as the channel's faces. End-card pitch: "The video shows you what to do; the app listens
  and tells you if you got it."
- Format rules (from the 2026-08-07 research): hook with the finished result in 10s, one win
  per video, a number in the title, numbered series, pain-point titles ("Can't change chords
  fast enough?"), play-along close, sell the path not the lesson.

---

## HARD BANS (survive everything)
1. No generative AI draws fingers/fretboards/hands — code-driven fretboard only.
2. No camera finger-watching, no AI video of playing.
3. No open-ended audio transcription — constrained target-matching only.
4. No copyrighted songs — original/public-domain only.
5. Audio never leaves the device; all listening on-device.
6. The LLM never invents musical judgements; it cites real practice data only.
7. Every lesson's musical content passes contract-guitarist QA before shipping.
8. Voice/image models must be commercially licensed (Apache-2.0/MIT) or paid per-call
   (OpenAI TTS). No subscription-fee creative tools (Rive stays dropped).

## STACK (locked)
- App: one cross-platform codebase (Flutter or React Native — one-page spike decides).
- Audio: CREPE-class pitch tracking / AudioKitEX-equivalent on device. Approved-license
  libraries only (basic-pitch Apache-2.0, librosa ISC, CREPE MIT).
- Animation: GSAP (free) prototypes/web; native canvas in-app. Lottie for set-dressing.
- Images: FLUX.1[schnell] / Qwen-Image (Apache-2.0). Voices: OpenAI TTS (~$0.36/lesson).
- Backend: Supabase + Cloudflare Workers; RevenueCat subscriptions; PostHog analytics;
  Twilio SMS (opt-in only).

## BUILD ORDER (locked)
0. Lesson-JSON schema + renderer hardening (exists as prototype).
1. Lesson #1 end-to-end through the full pipeline (director → AI frame → animation → TTS →
   fretboard → listening check) — proves the machine before mass production.
2. Free tuner + metronome (F2 engine) — funnel front door.
3. Lesson player + 3-teacher roster shell (fire/hire works from day one).
4. First 20 lessons authored, QA'd, shipped.
5. Listening verification in-lesson (F2 full).
6. Teacher chat (F4), adaptive plan (F5), messages (F6), streaks (F11).
7. Subscriptions + paywall (F12). Launch.
8. Post-launch content engine: style packs (F8), guest teachers (F3), band (F7), voice
   controls (F10).
9. YouTube channel runs in parallel from step 4 (same pipeline).

## OPEN ITEMS (explicitly NOT blocking this spec)
- Teacher character designs/names (monster cast or mixed roster — art pass later).
- Channel name + handle.
- Flutter vs React Native spike note.
- Exact SMS cadence caps.
