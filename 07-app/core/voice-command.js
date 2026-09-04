// voice-command.js — F10 "Voice-first practice controls." PORTED 1:1 from 06-prototypes/step7-extra/voice-command.js.
// Maps recognized TEXT -> intent. Browser-free / DOM-free. STT is a device boundary (stubbed).

export const INTENTS = {
  SLOWER: 'slower', AGAIN: 'again', WHATS_NEXT: 'whats-next', TUNE: 'tune-my-guitar', IGNORE: 'ignore'
};

export const PATTERNS = [
  { intent: INTENTS.SLOWER, words: ['slower', 'slow down', 'slow it', 'too fast', 'speed down', 'slower please', 'slow'] },
  { intent: INTENTS.AGAIN, words: ['again', 'repeat', 'replay', 'one more time', 'do it again', 'play it again'] },
  { intent: INTENTS.WHATS_NEXT, words: ['next', "what's next", 'what is next', 'what comes next', 'move on', 'continue', 'go on', 'next part', 'next scene'] },
  { intent: INTENTS.TUNE, words: ['tune', 'tune my guitar', 'tune up', 'out of tune', 'tuning', 'detune'] },
  { intent: INTENTS.IGNORE, words: ['pizza', 'weather', 'news', 'call', 'text', 'email', 'remind me to', 'play music', 'open', 'movie', 'tv', 'shopping'] }
];

export const NEGATIONS = ['don t', 'dont', 'do not', 'doesn t', 'doesnt', 'no', 'not', 'never', 'stop', 'enough',
  'can t', 'cant', 'cannot', 'won t', 'wont', 'nope', 'nah', 'quit',
  'skip', 'never mind', 'nevermind', 'cut it out', 'dontcha', 'don tcha', 'wait',
  'hold on', 'hang on', 'give me a sec', 'pause', 'shut up', 'later'];

export function normalize(text) {
  return String(text == null ? '' : text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function hasPhrase(t, phrase) {
  const re = new RegExp('(?:^|\\s)' + phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?:\\s|$)');
  return re.test(t);
}

export function parseCommand(text) {
  const t = normalize(text);
  if (!t) return { intent: INTENTS.IGNORE, reason: 'empty' };
  for (const n of NEGATIONS) if (hasPhrase(t, n)) return { intent: INTENTS.IGNORE, reason: 'negated', text: t };
  const ignoreEntry = PATTERNS[PATTERNS.length - 1];
  for (const w of ignoreEntry.words) if (hasPhrase(t, w)) return { intent: INTENTS.IGNORE, reason: 'out-of-scope-word', matched: w, text: t };
  for (const p of PATTERNS) {
    if (p.intent === INTENTS.IGNORE) continue;
    for (const w of p.words) if (hasPhrase(t, w)) return { intent: p.intent, matched: w, text: t };
  }
  return { intent: INTENTS.IGNORE, reason: 'no-match', text: t };
}

export function defaultAdapter() {
  return {
    slower: function (currentRate) {
      const cur = (typeof currentRate === 'number' && isFinite(currentRate)) ? currentRate : 1;
      const next = Math.max(0.5, cur - 0.15);
      return { rate: next, msg: 'Slowing down a little — ' + Math.round(next * 100) + '% speed.' };
    },
    again: function () { return { msg: 'Playing that again from the top.' }; },
    whatsNext: function (pos, total) {
      const p = (typeof pos === 'number' && isFinite(pos)) ? Math.trunc(pos) : 0;
      const next = p + 1;
      const t = (typeof total === 'number') ? total : Number(total);
      if (!isFinite(t) || t < 1) return { nextIndex: p, msg: 'Cannot advance — lesson state unclear. Staying on this part.' };
      const clamped = Math.min(Math.max(next, 0), Math.trunc(t) - 1);
      if (clamped !== next) return { nextIndex: clamped, msg: 'That was the last part — you made it through the lesson.' };
      return { nextIndex: next, msg: 'Next up — moving on to the next part.' };
    },
    tune: function () { return { msg: 'Opening the tuner — play each string and I\'ll tell you if it\'s sharp or flat.' }; }
  };
}

export function execute(text, adapter, state) {
  adapter = adapter || defaultAdapter();
  state = state || {};
  const cmd = parseCommand(text);
  if (cmd.intent === INTENTS.IGNORE) return { intent: 'ignore', action: null, reason: cmd.reason || 'out-of-scope' };
  let action = null;
  const method = cmd.intent === INTENTS.SLOWER ? 'slower' : cmd.intent === INTENTS.AGAIN ? 'again' : cmd.intent === INTENTS.WHATS_NEXT ? 'whatsNext' : cmd.intent === INTENTS.TUNE ? 'tune' : null;
  if (method && typeof adapter[method] !== 'function') return { intent: cmd.intent, action: null, reason: 'adapter-missing-' + method };
  try {
    if (cmd.intent === INTENTS.SLOWER) action = adapter.slower(state.rate);
    else if (cmd.intent === INTENTS.AGAIN) action = adapter.again(state.sceneIndex);
    else if (cmd.intent === INTENTS.WHATS_NEXT) action = adapter.whatsNext(state.sceneIndex, state.totalScenes);
    else if (cmd.intent === INTENTS.TUNE) action = adapter.tune();
  } catch (e) { return { intent: cmd.intent, action: null, reason: 'adapter-threw', error: String(e && e.message || e) }; }
  return { intent: cmd.intent, action: action ?? null };
}

export function tuneString(freq, TunerEngine) {
  if (typeof freq !== 'number' || !isFinite(freq) || freq < 20 || freq > 5000) {
    return { note: null, cents: null, label: 'NO SIGNAL — play a string', invalid: true };
  }
  const f = freq;
  const T = TunerEngine || null;
  let note;
  try { note = (T ? T.noteFromFreq(f) : null); } catch (e) { return { note: null, cents: null, label: 'NO SIGNAL — play a string', invalid: true }; }
  if (!note || typeof note.cents !== 'number' || !isFinite(note.cents)) return { note: null, cents: null, label: 'NO SIGNAL — play a string', invalid: true };
  const cents = note.cents;
  let label;
  if (Math.abs(cents) < 6) label = 'IN TUNE';
  else if (Math.abs(cents) < 20) label = 'CLOSE — ' + (cents > 0 ? 'a touch sharp' : 'a touch flat');
  else label = (cents > 0 ? 'SHARP' : 'FLAT') + ' by ' + Math.round(Math.abs(cents)) + ' cents';
  return { note: note.name, cents: Math.round(cents), label };
}
