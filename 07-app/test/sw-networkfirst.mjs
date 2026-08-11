// sw-networkfirst.mjs — proves the network-first SW serves FRESH code even when a
// STALE copy is already in the cache. This is the exact bug that made the phone show
// a blank/old app after every change under the old cache-first strategy.
//
// We mock the SW globals (caches, fetch, self.location) and load the REAL
// service-worker.js via a tiny loader so we exercise its actual fetch handler logic.
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');

let fetchCount = 0;
const STALE = 'STALE-OLD-APP-V3';            // what the old cache-first SW would have served
const FRESH = 'FRESH-APP-V5';                // what the server now returns
const cacheStore = new Map();                // pretend SW cache already holds a STALE entry

// Mock fetch: returns the FRESH response (server is up = normal case)
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

// Mock the SW scope: self.addEventListener captures the 'fetch' handler.
const handlers = {};
globalThis.self = {
  location: { origin: 'https://192.168.1.72:8443' },
  addEventListener(type, fn) { handlers[type] = fn; },
  skipWaiting() {}, clients: { claim() {} },
};

// Pre-seed a STALE cached copy of app.js (simulating a phone that cached the old version).
cacheStore.set('https://192.168.1.72:8443/app.js', STALE);

// Load the REAL service worker so we test its actual handler.
const swSrc = readFileSync(resolve(ROOT, 'service-worker.js'), 'utf8');
// Strip the install/activate (they call caches.open etc.) — we only need the fetch handler.
// The file registers handlers via self.addEventListener, which our mock captures.
const withMocks = swSrc
  // neutralize top-level install/activate side effects by no-op-ing addEventListener for them is not possible;
  // instead, just eval the whole file — install/activate handlers just get stored, not run.
  ;
const mod = new Function('self', 'caches', 'fetch', 'caches', withMocks + '\n; this.__h = (typeof handlers!=="undefined")?null:null;');
// Simpler: run in global scope since we set globals above.
(0, eval)(swSrc);

// Now drive a fetch event exactly like the browser would for app.js.
let captured = null;
const evt = {
  request: { url: 'https://192.168.1.72:8443/app.js', method: 'GET' },
  respondWith(promise) { captured = promise; },   // real SW: browser resolves with this
};
handlers.fetch(evt);
const result = await captured;
const text = await result.text();

console.log('fetch called (server reached):', fetchCount, 'time(s)');
console.log('returned body contains FRESH token:', text === FRESH);
console.log('returned body contains STALE token:', text === STALE);
if (text === FRESH) {
  console.log('PASS: network-first served the fresh app over a stale cached copy.');
  process.exit(0);
} else {
  console.log('FAIL: served stale cache — phone would still show the old/broken app.');
  process.exit(1);
}
