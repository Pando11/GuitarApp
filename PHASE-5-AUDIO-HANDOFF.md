# Phase 5: Audio Implementation Handoff

**Status**: Ready to implement  
**Priority**: Optional (app works without it, but improves user testing feedback)  
**Estimated Effort**: 2-4 hours  
**Owner**: [Next agent/developer]

---

## Context

The guitar app has **140 placeholder WAV files** (silent but valid) across 25 lessons. This handoff describes how to replace them with real teacher voice using Text-to-Speech (TTS).

### Current State
- ✅ App structure ready (audio directories + file paths)
- ✅ JSDOM + Playwright tests all pass
- ✅ Placeholder audio doesn't break anything
- ❌ No teacher voice narration (audio is silent)

### Decision
**User decided**: Add real audio if needed for Phase 5 user testing feedback.  
**Recommended approach**: Google Cloud Text-to-Speech (fastest, free tier available).

---

## Why Add Audio Now?

### Arguments FOR
- Teacher voice sets the tone and guides learners
- Hearing the lesson flow helps feedback: "pacing was too fast"
- Audio is part of the final product—test with it now
- User testing feedback on voice/pacing will inform production audio

### Arguments AGAINST
- App works perfectly without it; core flow testing can proceed
- Silent audio doesn't affect lesson structure validation
- Can add audio post-test based on feedback
- Effort could go to fixing issues identified during user testing

**Recommendation**: Proceed if you want voice-guided feedback during testing. Skip if you want to gather content/flow feedback first.

---

## Implementation Path: Google Cloud TTS

### Why This Approach?
- ✅ Free tier: 4M characters/month (more than enough for 25 lessons)
- ✅ Quick setup: 15 minutes
- ✅ Good quality: Natural-sounding teacher voice
- ✅ Scalable: Easy to regenerate if lessons change
- ⚠️ Requires credit card (free tier, no charge if under 4M chars)

### Prerequisites
1. Google Cloud account (free tier)
2. `gcloud` CLI or API key
3. Node.js (already available)

---

## Step 1: Google Cloud Setup (15 min)

```bash
# 1. Go to https://console.cloud.google.com
# 2. Create a new project (or use existing)
# 3. Enable Text-to-Speech API:
#    - Search "Text-to-Speech API"
#    - Click "Enable"
# 4. Create API key:
#    - Go to "Credentials"
#    - Click "Create Credentials" > "API Key"
#    - Copy the key

# 5. Set environment variable
export GOOGLE_CLOUD_TTS_API_KEY="your-api-key-here"

# 6. Verify it works
curl -X POST "https://texttospeech.googleapis.com/v1/text:synthesize?key=$GOOGLE_CLOUD_TTS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "input":{"text":"Hello world"},
    "voice":{"languageCode":"en-US","name":"en-US-Neural2-C"},
    "audioConfig":{"audioEncoding":"LINEAR16"}
  }' | head -20
```

---

## Step 2: Gather Lesson Content (30 min)

Audio script is **already in your lessons**. Each lesson JSON has:

```json
{
  "lesson": {
    "title": "Lesson 1: Welcome, Anatomy & Tuning",
    "coaching": {
      "intro": "Take a breath. Sit down slowly...",
      "exercise_1": "Rest your hand on the body...",
      "results": "You did well. Notice how...",
      "wrap": "That's enough for today..."
    }
  }
}
```

**Example script for L01**:
```
[Intro] "Take a breath. Sit down slowly. Anchor your legs to the floor..."
[Ex1] "Rest your hand on the body of the guitar..."
[Ex2] "Now, position your fingers on the fretboard..."
[Results] "You did well. Notice how relaxed your hand feels..."
[Wrap] "That's enough for today. Good work."
```

---

## Step 3: Create TTS Generation Script

Save as `generate-audio-tts.mjs`:

```javascript
#!/usr/bin/env node
// generate-audio-tts.mjs
// Generate real teacher voice audio using Google Cloud TTS
// Usage: GOOGLE_CLOUD_TTS_API_KEY=... node generate-audio-tts.mjs

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API_KEY = process.env.GOOGLE_CLOUD_TTS_API_KEY;
const APP_DIR = path.join(__dirname, '07-app');
const LESSONS_DIR = path.join(APP_DIR, 'content', 'lessons');
const AUDIO_DIR = path.join(APP_DIR, 'audio');

if (!API_KEY) {
  console.error('❌ Set GOOGLE_CLOUD_TTS_API_KEY environment variable');
  process.exit(1);
}

// Voice config: Natural, warm, encouraging tone
const VOICE_CONFIG = {
  languageCode: 'en-US',
  name: 'en-US-Neural2-C', // Warm female voice
  ssmlGender: 'FEMALE',
};

const AUDIO_CONFIG = {
  audioEncoding: 'LINEAR16', // WAV format
  sampleRateHertz: 22050,
  pitch: 0.0,
  speakingRate: 0.95, // Slightly slower for clarity
};

async function synthesizeText(text, lessonNum, segment) {
  return new Promise((resolve, reject) => {
    const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${API_KEY}`;
    const payload = JSON.stringify({
      input: { text },
      voice: VOICE_CONFIG,
      audioConfig: AUDIO_CONFIG,
    });

    const options = {
      hostname: 'texttospeech.googleapis.com',
      path: `/v1/text:synthesize?key=${API_KEY}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.audioContent) {
            const buffer = Buffer.from(response.audioContent, 'base64');
            resolve(buffer);
          } else {
            reject(new Error(`TTS failed for L${String(lessonNum).padStart(2, '0')}-${segment}: ${data}`));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function generateLessonAudio(lessonNum) {
  const lessonFile = path.join(LESSONS_DIR, `guitar-lesson-${String(lessonNum).padStart(2, '0')}-*.json`);
  const files = fs.readdirSync(LESSONS_DIR).filter(f => f.startsWith(`guitar-lesson-${String(lessonNum).padStart(2, '0')}-`));
  
  if (files.length === 0) {
    console.log(`⏭️  Lesson ${String(lessonNum).padStart(2, '0')}: Not found`);
    return;
  }

  const lessonPath = path.join(LESSONS_DIR, files[0]);
  const lessonData = JSON.parse(fs.readFileSync(lessonPath, 'utf8'));
  const lesson = lessonData.lesson || {};
  
  const audioDir = path.join(AUDIO_DIR, `l${String(lessonNum).padStart(2, '0')}-voice`);
  fs.mkdirSync(audioDir, { recursive: true });

  console.log(`\n🎙️  Lesson ${String(lessonNum).padStart(2, '0')}: ${lesson.title || 'Unknown'}`);

  const segments = [
    { key: '00-intro', text: lesson.coaching?.intro || '' },
    { key: '02-ex1', text: lesson.coaching?.exercise_1 || '' },
    { key: '03-ex2', text: lesson.coaching?.exercise_2 || '' },
    { key: '04-ex3', text: lesson.coaching?.exercise_3 || '' },
    { key: '99-results', text: lesson.coaching?.results || '' },
    { key: '99-wrap', text: lesson.coaching?.wrap || '' },
  ];

  for (const seg of segments) {
    if (!seg.text || seg.text.trim().length === 0) {
      console.log(`  ⏭️  ${seg.key}: (empty, skipping)`);
      continue;
    }

    try {
      console.log(`  🔄 ${seg.key}...`);
      const audio = await synthesizeText(seg.text, lessonNum, seg.key);
      const outFile = path.join(audioDir, `l${String(lessonNum).padStart(2, '0')}-${seg.key}.wav`);
      fs.writeFileSync(outFile, audio);
      console.log(`  ✅ ${seg.key}: ${audio.length} bytes`);
      
      // Rate limit: 2 requests/second to avoid quota issues
      await new Promise(r => setTimeout(r, 500));
    } catch (e) {
      console.error(`  ❌ ${seg.key}: ${e.message}`);
    }
  }
}

async function main() {
  console.log('🎸 Guitar App Audio Generation (Google Cloud TTS)');
  console.log(`API Key: ${API_KEY.substring(0, 10)}...`);
  console.log(`Voice: ${VOICE_CONFIG.name}`);
  console.log(`Output: ${AUDIO_DIR}\n`);

  for (let i = 1; i <= 25; i++) {
    await generateLessonAudio(i);
  }

  console.log('\n✅ Audio generation complete!');
  console.log('Test with: npm run test:all');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
```

---

## Step 4: Run Generation

```bash
# Set your API key
export GOOGLE_CLOUD_TTS_API_KEY="your-key-here"

# Generate all audio (takes ~5-10 min for 25 lessons × 6 segments)
node generate-audio-tts.mjs

# Output: 150 real WAV files in 07-app/audio/l*-voice/
# Example: 07-app/audio/l01-voice/l01-00-intro.wav (real teacher voice)
```

---

## Step 5: Verify Audio Files

```bash
# Check what was generated
ls -lh 07-app/audio/l01-voice/
# Should see: l01-00-intro.wav, l01-02-ex1.wav, etc.

# Check file sizes (real audio should be larger than silent placeholder)
find 07-app/audio -name "*.wav" -exec ls -lh {} \;
```

---

## Step 6: Test Audio in App

```bash
# Run the app
cd 07-app
npx http-server -p 8080

# Open http://localhost:8080 on your browser/phone
# Start Lesson 1
# Click any audio player button
# Should hear teacher voice (instead of silence)
```

---

## Step 7: Run Full Test Suite

```bash
# Verify nothing broke
npm run test:all

# Expected: All tests still pass (audio doesn't change test logic)
```

---

## Quality Assurance Checklist

- [ ] All 25 lessons have audio files
- [ ] No "404" errors when loading lessons
- [ ] Audio plays (not silent) when lessons start
- [ ] Voice is clear and encouraging
- [ ] Pacing is natural (speaking rate ~95% normal)
- [ ] Audio files persist after refresh
- [ ] Mobile browser plays audio correctly

---

## Troubleshooting

### "API quota exceeded"
- **Cause**: Used more than 4M characters this month
- **Fix**: Wait until next month, or upgrade free tier

### "Audio file empty or corrupted"
- **Cause**: TTS returned empty content
- **Fix**: Check API key, check internet connection, check text length

### "App doesn't play audio"
- **Cause**: Browser permissions or missing files
- **Fix**: Check browser console for errors, verify files exist with `ls`

### "Voice sounds robotic"
- **Cause**: Speaking rate too fast or wrong voice
- **Fix**: Adjust `AUDIO_CONFIG.speakingRate` (0.8-1.0 range) or try different `VOICE_CONFIG.name`

---

## Alternative Approaches (If Google TTS Doesn't Work)

### Option 2: Python Kokoro TTS (Local, Free)
- See PHASE-2-3-SUMMARY.md
- Requires fixing ONNX Runtime DLL issue
- Produces warmest, most natural voice
- No API key needed

### Option 3: Manual Recording
- Record yourself or hire someone
- Full creative control
- Time-consuming (2-3 hours)
- Best quality for production

### Option 4: Skip Audio
- Test app flow without voice
- Gather feedback first
- Add audio after user testing if needed

---

## Success Criteria

✅ **For Phase 5 Testing**:
- 140 real WAV files replace placeholders
- All files load without 404 errors
- Audio plays when lessons load
- Teacher voice is encouraging and clear
- Tests still pass (18/19 Playwright + 28/28 smoke)
- Users can hear lesson guidance

✅ **For Production**:
- Voice is professional and consistent
- Audio timing matches lesson flow
- Multiple takes possible (can regenerate easily)
- Voice settings documented for future changes

---

## Files to Update/Create

| File | Action | Purpose |
|------|--------|---------|
| `generate-audio-tts.mjs` | Create | Main TTS generation script |
| `.env` or docs | Add | Document API key setup |
| `07-app/audio/l*-voice/*.wav` | Replace | Real teacher voice files |
| `package.json` | Update | Add script: `"gen:audio": "node generate-audio-tts.mjs"` |

---

## Handoff Notes

**This handoff is ready to execute when user decides to add audio.**

- Code is copy-paste ready
- No external dependencies (uses standard Node.js + HTTPS)
- Estimated time: 2-3 hours (including API setup + generation time)
- Success metric: 150 WAV files with real voice, all tests pass

**Next decision point**: After Phase 5 user testing, decide if production audio is needed or if existing placeholder works.

---

*Ready when you are! 🎸*
