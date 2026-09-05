#!/usr/bin/env node

/**
 * GuitarApp Audio Utilities
 * Inspect, validate, and audit lesson audio files and metadata
 *
 * Usage:
 *   node audio-utils.mjs audit
 *   node audio-utils.mjs estimate
 *   node audio-utils.mjs missing
 *   node audio-utils.mjs validate-json
 *   node audio-utils.mjs check-files
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  contentDir: path.join(__dirname, '05-content'),
  audioDir: path.join(__dirname, '07-app', 'audio'),
  lessonCount: 25,
};

// ============================================================================
// UTILITIES
// ============================================================================

function padLeft(str, width) {
  return String(str).padStart(width, ' ');
}

function padRight(str, width) {
  return String(str).padEnd(width, ' ');
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

async function loadLesson(lessonNum) {
  const files = await fs.readdir(CONFIG.contentDir);
  const match = files.find(
    (f) =>
      f.startsWith(`guitar-lesson-${String(lessonNum).padStart(2, '0')}-`) &&
      f.endsWith('.json')
  );

  if (!match) return null;

  const content = await fs.readFile(
    path.join(CONFIG.contentDir, match),
    'utf-8'
  );
  return JSON.parse(content);
}

async function getAudioFilesForLesson(lessonNum) {
  const dir = path.join(CONFIG.audioDir, `l${String(lessonNum).padStart(2, '0')}-voice`);
  try {
    const files = await fs.readdir(dir);
    const wavFiles = files.filter((f) => f.endsWith('.wav'));

    const details = [];
    for (const file of wavFiles) {
      const filePath = path.join(dir, file);
      const stat = await fs.stat(filePath);
      details.push({
        name: file,
        size: stat.size,
      });
    }
    return details;
  } catch (err) {
    return [];
  }
}

function extractCoachingText(lesson) {
  const segments = [];

  if (lesson.avatar_coaching_copy?.intro) {
    segments.push({
      type: 'intro',
      text: lesson.avatar_coaching_copy.intro,
    });
  }

  const exercises = lesson.exercises || [];
  exercises.forEach((ex, idx) => {
    const exKey = `ex${idx + 1}_intro`;
    if (lesson.avatar_coaching_copy?.[exKey]) {
      segments.push({
        type: `ex${idx + 1}_intro`,
        text: lesson.avatar_coaching_copy[exKey],
      });
    }
    if (ex.coaching) {
      segments.push({
        type: `ex${idx + 1}`,
        text: ex.coaching,
      });
    }
  });

  if (lesson.avatar_coaching_copy?.results) {
    segments.push({
      type: 'results',
      text: lesson.avatar_coaching_copy.results,
    });
  }

  if (lesson.avatar_coaching_copy?.wrap) {
    segments.push({
      type: 'wrap',
      text: lesson.avatar_coaching_copy.wrap,
    });
  }

  return segments;
}

// ============================================================================
// COMMANDS
// ============================================================================

async function cmdAudit() {
  console.log('\n📋 AUDIO FILES AUDIT\n');
  console.log(
    `${padRight('Lesson', 10)} ${padLeft('Files', 7)} ${padLeft('Size', 12)} ${padRight('Status', 20)}`
  );
  console.log('-'.repeat(60));

  for (let i = 1; i <= CONFIG.lessonCount; i++) {
    const audioFiles = await getAudioFilesForLesson(i);
    const totalSize = audioFiles.reduce((sum, f) => sum + f.size, 0);
    const fileCount = audioFiles.length;

    let status = '✗ MISSING';
    if (fileCount === 0) {
      status = '✗ No files';
    } else if (fileCount >= 6) {
      status = '✓ Complete';
    } else {
      status = `⚠ Incomplete (${fileCount} files)`;
    }

    console.log(
      `${padRight(`L${String(i).padStart(2, '0')}`, 10)} ${padLeft(fileCount, 7)} ${padRight(formatBytes(totalSize), 12)} ${status}`
    );
  }

  console.log('\n');
}

async function cmdEstimate() {
  console.log('\n💰 AUDIO GENERATION COST ESTIMATE\n');

  let totalChars = 0;

  for (let i = 1; i <= CONFIG.lessonCount; i++) {
    try {
      const lesson = await loadLesson(i);
      if (!lesson) continue;

      const segments = extractCoachingText(lesson);
      const lessonChars = segments.reduce((sum, seg) => sum + seg.text.length, 0);
      totalChars += lessonChars;

      console.log(
        `L${String(i).padStart(2, '0')}: ${padLeft(lessonChars, 6)} characters`
      );
    } catch (err) {
      console.log(`L${String(i).padStart(2, '0')}: ERROR reading lesson`);
    }
  }

  console.log('-'.repeat(40));
  console.log(`\nTotal characters: ${totalChars.toLocaleString()}`);

  const standardCost = (totalChars / 1_000_000) * 15.0;
  const premiumCost = (totalChars / 1_000_000) * 30.0;

  console.log(`\nEstimated costs:`);
  console.log(`  Standard voice (Neural2): $${standardCost.toFixed(2)}`);
  console.log(`  Premium voice (Premium):  $${premiumCost.toFixed(2)}`);
  console.log('\n(Prices: $15/M chars for standard, $30/M for premium)\n');
}

async function cmdMissing() {
  console.log('\n📌 MISSING AUDIO FILES\n');

  let hasIssues = false;

  for (let i = 1; i <= CONFIG.lessonCount; i++) {
    const lesson = await loadLesson(i);
    if (!lesson) {
      console.log(`L${String(i).padStart(2, '0')}: JSON file not found`);
      hasIssues = true;
      continue;
    }

    const segments = extractCoachingText(lesson);
    const audioFiles = await getAudioFilesForLesson(i);
    const audioNames = audioFiles.map((f) => f.name);

    const expectedFiles = segments.length;
    const actualFiles = audioFiles.length;

    if (actualFiles < expectedFiles) {
      hasIssues = true;
      console.log(
        `L${String(i).padStart(2, '0')}: ${actualFiles}/${expectedFiles} files`
      );
      console.log(`     Expected segments:`);
      segments.forEach((seg, idx) => {
        console.log(`       ${padLeft(idx, 2)}. ${seg.type}`);
      });
      console.log(`     Existing files: ${audioNames.join(', ') || '(none)'}`);
      console.log('');
    }
  }

  if (!hasIssues) {
    console.log('✓ All audio files present\n');
  }
}

async function cmdValidateJson() {
  console.log('\n✓ VALIDATING LESSON JSON FILES\n');

  let valid = 0;
  let invalid = 0;

  for (let i = 1; i <= CONFIG.lessonCount; i++) {
    try {
      const lesson = await loadLesson(i);
      if (!lesson) {
        console.log(`L${String(i).padStart(2, '0')}: ✗ File not found`);
        invalid++;
        continue;
      }

      // Basic validation
      const hasLesson = lesson.lesson && lesson.lesson.id;
      const hasCoaching = lesson.avatar_coaching_copy;
      const hasExercises = Array.isArray(lesson.exercises);

      if (hasLesson && hasCoaching && hasExercises) {
        const segments = extractCoachingText(lesson);
        console.log(
          `L${String(i).padStart(2, '0')}: ✓ Valid (${segments.length} segments)`
        );
        valid++;
      } else {
        console.log(`L${String(i).padStart(2, '0')}: ✗ Missing required fields`);
        invalid++;
      }
    } catch (err) {
      console.log(`L${String(i).padStart(2, '0')}: ✗ Parse error: ${err.message}`);
      invalid++;
    }
  }

  console.log(`\nResult: ${valid} valid, ${invalid} invalid\n`);
}

async function cmdCheckFiles() {
  console.log('\n🔍 CHECKING FILE INTEGRITY\n');

  let totalSize = 0;
  let totalFiles = 0;
  let hasIssues = false;

  for (let i = 1; i <= CONFIG.lessonCount; i++) {
    const audioFiles = await getAudioFilesForLesson(i);

    for (const file of audioFiles) {
      totalFiles++;
      totalSize += file.size;

      // Check for suspiciously uniform file sizes (placeholder files)
      if (file.size % 100000 === 44) {
        // WAV header + round number
        console.log(
          `⚠  L${String(i).padStart(2, '0')}: ${file.name} (${formatBytes(file.size)}) — may be placeholder`
        );
        hasIssues = true;
      }
    }
  }

  console.log(`\nTotal audio files: ${totalFiles}`);
  console.log(`Total disk used: ${formatBytes(totalSize)}`);

  if (!hasIssues) {
    console.log('✓ No issues detected\n');
  } else {
    console.log('\n⚠  Some files may be placeholders. Regenerate with:\n');
    console.log('   node generate-lesson-audio.mjs\n');
  }
}

// ============================================================================
// HELP & MAIN
// ============================================================================

function showHelp() {
  console.log('\n🎸 GuitarApp Audio Utilities\n');
  console.log('Commands:');
  console.log('  audit         Show audio file counts and sizes per lesson');
  console.log('  estimate      Estimate cost to generate all audio');
  console.log('  missing       List missing or incomplete audio files');
  console.log('  validate-json Validate all lesson JSON files');
  console.log('  check-files   Check audio file integrity\n');
}

async function main() {
  const command = process.argv[2];

  try {
    switch (command) {
      case 'audit':
        await cmdAudit();
        break;
      case 'estimate':
        await cmdEstimate();
        break;
      case 'missing':
        await cmdMissing();
        break;
      case 'validate-json':
        await cmdValidateJson();
        break;
      case 'check-files':
        await cmdCheckFiles();
        break;
      default:
        showHelp();
    }
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    process.exit(1);
  }
}

main();
