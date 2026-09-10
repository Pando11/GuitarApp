// telemetry.js — T0.6 Event logging.
//
// Privacy floor: events are plaintext by design (a separate PocketBase
// `events` collection from the encrypted `student_memory` one — see
// pocketbase-dev/pb_migrations/1788485200_created_events.js), so NO email,
// name, or IP-derived identifier may ever be attached. `anonId` is a random
// UUID minted once and kept in localStorage — it identifies a device/session,
// not a person.
//
// Buffers to localStorage; flushes via navigator.sendBeacon (falling back to
// fetch when sendBeacon is unavailable, e.g. under Node tests). Offline is the
// normal case: the queue must survive reload and retry, and must never throw
// into the caller's lesson flow.
//
// Pure-ish module: works in Node (in-memory fallbacks) so it can be unit
// tested, and in the browser (real localStorage + sendBeacon).

export const QUEUE_KEY = 'guitarapp.telemetry.queue.v1';
export const ANON_ID_KEY = 'guitarapp.telemetry.anonId.v1';

export const KNOWN_EVENTS = [
  'app_open',
  'onboarding_complete',
  'lesson_start',
  'lesson_step_complete',
  'lesson_complete',
  'lesson_abandon',
  'drill_result',
  'audio_play',
  'feedback_submit',
];

// --- storage backend ---------------------------------------------------------
// Uses globalThis.localStorage if present, otherwise an in-memory fallback
// (Node tests / any environment without a DOM).
const _mem = new Map();

function _ls() {
  try {
    return (typeof globalThis !== 'undefined' && globalThis.localStorage) ? globalThis.localStorage : null;
  } catch {
    return null;
  }
}

function _readRaw(key) {
  const ls = _ls();
  return ls ? ls.getItem(key) : (_mem.has(key) ? _mem.get(key) : null);
}

function _writeRaw(key, value) {
  const ls = _ls();
  if (ls) ls.setItem(key, value); else _mem.set(key, value);
}

function _readQueue() {
  const raw = _readRaw(QUEUE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function _writeQueue(queue) {
  _writeRaw(QUEUE_KEY, JSON.stringify(queue));
}

// --- anonId ------------------------------------------------------------------

function _randomUUID() {
  const c = (typeof globalThis !== 'undefined') ? globalThis.crypto : null;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  // Fallback UUID v4 generator (no crypto.randomUUID available).
  let d = Date.now();
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    d += performance.now();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
    const r = (d + Math.random() * 16) % 16 | 0;
    d = Math.floor(d / 16);
    const v = ch === 'x' ? r : ((r & 0x3) | 0x8);
    return v.toString(16);
  });
}

// Returns the stable per-device anonymous id, minting one on first use.
export function getAnonId() {
  let id = _readRaw(ANON_ID_KEY);
  if (!id) {
    id = _randomUUID();
    _writeRaw(ANON_ID_KEY, id);
  }
  return id;
}

// Test/dev helper: wipes anonId + queue. Not part of the runtime UX.
export function _resetTelemetry() {
  const ls = _ls();
  if (ls) {
    ls.removeItem(QUEUE_KEY);
    ls.removeItem(ANON_ID_KEY);
  } else {
    _mem.delete(QUEUE_KEY);
    _mem.delete(ANON_ID_KEY);
  }
}

// --- session id ---------------------------------------------------------------
// One per module load (i.e. per page load in the browser). Not persisted.
let _sessionId = _randomUUID();

export function getSessionId() {
  return _sessionId;
}

// Test helper to force a fresh session (simulates a new page load).
export function _resetSessionId() {
  _sessionId = _randomUUID();
  return _sessionId;
}

// --- privacy guard -------------------------------------------------------------
// Denylist of keys that must never appear anywhere in an event body. Derived
// from PROFILE_SCHEMA's free-text-ish field names plus obvious PII keys.
// Kept as a static list (not imported at call time from learnerProfile.js
// values) so a bad payload is rejected even if the caller mutates the schema
// object; callers that DO want profile-derived buckets (e.g. ageBand) should
// pass through Tier 1 aggregation, not raw telemetry.
const DENYLISTED_KEYS = new Set([
  'email', 'name', 'firstName', 'lastName', 'fullName', 'ip', 'ipAddress',
  'address', 'phone', 'phoneNumber',
  // PROFILE_SCHEMA field names (see learnerProfile.js) — profile answers are
  // not allowed to ride along on an event body.
  'ageBand', 'experience', 'goal', 'minutesPerDay',
]);

function _collectKeys(value, out, depth = 0) {
  if (!value || typeof value !== 'object' || depth > 6) return;
  for (const key of Object.keys(value)) {
    out.add(key);
    _collectKeys(value[key], out, depth + 1);
  }
}

// Throws if `payload` (or any nested object within it) contains a key on the
// denylist. Exported so tests (and callers) can check without needing to
// trigger a full log() call.
export function assertNoForbiddenKeys(payload) {
  if (!payload) return;
  const keys = new Set();
  _collectKeys(payload, keys, 0);
  for (const k of keys) {
    if (DENYLISTED_KEYS.has(k)) {
      throw new Error(`telemetry: payload contains forbidden key "${k}"`);
    }
  }
}

// --- transport -----------------------------------------------------------------

function _resolveBeacon(options) {
  if (options && typeof options.sendBeacon === 'function') return options.sendBeacon;
  if (typeof navigator !== 'undefined' && navigator && typeof navigator.sendBeacon === 'function') {
    return navigator.sendBeacon.bind(navigator);
  }
  return null;
}

function _resolveFetch(options) {
  if (options && typeof options.fetchImpl === 'function') return options.fetchImpl;
  if (typeof globalThis.fetch === 'function') return globalThis.fetch;
  return null;
}

// Where the events PocketBase lives. The loopback address is only correct on
// the machine running PocketBase, so a deployed copy of the app could never
// reach it and every feedback row / event log from that device went nowhere
// (the same bug chatEngine.js's coach URL had — see defaultCoachUrl() there).
// A deployment sets globalThis.GUITARAPP_TELEMETRY_URL (a one-line <script>
// in index.html, or the build that writes it) and this picks it up; local
// development keeps working with no configuration at all. options.baseUrl
// still wins over both, which is how the tests (and flush() callers) inject
// a stub or override.
const FALLBACK_TELEMETRY_URL = 'http://127.0.0.1:8090';

export function defaultTelemetryUrl() {
  const configured = (typeof globalThis !== 'undefined') ? globalThis.GUITARAPP_TELEMETRY_URL : null;
  return (typeof configured === 'string' && configured) ? configured : FALLBACK_TELEMETRY_URL;
}

// Attempts to deliver `events` (an array of event objects) to PocketBase.
// Returns true on apparent success, false on failure — never throws.
async function _send(events, options) {
  const baseUrl = (options && options.baseUrl) || defaultTelemetryUrl();
  const collection = (options && options.collection) || 'events';
  const url = `${baseUrl}/api/collections/${collection}/records`;
  const body = JSON.stringify({ events });

  try {
    const beacon = _resolveBeacon(options);
    // sendBeacon has no way to report server-side failure (fire-and-forget),
    // so only trust it when the caller hasn't asked us to verify delivery
    // (i.e. no fetchImpl override supplied for testing retry behavior).
    if (beacon && !(options && options.forceFetch)) {
      const blob = (typeof Blob !== 'undefined')
        ? new Blob([body], { type: 'application/json' })
        : body;
      const ok = beacon(url, blob);
      return !!ok;
    }

    const fetchImpl = _resolveFetch(options);
    if (!fetchImpl) return false;
    const res = await fetchImpl(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    return !!(res && res.ok);
  } catch {
    return false;
  }
}

// --- public API -----------------------------------------------------------------

// Queues one event. Never throws — a bad call logs to console (if available)
// and is dropped, so a telemetry bug can never break the lesson flow.
export function log(event, { lessonId, payload } = {}) {
  try {
    if (!event || typeof event !== 'string') return;
    if (payload !== undefined) assertNoForbiddenKeys(payload);

    const record = {
      event,
      ts: Date.now(),
      sessionId: getSessionId(),
      anonId: getAnonId(),
    };
    if (lessonId !== undefined) record.lessonId = lessonId;
    if (payload !== undefined) record.payload = payload;

    const queue = _readQueue();
    queue.push(record);
    _writeQueue(queue);
    return record;
  } catch (err) {
    try { console.error('telemetry.log failed:', err); } catch { /* no console */ }
    return null;
  }
}

// Returns a shallow copy of the current queue (for inspection/testing).
export function getQueue() {
  return _readQueue();
}

// Attempts to flush the queue. Sent events are removed only once delivery
// appears to have succeeded; on failure the queue is left intact (untouched
// order) so the next flush() retries the same events. Never throws.
export async function flush(options = {}) {
  try {
    const queue = _readQueue();
    if (!queue.length) return { sent: 0, remaining: 0, ok: true };

    const ok = await _send(queue, options);
    if (ok) {
      _writeQueue([]);
      return { sent: queue.length, remaining: 0, ok: true };
    }
    return { sent: 0, remaining: queue.length, ok: false };
  } catch (err) {
    try { console.error('telemetry.flush failed:', err); } catch { /* no console */ }
    const remaining = _readQueue().length;
    return { sent: 0, remaining, ok: false };
  }
}

// Convenience: attaches a `visibilitychange`/`pagehide` listener that flushes
// via sendBeacon on unload. Safe no-op outside a browser (no `window`).
// Not auto-invoked by this module — T0.7 wires it into the app shell.
export function installUnloadFlush(options = {}) {
  if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') return;
  const handler = () => { flush(options); };
  window.addEventListener('pagehide', handler);
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') handler();
  });
}
