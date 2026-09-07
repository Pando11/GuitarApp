// chatEngine.js — F4 teacher chat.
// PORTED from 06-prototypes/step6/chat/chatEngine.js, INCLUDING the Loop-A
// drill-serving branch that was dropped in the first port. The proven original
// does more than generic encouragement: when the student's record shows a
// struggled chord (or they name one), it serves a REAL drill pulled from the
// lesson JSON — "Let's work on your Em — try this: Find the anchor… (Lesson
// L05-…)". That branch is restored here so the fidelity gate matches the
// proven engine byte-for-byte.
//
// Bans preserved:
//   Ban 5: ZERO network. Lesson data is passed in or read LOCAL-only.
//   Ban 6: cites ONLY real lesson data (exercise name, coaching, chord pair,
//          lesson id) and ONLY real practice-data keys (struggled/clean chords).
//          Never invents a physical diagnosis or a drill that isn't in the
//          curriculum. If no drill matches, falls back to data-derived
//          encouragement text.
//
// Browser note: app.js imports this module in the browser, where `fs` does not
// exist and `require` is undefined (ESM). Lesson data is therefore INJECTED by
// the caller (see setLessons): the browser feeds its catalog; the Node tests
// feed the 05-content source. loadLessons() returns the injected set, so the
// port needs no Node fs import and stays browser-safe.

export const PERSONA = {
  T1: { name: 'Sage', style: 'emerald-hollow',
        open: "Easy does it. Let's keep the next strum clean.",
        struggled: (c) => `Your ${c} is still giving you a little trouble. Slow it down and let the shape settle before the next strum.`,
        clean: (c) => `Your ${c} is sounding cleaner now. Keep that relaxed hand and do it once more.` },
  T2: { name: 'Ellis Nakamura', style: 'zen',
        open: "Breathe. Then play.",
        struggled: (c) => `Your ${c} is not yet clean. That is information, not failure. Slow down, and let it speak.`,
        clean: (c) => `Your ${c} is clean now. Notice the calm, even tone.` },
  T3: { name: 'Ray Boudreaux', style: 'drill',
        open: "Again. Cleaner this time.",
        struggled: (c) => `Your ${c} isn't clean yet. Reps fix that — run it ten times clean.`,
        clean: (c) => `Your ${c} is clean. Good. Now do it again so it sticks.` }
};

export const PRACTICE_TERM = /guitar|chord|strum|string|fret|practice|lesson|finger|tune|tuning|metronome|teacher|pick|buzz|tone|tempo|barre|drill|scale|fretboard|chord chart|play|playing/i;
// Chord detection. Two rules, and they exist for different reasons:
//
//   1. A and B need an accidental or a quality suffix ("Am", "A7", "Bb").
//      A bare case-insensitive "a" would otherwise match the English article
//      and drag every off-topic message ("can you write a poem") past
//      isOnTopic(). C-G have no such collision, so their suffix is optional.
//   2. Qualities may be compound: "m7", "maj7", "sus4" — not just "m" or "7".
//
// Resolved at the 2026-09-06 world/app merge, where the two branches disagreed.
// The 06-prototypes/step6 form enforced rule 1 but not rule 2 (it rejects
// "Am7"); the 07-app form enforced rule 2 but not rule 1 (it accepts "a").
// This form enforces both. Covered by chatEngine.test.mjs.
// The trailing guard is a lookahead, not \b: a name can legally end in "#"
// ("A#"), and \b will not anchor between "#" and end-of-string.
const CHORD_QUALITY = "(?:(?:maj|min|m|dim|aug|sus|add)\\d{0,2}|\\d{1,2})";
const CHORD_END = "(?![A-Za-z0-9#])";
export const CHORD_NAME = new RegExp(
  `\\b[C-G](?:#|b)?${CHORD_QUALITY}?${CHORD_END}` +
    `|\\b[AB](?:(?:#|b)${CHORD_QUALITY}?|${CHORD_QUALITY})${CHORD_END}`,
  "i"
);
export const OFFTOPIC_SUBJECT = /stock|invest|investing|price|market|football|soccer|sport|sports|rent|landlord|weather|climate|politics|election|news|recipe|movie|film|tv|show|game|video game|friend|friends|work|job|boss|doctor|health|crypto|bitcoin|money|bank|loan|tax|stock price/i;
export const PROGRESS_Q = /how (am|are|is) (i|we|my|things)|my progress|am i improving|how('?s| is) it going/i;
export const COMMAND_VERB = /\b(write|code|script|program|build|create|compose|translate|summarize|calculate|compose|draw|generate|design a|make me a)\b/i;

export function isOnTopic(text) {
  if (!text || typeof text !== 'string') return false;
  if (OFFTOPIC_SUBJECT.test(text)) return false;
  if (COMMAND_VERB.test(text) && !PRACTICE_TERM.test(text) && !CHORD_NAME.test(text) && !PROGRESS_Q.test(text)) return false;
  if (PRACTICE_TERM.test(text)) return true;
  if (CHORD_NAME.test(text)) return true;
  if (PROGRESS_Q.test(text)) return true;
  return false;
}

const OFFTOPIC = "I'm here for your guitar practice — ask me about chords, buzzing strings, or your next lesson and I'll help.";

// ---------------------------------------------------------------------------
// Drill lookup (pure). Mirrors 06-prototypes/step6/drillSelector.js.
// A drill is "for chord X" when its params.chord_pair array contains X. We
// return the first match. Callers pass an already-loaded `lessons` array (the
// browser feeds it from its catalog; Node tests feed the 05-content source).
// ---------------------------------------------------------------------------
export function findDrillForChord(chordName, lessons) {
  if (!chordName || typeof chordName !== 'string' || !chordName.trim()) return null;
  const c = chordName.trim();
  const list = lessons || [];
  for (const lesson of list) {
    for (const ex of (lesson.exercises || [])) {
      const pair = (ex.params && ex.params.chord_pair) || [];
      if (Array.isArray(pair) && pair.includes(c)) {
        return {
          lessonId: lesson.lessonId || (lesson.lesson && lesson.lesson.id) || '',
          lessonTitle: lesson.title || (lesson.lesson && lesson.lesson.title) || '',
          exerciseName: ex.name,
          coaching: ex.coaching || '',
          chordPair: pair,
          isStepDrill: /\b(air|anchor|find|first|mini|slow|step|lift|land)\b/i.test(ex.name || '')
        };
      }
    }
  }
  return null;
}

export function drillForStruggle(store, lessons) {
  const struggled = store.getStruggledChords();
  if (!struggled.length) return null;
  return findDrillForChord(struggled[0], lessons);
}

// Injected lesson set (browser catalog, or the test's 05-content mirror). This
// is the ONLY data source loadLessons consults, keeping the module browser-safe.
let _lessons = null;
export function setLessons(lessons) { _lessons = Array.isArray(lessons) ? lessons : null; }
export function getLessons() { return _lessons || []; }

// Returns the injected lessons. Under Node (tests) callers set them via
// setLessons(); the browser does the same from its catalog. Returns [] if none
// were injected (safe fallback — chat still works, just without served drills).
export function loadLessons() { return getLessons(); }

// ---------------------------------------------------------------------------
// T1.4 — coachClient seam.
//
// The coaching service (server/, T1.1) turns a facts envelope into 2-3
// sentences of model-written prose and ALWAYS answers 200 {prose, source}
// — even on its own timeout/guardrail-rejection/rate-limit, it falls back to
// a template internally. So from this client's point of view, "falling
// back to the local templates below" only happens when the HTTP call itself
// fails: network error, non-200 status, or the request timing out client-side.
// A 200 response with {source: 'template'} is still a normal successful
// response — it is NOT a client-side error — but it still counts as a
// fallback for telemetry, since the service didn't get a model line out.
//
// Ban 5 (zero network) governs the deterministic reply() logic above, which
// never changes: it stays fully local. This seam is additive and only used
// by askCoach()/replyWithCoach() below, which are new entry points — nothing
// above this point talks to the network, so reply()'s existing callers and
// tests are unaffected.
// ---------------------------------------------------------------------------

const DEFAULT_COACH_URL = 'http://127.0.0.1:8787/coach';
const DEFAULT_COACH_TIMEOUT_MS = 2500;

// Lazily resolved so this module has no hard dependency on telemetry.js at
// import time (keeps existing tests, which never call askCoach/replyWithCoach,
// completely unaffected). Awaited by askCoach() below (fixed 2026-09-07 — this
// used to fire the import().then() without awaiting it, so askCoach() could
// resolve and return to its caller before the telemetry write had actually
// landed; a caller checking telemetry.getQueue() right after `await
// askCoach(...)` could see an empty queue even on a real, successful model
// response). Still never throws into the coaching flow.
async function logCoachServed(source, latencyMs) {
  try {
    const telemetry = await import('./telemetry.js');
    if (telemetry && typeof telemetry.log === 'function') {
      telemetry.log('coach_served', { payload: { source, latencyMs } });
    }
  } catch (e) { /* non-fatal: telemetry must never break coaching */ }
}

// Calls the coaching service with a facts envelope. Resolves to
// { prose, source: 'model'|'template' } on any 200 response, or `null` when
// the service is unreachable, errors, times out, or answers non-200 — the
// caller (askCoach) treats `null` as "use the local template fallback".
// Never throws.
export async function coachClient(envelope, options = {}) {
  const url = options.url || DEFAULT_COACH_URL;
  const timeoutMs = typeof options.timeoutMs === 'number' ? options.timeoutMs : DEFAULT_COACH_TIMEOUT_MS;
  const fetchImpl = options.fetchImpl || (typeof fetch === 'function' ? fetch : null);
  if (!fetchImpl) return null;

  const controller = (typeof AbortController === 'function') ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
  try {
    const res = await fetchImpl(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(envelope || {}),
      signal: controller ? controller.signal : undefined,
    });
    if (!res || !res.ok) return null;
    const data = await res.json();
    if (!data || typeof data.prose !== 'string') return null;
    const source = data.source === 'model' ? 'model' : 'template';
    return { prose: data.prose, source };
  } catch (e) {
    return null; // network error, abort/timeout, bad JSON — all fall back.
  } finally {
    if (timer) clearTimeout(timer);
  }
}

// Tries the coaching service first; on any failure (see coachClient above),
// falls back to the given local template string/function. Fires the
// `coach_served` telemetry event either way. `localTemplate` may be a string
// or a zero-arg function returning one (so callers can defer building the
// fallback text until it's actually needed).
export async function askCoach(envelope, localTemplate, options = {}) {
  const start = (typeof performance !== 'undefined' && typeof performance.now === 'function')
    ? performance.now()
    : Date.now();
  const result = await coachClient(envelope, options);
  const end = (typeof performance !== 'undefined' && typeof performance.now === 'function')
    ? performance.now()
    : Date.now();
  const latencyMs = Math.max(0, Math.round(end - start));

  const fallbackText = typeof localTemplate === 'function' ? localTemplate() : localTemplate;

  if (result && result.source === 'model') {
    await logCoachServed('model', latencyMs);
    return { text: result.prose, source: 'model', latencyMs };
  }
  if (result && result.source === 'template') {
    // The service itself fell back internally — still a fallback for
    // telemetry purposes, but we prefer ITS template prose (it has the same
    // facts envelope) over the local one when available.
    await logCoachServed('template', latencyMs);
    return { text: result.prose, source: 'template', latencyMs };
  }
  // Service unreachable/errored/non-200 — use the local template.
  await logCoachServed('template', latencyMs);
  return { text: fallbackText, source: 'template', latencyMs };
}

// Convenience wrapper: same shape as reply(), but tries the coaching service
// first for the final text of an on-topic response, falling back to reply()'s
// existing local logic untouched. Off-topic replies never hit the network —
// there is nothing coachable about them.
export async function replyWithCoach(store, teacherId, message, envelope, options = {}) {
  const local = reply(store, teacherId, message);
  if (local.offTopic) return { ...local, source: 'local' };
  const coached = await askCoach(envelope, local.text, options);
  return { ...local, text: coached.text, source: coached.source, latencyMs: coached.latencyMs };
}

export function reply(store, teacherId, message) {
  const p = PERSONA[teacherId] || PERSONA.T1;
  if (!isOnTopic(message)) return { persona: p.name, offTopic: true, text: OFFTOPIC };

  // Loop A (TASK-A1): detect a struggle signal or a named chord, then serve a
  // REAL drill from the lesson data + record the ask (so Loop C2 follows up on
  // the exact thing).
  const lessons = getLessons();

  const struggleSignal = /\b(can'?t|can not|struggl|stuck|hard|difficult|getting|get it|figure|won'?t|not ringing|not clean|muted|buzz)\b/i.test(message);
  const namedChord = (message.match(CHORD_NAME) || [])[0];
  const targetChord = namedChord || (struggleSignal ? (store.getStruggledChords()[0] || null) : null);

  if (targetChord) {
    const drill = findDrillForChord(targetChord, lessons) || drillForStruggle(store, lessons);
    if (drill) {
      // Record the ask against the REAL chord the drill is for (not a
      // false-positive chord name from the message) so Loop C2 follows up right.
      const realChord = drill.chordPair.includes(targetChord) ? targetChord : drill.chordPair[0];
      try { store.studentRequested(realChord); } catch (e) { /* non-fatal */ }
      const drillText =
        `Let's work on your ${realChord}. Try this: "${drill.exerciseName}"` +
        (drill.coaching ? ` — ${drill.coaching}` : '') +
        ` (Lesson ${drill.lessonId}). Run it a few times and tell me how it goes.`;
      return { persona: p.name, offTopic: false, drill: drill, text: drillText };
    }
    // No drill found -> fall back to data-derived encouragement (Ban 6 safe).
    const struggled = store.getStruggledChords();
    const clean = store.getCleanChords();
    const fb = struggled.length ? p.struggled(struggled[0]) : (clean.length ? p.clean(clean[0]) : p.open + " Let's get your hands on the guitar — open Lesson 1.");
    return { persona: p.name, offTopic: false, text: fb };
  }

  // No specific chord targeted -> generic data-derived encouragement.
  const struggled = store.getStruggledChords();
  const clean = store.getCleanChords();
  let text;
  if (struggled.length) text = p.struggled(struggled[0]);
  else if (clean.length) text = p.clean(clean[0]);
  else text = p.open + " Let's get your hands on the guitar — open Lesson 1.";
  return { persona: p.name, offTopic: false, text };
}

export default {
  reply, isOnTopic, PERSONA, findDrillForChord, drillForStruggle, loadLessons, setLessons, getLessons,
  coachClient, askCoach, replyWithCoach,
};
