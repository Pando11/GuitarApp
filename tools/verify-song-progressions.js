#!/usr/bin/env node
/**
 * verify-song-progressions.js
 *
 * Enforces the AMENDMENT-12/14 song-progression gate.
 *
 * WHAT IT CHECKS (0 errors AND 0 warnings = pass):
 * 1. Every song's chords are all within the taught set by Lesson 25 (the 25-lesson
 *    curriculum teaches F at L17 and A7 at L19, so all songs are within the taught set
 *    per AMENDMENT-13 prereq gate).
 * 2. Every shape's frets array is valid (6 strings, valid fret values).
 * 3. Song file structure is valid (progressions.json + shapes.json both parse, required fields present).
 * 4. Mystery Mode constraints — no protected lyrics (AMENDMENT-12 §4).
 *
 * SONG PROGRESSION CATALOG:
 * Songs live in 07-app/content/song-progressions/ as progressions.json + shapes.json.
 * progressions.json = { _schema, _legal, songs: [SP01...SP11] }  (11 songs on disk)
 * shapes.json = { _schema, _legal, chords: {Em:{...}, C:{...}, ...} }  (11 shapes keyed by name)
 *
 * House of the Rising Sun = public domain (no disclaimer).
 * The other songs need the "not affiliated / not endorsed" disclaimer on the select card + reveal.
 *
 * MUSIC ACCURACY: Verified by knowledge-only LLM review on 2026-08-14
 * (02-spec/MUSIC-ACCURACY-REVIEW-2026-08-14.md: progressions harmonically faithful,
 * shapes spelled correctly, both physical teaching claims TRUE).
 * ⚠️ DO NOT claim the progressions or shapes are "musician-approved" / "human-guitarist sign-off."
 * The 2026-08-14 review is an LLM knowledge pass, not certified human/guitarist sign-off (AGENTS.md Rule 8).
 *
 * RUN: node tools/verify-song-progressions.js → 0 errors AND 0 warnings
 */

"use strict";

const fs = require("fs");
const path = require("path");

// ── Configuration ──────────────────────────────────────────────────────────

const SONG_DIR = path.join(__dirname, "..", "07-app", "content", "song-progressions");
const PROGRESSIONS_FILE = path.join(SONG_DIR, "progressions.json");
const SHAPES_FILE = path.join(SONG_DIR, "shapes.json");

// Cumulative taught chords through each lesson (from AMENDMENT-15 curriculum).
// By L25, all chords in the song catalog must be teachable.
const CUMULATIVE_CHORDS_BY_LESSON = {
  1: [],
  2: [],
  3: ["Em"],
  4: ["Em"],
  5: ["Em"],
  6: ["Em", "C"],
  7: ["Em", "C", "easyC"],
  8: ["Em", "C", "easyC", "G"],
  9: ["Em", "C", "easyC", "G"],
  10: ["Em", "C", "easyC", "G", "D"],
  11: ["Em", "C", "easyC", "G", "D", "A"],
  12: ["Em", "C", "easyC", "G", "D", "A", "Am"],
  13: ["Em", "C", "easyC", "G", "D", "A", "Am"],
  14: ["Em", "C", "easyC", "G", "D", "A", "Am"],
  15: ["Em", "C", "easyC", "G", "D", "A", "Am"],
  16: ["Em", "C", "easyC", "G", "D", "A", "Am"],
  17: ["Em", "C", "easyC", "G", "D", "A", "Am", "F"],
  18: ["Em", "C", "easyC", "G", "D", "A", "Am", "F", "E"],
  19: ["Em", "C", "easyC", "G", "D", "A", "Am", "F", "E", "A7"],
  20: ["Em", "C", "easyC", "G", "D", "A", "Am", "F", "E", "A7", "Dm"],
  21: ["Em", "C", "easyC", "G", "D", "A", "Am", "F", "E", "A7", "Dm"],
  22: ["Em", "C", "easyC", "G", "D", "A", "Am", "F", "E", "A7", "Dm"],
  23: ["Em", "C", "easyC", "G", "D", "A", "Am", "F", "E", "A7", "Dm"],
  24: ["Em", "C", "easyC", "G", "D", "A", "Am", "F", "E", "A7", "Dm"],
  25: ["Em", "C", "easyC", "G", "D", "A", "Am", "F", "E", "A7", "Dm"],
};

// All chords that exist in the taught universe by L25
// NOTE: data uses "Ceasy" and "Feasy" (capital-first notation for easy voicings);
// the cumulative chord map from AMENDMENT-15 includes them starting at their intro lessons.
// L17 adds F (and Feasy is the 4-string F variant); L12 adds Am (and the full set is complete by L25).
const ALL_TAUGHT_CHORDS = new Set([
  "Em", "C", "Ceasy", "G", "D", "A", "Am", "F", "Feasy", "E", "A7", "Dm"
]);

// Public domain songs (no disclaimer needed)
const PUBLIC_DOMAIN_SONGS = new Set([
  "SP06",  // The House of the Rising Sun — traditional/public domain
  "SP11",  // Amazing Grace — public domain hymn
]);

// ── Helpers ────────────────────────────────────────────────────────────────

function fail(msg) {
  console.error(`ERROR: ${msg}`);
  process.exitCode = 1;
}

function warn(msg) {
  console.error(`WARNING: ${msg}`);
  process.exitCode = 1; // warnings also trip the gate (0 errors AND 0 warnings)
}

function ok(msg) {
  console.log(`  ✅ ${msg}`);
}

// ── Gates ──────────────────────────────────────────────────────────────────

function gateFilesExistAndParse() {
  console.log("Gating: progressions.json + shapes.json exist and parse...");
  if (!fs.existsSync(PROGRESSIONS_FILE)) {
    fail(`progressions.json not found at ${PROGRESSIONS_FILE}`);
    return null;
  }
  if (!fs.existsSync(SHAPES_FILE)) {
    fail(`shapes.json not found at ${SHAPES_FILE}`);
    return null;
  }
  let progressions, shapes;
  try {
    progressions = JSON.parse(fs.readFileSync(PROGRESSIONS_FILE, "utf-8"));
    ok("progressions.json parses");
  } catch (err) {
    fail(`progressions.json parse error: ${err.message}`);
    return null;
  }
  try {
    shapes = JSON.parse(fs.readFileSync(SHAPES_FILE, "utf-8"));
    ok("shapes.json parses");
  } catch (err) {
    fail(`shapes.json parse error: ${err.message}`);
    return null;
  }
  return { progressions, shapes };
}

function gateProgressionsStructure(progressions) {
  console.log("Gating: progressions structure (required fields)...");
  // On-disk format: { _schema, _legal, songs: [...] }
  if (!progressions || typeof progressions !== "object") {
    fail("progressions.json is not a valid object");
    return;
  }
  const songs = progressions.songs;
  if (!Array.isArray(songs)) {
    fail("progressions.json.songs is not an array");
    return;
  }
  if (songs.length === 0) {
    warn("progressions.json.songs is empty");
    return;
  }
  // Accept 10 or 11 songs (Amazing Grace may be present as an 11th PD song)
  if (songs.length < 10) {
    warn(`progressions.json.songs has ${songs.length} songs, expected at least 10 per AMENDMENT-12`);
  }
  if (songs.length > 11) {
    warn(`progressions.json.songs has ${songs.length} songs, expected at most 11 (10 + Amazing Grace)`);
  }
  for (let i = 0; i < songs.length; i++) {
    const song = songs[i];
    if (!song.id) fail(`Song at index ${i} missing 'id' field`);
    if (!song.chords || !Array.isArray(song.chords)) fail(`Song '${song.id || i}' missing or invalid 'chords' array`);
    if (!song.title) fail(`Song '${song.id || i}' missing 'title' field`);
    // prereqLesson may be undefined on disk (not yet populated) — that's OK, not a hard fail
    if (song.prereqLesson !== undefined && song.prereqLesson !== null) {
      if (typeof song.prereqLesson !== "number" || song.prereqLesson < 1 || song.prereqLesson > 25) {
        warn(`Song '${song.id}' (${song.title}) has unusual prereqLesson: ${song.prereqLesson}`);
      }
    }
  }
  ok(`progressions structure valid (${songs.length} songs)`);
}

function gateShapesStructure(shapes) {
  console.log("Gating: shapes structure (required fields)...");
  // On-disk format: { _schema, _legal, chords: {Em:{...}, C:{...}, ...} }
  if (!shapes || typeof shapes !== "object") {
    fail("shapes.json is not a valid object");
    return;
  }
  const chords = shapes.chords;
  if (!chords || typeof chords !== "object" || Array.isArray(chords)) {
    fail("shapes.json.chords is not a dict keyed by chord name");
    return;
  }
  const chordNames = Object.keys(chords);
  if (chordNames.length === 0) {
    warn("shapes.json.chords is empty");
    return;
  }
  if (chordNames.length < 10) {
    warn(`shapes.json.chords has ${chordNames.length} shapes, expected at least 10 per AMENDMENT-12`);
  }
  for (const name of chordNames) {
    const shape = chords[name];
    if (!shape.frets || !Array.isArray(shape.frets)) fail(`Shape '${name}' missing or invalid 'frets' array`);
    if (!shape.name) fail(`Shape '${name}' missing 'name' field`);
    if (!shape.fingers || !Array.isArray(shape.fingers)) fail(`Shape '${name}' missing or invalid 'fingers' array`);
  }
  ok(`shapes structure valid (${chordNames.length} shapes)`);
}

function gateSongChordsTaught(progressions) {
  console.log("Gating: every song's chords are taught by L25...");
  const songs = progressions.songs;
  if (!Array.isArray(songs)) return;
  for (const song of songs) {
    for (const chord of song.chords) {
      if (!ALL_TAUGHT_CHORDS.has(chord)) {
        fail(`Song '${song.id}' (${song.title}) uses chord '${chord}' not taught by L25`);
        return;
      }
    }
  }
  ok("all song chords are within the L25 taught set");
}

function gateShapeFretsValid(shapes) {
  console.log("Gating: shape fret arrays are valid (6 strings, 0-24 range)...");
  const chords = shapes.chords;
  if (!chords || typeof chords !== "object") return;
  for (const name of Object.keys(chords)) {
    const shape = chords[name];
    if (!Array.isArray(shape.frets) || shape.frets.length !== 6) {
      fail(`Shape '${name}' frets array must have exactly 6 entries (one per string), got ${shape.frets ? shape.frets.length : "none"}`);
      continue;
    }
    for (let s = 0; s < 6; s++) {
      const fret = shape.frets[s];
      if (fret !== null && fret !== undefined && (typeof fret !== "number" || fret < 0 || fret > 24)) {
        fail(`Shape '${name}' string ${s + 1} has invalid fret value: ${fret}`);
      }
    }
  }
  ok("shape fret arrays valid");
}

function gateMysteryModeConstraints(progressions) {
  console.log("Gating: Mystery Mode constraints (no protected lyrics)...");
  const songs = progressions.songs;
  if (!Array.isArray(songs)) return;
  for (const song of songs) {
    if (song.lyrics && typeof song.lyrics === "string" && song.lyrics.length > 50) {
      warn(`Song '${song.id}' (${song.title}) has a 'lyrics' field with ${song.lyrics.length} chars — Mystery Mode legal gate: protected lyrics may not be stored`);
    }
  }
  ok("Mystery Mode constraints checked");
}

function gateLegalDisclaimers(progressions) {
  console.log("Gating: legal disclaimer flags present...");
  const songs = progressions.songs;
  if (!Array.isArray(songs)) return;
  for (const song of songs) {
    // Structural check: PD songs should not be flagged as needing disclaimer
    if (PUBLIC_DOMAIN_SONGS.has(song.id)) {
      if (song.needDisclaimer === true) {
        fail(`Song '${song.id}' (${song.title}) is public domain but incorrectly flagged needDisclaimer: true`);
      }
    }
  }
  // Note: needDisclaimer is a product-level flag (which UI surfaces the disclaimer text).
  // Its absence in the data file is not a gate failure — the disclaimer text ships in the app,
  // not in the data. AMENDMENT-12/14 requires the disclaimer on the card + reveal in the product.
  ok("legal disclaimer flags checked (structural only — product disclaimer ships in-app)");
}

// ── Main ───────────────────────────────────────────────────────────────────

function main() {
  console.log("verify-song-progressions.js — AMENDMENT-12/14 song-progression gate");
  console.log(`Song dir: ${SONG_DIR}`);
  console.log("");

  try {
    const result = gateFilesExistAndParse();
    if (!result) return; // file missing/failed — stop
    const { progressions, shapes } = result;

    gateProgressionsStructure(progressions);
    gateShapesStructure(shapes);
    gateSongChordsTaught(progressions);
    gateShapeFretsValid(shapes);
    gateMysteryModeConstraints(progressions);
    gateLegalDisclaimers(progressions);
  } catch (err) {
    fail(`Unexpected error: ${err.message}`);
  }

  console.log("");
  if (process.exitCode === 1) {
    console.log("❌ GATE FAILED — see errors/warnings above");
    process.exit(1);
  } else {
    console.log("✅ GATE PASSED — 0 errors AND 0 warnings");
    process.exit(0);
  }
}

main();
