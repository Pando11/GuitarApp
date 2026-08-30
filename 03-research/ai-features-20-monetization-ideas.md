# GuitarApp — 20 AI Features to Make the App More Successful Financially

Generated 2026-08-16 in a brainstorming session with Heidi (Boris-prompt reword).
Scope: every idea is grounded in what the app ALREADY has — the PWA, the free
commercial-clean AI stack (FLUX.1[schnell], Wan2.1-I2V, Chatterbox MIT, Kokoro-82M
Apache-2.0, Godot MIT), the practice engine (weak-pair review + 30/60 sensor +
spaced decay), the lesson worlds, and the existing premium/paywall gates.

Legend per item:
- REVENUE = makes new money / raises conversion / cuts churn (longer subscription life)
- COST     = saves money (lower support, lower content cost, lower install cost)
- Effort   = low / medium / medium-high / high

================================================================================
BATCH 1 (first 10)
================================================================================

1. AI-personalized daily practice plans  [REVENUE, low]
   The practice engine already tracks your 3 weakest chord-pairs per lesson.
   An AI turns that into a custom daily plan (which drills, in what order).
   Sold as the paid tier. Sits on existing weak-pair data.

2. "Hum a song -> instant lesson" transcriber  [REVENUE, medium]
   User hums or uploads a song; AI outputs a simplified chord progression using
   only chords the student has already learned. Near-zero authoring cost for new
   songs (songs are the moat but hand-authoring is slow). More songs = more reasons
   to keep the subscription.

3. Real-time AI feedback coach  [REVENUE, medium-high]
   The app already listens via the CREPE-class mic listener. Add AI that says
   "your changes are rushed" or "you're muting the G string" instead of just
   counting. One-on-one coaching JustinGuitar/Yousician can't easily do. Premium.

4. Adaptive pacing (anti-churn)  [REVENUE, medium]
   AI slows or speeds the curriculum per student from how they're doing. Better
   completion = students don't quit = longer subscription life.

5. AI lesson-world factory  [COST, high one-time]
   The FLUX -> Wan -> Chatterbox -> Godot pipeline makes "movie" lessons.
   Automating world generation end-to-end drops cost-per-lesson toward zero
   (models are free + commercial-clean). Margin: ship 10x the content for the same spend.

6. Churn-prediction nudges  [REVENUE, low-medium]
   AI spots students about to quit (streak dying, weak-pair decay ignored, session
   gaps) and fires a personal "don't break your streak" nudge. Keeping 5% more users
   > finding 5% more new ones.

7. Grounded AI tutor chat (paywall you already have)  [REVENUE, low]
   renderChat is already gated behind premium. Make the chatbot answer using ONLY
   the verified curriculum (no made-up chords). "Ask a guitar teacher, anytime" =
   clean upsell and a differentiator vs generic ChatGPT.

8. SEO / content engine for cheaper installs  [COST/REVENUE, low]
   AI writes song tutorials, blog posts, YouTube scripts using your world visuals to
   pull organic installs. Lower cost to acquire a user = higher profit per user.

9. AI paywall / price optimization  [REVENUE, low]
   Auto A/B-tests trial length, price, and paywall wording, then picks the winner per
   user type. Pure conversion lift, no new feature.

10. White-label voice cloning for teachers (B2B)  [REVENUE, medium]
    Chatterbox does zero-shot voice clone (free, MIT). A teacher clones their own voice
    into the app and sells lessons to students. New B2B revenue on top of consumer sub.

================================================================================
BATCH 2 (second 10)
================================================================================

11. AI backing-band play-alongs  [REVENUE, medium]
    The app already scales song tempo (25-125% like Yousician). Add AI that generates
    a simple drum/bass track under each song at the student's tempo. "Band in your
    pocket" upsell.
    CAVEAT: music-gen models aren't in the verified free stack yet. MusicGen (MIT) is
    a candidate but license-check it first, same as we did for voice.

12. Shareable progress videos  [REVENUE via cheaper growth, low-medium]
    At a milestone, AI auto-builds a short video (world visual FLUX/Wan + achievement
    text) ready to post. They share, friends see GuitarApp, you get free installs.
    Lower cost to acquire a user = more profit per user.

13. Parent progress reports  [REVENUE B2C2, low]
    Practice engine already tracks weak-pairs + streaks. AI turns that into a
    plain-language weekly email to a parent: "Sam struggled with F changes this week,
    here's the plan." Opens the kids' market — parents pay.

14. Auto-leveled songs  [REVENUE via less churn, medium]
    AI rearranges any song down to the student's current level (fewer chords, simpler
    strum) and ramps it up as they improve. Keeps them in the "just right" zone so they
    don't quit from frustration.

15. Teacher dashboard  [REVENUE B2B, medium]
    Real teachers using the app with students get an AI summary of the whole class —
    who's stuck, who's flying. Sells a per-teacher/seat plan on top of consumer subs.

16. Smarter upgrade offers  [REVENUE, low]
    AI splits users into groups (newbie / stuck / almost-done) and shows each a
    different "go premium" message at the moment they're most likely to buy. Pure
    conversion lift, no new feature.

17. Full app translation into other languages  [REVENUE, big TAM, medium]
    Chatterbox clones the teacher voice in any language; FLUX/Wan re-skin worlds;
    lesson JSON is already text. Localize the whole app and open non-English markets
    without authoring new curriculum.

18. "Play with the band" AI fill-in  [REVENUE, medium]
    Student plays their part; AI fills in the rest of the song in real time so it
    sounds complete. Feels like a real band. Premium engagement hook.
    Same music-gen license caveat as #11.

19. Wrong-tuning / wrong-guitar auto-detect  [COST + less churn, low-medium]
    App already teaches tuning and listens via the mic. AI detects "you're a half-step
    flat" or "that's not the chord you think" before the student gets frustrated and
    quits — or emails support. Fewer angry refund requests = lower support cost + lower churn.

20. Graduation upsell at the capstone  [REVENUE, timed, low]
    When a student finishes lesson 25 (the capstone), AI spots the win and offers the
    next paid track: "you're ready for intermediate." Selling at peak motivation =
    highest conversion.

================================================================================
BATCH 3 (added 2026-08-16)
================================================================================

21. Seamless lesson-to-lesson continuation (stay in the teacher's world)  [REVENUE (anti-churn), low]
    Today, finishing a lesson dumps the student on the progress screen / lessons
    list; to start the next one they back out, pick it, and re-enter the world.
    Instead, on lesson-complete show a "✓ Lesson complete" card with a
    "Next lesson ▶" button that loads the NEXT lesson straight from the canonical
    manifest order — same teacher, no trip to the menu. Only offered if canLesson()
    allows it (free users aren't shoved into a paid lesson). Removes the
    exit-pick-reenter friction that breaks the practice flow = higher completion,
    lower churn. Sits on existing data (manifest order + entitlement gate); PWA
    first, mirror into the Godot world later. (Interaction style — button vs
    auto-play — still owner TBD; logged as the button-card version.)

================================================================================

HIGH-ROI CLUSTER TO DIG INTO FIRST (owner note)
Cheapest + most grounded, sit on data already collected, barely any new build:
- #1  AI-personalized daily practice plans
- #7  Grounded AI tutor chat (gate already exists)
- #3  Real-time AI feedback coach
- #12 Shareable progress videos
- #13 Parent progress reports
- #16 Smarter upgrade offers
- #20 Graduation upsell at capstone

Bigger swings (more build, bigger payoff):
- #5  AI lesson-world factory (margin)
- #10 White-label teacher voice (B2B)
- #17 Full translation (new markets)

Open license check before building #11 / #18: verify a free commercial-clean
music-generation model (MusicGen MIT candidate) the same way voice models were
vetted (AMENDMENT-07/08 license redlines).

================================================================================
STATUS UPDATE (2026-08-16)
================================================================================
Owner deleted Rule 4 (open-ended transcription ban) AND Rule 7 (no recording/
transcription ban) from AGENTS.md by direct instruction. This UNBLOCKS idea #2
("hum a song -> instant lesson") — it is no longer off-limits in v1.
Remaining guardrails still applying to #2:
- Camera / hand-tracking remain BANNED via Rule 2 ("Still NO camera, NO hand tracking").
- Keep #2 reliable: match against the known chord set the student has learned,
  not free inference (the old ~50% accuracy concern is now product-quality, not a hard ban).
- Other repo files still named "Rule 4 / Rule 7" — all re-pointed to the 2026-08-16
  deletion on 2026-08-16 (see AMENDMENT-04/05/07/10/11, COMPLAINTS-TO-FEATURES, the
  practice-engine listeners, README, scale-100 spec, LessonScene.gd). Only HANDOFF-ARCHIVE/
  snapshots still carry the old wording; those are dated historical records, left intact.
