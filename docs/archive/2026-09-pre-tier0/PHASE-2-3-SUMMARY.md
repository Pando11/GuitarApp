# Phase 2 & 3 Summary — Audio Integration Ready

**Date**: 2026-09-03  
**Status**: ✅ Complete

## What Was Accomplished

### Phase 2: Lesson Authoring ✅
- **Status**: COMPLETE (was already done!)
- All 25 lessons authored and in place at `07-app/content/lessons/`
- Each lesson has:
  - Lesson metadata (title, objectives, duration, prerequisites)
  - Exercise definitions (coaching copy, practice interactions)
  - Avatar coaching copy (voice narration text)
  - Verified chord data and QA status

### Phase 3: Audio Structure Ready ✅
- **Status**: COMPLETE - Structure created, placeholder audio in place
- Created directory hierarchy: `07-app/audio/l01-voice/` through `l25-voice/`
- Generated 140 WAV placeholder files (one per voice line)
- Each lesson has:
  - `l##-00-intro.wav` — lesson introduction
  - `l##-02-exN.wav` — exercise coaching lines
  - `l##-99-results.wav` — practice feedback
  - `l##-99-wrap.wav` — lesson conclusion
  - `l##-full.wav` — future full-lesson audio (concatenated)

**Total Audio Files**: 140 placeholder WAVs across 25 lessons

## What "Placeholder Audio" Means

The WAV files are **valid but silent** — they have the correct structure so the app can:
- Load and play them without errors
- Display lesson content
- Test the UI flow and navigation
- Verify audio integration works

**They do NOT have real teacher voice narration yet.**

## Next Steps: Replace Placeholder Audio with Real TTS

To add real teacher voice, choose one of these options:

### Option 1: Kokoro TTS (Local, Free, but needs ONNX Runtime fix)
- Python-based TTS running on your CPU
- **Blocker**: ONNX Runtime DLL initialization issue on this machine
- **Fix**: Install Visual C++ runtime or update system dependencies
- **When working**: Run script like `generate-audio-simple.py` to replace WAVs

### Option 2: Cloud TTS API (Recommended for quickest path)
1. Sign up for free Google Cloud Text-to-Speech tier
2. Use API key to generate audio via script
3. Replace placeholder WAVs with real audio

### Option 3: Chatterbox on GPU (Planned for production)
- Requires GPU machine (not this PC)
- Produces warmest, most natural voice
- Used in `tools/voice-cache/generate.py` (production pipeline)

### Option 4: Manual Audio (Slowest but most control)
- Record teacher voice yourself
- Convert to WAV and place in each lesson folder
- Full creative control over tone and pacing

---

## How the App Uses Audio

The app looks for audio files in this structure:
```
07-app/audio/
├── l01-voice/
│   ├── l01-00-intro.wav
│   ├── l01-02-ex1.wav
│   ├── l01-03-ex2.wav
│   ├── l01-04-ex3.wav
│   ├── l01-99-results.wav
│   ├── l01-99-wrap.wav
│   └── l01-full.wav (concat of above)
├── l02-voice/
│   └── ... (same pattern)
└── l25-voice/
    └── ... (same pattern)
```

When the app loads a lesson, it plays audio files in sequence:
1. **Intro**: Sets the lesson tone and explains what's coming
2. **Exercise audio**: One per exercise (coaching on technique)
3. **Results**: Feedback on how the student did
4. **Wrap**: Encouragement to move forward

---

## Testing Phase 4: See It Working

The app shell is now ready to test:

```bash
# Start a local web server
cd 07-app
npx http-server

# Open http://localhost:8080 on your phone or browser
# Click "Begin Lesson 1"
# You'll see the full app flow with placeholder audio
```

### What Will Work
- ✅ Lesson navigation
- ✅ Lesson content display
- ✅ Chord diagrams
- ✅ Practice interactions
- ✅ Audio player (plays silent audio to verify structure)

### What Won't Work Yet
- ❌ Real teacher voice narration (audio is silent)
- ❌ Audio timing/pacing (not synced to your specific voice)

---

## Recommended Path Forward

**For the next test with friends:**

1. **Keep placeholder audio for now** — the silent audio doesn't affect testing the lesson flow
2. **Run the app on your phone** — verify navigation, chord diagrams, practice interactions work
3. **After test feedback** — if voice matters for the test, invest in real TTS (Option 2: Cloud API is fastest)
4. **Plan Phase 4** — testing, iteration, then extend to more lessons

**Cost/Benefit of adding real audio now:**
- Cost: 2-4 hours to set up cloud TTS API + run generator
- Benefit: Better test fidelity, teacher voice sets the tone
- Alternative: Skip for first test, add after feedback

---

## Files Created This Session

- `generate-audio-wavmaker.mjs` — Node.js script to create audio directory structure
- `generate-audio-simple.py` — Python script (backup, has ONNX Runtime issue)
- `generate-all-audio.py` — Python script (backup, has ONNX Runtime issue)
- `.venv-kokoro/` — Python virtual environment for Kokoro TTS (not needed for placeholder)
- `PHASE-2-3-SUMMARY.md` — This document

---

## Checklist for Phase 4 (App Testing)

### Before Testing
- [ ] Run app on localhost (see "Testing Phase 4" section above)
- [ ] Verify Lesson 1–5 load without errors
- [ ] Check that chord diagrams render
- [ ] Confirm practice interactions work
- [ ] Test on actual phone via local network

### During Testing
- [ ] Note any UI issues or confusing flows
- [ ] Check if lesson pacing feels right
- [ ] Ask test participants if they can follow without audio
- [ ] Record what they liked and what confused them

### After Testing
- [ ] Decide: Is silent audio acceptable for test, or add real TTS?
- [ ] If adding audio: Choose Option 1 (fix ONNX), 2 (cloud API), 3 (Chatterbox), or 4 (manual)
- [ ] Run generator to replace placeholder WAVs
- [ ] Retest with friends

---

## Questions?

- **"How do I test the app on my phone?"** → See "Testing Phase 4" section
- **"Can I add real audio now?"** → Yes, use Option 2 (cloud API) for fastest setup
- **"Why is audio silent?"** → ONNX Runtime had environment issues; placeholder lets you test app flow
- **"When should I record real audio?"** → After Phase 4 test feedback, if voice quality matters

---

*Next handoff: Phase 4 app testing and decision on real audio before Phase 5 (user testing with friends)*
