# GuitarApp Audio Generation Setup Guide

This guide walks you through setting up and running the lesson audio generator using Google Cloud Text-to-Speech.

## Quick Start (Dry Run)

Test the script without spending API quota:

```bash
node generate-lesson-audio.mjs --dry-run
```

This will:
- Read all 25 lesson JSON files
- Extract coaching text
- Show what audio files would be generated
- Calculate estimated TTS cost
- **NOT** call the Google Cloud API or write any files

## Prerequisites

### 1. Install Dependencies

```bash
npm install @google-cloud/text-to-speech
```

### 2. Set Up Google Cloud Authentication

#### Option A: Using Service Account JSON Key (Recommended)

1. **Create a GCP Service Account**:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Navigate to: Service Accounts (IAM & Admin > Service Accounts)
   - Click "Create Service Account"
   - Name: `guitarapp-tts`
   - Grant role: **Cloud Text-to-Speech API Editor**

2. **Create and Download Key**:
   - Click on the service account name
   - Go to "Keys" tab
   - Click "Create new key" → JSON
   - Save as `~/.config/gcp/guitarapp-tts-key.json` (or any secure location)

3. **Set Environment Variable**:
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/guitarapp-tts-key.json"
   ```

   On Windows (PowerShell):
   ```powershell
   $env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\guitarapp-tts-key.json"
   ```

#### Option B: Using Application Default Credentials

If you have the `gcloud` CLI installed and authenticated:

```bash
gcloud auth application-default login
```

### 3. Enable the Text-to-Speech API

In the Google Cloud Console:
1. Go to APIs & Services > Enabled APIs & Services
2. Search for "Cloud Text-to-Speech API"
3. Click "Enable"

## Usage

### Generate All Lessons (Production)

```bash
node generate-lesson-audio.mjs
```

This will:
- Process all 25 lessons
- Call Google Cloud TTS API for each coaching segment
- Save WAV files to `07-app/audio/l##-voice/` directories
- Display progress and cost estimates
- Exit with code 1 if any failures occur

### Generate Specific Lesson

```bash
node generate-lesson-audio.mjs --lesson 5
```

### Change Voice

Use any Google Cloud Neural2 voice:

```bash
node generate-lesson-audio.mjs --voice "en-US-Neural2-A"
```

**Available voices** (see Google Cloud docs):
- `en-US-Neural2-A` — Warm, professional male
- `en-US-Neural2-C` — Professional, warm instructor (default)
- `en-US-Neural2-E` — Calm, teacher-like
- `en-US-Neural2-F` — Bright, engaging

### Combine Options

```bash
node generate-lesson-audio.mjs --dry-run --lesson 3 --voice "en-US-Neural2-E"
```

## Output Structure

Each lesson gets a directory: `07-app/audio/l##-voice/`

Example (Lesson 01):
```
07-app/audio/l01-voice/
├── l01-00-intro.wav           # intro
├── l01-01-ex1_intro.wav       # exercise 1 intro
├── l01-01-ex1.wav             # exercise 1 coaching
├── l01-02-ex2_intro.wav       # exercise 2 intro
├── l01-02-ex2.wav             # exercise 2 coaching
├── l01-03-ex3_intro.wav       # exercise 3 intro
├── l01-03-ex3.wav             # exercise 3 coaching
├── l01-99-results.wav         # results
└── l01-99-wrap.wav            # wrap-up
```

File naming: `l##-NN-type.wav`
- `##` = lesson number (01-25)
- `NN` = sort index (00=intro, 01-09=exercises, 99=results/wrap)
- `type` = segment type (intro, ex1, results, wrap)

## Monitoring & Cost

### Estimated Cost Calculation

Google Cloud TTS pricing:
- **Standard voice**: $15.00 per 1M characters
- **Premium/Neural voice**: $30.00 per 1M characters

The script displays estimated cost based on character count.

### Per-Lesson Character Count

Run in dry-run mode to see exact character counts per lesson:

```bash
node generate-lesson-audio.mjs --dry-run
```

### Checking GCP Costs

Monitor actual spend in [Google Cloud Console](https://console.cloud.google.com):
1. Go to Billing > Reports
2. Filter by "Cloud Text-to-Speech API"
3. View usage over time

## Troubleshooting

### Error: "Failed to initialize Google Cloud TTS client"

**Solution**: Verify credentials are set:
```bash
echo $GOOGLE_APPLICATION_CREDENTIALS
```

If empty, set it:
```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/key.json"
```

### Error: "Permission denied" on API calls

**Solution**: Verify the service account has the correct role:
1. Go to Service Accounts in Google Cloud Console
2. Click the account
3. Go to "Roles" tab
4. Make sure "Cloud Text-to-Speech API Editor" is assigned

### Error: "API not enabled"

**Solution**: Enable the Text-to-Speech API:
1. Go to APIs & Services > Enabled APIs & Services
2. Search "Cloud Text-to-Speech API"
3. Click "Enable"

Wait 1-2 minutes for it to activate.

### Files Generated But Won't Play

**Solution**: Verify the audio format:
```bash
file 07-app/audio/l01-voice/l01-00-intro.wav
```

Should show: `RIFF (little-endian) data, WAVE audio, ..., 24000 Hz`

If not, the Google Cloud API response may have changed. Check the raw response in logs.

## Voice Guide & Text Normalization

The generator automatically:
- Expands chord symbols ("Em" → "E minor")
- Normalizes punctuation and spacing
- Handles beginner-friendly phrasing per VOICE-GUIDE.md

**Note**: Chord symbols in *spoken* text are expanded, but on-screen captions
may still show symbols (which is correct visually).

## Advanced: Custom Voice Config

Edit the `CONFIG.tts` section in `generate-lesson-audio.mjs`:

```javascript
const CONFIG = {
  tts: {
    voice: {
      languageCode: 'en-US',
      name: 'en-US-Neural2-C', // Change here
    },
    audioConfig: {
      audioEncoding: 'LINEAR16',
      sampleRateHertz: 24000,
      speakingRate: 0.95,  // Slower = easier to follow
      pitch: 0.0,
    },
  },
  // ...
};
```

## Next Steps

1. Run dry-run to verify setup:
   ```bash
   node generate-lesson-audio.mjs --dry-run
   ```

2. Generate lesson 1 to test:
   ```bash
   node generate-lesson-audio.mjs --lesson 1
   ```

3. Verify audio file plays:
   ```bash
   # On macOS
   afplay 07-app/audio/l01-voice/l01-00-intro.wav

   # On Linux
   aplay 07-app/audio/l01-voice/l01-00-intro.wav

   # On Windows
   powershell -c "Invoke-Item 07-app\audio\l01-voice\l01-00-intro.wav"
   ```

4. Generate all 25 lessons:
   ```bash
   node generate-lesson-audio.mjs
   ```

## Support

For issues with:
- **Google Cloud setup**: See [GCP Text-to-Speech documentation](https://cloud.google.com/text-to-speech/docs)
- **Script bugs**: Check the error message and logs
- **Voice quality**: Test different voices with `--voice` flag

---

**Cost Estimate**: ~50,000–70,000 characters total across all 25 lessons = $0.75–$1.05 USD
(Using standard Neural2 voices at $15/M characters)
