// real-call.smoke.mjs — W6.1 live verification script. NOT part of the
// mocked test suite (`npm test` only globs `test/*.test.js`, so this file is
// never picked up automatically and never costs money in CI). Run explicitly:
//
//   cd server
//   npm run test:live
//
// Requires a real ANTHROPIC_API_KEY in server/.env (or already exported in
// the environment). Makes real, unmocked calls to the Anthropic API and to
// the real coaching HTTP server (in-process), and exercises the real
// client-side coachClient/askCoach path from 07-app/core/chatEngine.js so
// that `coach_served` telemetry actually fires. Prints full, unredacted
// (except the API key) output for pasting into a verification report.
//
// This script intentionally does NOT modify or weaken server/test/*.test.js
// — those stay 100% mocked-SDK and run on every `npm test`.

import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadDotEnvIfPresent(filePath) {
  if (!existsSync(filePath)) return;
  const raw = readFileSync(filePath, 'utf8');
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

// Load server/.env (does not override anything already set in the real
// environment) BEFORE importing anything that reads process.env at module
// top level (config.js captures ANTHROPIC_API_KEY into a const at import
// time — later process.env mutations would not reach it).
loadDotEnvIfPresent(path.join(__dirname, '..', '.env'));

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error(
      'ANTHROPIC_API_KEY is not set (checked process.env and server/.env). ' +
      'This script makes a real, billed call to the Anthropic API and refuses to run without a key.'
    );
    process.exitCode = 1;
    return;
  }
  console.log(`Using ANTHROPIC_API_KEY starting with: ${process.env.ANTHROPIC_API_KEY.slice(0, 10)}... (len ${process.env.ANTHROPIC_API_KEY.length})`);

  const { callCoach, buildSystemPrompt } = await import('../src/modelClient.js');

  const systemPrompt = buildSystemPrompt();
  console.log('\n=== System prompt (the cached block) ===');
  console.log(systemPrompt);
  console.log(`=== length: ${systemPrompt.length} chars ===\n`);

  const envelope = {
    anonId: 'w6-1-smoke-test-anon',
    learnerProfile: { ageBand: '18-34', experience: 'never-held-one', goal: 'play campfire songs with friends', minutesPerDay: 15 },
    lessonId: 'L01',
    stepId: null,
    mastery: [{ chord: 'G', label: 'needs_work', confidence: 40 }],
    justHappened: null,
    recentHistory: [],
  };

  // ---------------------------------------------------------------------
  // Step 1 — two real, unmocked calls to modelClient.callCoach. This is the
  // "First real model call" acceptance line, plus the cache-hit check.
  // timeoutMs is raised well above the production MODEL_TIMEOUT_MS (2300ms)
  // because that budget is a *production* latency SLA, not a ceiling this
  // verification script needs to respect.
  // ---------------------------------------------------------------------
  console.log('=== Step 1: real callCoach() x2 (direct, real Anthropic client) ===');

  const t1 = Date.now();
  const first = await callCoach(envelope, { timeoutMs: 30_000 });
  console.log(`First call (${Date.now() - t1}ms). prose: ${JSON.stringify(first.prose)}`);
  console.log('First call usage:', JSON.stringify(first.usage));

  const t2 = Date.now();
  const second = await callCoach(envelope, { timeoutMs: 30_000 });
  console.log(`Second call (${Date.now() - t2}ms). prose: ${JSON.stringify(second.prose)}`);
  console.log('Second call usage:', JSON.stringify(second.usage));

  if (!first.prose || typeof first.prose !== 'string') {
    fail('first callCoach() returned no prose — real model call did not produce usable text');
  } else {
    console.log('OK: first real model call produced a coached response.');
  }

  const cacheReadTokens = second.usage && second.usage.cache_read_input_tokens;
  if (typeof cacheReadTokens === 'number' && cacheReadTokens > 0) {
    console.log(`OK: cache hit observed on second call — cache_read_input_tokens=${cacheReadTokens}`);
  } else {
    fail(`no cache hit on second call — usage.cache_read_input_tokens=${cacheReadTokens} (usage: ${JSON.stringify(second.usage)})`);
  }

  // ---------------------------------------------------------------------
  // Step 2 — full real pipeline: start the real HTTP coach service
  // in-process (src/index.js, unmocked callCoach), then drive it through
  // the actual client-side path (07-app/core/chatEngine.js askCoach), which
  // is the ONLY place `coach_served` telemetry is fired. This proves the
  // real server end-to-end AND that the telemetry event fires on a real
  // model-served response.
  // ---------------------------------------------------------------------
  console.log('\n=== Step 2: real HTTP server + real chatEngine.askCoach() (fires coach_served) ===');

  const { default: server } = await import('../src/index.js');
  await new Promise((resolve) => {
    if (server.listening) resolve();
    else server.once('listening', resolve);
  });
  console.log('Real coach HTTP server is listening.');

  const chatEnginePath = path.join(__dirname, '..', '..', '07-app', 'core', 'chatEngine.js');
  const telemetryPath = path.join(__dirname, '..', '..', '07-app', 'core', 'telemetry.js');
  const chatEngineUrl = new URL(`file://${chatEnginePath.replace(/\\/g, '/')}`).href;
  const telemetryUrl = new URL(`file://${telemetryPath.replace(/\\/g, '/')}`).href;

  const chatEngine = await import(chatEngineUrl);
  const telemetry = await import(telemetryUrl);

  telemetry._resetTelemetry();
  const beforeQueueLen = telemetry.getQueue().length;

  const result = await chatEngine.askCoach(
    envelope,
    'local fallback text (should not be used if the real model answers)',
    { url: 'http://127.0.0.1:8787/coach' },
  );
  console.log('askCoach() result:', JSON.stringify(result));

  const queue = telemetry.getQueue();
  console.log(`Telemetry queue length: before=${beforeQueueLen} after=${queue.length}`);
  console.log('Telemetry queue contents:', JSON.stringify(queue, null, 2));

  const coachServedEvent = queue.find((e) => e.event === 'coach_served');
  if (!coachServedEvent) {
    fail('no coach_served telemetry event was logged after askCoach()');
  } else {
    console.log(`OK: coach_served telemetry fired. payload=${JSON.stringify(coachServedEvent.payload)}`);
  }

  if (result.source !== 'model') {
    fail(`askCoach() did not serve a real model response end-to-end (source=${result.source}) — check server logs above for a guardrail rejection or model error`);
  } else {
    console.log('OK: end-to-end request served a real model response (source: model), not a fallback template.');
  }

  server.close();

  console.log('\n=== Summary ===');
  if (process.exitCode === 1) {
    console.log('One or more checks FAILED — see FAIL lines above.');
  } else {
    console.log('All checks passed.');
  }
}

main().catch((err) => {
  console.error('Uncaught error in real-call.smoke.mjs:', err);
  process.exitCode = 1;
});
