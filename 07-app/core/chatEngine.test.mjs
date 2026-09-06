// chatEngine.test.mjs — guards the chat guardrail's chord detection.
//
// Added at the 2026-09-06 world/app merge. The two branches shipped two
// different CHORD_NAME regexes, each with a defect the other did not have, and
// nothing in the suite caught either one. This file is that missing coverage.
//
// RUN: node 07-app/core/chatEngine.test.mjs

import { CHORD_NAME, isOnTopic } from "./chatEngine.js";

let passed = 0;
let failed = 0;

function check(name, condition, detail = "") {
  if (condition) {
    passed++;
    console.log(`  PASS  ${name}`);
  } else {
    failed++;
    console.error(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function matches(text) {
  // CHORD_NAME has no /g flag, so .test is not stateful here.
  return CHORD_NAME.test(text);
}

console.log("chatEngine — CHORD_NAME");

// --- Rule 1: A/B need an accidental or a quality; C-G do not -----------------
for (const chord of ["C", "D", "E", "F", "G", "Em", "C7", "Dsus4", "Cm7", "Gmaj7"]) {
  check(`recognises "${chord}"`, matches(chord));
}
for (const chord of ["Am", "A7", "Am7", "Amaj7", "Bb", "A#", "Bm", "B7", "Bbmaj7"]) {
  check(`recognises "${chord}"`, matches(chord));
}

// A bare article must never read as a chord — this is the whole point of rule 1.
check('rejects the article "a" in prose', !matches("can you write a poem about the sea"));
check('rejects a bare "b"', !matches("plan b is fine"));

// --- Rule 2: compound qualities ---------------------------------------------
check('recognises "Am7" (compound quality on A)', matches("my Am7 sounds muted"));
check('recognises "Cmaj7" (compound quality on C-G)', matches("how do I play Cmaj7"));

// --- isOnTopic end-to-end ----------------------------------------------------
console.log("\nchatEngine — isOnTopic");

const onTopic = [
  "how do I play a C chord?",
  "my Em keeps failing, why?",
  "how am I doing?",
  "my Am7 sounds muted",
  "the G chord buzzes",
];
for (const text of onTopic) {
  check(`on-topic: "${text}"`, isOnTopic(text) === true);
}

const offTopic = [
  "can you write a poem about the sea",
  "write a program that sorts a list",
  "translate this into French",
  "what is the stock price today",
];
for (const text of offTopic) {
  check(`off-topic: "${text}"`, isOnTopic(text) === false);
}

console.log(`\nCHAT ENGINE GATE: ${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
