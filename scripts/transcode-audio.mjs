#!/usr/bin/env node
// Walks 07-app/audio/l*-voice/*.wav, transcodes each to a 64kbps mono 22.05kHz
// AAC .m4a beside the source using ffmpeg. Then moves the .wav masters to
// 07-app/audio/_masters/<lesson-voice-dir>/ and writes 07-app/audio/manifest.json
// mapping { lessonId: { clipId: relativePath } } from what exists on disk
// after transcoding.
//
// Usage: node scripts/transcode-audio.mjs

import { existsSync, mkdirSync, readdirSync, renameSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const audioDir = path.join(repoRoot, '07-app', 'audio');
const mastersDir = path.join(audioDir, '_masters');

function checkFfmpeg() {
  const result = spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' });
  if (result.error || result.status !== 0) {
    console.error(
      '\n[transcode-audio] ffmpeg was not found on PATH.\n' +
        'Install it and re-run this script:\n' +
        '  Windows:  winget install Gyan.FFmpeg   (or choco install ffmpeg)\n' +
        '  macOS:    brew install ffmpeg\n' +
        '  Linux:    apt install ffmpeg  (or your distro equivalent)\n',
    );
    process.exit(1);
  }
}

function findVoiceDirs() {
  return readdirSync(audioDir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && /^l\d+-voice$/.test(e.name))
    .map((e) => path.join(audioDir, e.name))
    .sort();
}

function transcodeOne(wavPath) {
  const m4aPath = wavPath.replace(/\.wav$/i, '.m4a');
  const args = [
    '-y',
    '-i', wavPath,
    '-ac', '1',
    '-ar', '22050',
    '-c:a', 'aac',
    '-b:a', '64k',
    m4aPath,
  ];
  const result = spawnSync('ffmpeg', args, { stdio: ['ignore', 'ignore', 'inherit'] });
  if (result.status !== 0) {
    console.error(`[transcode-audio] ffmpeg failed on ${wavPath}`);
    process.exit(1);
  }
  return m4aPath;
}

function main() {
  checkFfmpeg();

  const voiceDirs = findVoiceDirs();
  if (voiceDirs.length === 0) {
    console.error(`[transcode-audio] No l*-voice directories found under ${audioDir}`);
    process.exit(1);
  }

  let transcoded = 0;
  for (const dir of voiceDirs) {
    const wavFiles = readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.wav'));
    for (const wavFile of wavFiles) {
      const wavPath = path.join(dir, wavFile);
      transcodeOne(wavPath);
      transcoded += 1;
    }
  }
  console.log(`[transcode-audio] Transcoded ${transcoded} WAV file(s) to .m4a.`);

  // Move masters out of the shipping path.
  mkdirSync(mastersDir, { recursive: true });
  let moved = 0;
  for (const dir of voiceDirs) {
    const lessonName = path.basename(dir); // e.g. l01-voice
    const destDir = path.join(mastersDir, lessonName);
    mkdirSync(destDir, { recursive: true });
    const wavFiles = readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.wav'));
    for (const wavFile of wavFiles) {
      const src = path.join(dir, wavFile);
      const dest = path.join(destDir, wavFile);
      renameSync(src, dest);
      moved += 1;
    }
  }
  console.log(`[transcode-audio] Moved ${moved} WAV master(s) to ${mastersDir}`);

  // Build manifest.json from what now exists on disk.
  const manifest = {};
  for (const dir of voiceDirs) {
    const dirName = path.basename(dir); // l01-voice
    const lessonId = dirName.replace(/-voice$/, ''); // l01
    const m4aFiles = readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.m4a')).sort();
    if (m4aFiles.length === 0) continue;
    manifest[lessonId] = {};
    for (const m4aFile of m4aFiles) {
      const clipId = path.basename(m4aFile, '.m4a');
      const relativePath = `${dirName}/${m4aFile}`;
      manifest[lessonId][clipId] = relativePath;
    }
  }

  const manifestPath = path.join(audioDir, 'manifest.json');
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`[transcode-audio] Wrote manifest for ${Object.keys(manifest).length} lesson(s) to ${manifestPath}`);
}

main();
