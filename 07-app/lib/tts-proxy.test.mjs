// tts-proxy.test.mjs — browser-free proof of the /api/tts route contract.
// Run: node 07-app/lib/tts-proxy.test.mjs
import assert from 'node:assert/strict';
import { buildUpstreamRequest } from './tts-proxy.js';

let n = 0;
function ok(name, fn) { fn(); n++; console.log('  ✓', name); }

ok('openai-tts builds correct upstream with key', () => {
  const r = buildUpstreamRequest(
    { provider: 'openai-tts', voice_id: 'onyx', text: 'Practice this chord.' },
    { OPENAI_API_KEY: 'sk-test' }
  );
  assert.equal(r.url, 'https://api.openai.com/v1/audio/speech');
  assert.equal(r.payload.voice, 'onyx');
  assert.equal(r.payload.input, 'Practice this chord.');
  assert.equal(r.headers.Authorization, 'Bearer sk-test');
  assert.equal(r.contentType, 'audio/mpeg');
});

ok('openai-tts with no key → NO_KEY (client falls back)', () => {
  assert.throws(() => buildUpstreamRequest({ provider: 'openai-tts', text: 'hi' }, {}),
    (e) => e.code === 'NO_KEY');
});

ok('chatterbox uses env endpoint + key', () => {
  const r = buildUpstreamRequest(
    { provider: 'chatterbox', voice_id: 'maggie', text: 'Great switch.', style: 'warm' },
    { CHATTERBOX_API_URL: 'https://tts.example/v1/speech', CHATTERBOX_API_KEY: 'cb-test' }
  );
  assert.equal(r.url, 'https://tts.example/v1/speech');
  assert.equal(r.headers.Authorization, 'Bearer cb-test');
  assert.equal(r.payload.voice_id, 'maggie');
  assert.equal(r.payload.text, 'Great switch.');
  assert.equal(r.contentType, 'audio/wav');
});

ok('chatterbox with no endpoint → NO_ENDPOINT', () => {
  assert.throws(() => buildUpstreamRequest({ provider: 'chatterbox', text: 'hi' }, {}),
    (e) => e.code === 'NO_ENDPOINT');
});

ok('empty text → EMPTY_TEXT', () => {
  assert.throws(() => buildUpstreamRequest({ provider: 'openai-tts', text: '   ' }, { OPENAI_API_KEY: 'x' }),
    (e) => e.code === 'EMPTY_TEXT');
});

ok('unknown provider → UNKNOWN_PROVIDER', () => {
  assert.throws(() => buildUpstreamRequest({ provider: 'elevenlabs', text: 'hi' }, {}),
    (e) => e.code === 'UNKNOWN_PROVIDER');
});

console.log(`\ntts-proxy: ${n} checks passed, 0 failed`);
