# SPEC AMENDMENT 05 — "The App That Listens" (AI feature set, cross-platform, re-engagement)

Date: 2026-08-07 · Owner: Heidi Hendrickson · Status: ACTIVE — current truth on product scope.
Overrides AMENDMENT-04 where it retired audio listening; reintroduces listening as a *new,
owner-directed* feature in constrained form (per AGENTS Rule 7's "fresh owner amendment" clause).

## 1. What changed today (owner's words, plain)
"This is the age of AI — what could we offer in this app that is AI, what could be different,
what could be fun?" The owner rejected a plan that merely re-shipped the sequenced video-lesson
player and directed a genuinely AI-forward product. She approved **all nine** proposed AI
features, approved **Android + iOS** (reversing iOS-only), and reinstated **microphone
listening** as the headline feature.

## 2. THE NINE AI FEATURES (owner-approved, 2026-08-07)
1. **The app listens.** Microphone hears the student play; app confirms "clean Em" or
   "3rd string buzzing — press nearer the fret." CONSTRAINED matching against the known
   target chord/note + tempo only (AGENTS Rule 4 stands — never open-ended transcription).
   On-device processing; audio never uploaded.
2. **Talk-to-the-coach chat.** Student asks "why does this chord sound dead" at 11pm; coach
   answers in plain words, aware of lesson position + recent struggles. LLM writes prose only,
   cites only real practice data (AGENTS Rule 5 stands).
3. **Encouraging texts/notifications with one-tap lesson links.** Push notifications (free,
   primary) + optional SMS (Twilio, ~1¢) + weekly email. AI-personalized from real practice
   data ("your strumming got steadier this week"), never canned. Explicit opt-in, store-compliant.
4. **Adaptive practice plan.** Tomorrow's 10 minutes are reordered nightly based on what the
   student flubbed. Cheap to build, retention-critical.
5. **AI generates new lessons forever.** After the core 20: style packs and new exercises
   generated through the same lesson-director pipeline, guitarist-QA'd (Rule 8 unchanged).
6. **The band that follows you.** AI backing tracks that follow the student's tempo.
7. **Niche branches as a feature, not a bet.** Core beginner path is shared; then
   "Which sound do you love?" → Blues / Country / Fingerstyle-Folk / Spanish-inspired packs,
   all AI-generated. Blues noted as highest-potential first branch (older audience, pays).
8. **Human-feeling progress reports.** "You learned 6 chords and 2 songs this month. Most
   people quit before lesson 5 — you didn't."
9. **Voice-first practice controls.** "Hey coach — slower / again / what's next" while hands
   are on the guitar.

## 3. STILL BANNED (unchanged)
- Camera finger-watching / AI-generated playing hands (fretboard stays code-driven forever,
  AMENDMENT-03 §3). - Real copyrighted songs as teachable content (licensing = existential).
  "Play along with your favorite song" = AI-built simplified *original/public-domain*
  arrangements only. - Open-ended audio transcription (~50% accurate, ships false reds).

## 4. PLATFORM: iOS + ANDROID (reverses iOS-only guardrail)
One cross-platform codebase (Flutter or React Native — spike decides), both stores at launch.
Rationale: Android ≈ 2x addressable audience; mic-listening works on both; ~20–30% extra
test surface accepted. The old "iOS-only" guardrail in AGENTS.md is superseded by this section.

## 5. MARKETING: YouTube channel = top of funnel (per PLAN-app-plus-youtube-4500-2026-08-07.md)
2 videos/week from the same lesson-director pipeline; coach character is the channel face;
every video ends with the $12/mo app pitch. YouTube-teaching-craft research commissioned
2026-08-07 → `03-research/market/youtube-teaching-craft-2026-08-07.md`.

## 6. MONEY (restated): 450 paying subs × $12/mo ≈ $4,500/mo net.
Listening + talking coach + re-engagement texts are the conversion/retention engine.

## 7. NEXT ACTIONS (queued)
- A. Coach character chosen from 4 generated options — SUPERSEDED later same day: owner
  directed a MULTI-TEACHER ROSTER instead of one coach (see §8).
- B. YouTube-craft research DONE → `03-research/market/youtube-teaching-craft-2026-08-07.md`.
- C. Update README §1/§5/§7 + AGENTS.md (platform + listening reintroduced) — stamp, don't rewrite. (AGENTS.md done 2026-08-07; README pending.)
- D. Flutter-vs-React-Native spike note (one page) before build start.
- E. Constrained-listening tech note: CREPE/AudioKitEX-class pitch tracking + known-target
  chord verification, on-device, with confidence honesty (Rule 6).

## 8. TEACHER ROSTER (owner decision, 2026-08-07, supersedes "one coach")
- MULTIPLE cartoon teachers (monsters/creatures/characters OK), each with a distinct
  personality + voice. Students can FIRE and swap teachers anytime; GUEST teachers appear
  for special lessons/style packs. Teacher = skin over the same curriculum/data — zero
  extra musical QA per teacher. Character designs/names deferred (art pass, not a feature
  blocker). Full contract: `02-spec/FEATURES-LOCKED-v1-2026-08-07.md` (F3).
