// musicGen.test.mjs — mocked-client tests for musicGen.js's fal.ai ACE-Step
// integration (TIER-1B 3A, jam session's generative half). Every fal.ai HTTP
// call is intercepted via a globalThis.fetch stub — this suite makes zero
// real network calls. Poll-loop tests (multi-poll, timeout) use node:test's
// built-in fake timers (Date + setTimeout) rather than sleeping in real
// time, so the real FAL_POLL_INTERVAL_MS/FAL_POLL_TIMEOUT_MS constants
// (2s/45s, config.js) can be exercised in full without a slow test run.
//
// The MusicGenConfigError ("FAL_KEY unset") case is the one exception: this
// repo's real repo-root .env legitimately holds a working FAL_KEY (see
// config.js's readFalKeyFromRootEnv() and its own comments), so FAL_KEY is
// truthy for every plain import of config.js in this process — merely
// unsetting process.env.FAL_KEY would not reproduce "genuinely
// unconfigured", config.js would just fall through to that real file. That
// one test spawns an isolated child Node process with
// --experimental-test-module-mocks to mock config.js's FAL_KEY export to ''
// and prove the real thrown-error branch, not a stub of it.

import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { generateResponse, buildTags, MusicGenConfigError, MusicGenError } from './musicGen.js';
import { FAL_ACE_STEP_MODEL, FAL_MUSICGEN_DURATION_S } from './config.js';

const SUBMIT_URL = `https://queue.fal.run/${FAL_ACE_STEP_MODEL}`;
const STATUS_URL = 'https://queue.fal.run/fal-ai/ace-step/requests/test-id/status';
const RESPONSE_URL = 'https://queue.fal.run/fal-ai/ace-step/requests/test-id';

function facts(overrides = {}) {
  return {
    chordsMatched: ['G', 'C'],
    chordsMissed: ['D'],
    accuracy: 0.8,
    ...overrides,
  };
}

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
  return { ok: true, json: async () => ({ audio: { url: audioUrl } }) };
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

// --- buildTags(): emitFacts()-shaped input -> ACE-Step `tags` string ---
// (buildTags is what actually maps chordsMatched/accuracy into the request;
// chordsMissed is deliberately never surfaced in the generated tags.)

test('buildTags: high accuracy (>=0.75) produces the bright/confident mood line', () => {
  assert.match(buildTags(facts({ accuracy: 0.9 })), /bright, upbeat, confident/);
});

test('buildTags: boundary accuracy 0.75 counts as high (inclusive)', () => {
  assert.match(buildTags(facts({ accuracy: 0.75 })), /bright, upbeat, confident/);
});

test('buildTags: mid accuracy (0.4 <= a < 0.75) produces the warm/encouraging mood line', () => {
  assert.match(buildTags(facts({ accuracy: 0.5 })), /warm, encouraging, steady/);
});

test('buildTags: low accuracy (<0.4) produces the gentle/patient mood line', () => {
  assert.match(buildTags(facts({ accuracy: 0.1 })), /gentle, patient, supportive/);
});

test('buildTags: names matched chords in order, capped at 6, and never mentions chordsMissed', () => {
  const tags = buildTags(facts({
    chordsMatched: ['G', 'C', 'D', 'Em', 'Am', 'F', 'B7'],
    chordsMissed: ['X9'],
  }));
  assert.match(tags, /answering chords G C D Em Am F,/);
  assert.ok(!tags.includes('B7'), 'a 7th matched chord past the cap of 6 must not appear');
  assert.ok(!tags.includes('X9'), 'chordsMissed must never appear in the generated tags');
});

test('buildTags: empty chordsMatched omits the "answering chords" clause entirely', () => {
  const tags = buildTags(facts({ chordsMatched: [] }));
  assert.ok(!tags.includes('answering chords'));
});

test('buildTags: missing/undefined facts fields default safely (no throw, low-accuracy mood)', () => {
  const tags = buildTags({});
  assert.match(tags, /gentle, patient, supportive/);
  assert.ok(!tags.includes('answering chords'));
});

// --- Successful generation: exact request payload + response shape ---

test('generateResponse sends the exact ACE-Step payload derived from buildTags()/FAL_MUSICGEN_DURATION_S, and resolves { audioUrl }', async () => {
  const f = facts({ chordsMatched: ['G', 'C'], chordsMissed: ['D'], accuracy: 0.9 });
  const m = installFetchMock((record) => {
    if (record.url === SUBMIT_URL) return queueSubmitted();
    if (record.url === STATUS_URL) return statusResult('COMPLETED');
    if (record.url === RESPONSE_URL) return completedResult('https://cdn.fal.ai/clip123.wav');
    return unexpectedUrl(record);
  });
  try {
    const result = await generateResponse(f);
    assert.deepEqual(result, { audioUrl: 'https://cdn.fal.ai/clip123.wav' });

    const submitCall = m.calls.find((c) => c.url === SUBMIT_URL);
    assert.equal(submitCall.method, 'POST');
    assert.deepEqual(JSON.parse(submitCall.body), {
      tags: buildTags(f),
      duration: FAL_MUSICGEN_DURATION_S,
    });
  } finally {
    m.restore();
  }
});

test('generateResponse sends fal auth/content-type headers on every request (submit, status, result)', async () => {
  const m = installFetchMock((record) => {
    if (record.url === SUBMIT_URL) return queueSubmitted();
    if (record.url === STATUS_URL) return statusResult('COMPLETED');
    if (record.url === RESPONSE_URL) return completedResult('https://cdn.fal.ai/clip.wav');
    return unexpectedUrl(record);
  });
  try {
    await generateResponse(facts());
    assert.equal(m.calls.length, 3);
    for (const call of m.calls) {
      assert.match(call.headers.Authorization || '', /^Key .+/);
      assert.equal(call.headers['Content-Type'], 'application/json');
    }
  } finally {
    m.restore();
  }
});

test('a different facts payload (low accuracy, no matched chords) still round-trips end to end', async () => {
  const f = facts({ chordsMatched: [], chordsMissed: ['G', 'C'], accuracy: 0.1 });
  const m = installFetchMock((record) => {
    if (record.url === SUBMIT_URL) return queueSubmitted();
    if (record.url === STATUS_URL) return statusResult('COMPLETED');
    if (record.url === RESPONSE_URL) return completedResult('https://cdn.fal.ai/other-clip.wav');
    return unexpectedUrl(record);
  });
  try {
    const result = await generateResponse(f);
    assert.deepEqual(result, { audioUrl: 'https://cdn.fal.ai/other-clip.wav' });
    const submitCall = m.calls.find((c) => c.url === SUBMIT_URL);
    const sentBody = JSON.parse(submitCall.body);
    assert.equal(sentBody.duration, FAL_MUSICGEN_DURATION_S);
    assert.match(sentBody.tags, /gentle, patient, supportive/);
    assert.ok(!sentBody.tags.includes('answering chords'));
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
    if (record.url === RESPONSE_URL) return completedResult('https://cdn.fal.ai/polled-clip.wav');
    return unexpectedUrl(record);
  });
  mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  try {
    const result = await settleWithFakeTimers(generateResponse(facts()), { tickMs: 2000 });
    assert.deepEqual(result, { audioUrl: 'https://cdn.fal.ai/polled-clip.wav' });
    // 1 submit + 4 status polls (one per statusSequence entry) + 1 result fetch.
    assert.equal(m.calls.length, 6);
    assert.equal(m.calls.filter((c) => c.url === STATUS_URL).length, 4);
    assert.equal(statusIdx, statusSequence.length, 'every queued status must actually be polled, in order');
  } finally {
    mock.timers.reset();
    m.restore();
  }
});

test('generateResponse throws MusicGenError when the queue never completes within FAL_POLL_TIMEOUT_MS', async () => {
  const m = installFetchMock((record) => {
    if (record.url === SUBMIT_URL) return queueSubmitted();
    if (record.url === STATUS_URL) return statusResult('IN_QUEUE'); // never completes
    return unexpectedUrl(record);
  });
  mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  try {
    await assert.rejects(
      () => settleWithFakeTimers(generateResponse(facts()), { tickMs: 2000 }),
      (err) => {
        assert.ok(err instanceof MusicGenError, `expected MusicGenError, got ${err}`);
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

// --- MusicGenError: malformed/failed responses and HTTP errors ---

test('generateResponse throws MusicGenError when submit response is missing status_url/response_url (malformed)', async () => {
  const m = installFetchMock((record) => {
    if (record.url === SUBMIT_URL) return { ok: true, json: async () => ({ status: 'IN_QUEUE' }) };
    return unexpectedUrl(record);
  });
  try {
    await assert.rejects(() => generateResponse(facts()), MusicGenError);
  } finally {
    m.restore();
  }
});

test('generateResponse throws MusicGenError when the completed result has no audio.url (malformed)', async () => {
  const m = installFetchMock((record) => {
    if (record.url === SUBMIT_URL) return queueSubmitted();
    if (record.url === STATUS_URL) return statusResult('COMPLETED');
    if (record.url === RESPONSE_URL) return { ok: true, json: async () => ({ not_audio: true }) };
    return unexpectedUrl(record);
  });
  try {
    await assert.rejects(() => generateResponse(facts()), (err) => {
      assert.ok(err instanceof MusicGenError);
      assert.match(err.message, /no audio\.url/);
      return true;
    });
  } finally {
    m.restore();
  }
});

test('generateResponse throws MusicGenError when the queue reports ERROR status', async () => {
  const m = installFetchMock((record) => {
    if (record.url === SUBMIT_URL) return queueSubmitted();
    if (record.url === STATUS_URL) return statusResult('ERROR');
    return unexpectedUrl(record);
  });
  try {
    await assert.rejects(() => generateResponse(facts()), (err) => {
      assert.ok(err instanceof MusicGenError);
      assert.match(err.message, /generation failed/);
      return true;
    });
  } finally {
    m.restore();
  }
});

test('generateResponse throws MusicGenError when the queue reports FAILED status', async () => {
  const m = installFetchMock((record) => {
    if (record.url === SUBMIT_URL) return queueSubmitted();
    if (record.url === STATUS_URL) return statusResult('FAILED');
    return unexpectedUrl(record);
  });
  try {
    await assert.rejects(() => generateResponse(facts()), MusicGenError);
  } finally {
    m.restore();
  }
});

test('generateResponse throws MusicGenError on an HTTP error status from the submit call', async () => {
  const m = installFetchMock((record) => {
    if (record.url === SUBMIT_URL) return httpError(500, 'internal fal error');
    return unexpectedUrl(record);
  });
  try {
    await assert.rejects(() => generateResponse(facts()), (err) => {
      assert.ok(err instanceof MusicGenError);
      assert.match(err.message, /HTTP 500/);
      assert.match(err.message, /internal fal error/);
      return true;
    });
  } finally {
    m.restore();
  }
});

test('generateResponse throws MusicGenError on an HTTP error status from the status-poll call', async () => {
  const m = installFetchMock((record) => {
    if (record.url === SUBMIT_URL) return queueSubmitted();
    if (record.url === STATUS_URL) return httpError(503, 'queue unavailable');
    return unexpectedUrl(record);
  });
  try {
    await assert.rejects(() => generateResponse(facts()), (err) => {
      assert.ok(err instanceof MusicGenError);
      assert.match(err.message, /HTTP 503/);
      return true;
    });
  } finally {
    m.restore();
  }
});

test('generateResponse throws MusicGenError on an HTTP error status from the result-fetch call', async () => {
  const m = installFetchMock((record) => {
    if (record.url === SUBMIT_URL) return queueSubmitted();
    if (record.url === STATUS_URL) return statusResult('COMPLETED');
    if (record.url === RESPONSE_URL) return httpError(404, 'not found');
    return unexpectedUrl(record);
  });
  try {
    await assert.rejects(() => generateResponse(facts()), (err) => {
      assert.ok(err instanceof MusicGenError);
      assert.match(err.message, /HTTP 404/);
      return true;
    });
  } finally {
    m.restore();
  }
});

test('generateResponse wraps a raw fetch/network failure (e.g. DNS/connection error) in MusicGenError with cause set', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new Error('ECONNRESET');
  };
  try {
    await assert.rejects(() => generateResponse(facts()), (err) => {
      assert.ok(err instanceof MusicGenError);
      assert.ok(err.cause instanceof Error);
      assert.equal(err.cause.message, 'ECONNRESET');
      return true;
    });
  } finally {
    globalThis.fetch = original;
  }
});

test('MusicGenError and MusicGenConfigError are distinct, correctly-named Error subclasses', () => {
  const configErr = new MusicGenConfigError();
  const upstreamErr = new MusicGenError('x');
  assert.equal(configErr.name, 'MusicGenConfigError');
  assert.equal(configErr.code, 'MUSICGEN_CONFIG_MISSING');
  assert.equal(upstreamErr.name, 'MusicGenError');
  assert.equal(upstreamErr.code, 'MUSICGEN_UPSTREAM_FAILED');
  assert.ok(configErr instanceof Error);
  assert.ok(upstreamErr instanceof Error);
  assert.notEqual(configErr.constructor, upstreamErr.constructor);
});

// --- MusicGenConfigError: FAL_KEY genuinely unset ---
//
// See the file-header comment: this repo's real repo-root .env holds a
// working FAL_KEY, so config.js's own FAL_KEY export is truthy for any plain
// import in this process. To exercise the real "unconfigured" throw (not a
// hand-rolled stand-in for it), this spawns an isolated child Node process
// with --experimental-test-module-mocks and mocks config.js's FAL_KEY export
// to '' for that child only, then asserts generateResponse() really rejects
// with a real MusicGenConfigError instance.

test('MusicGenConfigError is thrown (not a silent stub) when FAL_KEY is unset', () => {
  const configUrl = new URL('./config.js', import.meta.url).href;
  const musicGenUrl = new URL('./musicGen.js', import.meta.url).href;

  const childScript = `
    import assert from 'node:assert/strict';
    import { mock } from 'node:test';

    mock.module(${JSON.stringify(configUrl)}, {
      exports: {
        FAL_KEY: '',
        FAL_ACE_STEP_MODEL: 'fal-ai/ace-step',
        FAL_POLL_INTERVAL_MS: 1,
        FAL_POLL_TIMEOUT_MS: 50,
        FAL_MUSICGEN_DURATION_S: 20,
      },
    });

    const { generateResponse, MusicGenConfigError } = await import(${JSON.stringify(musicGenUrl)});

    try {
      await assert.rejects(
        () => generateResponse({ chordsMatched: [], chordsMissed: [], accuracy: 0.5 }),
        MusicGenConfigError,
      );
      process.exit(0);
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  `;

  const dir = mkdtempSync(path.join(tmpdir(), 'musicgen-configerr-'));
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
      `child process did not confirm MusicGenConfigError was thrown.\nstdout:\n${child.stdout}\nstderr:\n${child.stderr}`,
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
