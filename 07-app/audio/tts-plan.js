// tts-plan.js — PURE (no window/document/AudioContext) resolver for an instructor's
// voice config. Lives outside audioio.js so it can be unit-tested in Node without a
// browser. audioio.js imports resolveTtsPlan() from here.
//
// Each teacher JSON carries a `voice` object: { provider, voice_id, style, rate, pitch }.
// Before this module, speak() only looked at the voice_id and ignored provider/rate/pitch,
// so every instructor collapsed to the device default unless an OpenAI key was set.
// resolveTtsPlan() turns whatever opts.speak() got into one normalized plan.

// Map an app-space pitch (-2..+2, where 0 = neutral) onto the Web Speech API range
// (0..2, where 1 = neutral). Out-of-range clamps.
export function clampPitchToSpeech(p) {
  const n = typeof p === 'number' && Number.isFinite(p) ? p : 0;
  const v = n / 2 + 1; // -2→0, 0→1, +2→2
  return Math.max(0, Math.min(2, v));
}

// Normalize whatever speak() received into a single voice plan.
//   opts.voice may be:
//     - a string id  (legacy)            → assume openai-tts, that id
//     - a teacher voice object           → use it verbatim
//     - undefined                       → openai-tts / 'alloy'
export function resolveTtsPlan(opts = {}) {
  const raw = opts && opts.voice;
  const v = raw && typeof raw === 'object'
    ? raw
    : { voice_id: (typeof raw === 'string' ? raw : 'alloy'), provider: 'openai-tts' };
  return {
    provider: (typeof v.provider === 'string' && v.provider) ? v.provider : 'openai-tts',
    voiceId: (typeof v.voice_id === 'string' && v.voice_id) ? v.voice_id : 'alloy',
    style: typeof v.style === 'string' ? v.style : '',
    rate: (typeof v.rate === 'number' && Number.isFinite(v.rate)) ? v.rate : 1,
    pitch: (typeof v.pitch === 'number' && Number.isFinite(v.pitch)) ? v.pitch : 0
  };
}
