// telemetry.test.mjs — T0.6 Event logging self-test.
//
// Run: node 07-app/core/telemetry.test.mjs
//
// Covers: queue survives simulated reload, flush retries after a failed
// POST, and no event body contains any key from PROFILE_SCHEMA's free-text
// space (checked directly against the imported schema, not a hardcoded copy).

import {
  log,
  flush,
  getQueue,
  getAnonId,
  getSessionId,
  assertNoForbiddenKeys,
  _resetTelemetry,
  _resetSessionId,
} from './telemetry.js';
import { PROFILE_SCHEMA } from './learnerProfile.js';

let passed = 0;
let failed = 0;
function check(name, cond) {
  if (cond) { passed++; console.log(`  PASS  ${name}`); }
  else { failed++; console.error(`  FAIL  ${name}`); }
}
async function checkThrows(name, fn) {
  try {
    await fn();
    failed++; console.error(`  FAIL  ${name} (did not throw)`);
  } catch {
    passed++; console.log(`  PASS  ${name}`);
  }
}

// A minimal in-memory localStorage so this runs under plain Node.
function makeFakeLocalStorage() {
  const store = new Map();
  return {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    _dump: () => new Map(store),
  };
}

console.log('\n=== telemetry.js T0.6 self-test ===');

// ---------------------------------------------------------------------------
// Setup: install a fake persistent localStorage so "reload" can be simulated
// by re-importing against the same backing store.
// ---------------------------------------------------------------------------
globalThis.localStorage = makeFakeLocalStorage();
_resetTelemetry();

// ---------------------------------------------------------------------------
// 1. Basic logging populates the queue with the documented shape.
// ---------------------------------------------------------------------------
const rec = log('lesson_start', { lessonId: 'lesson-1' });
check('log() returns the record', !!rec && rec.event === 'lesson_start');
check('record has ts', typeof rec.ts === 'number');
check('record has sessionId', typeof rec.sessionId === 'string' && rec.sessionId.length > 0);
check('record has anonId', typeof rec.anonId === 'string' && rec.anonId.length > 0);
check('record has lessonId', rec.lessonId === 'lesson-1');
check('queue has 1 item after one log()', getQueue().length === 1);

log('drill_result', { lessonId: 'lesson-1', payload: { drillId: 'd1', passed: true, score: 92 } });
check('queue has 2 items after second log()', getQueue().length === 2);

// ---------------------------------------------------------------------------
// 2. anonId is stable across calls (minted once, kept in localStorage).
// ---------------------------------------------------------------------------
const anon1 = getAnonId();
const anon2 = getAnonId();
check('anonId is stable across calls', anon1 === anon2);

// ---------------------------------------------------------------------------
// 3. Queue survives a simulated reload: re-read raw localStorage the way a
// fresh page load would (new "module instance" reading the same backing
// store). We simulate this by resetting the in-module session id (fresh
// page load gets a new session) while keeping the SAME localStorage object,
// then confirming the queued events are still there and anonId persisted.
// ---------------------------------------------------------------------------
const anonBeforeReload = getAnonId();
const queueBeforeReload = getQueue();
_resetSessionId(); // simulate a fresh page load minting a new session id
const queueAfterReload = getQueue();
check('queue survives simulated reload (same length)', queueAfterReload.length === queueBeforeReload.length);
check('queue survives simulated reload (same content)', JSON.stringify(queueAfterReload) === JSON.stringify(queueBeforeReload));
check('anonId survives simulated reload', getAnonId() === anonBeforeReload);
check('sessionId changes on simulated reload', getSessionId() !== rec.sessionId);

// ---------------------------------------------------------------------------
// 4. flush() retries after a failed POST: queue must remain intact so the
// next flush() call can retry.
// ---------------------------------------------------------------------------
let attempt = 0;
const flakyFetch = async () => {
  attempt++;
  if (attempt === 1) {
    return { ok: false, status: 500, text: async () => 'server error' };
  }
  return { ok: true, status: 200, text: async () => '{}' };
};

const preFlushQueueLen = getQueue().length;
const firstFlush = await flush({ forceFetch: true, fetchImpl: flakyFetch, baseUrl: 'http://127.0.0.1:8090' });
check('failed flush() reports ok:false', firstFlush.ok === false);
check('failed flush() leaves queue intact', getQueue().length === preFlushQueueLen);

const secondFlush = await flush({ forceFetch: true, fetchImpl: flakyFetch, baseUrl: 'http://127.0.0.1:8090' });
check('retried flush() reports ok:true', secondFlush.ok === true);
check('retried flush() drains the queue', getQueue().length === 0);
check('retried flush() reports sent count', secondFlush.sent === preFlushQueueLen);

// ---------------------------------------------------------------------------
// 5. flush() with no transport available fails gracefully (never throws) and
// leaves the queue intact for a later retry (e.g. fully offline).
// ---------------------------------------------------------------------------
log('app_open');
const savedFetch = globalThis.fetch;
delete globalThis.fetch;
const offlineFlush = await flush({ forceFetch: true });
check('offline flush() does not throw and reports ok:false', offlineFlush.ok === false);
check('offline flush() leaves queue intact', getQueue().length === 1);
globalThis.fetch = savedFetch;
await flush({ forceFetch: true, fetchImpl: async () => ({ ok: true, text: async () => '{}' }) });

// ---------------------------------------------------------------------------
// 6. Privacy floor: no event body may contain any key from PROFILE_SCHEMA's
// free-text space (its field names), nor obvious PII keys (email, name, ip).
// ---------------------------------------------------------------------------
const profileFields = Object.keys(PROFILE_SCHEMA);
check('PROFILE_SCHEMA has fields to check against', profileFields.length > 0);

for (const field of profileFields) {
  await checkThrows(`log() payload rejects PROFILE_SCHEMA key "${field}"`, () => {
    assertNoForbiddenKeys({ [field]: 'whatever' });
  });
  await checkThrows(`log() payload rejects nested PROFILE_SCHEMA key "${field}"`, () => {
    assertNoForbiddenKeys({ nested: { [field]: 'whatever' } });
  });
}

await checkThrows('assertNoForbiddenKeys rejects "email"', () => assertNoForbiddenKeys({ email: 'a@b.com' }));
await checkThrows('assertNoForbiddenKeys rejects "name"', () => assertNoForbiddenKeys({ name: 'Ada' }));
await checkThrows('assertNoForbiddenKeys rejects "ip"', () => assertNoForbiddenKeys({ ip: '1.2.3.4' }));

// log() itself must refuse (drop, not throw into caller) a forbidden payload
// rather than queueing it.
_resetTelemetry();
const beforeLen = getQueue().length;
const badRecord = log('feedback_submit', { payload: { email: 'a@b.com', note: 'too fast' } });
check('log() with forbidden key does not throw', true); // reaching this line proves no throw
check('log() with forbidden key returns null', badRecord === null);
check('log() with forbidden key does not enqueue anything', getQueue().length === beforeLen);

// A clean payload for the same event still queues fine.
const goodRecord = log('feedback_submit', { lessonId: 'lesson-1', payload: { note: 'too fast' } });
check('log() with clean payload succeeds', !!goodRecord);
check('queue holds the clean feedback_submit event', getQueue().some((e) => e.event === 'feedback_submit' && e.payload && e.payload.note === 'too fast'));

// Verify every currently-queued event body is scanned clean end-to-end.
const allClean = getQueue().every((e) => {
  try {
    assertNoForbiddenKeys(e.payload);
    return true;
  } catch {
    return false;
  }
});
check('every queued event payload is free of PROFILE_SCHEMA keys', allClean);

console.log(`\n=== ${passed} passed, ${failed} failed ===\n`);
process.exit(failed === 0 ? 0 : 1);
