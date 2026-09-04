#!/usr/bin/env node
/**
 * GuitarApp Audio Generator - Creates WAV files for all lesson voice lines
 * Uses node-wav to create properly formatted WAV files
 * Real audio can be generated with external TTS and placed in these files
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// WAV file helpers
function writeWavHeader(sampleRate, numChannels, numSamples) {
  const bytesPerSecond = sampleRate * numChannels * 2;
  const blockAlign = numChannels * 2;
  const audioDataSize = numSamples * numChannels * 2;

  const buffer = Buffer.alloc(44);
  let pos = 0;

  // "RIFF" chunk descriptor
  buffer.write('RIFF', pos);
  pos += 4;
  buffer.writeUInt32LE(36 + audioDataSize, pos);
  pos += 4;
  buffer.write('WAVE', pos);
  pos += 4;

  // "fmt " subchunk
  buffer.write('fmt ', pos);
  pos += 4;
  buffer.writeUInt32LE(16, pos); // subchunk size
  pos += 4;
  buffer.writeUInt16LE(1, pos); // audio format (PCM)
  pos += 2;
  buffer.writeUInt16LE(numChannels, pos);
  pos += 2;
  buffer.writeUInt32LE(sampleRate, pos);
  pos += 4;
  buffer.writeUInt32LE(bytesPerSecond, pos);
  pos += 4;
  buffer.writeUInt16LE(blockAlign, pos);
  pos += 2;
  buffer.writeUInt16LE(16, pos); // bits per sample
  pos += 2;

  // "data" subchunk
  buffer.write('data', pos);
  pos += 4;
  buffer.writeUInt32LE(audioDataSize, pos);
  pos += 4;

  return buffer;
}

function createPlaceholderWav(durationSeconds, sampleRate = 24000) {
  /**
   * Create a placeholder WAV file with silent audio.
   * This allows the app structure to work while waiting for real TTS audio.
   * Replace with actual TTS-generated audio by writing to the same file.
   */
  const numSamples = Math.round(sampleRate * durationSeconds);
  const audioData = Buffer.alloc(numSamples * 2);
  audioData.fill(0); // Silent audio

  const header = writeWavHeader(sampleRate, 1, numSamples);
  return Buffer.concat([header, audioData]);
}

// Estimate duration based on text length (rough heuristic)
function estimateDuration(text) {
  // Rough estimate: ~3 words per second of speech
  const wordCount = text.split(/\s+/).length;
  return Math.max(3, Math.ceil(wordCount / 3));
}

async function generateLessonAudio(lessonNum, lessonFile) {
  try {
    const lessonData = JSON.parse(await fs.readFile(lessonFile, 'utf-8'));

    if (!lessonData.avatar_coaching_copy) {
      console.log(`  ⊘ No coaching copy found`);
      return;
    }

    const coaching = lessonData.avatar_coaching_copy;
    const audioDir = path.join(__dirname, `07-app/audio/l${String(lessonNum).padStart(2, '0')}-voice`);

    await fs.mkdir(audioDir, { recursive: true });

    console.log(`  Generating voice files...`);
    const createdFiles = [];

    for (const [key, text] of Object.entries(coaching)) {
      if (typeof text !== 'string' || !text.trim()) continue;

      let filename;
      if (key === 'intro') {
        filename = `l${String(lessonNum).padStart(2, '0')}-00-intro.wav`;
      } else if (key === 'results') {
        filename = `l${String(lessonNum).padStart(2, '0')}-99-results.wav`;
      } else if (key === 'wrap') {
        filename = `l${String(lessonNum).padStart(2, '0')}-99-wrap.wav`;
      } else if (key.startsWith('ex') && key.endsWith('_intro')) {
        const exNum = key.replace('ex', '').replace('_intro', '');
        const exIdx = parseInt(exNum) + 1;
        filename = `l${String(lessonNum).padStart(2, '0')}-${String(exIdx).padStart(2, '0')}-ex${exNum}.wav`;
      } else {
        filename = `l${String(lessonNum).padStart(2, '0')}-${key}.wav`;
      }

      const filepath = path.join(audioDir, filename);

      // Skip if exists
      if (await fs.stat(filepath).catch(() => null)) {
        console.log(`    - ${filename} [exists]`);
        createdFiles.push(filepath);
        continue;
      }

      try {
        const duration = estimateDuration(text);
        const wavData = createPlaceholderWav(duration);
        await fs.writeFile(filepath, wavData);
        console.log(`    ✓ ${filename} (${duration}s placeholder)`);
        createdFiles.push(filepath);
      } catch (err) {
        console.log(`    ✗ ${filename}: ${err.message}`);
      }
    }

    // Create full-lesson concatenation marker file
    if (createdFiles.length > 0) {
      const fullFile = path.join(audioDir, `l${String(lessonNum).padStart(2, '0')}-full.txt`);
      await fs.writeFile(fullFile, createdFiles.map(f => path.basename(f)).join('\n'));
      console.log(`  ✓ Full lesson manifest created`);
    }

    return createdFiles.length;
  } catch (err) {
    console.error(`  ✗ Error: ${err.message}`);
    return 0;
  }
}

async function main() {
  console.log('=' .repeat(60));
  console.log('GuitarApp Audio Structure Generator');
  console.log('=' .repeat(60));
  console.log('');
  console.log('This creates the directory structure and placeholder audio files.');
  console.log('For real TTS audio, use an external service (Kokoro, Chatterbox, etc.)');
  console.log('and replace the WAV files in each lesson folder.');
  console.log('');

  const contentDir = path.join(__dirname, '05-content');
  const lessonFiles = (await fs.readdir(contentDir))
    .filter(f => f.startsWith('guitar-lesson-') && f.endsWith('.json'))
    .sort();

  if (lessonFiles.length === 0) {
    console.error(`✗ No lessons found in ${contentDir}`);
    process.exit(1);
  }

  console.log(`Found ${lessonFiles.length} lessons\n`);

  let totalFiles = 0;
  for (let i = 0; i < lessonFiles.length; i++) {
    const lessonNum = i + 1;
    const lessonFile = path.join(contentDir, lessonFiles[i]);
    console.log(`Lesson ${String(lessonNum).padStart(2, '0')}/25: ${path.basename(lessonFile)}`);
    const count = await generateLessonAudio(lessonNum, lessonFile);
    totalFiles += count || 0;
  }

  console.log('');
  console.log('=' .repeat(60));
  console.log(`✓ Created audio structure for ${lessonFiles.length} lessons (${totalFiles} files)`);
  console.log(`Output: ${path.join(__dirname, '07-app/audio')}`);
  console.log('');
  console.log('NEXT STEPS:');
  console.log('1. Replace placeholder WAV files with real TTS audio');
  console.log('2. Test the app in browser');
  console.log('3. Verify audio plays in each lesson');
  console.log('=' .repeat(60));
}

main().catch(console.error);
