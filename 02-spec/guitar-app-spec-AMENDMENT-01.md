# SPEC AMENDMENT 01 — AUDIO-FIRST V1
Date: 2026-08-04 · Amends `guitar-app-spec.md` v1.0 and `guitar-build-plan.md`
Status: ACTIVE. Where this document conflicts with spec v1.0, THIS DOCUMENT WINS.
Basis: three parallel research reports (2026-08-04), all in `guitar-research/` :
  - guitar-feedback-stack-research.md (OSS audio stack, licenses)
  - guitar-app-feedback-competitive-analysis.md (competitor recording/feedback features)
  - guitar-video-ai-critique-research.md (video + LLM critique feasibility)

---

## 1. WHAT CHANGED AND WHY

Spec v1.0 locked the front-camera fretting-hand chord check as THE differentiator.
Research says that specific feature is not reliably buildable on a phone in 2026.

Evidence:
- Every published system reporting good fret/finger accuracy restricts scope
  (~5 chords, Stanford CS230), fixes the camera, or adds depth (ICMU 2023) or
  audio (TapToTab, arXiv:2409.08618 — YOLO locates the fretboard only; actual
  notes come from FFT on the AUDIO).
- Fretting fingertips are the most self-occluded landmarks in the frame — the
  worst case for MediaPipe/Vision hand pose.
- Barre chords, the #1 beginner failure, are essentially invisible to a camera.

A false "your finger is wrong" told to a student who is right destroys trust in
one session. That is a worse product than no camera at all.

CONSEQUENCE: the camera moves out of v1. The microphone carries v1.

## 2. AMENDED DECISIONS (supersede spec §0)

| Spec v1.0 said | Amendment 01 says |
|---|---|
| Camera chord-shape check ships in v1 (§0, §3) | DEFERRED. Not in v1. |
| Differentiator = camera sees your chord (§1) | Differentiator = async recorded-take critique + confidence honesty. See §4. |
| MediaPipe Tasks (Hands) for hand tracking (§5) | Apple Vision (hand + body pose) when video does arrive. Native, on-device, free, better-supported on iOS. |
| Real-time mic feedback (§1) | Post-take (async) analysis first. Real-time is harder and is the incumbents' strong ground. |
| Kill criterion (b): 3/10 must pay for CAMERA correction | REPLACED — see §6. Testing the camera premise as a go/no-go now kills the project over a feature we are not building. |

UNCHANGED and still locked: iOS-only, acoustic-only, fully synthetic lessons,
one cartoon avatar (no animated playing hands), $12/mo, no free tier beyond
tuner/metronome, contract-guitarist QA NON-NEGOTIABLE, Supabase/RevenueCat/
Cloudflare/PostHog/Sentry.

## 3. WHAT V1 IS NOW

The user records a take on their phone. The app grades it and coaches them.

Ships in v1:
- Free tuner + metronome (funnel front door — unchanged).
- LLM-generated beginner acoustic curriculum, guitarist-QA'd (unchanged).
- Lesson player + avatar shell (unchanged).
- **Record-a-take → audio critique**: note accuracy, chord correctness,
  timing against the exercise grid. We KNOW the target chord and tempo, so
  this is constrained matching, not open transcription — that is why it is
  accurate. (Open-ended transcription is bad: GuitarSet baseline 46%,
  2025 SOTA onset F1 0.52. We never do open-ended.)
- **Confidence gating**: below threshold we say "not sure — play that again",
  never a false red X. This is a headline feature, not an implementation detail.
- Adaptive loops, streaks, practice logging, server-side LLM session summary.

Explicitly NOT in v1: camera/hand tracking of any kind, fret buzz diagnosis,
pressure/wrist analysis, real-time note-by-note scoring, everything already
excluded by spec §3.

## 4. POSITIONING (replaces spec §1 one-liner)

Old: "The only app that can SEE why your chord sounds wrong."
New: **"Record it. Know exactly what to fix. Every time, same day."**

Justification from competitive research:
- Async "record → critique" is nearly unoccupied. Pickup Music is the only
  AI+video product and rations to ONE submission per pathway grade at ~1 week
  turnaround ($29.99/mo); their own docs concede it "can make mistakes…
  generally more accurate for beginners than advanced players."
- TrueFire charges **$39 per video exchange** on top of subscription.
  ArtistWorks and Guitar Tricks use human teachers — slow, does not scale.
- Yousician, Fender Play, Simply Guitar, Gibson App, Melodics are ALL
  real-time, audio-only, no video, no async critique. Fender's Feedback Mode
  is still beta and needs headphones so the mic does not hear itself.
- The category's open wound is false detection. Guitar.com on Simply Guitar:
  chord detection "simply not really functional" — it scored a COUGH as Fmaj7.
  Yousician staff on Reddit concede mic detection "is never perfect."

So v1 wins on: unlimited critiques, same-day, and admitting uncertainty.
The camera claim returns later as an upgrade, not as the founding promise.

## 5. TECHNICAL — AMENDED (supersedes spec §5 audio/vision clauses)

Approved stack (all permissively licensed):
- **spotify/basic-pitch** — Apache-2.0 — polyphonic note transcription.
- **librosa** — ISC — onsets, chroma, DTW alignment.
- **CREPE** — MIT — monophonic intonation.
- **AudioKitEX (PitchTap)** — MIT — the live tuner.

### LICENSE LANDMINE — HARD BLOCK
The following are the most commonly recommended guitar-MIR libraries and are
**UNUSABLE in a paid closed-source iOS app**. Any contractor must be told
this in writing before they open an editor:
- **Essentia** — AGPL-3.0
- **aubio** — GPL-3.0
- **TarsosDSP** — GPL-3.0
- **pedalboard** — GPL-3.0
- **dtw-python** — GPL-3.0
- **madmom** — non-commercial only (NOASSERTION)

### Split
- Server-side Python for post-take analysis in v1. Reason: iterate without
  App Store review; ~$40/mo CPU box handles thousands of takes/day.
- On-device for the tuner. Later: basic-pitch → Core ML.
- Architecture rule: DSP produces a small metrics JSON (~2KB); the LLM only
  writes the coaching prose and may ONLY cite metric keys that are present.
  No LLM guessing. Auditable and regression-testable.

### Cost
~$26/month of inference at 1,000 users × 10 clips/mo. Not a constraint.
Real cost is media storage IF we upload — so v1 uploads AUDIO ONLY
(tiny), and when video eventually lands it is processed on-device and
discarded. Learners skew young; not storing their home video is both
cheaper and a compliance/marketing asset.

## 6. REDDIT POST (optional extra info — interview gate RETIRED 2026-08-05)

The original "10 interviews / 30 days" validation gate below is RETIRED — the founder never
agreed to interviews. `04-validation/guitar-reddit-recruitment.md` is a discussion post we may
put up for extra context (what people liked/hated in other apps + $12/mo interest). It is
OPTIONAL EXTRA INFO ONLY — not a demand signal, validation, or go/no-go. Proceed on owner
direction (AGENTS rule 7).

[OBSOLETE GATE TEXT — history only, DO NOT ACT ON]
Still 10 interviews / 30 days. Criteria (a), (c), (d) unchanged.
REPLACEMENT (b): fewer than 3 of 10 interviewees say they would pay $12/mo
for **unlimited same-day recorded-take critique** → stop and rethink.
ADD (e) — camera demand probe, NON-BLOCKING: ask whether they would point a
camera at their hands, and whether they would trust it. This informs the v2
decision. It no longer gates v1. Nothing here can kill the project.

## 7. AMENDED BUILD ORDER (replaces build-plan §2)

- STEP 0 — Content schema + lesson JSON renderer. UNCHANGED, still first.
- STEP 1 — Free tuner + metronome (AudioKitEX). UNCHANGED.
- STEP 2 — Lesson player + avatar shell. UNCHANGED.
- STEP 3 — **Record-a-take + server audio critique** (basic-pitch + librosa
  vs the exercise's fixed MIDI grid). Confidence gating built in from day one,
  not bolted on. Est. 4–6 weeks. THIS IS THE NEW DIFFERENTIATOR.
- STEP 4 — Adaptive loop, streaks, practice logging.
- STEP 5 — Subscriptions (RevenueCat).
- STEP 6 — (was camera chord check) → DEFERRED to v2 track, and when it
  returns it returns in this order: posture (Vision body pose) → strumming
  hand (wrist Y-signal, cross-validated against audio onsets) → fretting
  hand LAST, scoped to 8–12 chords, guided-framing mode, confidence gate.

## 8. AMENDED RISKS

- R1 (differentiation collapse if camera cut) — RESOLVED by this amendment.
  The differentiator no longer depends on the camera.
- R3 (camera setup friction) — deferred with the feature.
- R4 (classifier accuracy on messy hands) — deferred with the feature.
- NEW R6 — **Async critique may feel less fun than real-time scoring.**
  Yousician's gamified instant feedback is genuinely engaging. Mitigation:
  fast turnaround, avatar delivers results with personality, and lean on
  "unlimited + honest" against their documented false positives.
- NEW R7 — **Buzz detection is the real long-term moat and it is a DATA
  problem, not a code problem.** No public labeled fret-buzz dataset exists.
  See Amendment 02 (buzz recording plan) — next work item.
- CARRIED — do not claim audio parity with Yousician at v1.

## 9. NEXT ACTIONS

1. Run the amended validation gate (§6). Still blocks Step 3 code.
2. Next work item: **Amendment 02 — fret buzz recording/labeling plan**,
   to run alongside contract-guitarist QA.
3. Hire guitarist; start LLM curriculum + QA loop.
4. Build Steps 0 → 5.
