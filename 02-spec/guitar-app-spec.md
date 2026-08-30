GUITAR LEARNING APP — PRODUCT SPEC v1.0
Date: 2026-08-02
Status: SPEC. Not yet validated. No code before validation gate passes.

>> AMENDED 2026-08-04 by `guitar-app-spec-AMENDMENT-01.md` (AUDIO-FIRST V1).
>> The camera chord-shape check is DEFERRED out of v1; the differentiator is
>> now async recorded-take audio critique + confidence honesty. Kill criterion
>> (b) in §7 is REPLACED. Read the amendment first — it wins on any conflict.
>> AMENDED 2026-08-05 by `guitar-app-spec-AMENDMENT-04.md` (SEQUENCED LESSON APP).
>> The async record-a-take audio critique, on-device pitch/timing feedback, and
>> camera chord-shape check are ALL RETIRED — v1 has NO recording, NO audio grading,
>> NO camera. §0 "LOCKED" items and §3 V1 roadmap below are SUPERSEDED where they
>> assume those mechanics. AMENDMENT-04 is the current truth on product scope.
Working title: TBD

================================================================
0. DECISIONS LOCKED (from redline sessions, do not silently reopen)
================================================================
- iOS-only v1. Android deferred to v2.
- Acoustic guitar only in v1 (simplifies pitch detection; no amp/cable noise).
- Fully synthetic lessons: LLM-generated curriculum + 2D fretboard/chord
  demonstrations. ZERO filmed human footage. GATED on validation (see §7).
- ONE cartoon avatar as coach persona in v1. Avatar picker = v2.
  Avatar never demonstrates playing with animated hands (see §4).
- On-device pitch/timing detection. On-device MediaPipe chord-shape check.
  >> SUPERSEDED 2026-08-05 by AMENDMENT-04: both RETIRED — v1 has no audio grading, no camera.
- Pressure/wrist-angle technique analysis = parallel data-collection spike,
  NOT a shipped feature in v1 (open research, no labeled dataset).
  >> SUPERSEDED 2026-08-05 by AMENDMENT-04: the data-collection spike that fed this was retired with the audio feature.
- No live jam sessions until v3, conditional on retention data.
- Free tuner + free metronome as the acquisition funnel.
- Target price: $12/mo. No free tier beyond tuner/metronome.
- Contract guitarist QA of all AI-generated content. NON-NEGOTIABLE
  (founder cannot verify guitar correctness — see §6).
- Backend: PocketBase (MIT, self-hosted) + RevenueCat + Cloudflare Workers + PostHog + Sentry. (Supabase replaced by PocketBase 2026-08-16 — see AMENDMENT-16.)

================================================================
1. PRODUCT DEFINITION
================================================================
An iOS app that teaches absolute beginners acoustic guitar. Video-style
lessons led by a cartoon avatar coach; the app listens via microphone and
gives real-time pitch/timing feedback, and (the differentiator) watches the
fretting hand via the front camera to verify chord shapes — the one thing
no incumbent (Yousician, Gibson, Simply, Fender Play, JustinGuitar) does.
>> SUPERSEDED 2026-08-05 by AMENDMENT-04: this §1 vision (mic listening + front-camera
>> chord watching) is historical. v1 is a sequenced lesson app with NO recording, NO
>> audio grading, NO camera. The current product promise is in AMENDMENT-04 / README §5.

One-line promise: "The only app that can SEE why your chord sounds wrong."
>> SUPERSEDED 2026-08-05 by AMENDMENT-04: this camera-moat promise is historical. Current
>> positioning: a clean, correctly-sequenced avatar-led beginner path with one obvious price +
>> fast first-song wins + streaks (see AMENDMENT-04 §4 / README §5).

NOT the promise (do not drift toward these):
- Not a jam/community platform (v3, conditional).
- Not a song-on-demand service (licensing makes this existential risk).
- Not a fine-grained technique lab ("apply more pressure") — open research.

================================================================
2. TARGET & BUSINESS BAR
================================================================
- 1,000 engaged monthly users within 18 months of launch.
  "Engaged" = averages 4+ practice sessions per week over the month.
- Revenue at bar: 1,000 × $12/mo ≈ $144K/yr. Sustainable small business.
- Infra cost at bar: ~$25-75/mo + LLM tokens (~$0.50-1.50/user/mo).
  Gross margin >90%.
- Acquisition: free tuner + free metronome front door (GuitarTuna model:
  180M downloads prove the funnel), content/ASO/community-led growth.
- Kill criteria (retired 2026-08-05 — founder never agreed to interviews; replaced by
  informational Reddit post (04-validation/guitar-reddit-recruitment.md, NO gate, optional
  extra info only):
  a) [RETIRED] Fewer than 10 validation interviews completed in 30 days → stop.
  b) [RETIRED] Fewer than 3 of 10 interviewees pay $12/mo for camera chord-correction.
  c) Fewer than 6 of 10 accept avatar-led (no human) lessons → revisit
     fully-synthetic decision (still worth a read of Reddit feedback).
  d) [RETIRED] (was a go/no-go gate; no longer applies).
     the fully-synthetic-content decision before coding.
  d) Post-launch: <5% free→paid conversion after 6 months → pivot or stop.

================================================================
3. PHASED ROADMAP
================================================================
>> SUPERSEDED IN PART by `guitar-app-spec-AMENDMENT-04.md` (2026-08-05): the
>> record-a-take audio critique, on-device pitch/timing feedback, and camera
>> chord-shape check listed in V1 below are RETIRED. v1 = sequenced lesson app
>> (tuner+metronome -> sequenced curriculum -> streaks -> $12/mo). See AMENDMENT-04.
V1 (ship to reach the 1,000-user bar)
- Free tuner + metronome (App Store funnel front door).
- Structured beginner acoustic curriculum, LLM-generated, guitarist-QA'd.
- On-device pitch/timing feedback per exercise.
  >> SUPERSEDED 2026-08-05 by AMENDMENT-04: RETIRED (no audio grading in v1).
- Camera chord-shape verification v0: binary "your hand is / is not making
  shape X" + ONE corrective hint. MediaPipe Hands on-device, 21 landmarks,
  small trained classifier. NOT pressure, NOT wrist angle, NOT buzz diagnosis.
  >> SUPERSEDED 2026-08-05 by AMENDMENT-04: RETIRED (no camera in v1; was already deferred, now dropped).
- One 2D cartoon avatar (Rive/Lottie) delivering intro/results/coaching
  text. LLM-generated coaching copy, server-side, text-only, non-real-time.
- Micro-practice loops, adaptive difficulty, streaks, practice logging.
- Server-side LLM session summary + next-session plan.

V1 deliberately does NOT include:
- Live jams, recital sharing, duets, avatar picker, story campaigns,
  genre remix, AI-composed songs, on-demand song arrangement (licensing),
  animated playing hands, Android, electric guitar, bass.

V2 (only after v1 retention data exists)
- Android port.
- Technique-health tracking (longitudinal scoring from v1 landmark data).
- Song-based learning from a properly licensed/licensable catalog.
- Async duets. Then-vs-now progress reels (cheap, high retention value).
- Avatar picker (same rig, reskins only).

V3 (conditional)
- Live jam sessions ONLY IF v2 shows a retention cliff community would fix.
  Reality check baked in: ~30ms latency = same-city only; at 1,000 users a
  4-8 person stage cannot be filled per time zone; JackTrip ≈ $135/mo for
  one frequent group. Requires 50K+ MAU or a scheduled-format workaround.
- Fine-grained pressure/wrist coaching ONLY IF v1/v2 landmark data has been
  labeled and the spike shows a trainable signal.

================================================================
4. THE AVATAR — EXPLICIT CONSTRAINTS
================================================================
SHIPS IN V1: one 2D animated cartoon character that intros lessons, reacts
to results, and voices coaching text. Same rig, one personality. This is
brand identity + marketing asset (Yousician's "June" is a chatbot, not a
character — real differentiation).

NEVER (unless validation screams for it): animated character HANDS
demonstrating chords. Reasons: (a) a rigged cartoon plays perfectly by
construction — it cannot model the messy human errors the camera feature
exists to catch, undercutting the product's own promise; (b) believable 3D
guitar-hand animation synced to audio is a multi-month project and every
fingering must be verified correct or we ship wrong instruction at scale.

Demonstration instead: 2D fretboard diagrams + chord-shape graphics,
data-driven from the curriculum JSON, provably correct by construction.

================================================================
5. TECHNICAL ARCHITECTURE
================================================================
iOS: Swift + SwiftUI.
- Audio capture: AVAudioEngine.
- Pitch/onset detection: existing open-source model compiled to CoreML
  (e.g. basic-pitch-class). NO custom DSP — founder has no audio-DSP
  background and it is not the differentiator.
- Hand tracking: MediaPipe Tasks (Hands), on-device. Zero marginal cost.
  >> SUPERSEDED 2026-08-05 by AMENDMENT-04: RETIRED — no camera/hand tracking in v1.
- Chord classifier: small on-device model over 21 hand landmarks.
  >> SUPERSEDED 2026-08-05 by AMENDMENT-04: RETIRED — no camera/hand-landmark model in v1.
- Avatar: Rive or Lottie state machine driven by lesson/coaching state.

Backend (boring-cheapest; the backend is NOT the product):
- PocketBase (MIT, self-hosted): single Go binary — embedded SQLite + auth +
  file storage + RLS + realtime (cross-device sync). FREE to self-host, no $25/mo
  Pro tier. Chosen over Supabase 2026-08-16 (see AMENDMENT-16). Student *learning*
  progress stays on-device per AMENDMENT-11 — PocketBase holds auth/subs/content/sync only.
- RevenueCat: subscriptions. Non-negotiable (StoreKit edge cases are a
  solo-dev rabbit hole). Free to $2.5K MTR.
- Cloudflare Workers (or PocketBase API rules/hooks): stateless LLM coaching
  endpoint — practice summary in, coaching text out. Scales to zero.
- PostHog free tier: funnels + retention (needed for the v3 jam decision).
- Sentry free tier: crash reporting.

Explicitly rejected: custom VPS (2am pager duty at 1,000 users), Firebase
(Firestore fights curriculum-graph queries), self-hosted media pipeline,
server-side audio processing (margin death).

Data-collection spike (runs silently inside v1, with consent):
landmark streams + session audio features uploaded for later labeling.
This is what turns the risky camera moat into a trained v3 feature instead
of an open-research bet.

================================================================
6. CONTENT PIPELINE & QA (the part the founder cannot do alone)
================================================================
- LLM generates: curriculum structure, lesson scripts, exercises, drills,
  backing tracks, chord diagrams (as data), coaching copy.
- LLM cannot be trusted on: chord voicings, fingering physical possibility,
  pedagogy ordering. Founder cannot catch these errors personally.
- THEREFORE: contract guitarist/teacher QA. $40-60/hr, ~4 hrs per content
  batch, ≈$200-500/mo during production. Review: every fingering, every
  chord diagram, curriculum sequence. This is insurance against the one
  failure mode (a viral "this app taught me wrong" screenshot) that kills
  the company. (Note 2026-08-05: the "validation interview subjects" recruitment is retired;
  interview gate was retired 2026-08-05; the Reddit post is optional extra info, not validation).
- Side benefit: founder IS the target market (absolute beginner). Dogfood
  every lesson: "can I, a non-player, do this?" That is the flow test.
  The guitarist is the correctness test. Both required.

================================================================
7. DEMAND SIGNAL (RETIRED INTERVIEW GATE — see note)
NOTE (2026-08-05): the original "10 interviews / 30 days" validation gate below was RETIRED.
The founder never agreed to interviews. `04-validation/guitar-reddit-recruitment.md` is a
discussion post we may put up for EXTRA CONTEXT ONLY — not a demand signal, validation, or
go/no-go. The old interview instrument that followed this section is OBSOLETE and moved to
07-archive/. Feedback-engine code is no longer blocked on a gate (see AGENTS.md rule 7, updated
2026-08-05 — proceeds on owner go-ahead).

[OBSOLETE GATE TEXT — kept for history only, DO NOT ACT ON]
10 interviews in 30 days. Recruitment (no existing list, so no cold email):
1. Reddit r/guitarlessons / r/guitar / r/learnguitar: offer a free
   "practice diagnosis" (manual review of their playing clip) for a 20-min
   call. Doubles as a test of whether strangers will share hand video —
   a direct proxy for camera-feature adoption friction.
2. Discord guitar servers (beginner-heavy).
3. 2-3 local guitar shops / music schools: ask teachers for student intros.
4. The QA guitarist's students (once hired).
5. Founder has zero students and zero playing network — budget ~$100 in
   thank-you gift cards.

Interview instrument (10 questions + 1 demo test):
1. When you quit a guitar app or lessons, what was the exact moment?
2. Walk me through your last practice session (behavior, not opinion).
3. Paid for Yousician/Gibson/Fender Play? Why cancel / why not pay?
4. If an app watched your hand and said "your chord shape is wrong,"
   would you trust it enough to change your grip?
5. LIVE TEST: prop your phone so the camera sees your fretting hand for
   10 min. (Physical setup friction is the camera feature's silent killer.)
6. Play with strangers online — appealing or anxiety-inducing? Ever done
   a remote jam?
7. What song made you pick up guitar? Quit an app that couldn't teach it?
8. Annual spend on guitar learning? What must $12/mo beat?
9. Do you practice at a consistent time? What interrupts you?
10. Would a free tuner from a brand make you trust their paid lessons?
11. DEMO GATE: avatar-led synthetic lesson vs human-led clip, side by side.
    Which would you learn from / pay for? (<6 of 10 choosing avatar →
    revisit fully-synthetic decision.)

================================================================
8. RISK REGISTER (honest)
================================================================
R1. Differentiation collapse (HIGHEST): camera moat is 80% cut in v1 for
    risk reasons → v1 is "Yousician but smaller + chord hints." If early
    feedback (including any Reddit post we put up for extra context) suggests
    no pull for async audio critique, revisit.
    Mitigation: revisit on owner direction; the Reddit post is extra info only,
    not a validation check.
R2. Unverifiable AI content (founder can't play). Mitigation: QA guitarist,
    non-negotiable budget line.
R3. Camera setup friction (phone placement, lighting, angle). Mitigation:
    Q5 live test; chord-check positioned as viral free tool to learn cheap.
R4. Chord classifier accuracy on real beginners' messy hands. Mitigation:
    v0 scopes to binary shape check on a limited chord set; spike collects
    data to improve.
R5. Solo-build scope creep. Mitigation: v1 cut list in §3 is a contract;
    fun extras live in v2/v3 or die.
R6. Music licensing if song-based learning sneaks into v1. Mitigation:
    exercises and original compositions only in v1. No exceptions.

================================================================
9. HARDEST TRADEOFF (named)
================================================================
Cutting live jams — the founder's emotional core — because at 1,000 users
the latency (~30ms, same-city), stage population (4-8 players/time zone),
and cost (~$135/mo per frequent group) make it unfillable; an empty stage
is a churn event, not a retention feature. Cost: the app is solitary where
its founder believes community drives retention. Bet: streaks, then-vs-now
reels, and async duets substitute. Revisited with data at v3.

================================================================
10. NEXT ACTIONS (in order)
================================================================
1. Post the Reddit discussion post for extra context if useful (04-validation/guitar-reddit-
   recruitment.md); read whatever comes back. No gate, no validation weight.
2. Hire contract guitarist; begin LLM curriculum draft + QA loop.
3. Build order: tuner/metronome → lesson player + avatar shell →
   on-device pitch feedback → camera chord check → adaptive loop →
   subscriptions.
   >> SUPERSEDED 2026-08-05 by AMENDMENT-04: the build order above is retired. Correct
   >> order is tuner/metronome → lesson player + avatar shell → sequenced curriculum →
   >> streaks/progress → subscriptions (no audio/camera steps). See AMENDMENT-04 §5.
4. Revisit this spec after first 50 beta users.

================================================================
11. COMPETITIVE REVERSE-ENGINEERING (added 2026-08-04)
================================================================
Audited top platforms + cloned open-source build references to harden this spec.
Full files in Desktop/guitar-research/:
  - COMPETITOR_TEARDOWN.md          (Yousician/Fender/JustinGuitar/Simply + gap)
  - PLATFORM_BUILD_ANALYSIS.md      (architecture patterns -> our build)
  - REVERSE_ENGINEERING_PLAYBOOK.md (method + what was cloned)
  - repos/  (book-of-frets-x, learnhouse, react-guitar, alphaTab — cloned, on disk)

FINDING (moat confirmation): Yousician, Fender Play, JustinGuitar, Simply Guitar ALL use
ears-only feedback (audio recognition) + filmed-video or tab content. NONE use the front
camera for chord-shape verification. The §1 promise — "the only app that can SEE why your
chord sounds wrong" — is differentiated and UN-CONTESTED among this set. Yousician/Simply get
closest (audio) but never vision. => camera arm (§3/§5) is the real bet; validation gate
Q4/Q5 is its make-or-break (R1/R3).

BUILD LESSONS (architecture, from OSS analogs):
- Adopt schema-driven JSON curriculum (book-of-frets-x pattern) as single source of truth;
  renderer-per-content-type. The existing L01 JSON (Desktop/guitar-lesson-01-*.json) already
  follows this shape — formalize with a JSON Schema; build the renderer BEFORE the lesson
  player (see guitar-build-plan.md Step 0).
- Progression hierarchy Level -> Lesson -> Exercise w/ adaptive difficulty + 1-tap onboarding
  (Fender Play pattern), kept minimal (beginner-acoustic only).
- LLM coaching endpoint (§5) mirrors learnhouse's stored-generation pattern; store generated
  coaching per lesson+session for guitarist QA review (§6).
- Platform stack (§5) confirmed correct vs learnhouse (native iOS + Supabase + RevenueCat +
  CF Workers). Do NOT copy learnhouse's web/LMS stack or use Stripe for in-app subs.

RESPECT: Yousician's audio engine is mature — do not claim audio parity at v1; scope pitch/
timing to on-device basic-pitch (§5) as already decided.

END OF SPEC.
