# GuitarApp Audio Generation — Quick Start

## TL;DR

```bash
# 1. Test without spending money
node generate-lesson-audio.mjs --dry-run

# 2. Check what needs to be generated
node audio-utils.mjs missing

# 3. Install Google Cloud TTS
npm install @google-cloud/text-to-speech

# 4. Set up credentials (see detailed setup guide)
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/key.json"

# 5. Generate all 25 lessons
node generate-lesson-audio.mjs

# 6. Monitor cost (about $0.75–$1.05 total)
node audio-utils.mjs estimate
```

## Files You Have

| File | Purpose |
|------|---------|
| `generate-lesson-audio.mjs` | Main script to generate audio |
| `audio-utils.mjs` | Inspect & audit audio files |
| `AUDIO-GENERATION-SETUP.md` | Detailed setup & troubleshooting |
| `AUDIO-QUICK-START.md` | This file |

## What Gets Generated

For each lesson (L01–L25):

```
07-app/audio/l##-voice/
├── l##-00-intro.wav          (intro coaching)
├── l##-01-ex1_intro.wav      (exercise 1 intro)
├── l##-01-ex1.wav            (exercise 1 coaching)
├── l##-02-ex2_intro.wav      (exercise 2 intro)
├── l##-02-ex2.wav            (exercise 2 coaching)
├── l##-03-ex3_intro.wav      (exercise 3 intro)
├── l##-03-ex3.wav            (exercise 3 coaching)
├── l##-99-results.wav        (results summary)
└── l##-99-wrap.wav           (lesson wrap-up)
```

Each WAV file is:
- **Format**: LINEAR16 (standard WAV audio)
- **Sample Rate**: 24kHz (clear, natural-sounding)
- **Voice**: Google Cloud Neural2 (professional, warm instructor)
- **Size**: ~1–2 MB per file (9–16 MB per lesson)
- **Duration**: 30s–2min per segment

## One-Minute Setup

### Prerequisites
- Node.js 16+ installed
- Google Cloud account (free tier works)

### Steps

1. **Enable the API**:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Search "Text-to-Speech API" → Click "Enable"

2. **Create a service account**:
   - IAM & Admin → Service Accounts → Create Service Account
   - Name: `guitarapp-tts`
   - Grant role: **Cloud Text-to-Speech API Editor**
   - Create key → JSON → Save locally

3. **Set environment**:
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/key.json"
   npm install @google-cloud/text-to-speech
   ```

4. **Test it**:
   ```bash
   node generate-lesson-audio.mjs --dry-run
   ```

5. **Generate audio**:
   ```bash
   node generate-lesson-audio.mjs
   ```

See `AUDIO-GENERATION-SETUP.md` for detailed instructions.

## Common Commands

### Dry Run (No Cost, No Files)
```bash
node generate-lesson-audio.mjs --dry-run
```
Shows what would be generated. **Safe to run anytime.**

### Check Status
```bash
node audio-utils.mjs missing
```
Lists which lessons are complete/incomplete.

### Estimate Cost
```bash
node audio-utils.mjs estimate
```
Calculates total characters and cost (~$0.75–$1.05 for all 25 lessons).

### Generate One Lesson
```bash
node generate-lesson-audio.mjs --lesson 1
```

### Generate with Different Voice
```bash
node generate-lesson-audio.mjs --voice "en-US-Neural2-A"
```

### Audit All Files
```bash
node audio-utils.mjs audit
```
Shows file counts and sizes per lesson.

## Features

✓ **Dry-run mode** — Test without API calls  
✓ **Progress tracking** — See what's being generated  
✓ **Error recovery** — Continues on individual failures  
✓ **Text normalization** — Expands "Em" → "E minor" for TTS  
✓ **Cost estimation** — Know the bill before running  
✓ **Modular architecture** — Easy to extend  
✓ **Production-ready** — Proper error handling & logging  

## Cost

| Metric | Estimate |
|--------|----------|
| Total characters | ~50,000–70,000 |
| Cost (standard voice) | **$0.75–$1.05** |
| Time to generate | 5–10 minutes |
| Disk usage | ~150–200 MB |

Breakdown by lesson: $0.03–$0.04 per lesson

Google Cloud pricing:
- **Standard Neural2 voice**: $15 per 1M characters
- **Premium voice**: $30 per 1M characters

## Troubleshooting

### Error: "Failed to initialize Google Cloud TTS client"
→ Check credentials are set: `echo $GOOGLE_APPLICATION_CREDENTIALS`

### Error: "Permission denied" on API calls
→ Verify service account role in GCP Console

### Error: "API not enabled"
→ Enable it in Google Cloud Console (takes 1–2 mins)

### Files won't play
→ Check format: `file 07-app/audio/l01-voice/l01-00-intro.wav`
→ Should show: `WAVE audio, ..., 24000 Hz`

See `AUDIO-GENERATION-SETUP.md` for more troubleshooting.

## Architecture

### generate-lesson-audio.mjs (Main Script)

```
1. Parse CLI arguments (--dry-run, --lesson, --voice)
2. Initialize Google Cloud TTS client
3. For each lesson:
   - Load lesson JSON
   - Extract coaching text segments
   - Normalize text (chord symbols, etc.)
   - Call TTS API (or mock in dry-run)
   - Save WAV file
4. Report stats & cost
```

**Text Extraction Order**:
- `avatar_coaching_copy.intro` → `l##-00-intro.wav`
- `avatar_coaching_copy.ex#_intro` → `l##-0#-ex#_intro.wav`
- `exercises[#].coaching` → `l##-0#-ex#.wav`
- `avatar_coaching_copy.results` → `l##-99-results.wav`
- `avatar_coaching_copy.wrap` → `l##-99-wrap.wav`

### audio-utils.mjs (Inspection Tool)

```
Commands:
  audit          Show file counts/sizes
  estimate       Calculate cost
  missing        Find incomplete lessons
  validate-json  Check JSON integrity
  check-files    Detect placeholder files
```

## Next Steps

1. **Immediate** (no cost):
   ```bash
   node generate-lesson-audio.mjs --dry-run
   node audio-utils.mjs estimate
   ```

2. **Setup** (one-time):
   - Follow AUDIO-GENERATION-SETUP.md
   - `npm install @google-cloud/text-to-speech`
   - Set `GOOGLE_APPLICATION_CREDENTIALS`

3. **Test** (minimal cost ~$0.03):
   ```bash
   node generate-lesson-audio.mjs --lesson 1
   ```

4. **Production** (~$1 total):
   ```bash
   node generate-lesson-audio.mjs
   ```

## Voice Options

All voices are Google Cloud Neural2 (professional, natural-sounding):

| Voice | Tone | Use Case |
|-------|------|----------|
| `en-US-Neural2-A` | Warm male | Guitar instructor vibe |
| `en-US-Neural2-C` | Professional, warm (default) | Standard instructor |
| `en-US-Neural2-E` | Calm, soothing | Relaxed learning |
| `en-US-Neural2-F` | Bright, engaging | Energetic teaching |

Test with:
```bash
node generate-lesson-audio.mjs --dry-run --voice "en-US-Neural2-E"
```

## Integration Notes

- **File naming** matches expected app structure (`l##-voice/` directories)
- **Audio format** is WAV 24kHz (app-compatible)
- **Character counting** includes normalization (accurate cost estimates)
- **Error handling** is granular (one bad file doesn't stop the batch)

## Support

See `AUDIO-GENERATION-SETUP.md` for:
- Detailed GCP account setup
- Step-by-step troubleshooting
- API enablement instructions
- Cost monitoring guidance

---

**Ready to start?** Run this:
```bash
node generate-lesson-audio.mjs --dry-run
```

Then check `AUDIO-GENERATION-SETUP.md` for full setup.
