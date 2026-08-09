// service-worker.js — offline shell for the PWA. Caches the app core; lesson/teacher
// JSON is fetched at runtime (small). Ban 5: no network calls for audio/practice data.
const CACHE = 'guitarapp-v3';
const CORE = ['./', './index.html', './app.js', './styles.css', './manifest.webmanifest',
  './lib/storage.js', './lib/catalog.js', './lib/dogfood.js', './audio/audioio.js',
  './core/tuner-engine.js', './core/listening-engine.js', './core/chord-theory-check.js',
  './core/schema/validate.js', './core/renderer.js', './core/band-engine.js',
  './core/voice-command.js', './core/teacher.js', './core/entitlementStore.js',
  './core/practiceStore.js', './core/chatEngine.js', './core/adaptivePlan.js',
  './core/messages.js', './core/streaks.js'];

self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE))); self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  // Never cache audio/data POSTs; runtime-cache everything else.
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(resp => {
      if (resp.ok && url.origin === self.location.origin) { const copy = resp.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
      return resp;
    }).catch(() => cached))
  );
});
