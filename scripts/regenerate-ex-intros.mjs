#!/usr/bin/env node
// Regenerates the `exN_intro` avatar-coaching voice clips for every lesson.
//
// BUG THIS FIXES: every `exN_intro` clip across all 25 lessons was a
// byte-identical placeholder (md5 11507e6c73326c665863b05ccc9cb1a8). Root
// cause: an earlier ad-hoc run of `generate-audio-nodejs.mjs` (a pure
// sine-tone placeholder generator with a fixed 5-second duration and a
// frequency derived only from that duration, never from lesson text) wrote
// WAV masters for the `*_intro` slot type only. Every later real-TTS pass
// skipped those files because they already existed on disk ("skip if
// exists" is standard across every generator script here), so the
// placeholder was never replaced.
//
// This script re-synthesizes real speech for exactly those existing
// `*ex*_intro.m4a` files (it never invents a filename that isn't already
// present — see findExistingExIntroFiles()), sourcing text straight from
// each lesson's own `avatar_coaching_copy.exN_intro` field in
// 07-app/content/lessons/*.json, using the real, currently-installed,
// currently-working TTS engine on this machine: the `kokoro` pip package
// (hexgrad/Kokoro-82M, cached locally under
// ~/.cache/huggingface/hub/models--hexgrad--Kokoro-82M). That model is
// reachable via a Python venv that has it installed — see
// resolveKokoroPython() below for how that venv is located.
//
// (`kokoro_onnx`, installed under this repo's own `.venv-kokoro` and
// `gapp-tts`, is a *different* PyPI package — it needs a separate .onnx
// model + voices.bin that were never downloaded anywhere on this machine,
// so it cannot synthesize anything as-is. It is not the live engine.)
//
// Usage:
//   node scripts/regenerate-ex-intros.mjs [--dry-run] [--lesson 3]
//
// Env:
//   KOKORO_PYTHON   Path to a python executable with `kokoro` + `soundfile`
//                    installed. Defaults to the venv this session found at
//                    C:\Users\<you>\guitar-loadtest\kokoro-venv\Scripts\python.exe

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const lessonsDir = path.join(repoRoot, '07-app', 'content', 'lessons');
const audioDir = path.join(repoRoot, '07-app', 'audio');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const lessonArgIdx = args.indexOf('--lesson');
const onlyLesson = lessonArgIdx !== -1 ? parseInt(args[lessonArgIdx + 1], 10) : null;

const KNOWN_PLACEHOLDER_MD5 = '11507e6c73326c665863b05ccc9cb1a8';

// ============================================================================
// Text normalization (mirrors generate-lesson-audio.mjs's normalizeForTTS,
// which is the correct rule set per 05-content/VOICE-GUIDE.md: "No bare
// chord symbols in spoken text - expand Em to E minor.")
// ============================================================================

function normalizeForTTS(text) {
  if (!text) return text;

  const chordMap = [
    [/\bEm\b/g, 'E minor'],
    [/\bAm\b/g, 'A minor'],
    [/\bDm\b/g, 'D minor'],
    [/\bBm\b/g, 'B minor'],
    [/\bA7\b/g, 'A seven'],
    [/\bE7\b/g, 'E seven'],
    [/\bD7\b/g, 'D seven'],
    [/\bG7\b/g, 'G seven'],
    [/\bC7\b/g, 'C seven'],
    [/\bF7\b/g, 'F seven'],
    [/\bSus2\b/gi, 'suspended two'],
    [/\bSus4\b/gi, 'suspended four'],
    [/\b(\w+)add9\b/g, '$1 add nine'],
    [/\b(\w+)aug\b/g, '$1 augmented'],
    [/\b(\w+)dim\b/g, '$1 diminished'],
  ];

  let normalized = text;
  for (const [pattern, replacement] of chordMap) {
    normalized = normalized.replace(pattern, replacement);
  }

  normalized = normalized
    .replace(/[\u2014\u2013]/g, ', ') // em/en dash -> pause
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\.\s+\./g, '.')
    .replace(/\s+/g, ' ')
    .trim();

  return normalized;
}

// ============================================================================
// Locate the working kokoro Python environment
// ============================================================================

function resolveKokoroPython() {
  if (process.env.KOKORO_PYTHON && fs.existsSync(process.env.KOKORO_PYTHON)) {
    return process.env.KOKORO_PYTHON;
  }
  const candidates = [
    path.join(os.homedir(), 'guitar-loadtest', 'kokoro-venv', 'Scripts', 'python.exe'),
    path.join(os.homedir(), 'guitar-loadtest', 'kokoro-venv', 'bin', 'python'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

// ============================================================================
// Find lesson JSON files and existing exN_intro audio files
// ============================================================================

function loadLessonFiles() {
  return fs
    .readdirSync(lessonsDir)
    .filter((f) => /^guitar-lesson-\d{2}-.*\.json$/.test(f))
    .sort();
}

function lessonNumFromFilename(f) {
  const m = f.match(/^guitar-lesson-(\d{2})-/);
  return m ? parseInt(m[1], 10) : null;
}

// Only ever target files that ALREADY EXIST on disk as *ex*_intro.m4a.
// This guarantees we never invent a new slot/filename that wasn't part of
// the confirmed bug.
function findExistingExIntroFiles(lessonNum) {
  const voiceDir = path.join(audioDir, `l${String(lessonNum).padStart(2, '0')}-voice`);
  if (!fs.existsSync(voiceDir)) return [];
  return fs
    .readdirSync(voiceDir)
    .filter((f) => /ex\d+_intro\.m4a$/i.test(f))
    .map((f) => {
      const exMatch = f.match(/ex(\d+)_intro\.m4a$/i);
      return {
        voiceDir,
        m4aName: f,
        wavName: f.replace(/\.m4a$/i, '.wav'),
        exNum: parseInt(exMatch[1], 10),
      };
    })
    .sort((a, b) => a.exNum - b.exNum);
}

// ============================================================================
// Build the synthesis job list
// ============================================================================

function buildJobs() {
  const jobs = [];
  const lessonFiles = loadLessonFiles();

  for (const lessonFile of lessonFiles) {
    const lessonNum = lessonNumFromFilename(lessonFile);
    if (lessonNum === null) continue;
    if (onlyLesson !== null && lessonNum !== onlyLesson) continue;

    const lessonPath = path.join(lessonsDir, lessonFile);
    const lesson = JSON.parse(fs.readFileSync(lessonPath, 'utf-8'));
    const coaching = lesson.avatar_coaching_copy || {};

    const existingFiles = findExistingExIntroFiles(lessonNum);
    for (const ef of existingFiles) {
      const key = `ex${ef.exNum}_intro`;
      const text = coaching[key];
      if (!text || typeof text !== 'string' || !text.trim()) {
        console.error(
          `[regenerate-ex-intros] WARNING: ${lessonFile} has no avatar_coaching_copy.${key} ` +
            `but ${ef.m4aName} exists on disk. Skipping this file.`,
        );
        continue;
      }
      jobs.push({
        lessonNum,
        lessonFile,
        exNum: ef.exNum,
        key,
        rawText: text,
        text: normalizeForTTS(text),
        outWavPath: path.join(ef.voiceDir, ef.wavName),
        outM4aPath: path.join(ef.voiceDir, ef.m4aName),
      });
    }
  }
  return jobs;
}

// ============================================================================
// Synthesize via the kokoro Python venv (one process, one model load, many
// texts - passed as a JSON job file so we pay the ~10s model-init cost once).
// ============================================================================

const PY_SYNTH_SCRIPT = `
import json, sys
import numpy as np
import soundfile as sf
from kokoro import KPipeline

jobs_path = sys.argv[1]
with open(jobs_path, "r", encoding="utf-8") as f:
    jobs = json.load(f)

pipeline = KPipeline(lang_code="a")
voice = "af_heart"

results = []
for job in jobs:
    text = job["text"]
    out_path = job["outWavPath"]
    gen = pipeline(text, voice=voice, speed=1.0)
    chunks = []
    for _, _, audio in gen:
        chunks.append(audio.numpy() if hasattr(audio, "numpy") else np.asarray(audio))
    audio_data = np.concatenate(chunks) if len(chunks) > 1 else chunks[0]
    sf.write(out_path, audio_data, 24000, subtype="PCM_16")
    duration = len(audio_data) / 24000.0
    results.append({"outWavPath": out_path, "duration": duration})
    print(f"  synthesized {out_path} ({duration:.2f}s)", flush=True)

with open(jobs_path + ".result.json", "w", encoding="utf-8") as f:
    json.dump(results, f)
`;

function synthesizeAll(jobs, pythonExe) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ex-intro-tts-'));
  const jobsPath = path.join(tmpDir, 'jobs.json');
  const scriptPath = path.join(tmpDir, 'synth.py');

  fs.writeFileSync(
    jobsPath,
    JSON.stringify(
      jobs.map((j) => ({ text: j.text, outWavPath: j.outWavPath })),
      null,
      2,
    ),
  );
  fs.writeFileSync(scriptPath, PY_SYNTH_SCRIPT, 'utf-8');

  console.log(`[regenerate-ex-intros] Synthesizing ${jobs.length} clips via ${pythonExe} ...`);
  const result = spawnSync(pythonExe, [scriptPath, jobsPath], {
    stdio: 'inherit',
    cwd: tmpDir,
  });

  if (result.status !== 0) {
    throw new Error(`kokoro synthesis subprocess exited with status ${result.status}`);
  }

  const resultPath = jobsPath + '.result.json';
  if (!fs.existsSync(resultPath)) {
    throw new Error('kokoro synthesis subprocess did not produce a result file');
  }
  return JSON.parse(fs.readFileSync(resultPath, 'utf-8'));
}

// ============================================================================
// Main
// ============================================================================

function md5OfFile(p) {
  return crypto.createHash('md5').update(fs.readFileSync(p)).digest('hex');
}

function main() {
  const jobs = buildJobs();
  console.log(`[regenerate-ex-intros] Found ${jobs.length} existing exN_intro clip(s) to regenerate.`);

  if (jobs.length === 0) {
    console.log('[regenerate-ex-intros] Nothing to do.');
    return;
  }

  if (dryRun) {
    for (const j of jobs) {
      console.log(`  L${String(j.lessonNum).padStart(2, '0')} ${j.key} -> ${j.outWavPath}`);
      console.log(`    "${j.text}"`);
    }
    console.log('[regenerate-ex-intros] Dry run - no synthesis performed.');
    return;
  }

  const pythonExe = resolveKokoroPython();
  if (!pythonExe) {
    console.error(
      '[regenerate-ex-intros] FATAL: could not find a Python venv with the `kokoro` ' +
        'package installed. Set KOKORO_PYTHON to a python executable that has ' +
        '`kokoro` and `soundfile` installed (the working install this session ' +
        'found lives at ~/guitar-loadtest/kokoro-venv/Scripts/python.exe).',
    );
    process.exit(1);
  }

  synthesizeAll(jobs, pythonExe);

  // Verify no collapse before declaring victory.
  const hashes = new Map();
  let collision = false;
  for (const j of jobs) {
    if (!fs.existsSync(j.outWavPath)) {
      console.error(`[regenerate-ex-intros] MISSING OUTPUT: ${j.outWavPath}`);
      collision = true;
      continue;
    }
    const hash = md5OfFile(j.outWavPath);
    if (hash === KNOWN_PLACEHOLDER_MD5) {
      console.error(`[regenerate-ex-intros] COLLISION with old placeholder hash: ${j.outWavPath}`);
      collision = true;
    }
    if (hashes.has(hash)) {
      console.error(
        `[regenerate-ex-intros] COLLISION: ${j.outWavPath} matches ${hashes.get(hash)}`,
      );
      collision = true;
    } else {
      hashes.set(hash, j.outWavPath);
    }
  }

  if (collision) {
    console.error('[regenerate-ex-intros] FAILED: collapse detected. Not touching manifest.');
    process.exit(1);
  }

  console.log(
    `[regenerate-ex-intros] OK: ${jobs.length} new WAV masters written, all hashes unique. ` +
      'Next: node scripts/transcode-audio.mjs',
  );
}

main();
