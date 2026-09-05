# Package Scripts Reference

Add these to your `package.json` for easy access to audio generation commands:

```json
{
  "name": "guitarapp-gates",
  "private": true,
  "scripts": {
    "test:app-smoke": "node 07-app/test/app-smoke.mjs",
    "test:fidelity": "node 07-app/test/fidelity.mjs",
    
    "audio:dry-run": "node generate-lesson-audio.mjs --dry-run",
    "audio:estimate": "node audio-utils.mjs estimate",
    "audio:audit": "node audio-utils.mjs audit",
    "audio:missing": "node audio-utils.mjs missing",
    "audio:validate": "node audio-utils.mjs validate-json",
    "audio:check": "node audio-utils.mjs check-files",
    "audio:generate": "node generate-lesson-audio.mjs",
    "audio:generate:l1": "node generate-lesson-audio.mjs --lesson 1",
    "audio:generate:voice-a": "node generate-lesson-audio.mjs --voice en-US-Neural2-A",
    "audio:generate:voice-e": "node generate-lesson-audio.mjs --voice en-US-Neural2-E"
  },
  "devDependencies": {
    "jsdom": "27.0.0",
    "@google-cloud/text-to-speech": "^5.1.0"
  }
}
```

## Usage

Once added to `package.json`, you can run these commands:

```bash
# Development & Testing
npm run audio:dry-run       # Test without spending money
npm run audio:estimate      # Check cost
npm run audio:audit         # See file status
npm run audio:missing       # Find incomplete lessons
npm run audio:validate      # Verify JSON files
npm run audio:check         # Check file integrity

# Generation
npm run audio:generate      # Generate all 25 lessons (~$0.50)
npm run audio:generate:l1   # Generate lesson 1 only
npm run audio:generate:voice-a   # Generate with different voice
npm run audio:generate:voice-e   # Generate with calm voice
```

## Installation

1. Copy the scripts section into your `package.json`
2. Install the dependency:
   ```bash
   npm install @google-cloud/text-to-speech
   ```
3. Start using commands:
   ```bash
   npm run audio:dry-run
   ```

## Script Descriptions

| Command | Purpose | Cost |
|---------|---------|------|
| `audio:dry-run` | Test without API calls | $0.00 |
| `audio:estimate` | Calculate total cost | $0.00 |
| `audio:audit` | List file counts/sizes | $0.00 |
| `audio:missing` | Find incomplete lessons | $0.00 |
| `audio:validate` | Check JSON structure | $0.00 |
| `audio:check` | Verify file integrity | $0.00 |
| `audio:generate` | Generate all 25 lessons | ~$0.50 |
| `audio:generate:l1` | Generate lesson 1 only | ~$0.02 |
| `audio:generate:voice-a` | Use different voice | ~$0.50 |
| `audio:generate:voice-e` | Calm instructor voice | ~$0.50 |

## Workflow

### Initial Setup
```bash
npm run audio:dry-run        # Verify scripts work
npm run audio:estimate       # Check cost
npm run audio:audit          # See current status
```

### First Generation
```bash
npm run audio:generate:l1    # Test with lesson 1
# Listen to audio, verify quality
npm run audio:audit          # Check what was created
```

### Production
```bash
npm run audio:generate       # Generate all 25 lessons
npm run audio:audit          # Verify completion
```

### Maintenance
```bash
npm run audio:missing        # See incomplete lessons
npm run audio:generate       # Regenerate missing files
npm run audio:check          # Verify file integrity
```

## Environment Setup

Before using these commands, set up Google Cloud:

```bash
# 1. Save your service account key
# (Get from Google Cloud Console → Service Accounts)

# 2. Set environment variable
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/key.json"

# On Windows (PowerShell)
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\key.json"

# 3. Verify
npm run audio:dry-run
```

See `AUDIO-GENERATION-SETUP.md` for detailed instructions.

## Custom Voice Selection

To use a different voice, modify the `audio:generate` script:

```json
"audio:generate": "node generate-lesson-audio.mjs --voice en-US-Neural2-E",
```

Available voices:
- `en-US-Neural2-A` — Warm male
- `en-US-Neural2-C` — Professional, warm (default)
- `en-US-Neural2-E` — Calm, soothing
- `en-US-Neural2-F` — Bright, engaging

All voices cost the same: $15 per 1M characters

## Troubleshooting

### "npm ERR! missing script: audio:dry-run"

→ Make sure you've saved the changes to `package.json` and run `npm install`

### "Cannot find module '@google-cloud/text-to-speech'"

→ Install it: `npm install @google-cloud/text-to-speech`

### "GOOGLE_APPLICATION_CREDENTIALS not set"

→ Set the environment variable:
```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/key.json"
```

See `AUDIO-GENERATION-SETUP.md` for more help.
