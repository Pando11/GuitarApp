// service-worker.js — offline shell for the GuitarApp PWA.
//
// CACHE STRATEGY: NETWORK-FIRST with offline fallback (NOT cache-first).
//
// Why: the app is served from Heidi's LAN box via `start-lan.bat`. The intended
// behavior (LAN-INSTALL.md) is "re-open start-lan.bat -> get the latest version."
// A cache-first SW served stale JS after every code change on the PC and left the
// phone showing a blank/broken app until the CACHE version string was manually
// bumped. That manual bump is exactly why "the app stops opening after a change"
// recurred. Network-first means the phone ALWAYS fetches fresh code when the LAN
// server is up, and still works offline via the cache fallback when the server is
// truly down. No manual CACHE version bump is ever needed again.
//
// The LAN server (serve.mjs) already sends `Cache-Control: no-cache` on every
// response, so the only thing that was ever caching was THIS service worker.
// Network-first respects that and keeps the app current automatically.
const CACHE = 'guitarapp-v6'; // bumped 2026-08-12: drop stale L02 E-minor audio/JSON cache (finger wording fix)
const SHELL = ['./', './index.html', './app.js', './styles.css', './manifest.webmanifest'];

self.addEventListener('install', (e) => {
  // Pre-cache the shell so a first offline open has something to fall back to.
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL).catch(() => {})).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  // Delete any older cache version so phones don't carry stale v3/v4 entries.
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  // Only handle same-origin GETs. POSTs (e.g. /api/tts voice proxy) pass through
  // untouched to the network.
  if (e.request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    // NETWORK-FIRST: try the live server (which sends no-cache) so the phone always
    // gets the latest code when Heidi's PC / LAN server is reachable.
    fetch(e.request)
      .then(resp => {
        // Stash a copy for true-offline fallback (runtime caching — no hardcoded list).
        if (resp && resp.ok && (resp.type === 'basic' || resp.type === 'default')) {
          const copy = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return resp;
      })
      .catch(() =>
        // OFFLINE FALLBACK: server unreachable -> serve from cache, else the shell.
        caches.match(e.request)
          .then(cached => cached || caches.match('./index.html'))
      )
  );
});
