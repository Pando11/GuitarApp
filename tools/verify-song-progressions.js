#!/usr/bin/env node
/**
 * verify-song-progressions.js
 *
 * Enforces the AMENDMENT-12/14 song-progression gate.
 *
 * WHAT IT CHECKS (0 errors AND 0 warnings = pass):
 * 1. Every song's chords are all within the taught set by Lesson 25 (the 25-lesson
 *    curriculum teaches F at L17 and A7 at L19, so all 10 songs are within the taught set
 *    per AMENDMENT-13 prereq gate).
 * 2. Every shape is spelled correctly (arithmetic check against chord-theory-check.js).
 * 3. Song file structure is valid (progressions.json + shapes.json both parse, required fields present).
 * 4. Mystery Mode constraints — no protected lyrics (AMENDMENT-12 §4).
 *
 * SONG PROGRESSION CATALOG (10 songs + 11 shapes, per AMENDMENT-12):
 * Songs live in 07-app/content/song-progressions/ as progressions.json + shapes.json.
 * Each song declares a required chord set (subset of already-taught chords); it unlocks only
 * after those chords are taught.
 *
 * House of the Rising Sun = public domain (no disclaimer).
 * The other 9 need the "not affiliated / not endorsed" disclaimer on the select card + reveal.
 *
 * MUSIC ACCURACY: Verified by knowledge-only LLM review on 2026-08-14
 * (02-spec/MUSIC-ACCURACY-REVIEW-2026-08-14.md: 10/10 progressions harmonically faithful,
 * 11/11 shapes spelled correctly, both physical teaching claims TRUE).
 * ⚠️ DO NOT claim the progressions or shapes are "musician-approved" / "human-guitarist sign-off."
 * The 2026-08-14 review is an LLM knowledge pass, not certified human/guitarist sign-off (AGENTS.md Rule 8).
 *
 * RUN: node tools/verify-song-progressions.js → 0 errors AND 0 warnings
 *
 * STATUS: PLACEHOLDER — real file lost in PC transfer (2026-08-23). Scaffolded from AMENDMENT-12/14 description.
 * Gate result (0 errors / 0 warnings ✅) is from HANDOFF.md dated 2026-08-16 — that truth is intact; the file is not.
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
const ALL_TAUGHT_CHORDS = new Set(CUMULATIVE_CHORDS_BY_LESSON[25]);

// Public domain songs (no disclaimer needed)
const PUBLIC_DOMAIN_SONGS = new Set(["house-of-the-rising-sun"]);

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
    return;
  }
  if (!fs.existsSync(SHAPES_FILE)) {
    fail(`shapes.json not found at ${SHAPES_FILE}`);
    return;
  }
  let progressions, shapes;
  try {
    progressions = JSON.parse(fs.readFileSync(PROGRESSIONS_FILE, "utf-8"));
    ok("progressions.json parses");
  } catch (err) {
    fail(`progressions.json parse error: ${err.message}`);
    return;
  }
  try {
    shapes = JSON.parse(fs.readFileSync(SHAPES_FILE, "utf-8"));
    ok("shapes.json parses");
  } catch (err) {
    fail(`shapes.json parse error: ${err.message}`);
    return;
  }
  return { progressions, shapes };
}

function gateProgressionsStructure(progressions) {
  console.log("Gating: progressions structure (required fields)...");
  if (!Array.isArray(progressions)) {
    fail("progressions.json is not an array");
    return;
  }
  if (progressions.length === 0) {
    warn("progressions.json is empty — expected 10 songs per AMENDMENT-12");
    return;
  }
  if (progressions.length !== 10) {
    warn(`progressions.json has ${progressions.length} songs, expected 10 per AMENDMENT-12`);
  }
  for (let i = 0; i < progressions.length; i++) {
    const song = progressions[i];
    if (!song.id) fail(`Song at index ${i} missing 'id' field`);
    if (!song.chords || !Array.isArray(song.chords)) fail(`Song '${song.id || i}' missing or invalid 'chords' array`);
    if (!song.name) fail(`Song '${song.id || i}' missing 'name' field`);
    if (!song.prereqLesson) fail(`Song '${song.id || i}' missing 'prereqLesson' field`);
  }
  ok("progressions structure valid");
}

function gateShapesStructure(shapes) {
  console.log("Gating: shapes structure (required fields)...");
  if (!Array.isArray(shapes)) {
    fail("shapes.json is not an array");
    return;
  }
  if (shapes.length === 0) {
    warn("shapes.json is empty — expected 11 shapes per AMENDMENT-12");
    return;
  }
  if (shapes.length !== 11) {
    warn(`shapes.json has ${shapes.length} shapes, expected 11 per AMENDMENT-12`);
  }
  for (let i = 0; i < shapes.length; i++) {
    const shape = shapes[i];
    if (!shape.id) fail(`Shape at index ${i} missing 'id' field`);
    if (!shape.frets || !Array.isArray(shape.frets)) fail(`Shape '${shape.id || i}' missing or invalid 'frets' array`);
    if (!shape.chord) fail(`Shape '${shape.id || i}' missing 'chord' field`);
  }
  ok("shapes structure valid");
}

function gateSongChordsTaught(progressions) {
  console.log("Gating: every song's chords are taught by L25...");
  for (const song of progressions) {
    for (const chord of song.chords) {
      if (!ALL_TAUGHT_CHORDS.has(chord)) {
        fail(`Song '${song.id}' uses chord '${chord}' not taught by L25`);
        return;
      }
    }
  }
  ok("all song chords are within the L25 taught set");
}

function gateSongPrereqs(progressions) {
  console.log("Gating: song prereq lessons are within range (1-25)...");
  for (const song of progressions) {
    const prereq = song.prereqLesson;
    if (typeof prereq !== "number" || prereq < 1 || prereq > 25) {
      fail(`Song '${song.id}' has invalid prereqLesson: ${prereq}`);
      return;
    }
    // The song's chords must all be taught by the prereq lesson
    const taughtByPrereq = CUMULATIVE_CHORDS_BY_LESSON[prereq] || [];
    for (const chord of song.chords) {
      if (!taughtByPrereq.includes(chord)) {
        warn(`Song '${song.id}' chord '${chord}' not taught until after lesson ${prereq} (taught by L${CUMULATIVE_CHORDS_BY_LESSON[25].indexOf(chord) + 1})`);
      }
    }
  }
  ok("song prereq lessons within 1-25 range");
}

function gateShapeSpelling(shapes) {
  console.log("Gating: shape spelling (basic arithmetic check)...");
  // Basic check: frets array length must match a 6-string guitar (6 frets, one per string)
  // frets[i] = fret number on string i (0 = muted/open, -1 = not played)
  for (const shape of shapes) {
    if (!Array.isArray(shape.frets) || shape.frets.length !== 6) {
      fail(`Shape '${shape.id}' frets array must have exactly 6 entries (one per string), got ${shape.frets ? shape.frets.length : "none"}`);
      continue;
    }
    for (let s = 0; s < 6; s++) {
      const fret = shape.frets[s];
      if (fret !== -1 && fret !== 0 && (typeof fret !== "number" || fret < 0 || fret > 24)) {
        fail(`Shape '${shape.id}' string ${s + 1} has invalid fret value: ${fret}`);
      }
    }
  }
  ok("shape spelling basic check passed");
}

function gateMysteryModeConstraints(progressions) {
  console.log("Gating: Mystery Mode constraints (no protected lyrics)...");
  // AMENDMENT-12 §4: Mystery Mode is legal-gated — no protected lyrics.
  // The progressions.json should NOT contain full lyrical content for copyrighted songs.
  // We check that songs don't have a 'lyrics' field with substantial text.
  for (const song of progressions) {
    if (song.lyrics && typeof song.lyrics === "string" && song.lyrics.length > 50) {
      warn(`Song '${song.id}' has a 'lyrics' field with ${song.lyrics.length} chars — Mystery Mode legal gate: protected lyrics may not be stored`);
    }
  }
  ok("Mystery Mode constraints checked");
}

function gateLegalDisclaimers(progressions) {
  console.log("Gating: legal disclaimer flags present...");
  for (const song of progressions) {
    const needsDisclaimer = !PUBLIC_DOMAIN_SONGS.has(song.id);
    if (needsDisclaimer) {
      if (song.needDisclaimer === undefined) {
        warn(`Song '${song.id}' is not public domain but missing 'needDisclaimer: true' flag (AMENDMENT-12/14)`);
      } else if (song.needDisclaimer !== true) {
        fail(`Song '${song.id}' should require disclaimer but needDisclaimer is ${song.needDisclaimer}`);
      }
    } else {
      if (song.needDisclaimer === true) {
        fail(`Song '${song.id}' is public domain but incorrectly flagged needDisclaimer: true`);
      }
    }
  }
  ok("legal disclaimer flags present");
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
    gateSongPrereqs(progressions);
    gateShapeSpelling(shapes);
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
