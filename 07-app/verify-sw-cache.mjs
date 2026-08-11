// verify-sw-cache.mjs — GATE: the service worker MUST serve FRESH code over a stale
// cached copy (network-first), so a code change on Heidi's PC reaches the phone's
// installed PWA without a manual cache-version bump.
//
// Root-cause history: the old SW was cache-first with a hardcoded file list + manual
// CACHE version. After any code change on the PC, the phone kept serving the stale
// bundle and blank-screened until the version string was bumped by hand. That manual
// step is exactly why "the app stops opening after a change" recurred. This gate proves
// the regression cannot silently return: it loads the REAL service-worker.js with a
// STALE copy pre-seeded in the cache and asserts the served body is the FRESH one.
//
// Run: node verify-sw-cache.mjs
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SW = resolve(HERE, 'service-worker.js');

const FRESH = 'FRESH-APP-V5';   // token the server (serve.mjs) currently returns
const STALE = 'STALE-OLD-APP';  // token a previously-cached (old) copy held

let passed = 0, failed = 0;
const ok = (n, c, e) => { if (c) passed++; else { failed++; console.log('  FAIL: ' + n + (e ? ' :: ' + e : '')); } };

// ---- mock the SW scope + globals ----
let fetchCount = 0;
const cacheStore = new Map();
globalThis.fetch = async (req) => {
  fetchCount++;
  const url = typeof req === 'string' ? req : req.url;
  const body = url.endsWith('/app.js') ? FRESH : 'shell';
  return { ok: true, type: 'basic', status: 200, clone() { return this; }, async text() { return body; } };
};
globalThis.caches = {
  async open() {
    return {
      async put(req, resp) { cacheStore.set(String(req.url || req), await resp.text()); },
      async match(req) { return cacheStore.get(String(req.url || req)); },
      async delete() {},
    };
  },
  async keys() { return []; },
  async delete() {},
};
const handlers = {};
globalThis.self = {
  location: { origin: 'https://192.168.1.72:8443' },
  addEventListener(type, fn) { handlers[type] = fn; },
  skipWaiting() {}, clients: { claim() {} },
};

// Pre-seed a STALE cached copy of app.js (phone that cached the OLD version).
cacheStore.set('https://192.168.1.72:8443/app.js', STALE);

// Load the REAL service worker so we exercise its actual fetch handler.
const swSrc = readFileSync(SW, 'utf8');
(0, eval)(swSrc);

// Drive a fetch event exactly as the browser would for app.js.
let captured = null;
const evt = {
  request: { url: 'https://192.168.1.72:8443/app.js', method: 'GET' },
  respondWith(promise) { captured = promise; },
};
handlers.fetch(evt);
const result = await captured;
const text = await result.text();

// ---- assertions ----
ok('fetch reached the live server (network-first)', fetchCount >= 1, 'fetchCount=' + fetchCount);
ok('served FRESH code, not stale cache', text === FRESH, 'body=' + JSON.stringify(text));
ok('stale cached copy was NOT served', text !== STALE);

// Guard against the OLD cache-first strategy leaking back in: the served body must
// NOT be the pre-seeded stale token under any cache-first reversion.
ok('NOT cache-first (stale would win if cache-first)', text !== STALE);

console.log('\nSW CACHE GATE: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
