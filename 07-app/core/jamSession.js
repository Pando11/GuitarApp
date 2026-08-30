// BLOCKED: generative audio round-trip needs cloud GPU (ACE-Step/YuE on RunPod). On-device grading + facts done; generation pending GPU.
//
// jamSession.js — V2-JAM call-and-response jam session (A4.2).
//
// PART A (ON-DEVICE — buildable + testable in this session, no mic):
//   gradeStudentPhrase(heardChords, knownChords): chord-name arithmetic grading.
//   emitFacts(grade): facts-to-cloud payload. Audio NEVER leaves the device
//                     (AMENDMENT-05 — "The App That Listens"). Only facts are sent.
//
// PART B (GENERATIVE — STUBBED + FLAGGED BLOCKED):
//   generateResponse(facts): needs cloud GPU (ACE-Step / YuE on RunPod). There is
//   no GPU and no RunPod pod available this session, so it is intentionally
//   non-functional and surfaces a BLOCKed marker instead of faking audio.
//
// Chord vocabulary (root + quality) is aligned with 07-app/core/chord-theory-check.js
// (KNOWN_QUALITY_TOKEN). Grading is pure label arithmetic — no audio inference engine
// and no live microphone are required.

// ---------------------------------------------------------------------------
// Chord-name arithmetic helpers (no mic, no audio inference)
// ---------------------------------------------------------------------------

// Fold minor aliases the same way chord-theory-check tokenizes them.
const MINOR_ALIAS = { min: 'm' };
// Root = A-G optionally followed by # or b (e.g. "C", "F#", "Bb").
const ROOT_RE = /^([A-Ga-g][#b]?)/;

/**
 * normalizeChord(name) -> canonical chord label string.
 *   "C"   -> "C"
 *   "Em"  -> "Em"
 *   "cmin"-> "Cm"
 *   "AM"  -> "Am"
 * Used so grading compares chord identities, not string casing/spelling.
 */
export function normalizeChord(name) {
  if (typeof name !== 'string') return '';
  const s = name.trim();
  const m = s.match(ROOT_RE);
  if (!m) return s; // not a recognizable chord label; keep as-is for a fair miss
  const root = m[1].toUpperCase();
  let quality = s.slice(m[1].length).toLowerCase();
  if (MINOR_ALIAS[quality]) quality = MINOR_ALIAS[quality];
  return quality ? root + quality : root;
}

// ---------------------------------------------------------------------------
// PART A — On-device phrase grading
// ---------------------------------------------------------------------------

/**
 * gradeStudentPhrase(heardChords, knownChords)
 *
 * Grades the student's played phrase (a list of chord labels they actually
 * performed) against the lesson's known chord set (the canonical "call").
 *
 * @param {string[]} heardChords - chord labels the student played, in order.
 * @param {string[]} knownChords - chord labels that make up the lesson phrase.
 * @returns {{ matched: string[], missed: string[], accuracy: number }}
 *   matched  : heard chords that belong to the known set (in heard order).
 *   missed   : heard chords that are NOT in the known set (wrong/extra chords).
 *   accuracy : matched.length / known.length, clamped to [0, 1].
 *              (Known set of length 0 -> 0; nothing to match against.)
 *
 * Pure chord-name arithmetic. No audio is read, no mic is touched.
 */
export function gradeStudentPhrase(heardChords, knownChords) {
  const heard = Array.isArray(heardChords) ? heardChords : [];
  const known = Array.isArray(knownChords) ? knownChords : [];
  const knownNorm = known.map(normalizeChord);

  const matched = [];
  const missed = [];
  for (const h of heard) {
    const hn = normalizeChord(h);
    if (knownNorm.includes(hn)) matched.push(hn);
    else missed.push(hn);
  }

  const accuracy = known.length === 0 ? 0 : matched.length / known.length;
  return { matched, missed, accuracy };
}

// ---------------------------------------------------------------------------
// PART A — Facts-to-cloud payload (audio never leaves the device)
// ---------------------------------------------------------------------------

/**
 * emitFacts(grade)
 *
 * Converts an on-device grade into the ONLY thing that travels off the device:
 * a small, audio-free fact object. Per AMENDMENT-05 the raw audio must never be
 * uploaded — this payload is the honest, minimal summary the cloud receives.
 *
 * @param {{ matched: string[], missed: string[], accuracy: number }} grade
 * @returns {{ chordsMatched: string[], chordsMissed: string[], accuracy: number }}
 *   chordsMatched : labels the student got right.
 *   chordsMissed  : labels the student played that weren't in the phrase.
 *   accuracy      : 0..1 grade accuracy.
 *
 * The returned object contains FACTS ONLY — there is deliberately no `audio`,
 * `audioUrl`, `blob`, or any other audio-bearing field.
 */
export function emitFacts(grade) {
  if (!grade || typeof grade !== 'object') {
    throw new Error('emitFacts: expected a grade object from gradeStudentPhrase()');
  }
  const { matched = [], missed = [], accuracy = 0 } = grade;
  return {
    chordsMatched: Array.isArray(matched) ? matched : [],
    chordsMissed: Array.isArray(missed) ? missed : [],
    accuracy: typeof accuracy === 'number' && isFinite(accuracy) ? accuracy : 0,
  };
}

// ---------------------------------------------------------------------------
// PART B — Generative response (STUBBED + BLOCKED: needs cloud GPU)
// ---------------------------------------------------------------------------
// Intended contract (when unblocked on a cloud GPU):
//   input  : facts  — the object returned by emitFacts() (chordsMatched,
//                     chordsMissed, accuracy).
//   output : { audioUrl: string }  — URL/blob of a generated musical "response"
//                                    that answers the student's phrase (the
//                                    call-and-response "call" -> generated "response").
//
// Implementation requires a generative music model (ACE-Step) and/or a
// vocal/instrumental model (YuE) running on a cloud GPU (RunPod). This session
// has NO GPU and NO RunPod pod available, so generateResponse is intentionally
// stubbed to throw a BLOCKED marker — it must NOT silently synthesize fake audio.

/**
 * generateResponse(facts) — BLOCKED.
 * @param {{ chordsMatched: string[], chordsMissed: string[], accuracy: number }} facts
 * @returns {Promise<{ audioUrl: string }>}  // only when unblocked on cloud GPU
 * @throws {Error} with `.code === 'GEN_BLOCKED'` and `.blocked` marker — always,
 *         in this session.
 */
export async function generateResponse(facts) {
  // BLOCKED: generative audio round-trip needs cloud GPU (ACE-Step/YuE on RunPod).
  // On-device grading + facts done; generation pending GPU.
  const blocked = {
    ok: false,
    status: 'BLOCKED',
    reason:
      'generative audio round-trip needs cloud GPU (ACE-Step/YuE on RunPod); unavailable this session',
    inputFacts: facts || null,
    output: null,
  };
  const err = new Error(
    'generateResponse BLOCKED: cloud GPU (ACE-Step/YuE on RunPod) unavailable this session',
  );
  err.code = 'GEN_BLOCKED';
  err.blocked = blocked;
  throw err;
}
