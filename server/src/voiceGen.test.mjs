// voiceGen.test.mjs — mocked-client tests for voiceGen.js's fal.ai Kokoro
// TTS integration (TIER-1B Wave 5, 5A — Sage speaks). Every fal.ai HTTP call
// is intercepted via a globalThis.fetch stub — this suite makes zero real
// network calls. Poll-loop tests (multi-poll, timeout) use node:test's
// built-in fake timers (Date + setTimeout) rather than sleeping in real
// time, so the real FAL_TTS_POLL_INTERVAL_MS/FAL_TTS_POLL_TIMEOUT_MS
// constants (config.js) can be exercised in full without a slow test run.
//
// The VoiceGenConfigError ("FAL_KEY unset") case is the one exception, for
// the same reason musicGen.test.mjs's equivalent test is: this repo's real
// repo-root .env legitimately holds a working FAL_KEY (see config.js's
// readFalKeyFromRootEnv()), so FAL_KEY is truthy for every plain import of
// config.js in this process — merely unsetting process.env.FAL_KEY would
// not reproduce "genuinely unconfigured". That one test spawns an isolated
// child Node process with --experimental-test-module-mocks to mock
// config.js's FAL_KEY export to '' and prove the real thrown-error branch,
// not a stub of it.

import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { generateSpeech, VoiceGenConfigError, VoiceGenError } from './voiceGen.js';
import { FAL_KOKORO_MODEL, FAL_KOKORO_VOICE } from './config.js';

const SUBMIT_URL = `https://queue.fal.run/${FAL_KOKORO_MODEL}`;
const STATUS_URL = 'https://queue.fal.run/fal-ai/kokoro/requests/test-id/status';
const RESPONSE_URL = 'https://queue.fal.run/fal-ai/kokoro/requests/test-id';

// Installs a fetch stub for the duration of one test. `handler(record, n)` is
// called for every fetch, where `record` is {url, method, headers, body} and
// `n` is the 1-based call index; it must return a fetch-Response-shaped
// object ({ok, status, json, text}). Always call .restore() (use try/finally).
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
function httpError(status, body = 'boom') {
  return { ok: false, status, text: async () => body };
}

function unexpectedUrl(record) {
  throw new Error(`unexpected fetch call: ${record.method} ${record.url}`);
}

// Drains a promise that's driven by fake timers: repeatedly advance the
// clock and flush the microtask queue until the promise settles (or a
// generous safety cap is hit, which fails loudly rather than hanging CI).
async function settleWithFakeTimers(promise, { tickMs, maxTicks = 200 }) {
  let settled = false;
  let value;
  let error;
  promise.then(
    (v) => { value = v; settled = true; },
    (e) => { error = e; settled = true; },
  );
  for (let i = 0; i < maxTicks && !settled; i++) {
    mock.timers.tick(tickMs);
    await Promise.resolve();
    await new Promise((resolve) => setImmediate(resolve));
  }
  assert.equal(settled, true, `promise never settled after ${maxTicks} ticks of ${tickMs}ms`);
  if (error) throw error;
  return value;
}

// --- Successful generation: exact request payload + response shape ---

test('generateSpeech sends the exact Kokoro payload (prompt/voice) and resolves { audioUrl }, defaulting to FAL_KOKORO_VOICE', async () => {
  const m = installFetchMock((record) => {
    if (record.url === SUBMIT_URL) return queueSubmitted();
    if (record.url === STATUS_URL) return statusResult('COMPLETED');
    if (record.url === RESPONSE_URL) return completedResult('https://cdn.fal.ai/speech123.wav');
    return unexpectedUrl(record);
  });
  try {
    const result = await generateSpeech('Nice work landing that G-to-C change.');
    assert.deepEqual(result, { audioUrl: 'https://cdn.fal.ai/speech123.wav' });

    const submitCall = m.calls.find((c) => c.url === SUBMIT_URL);
    assert.equal(submitCall.method, 'POST');
    assert.deepEqual(JSON.parse(submitCall.body), {
      prompt: 'Nice work landing that G-to-C change.',
      voice: FAL_KOKORO_VOICE,
    });
    assert.equal(FAL_KOKORO_VOICE, 'af_heart', 'default voice must match the lesson-narration voice');
  } finally {
    m.restore();
  }
});

test('generateSpeech honors an explicit voice override instead of the default', async () => {
  const m = installFetchMock((record) => {
    if (record.url === SUBMIT_URL) return queueSubmitted();
    if (record.url === STATUS_URL) return statusResult('COMPLETED');
    if (record.url === RESPONSE_URL) return completedResult('https://cdn.fal.ai/speech-alt.wav');
    return unexpectedUrl(record);
  });
  try {
    const result = await generateSpeech('Try that again a little slower.', { voice: 'am_adam' });
    assert.deepEqual(result, { audioUrl: 'https://cdn.fal.ai/speech-alt.wav' });
    const submitCall = m.calls.find((c) => c.url === SUBMIT_URL);
    assert.deepEqual(JSON.parse(submitCall.body), {
      prompt: 'Try that again a little slower.',
      voice: 'am_adam',
    });
  } finally {
    m.restore();
  }
});

test('generateSpeech sends fal auth/content-type headers on every request (submit, status, result)', async () => {
  const m = installFetchMock((record) => {
    if (record.url === SUBMIT_URL) return queueSubmitted();
    if (record.url === STATUS_URL) return statusResult('COMPLETED');
    if (record.url === RESPONSE_URL) return completedResult('https://cdn.fal.ai/speech.wav');
    return unexpectedUrl(record);
  });
  try {
    await generateSpeech('Great strum pattern.');
    assert.equal(m.calls.length, 3);
    for (const call of m.calls) {
      assert.match(call.headers.Authorization || '', /^Key .+/);
      assert.equal(call.headers['Content-Type'], 'application/json');
    }
  } finally {
    m.restore();
  }
});

// --- Async queue polling: submit -> poll status -> fetch result ---

test('a realistic multi-poll sequence (IN_QUEUE, IN_PROGRESS x2, then COMPLETED) is exercised before the result is fetched', async () => {
  const statusSequence = ['IN_QUEUE', 'IN_PROGRESS', 'IN_PROGRESS', 'COMPLETED'];
  let statusIdx = 0;
  const m = installFetchMock((record) => {
    if (record.url === SUBMIT_URL) return queueSubmitted();
    if (record.url === STATUS_URL) {
      const status = statusSequence[statusIdx++];
      return statusResult(status);
    }
    if (record.url === RESPONSE_URL) return completedResult('https://cdn.fal.ai/polled-speech.wav');
    return unexpectedUrl(record);
  });
  mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  try {
    const result = await settleWithFakeTimers(generateSpeech('Watch your fretting-hand thumb.'), { tickMs: 1000 });
    assert.deepEqual(result, { audioUrl: 'https://cdn.fal.ai/polled-speech.wav' });
    // 1 submit + 4 status polls (one per statusSequence entry) + 1 result fetch.
    assert.equal(m.calls.length, 6);
    assert.equal(m.calls.filter((c) => c.url === STATUS_URL).length, 4);
    assert.equal(statusIdx, statusSequence.length, 'every queued status must actually be polled, in order');
  } finally {
    mock.timers.reset();
    m.restore();
  }
});

test('generateSpeech throws VoiceGenError when the queue never completes within FAL_TTS_POLL_TIMEOUT_MS', async () => {
  const m = installFetchMock((record) => {
    if (record.url === SUBMIT_URL) return queueSubmitted();
    if (record.url === STATUS_URL) return statusResult('IN_QUEUE'); // never completes
    return unexpectedUrl(record);
  });
  mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  try {
    await assert.rejects(
      () => settleWithFakeTimers(generateSpeech('This never finishes.'), { tickMs: 1000 }),
      (err) => {
        assert.ok(err instanceof VoiceGenError, `expected VoiceGenError, got ${err}`);
        assert.match(err.message, /did not complete within/);
        return true;
      },
    );
    assert.ok(m.calls.filter((c) => c.url === STATUS_URL).length > 1, 'must have polled more than once before timing out');
  } finally {
    mock.timers.reset();
    m.restore();
  }
});

// --- VoiceGenError: malformed/failed responses and HTTP errors ---

test('generateSpeech throws VoiceGenError when submit response is missing status_url/response_url (malformed)', async () => {
  const m = installFetchMock((record) => {
    if (record.url === SUBMIT_URL) return { ok: true, json: async () => ({ status: 'IN_QUEUE' }) };
    return unexpectedUrl(record);
  });
  try {
    await assert.rejects(() => generateSpeech('Some prose.'), VoiceGenError);
  } finally {
    m.restore();
  }
});

test('generateSpeech throws VoiceGenError when the completed result has no audio.url (malformed)', async () => {
  const m = installFetchMock((record) => {
    if (record.url === SUBMIT_URL) return queueSubmitted();
    if (record.url === STATUS_URL) return statusResult('COMPLETED');
    if (record.url === RESPONSE_URL) return { ok: true, json: async () => ({ not_audio: true }) };
    return unexpectedUrl(record);
  });
  try {
    await assert.rejects(() => generateSpeech('Some prose.'), (err) => {
      assert.ok(err instanceof VoiceGenError);
      assert.match(err.message, /no audio\.url/);
      return true;
    });
  } finally {
    m.restore();
  }
});

test('generateSpeech throws VoiceGenError when the queue reports ERROR status', async () => {
  const m = installFetchMock((record) => {
    if (record.url === SUBMIT_URL) return queueSubmitted();
    if (record.url === STATUS_URL) return statusResult('ERROR');
    return unexpectedUrl(record);
  });
  try {
    await assert.rejects(() => generateSpeech('Some prose.'), (err) => {
      assert.ok(err instanceof VoiceGenError);
      assert.match(err.message, /generation failed/);
      return true;
    });
  } finally {
    m.restore();
  }
});

test('generateSpeech throws VoiceGenError when the queue reports FAILED status', async () => {
  const m = installFetchMock((record) => {
    if (record.url === SUBMIT_URL) return queueSubmitted();
    if (record.url === STATUS_URL) return statusResult('FAILED');
    return unexpectedUrl(record);
  });
  try {
    await assert.rejects(() => generateSpeech('Some prose.'), VoiceGenError);
  } finally {
    m.restore();
  }
});

test('generateSpeech throws VoiceGenError on an HTTP error status from the submit call', async () => {
  const m = installFetchMock((record) => {
    if (record.url === SUBMIT_URL) return httpError(500, 'internal fal error');
    return unexpectedUrl(record);
  });
  try {
    await assert.rejects(() => generateSpeech('Some prose.'), (err) => {
      assert.ok(err instanceof VoiceGenError);
      assert.match(err.message, /HTTP 500/);
      assert.match(err.message, /internal fal error/);
      return true;
    });
  } finally {
    m.restore();
  }
});

test('generateSpeech throws VoiceGenError on an HTTP error status from the status-poll call', async () => {
  const m = installFetchMock((record) => {
    if (record.url === SUBMIT_URL) return queueSubmitted();
    if (record.url === STATUS_URL) return httpError(503, 'queue unavailable');
    return unexpectedUrl(record);
  });
  try {
    await assert.rejects(() => generateSpeech('Some prose.'), (err) => {
      assert.ok(err instanceof VoiceGenError);
      assert.match(err.message, /HTTP 503/);
      return true;
    });
  } finally {
    m.restore();
  }
});

test('generateSpeech throws VoiceGenError on an HTTP error status from the result-fetch call', async () => {
  const m = installFetchMock((record) => {
    if (record.url === SUBMIT_URL) return queueSubmitted();
    if (record.url === STATUS_URL) return statusResult('COMPLETED');
    if (record.url === RESPONSE_URL) return httpError(404, 'not found');
    return unexpectedUrl(record);
  });
  try {
    await assert.rejects(() => generateSpeech('Some prose.'), (err) => {
      assert.ok(err instanceof VoiceGenError);
      assert.match(err.message, /HTTP 404/);
      return true;
    });
  } finally {
    m.restore();
  }
});

test('generateSpeech wraps a raw fetch/network failure (e.g. DNS/connection error) in VoiceGenError with cause set', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new Error('ECONNRESET');
  };
  try {
    await assert.rejects(() => generateSpeech('Some prose.'), (err) => {
      assert.ok(err instanceof VoiceGenError);
      assert.ok(err.cause instanceof Error);
      assert.equal(err.cause.message, 'ECONNRESET');
      return true;
    });
  } finally {
    globalThis.fetch = original;
  }
});

test('VoiceGenError and VoiceGenConfigError are distinct, correctly-named Error subclasses', () => {
  const configErr = new VoiceGenConfigError();
  const upstreamErr = new VoiceGenError('x');
  assert.equal(configErr.name, 'VoiceGenConfigError');
  assert.equal(configErr.code, 'VOICEGEN_CONFIG_MISSING');
  assert.equal(upstreamErr.name, 'VoiceGenError');
  assert.equal(upstreamErr.code, 'VOICEGEN_UPSTREAM_FAILED');
  assert.ok(configErr instanceof Error);
  assert.ok(upstreamErr instanceof Error);
  assert.notEqual(configErr.constructor, upstreamErr.constructor);
});

// --- VoiceGenConfigError: FAL_KEY genuinely unset ---
//
// See the file-header comment: this repo's real repo-root .env holds a
// working FAL_KEY, so config.js's own FAL_KEY export is truthy for any plain
// import in this process. To exercise the real "unconfigured" throw (not a
// hand-rolled stand-in for it), this spawns an isolated child Node process
// with --experimental-test-module-mocks and mocks config.js's FAL_KEY export
// to '' for that child only, then asserts generateSpeech() really rejects
// with a real VoiceGenConfigError instance.

test('VoiceGenConfigError is thrown (not a silent stub) when FAL_KEY is unset', () => {
  const configUrl = new URL('./config.js', import.meta.url).href;
  const voiceGenUrl = new URL('./voiceGen.js', import.meta.url).href;

  const childScript = `
    import assert from 'node:assert/strict';
    import { mock } from 'node:test';

    mock.module(${JSON.stringify(configUrl)}, {
      exports: {
        FAL_KEY: '',
        FAL_KOKORO_MODEL: 'fal-ai/kokoro',
        FAL_KOKORO_VOICE: 'af_heart',
        FAL_TTS_POLL_INTERVAL_MS: 1,
        FAL_TTS_POLL_TIMEOUT_MS: 50,
      },
    });

    const { generateSpeech, VoiceGenConfigError } = await import(${JSON.stringify(voiceGenUrl)});

    try {
      await assert.rejects(
        () => generateSpeech('Some prose.'),
        VoiceGenConfigError,
      );
      process.exit(0);
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  `;

  const dir = mkdtempSync(path.join(tmpdir(), 'voicegen-configerr-'));
  const scriptPath = path.join(dir, 'child.mjs');
  try {
    writeFileSync(scriptPath, childScript, 'utf8');
    const child = spawnSync(
      process.execPath,
      ['--experimental-test-module-mocks', scriptPath],
      { encoding: 'utf8' },
    );
    assert.equal(
      child.status,
      0,
      `child process did not confirm VoiceGenConfigError was thrown.\nstdout:\n${child.stdout}\nstderr:\n${child.stderr}`,
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
