'use strict';
/*
 * voice-command.js — F10 "Voice-first practice controls" (core feature).
 *
 * Hands are on the guitar, so the student speaks: "slower" / "again" / "what's next" /
 * "tune my guitar" to control the lesson player. v1 is WAKE-FREE tap-to-talk (a mic
 * button captures speech; the device STT turns it to text; this module maps text ->
 * a player intent). Always-listening wake word is v2 (battery/permissions) — out of scope.
 *
 * Design (mirrors the project's proven testability discipline):
 *   - This module is BROWSER-FREE / DOM-FREE. It does NOT capture mic audio or run STT
 *     itself (those are device boundaries, stubbed in the player). It takes RECOGNIZED
 *     TEXT and returns a deterministic INTENT. That mapping is unit-testable without a mic.
 *   - Intents drive a PlayerAdapter the real player supplies (slower/again/whats-next).
 *     "tune my guitar" delegates to the REUSED tuner engine (step2) — no reimplementation.
 *   - GUARDRAILED (Hard Rule 6 / F4 spirit): out-of-scope speech ("order pizza", "what's
 *     the weather") is REJECTED (intent=ignore), never executed as a lesson control.
 *   - DETERMINISTIC: same text -> same intent (no randomness), so the mapping is verifiable.
 *
 * Run its DONE BAR: node verify-voice.js
 */

// Canonical intents.
const INTENTS = {
  SLOWER: 'slower',            // slow the playback tempo
  AGAIN: 'again',              // replay current scene from the top
  WHATS_NEXT: 'whats-next',    // advance to the next scene / tell what's next
  TUNE: 'tune-my-guitar',      // hand off to the tuner
  IGNORE: 'ignore'             // out of scope — do nothing
};

// Keyword/phrase patterns per intent. Ordered; first match wins. Phrases are
// lowercased, punctuation-stripped before matching. We match on SUBSTRINGS so that
// natural speech ("can you slow it down a bit") still resolves, not exact commands.
const PATTERNS = [
  { intent: INTENTS.SLOWER, words: ['slower', 'slow down', 'slow it', 'too fast', 'speed down', 'slower please', 'slow'] },
  { intent: INTENTS.AGAIN, words: ['again', 'repeat', 'replay', 'one more time', 'do it again', 'play it again'] },
  { intent: INTENTS.WHATS_NEXT, words: ['next', "what's next", 'what is next', 'what comes next', 'move on', 'continue', 'go on', 'next part', 'next scene'] },
  { intent: INTENTS.TUNE, words: ['tune', 'tune my guitar', 'tune up', 'out of tune', 'tuning', 'detune'] },
  // Explicit out-of-scope rejection patterns (defence in depth beyond the miss-default).
  // Pass-2 HOLE-D: dropped trailing spaces ('call '/'open ') — hasPhrase word-boundary
  // made them dead. Pass-2 HOLE-E: IGNORE is checked FIRST in parseCommand so
  // 'play music again'/'email slower' can't execute a lesson control.
  { intent: INTENTS.IGNORE, words: ['pizza', 'weather', 'news', 'call', 'text', 'email', 'remind me to', 'play music', 'open', 'movie', 'tv', 'shopping'] }
];

// Negation words — if any appear, the command is rejected (HOLE-1 fix).
// Pass-2 HOLE-A: added can't/cannot/won't/nope/nah/quit forms.
// Pass-3 HOLE-1: added skip/never mind/cut it out/dontcha refusal forms.
// Pass-4 HOLE-3: added hold on/hang on/give me a sec/pause/shut up/later.
const NEGATIONS = ['don t', 'dont', 'do not', 'doesn t', 'doesnt', 'no', 'not', 'never', 'stop', 'enough',
  'can t', 'cant', 'cannot', 'won t', 'wont', 'nope', 'nah', 'quit',
  'skip', 'never mind', 'nevermind', 'cut it out', 'dontcha', 'don tcha', 'wait',
  'hold on', 'hang on', 'give me a sec', 'pause', 'shut up', 'later'];

function normalize(text) {
  // Pass-5 HOLE-1: type guard — a corrupted STT layer passing truthy non-strings
  // (numbers, booleans, arrays) crashed on .toLowerCase. Coerce defensively.
  return String(text == null ? '' : text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')   // strip punctuation
    .replace(/\s+/g, ' ')
    .trim();
}

// Word-boundary phrase match (HOLE-2 fix). Prevents 'against' matching 'again',
// 'nextdoor' matching 'next'. Uses whitespace boundaries on normalized text.
function hasPhrase(t, phrase) {
  const re = new RegExp('(?:^|\\s)' + phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?:\\s|$)');
  return re.test(t);
}

// Map recognized text -> intent. Deterministic: same input -> same intent.
function parseCommand(text) {
  const t = normalize(text);
  if (!t) return { intent: INTENTS.IGNORE, reason: 'empty' };
  // HOLE-1: negation override — "don't tune" must not fire TUNE.
  for (const n of NEGATIONS) {
    if (hasPhrase(t, n)) return { intent: INTENTS.IGNORE, reason: 'negated', text: t };
  }
  // Pass-2 HOLE-E: explicit out-of-scope words beat intent words — 'play music again'
  // must NOT fire AGAIN. IGNORE patterns are the last entry of PATTERNS; check them first.
  const ignoreEntry = PATTERNS[PATTERNS.length - 1];
  for (const w of ignoreEntry.words) {
    if (hasPhrase(t, w)) return { intent: INTENTS.IGNORE, reason: 'out-of-scope-word', matched: w, text: t };
  }
  for (const p of PATTERNS) {
    if (p.intent === INTENTS.IGNORE) continue; // already checked above
    for (const w of p.words) {
      if (hasPhrase(t, w)) return { intent: p.intent, matched: w, text: t };
    }
  }
  // No pattern matched -> out of scope, ignore (never guess a lesson control).
  return { intent: INTENTS.IGNORE, reason: 'no-match', text: t };
}

// A minimal PlayerAdapter the real player implements. The engine calls these; it
// never touches the DOM. Each returns a short human-readable confirmation string
// (so the player can show it in the teacher's voice/persona).
function defaultAdapter() {
  return {
    slower: function (currentRate) {
      // Pass-4 HOLE-2: sanitize rate — string/garbage state gave NaN or coerced speeds.
      const cur = (typeof currentRate === 'number' && isFinite(currentRate)) ? currentRate : 1;
      const next = Math.max(0.5, cur - 0.15);
      return { rate: next, msg: 'Slowing down a little — ' + Math.round(next * 100) + '% speed.' };
    },
    again: function () { return { msg: 'Playing that again from the top.' }; },
    // HOLE-3: clamp at total-1 so we never advance past the last scene.
    // Pass-2 HOLE-B: also pull out-of-range pos back into [0, total-1].
    // Pass-3 HOLE-2: sanitize pos type — strings from DOM dataset/JSON would concat
    // ('3'+1='31'); non-finite/fractional positions are meaningless. Non-finite or
    // invalid total disables clamping but pos is still sanitized.
    whatsNext: function (pos, total) {
      const p = (typeof pos === 'number' && isFinite(pos)) ? Math.trunc(pos) : 0;
      const next = p + 1;
      // Pass-4 HOLE-1: coerce string total ('8' from DOM dataset bypassed the clamp).
      // Pass-5 HOLE-2: fail-safe on unparseable/invalid total — refuse to advance
      // rather than silently unclamping past the last scene.
      // Pass-6 HOLE-1: also reject 0 < t < 1 (fractional total would yield nextIndex -1).
      const t = (typeof total === 'number') ? total : Number(total);
      if (!isFinite(t) || t < 1) {
        return { nextIndex: p, msg: 'Cannot advance — lesson state unclear. Staying on this part.' };
      }
      const clamped = Math.min(Math.max(next, 0), Math.trunc(t) - 1);
      if (clamped !== next) {
        return { nextIndex: clamped, msg: 'That was the last part — you made it through the lesson.' };
      }
      return { nextIndex: next, msg: 'Next up — moving on to the next part.' };
    },
    tune: function () { return { msg: 'Opening the tuner — play each string and I\'ll tell you if it\'s sharp or flat.' }; }
  };
}

// Execute a recognized command against an adapter. `state` carries current player
// state (rate, sceneIndex). Returns { intent, action } where action is the adapter's
// result, or { intent:'ignore', action:null } for out-of-scope.
function execute(text, adapter, state) {
  adapter = adapter || defaultAdapter();
  state = state || {};
  const cmd = parseCommand(text);
  if (cmd.intent === INTENTS.IGNORE) {
    return { intent: 'ignore', action: null, reason: cmd.reason || 'out-of-scope' };
  }
  let action = null;
  // Pass-3 HOLE-3: guard dispatch — a partial player adapter must not throw an
  // uncaught TypeError on a voice command; degrade to an explicit unsupported result.
  const method = cmd.intent === INTENTS.SLOWER ? 'slower'
    : cmd.intent === INTENTS.AGAIN ? 'again'
    : cmd.intent === INTENTS.WHATS_NEXT ? 'whatsNext'
    : cmd.intent === INTENTS.TUNE ? 'tune' : null;
  if (method && typeof adapter[method] !== 'function') {
    return { intent: cmd.intent, action: null, reason: 'adapter-missing-' + method };
  }
  // Pass-4 HOLE-4: an adapter that throws INTERNALLY must not propagate an uncaught
  // exception out of a voice command — degrade to an explicit adapter-threw result.
  try {
    if (cmd.intent === INTENTS.SLOWER) action = adapter.slower(state.rate);
    else if (cmd.intent === INTENTS.AGAIN) action = adapter.again(state.sceneIndex);
    else if (cmd.intent === INTENTS.WHATS_NEXT) action = adapter.whatsNext(state.sceneIndex, state.totalScenes);
    else if (cmd.intent === INTENTS.TUNE) action = adapter.tune();
  } catch (e) {
    return { intent: cmd.intent, action: null, reason: 'adapter-threw', error: String(e && e.message || e) };
  }
  return { intent: cmd.intent, action: action ?? null };
}

// Tune delegation: use the REUSED step2 tuner engine to name a string + cents.
// Stubbed here for browser-free testing; the player wires the real one (mic -> TunerEngine).
function tuneString(freq, TunerEngine) {
  // HOLE-4: reject garbage input (0, NaN, negative, non-finite) before it hits the engine.
  // Pass-2 HOLE-C: strict number type (no string/array/object/boolean coercion) and
  // a plausible-guitar-frequency band (20–5000 Hz) so degenerate magnitudes like
  // 1e-300 ("F-1001") or 1e300 ("G992") are rejected too.
  if (typeof freq !== 'number' || !isFinite(freq) || freq < 20 || freq > 5000) {
    return { note: null, cents: null, label: 'NO SIGNAL — play a string', invalid: true };
  }
  const f = freq;
  const T = TunerEngine || require('../step2/engine/tuner-engine.js');
  // Pass-5 HOLE-3: validate the engine's OUTPUT, not just our input — a NaN-emitting
  // DSP layer (silent frame) produced 'FLAT by NaN cents' shown to the student, and
  // a null/throwing engine crashed uncaught.
  let note;
  try {
    note = T.noteFromFreq(f);
  } catch (e) {
    return { note: null, cents: null, label: 'NO SIGNAL — play a string', invalid: true };
  }
  if (!note || typeof note.cents !== 'number' || !isFinite(note.cents)) {
    return { note: null, cents: null, label: 'NO SIGNAL — play a string', invalid: true };
  }
  const cents = note.cents;
  let label;
  if (Math.abs(cents) < 6) label = 'IN TUNE';
  else if (Math.abs(cents) < 20) label = 'CLOSE — ' + (cents > 0 ? 'a touch sharp' : 'a touch flat');
  else label = (cents > 0 ? 'SHARP' : 'FLAT') + ' by ' + Math.round(Math.abs(cents)) + ' cents';
  return { note: note.name, cents: Math.round(cents), label };
}

// Ban 5 self-audit: no network calls in this module.
function selfAudit() {
  const src = require('fs').readFileSync(__filename, 'utf8');
  const banned = /fetch\s*\(|new\s+XMLHttpRequest|new\s+WebSocket|http\s*\.\s*request|axios\s*\(/;
  return { noNetwork: !banned.test(src), note: 'maps text->intent only; no audio capture, no STT, no network' };
}

module.exports = { INTENTS, PATTERNS, NEGATIONS, normalize, hasPhrase, parseCommand, defaultAdapter, execute, tuneString, selfAudit };
