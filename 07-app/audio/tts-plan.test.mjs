// tts-plan.test.mjs — browser-free proof that each instructor's voice config resolves
// correctly (provider + voice_id + rate + pitch). Run: node 07-app/audio/tts-plan.test.mjs
import assert from 'node:assert/strict';
import { resolveTtsPlan, clampPitchToSpeech } from './tts-plan.js';

let n = 0;
function ok(name, fn) { fn(); n++; console.log('  ✓', name); }

ok('string id → openai-tts with that id', () => {
  const p = resolveTtsPlan({ voice: 'shimmer' });
  assert.equal(p.provider, 'openai-tts');
  assert.equal(p.voiceId, 'shimmer');
  assert.equal(p.rate, 1);
  assert.equal(p.pitch, 0);
});

ok('full teacher voice object passes through', () => {
  const p = resolveTtsPlan({ voice: { provider: 'chatterbox', voice_id: 'maggie', style: 'bright', rate: 1.0, pitch: 0 } });
  assert.equal(p.provider, 'chatterbox');
  assert.equal(p.voiceId, 'maggie');
  assert.equal(p.rate, 1.0);
  assert.equal(p.pitch, 0);
});

ok('T2 Ellis (shimmer, 0.9, -1) keeps distinct identity', () => {
  const p = resolveTtsPlan({ voice: { provider: 'openai-tts', voice_id: 'shimmer', rate: 0.9, pitch: -1 } });
  assert.equal(p.voiceId, 'shimmer');
  assert.equal(p.rate, 0.9);
  assert.equal(p.pitch, -1);
});

ok('T3 Ray (onyx, 1.1, -2) keeps distinct identity', () => {
  const p = resolveTtsPlan({ voice: { provider: 'openai-tts', voice_id: 'onyx', rate: 1.1, pitch: -2 } });
  assert.equal(p.voiceId, 'onyx');
  assert.equal(p.rate, 1.1);
  assert.equal(p.pitch, -2);
});

ok('undefined → openai-tts / alloy default', () => {
  const p = resolveTtsPlan({});
  assert.equal(p.provider, 'openai-tts');
  assert.equal(p.voiceId, 'alloy');
});

ok('pitch map: -2→0, 0→1, +2→2, clamps', () => {
  assert.equal(clampPitchToSpeech(-2), 0);
  assert.equal(clampPitchToSpeech(0), 1);
  assert.equal(clampPitchToSpeech(2), 2);
  assert.equal(clampPitchToSpeech(5), 2);
  assert.equal(clampPitchToSpeech(-9), 0);
});

console.log(`\ntts-plan: ${n} checks passed, 0 failed`);
