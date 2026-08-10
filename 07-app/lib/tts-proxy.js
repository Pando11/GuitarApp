// tts-proxy.js — SERVER-SIDE voice resolver for /api/tts in serve.mjs.
// Pure + testable in Node (no fetch at import time) so the route contract is provable.
//
// Why server-side: a paid app must NOT ship its synthesis API key in the client bundle.
// The browser calls POST /api/tts (same origin), and this module builds the upstream
// request to the real provider, using keys read from process.env on the server only.
//
// Providers (must match teacher JSON `voice.provider`):
//   - 'chatterbox' : THE SHIPPING realistic voice (AMENDMENT-06) — MIT. Hosted or
//                    self-hosted; endpoint + key from CHATTERBOX_API_URL / CHATTERBOX_API_KEY.
//   - 'openai-tts' : permitted stopgap — OPENAI_API_KEY.
//
// If the matching key/endpoint isn't configured, buildUpstreamRequest throws with a
// clear code so the server returns 501 and the client falls back to speechSynthesis.

export function buildUpstreamRequest(body, env = process.env) {
  const provider = (body && body.provider) || 'openai-tts';
  const text = (body && body.text) || '';
  const voiceId = (body && body.voice_id) || 'alloy';
  if (!text.trim()) throw Object.assign(new Error('EMPTY_TEXT'), { code: 'EMPTY_TEXT' });

  if (provider === 'openai-tts') {
    const key = env.OPENAI_API_KEY || '';
    if (!key) throw Object.assign(new Error('OPENAI_API_KEY not set'), { code: 'NO_KEY' });
    return {
      provider,
      url: 'https://api.openai.com/v1/audio/speech',
      headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' },
      payload: { model: 'tts-1', voice: voiceId, input: text, response_format: 'mp3' },
      contentType: 'audio/mpeg'
    };
  }

  if (provider === 'chatterbox') {
    const url = env.CHATTERBOX_API_URL || '';
    const key = env.CHATTERBOX_API_KEY || '';
    if (!url) throw Object.assign(new Error('CHATTERBOX_API_URL not set'), { code: 'NO_ENDPOINT' });
    if (!key) throw Object.assign(new Error('CHATTERBOX_API_KEY not set'), { code: 'NO_KEY' });
    return {
      provider,
      url,
      headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' },
      // Chatterbox upstream contract (Resemble-hosted / self-hosted server):
      // text + voice_id (a cloned/sample voice) + optional cfg/seed for emotion/exaggeration.
      payload: { text, voice_id: voiceId, ...(body && body.style ? { style: body.style } : {}) },
      contentType: 'audio/wav'
    };
  }

  throw Object.assign(new Error('UNKNOWN_PROVIDER:' + provider), { code: 'UNKNOWN_PROVIDER' });
}
