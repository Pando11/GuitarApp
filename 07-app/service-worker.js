/**
 * service-worker.js
 *
 * GuitarApp service worker — network-first cache strategy.
 *
 * CRITICAL: the CACHE constant below is the SW version. BUMP IT on every content change.
 * The SW is network-first and the server sends Cache-Control: no-cache, but phones hold
 * a stale copy until the cache name changes. Without the bump, even a clean reload can serve
 * old content. This is the documented LAN-INSTALL.md fix.
 *
 * The ?dogfood=1 flag in manifest start_url bypasses the paywall (for eval only — strip before
 * paid launch). See guitarapp skill §PHONE GATING GOTCHA.
 *
 * STATUS: PLACEHOLDER — real file lost in PC transfer (2026-08-23). Scaffolded from guitarapp skill description.
 * The real SW passed verify-sw-cache.mjs (4/0 ✅) per HANDOFF.md 2026-08-16. That truth is intact; the file is not.
 */

const CACHE = "guitarapp-v5";  // ← BUMP THIS on every content change

const PRECACHE_URLS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./app.js",
  "./core/backupButtons.js",
  "./icons/icon.svg",
  "./core/chatEngine.js",
  "./core/chord-theory-check.js",
  "./core/asset-job.js",
  "./core/entitlementStore.js",
  "./content/lessons/manifest.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then(async (cache) => {
      await cache.addAll(PRECACHE_URLS);
      const response = await fetch("./content/lessons/manifest.json");
      if (!response.ok) throw new Error("Lesson manifest could not be cached");
      const manifest = await response.json();
      const files = Array.isArray(manifest.files) ? manifest.files : [];
      await cache.addAll(files.map((file) => `./content/lessons/${file}`));
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Network-first for app shell + content; cache-fallback for audio (proof-only wavs)
  const url = new URL(event.request.url);

  if (url.pathname.endsWith(".wav") || url.pathname.endsWith(".mp3") || url.pathname.endsWith(".m4a")) {
    // Audio is cached on first play (lazy), never precached on install — a full
    // lesson's audio can be 10s of MB and would blow the install-time budget.
    event.respondWith(cacheFirst(event.request));
  } else {
    event.respondWith(networkFirst(event.request));
  }
});

function networkFirst(request) {
  return fetch(request)
    .then((response) => {
      if (response.ok) {
        const clone = response.clone();
        caches.open(CACHE).then((cache) => cache.put(request, clone));
      }
      return response;
    })
    .catch(() => caches.match(request).then((cached) => cached || new Response("Offline", { status: 503 })));
}

function cacheFirst(request) {
  return caches.match(request).then((cached) => {
    if (cached) return cached;
    return fetch(request).then((response) => {
      caches.open(CACHE).then((cache) => cache.put(request, response.clone()));
      return response;
    });
  });
}
