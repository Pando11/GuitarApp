#!/usr/bin/env node

/**
 * GuitarApp Lesson Audio Generator
 * Generates real audio for all 25 lessons using Google Cloud Text-to-Speech
 *
 * Usage:
 *   node generate-lesson-audio.mjs [--dry-run] [--lesson N] [--voice NAME]
 *
 * Examples:
 *   node generate-lesson-audio.mjs --dry-run
 *   node generate-lesson-audio.mjs --lesson 1
 *   node generate-lesson-audio.mjs --voice "en-US-Neural2-A"
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Lazy-load Google Cloud TTS (only needed for production, not dry-run)
let TextToSpeechClient;
async function loadTTSClient() {
  if (!TextToSpeechClient) {
    try {
      const module = await import('@google-cloud/text-to-speech');
      TextToSpeechClient = module.TextToSpeechClient;
    } catch (err) {
      throw new Error(
        'Google Cloud TTS client not installed. Run: npm install @google-cloud/text-to-speech'
      );
    }
  }
  return TextToSpeechClient;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  // GCP Text-to-Speech settings
  tts: {
    voice: {
      languageCode: 'en-US',
      name: 'en-US-Neural2-C', // Professional, warm instructor voice
    },
    audioConfig: {
      audioEncoding: 'LINEAR16', // WAV format
      sampleRateHertz: 24000,
      speakingRate: 0.95, // Slightly slower for guitar instruction
      pitch: 0.0,
    },
  },

  // Paths
  paths: {
    contentDir: path.join(__dirname, '05-content'),
    audioDir: path.join(__dirname, '07-app', 'audio'),
  },

  // Lesson count
  lessonCount: 25,

  // Progress indicator characters
  progress: {
    success: '✓',
    error: '✗',
    skip: '⊘',
    pending: '◯',
  },
};

// ============================================================================
// TEXT NORMALIZATION
// ============================================================================

/**
 * Normalize text for TTS to handle chord symbols and other quirks
 * Per VOICE-GUIDE.md: No bare chord symbols in spoken text — expand "Em" to "E minor"
 */
function normalizeForTTS(text) {
  if (!text) return text;

  const chordMap = {
    // Major chords
    'C major': 'C major',
    'C\\b': 'C major',
    '\\bD major': 'D major',
    '\\bD\\b': 'D major',
    '\\bE major': 'E major',
    '\\bE\\b': 'E major',
    '\\bF major': 'F major',
    '\\bF\\b': 'F major',
    '\\bG major': 'G major',
    '\\bG\\b': 'G major',
    '\\bA major': 'A major',
    '\\bA\\b': 'A major',

    // Minor chords
    '\\bEm\\b': 'E minor',
    '\\bAm\\b': 'A minor',
    '\\bDm\\b': 'D minor',
    '\\bBm\\b': 'B minor',

    // Dominant/seventh chords
    '\\bA7\\b': 'A seven',
    '\\bE7\\b': 'E seven',
    '\\bD7\\b': 'D seven',
    '\\bG7\\b': 'G seven',

    // Suspended chords
    '\\bSus2\\b': 'suspended two',
    '\\bSus4\\b': 'suspended four',

    // Other variations
    '\\b(\\w+)add9\\b': '$1 add nine',
    '\\b(\\w+)aug\\b': '$1 augmented',
    '\\b(\\w+)dim\\b': '$1 diminished',
  };

  let normalized = text;

  // Apply chord replacements
  Object.entries(chordMap).forEach(([pattern, replacement]) => {
    const regex = new RegExp(pattern, 'g');
    normalized = normalized.replace(regex, replacement);
  });

  // Fix common text issues
  normalized = normalized
    .replace(/\.\s+\./g, '.') // Remove double periods
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .trim();

  return normalized;
}

// ============================================================================
// LOGGING & PROGRESS
// ============================================================================

class Logger {
  constructor(dryRun = false) {
    this.dryRun = dryRun;
    this.lessonProgress = {};
    this.startTime = Date.now();
  }

  header(text) {
    console.log('\n' + '='.repeat(70));
    console.log(`  ${text}`);
    console.log('='.repeat(70) + '\n');
  }

  section(text) {
    console.log(`\n📚 ${text}\n`);
  }

  log(text) {
    console.log(text);
  }

  success(lessonNum, filename, chars) {
    console.log(`  [${CONFIG.progress.success}] L${String(lessonNum).padStart(2, '0')} → ${filename} (${chars} chars)`);
  }

  skip(lessonNum, reason) {
    console.log(`  [${CONFIG.progress.skip}] L${String(lessonNum).padStart(2, '0')} — ${reason}`);
  }

  error(lessonNum, filename, err) {
    console.log(`  [${CONFIG.progress.error}] L${String(lessonNum).padStart(2, '0')} → ${filename}`);
    console.log(`      Error: ${err.message}`);
  }

  dryRunMode() {
    console.log('⚡ DRY-RUN MODE: No API calls, no files written\n');
  }

  stats(generated, skipped, failed, apiChars, estimatedCost) {
    console.log('\n' + '-'.repeat(70));
    console.log(`\n📊 SUMMARY\n`);
    console.log(`  Generated: ${generated} audio files`);
    console.log(`  Skipped:   ${skipped}`);
    console.log(`  Failed:    ${failed}`);
    console.log(`  Total:     ${generated + skipped + failed} of ${CONFIG.lessonCount * 6}`);
    console.log(`\n  Total characters sent to TTS: ${apiChars.toLocaleString()}`);
    console.log(`  Estimated cost: $${estimatedCost.toFixed(4)}`);
    console.log(
      `  (at $15.00 per 1M characters, $30/M for premium voices)\n`
    );

    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
    console.log(`  Time: ${elapsed}s\n`);
  }
}

// ============================================================================
// LESSON DATA EXTRACTION
// ============================================================================

/**
 * Load a single lesson JSON file
 */
async function loadLesson(lessonNum) {
  const filename = `guitar-lesson-${String(lessonNum).padStart(2, '0')}-*.json`;
  const pattern = path.join(CONFIG.paths.contentDir, filename.replace('*', '*'));

  try {
    // Find the actual file (filename may have slug after number)
    const files = await fs.readdir(CONFIG.paths.contentDir);
    const match = files.find((f) =>
      f.startsWith(`guitar-lesson-${String(lessonNum).padStart(2, '0')}-`)
        && f.endsWith('.json')
    );

    if (!match) {
      throw new Error(`Lesson file not found for L${String(lessonNum).padStart(2, '0')}`);
    }

    const content = await fs.readFile(
      path.join(CONFIG.paths.contentDir, match),
      'utf-8'
    );
    return JSON.parse(content);
  } catch (err) {
    throw new Error(`Failed to load lesson ${lessonNum}: ${err.message}`);
  }
}

/**
 * Extract all coaching text segments from a lesson
 * Returns array of { type, index, text, filename }
 */
function extractCoachingText(lessonNum, lesson) {
  const segments = [];
  const filePrefix = `l${String(lessonNum).padStart(2, '0')}`;

  // Avatar coaching: intro
  if (lesson.avatar_coaching_copy?.intro) {
    segments.push({
      type: 'intro',
      index: 0,
      text: lesson.avatar_coaching_copy.intro,
      filename: `${filePrefix}-00-intro.wav`,
    });
  }

  // Exercise intros from avatar_coaching_copy
  const exercises = lesson.exercises || [];
  exercises.forEach((ex, idx) => {
    const exKey = `ex${idx + 1}_intro`;
    if (lesson.avatar_coaching_copy?.[exKey]) {
      segments.push({
        type: `ex${idx + 1}_intro`,
        index: idx + 1,
        text: lesson.avatar_coaching_copy[exKey],
        filename: `${filePrefix}-${String(idx + 1).padStart(2, '0')}-ex${idx + 1}_intro.wav`,
      });
    }

    // Individual exercise coaching
    if (ex.coaching) {
      segments.push({
        type: `ex${idx + 1}`,
        index: idx + 1,
        text: ex.coaching,
        filename: `${filePrefix}-${String(idx + 1).padStart(2, '0')}-ex${idx + 1}.wav`,
      });
    }
  });

  // Avatar coaching: results
  if (lesson.avatar_coaching_copy?.results) {
    segments.push({
      type: 'results',
      index: 98,
      text: lesson.avatar_coaching_copy.results,
      filename: `${filePrefix}-99-results.wav`,
    });
  }

  // Avatar coaching: wrap
  if (lesson.avatar_coaching_copy?.wrap) {
    segments.push({
      type: 'wrap',
      index: 99,
      text: lesson.avatar_coaching_copy.wrap,
      filename: `${filePrefix}-99-wrap.wav`,
    });
  }

  return segments.sort((a, b) => a.index - b.index);
}

// ============================================================================
// AUDIO GENERATION
// ============================================================================

/**
 * Generate audio for a single text segment using Google Cloud TTS
 */
async function synthesizeText(client, text) {
  const normalizedText = normalizeForTTS(text);

  const request = {
    input: { text: normalizedText },
    voice: CONFIG.tts.voice,
    audioConfig: CONFIG.tts.audioConfig,
  };

  const [response] = await client.synthesizeSpeech(request);
  return {
    audioBuffer: response.audioContent,
    charCount: normalizedText.length,
  };
}

/**
 * Save audio buffer to WAV file
 */
async function saveAudioFile(outputPath, audioBuffer) {
  const dir = path.dirname(outputPath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(outputPath, audioBuffer);
}

// ============================================================================
// MAIN GENERATION FLOW
// ============================================================================

async function generateLessonAudio(lessonNum, client, logger, dryRun = false) {
  try {
    // Load lesson
    const lesson = await loadLesson(lessonNum);
    const segments = extractCoachingText(lessonNum, lesson);

    if (!segments.length) {
      logger.skip(lessonNum, 'No coaching text found');
      return { success: 0, skipped: 1, failed: 0, chars: 0 };
    }

    let success = 0;
    let failed = 0;
    let totalChars = 0;

    // Process each segment
    for (const segment of segments) {
      try {
        const audioDir = path.join(CONFIG.paths.audioDir, `l${String(lessonNum).padStart(2, '0')}-voice`);
        const outputPath = path.join(audioDir, segment.filename);

        if (dryRun) {
          // Dry run: just log what would be generated
          const normalized = normalizeForTTS(segment.text);
          logger.success(lessonNum, segment.filename, normalized.length);
          totalChars += normalized.length;
        } else {
          // Real run: call TTS API and save file
          const result = await synthesizeText(client, segment.text);
          await saveAudioFile(outputPath, result.audioBuffer);

          logger.success(lessonNum, segment.filename, result.charCount);
          totalChars += result.charCount;
        }

        success++;
      } catch (err) {
        logger.error(lessonNum, segment.filename, err);
        failed++;
      }
    }

    return { success, skipped: 0, failed, chars: totalChars };
  } catch (err) {
    logger.error(lessonNum, 'LESSON LOAD', err);
    return { success: 0, skipped: 1, failed: 0, chars: 0 };
  }
}

/**
 * Main entry point
 */
async function main() {
  // Parse CLI arguments
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const lessonArg = args.find((arg) => arg.startsWith('--lesson'));
  const voiceArg = args.find((arg) => arg.startsWith('--voice'));

  const startLesson = lessonArg ? parseInt(lessonArg.split('=')[1] || args[args.indexOf(lessonArg) + 1], 10) : 1;
  const endLesson = startLesson === 1 ? CONFIG.lessonCount : startLesson;

  if (voiceArg) {
    const voiceName = voiceArg.split('=')[1] || args[args.indexOf(voiceArg) + 1];
    CONFIG.tts.voice.name = voiceName;
  }

  // Initialize logger
  const logger = new Logger(dryRun);

  logger.header('🎸 GuitarApp Lesson Audio Generator');

  if (dryRun) {
    logger.dryRunMode();
  }

  logger.log(`Google Cloud TTS Voice: ${CONFIG.tts.voice.name}`);
  logger.log(`Processing: Lessons ${startLesson}–${endLesson}`);
  logger.log(`Output Directory: ${CONFIG.paths.audioDir}\n`);

  // Initialize TTS client (skip in dry-run to avoid credential requirement)
  let client;
  if (!dryRun) {
    try {
      const ClientClass = await loadTTSClient();
      client = new ClientClass();
      logger.log('✓ Google Cloud TTS client initialized\n');
    } catch (err) {
      console.error('\n❌ Failed to initialize Google Cloud TTS client:');
      console.error(`   ${err.message}`);
      console.error('\n   Make sure you have:');
      console.error('   1. Installed @google-cloud/text-to-speech: npm install @google-cloud/text-to-speech');
      console.error('   2. Set GOOGLE_APPLICATION_CREDENTIALS environment variable');
      console.error('   3. A valid GCP service account JSON key file\n');
      process.exit(1);
    }
  }

  // Process lessons
  logger.section('GENERATING AUDIO FILES');

  let totalGenerated = 0;
  let totalSkipped = 0;
  let totalFailed = 0;
  let totalChars = 0;

  for (let lessonNum = startLesson; lessonNum <= endLesson; lessonNum++) {
    const result = await generateLessonAudio(lessonNum, client, logger, dryRun);
    totalGenerated += result.success;
    totalSkipped += result.skipped;
    totalFailed += result.failed;
    totalChars += result.chars;
  }

  // Calculate estimated cost (Standard voice pricing)
  const estimatedCost = (totalChars / 1_000_000) * 15.0;

  // Print summary
  logger.stats(totalGenerated, totalSkipped, totalFailed, totalChars, estimatedCost);

  if (dryRun) {
    console.log('ℹ️  This was a dry run. No API calls were made, no files were written.\n');
  }

  if (totalFailed > 0) {
    process.exit(1);
  }
}

// ============================================================================
// EXECUTION
// ============================================================================

main().catch((err) => {
  console.error('\n❌ Fatal error:', err.message);
  process.exit(1);
});
