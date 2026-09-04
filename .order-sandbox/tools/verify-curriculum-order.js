#!/usr/bin/env node
/**
 * verify-curriculum-order.js
 *
 * Enforces the AMENDMENT-15 curriculum ordering gate.
 *
 * WHAT IT CHECKS (0 errors = pass):
 * 1. Filename/manifest/id triple-agreement — every lesson file, the manifest, and the
 *    canonical order all agree on lesson IDs.
 * 2. No-forward-prereqs — no lesson requires a chord that isn't taught in itself or an
 *    earlier lesson.
 * 3. Pedagogical ordering invariants — Em first, F deferred, capstone last, etc.
 * 4. Capstone-last — L25 consolidation-performance is the final lesson.
 * 5. No absolute-beginner-after-graduate — the three absolute-beginner lessons (holding-the-pick,
 *    switching-em-and-c, first-three-chord-song) are NOT after the capstone.
 *
 * AMENDMENT-15 current order (25 lessons):
 * 01 welcome-anatomy-tuning
 * 02 holding-the-pick
 * 03 first-chord-em
 * 04 second-chord-first-song
 * 05 strumming-in-time
 * 06 switching-em-and-c
 * 07 chord-changes-em-easyc
 * 08 new-chord-g
 * 09 first-three-chord-song
 * 10 new-chord-d
 * 11 new-chord-a
 * 12 new-chord-am-big-four
 * 13 four-chord-songs
 * 14 up-strums
 * 15 strumming-patterns
 * 16 faster-chord-changes
 * 17 new-chord-f
 * 18 new-chord-e
 * 19 new-chord-a7
 * 20 minor-progressions-dm
 * 21 dynamics-alternating-bass
 * 22 capo-basics
 * 23 fingerpicking-travis
 * 24 read-chord-chart-tab
 * 25 consolidation-performance  (capstone — ALWAYS LAST)
 *
 * F moved L24→L17, A7 L25→L19, three absolute-beginner lessons pulled from after the capstone
 * to L2/L6/L9 (2026-08-14).
 *
 * RUN: node tools/verify-curriculum-order.js → 0 errors
 *
 * Also run the adversarial test: bash tools/test-curriculum-order.sh → 9/9 (8 adversarial RED + 1 pristine control GREEN)
 *
 * DO NOT append new lessons after the capstone — insert and re-run tools/resequence-curriculum.js.
 * The script refuses unless the on-disk manifest matches the OLD order (protects against the exact
 * defect AMENDMENT-15 fixed).
 */

"use strict";

const fs = require("fs");
const path = require("path");

// ── Configuration ──────────────────────────────────────────────────────────

const CONTENT_DIR = path.join(__dirname, "..", "07-app", "content", "lessons");
const MANIFEST_FILE = path.join(CONTENT_DIR, "manifest.json");

// Canonical order from AMENDMENT-15 (25 lessons, capstone LAST)
const CANONICAL_ORDER = [
  "welcome-anatomy-tuning",
  "holding-the-pick",
  "first-chord-em",
  "second-chord-first-song",
  "strumming-in-time",
  "switching-em-and-c",
  "chord-changes-em-easyc",
  "new-chord-g",
  "first-three-chord-song",
  "new-chord-d",
  "new-chord-a",
  "new-chord-am-big-four",
  "four-chord-songs",
  "up-strums",
  "strumming-patterns",
  "faster-chord-changes",
  "new-chord-f",
  "new-chord-e",
  "new-chord-a7",
  "minor-progressions-dm",
  "dynamics-alternating-bass",
  "capo-basics",
  "fingerpicking-travis",
  "read-chord-chart-tab",
  "consolidation-performance",
];

// Each lesson's taught chords (cumulative through the group).
// This map must match the actual lesson JSON chord data — drift = failure.
const LESSON_CHORDS = {
  "welcome-anatomy-tuning": [],
  "holding-the-pick": [],
  "first-chord-em": ["Em"],
  "second-chord-first-song": ["Em"],
  "strumming-in-time": ["Em"],
  "switching-em-and-c": ["Em", "C"],
  "chord-changes-em-easyc": ["Em", "C", "easyC"],
  "new-chord-g": ["Em", "C", "easyC", "G"],
  "first-three-chord-song": ["Em", "C", "easyC", "G"],
  "new-chord-d": ["Em", "C", "easyC", "G", "D"],
  "new-chord-a": ["Em", "C", "easyC", "G", "D", "A"],
  "new-chord-am-big-four": ["Em", "C", "easyC", "G", "D", "A", "Am"],
  "four-chord-songs": ["Em", "C", "easyC", "G", "D", "A", "Am"],
  "up-strums": ["Em", "C", "easyC", "G", "D", "A", "Am"],
  "strumming-patterns": ["Em", "C", "easyC", "G", "D", "A", "Am"],
  "faster-chord-changes": ["Em", "C", "easyC", "G", "D", "A", "Am"],
  "new-chord-f": ["Em", "C", "easyC", "G", "D", "A", "Am", "F"],
  "new-chord-e": ["Em", "C", "easyC", "G", "D", "A", "Am", "F", "E"],
  "new-chord-a7": ["Em", "C", "easyC", "G", "D", "A", "Am", "F", "E", "A7"],
  "minor-progressions-dm": ["Em", "C", "easyC", "G", "D", "A", "Am", "F", "E", "A7", "Dm"],
  "dynamics-alternating-bass": ["Em", "C", "easyC", "G", "D", "A", "Am", "F", "E", "A7", "Dm"],
  "capo-basics": ["Em", "C", "easyC", "G", "D", "A", "Am", "F", "E", "A7", "Dm"],
  "fingerpicking-travis": ["Em", "C", "easyC", "G", "D", "A", "Am", "F", "E", "A7", "Dm"],
  "read-chord-chart-tab": ["Em", "C", "easyC", "G", "D", "A", "Am", "F", "E", "A7", "Dm"],
  "consolidation-performance": ["Em", "C", "easyC", "G", "D", "A", "Am", "F", "E", "A7", "Dm"],
};

// Absolute-beginner lessons — must be BEFORE the capstone (L25)
const ABSOLUTE_BEGINNER = new Set([
  "holding-the-pick",
  "switching-em-and-c",
  "first-three-chord-song",
]);

// ── Helpers ────────────────────────────────────────────────────────────────

function fail(msg) {
  console.error(`ERROR: ${msg}`);
  process.exitCode = 1;
}

function ok(msg) {
  console.log(`  ✅ ${msg}`);
}

// Extract the slug from a filename like "guitar-lesson-03-first-chord-em.json"
// Strips: "guitar-lesson-" prefix, leading "NN-" number, and ".json" suffix
function slugFromFilename(fname) {
  return fname
    .replace(/^guitar-lesson-/, "")   // → "03-first-chord-em.json"
    .replace(/^\d+-/, "")              // → "first-chord-em.json"
    .replace(/\.json$/, "");           // → "first-chord-em"
}

// ── Gates ──────────────────────────────────────────────────────────────────

function gateFilenamesMatchCanonical() {
  console.log("Gating: filenames match canonical order...");
  const files = fs.readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith(".json") && f !== "manifest.json")
    .sort();
  const actualIds = files.map(slugFromFilename);
  const expectedIds = CANONICAL_ORDER;

  if (actualIds.length !== expectedIds.length) {
    fail(`Lesson count mismatch: actual=${actualIds.length}, canonical=${expectedIds.length}`);
    return;
  }

  for (let i = 0; i < expectedIds.length; i++) {
    if (actualIds[i] !== expectedIds[i]) {
      fail(`Order mismatch at position ${i + 1}: actual='${actualIds[i]}', canonical='${expectedIds[i]}'`);
      return;
    }
  }
  ok("filenames match canonical order (25 lessons)");
}

function gateManifestMatchesFiles() {
  console.log("Gating: manifest.json matches lesson files...");
  if (!fs.existsSync(MANIFEST_FILE)) {
    fail(`manifest.json not found at ${MANIFEST_FILE}`);
    return;
  }
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_FILE, "utf-8"));
  const files = fs.readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith(".json") && f !== "manifest.json")
    .sort();

  if (!Array.isArray(manifest.files)) {
    fail("manifest.json.files is not an array");
    return;
  }

  const manifestIds = manifest.files.map(slugFromFilename);
  const fileIds = files.map(slugFromFilename);

  if (manifestIds.length !== fileIds.length) {
    fail(`Manifest file count (${manifestIds.length}) != file count (${fileIds.length})`);
    return;
  }

  for (let i = 0; i < fileIds.length; i++) {
    if (manifestIds[i] !== fileIds[i]) {
      fail(`Manifest/file mismatch at position ${i + 1}: manifest='${manifestIds[i]}', file='${fileIds[i]}'`);
      return;
    }
  }
  ok("manifest.json matches lesson files");
}

function gateNoForwardPrereqs() {
  console.log("Gating: no forward prereqs (chords taught before used)...");
  const cumulative = new Set();
  for (const id of CANONICAL_ORDER) {
    const taught = LESSON_CHORDS[id] || [];
    for (const chord of taught) {
      if (!cumulative.has(chord) && chord !== taught[0]) {
        const isNewChord = taught.length === 1 || chord === taught[taught.length - 1];
        if (!cumulative.has(chord) && !isNewChord) {
          fail(`Lesson '${id}' uses chord '${chord}' not yet taught (cumulative: ${[...cumulative].join(", ") || "none"})`);
          return;
        }
      }
    }
    for (const chord of taught) cumulative.add(chord);
  }
  ok("no forward prereqs");
}

function gateCapstoneLast() {
  console.log("Gating: capstone is last...");
  const last = CANONICAL_ORDER[CANONICAL_ORDER.length - 1];
  if (last !== "consolidation-performance") {
    fail(`Capstone is not last: '${last}' at position ${CANONICAL_ORDER.length}`);
    return;
  }
  ok("capstone (consolidation-performance) is L25, last");
}

function gateNoBeginnerAfterCapstone() {
  console.log("Gating: no absolute-beginner lessons after capstone...");
  const capstoneIdx = CANONICAL_ORDER.indexOf("consolidation-performance");
  for (const id of ABSOLUTE_BEGINNER) {
    const idx = CANONICAL_ORDER.indexOf(id);
    if (idx > capstoneIdx) {
      fail(`Absolute-beginner lesson '${id}' is after the capstone (position ${idx + 1} vs capstone at ${capstoneIdx + 1})`);
      return;
    }
  }
  ok("no absolute-beginner lessons after capstone");
}

function gatePedagogicalOrder() {
  console.log("Gating: pedagogical ordering invariants...");
  const emIdx = CANONICAL_ORDER.indexOf("first-chord-em");
  const fIdx = CANONICAL_ORDER.indexOf("new-chord-f");
  const capstoneIdx = CANONICAL_ORDER.indexOf("consolidation-performance");

  if (emIdx > fIdx) {
    fail(`Em (L${emIdx + 1}) comes after F (L${fIdx + 1}) — Em must be first chord taught`);
    return;
  }
  if (fIdx > capstoneIdx) {
    fail(`F (L${fIdx + 1}) is after the capstone — F is deferred in the beginner spine`);
    return;
  }
  ok("pedagogical order: Em first, F deferred, capstone last");
}

// ── Main ───────────────────────────────────────────────────────────────────

function main() {
  console.log("verify-curriculum-order.js — AMENDMENT-15 ordering gate");
  console.log(`Content dir: ${CONTENT_DIR}`);
  console.log("");

  try {
    gateFilenamesMatchCanonical();
    gateManifestMatchesFiles();
    gateNoForwardPrereqs();
    gateCapstoneLast();
    gateNoBeginnerAfterCapstone();
    gatePedagogicalOrder();
  } catch (err) {
    fail(`Unexpected error: ${err.message}`);
  }

  console.log("");
  if (process.exitCode === 1) {
    console.log("❌ GATE FAILED — see errors above");
    process.exit(1);
  } else {
    console.log("✅ GATE PASSED — 0 errors");
    process.exit(0);
  }
}

main();
