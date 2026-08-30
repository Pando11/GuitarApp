# Guitar Lesson App — FEATURES LIST (v1 scope)

Date: 2026-08-06 · Author: autonomous handoff hop (H10→fresh)
Scope authority: **AMENDMENT-04 (2026-08-05) is the current truth.** The base
`guitar-app-spec.md` is HISTORICAL — its camera/audio/hand-tracking claims are
stamped `>> SUPERSEDED by AMENDMENT-04`. If a feature below contradicts the base
spec, AMENDMENT-04 wins. See `AGENTS.md` Rule 2.

Product one-liner (README §5): *"The clean, correctly-sequenced path from zero
to your first songs — with a coach who never gets impatient."* A SEQUENCED LESSON
APP. Not an audio-feedback service, not a song library, not a jam platform.

Platform guardrails: iOS-only · acoustic-only · $12/mo single price · no free tier
beyond tuner+metronome · one cartoon avatar · fully synthetic lessons (zero filmed
human footage) · contract-guitarist QA of ALL AI-generated musical content
(non-negotiable — founder cannot verify fingering).

================================================================
1. V1 — SHIPPING FEATURES
================================================================

A. FREE ACQUISITION FUNNEL (App Store front door — spec §3, build STEP 1)
   - F1. Chromatic tuner (AudioKitEX / AVAudioEngine, on-device).
   - F2. Metronome (tap-tempo, subdivisions, adjustable BPM).
   - Both free, no login required — the GuitarTuna-model funnel.

B. SEQUENCED CURRICULUM — THE CORE PRODUCT (build STEP 3)
   - F3. Beginner-acoustic curriculum, LLM-generated + contract-guitarist-QA'd.
   - F4. Correctly-ORDERED lesson progression (proven teaching order; first 20
        lessons defined in `guitar-app-first-20-lessons-2026-08-05.md`; ordering
        research in `03-research/market/guitar-lesson-ordering-research-2026-08-05.md`).
   - F5. Lesson hierarchy: Level → Lesson → Exercise, with adaptive difficulty.
   - F6. Technique/exercise-only content. NO song material in v1 (licensing = R6).
   - F7. Data-driven 2D fretboard diagrams (code-generated dots from lesson JSON —
        correct-by-construction, the correctness source). SVG (see AGENTS Rule 10).
   - F8. Pivot-point coaching ("one finger stays planted" between chord pairs).

C. AVATAR COACH (build STEP 2 — Amendment 02/03)
   - F9. One 2D cartoon avatar delivering intro / results / coaching text.
   - F10. LLM-generated coaching COPY only (server-side, text-only, non-real-time).
        LLM cites ONLY data present in lesson/coaching JSON — no invented musical
        judgement (AGENTS Rule 5). Auditable.
   - F11. Avatar layer = Lottie (MIT) + native SwiftUI/Canvas. Rive DROPPED
        (2026-08-04, $9/mo Cadet fee violates no-subscription rule).
   - F12. Data-driven fretboard stays the correctness source. IF a hand is ever
        animated it MUST be rigged + IK-constrained to real fret coords + guitarist-
        QA'd — never an AI-generated hand (Amendment 03 §3 invariant).

D. LESSON PLAYER + SHELL (build STEP 2)
   - F13. Scene/lesson player: auto-advance + play/pause/rewind + progress bar.
   - F14. Coaching text bubbles; explicit "⚠ not yet verified by guitarist" flag
        on any unverified fingering (never hidden).

E. PROGRESS / RETENTION ENGINE (build STEP 4 — the return loop, v1 differentiator)
   - F15. Practice logging (sessions completed, time practiced).
   - F16. Streaks (the central retention mechanic after AMENDMENT-04).
   - F17. Adaptive review / spaced repetition of weak lessons.
   - F18. Progress view (where am I, what's next, fast first-song wins surfaced).

F. SUBSCRIPTIONS + ACCOUNT (build STEP 5)
   - F19. $12/mo single subscription via RevenueCat (StoreKit). No free tier
        beyond tuner+metronome.
   - F20. Auth + progress sync/storage via Supabase (Postgres+auth+storage+RLS).

G. BACKEND / OPS (not user-facing, but shipped)
   - F21. Cloudflare Worker LLM endpoint (lesson/coaching content in, text out).
   - F22. PostHog (funnels + retention) — needed for the v3 jam decision.
   - F23. Sentry (crash reporting).
   - F24. NO audio pipeline in v1: no DSP, no recording, no transcription
        (basic-pitch/librosa only matter if a future amendment reintroduces audio).

================================================================
2. EXPLICITLY EXCLUDED FROM V1 (do NOT reintroduce without a new amendment)
================================================================
   - X1. Camera / front-camera chord-shape check — RETIRED (was v2, now dropped).
   - X2. Record-a-take → audio critique / grading — RETIRED (AMENDMENT-04).
   - X3. On-device pitch/timing detection — RETIRED.
   - X4. Hand tracking / MediaPipe / fret-buzz diagnosis — RETIRED.
   - X5. Real-time note scoring / confidence gating as FX — RETIRED.
   - X6. Songs-as-licensed-library / on-demand songs — licensing = existential risk (R6).
   - X7. Live jams / community / duets — v3 conditional.
   - X8. Android / electric guitar / bass — v2+.
   - X9. Animated AI-generated playing hands — forbidden (fingering must be correct).
   - X10. Avatar picker / story campaigns / genre remix / AI-composed songs — v2+.

================================================================
3. DEFERRED ROADMAP (from spec §3, AMENDMENT-04 §5)
================================================================
   V2 (only after v1 retention data): Android port; technique-health tracking;
   song-based learning from a properly licensed catalog; async duets; then-vs-now
   progress reels; avatar picker (reskins only). Camera/posture is v2 OPTIONAL and
   ONLY with explicit owner direction — NOT assumed.
   V3 (conditional): live jam sessions (only if v2 shows a retention cliff community
   would fix); fine-grained pressure/wrist coaching (only if v1/v2 data is labeled).

================================================================
4. PROVENANCE / SOURCES (so this list can be re-verified)
================================================================
   - README §5 "WHAT V1 SHIPS" + §6 build order (01-START-HERE/README.md).
   - AGENTS.md Rule 2 (v1 = sequenced lesson app; retired mechanics).
   - guitar-app-spec-AMENDMENT-04.md (2026-08-05, current scope truth).
   - guitar-build-plan.md §2 (lesson-app build order).
   - guitar-app-spec-AMENDMENT-01/02/03.md (audio-first → animated teacher → AI-native
     stack; all subordinate to AMENDMENT-04 on scope).
   Build order: 0) content schema + renderer → 1) tuner/metronome → 2) lesson player
   + avatar shell → 3) sequenced curriculum + first 20 lessons → 4) progress/streaks
   → 5) subscriptions.

END OF FEATURES LIST.
