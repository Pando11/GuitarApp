// coachSurface.js — Wave 1 task C: coach envelope assembly + minimal coach
// entry point.
//
// Rule 5: this module NEVER invents or synthesizes a field. It only ever
// copies values that were literally present on its inputs, whitelisted down
// to exactly the shape server/src/schema.js's validateFactsEnvelope()
// accepts (read directly from that file, not guessed):
//   { anonId, learnerProfile: {ageBand, experience, goal, minutesPerDay},
//     lessonId, stepId, mastery: [{chord, label, confidence}],
//     justHappened: {drillId, passed, score, ratePerMin} | null,
//     recentHistory: [{lessonId, completedAt, confidenceDelta}] }
//
// The verified chord shapes the open lesson teaches, taken off that lesson's
// own `chords` block. Facts about the page, not about the student, and the
// reason server-side guardrail.js will let Sage name Em to a beginner who has
// no recorded number for it yet — and the reason Sage states the real
// fingering instead of guessing one. Same fail-safe posture as everything
// else here: anything malformed is dropped, and bad input yields [] rather
// than throwing.
function pickFretArray(raw) {
  if (!Array.isArray(raw) || raw.length !== 6) return null;
  const out = [];
  for (const v of raw) {
    if (v === null) { out.push(null); continue; }
    if (typeof v !== 'number' || !Number.isInteger(v) || v < 0 || v > 24) return null;
    out.push(v);
  }
  return out;
}

function pickLessonChords(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  const seen = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue;
    const name = typeof entry.chord === 'string' ? entry.chord.trim() : '';
    if (!name || name.length > 12) continue;
    if (seen.indexOf(name) !== -1) continue;
    seen.push(name);
    const shape = { chord: name };
    const frets = pickFretArray(entry.frets);
    if (frets) shape.frets = frets;
    const fingers = pickFretArray(entry.fingers);
    if (fingers) shape.fingers = fingers;
    out.push(shape);
    if (out.length >= 24) break;
  }
  return out;
}

// buildCoachEnvelope() accepts {anonId, learnerProfile, lessonId, mastery,
// justHappened, recentHistory}. anonId is picked through verbatim when it's
// a non-empty string within server/src/schema.js's MAX_ANON_ID_LEN (128
// chars) — never generated here; callers source it from telemetry.js's
// getAnonId() (the same stable per-device id already used for event
// logging). When the caller passes no anonId (or an invalid one), it's
// simply omitted — same fail-safe posture as every other field — and the
// server's schema rejects the request as missing `anonId`, so askCoach
// degrades to the local template, same as before this was wired up.
//
// Fixed 2026-09-07: previously this signature had no anonId parameter at
// all, so every request from any caller (practice screen, lesson screen)
// was rejected by the server and silently fell back to template prose. See
// docs/plans/STATUS.md's Wave 6 close-out notes.
//
// mastery is on a 0-100 confidence scale (see adaptivePlan.js's
// CONFIDENCE_FLOOR=60) — never rescaled to 0-1 here.
//
// Malformed/missing input (mastery not an array, justHappened not an
// object, etc.) must never throw: buildCoachEnvelope degrades to a safe,
// empty-but-well-typed envelope for that field instead.

import { askCoach } from './chatEngine.js';

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function pickLearnerProfile(raw) {
  if (!isPlainObject(raw)) return undefined;
  const out = {};
  if (typeof raw.ageBand === 'string') out.ageBand = raw.ageBand;
  if (typeof raw.experience === 'string') out.experience = raw.experience;
  if (typeof raw.goal === 'string') out.goal = raw.goal;
  if (typeof raw.minutesPerDay === 'number') out.minutesPerDay = raw.minutesPerDay;
  return out;
}

function pickMasteryItem(raw) {
  if (!isPlainObject(raw)) return null;
  const out = {};
  let ok = false;
  if (typeof raw.chord === 'string') { out.chord = raw.chord; ok = true; }
  if (typeof raw.label === 'string') { out.label = raw.label; ok = true; }
  if (typeof raw.confidence === 'number' && Number.isFinite(raw.confidence)) {
    out.confidence = raw.confidence;
    ok = true;
  }
  return ok ? out : null;
}

function pickMastery(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (const item of raw) {
    const v = pickMasteryItem(item);
    if (v) out.push(v);
  }
  return out;
}

function pickJustHappened(raw) {
  if (!isPlainObject(raw)) return null;
  const out = {};
  if (typeof raw.drillId === 'string') out.drillId = raw.drillId;
  if (typeof raw.passed === 'boolean') out.passed = raw.passed;
  if (typeof raw.score === 'number' && Number.isFinite(raw.score)) out.score = raw.score;
  if (typeof raw.ratePerMin === 'number' && Number.isFinite(raw.ratePerMin)) out.ratePerMin = raw.ratePerMin;
  return Object.keys(out).length ? out : null;
}

function pickHistoryItem(raw) {
  if (!isPlainObject(raw)) return null;
  const out = {};
  if (typeof raw.lessonId === 'string') out.lessonId = raw.lessonId;
  if (typeof raw.completedAt === 'string') out.completedAt = raw.completedAt;
  if (typeof raw.confidenceDelta === 'number' && Number.isFinite(raw.confidenceDelta)) out.confidenceDelta = raw.confidenceDelta;
  return out;
}

function pickRecentHistory(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (const item of raw) {
    const v = pickHistoryItem(item);
    if (v) out.push(v);
  }
  return out;
}

// server/src/schema.js's MAX_ANON_ID_LEN — duplicated here (not imported)
// because the server is deployed independently from this static client
// bundle and shares no code across that boundary (see server/README.md).
const MAX_ANON_ID_LEN = 128;

function pickAnonId(raw) {
  return (typeof raw === 'string' && raw.length > 0 && raw.length <= MAX_ANON_ID_LEN) ? raw : undefined;
}

// server/src/schema.js's MAX_QUESTION_LEN — duplicated here for the same
// reason MAX_ANON_ID_LEN is (no shared code across the client/server
// boundary). Trimmed and length-checked but never rewritten: the student's
// own words are what the server quotes to the model, so altering them here
// would change the question being answered. Over-length input is dropped
// rather than truncated, which degrades to the ordinary no-question call —
// the same fail-safe posture as every other field on this envelope.
const MAX_QUESTION_LEN = 300;

function pickQuestion(raw) {
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  return (trimmed.length > 0 && trimmed.length <= MAX_QUESTION_LEN) ? trimmed : undefined;
}

// buildCoachEnvelope — pure, never throws. Assembles exactly the facts
// envelope shape server/src/schema.js validates, passing through only
// fields literally present on the input. Never invents a field.
export function buildCoachEnvelope({ anonId, learnerProfile, lessonId, lessonChords, mastery, justHappened, recentHistory, question } = {}) {
  const envelope = {};

  const id = pickAnonId(anonId);
  if (id) envelope.anonId = id;

  const lp = pickLearnerProfile(learnerProfile);
  if (lp) envelope.learnerProfile = lp;

  if (typeof lessonId === 'string') envelope.lessonId = lessonId;

  const q = pickQuestion(question);
  if (q) envelope.question = q;

  envelope.lessonChords = pickLessonChords(lessonChords);

  envelope.mastery = pickMastery(mastery);

  const jh = pickJustHappened(justHappened);
  if (jh) envelope.justHappened = jh;

  envelope.recentHistory = pickRecentHistory(recentHistory);

  return envelope;
}

// getCoachMessage — calls chatEngine.js's askCoach(envelope, localTemplate, {})
// and returns just {text, source}. Never throws: askCoach itself never
// throws (coachClient swallows all network/parse errors) and falls back to
// localTemplate whenever the service is unreachable/errors/times out.
export async function getCoachMessage(envelope, localTemplate) {
  const result = await askCoach(envelope, localTemplate, {});
  return { text: result.text, source: result.source };
}

export default { buildCoachEnvelope, getCoachMessage };
