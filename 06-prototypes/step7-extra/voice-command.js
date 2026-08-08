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
  { intent: INTENTS.IGNORE, words: ['pizza', 'weather', 'news', 'call ', 'text ', 'email', 'remind me to', 'play music', 'open '] }
];

function normalize(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')   // strip punctuation
    .replace(/\s+/g, ' ')
    .trim();
}

// Map recognized text -> intent. Deterministic: same input -> same intent.
function parseCommand(text) {
  const t = normalize(text);
  if (!t) return { intent: INTENTS.IGNORE, reason: 'empty' };
  for (const p of PATTERNS) {
    for (const w of p.words) {
      if (t.indexOf(w) >= 0) return { intent: p.intent, matched: w, text: t };
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
      const next = Math.max(0.5, (currentRate || 1) - 0.15);
      return { rate: next, msg: 'Slowing down a little — ' + Math.round(next * 100) + '% speed.' };
    },
    again: function () { return { msg: 'Playing that again from the top.' }; },
    whatsNext: function (pos) {
      return { nextIndex: (pos || 0) + 1, msg: 'Next up — moving on to the next part.' };
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
  if (cmd.intent === INTENTS.SLOWER) action = adapter.slower(state.rate);
  else if (cmd.intent === INTENTS.AGAIN) action = adapter.again(state.sceneIndex);
  else if (cmd.intent === INTENTS.WHATS_NEXT) action = adapter.whatsNext(state.sceneIndex);
  else if (cmd.intent === INTENTS.TUNE) action = adapter.tune();
  return { intent: cmd.intent, action: action };
}

// Tune delegation: use the REUSED step2 tuner engine to name a string + cents.
// Stubbed here for browser-free testing; the player wires the real one (mic -> TunerEngine).
function tuneString(freq, TunerEngine) {
  const T = TunerEngine || require('../step2/engine/tuner-engine.js');
  const note = T.noteFromFreq(freq);
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

module.exports = { INTENTS, PATTERNS, normalize, parseCommand, defaultAdapter, execute, tuneString, selfAudit };
