# SESSION LOG — 2026-08-04 — Animated "movie-like" lesson direction

**Owner:** Heidi · **Project:** GuitarApp (`Desktop/GuitarApp/`) · **Mode:** full autonomy, no sign-off

## WHAT WE SET OUT TO DO
Research open-source GitHub animation repos, then decide how to make guitar lessons feel
"almost like a movie that teaches the class" — more than one static avatar — and build it.

## KEY DECISIONS (the trail)
1. **3-way agent debate** on animation approach:
   - Camp 1 Cinematic/code-driven (Motion Canvas → MP4)
   - Camp 2 Real-time/Rive-first
   - Camp 3 AI-native / outside-the-box ← **OWNER PICKED THIS**
2. **Rules 10 & 11 removed from AGENTS.md** (were: "never animate hands", "never use AI video").
   Owner said they aren't hers. Replaced by a conditional: fretboard stays code-driven/correct
   forever; a hand may be animated ONLY if rigged + IK-constrained + QA'd, never AI-generated.
3. **Hard constraint added: open-source / NO membership fees.** Rive DROPPED from stack
   ($9/mo Cadet export fee). Stack = GSAP (free, Webflow 2025) + Lottie (MIT) + SwiftUI/Canvas
   + FLUX.1[schnell]/Qwen-Image (Apache-2.0) for AI frames. Midjourney OUT (paid).
4. **Recorded in `02-spec/guitar-app-spec-AMENDMENT-03.md`.**

## WHAT WE BUILT (proof, not just talk)
- `06-prototypes/lesson-scene-movie-v3.html` — single-scene movie proof (C chord, AI frame wired in).
- `06-prototypes/lesson-director-v4.html` — the "Lesson Director" skeleton: lesson JSON →
  scene manifest → deterministic render. 3 lessons (C/G/Am) recompose from one asset library.
  Proves the AI-native pipeline SCALES (no hand-built scenes). LLM swap-in point marked in code.
- `06-prototypes/assets/*.png` — 3 REAL AI-generated style frames (golden_hour / midnight /
  greenroom), saved locally, offline.
- `06-prototypes/lesson-director-demo.mp4` + `.gif` — 11s capture of the demo playing.
- `06-prototypes/open-demo.bat` — one-click launcher.
- `06-prototypes/README.md` — index of what to open.
- `03-research/animation-voice/animation-repos-and-debate.md` + `debate/*.md` — repo research
  (live GitHub star counts) + all 3 agent position papers.

## HOW TO VIEW
Double-click `06-prototypes/open-demo.bat` (or the HTML). Pick a lesson, hit "Direct this lesson".
Live version is interactive (dropdown, TTS, Frame AI/sim toggle); the GIF/MP4 are rendered captures.

## OPEN ITEMS / NEXT
- Capture G and Am lessons as separate clips (see director recombining per lesson).
- Add a 2nd character ("more than one person" — owner's original ask).
- Decide teacher character art: AI-generated Apache-2.0 vs freelance illustrator.
- Production: swap AI frames to self-hosted FLUX.1[schnell]/Qwen-Image for $0-at-scale
  (frames currently from FAL.ai hosted backend — free to run, not self-hosted).
- Biggest risk (from debate): pipeline sprawl — mitigated by building lesson #1 end-to-end first.

## FILE MAP (quick)
- Decision: `02-spec/guitar-app-spec-AMENDMENT-03.md`
- Rules/stack: `AGENTS.md` (Rules 10/11 gone; Stack = open-source/no-fee)
- Research: `03-research/animation-voice/animation-repos-and-debate.md` + `debate/`
- Demo: `06-prototypes/lesson-director-v4.html` (+ `open-demo.bat`, `README.md`, `assets/`)
- Entry point: `01-START-HERE/README.md` (updated §3/§4 to point here)
