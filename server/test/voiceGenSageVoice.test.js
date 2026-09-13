// voiceGenSageVoice.test.js — mocked-fetch coverage for the additive Sage
// male-voice support added to voiceGen.js/config.js. Does not duplicate
// src/voiceGen.test.mjs's full request/poll/error-path coverage — only the
// new bits: FAL_KOKORO_VOICE_SAGE's value/distinctness, and generateSpeech()
// honoring `speaker: 'sage'` (and `voice` still winning over `speaker`).
// Every fal.ai HTTP call is intercepted via a globalThis.fetch stub — this
// suite makes zero real network calls.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateSpeech } from '../src/voiceGen.js';
import { FAL_KOKORO_MODEL, FAL_KOKORO_VOICE, FAL_KOKORO_VOICE_SAGE } from '../src/config.js';

const SUBMIT_URL = `https://queue.fal.run/${FAL_KOKORO_MODEL}`;
const STATUS_URL = 'https://queue.fal.run/fal-ai/kokoro/requests/test-id/status';
const RESPONSE_URL = 'https://queue.fal.run/fal-ai/kokoro/requests/test-id';

function installFetchMock(handler) {
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, opts = {}) => {
    const record = { url: String(url), method: opts.method || 'GET', headers: opts.headers || {}, body: opts.body };
    calls.push(record);
    return handler(record, calls.length);
  };
  return {
    calls,
    restore() {
      globalThis.fetch = original;
    },
  };
}

function queueSubmitted() {
  return { ok: true, json: async () => ({ status: 'IN_QUEUE', status_url: STATUS_URL, response_url: RESPONSE_URL }) };
}
function statusResult(status) {
  return { ok: true, json: async () => ({ status }) };
}
function completedResult(audioUrl) {
  return { ok: true, json: async () => ({ audio: { url: audioUrl, content_type: 'audio/wav' } }) };
}
function unexpectedUrl(record) {
  throw new Error(`unexpected fetch call: ${record.method} ${record.url}`);
}

// --- config shape: additive, not a replacement of the existing default ---

test('FAL_KOKORO_VOICE_SAGE is a distinct, defined male voice ID and FAL_KOKORO_VOICE is unchanged', () => {
  assert.equal(FAL_KOKORO_VOICE, 'af_heart', 'existing default voice must be untouched');
  assert.equal(FAL_KOKORO_VOICE_SAGE, 'am_adam');
  assert.notEqual(FAL_KOKORO_VOICE_SAGE, FAL_KOKORO_VOICE, 'Sage voice must be distinct from the default');
});

// --- generateSpeech: speaker: 'sage' shorthand ---

test('generateSpeech({ speaker: "sage" }) sends FAL_KOKORO_VOICE_SAGE as the voice', async () => {
  const m = installFetchMock((record) => {
    if (record.url === SUBMIT_URL) return queueSubmitted();
    if (record.url === STATUS_URL) return statusResult('COMPLETED');
    if (record.url === RESPONSE_URL) return completedResult('https://cdn.fal.ai/sage-speech.wav');
    return unexpectedUrl(record);
  });
  try {
    const result = await generateSpeech('Nice work landing that G to C change.', { speaker: 'sage' });
    assert.deepEqual(result, { audioUrl: 'https://cdn.fal.ai/sage-speech.wav' });
    const submitCall = m.calls.find((c) => c.url === SUBMIT_URL);
    assert.deepEqual(JSON.parse(submitCall.body), {
      prompt: 'Nice work landing that G to C change.',
      voice: FAL_KOKORO_VOICE_SAGE,
    });
  } finally {
    m.restore();
  }
});

test('generateSpeech with no options still defaults to FAL_KOKORO_VOICE (existing behavior unchanged)', async () => {
  const m = installFetchMock((record) => {
    if (record.url === SUBMIT_URL) return queueSubmitted();
    if (record.url === STATUS_URL) return statusResult('COMPLETED');
    if (record.url === RESPONSE_URL) return completedResult('https://cdn.fal.ai/default-speech.wav');
    return unexpectedUrl(record);
  });
  try {
    await generateSpeech('Great job today.');
    const submitCall = m.calls.find((c) => c.url === SUBMIT_URL);
    assert.deepEqual(JSON.parse(submitCall.body), {
      prompt: 'Great job today.',
      voice: FAL_KOKORO_VOICE,
    });
  } finally {
    m.restore();
  }
});

test('an explicit voice override still wins over speaker when both are given', async () => {
  const m = installFetchMock((record) => {
    if (record.url === SUBMIT_URL) return queueSubmitted();
    if (record.url === STATUS_URL) return statusResult('COMPLETED');
    if (record.url === RESPONSE_URL) return completedResult('https://cdn.fal.ai/explicit.wav');
    return unexpectedUrl(record);
  });
  try {
    await generateSpeech('Text.', { voice: 'af_bella', speaker: 'sage' });
    const submitCall = m.calls.find((c) => c.url === SUBMIT_URL);
    assert.deepEqual(JSON.parse(submitCall.body), { prompt: 'Text.', voice: 'af_bella' });
  } finally {
    m.restore();
  }
});

test('an unrecognized speaker name falls back to the default voice rather than sending "undefined"', async () => {
  const m = installFetchMock((record) => {
    if (record.url === SUBMIT_URL) return queueSubmitted();
    if (record.url === STATUS_URL) return statusResult('COMPLETED');
    if (record.url === RESPONSE_URL) return completedResult('https://cdn.fal.ai/fallback.wav');
    return unexpectedUrl(record);
  });
  try {
    await generateSpeech('Text.', { speaker: 'not-a-real-speaker' });
    const submitCall = m.calls.find((c) => c.url === SUBMIT_URL);
    assert.deepEqual(JSON.parse(submitCall.body), { prompt: 'Text.', voice: FAL_KOKORO_VOICE });
  } finally {
    m.restore();
  }
});
