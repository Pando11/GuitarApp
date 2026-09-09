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
// question is the ONE field on this envelope carrying student prose rather
// than a stored fact. Capped shorter than MAX_STRING_LEN because it is typed
// by hand into a single-line input, and because it is echoed into the model's
// user message where an over-long value would crowd out the real facts.
const MAX_QUESTION_LEN = 300;
const MAX_MASTERY_ITEMS = 200;
const MAX_LESSON_CHORD_ITEMS = 24;
const MAX_CHORD_NAME_LEN = 12;
const STRINGS_ON_A_GUITAR = 6;
const MAX_FRET = 24;
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

// Every field here is optional, and so is the object itself.
//
// Changed 2026-09-08: each of these four was previously required, which made
// the whole service unreachable for exactly the students who need it most.
// The app's onboarding is deliberately skippable — index.html's banner says
// so in as many words, and the profile stays empty until the student fills it
// in — so a beginner who skipped it sent `learnerProfile: {}`, got a 400, and
// saw canned template prose every single time they asked a question. A
// partial profile is real data and is passed through; a missing field just
// means that fact is not known yet, which modelClient.js renders by omitting
// it rather than by writing "undefined" into the prompt.
//
// A field that is PRESENT but invalid is still an error: that's a caller bug,
// not a student who hasn't answered yet.
function validateLearnerProfile(raw, errors) {
  if (raw === undefined || raw === null) return undefined;
  if (!isPlainObject(raw)) {
    pushError(errors, 'learnerProfile', 'must be an object when present');
    return null;
  }
  const out = {};
  let ok = true;

  if (raw.ageBand !== undefined) {
    if (!AGE_BANDS.includes(raw.ageBand)) {
      pushError(errors, 'learnerProfile.ageBand', `must be one of ${AGE_BANDS.join(', ')}`);
      ok = false;
    } else {
      out.ageBand = raw.ageBand;
    }
  }

  if (raw.experience !== undefined) {
    if (!EXPERIENCE_LEVELS.includes(raw.experience)) {
      pushError(errors, 'learnerProfile.experience', `must be one of ${EXPERIENCE_LEVELS.join(', ')}`);
      ok = false;
    } else {
      out.experience = raw.experience;
    }
  }

  if (raw.goal !== undefined) {
    if (!isNonEmptyString(raw.goal, MAX_GOAL_LEN)) {
      pushError(errors, 'learnerProfile.goal', `must be a string of 1-${MAX_GOAL_LEN} chars`);
      ok = false;
    } else {
      out.goal = raw.goal;
    }
  }

  if (raw.minutesPerDay !== undefined) {
    if (!MINUTES_PER_DAY.includes(raw.minutesPerDay)) {
      pushError(errors, 'learnerProfile.minutesPerDay', `must be one of ${MINUTES_PER_DAY.join(', ')}`);
      ok = false;
    } else {
      out.minutesPerDay = raw.minutesPerDay;
    }
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

// lessonChords — the verified chord shapes the lesson the student is sitting
// in actually teaches, read straight off that lesson's own `chords` block by
// lesson-runner.js. Two jobs, both about telling truth from guesswork:
//
//   1. guardrail.js can tell the difference between the model inventing a
//      chord and the model naming the chord the lesson is about. Without
//      this a beginner on lesson 3, who has no recorded mastery yet, had
//      every answer about Em rejected.
//   2. modelClient.js can put the real fingering in the prompt. Asked "how
//      do I make Em sound clean?" with only the name to go on, the model
//      answered "third fret of the D string" on 2026-09-08 — Em is the
//      second fret. The guardrail could not catch it: spelled-out numbers
//      are deliberately not scanned. The fix is not a better checker, it is
//      not making the model guess something the lesson already knows.
//
// frets/fingers are the lesson's own arrays, six entries, low E to high e,
// null meaning muted. Optional: a lesson may name a chord it does not
// diagram, and a name alone is still worth sending for job 1.
function validateLessonChordShape(raw, index, errors) {
  const out = {};
  if (!isPlainObject(raw)) {
    pushError(errors, `lessonChords[${index}]`, 'must be an object');
    return null;
  }
  if (!isNonEmptyString(raw.chord, MAX_CHORD_NAME_LEN)) {
    pushError(errors, `lessonChords[${index}].chord`, `required string of 1-${MAX_CHORD_NAME_LEN} chars`);
    return null;
  }
  out.chord = raw.chord;

  for (const field of ['frets', 'fingers']) {
    if (raw[field] === undefined || raw[field] === null) continue;
    if (!Array.isArray(raw[field]) || raw[field].length !== STRINGS_ON_A_GUITAR) {
      pushError(errors, `lessonChords[${index}].${field}`, `must be an array of ${STRINGS_ON_A_GUITAR} entries, low E to high e`);
      return null;
    }
    const values = [];
    for (let i = 0; i < raw[field].length; i += 1) {
      const v = raw[field][i];
      if (v === null) { values.push(null); continue; }
      if (typeof v !== 'number' || !Number.isInteger(v) || v < 0 || v > MAX_FRET) {
        pushError(errors, `lessonChords[${index}].${field}[${i}]`, `must be null or an integer 0-${MAX_FRET}`);
        return null;
      }
      values.push(v);
    }
    out[field] = values;
  }

  return out;
}

function validateLessonChords(raw, errors) {
  if (raw === undefined || raw === null) return [];
  if (!Array.isArray(raw)) {
    pushError(errors, 'lessonChords', 'must be an array');
    return null;
  }
  if (raw.length > MAX_LESSON_CHORD_ITEMS) {
    pushError(errors, 'lessonChords', `too many items (max ${MAX_LESSON_CHORD_ITEMS})`);
    return null;
  }
  const out = [];
  for (let i = 0; i < raw.length; i += 1) {
    const shape = validateLessonChordShape(raw[i], i, errors);
    if (shape === null) return null;
    out.push(shape);
  }
  return out;
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

  // lessonId — optional, like stepId below it.
  //
  // Changed 2026-09-08: this was required, which made the practice/drill
  // screen unable to reach the model at all. That screen is not inside a
  // lesson — drillRunner.js passes lessonId null because there is genuinely no
  // lesson to name — so every "Ask your coach" from it was rejected with a 400
  // and answered from the local template. Requiring a field the caller cannot
  // honestly supply just pushes callers to invent one.
  if (body.lessonId === undefined || body.lessonId === null) {
    out.lessonId = null;
  } else if (isNonEmptyString(body.lessonId, MAX_STRING_LEN)) {
    out.lessonId = body.lessonId;
  } else {
    pushError(errors, 'lessonId', 'must be a string or null');
  }

  // stepId — optional, lesson-runner.js has no real step concept yet.
  if (body.stepId === undefined || body.stepId === null) {
    out.stepId = null;
  } else if (isNonEmptyString(body.stepId, MAX_STRING_LEN)) {
    out.stepId = body.stepId;
  } else {
    pushError(errors, 'stepId', 'must be a string or null');
  }

  // question — optional. When present, the student typed this themselves and
  // is owed an answer to it; when absent, the call is the original
  // unprompted-encouragement shape and behaves exactly as before. Validated
  // as an opaque string: no parsing, no interpretation here. modelClient.js
  // quotes it into the user message, and guardrail.js treats the chords and
  // numbers inside it as allowed tokens (a student who names Em is owed an
  // answer that says Em back).
  if (body.question === undefined || body.question === null) {
    out.question = null;
  } else if (isNonEmptyString(body.question, MAX_QUESTION_LEN)) {
    out.question = body.question;
  } else {
    pushError(errors, 'question', `must be a string of 1-${MAX_QUESTION_LEN} chars, or null`);
  }

  const mastery = validateMastery(body.mastery, errors);
  if (mastery !== null) out.mastery = mastery;

  const lessonChords = validateLessonChords(body.lessonChords, errors);
  if (lessonChords !== null) out.lessonChords = lessonChords;

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
