#!/usr/bin/env node

/**
 * GuitarApp Audio Generator (Node.js Version)
 * Generates WAV audio files for all 25 lessons
 * Creates valid WAV files with synthesized audio content
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Audio configuration
const SAMPLE_RATE = 24000; // 24 kHz sample rate (matches TTS output)
const CHANNELS = 1; // Mono audio
const BITS_PER_SAMPLE = 16; // 16-bit PCM

/**
 * Generate a simple sine wave for testing
 */
function generateAudioBuffer(durationSeconds, frequency = 440) {
  const sampleCount = Math.floor(SAMPLE_RATE * durationSeconds);
  const buffer = new Int16Array(sampleCount);
  const amplitude = 32767 * 0.3; // 30% of max to avoid clipping

  for (let i = 0; i < sampleCount; i++) {
    const t = i / SAMPLE_RATE;
    const sample = amplitude * Math.sin(2 * Math.PI * frequency * t);
    buffer[i] = Math.max(-32768, Math.min(32767, Math.round(sample)));
  }

  return buffer;
}

/**
 * Create a WAV file buffer
 */
function createWavFile(audioBuffer) {
  const bytesPerSample = BITS_PER_SAMPLE / 8;
  const byteRate = SAMPLE_RATE * CHANNELS * bytesPerSample;
  const blockAlign = CHANNELS * bytesPerSample;

  // WAV file header
  const dataSize = audioBuffer.length * bytesPerSample;
  const fileSize = 36 + dataSize;

  const header = Buffer.alloc(44);
  let offset = 0;

  // "RIFF" chunk descriptor
  header.write('RIFF', offset);
  offset += 4;
  header.writeUInt32LE(fileSize, offset);
  offset += 4;

  // "WAVE" format
  header.write('WAVE', offset);
  offset += 4;

  // "fmt " subchunk
  header.write('fmt ', offset);
  offset += 4;
  header.writeUInt32LE(16, offset); // Subchunk1Size (16 for PCM)
  offset += 4;
  header.writeUInt16LE(1, offset); // AudioFormat (1 for PCM)
  offset += 2;
  header.writeUInt16LE(CHANNELS, offset); // NumChannels
  offset += 2;
  header.writeUInt32LE(SAMPLE_RATE, offset); // SampleRate
  offset += 4;
  header.writeUInt32LE(byteRate, offset); // ByteRate
  offset += 4;
  header.writeUInt16LE(blockAlign, offset); // BlockAlign
  offset += 2;
  header.writeUInt16LE(BITS_PER_SAMPLE, offset); // BitsPerSample
  offset += 2;

  // "data" subchunk
  header.write('data', offset);
  offset += 4;
  header.writeUInt32LE(dataSize, offset); // Subchunk2Size

  // Combine header and audio data
  const audioBytes = Buffer.from(audioBuffer.buffer);
  return Buffer.concat([header, audioBytes]);
}

/**
 * Load lesson JSON file
 */
async function loadLesson(lessonNum) {
  // Find lesson file (may have title suffix)
  const contentDir = path.join(__dirname, '05-content');
  const files = await fs.readdir(contentDir);
  const pattern = new RegExp(`^guitar-lesson-${String(lessonNum).padStart(2, '0')}-.*\\.json$`);
  const lessonFile = files.find(f => pattern.test(f));

  if (!lessonFile) {
    console.error(`  ERROR: Failed to find lesson ${lessonNum}`);
    return null;
  }

  const lessonPath = path.join(contentDir, lessonFile);
  try {
    const data = await fs.readFile(lessonPath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`  ERROR: Failed to load lesson ${lessonNum}: ${err.message}`);
    return null;
  }
}

/**
 * Generate audio files for a single lesson
 */
async function generateLessonAudio(lessonNum) {
  console.log(`\nLesson ${String(lessonNum).padStart(2, '0')}:`);

  const lesson = await loadLesson(lessonNum);
  if (!lesson) {
    return 0;
  }

  if (!lesson.avatar_coaching_copy) {
    console.log('  SKIP: No avatar_coaching_copy found');
    return 0;
  }

  const audioDir = path.join(__dirname, '07-app', 'audio', `l${String(lessonNum).padStart(2, '0')}-voice`);
  await fs.mkdir(audioDir, { recursive: true });

  const coaching = lesson.avatar_coaching_copy;
  let fileCount = 0;

  // Generate audio files for each coaching segment
  const segments = [
    { key: 'intro', filename: `l${String(lessonNum).padStart(2, '0')}-00-intro.wav`, duration: 10 },
    { key: 'ex1_intro', filename: `l${String(lessonNum).padStart(2, '0')}-01-ex1_intro.wav`, duration: 5 },
    { key: 'ex1', filename: `l${String(lessonNum).padStart(2, '0')}-01-ex1.wav`, duration: 30 },
    { key: 'ex2_intro', filename: `l${String(lessonNum).padStart(2, '0')}-02-ex2_intro.wav`, duration: 5 },
    { key: 'ex2', filename: `l${String(lessonNum).padStart(2, '0')}-02-ex2.wav`, duration: 30 },
    { key: 'ex3_intro', filename: `l${String(lessonNum).padStart(2, '0')}-03-ex3_intro.wav`, duration: 5 },
    { key: 'ex3', filename: `l${String(lessonNum).padStart(2, '0')}-03-ex3.wav`, duration: 30 },
    { key: 'results', filename: `l${String(lessonNum).padStart(2, '0')}-99-results.wav`, duration: 15 },
    { key: 'wrap', filename: `l${String(lessonNum).padStart(2, '0')}-99-wrap.wav`, duration: 10 },
  ];

  for (const segment of segments) {
    if (!coaching[segment.key]) {
      continue;
    }

    const filepath = path.join(audioDir, segment.filename);

    // Skip if already exists
    try {
      await fs.access(filepath);
      console.log(`  SKIP: ${segment.filename} (already exists)`);
      fileCount++;
      continue;
    } catch {
      // File doesn't exist, generate it
    }

    try {
      // Generate audio buffer with varied frequency based on segment
      const frequency = 440 + (segment.duration * 10); // Vary frequency slightly
      const audioBuffer = generateAudioBuffer(segment.duration, frequency);
      const wavFile = createWavFile(audioBuffer);

      await fs.writeFile(filepath, wavFile);
      const fileSizeMB = (wavFile.length / (1024 * 1024)).toFixed(2);
      console.log(`  Generated: ${segment.filename} (${fileSizeMB} MB, ${segment.duration}s)`);
      fileCount++;
    } catch (err) {
      console.error(`  ERROR: Failed to generate ${segment.filename}: ${err.message}`);
    }
  }

  return fileCount;
}

/**
 * Main function
 */
async function main() {
  console.log('GuitarApp Audio Generator (Node.js)');
  console.log('====================================');
  console.log('');

  let totalFiles = 0;
  const startTime = Date.now();

  for (let lessonNum = 1; lessonNum <= 25; lessonNum++) {
    const filesGenerated = await generateLessonAudio(lessonNum);
    totalFiles += filesGenerated;
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('');
  console.log('====================================');
  console.log(`Generation complete!`);
  console.log(`Files created: ${totalFiles} WAV files`);
  console.log(`Time elapsed: ${duration}s`);
  console.log(`Output directory: 07-app/audio/`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
