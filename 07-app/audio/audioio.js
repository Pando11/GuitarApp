// audioio.js — device boundaries the proven engines need (mic capture + playback + TTS).
// Ban 5: audio never leaves the device. Web Speech API (STT) + Web Audio (mic) are browser-only.
import * as T from '../core/tuner-engine.js';
import * as L from '../core/listening-engine.js';

export class MicAnalyzer {
  constructor() { this.ctx = null; this.stream = null; this.source = null; this.analyser = null; this.sampleRate = 44100; this._buf = null; }
  async start() {
    if (this.stream) return;
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.sampleRate = this.ctx.sampleRate;
    this.source = this.ctx.createMediaStreamSource(this.stream);
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 2048;
    this.source.connect(this.analyser);
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

// OpenAI TTS per-call (Ban 8: paid per-call, commercial). Falls back to speechSynthesis
// if the key isn't set yet (still ship-capable). The SPOKEN TEXT is the teacher's
// persona_line + lesson caption (persona + coaching), never an LLM-invented judgement.
export async function speak(text, opts = {}) {
  const voice = opts.voice || 'alloy';
  const apiKey = window.__OPENAI_TTS_KEY__ || null;
  if (apiKey) {
    try {
      const res = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'tts-1', voice, input: text, response_format: 'mp3' })
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = new Audio(url);
        await a.play();
        return;
      }
    } catch (e) { console.warn('TTS call failed, using local speechSynthesis', e); }
  }
  // Local fallback (still works, uses device voice).
  if ('speechSynthesis' in window) {
    const u = new SpeechSynthesisUtterance(text);
    u.rate = opts.rate || 1;
    window.speechSynthesis.speak(u);
  }
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
