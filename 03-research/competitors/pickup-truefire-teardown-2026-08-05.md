# Pickup Music + TrueFire — Competitor Teardown (ADDED 2026-08-05)

> **SUPERSEDED POSITIONING NOTE (2026-08-05, AMENDMENT-04):** this doc was written the same day we
> RETIRED the record-a-take audio critique. The "our v1 moat (async record-a-take…)" reference below
> describes our *former* positioning. The app is now a SEQUENCED LESSON APP (no recording). The Pickup/
> TrueFire competitor facts remain valid; only the contrast against "our moat" is historical.

Purpose: complete the competitive set. The spec/README reference Pickup Music and TrueFire as
pricing/feedback comparisons (e.g. "Pickup rations feedback; TrueFire $39/exchange") but neither
was formally torn down. Sources: pickupmusic.com + /pricing (2026-08-05 capture), truefire.com,
go.truefire.com/truefire-vs-pickup-music, Trustpilot, Reddit r/guitarlessons, Guitar World.

## CORRECTION TO PRIOR NOTES
Earlier handoff copy said Pickup "rations to 1 video/week, ~1 week to grade." That is INACCURATE.
Pickup's model is **async human critique** — submit a performance video, a real instructor
(rebranded "mentor") replies with personalized feedback. Trustpilot cites "typically replies
within 48 hours." The rationing is real but it is a SUBMISSION-COUNT / cadence limit per tier,
not a 1-per-week hard cap, and turnaround is ~2 days, not ~1 week. The point for our positioning
still holds (incumbents ration + delay feedback); the specifics below are the accurate version.

================================================================
## PICKUP MUSIC
================================================================
WHAT IT IS
- Structured video-course platform (guitar/bass/piano) + **1-on-1 async video feedback** from
  real instructors. Not app-only: desktop/tablet/mobile; has an iOS app (id6503952069).
- Trustpilot 4.8/5 ("Excellent"); claims 91% improve playing, 83% out of a rut, 90% recommend,
  "4x faster than self-taught." 60-day money-back guarantee.

PRICING (from /pricing, 2026-08-05)
- Monthly: $29.99/mo (charged monthly).
- Annual: $14.99/mo equivalent, $179.99 charged yearly (≈50% off monthly).
- 14-day free trial.
- Our $12/mo sits BELOW Pickup's annualized $14.99/mo and far below its $29.99/mo. But note
  Pickup's feedback is HUMAN-instructor time — a different cost structure than our automated
  async critique. We undercut them on price AND (claim) beat them on turnaround + unlimited.

FEEDBACK MODEL (the part that matters vs us)
- Async HUMAN critique: submit a video of your playing → instructor reviews and replies. The
  closest existing analog to OUR "record a take, get it back" concept — BUT:
  - It is a PERSON, so it is rationed (tier limits submissions) and has latency (~48h).
  - It is NOT real-time, NOT algorithmic, NOT confidence-gated. A human never says "not sure,
    play again" with calibrated probability — they just give their opinion.
  - Scale ceiling = instructor headcount. Ours (server-side DSP + LLM prose) is meant to be
    unbounded per user at near-zero marginal cost.
- KEY WEDGE: "submit a take → back SAME DAY, UNLIMITED, with honest confidence" beats Pickup on
  speed + volume; we must be explicit that our critique is automated (honest about the human
  feel gap) but instant and unlimited.

WHAT THEY DO NOT DO
- No front-camera chord check (consistent with all incumbents).
- No real-time in-app audio scoring (like Yousician). Feedback is async-human only.
- Filmed-human content (opposite of our synthetic/zero-filmed-footage decision).

================================================================
## TRUEFIRE
================================================================
WHAT IT IS
- The "world's most comprehensive" library play: 85,000+ interactive video lessons, 1,000+
  courses, 400+ educators (Grammy winners: Steve Vai, Tommy Emmanuel, Eric Johnson, etc.).
  ~3M students, 30+ years. Guitar-focused (acoustic/electric/bass) + theory/ear training.
- Platform: web + Windows/Mac/Linux/iOS/Android apps. 14-day All Access free trial.

PRICING
- "All Access" subscription (exact $ not on homepage; commonly cited ~$19-$29/mo or annual
  ~$99-$149 — VERIFY before quoting in spec; the $39/exchange figure in old notes refers to
  their legacy "private lesson exchange," not the standard sub). This needs a pricing-page
  confirm — see OPEN ITEMS.
- Interactive practice tools: synced tab/notation, slow-down/loop, multi-angle video.

FEEDBACK MODEL
- Mostly PASSIVE library + guided paths. 1:1 feedback exists but as **live workshops / Q&A
  sessions and a paid "private lesson exchange"** — NOT an always-on submit-a-take critique.
  TrueFire-vs-Pickup page literally lists Pickup as the one with "submit performance videos for
  personalized critique" and TrueFire as "live workshops & Q&A." So TrueFire is even further
  from our model than Pickup.

WHAT THEY DO NOT DO
- No app-side audio recognition, no camera, no async automated critique. Pure content library
  + live events. Confirms our "no songs/content-licensing arms race" scope choice — TrueFire's
  moat is catalog depth + celebrity educators, which we explicitly are NOT competing on.

================================================================
## WHY THIS MATTERS FOR OUR SPEC/PLAN
================================================================
1. Our v1 moat (async record-a-take → automated, confidence-gated critique, same-day, unlimited)
   is distinct from EVERY incumbent:
   - Yousician/Simply/Gibson = real-time-in-app audio, no submission.
   - Pickup = async but HUMAN (rationed ~48h, tier-limited).
   - TrueFire = live workshops/Q&A, not on-demand critique.
   => We are the only ASYNC + AUTOMATED + UNLIMITED + CONFIDENCE-HONEST option. That is the wedge;
      state it precisely in the spec's differentiation section. Do NOT overclaim "AI feedback" as
      unique (Gibson + Pickup both use "AI/personalised" language) — claim the ASYNC+AUTOMATED
      combination.
2. Pricing: our $12/mo is competitive vs Pickup ($14.99-$29.99) and Gibson ($10.83-$19.99). We are
   NOT the cheapest, but we pair lower price with a feedback model no one else offers. Defensible.
3. Human-feel gap is real: Pickup's strength is a real musician's ear. We must set expectation in
   the spec that v1 critique is DSP+LLM, not a human — and that the contracted guitarist QA gate
   (AGENTS hard rule 8) is what protects musical correctness, not the live critique.

================================================================
## OPEN ITEMS THIS RAISES
================================================================
- CONFIRM TrueFire All Access current $ (pricing page blocked by extension in capture; Reddit/
  reviews suggest ~$19-$29/mo or ~$99-$149/yr). Don't ship the spec with the stale "$39/exchange"
  figure as if it's the sub price.
- The spec/README should drop the loose "Pickup rations to 1 video/week ~1 week" phrasing and use
  the accurate "async human critique, ~48h, tier-limited submissions."
- Add a one-line differentiator table to the spec: Real-time-in-app (Yousician/Gibson) vs
  Async-human (Pickup) vs Live-events (TrueFire) vs Async-automated-unlimited (US).
