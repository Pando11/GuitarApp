# GUITAR LESSON APP — FILE INDEX
Last updated: 2026-08-04

Everything for this project lives on the Desktop. Start here.

## READ IN THIS ORDER

1. `Desktop/guitar-app-spec.md` — Product spec v1.0 (2026-08-02). The locked decisions.
2. `Desktop/guitar-app-spec-AMENDMENT-01.md` — **AUDIO-FIRST V1 (2026-08-04). WINS ON ANY
   CONFLICT WITH THE SPEC.** Camera deferred out of v1; differentiator is now async
   recorded-take audio critique + confidence honesty. Kill criterion (b) replaced.
3. `Desktop/guitar-build-plan.md` — Execution plan. Build order superseded by Amendment 01 §7.

## RESEARCH — Desktop/guitar-research/

### Feedback-feature research (2026-08-04) — the basis for Amendment 01
- `guitar-feedback-stack-research.md` — Open-source audio stack. Approved libs
  (basic-pitch, librosa, CREPE, AudioKitEX) + **the license blocklist**
  (Essentia AGPL, aubio/TarsosDSP/pedalboard GPL, madmom non-commercial).
  Read before any contractor writes audio code.
- `guitar-app-feedback-competitive-analysis.md` — Who offers record→critique.
  Pickup Music is the only AI+video product (1 submission per grade, ~1wk).
  TrueFire charges $39/exchange. Everyone else is real-time audio-only.
- `guitar-video-ai-critique-research.md` — Why the camera is deferred: fretting-finger
  detection is not reliable on a phone; posture/strumming ARE. Gemini samples video
  at 1 FPS so strumming is unobservable. Hybrid DSP→LLM design + cost model (~$26/mo
  at 1,000 users).

### Earlier competitor / market research
- `COMPETITOR_TEARDOWN.md` — Yousician, Fender Play, JustinGuitar, Simply Guitar.
- `PLATFORM_BUILD_ANALYSIS.md` — build patterns from cloned OSS refs.
- `REVERSE_ENGINEERING_PLAYBOOK.md` — method used for the teardowns.
- `RESEARCH_DATA_CONSOLIDATED.md` — consolidated earlier findings.
- `guitar-app-marketing-playbook.md`
- `guitar-channel-teardown.md`, `guitar-channel-teardown-justin-andy.md`,
  `guitar-lesson-channels-competitive-teardown.md`,
  `guitar-channels-business-model-report.md`,
  `guitar-chord-teaching-teardown.md` — YouTube/creator side.

### Cloned reference repos — `guitar-research/repos/`
alphaTab · learnhouse · react-guitar · reverse-engineering
(Build references only. NOT dependencies. Note the license blocklist above.)

## VALIDATION
- `Desktop/guitar-interview-script.md` — interview script. **Needs updating for
  Amendment 01 §6** (new kill criterion b = pay for unlimited same-day critique;
  camera question becomes non-blocking probe).
- `Desktop/guitar-reddit-recruitment.md` — recruiting interviewees.

## PROTOTYPES / CONTENT
- `Desktop/GuitarApp_OS.html` — project hub UI.
- `Desktop/guitar-lesson-prototype.html`, `guitar-lesson-01-demo.html`,
  `guitar-lesson-01.html` — playable lesson demos.
- `Desktop/guitar-lesson-01-faster-chord-changes.json` — first lesson JSON fixture
  (the schema fixture for STEP 0).
- `Desktop/guitar app.txt`, `guitar spec prompt.txt` — original raw notes.

## NEXT WORK ITEM
Amendment 02 — fret buzz recording/labeling plan (no public labeled dataset exists;
this is the long-term moat and it is a data-collection problem).
