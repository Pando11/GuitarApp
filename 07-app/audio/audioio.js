// audioio.js — device boundaries the proven engines need (mic capture + playback + TTS).
// Ban 5: audio never leaves the device. Web Speech API (STT) + Web Audio (mic) are browser-only.
import * as T from '../core/tuner-engine.js';
import * as L from '../core/listening-engine.js';
import { normalizeForTTS } from './tts-normalize.js';
import { resolveTtsPlan, clampPitchToSpeech } from './tts-plan.js';

// --- Secure-context guard -------------------------------------------------
// getUserMedia lives on navigator.mediaDevices, which browsers ONLY expose in a
// "secure context": HTTPS or http://localhost. Over plain http://LAN-IP (the phone
// dogfood URL) or a file:// double-click, navigator.mediaDevices is undefined, so
// `navigator.mediaDevices.getUserMedia(...)` throws
//   "Cannot read properties of undefined (reading 'getUserMedia')"
// Your Windows mic permission is irrelevant there — the browser simply refuses to
// surface the mic API. This guard turns that cryptic error into a truthful message.
export function isMicAvailable() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}
export function micUnavailableMessage() {
  if (window.isSecureContext) {
    return '⚠ Microphone blocked by the browser. Click the 🎤/lock icon left of the address bar, set Microphone to Allow, then Start again.';
  }
  const httpsUrl = (window.__LAN_HTTPS_DOGFOOD__ || window.__LAN_HTTPS__ || null);
  const urlLine = httpsUrl
    ? ('Open this instead: ' + httpsUrl + '  (tap it, then "Advanced → Proceed" once)')
    : 'On your phone use the https:// address (the one printed when the server started).';
  return '⚠ Mic needs a secure connection. ' + urlLine + ' Your Windows mic permission is already ON — this is a browser security rule, not that toggle.';
}

export class MicAnalyzer {
  constructor() { this.ctx = null; this.stream = null; this.source = null; this.analyser = null; this.sampleRate = 44100; this._buf = null; }
  async start() {
    if (this.stream) return;
    if (!isMicAvailable()) throw new Error('MIC_UNAVAILABLE');
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
    // Create + resume the AudioContext INSIDE this user-gesture handler. A context
    // created after an `await` (mic permission) starts SUSPENDED in Chrome/Edge, and a
    // suspended context's AnalyserNode returns all-zeros — so autoCorrelate() returns -1
    // forever and the tuner shows "—" no matter what you play. resume() wakes it.
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (this.ctx.state === 'suspended') await this.ctx.resume();
    this.sampleRate = this.ctx.sampleRate;
    this.source = this.ctx.createMediaStreamSource(this.stream);
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 2048;
    this.source.connect(this.analyser);
    // The analyser must be part of a graph that *reaches* the destination, or the
    // Web Audio engine won't pull/pump the MediaStreamSource and getFloatTimeDomainData
    // returns all-zeros (→ autoCorrelate returns -1 → tuner shows "—" forever, even
    // though the mic permission was granted). Route analyser → zero-gain → destination
    // so it's processed silently without playing the mic back to the speaker.
    const sink = this.ctx.createGain();
    sink.gain.value = 0;
    this.analyser.connect(sink);
    sink.connect(this.ctx.destination);
    this._buf = new Float32Array(this.analyser.fftSize);
  }
  stop() {
    if (this.stream) { this.stream.getTracks().forEach(t => t.stop()); this.stream = null; }
    if (this.ctx) { this.ctx.close(); this.ctx = null; }
  }
  // Returns the current time-domain Float32Array (mono, normalized).
  getBuffer() {
    if (!this.analyser) return null;
    this.analyser.getFloatTimeDomainData(this._buf);
    return this._buf;
  }
  // Live pitch (Hz, or -1 if too quiet). Used by tuner screen.
  detectPitch() {
    const buf = this.getBuffer();
    if (!buf) return -1;
    return T.autoCorrelate(buf, this.sampleRate);
  }
  // Run the in-lesson listening verdict for a target chord.
  verifyChord(frets) {
    const buf = this.getBuffer();
    if (!buf) return { verdict: 'unsure', reason: 'no-mic', msg: 'Allow microphone access to verify.' };
    return L.verifyChord(buf, this.sampleRate, frets);
  }
}

// Web Audio playback of a synthesized Float32Array buffer (used by the band engine).
export function playBuffer(float32, sampleRate) {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const dur = float32.length / sampleRate;
  const buffer = ctx.createBuffer(1, float32.length, sampleRate);
  buffer.copyToChannel(float32, 0);
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.connect(ctx.destination);
  src.start();
  return new Promise(res => {
    setTimeout(() => { try { ctx.close(); } catch (e) {} res(); }, dur * 1000 + 200);
  });
}

// Voice routing. Each instructor (teacher JSON) carries a full `voice` object:
//   { provider, voice_id, style, rate, pitch }
// resolveTtsPlan() (see tts-plan.js) turns whatever speak() received into one plan.
// Providers:
//   - 'openai-tts' : per-call commercial TTS (Ban 8 — paid per call, permitted stopgap)
//   - 'chatterbox' : THE SHIPPING realistic voice (AMENDMENT-06) — MIT, warm, emotion.
//                     Audio is synthesized server-side (key stays off the client) and
//                     streamed back; see /api/tts in serve.mjs.
// The SPOKEN TEXT is the teacher's persona_line + lesson caption — never an LLM judgement.
export async function speak(text, opts = {}) {
  // Normalize chord symbols for SPEECH only (captions stay "Em" on screen).
  // Without this, "Em" is read as the letters E + m → "m". See tts-normalize.js.
  const spoken = normalizeForTTS(text);
  const plan = resolveTtsPlan(opts);

  // 1) Preferred path: a server-side voice proxy (/api/tts) when running behind serve.mjs
  //    (always true in dogfood; in prod point __TTS_PROXY__ at your backend). Keeps the
  //    synthesis key server-side — correct for a paid app.
  if (window.__TTS_PROXY__ !== false) {
    try { if (await speakViaProxy(spoken, plan)) return; }
    catch (e) { console.warn('TTS proxy failed, using client fallback', e); }
  }

  // 2) Client-side OpenAI TTS (stopgap) if a key is present in the page.
  if (plan.provider === 'openai-tts' && (window.__OPENAI_TTS_KEY__ || null)) {
    try {
      const res = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + window.__OPENAI_TTS_KEY__, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'tts-1', voice: plan.voiceId, input: spoken, response_format: 'mp3' })
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = new Audio(url);
        await a.play();
        return;
      }
    } catch (e) { console.warn('OpenAI TTS failed, using local speechSynthesis', e); }
  }

  // 3) Local fallback (still works, uses device voice, honors rate + pitch so each
  //    instructor still sounds distinct even with no API key).
  if ('speechSynthesis' in window) {
    const u = new SpeechSynthesisUtterance(spoken);
    u.rate = plan.rate || 1;
    u.pitch = clampPitchToSpeech(plan.pitch);
    window.speechSynthesis.speak(u);
  }
}

// POST to the server-side voice proxy and play the returned audio. Returns true on success.
async function speakViaProxy(spoken, plan) {
  const res = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider: plan.provider, voice_id: plan.voiceId, text: spoken, style: plan.style })
  });
  if (!res.ok) return false;
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = new Audio(url);
  await a.play();
  return true;
}

// Speech-to-text via Web Speech API (browser-only). Returns the recognized text.
export function startListening(onResult, onError) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { onError && onError('no-stt'); return null; }
  const rec = new SR();
  rec.continuous = false; rec.interimResults = false; rec.lang = 'en-US';
  rec.onresult = (e) => { const t = e.results[0][0].transcript; onResult && onResult(t); };
  rec.onerror = (e) => onError && onError(e.error);
  rec.start();
  return rec;
}
