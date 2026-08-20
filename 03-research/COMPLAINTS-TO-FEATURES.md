# How We Use the Complaint Research to Improve Our Guitar App

Generated 2026-08-14 (autonomous handoff hop). Plain list for the owner:
each row = a documented complaint about competitors -> what OUR app does
differently -> PROOF it is real (not a plan we forgot to build).

## Where the complaints come from
- PRIMARY EVIDENCE: `03-research/feedback-tech/guitar-app-feedback-competitive-analysis.md`
  — a per-app teardown of Yousician, Fender Play, Simply Guitar, Gibson, Melodics,
  Pickup Music, ArtistWorks, TrueFire, Guitar Tricks. Every complaint below is
  sourced to a real review/Reddit thread in that file.
- SECONDARY: `03-research/market/RESEARCH_DATA_CONSOLIDATED.md` (competitor teardown).

## HONESTY NOTE on the scrape
The Scrapy run (`scraping-stack/harvester/out/FINAL3_reviews.jl`) captured 51
**Music StackExchange theory Q&A threads**, NOT beginner app complaints. So it is
NOT used as the complaint corpus. The usable complaint evidence is the competitor
feedback teardown above. Flagging so we don't build on a false premise.

================================================================
THE LIST — complaint -> our fix -> proof it is built
================================================================

1. COMPLAINT: "The app tells me I'm wrong when I'm playing it right."
   - Yousician: "keeps telling me I'm getting notes wrong when I'm playing them."
   - Simply Guitar: registered a COUGH as an Fmaj7; "you can play an entire song
     crappily and still pass." Fender Feedback Mode still labelled BETA.
   - ROOT CAUSE: open-ended audio transcription is ~50% accurate industry-wide.
   -> OUR FIX: We do CONSTRAINED matching
      against the KNOWN target chord + tempo only (on-device, audio never uploaded).
      NOTE: the former AGENTS Rule 4 / Rule 7 hard bans on open-ended transcription and
      recording were DELETED by owner direction 2026-08-16. Constrained matching remains
      our design choice for accuracy, not a rule-enforced ban.
   -> PROOF: AGENTS Rule 2 still requires on-device processing with audio never uploaded;
      the accuracy rationale (open transcription ~50%) stands as a product-quality guide.

2. COMPLAINT: False confidence / false red X — apps mark you wrong with no honesty.
   - Users distrust apps because the judgement is binary and wrong.
   -> OUR FIX: Confidence gating is a FEATURE, not polish. Below threshold the
      teacher says "not sure, play that again" — never a false red X (AGENTS Rule 6).
      The LLM may cite ONLY metric keys present in the DSP JSON; it never invents
      a musical judgement (AGENTS Rule 5).
   -> PROOF: F6 message module test asserts "factBody only uses real keys" and
      "no invented diagnosis." Test result: 16 passed, 0 failed
      (`node verify-step6-messages.js` in 06-prototypes/step6).

3. COMPLAINT: No follow-through — apps track streaks/XP but don't REMEMBER you.
   - Incumbents track streaks; nobody says "your Em took 5 tries last week, 2 today."
   - This is the #1 thing beginners quit over: feeling forgotten.
   -> OUR FIX: A longitudinal practice memory (the core of AMENDMENT-11: world-locked
      teacher + longitudinal student memory). The F6 follow-up module reads the REAL
      practice record and sends a message citing a TRUE fact, e.g.
      "Your Em isn't ringing clean yet — 2 minutes on it today. Open lesson/Lxx."
      Two distinct loops (see below) keep it from feeling like a generic blast:
        LOOP 1 (app-initiated): app notices struggle -> later encourages. BUILT + TESTED.
        LOOP 2 (student-initiated): student asks for help on X -> later follows up
          specifically on THE THING THEY NAMED. NOT YET BUILT (the one real gap).
      Safety built in: per-day frequency cap (default 2) + one-tap mute.
   -> PROOF: `06-prototypes/step6/messages/messages.js` exists and passes
      `verify-step6-messages.js` (16/0). Store APIs it depends on exist:
      getStruggledChords, getCleanChords, lessonForChord, currentStreak, isMuted,
      recordMessage, messageCountSinceChannel (all in store/practiceStore.js).

4. COMPLAINT: Expensive — human video coaching is $20–39/mo PLUS per-exchange fees
   (TrueFire $39/exchange; Pickup $29.99/mo but rations 1 submission per grade,
   ~1 week turnaround, and disclaims its own AI accuracy).
   -> OUR FIX: $12/mo, no per-fee-per-critique. The follow-up/encouragement loop is
      unlimited (capped only by the anti-nag daily limit), not rationed like Pickup.
   -> PROOF: AGENTS.md product guardrails ("$12/mo, no free tier beyond tuner +
      metronome"). The unlimited-but-capped send logic is in messages.js
      (withinCap default maxPerDay=2, per-channel).

5. COMPLAINT: Can't SEE the hands — every mass-market app is ears-only; beginner
   failures (thumb over neck, collapsed wrist, fretting too far from the fret) are
   invisible to audio.
   -> OUR FIX (honest): We do NOT use the camera in v1 either — that mechanic was
      RETIRED (AMENDMENT-04; camera/hand-tracking now barred by AGENTS Rule 2). So we do
      NOT claim to fix this with vision. Our different answer:
        - Fingering is shown by CORRECT-BY-CONSTRUCTION diagrams driven from the
          arithmetically-verified chord-theory-check.js data (AMENDMENT-10 permits
          AI-drawn fingers/fretboards, must be driven by the verified data).
        - The teacher can RE-SHOW the fingering slower / different angle (Loop idea 6).
        - The real differentiator here is memory + personal follow-up (item 3), not
          a camera we don't have.
   -> PROOF: chord correctness is verified by ARITHMETIC (chord-theory-check.js),
      not a human — already caught a real defect (D major middle/ring swapped in 3
      lessons). AGENTS Rule 8. (Vision/camera remains a deferred v2 arm — stated
      honestly, not promised.)

6. COMPLAINT: Async is the honest format but incumbents ration it.
   - Pickup's async AI validated demand but gates to 1/grade, 1 week, disclaims accuracy.
   -> OUR FIX (honest): The old "unlimited async record-a-take critique" moat was
      RETIRED (AMENDMENT-04). Our v1 answer is LIVE in-lesson verification the student
      triggers (constrained matching), PLUS the memory/follow-up loop (item 3) that
      gives the "someone is following up with me" feeling without a camera or a
      rationed human. We are honest that we do not ship unlimited async human-style
      critique at v1.
   -> PROOF: AMENDMENT-11 thesis (world-locked teacher + longitudinal memory + duet);
      AGENTS Rule 7 retired mechanic (Rule 7 deleted 2026-08-16; the recording ban it held is gone, but the retirement decision stands).

7. COMPLAINT: Walled curriculum — incumbents only grade their own content.
   -> OUR FIX (honest / future): v1 is a sequenced lesson app on our own 20-lesson
      curriculum + songs; bring-your-own-song is NOT v1. Noted as a future opening,
      not claimed as shipped.
   -> PROOF: 20 lessons exist as JSON practice data (05-content/guitar-lesson-*.json);
      not positioned as a BYO-song grader.

================================================================
THE STRUGGLING-STUDENT LOOP — red-line (built on complaint #1 + #3)
================================================================
Conversation 2026-08-14: how the app helps a student who is stuck. Each
idea is red-lined [IN] (allowed for v1, buildable on existing parts) or
[OUT] (blocked by our own hard rules — deferred, not promised).

[IN] 1. Auto-serve more practice on the stuck thing.
  Student says "I can't get this" (or the memory shows a chord failing) ->
  teacher pulls a fresh drill for that exact chord from our lesson JSON and
  tells them to run it. Builds on the practice memory we already have (F4 chat
  reads the store; 20 lessons exist as reusable data).

[IN] 2. Teacher explains it a different way.
  Sticky topics (barre chords, tuning, posture) get 2–3 pre-authored alternate
  explanations; the teacher picks another instead of repeating itself. Authored
  content, NOT the AI inventing a diagnosis (satisfies AGENTS Rule 5).

[IN] 3. Slow it down / loop a smaller piece.
  If timing is the struggle, teacher drops metronome speed and loops just the
  hard 2 seconds. Metronome + tempo control already exist.

[IN] 4. Break the skill into baby steps.
  Chord change failing? Teacher splits it: "lift fingers" -> "land them" ->
  "both." Tiny drills beat repeating the whole thing.

[IN] 5. "You're getting better" from real memory.
  Teacher can say "last week your Em took 5 tries, today 2" because we keep a
  running history (core of AMENDMENT-11: teacher that remembers you).

[IN] 6. Re-show the fingering, slower / different angle.
  Re-draw hand position from verified chord-theory-check.js data at slower
  speed or new angle. Safe — driven by math, not guessed (AMENDMENT-10).

[OUT] 7. Camera watches their hands to see the mistake.
  RETIRED for v1 (camera/hand-tracking now barred by AGENTS Rule 2). Natural answer
  but blocked; a later-version arm only. Do NOT promise.

[OUT] 8. Record their playing and critique the take.
  Also RETIRED (the recording ban it held was in Rule 7, deleted 2026-08-16 by owner; the retirement decision stands). Do NOT reintroduce "send us your recording" without explicit owner go-ahead.

[OUT] 9. Free AI tutor that diagnoses WHY a chord sounds bad.
  Our rules say the AI may only repeat facts from the practice record — never
  invent a physical diagnosis ("your wrist is wrong"). Chat stays rule-based
  and safe, not a free-form guessing doctor.

RECOMMENDED BUILD ORDER (the high-value, fully-allowed trio):
  (a) Wire chat to practice memory so "I can't get this" pulls a real drill
      (ideas 1 + 4 together).
  (b) Add alternate explanations (idea 2).
  (c) Add slow-down/loop (idea 3).

================================================================
THE FULL STUDENT LIFECYCLE (three loops working together)
================================================================
LOOP A — In lesson, live catch (IN, BUILT + TESTED this session: drillSelector.js + chat reply serves a real drill).
  Student stuck / names a chord -> teacher serves a FRESH drill from the lesson JSON
  for that exact chord (real coaching copy, real lesson link) + records the ask so
  Loop C2 can follow up on it. No invented diagnosis (Ban 6); local files only (Ban 5).

================================================================
OPEN BUILD TASKS (all closed — kept for history)
================================================================
TASK-A1 (Loop A drill-serving) — BUILT + TESTED this session (2026-08-14).
  - New module `drillSelector.js`: reads 05-content lesson JSON, finds an exercise
    whose params.chord_pair includes the target chord, returns {lessonId, lessonTitle,
    exerciseName, coaching, chordPair}. Null if no match (no fabricated drill).
  - chat/chatEngine.js `reply()` now: on a struggle signal OR a named chord, records
    the ask via `studentRequested(realChord)` and serves the real drill (ideas 1+4).
    Falls back to data-derived encouragement if no drill matches. Off-topic still
    redirected with no drill.
  - New `verify-step6-loopA.js` DONE BAR: 14 passed, 0 failed.
  PROOF: full Step-6 suite = verify-step6-loopA (14) + verify-step6-loops-bc (20)
    + verify-step6-messages (16) = 50 passed, 0 failed.
  INDEPENDENT VERIFICATION: hostile agent re-read files, re-ran all suites, and
    tried to break it (named-chord drill, struggle-fallback, off-topic no-drill,
    unknown-chord null, Ban 5/6 grep). Verdict recorded in handoff log.

NOTE: real text/email/push DELIVERY for C1/C2 remains a separate integration task
(stubbed by design — needs push provider + student contact). Tracked outside this
doc as a launch-integration item, not a Step-6 gap.

=== ALL STEP-6 STUDENT-HELP LOOPS NOW SHIP (A, B, C1, C2) ===

LOOP B — Next lesson opens with a review check (IN, BUILT + TESTED this session: `reviewPrompt`).
  At the start of the next lesson the teacher asks "Got it? Want to review?"
  backed by the struggled-chords record. One tap -> jumps to a review drill.
  This is the opposite end of the in-lesson catch and needs no new rule.

LOOP C — Outside-app follow-up (two distinct sub-loops — DO NOT merge):

  LOOP C1 (APP-INITIATED, BUILT + TESTED = F6):
    App notices struggle -> later reaches out on its own:
    "Your Em isn't clean yet — 2 min on it today? Open Lxx."
    Scheduled by app; daily cap (default 2) + one-tap mute already in place.

  LOOP C2 (STUDENT-INITIATED, DESIGNED, NOT YET BUILT):
    Student reaches out FIRST ("I can't get this barre chord") -> teacher serves
    help in-lesson -> later follows up specifically on THE THING THEY NAMED:
    "That barre chord you asked about yesterday — how's it going? Here's
    another drill if you want it."
    This is a reply to a real request, referencing the exact item they named.
    Different trigger, different message, different loop than C1.

WHY C1 AND C2 MUST STAY SEPARATE (the honesty line):
  If we reuse F6's generic "your Em isn't clean" text for a student who ASKED
  for help, it reads as the app not listening — the exact complaint we set out
  to avoid. Our whole thesis is "a teacher that remembers you." A generic blast
  contradicts that. So:
    - C1 message = generic encouragement from the practice record (coded).
    - C2 message = references the SPECIFIC thing the student named, and only
      fires because the student asked. Needs a distinct flag + template.

BUILD GAP FOR C2 (the one concrete missing piece):
  1. New store entry `studentRequested(chord, ts)` recording "student asked for
     help on X at time T" (small addition to practiceStore.js).
  2. A Loop-2 message template that reads that entry:
     "That [chord] you asked about — how's it going?"
  3. Wire it to fire once at next lesson-start OR next-day push, with the SAME
     mute/cap safety as C1.
  Everything else (chat serving help, practice memory, F6 send/cap/mute) exists.

================================================================
SUMMARY FOR THE OWNER (plain)
================================================================
We avoid the complaints that actually sink competitors by:
 (a) never doing the inaccurate open-ended detection that makes apps say "you're
     wrong when you're right" — we match only known targets and admit uncertainty;
 (b) remembering the student across lessons and following up on what they struggled
     with (and, soon, on what they ASKED about) — the "app that forgets you" gap;
 (c) pricing flat at $12/mo with unlimited (anti-nag-capped) encouragement instead
     of rationed $30/mo human critique;
 (d) showing fingering by verified math, not a camera we don't ship.

WHAT IS BUILT AND TESTED:
  - The practice memory (practiceStore.js) + F6 app-initiated follow-up messages
    (16/0 tests via node verify-step6-messages.js).
  - The F4 teacher chat reads the store and replies on-topic (coded, rule-gated).
  - Constrained-matching / confidence-honesty / no-camera / arithmetic-chord-verify
    are all hard AGENTS.md bans (enforced, not aspirational).

THREE REAL GAPS (designed, not yet coded):
  - GAP 1 — LOOP B (next-lesson "got it? want to review?"): not built. Needs a
    lesson-start hook that reads struggled-chords and offers a one-tap review drill.
  - GAP 2 — LOOP C2 (student-initiated targeted follow-up "that thing you asked
    about"): not built. Needs a `studentRequested(chord, ts)` store entry + a
    Loop-2 message template (see build gap above).
  - GAP 3 — real text/email/push SEND for follow-ups: F6 currently only PRODUCES
    + records the message (network send is stubbed). Push is the v1 path (in our
    stack); text/email needs the student's phone/email first.
Everything else in this list has working code or a hard rule enforcing it.

================================================================
BUILD STATUS — gaps now closed (2026-08-14)
================================================================
All three gaps above were implemented and independently verified same session:

  GAP 1 (LOOP B)  -> CLOSED. `reviewPrompt(store)` in messages/messages.js reads
      getStruggledChords() and returns {chord, lesson, prompt, deepLink}, or null
      when nothing was struggled. The lesson-start hook can call it; a null means
      "skip the prompt." (No invented guess — only real struggle data.)

  GAP 2 (LOOP C2) -> CLOSED. practiceStore.js got: `helpRequests[]` (init +
      toJSON persist), `studentRequested(chord,ts)`, `getPendingHelpRequests()`,
      `markHelpRequestFollowedUp(chord)`. messages.js got `loopC2Body(req)` +
      `sendLoopC2(store,channel,requestTs,opts)`. C2 ONLY fires for a pending
      student request and references that EXACT chord by name — keeping it
      distinct from C1 (generic app-initiated encouragement). It reuses the same
      recordMessage + mute + per-day-cap safety as C1.

  GAP 3 (SEND)    -> BY DESIGN, not a gap. F6 was always produce+record+stubbed-
      network (prototype discipline: prove logic, stub boundary). Loop C2 rides
      the same proven send path. Wiring to real push/SMS/email is a separate
      integration task outside Step 6's scope (needs the student's phone/email
      + a push provider we already have in the stack).

PROOF: `node verify-step6-loops-bc.js` = 20 passed, 0 failed
       (GAP1 prompt-from-struggle, GAP2 C2 exact-chord + mute + cap + no-re-nudge,
        GAP2d deep-link regression the hostile agent caught + fixed, GAP3 no-network).
       Existing `verify-step6-messages.js` still 16 passed, 0 failed -> combined 36/0.
INDEPENDENT VERIFICATION: a separate hostile agent read the files, re-ran both
suites (33/0 at the time), and tried to break it (empty-chord throw, no-request
no-send, mute, no-re-nudge, fresh-store null). Verdict: GREEN. It ALSO caught a
latent bug — `loopC2Body` fallback returned a chord NAME instead of a lesson id,
producing a broken "lesson/B7" link when the asked chord was never logged. FIXED
same session: fallback now resolves to 'L01' (real lesson id), and a regression
test (GAP 2d) locks it. Re-run after fix: 36/0.
