# GuitarApp Lesson Audio Generation

Generate professional-quality audio narration for all 25 guitar lessons using Google Cloud Text-to-Speech.

## What This Does

Converts the coaching text in your lesson JSON files into natural-sounding audio files:

- **Input**: 25 lesson JSON files (`05-content/guitar-lesson-*.json`)
- **Output**: 205 WAV audio files (`07-app/audio/l##-voice/l##-*.wav`)
- **Voice**: Google Cloud Neural2 (professional, natural, warm instructor tone)
- **Format**: 24kHz WAV (standard, plays on all devices)
- **Cost**: ~$0.50 for all 25 lessons
- **Time**: 5–10 minutes to generate

## Quick Start (3 Steps)

### 1. Verify (No Cost)
```bash
node generate-lesson-audio.mjs --dry-run
```
Shows what would be generated without spending API quota.

**Expected output**:
```
Generated: 205 audio files
Total characters: ~34,000
Estimated cost: $0.52
```

### 2. Setup (15 minutes)
Follow `AUDIO-GENERATION-SETUP.md` to:
- Create a Google Cloud Text-to-Speech service account
- Enable the API
- Set environment credentials
- Install dependencies

### 3. Generate (~$0.50)
```bash
node generate-lesson-audio.mjs
```

Done! Audio files are now in `07-app/audio/l##-voice/`

## Files Provided

| File | Purpose |
|------|---------|
| `generate-lesson-audio.mjs` | Main script to generate audio (production-ready) |
| `audio-utils.mjs` | Inspect, validate, and audit audio files |
| `AUDIO-QUICK-START.md` | 5-minute quick reference |
| `AUDIO-GENERATION-SETUP.md` | Complete setup & troubleshooting guide |
| `DEPLOYMENT-CHECKLIST.md` | Step-by-step deployment runbook |
| `PACKAGE-SCRIPTS-REFERENCE.md` | npm scripts for easy access |
| `README-AUDIO-GENERATION.md` | This file |

## Key Features

✓ **Dry-run mode** — Test without API calls or costs  
✓ **Modular design** — Generate all 25 lessons or just one  
✓ **Cost tracking** — Know exact cost before generating  
✓ **Error recovery** — Continues if individual files fail  
✓ **Text normalization** — Expands chord symbols for TTS  
✓ **Progress tracking** — See each file as it's generated  
✓ **Production-ready** — Proper error handling & logging  

## Output Structure

Each lesson gets a dedicated audio directory:

```
07-app/audio/l01-voice/
├── l01-00-intro.wav           # Lesson intro
├── l01-01-ex1_intro.wav       # Exercise 1 intro
├── l01-01-ex1.wav             # Exercise 1 coaching
├── l01-02-ex2_intro.wav       # Exercise 2 intro
├── l01-02-ex2.wav             # Exercise 2 coaching
├── l01-03-ex3_intro.wav       # Exercise 3 intro
├── l01-03-ex3.wav             # Exercise 3 coaching
├── l01-99-results.wav         # Results summary
└── l01-99-wrap.wav            # Lesson wrap-up

07-app/audio/l02-voice/
└── ... (same structure for lessons 2–25)
```

Each file is:
- **Format**: LINEAR16 WAV
- **Sample rate**: 24,000 Hz (clear, natural)
- **Size**: ~1–2 MB
- **Duration**: 30 seconds to 2 minutes

## Command Reference

### Generation
```bash
# All 25 lessons
node generate-lesson-audio.mjs

# Specific lesson
node generate-lesson-audio.mjs --lesson 5

# Different voice
node generate-lesson-audio.mjs --voice "en-US-Neural2-A"

# Dry run (no cost)
node generate-lesson-audio.mjs --dry-run
```

### Inspection
```bash
# Estimate cost
node audio-utils.mjs estimate

# Audit file status
node audio-utils.mjs audit

# Find missing files
node audio-utils.mjs missing

# Validate JSON
node audio-utils.mjs validate-json

# Check file integrity
node audio-utils.mjs check-files
```

### Using npm Scripts (Optional)
Add scripts to `package.json` (see `PACKAGE-SCRIPTS-REFERENCE.md`):

```bash
npm run audio:dry-run      # Test
npm run audio:estimate     # Check cost
npm run audio:generate     # Create audio
npm run audio:audit        # Verify files
```

## Voice Options

All voices are Google Cloud Neural2 (professional-grade):

| Voice | Tone | Best For |
|-------|------|----------|
| `en-US-Neural2-A` | Warm male | Friendly instructor |
| `en-US-Neural2-C` | Professional, warm | Default choice |
| `en-US-Neural2-E` | Calm, soothing | Relaxed teaching |
| `en-US-Neural2-F` | Bright, engaging | Energetic lessons |

All cost the same: **$15 per 1M characters**

## Cost Breakdown

| Metric | Amount |
|--------|--------|
| Total characters | ~32,000–35,000 |
| Standard voice (Neural2) | $0.48–$0.53 |
| Premium voice | $0.97–$1.05 |
| Time to generate | 5–10 minutes |
| Disk space | 150–200 MB |

One-time cost. Audio files stay once generated.

## Setup Summary

### Prerequisites
- Node.js 16+ (already installed)
- Google Cloud account (free tier works)

### Installation (One-time)
```bash
# 1. Install TTS library
npm install @google-cloud/text-to-speech

# 2. Create GCP service account
# (Follow AUDIO-GENERATION-SETUP.md for detailed steps)

# 3. Download JSON key file
# (Save to ~/.config/gcp/guitarapp-tts-key.json or similar)

# 4. Set environment variable
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/key.json"

# 5. Verify
node generate-lesson-audio.mjs --dry-run
```

See `AUDIO-GENERATION-SETUP.md` for complete step-by-step instructions.

## Common Questions

### Q: How much will this cost?
**A**: ~$0.50 for all 25 lessons with standard Neural2 voice. That's $15 per 1M characters.

### Q: Can I test without spending money?
**A**: Yes! `node generate-lesson-audio.mjs --dry-run` shows everything without API calls.

### Q: What if a lesson generation fails?
**A**: The script continues with the next lesson. You can re-run it to regenerate just the failed lessons.

### Q: Can I use a different voice?
**A**: Yes! `node generate-lesson-audio.mjs --voice "en-US-Neural2-E"` All voices cost the same.

### Q: How long does it take?
**A**: 5–10 minutes total for all 25 lessons. Each lesson takes about 15–30 seconds.

### Q: Can I regenerate specific lessons?
**A**: Yes! `node generate-lesson-audio.mjs --lesson 5` generates only lesson 5.

### Q: Will this overwrite existing audio?
**A**: Yes. New files replace old ones. The existing placeholder files will be replaced with real audio.

### Q: What if Google Cloud credentials aren't set?
**A**: The script will tell you exactly what to do. See `AUDIO-GENERATION-SETUP.md` for troubleshooting.

## Troubleshooting

### "Cannot find module '@google-cloud/text-to-speech'"
```bash
npm install @google-cloud/text-to-speech
```

### "Failed to initialize Google Cloud TTS client"
Check that credentials are set:
```bash
echo $GOOGLE_APPLICATION_CREDENTIALS
# Should show path to your JSON key file
```

### "Permission denied" on API calls
Verify service account role in Google Cloud Console:
1. Go to IAM & Admin > Service Accounts
2. Click the account
3. Ensure role: **Cloud Text-to-Speech API Editor**

### "API not enabled"
Enable it in Google Cloud Console:
1. Search "Cloud Text-to-Speech API"
2. Click "Enable"
3. Wait 1–2 minutes

For more troubleshooting, see `AUDIO-GENERATION-SETUP.md`

## Architecture

### Main Script: `generate-lesson-audio.mjs`

```
1. Parse CLI arguments (--lesson, --voice, --dry-run)
2. Initialize TTS client (skipped in dry-run)
3. For each lesson (1–25):
   a. Load lesson JSON
   b. Extract coaching text segments
   c. Normalize text (expand chord symbols)
   d. Call Google Cloud TTS API
   e. Save WAV file
4. Report statistics & cost
```

**Text extraction order**:
1. `avatar_coaching_copy.intro` → `l##-00-intro.wav`
2. Exercise intros → `l##-0#-ex#_intro.wav`
3. Exercise coaching → `l##-0#-ex#.wav`
4. `avatar_coaching_copy.results` → `l##-99-results.wav`
5. `avatar_coaching_copy.wrap` → `l##-99-wrap.wav`

### Utility Script: `audio-utils.mjs`

Inspect and validate audio generation:
- `estimate` — Calculate total cost
- `audit` — Show file counts/sizes per lesson
- `missing` — Find incomplete lessons
- `validate-json` — Check JSON structure
- `check-files` — Detect placeholder files

## Text Processing

The generator automatically:

1. **Expands chord symbols** (TTS compatibility)
   - "Em" → "E minor"
   - "A7" → "A seven"
   - "Fsus4" → "F suspended four"

2. **Normalizes spacing** for TTS
   - Removes duplicate punctuation
   - Collapses multiple spaces

3. **Preserves** beginner-friendly tone
   - Per VOICE-GUIDE.md
   - Natural, conversational phrasing
   - Physical imagery and encouragement

## Integration with App

The audio files are placed in the structure your app expects:

```
/audio/l##-voice/l##-NN-type.wav
```

Configure your app to load audio from this path:
- Lesson number: `##` (01–25)
- Segment index: `NN` (00–99)
- Segment type: `type` (intro, ex1, results, wrap, etc.)

## Next Steps

1. **Right now**: Run dry-run to see everything
   ```bash
   node generate-lesson-audio.mjs --dry-run
   ```

2. **Next**: Follow setup guide
   - Open `AUDIO-GENERATION-SETUP.md`
   - Take 15 minutes to set up GCP
   - Install dependencies

3. **Test**: Generate one lesson
   ```bash
   node generate-lesson-audio.mjs --lesson 1
   ```

4. **Production**: Generate all 25
   ```bash
   node generate-lesson-audio.mjs
   ```

## Documentation Map

Start here based on your situation:

- **First time?** → `AUDIO-QUICK-START.md` (5-min overview)
- **Need setup help?** → `AUDIO-GENERATION-SETUP.md` (complete guide)
- **Ready to deploy?** → `DEPLOYMENT-CHECKLIST.md` (step-by-step runbook)
- **Want npm scripts?** → `PACKAGE-SCRIPTS-REFERENCE.md` (add to package.json)
- **Deep dive?** → This file (architecture & full reference)

## Support & Troubleshooting

**Quick issues?** Check the FAQ above.

**Setup problems?** See `AUDIO-GENERATION-SETUP.md` troubleshooting section.

**Script issues?** Run with `--dry-run` first to isolate the problem.

**Google Cloud issues?** Refer to [official GCP TTS docs](https://cloud.google.com/text-to-speech/docs).

---

## Summary

You now have production-ready scripts to generate authentic audio for all 25 guitar lessons. The total cost is ~$0.50, takes about 10 minutes, and requires minimal setup.

**Ready to start?**

```bash
node generate-lesson-audio.mjs --dry-run
```

Then open `AUDIO-QUICK-START.md` for the next steps.
