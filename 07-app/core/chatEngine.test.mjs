// chatEngine.test.mjs — guards the chat guardrail's chord detection.
//
// Added at the 2026-09-06 world/app merge. The two branches shipped two
// different CHORD_NAME regexes, each with a defect the other did not have, and
// nothing in the suite caught either one. This file is that missing coverage.
//
// RUN: node 07-app/core/chatEngine.test.mjs

import { CHORD_NAME, isOnTopic, askCoach, reply, replyWithCoach, deriveActionsFromReply, setLessons } from "./chatEngine.js";
import * as telemetry from "./telemetry.js";
import { PracticeStore } from "./practiceStore.js";

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

// --- askCoach -> coach_served telemetry is landed by the time askCoach ------
// resolves, not just "eventually" ---------------------------------------------
//
// Regression coverage added 2026-09-07: logCoachServed() used to fire an
// unawaited import('./telemetry.js').then(...) chain, so askCoach() could
// resolve before the coach_served event actually reached the queue. Found
// while live-verifying W6.1 — server/test/real-call.smoke.mjs called
// telemetry.getQueue() right after `await askCoach(...)` and saw it empty
// even though the model call had genuinely succeeded.
console.log("\nchatEngine — askCoach coach_served telemetry timing");

telemetry._resetTelemetry();
const modelResult = await askCoach(
  { learnerProfile: {}, lessonId: "L01", mastery: [] },
  "local fallback text",
  {
    fetchImpl: async () => ({
      ok: true,
      json: async () => ({ prose: "A real model line.", source: "model" }),
    }),
  },
);
check("askCoach (model success) returns source: model", modelResult.source === "model");
const queueAfterModel = telemetry.getQueue();
check(
  "coach_served is already in the queue immediately after awaiting askCoach (model path)",
  queueAfterModel.length === 1 && queueAfterModel[0].event === "coach_served" && queueAfterModel[0].payload.source === "model",
  `queue: ${JSON.stringify(queueAfterModel)}`,
);

telemetry._resetTelemetry();
const fallbackResult = await askCoach(
  { learnerProfile: {}, lessonId: "L01", mastery: [] },
  "local fallback text",
  { fetchImpl: async () => { throw new Error("network down"); } },
);
check("askCoach (service unreachable) falls back to the local template", fallbackResult.text === "local fallback text" && fallbackResult.source === "template");
const queueAfterFallback = telemetry.getQueue();
check(
  "coach_served is already in the queue immediately after awaiting askCoach (fallback path)",
  queueAfterFallback.length === 1 && queueAfterFallback[0].event === "coach_served" && queueAfterFallback[0].payload.source === "template",
  `queue: ${JSON.stringify(queueAfterFallback)}`,
);

telemetry._resetTelemetry();

// ---------------------------------------------------------------------------
// Ticket 4 (issue #7) — deriveActionsFromReply() / replyWithCoach() actions.
// Actions are always locally derived from reply()'s own already-verified
// drill lookup (Ban 6) — never produced by the model.
// ---------------------------------------------------------------------------
console.log("\nchatEngine — deriveActionsFromReply / replyWithCoach actions");

check("deriveActionsFromReply(null) does not throw and returns []", (() => { try { return deriveActionsFromReply(null).length === 0; } catch (e) { return false; } })());
check("deriveActionsFromReply({}) (no drill) returns []", deriveActionsFromReply({}).length === 0);

const fakeReplyWithDrill = {
  persona: "Sage",
  offTopic: false,
  text: "Let's work on your Em.",
  drill: { lessonId: "L05", lessonTitle: "Lesson 5", exerciseName: "Anchor drill", coaching: "Find the anchor finger first.", chordPair: ["Em", "C"], isStepDrill: true },
};
const actions = deriveActionsFromReply(fakeReplyWithDrill);
check("a matched drill produces exactly one start_drill action", actions.length === 1 && actions[0].type === "start_drill");
check("the start_drill action carries the real lessonId/exerciseName/chordPair", actions[0].lessonId === "L05" && actions[0].exerciseName === "Anchor drill" && JSON.stringify(actions[0].chordPair) === JSON.stringify(["Em", "C"]));
check("the drillId is composed from real fields, not invented content", actions[0].drillId === "L05:Anchor drill");

setLessons([
  { lessonId: "L05", title: "Lesson 5", exercises: [{ name: "Anchor drill", coaching: "Find the anchor finger first.", params: { chord_pair: ["Em", "C"] } }] },
]);
const store = new PracticeStore({});
const localOnly = reply(store, "T1", "my Em is buzzing and hard to hold");
check("reply() found the real curriculum drill for a struggle signal + named chord", !!localOnly.drill);

const coachedWithModel = await replyWithCoach(store, "T1", "my Em is buzzing and hard to hold", { learnerProfile: {}, lessonId: "L05", mastery: [] }, {
  fetchImpl: async () => ({ ok: true, json: async () => ({ prose: "Slow your Em down and let it ring.", source: "model" }) }),
});
check("replyWithCoach uses the model's text when the service answers", coachedWithModel.text === "Slow your Em down and let it ring." && coachedWithModel.source === "model");
check("replyWithCoach's actions are locally derived even when the text came from the model", coachedWithModel.actions.length === 1 && coachedWithModel.actions[0].type === "start_drill" && coachedWithModel.actions[0].exerciseName === "Anchor drill");

const offTopicResult = await replyWithCoach(store, "T1", "what's the weather like today", {}, {});
check("an off-topic message never produces an action and never calls the network", offTopicResult.offTopic === true && offTopicResult.actions.length === 0);

setLessons([]);

console.log(`\nCHAT ENGINE GATE: ${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
