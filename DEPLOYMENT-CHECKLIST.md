# GuitarApp Audio Generation — Deployment Checklist

## What You Have

Production-ready Node.js scripts for generating authentic audio for all 25 guitar lessons using Google Cloud Text-to-Speech.

### Files Created

```
GuitarApp/
├── generate-lesson-audio.mjs          ← Main script (handles all generation)
├── audio-utils.mjs                    ← Utility script (inspect/validate)
├── AUDIO-GENERATION-SETUP.md          ← Detailed setup instructions
├── AUDIO-QUICK-START.md               ← Quick reference guide
└── DEPLOYMENT-CHECKLIST.md            ← This file
```

## Pre-Deployment Checklist

### Phase 1: Setup & Testing (No Cost)

- [ ] Read `AUDIO-QUICK-START.md` for overview
- [ ] Test dry-run mode: `node generate-lesson-audio.mjs --dry-run`
- [ ] Review cost estimate: `node audio-utils.mjs estimate`
- [ ] Check current audio files: `node audio-utils.mjs audit`

**Expected output**:
```
Generated: 205 audio files
Total characters: ~32,000–35,000
Estimated cost: $0.48–$0.53
```

### Phase 2: GCP Setup (15 minutes)

- [ ] Create Google Cloud account (if needed)
- [ ] Create Text-to-Speech service account
- [ ] Enable the Text-to-Speech API
- [ ] Download service account JSON key
- [ ] Save key securely (e.g., `~/.config/gcp/guitarapp-tts-key.json`)
- [ ] Set `GOOGLE_APPLICATION_CREDENTIALS` environment variable

See `AUDIO-GENERATION-SETUP.md` for step-by-step instructions.

### Phase 3: Install Dependencies

```bash
npm install @google-cloud/text-to-speech
```

**Verify installation**:
```bash
node -e "import('@google-cloud/text-to-speech').then(m => console.log('✓ Installed'))"
```

### Phase 4: Test with Real API

- [ ] Test credentials: `node generate-lesson-audio.mjs --lesson 1`
- [ ] Verify audio file generated in `07-app/audio/l01-voice/`
- [ ] Play the audio to verify quality: `file 07-app/audio/l01-voice/l01-00-intro.wav`
- [ ] Check file size is reasonable (~1–2 MB for 30s–2min audio)

**Expected**:
```
✓ 9 WAV files generated for lesson 1
✓ Total size: 5–6 MB
✓ Audio quality: 24kHz, LINEAR16 (WAV format)
✓ Duration per file: 30s–2min
```

### Phase 5: Production Generation

- [ ] Confirm budget (~$0.50–$1.00)
- [ ] Run full generation: `node generate-lesson-audio.mjs`
- [ ] Monitor progress (shows each lesson as it's processed)
- [ ] Verify completion message

**Expected time**: 5–10 minutes

### Phase 6: Verification & Integration

- [ ] Run audit: `node audio-utils.mjs audit`
- [ ] Confirm all 205 files generated
- [ ] Check disk usage (~150–200 MB for 07-app/audio/)
- [ ] Test audio playback in the app
- [ ] Verify file naming: `l##-NN-type.wav`

## Voice Selection

Default voice: `en-US-Neural2-C` (professional, warm instructor)

To use a different voice:
```bash
node generate-lesson-audio.mjs --voice "en-US-Neural2-A"
```

**Available options**:
- `en-US-Neural2-A` — Warm male instructor
- `en-US-Neural2-C` — Professional, warm (default)
- `en-US-Neural2-E` — Calm, soothing
- `en-US-Neural2-F` — Bright, engaging

**Cost is the same for all voices**: $15/M characters

## Troubleshooting

### Issue: "Cannot find module '@google-cloud/text-to-speech'"

**Solution**:
```bash
npm install @google-cloud/text-to-speech
```

### Issue: "Failed to initialize Google Cloud TTS client"

**Solution**:
1. Check credentials: `echo $GOOGLE_APPLICATION_CREDENTIALS`
2. Verify file exists: `cat $GOOGLE_APPLICATION_CREDENTIALS | head -5`
3. Wait 1–2 minutes after API enablement

### Issue: "API not enabled"

**Solution**:
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Search "Text-to-Speech API"
3. Click "Enable"
4. Wait 1–2 minutes

### Issue: "Permission denied"

**Solution**:
1. Verify service account has role: **Cloud Text-to-Speech API Editor**
2. Check in IAM & Admin > Service Accounts
3. Re-download key if role was just added

### Issue: Audio file won't play

**Solution**:
```bash
# Check format
file 07-app/audio/l01-voice/l01-00-intro.wav

# Should show: RIFF (little-endian) data, WAVE audio, ..., 24000 Hz
```

See `AUDIO-GENERATION-SETUP.md` for detailed troubleshooting.

## Cost Breakdown

| Item | Amount |
|------|--------|
| Characters per lesson | 800–2,600 |
| Total characters (25 lessons) | ~32,000–35,000 |
| Price per 1M characters | $15.00 |
| **Total estimated cost** | **$0.48–$0.53** |

**Billing**:
- Google Cloud charges by character count
- Visible in [Billing > Reports](https://console.cloud.google.com/billing)
- Costs appear within 1–2 hours

## Post-Deployment

### Maintenance

- **Re-generate a lesson**: `node generate-lesson-audio.mjs --lesson 5`
- **Change voice**: `node generate-lesson-audio.mjs --voice "en-US-Neural2-E"`
- **Audit files**: `node audio-utils.mjs audit`

### Monitoring

Check Google Cloud Console for actual spend:
1. Go to Billing > Reports
2. Filter by "Cloud Text-to-Speech API"
3. View daily/monthly costs

### Future Updates

If lessons are updated:
1. Edit the JSON file in `05-content/`
2. Run generation for that lesson: `node generate-lesson-audio.mjs --lesson N`
3. New audio files overwrite old ones automatically

## Integration with App

The audio files are placed in the expected structure:

```
07-app/audio/
├── l01-voice/
│   ├── l01-00-intro.wav
│   ├── l01-01-ex1_intro.wav
│   ├── l01-01-ex1.wav
│   ├── l01-02-ex2_intro.wav
│   ├── l01-02-ex2.wav
│   ├── l01-03-ex3_intro.wav
│   ├── l01-03-ex3.wav
│   ├── l01-99-results.wav
│   └── l01-99-wrap.wav
├── l02-voice/
│   └── ... (same structure)
```

The app should be configured to load audio from:
```
/audio/l##-voice/l##-NN-type.wav
```

File naming pattern: `l##-NN-type.wav`
- `##` = lesson number (01–25)
- `NN` = sort index (00=intro, 01–09=exercises, 99=results/wrap)
- `type` = segment type (intro, ex1, ex1_intro, results, wrap)

## Success Criteria

- [ ] All 205 audio files generated
- [ ] File sizes 1–2 MB each (not placeholder sizes)
- [ ] Total disk usage 150–200 MB
- [ ] All files in correct directories
- [ ] Audio plays without errors
- [ ] Cost ~$0.50

## Quick Command Reference

```bash
# Dry run (no cost)
node generate-lesson-audio.mjs --dry-run

# Estimate cost
node audio-utils.mjs estimate

# Audit current files
node audio-utils.mjs audit

# Check for missing files
node audio-utils.mjs missing

# Generate specific lesson
node generate-lesson-audio.mjs --lesson 1

# Generate all lessons
node generate-lesson-audio.mjs

# Use different voice
node generate-lesson-audio.mjs --voice "en-US-Neural2-A"

# Validate JSON files
node audio-utils.mjs validate-json

# Check file integrity
node audio-utils.mjs check-files
```

## Documentation

- **Quick Start**: `AUDIO-QUICK-START.md` (5-min read)
- **Detailed Setup**: `AUDIO-GENERATION-SETUP.md` (complete reference)
- **This file**: Deployment checklist & runbook

---

## Status

- [ ] **Scripts created** ✓
- [ ] **Tested in dry-run** ✓
- [ ] **GCP account setup** — Next step
- [ ] **Dependencies installed** — Next step
- [ ] **Production generation** — Final step

**Ready to start?**

```bash
node generate-lesson-audio.mjs --dry-run
```

Then follow `AUDIO-QUICK-START.md`.
