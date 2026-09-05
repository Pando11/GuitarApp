// schema.js — validates and whitelists the facts envelope before it ever
// reaches the model or the guardrail. Unknown fields (top-level or nested)
// are DROPPED by construction: we build a fresh object field-by-field and
// only ever copy values we've validated, never delete-from-input.
//
// Enum values verified against the live codebase, not invented:
//   - ageBand / experience / minutesPerDay: 07-app/core/learnerProfile.js
//     PROFILE_SCHEMA (ageBand: under-13/13-17/18-34/35-54/55+;
//     experience: never-held-one/tried-and-quit/returning-player;
//     minutesPerDay: 5/15/30/60 — NOTE the app's own schema has no "60+",
//     it's the literal number 60. TIER-1-make-ai-real.md's prose says
//     "60+" informally; we validate against the real enum, not the prose.
//   - mastery[].label: docs/adr/0001-always-on-encrypted-sync.md decision #5
//     and CONTEXT.md: mastered / needs_work / not_started.
//   - mastery[].confidence: CONTEXT.md — 0-100, NOT 0-1. (Note:
//     07-app/core/adaptivePlan.js's CONFIDENCE_FLOOR comment claims a 0..1
//     scale, which conflicts with CONTEXT.md/the ADR. We follow CONTEXT.md
//     here since it's the glossary of record; this conflict is flagged
//     separately for the lead to reconcile with T1.2.)

const AGE_BANDS = ['under-13', '13-17', '18-34', '35-54', '55+'];
const EXPERIENCE_LEVELS = ['never-held-one', 'tried-and-quit', 'returning-player'];
const MINUTES_PER_DAY = [5, 15, 30, 60];
const MASTERY_LABELS = ['mastered', 'needs_work', 'not_started'];

const MAX_GOAL_LEN = 200;
const MAX_ANON_ID_LEN = 128;
const MAX_STRING_LEN = 500; // generic ceiling for free-form-ish string fields
const MAX_MASTERY_ITEMS = 200;
const MAX_HISTORY_ITEMS = 200;

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function isNonEmptyString(v, maxLen) {
  return typeof v === 'string' && v.length >= 1 && v.length <= maxLen;
}

function pushError(errors, path, message) {
  errors.push(`${path}: ${message}`);
}

function validateLearnerProfile(raw, errors) {
  if (!isPlainObject(raw)) {
    pushError(errors, 'learnerProfile', 'required object');
    return null;
  }
  const out = {};
  let ok = true;

  if (!AGE_BANDS.includes(raw.ageBand)) {
    pushError(errors, 'learnerProfile.ageBand', `must be one of ${AGE_BANDS.join(', ')}`);
    ok = false;
  } else {
    out.ageBand = raw.ageBand;
  }

  if (!EXPERIENCE_LEVELS.includes(raw.experience)) {
    pushError(errors, 'learnerProfile.experience', `must be one of ${EXPERIENCE_LEVELS.join(', ')}`);
    ok = false;
  } else {
    out.experience = raw.experience;
  }

  if (!isNonEmptyString(raw.goal, MAX_GOAL_LEN)) {
    pushError(errors, 'learnerProfile.goal', `required string, 1-${MAX_GOAL_LEN} chars`);
    ok = false;
  } else {
    out.goal = raw.goal;
  }

  if (!MINUTES_PER_DAY.includes(raw.minutesPerDay)) {
    pushError(errors, 'learnerProfile.minutesPerDay', `must be one of ${MINUTES_PER_DAY.join(', ')}`);
    ok = false;
  } else {
    out.minutesPerDay = raw.minutesPerDay;
  }

  return ok ? out : null;
}

function validateMasteryItem(raw, index, errors) {
  if (!isPlainObject(raw)) {
    pushError(errors, `mastery[${index}]`, 'must be an object');
    return null;
  }
  let ok = true;
  const out = {};

  if (!isNonEmptyString(raw.chord, MAX_STRING_LEN)) {
    pushError(errors, `mastery[${index}].chord`, 'required string');
    ok = false;
  } else {
    out.chord = raw.chord;
  }

  if (!MASTERY_LABELS.includes(raw.label)) {
    pushError(errors, `mastery[${index}].label`, `must be one of ${MASTERY_LABELS.join(', ')}`);
    ok = false;
  } else {
    out.label = raw.label;
  }

  if (typeof raw.confidence !== 'number' || !Number.isFinite(raw.confidence) || raw.confidence < 0 || raw.confidence > 100) {
    pushError(errors, `mastery[${index}].confidence`, 'required number, 0-100');
    ok = false;
  } else {
    out.confidence = raw.confidence;
  }

  // Unknown nested fields (anything else on the item) are simply not copied.
  return ok ? out : null;
}

function validateMastery(raw, errors) {
  if (raw === undefined) return [];
  if (!Array.isArray(raw)) {
    pushError(errors, 'mastery', 'must be an array');
    return null;
  }
  if (raw.length > MAX_MASTERY_ITEMS) {
    pushError(errors, 'mastery', `too many items (max ${MAX_MASTERY_ITEMS})`);
    return null;
  }
  const out = [];
  let ok = true;
  raw.forEach((item, i) => {
    const v = validateMasteryItem(item, i, errors);
    if (v === null) ok = false;
    else out.push(v);
  });
  return ok ? out : null;
}

function validateJustHappened(raw, errors) {
  if (raw === undefined || raw === null) return null;
  if (!isPlainObject(raw)) {
    pushError(errors, 'justHappened', 'must be an object or null');
    return undefined; // signal error distinct from "valid null"
  }
  let ok = true;
  const out = {};

  if (!isNonEmptyString(raw.drillId, MAX_STRING_LEN)) {
    pushError(errors, 'justHappened.drillId', 'required string');
    ok = false;
  } else {
    out.drillId = raw.drillId;
  }

  if (typeof raw.passed !== 'boolean') {
    pushError(errors, 'justHappened.passed', 'required boolean');
    ok = false;
  } else {
    out.passed = raw.passed;
  }

  if (typeof raw.score !== 'number' || !Number.isFinite(raw.score)) {
    pushError(errors, 'justHappened.score', 'required number');
    ok = false;
  } else {
    out.score = raw.score;
  }

  if (typeof raw.ratePerMin !== 'number' || !Number.isFinite(raw.ratePerMin)) {
    pushError(errors, 'justHappened.ratePerMin', 'required number');
    ok = false;
  } else {
    out.ratePerMin = raw.ratePerMin;
  }

  return ok ? out : undefined;
}

function validateHistoryItem(raw, index, errors) {
  if (!isPlainObject(raw)) {
    pushError(errors, `recentHistory[${index}]`, 'must be an object');
    return null;
  }
  let ok = true;
  const out = {};

  if (!isNonEmptyString(raw.lessonId, MAX_STRING_LEN)) {
    pushError(errors, `recentHistory[${index}].lessonId`, 'required string');
    ok = false;
  } else {
    out.lessonId = raw.lessonId;
  }

  if (typeof raw.completedAt !== 'string' || Number.isNaN(Date.parse(raw.completedAt))) {
    pushError(errors, `recentHistory[${index}].completedAt`, 'required ISO date string');
    ok = false;
  } else {
    out.completedAt = raw.completedAt;
  }

  if (typeof raw.confidenceDelta !== 'number' || !Number.isFinite(raw.confidenceDelta)) {
    pushError(errors, `recentHistory[${index}].confidenceDelta`, 'required number');
    ok = false;
  } else {
    out.confidenceDelta = raw.confidenceDelta;
  }

  return ok ? out : null;
}

function validateRecentHistory(raw, errors) {
  if (raw === undefined) return [];
  if (!Array.isArray(raw)) {
    pushError(errors, 'recentHistory', 'must be an array');
    return null;
  }
  if (raw.length > MAX_HISTORY_ITEMS) {
    pushError(errors, 'recentHistory', `too many items (max ${MAX_HISTORY_ITEMS})`);
    return null;
  }
  const out = [];
  let ok = true;
  raw.forEach((item, i) => {
    const v = validateHistoryItem(item, i, errors);
    if (v === null) ok = false;
    else out.push(v);
  });
  return ok ? out : null;
}

/**
 * Validate + whitelist a raw parsed-JSON body into a sanitized facts
 * envelope. Never forwards unknown fields. Returns {ok, value, errors}.
 */
export function validateFactsEnvelope(body) {
  const errors = [];

  if (!isPlainObject(body)) {
    return { ok: false, value: null, errors: ['body: must be a JSON object'] };
  }

  const out = {};

  // anonId — ADDED beyond the tier doc's sample body. Required for
  // per-anonId rate limiting (T1.1 design plan's explicit addition).
  if (!isNonEmptyString(body.anonId, MAX_ANON_ID_LEN)) {
    pushError(errors, 'anonId', `required string, 1-${MAX_ANON_ID_LEN} chars`);
  } else {
    out.anonId = body.anonId;
  }

  const learnerProfile = validateLearnerProfile(body.learnerProfile, errors);
  if (learnerProfile) out.learnerProfile = learnerProfile;

  if (!isNonEmptyString(body.lessonId, MAX_STRING_LEN)) {
    pushError(errors, 'lessonId', 'required string');
  } else {
    out.lessonId = body.lessonId;
  }

  // stepId — optional, lesson-runner.js has no real step concept yet.
  if (body.stepId === undefined || body.stepId === null) {
    out.stepId = null;
  } else if (isNonEmptyString(body.stepId, MAX_STRING_LEN)) {
    out.stepId = body.stepId;
  } else {
    pushError(errors, 'stepId', 'must be a string or null');
  }

  const mastery = validateMastery(body.mastery, errors);
  if (mastery !== null) out.mastery = mastery;

  // validateJustHappened returns: null (valid, absent) | object (valid,
  // present) | undefined (invalid — an error was already pushed).
  const justHappened = validateJustHappened(body.justHappened, errors);
  if (justHappened !== undefined) {
    out.justHappened = justHappened;
  }

  const recentHistory = validateRecentHistory(body.recentHistory, errors);
  if (recentHistory !== null) out.recentHistory = recentHistory;

  if (errors.length) {
    return { ok: false, value: null, errors };
  }

  return { ok: true, value: out, errors: [] };
}
