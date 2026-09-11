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

const CACHE = "guitarapp-v7";  // ← BUMP THIS on every content change

const PRECACHE_URLS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./app.js",
  "./core/backupButtons.js",
  "./core/lesson-runner.js",
  "./icons/icon.svg",
  "./core/chatEngine.js",
  "./core/chord-theory-check.js",
  "./core/asset-job.js",
  "./core/entitlementStore.js",
  "./content/lessons/manifest.json",
  "./audio/manifest.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then(async (cache) => {
      await cache.addAll(PRECACHE_URLS);

      // All 25 lesson JSONs (their listing was already dynamic before this
      // change — index.html's inline script calls window.GuitarApp.LessonRunner
      // .createLessonRunner(), which lives in core/lesson-runner.js above, so a
      // lesson could not have opened offline even with its JSON cached).
      const response = await fetch("./content/lessons/manifest.json");
      if (!response.ok) throw new Error("Lesson manifest could not be cached");
      const manifest = await response.json();
      const files = Array.isArray(manifest.files) ? manifest.files : [];
      await cache.addAll(files.map((file) => `./content/lessons/${file}`));

      // Lesson 1's voice clips only, precached — everything else is lazy
      // (see the fetch handler below). A lesson without Sage's voice reads as
      // broken to a beginner, but the full catalog is 201 files across 25
      // lessons, tens of MB; precaching all of it would turn a small,
      // fast app-shell install into one a weak connection may never finish.
      // Lesson 1 is the one lesson every new student is guaranteed to open
      // first, often on that same weak connection, before the on-demand
      // cache (below) has had a chance to warm from a real play. Lessons
      // 2-25 are fetched on first play and cached from then on.
      const audioResponse = await fetch("./audio/manifest.json");
      if (audioResponse.ok) {
        const audioManifest = await audioResponse.json();
        const l01 = audioManifest && typeof audioManifest === "object" ? audioManifest.l01 : null;
        const l01Clips = l01 && typeof l01 === "object" ? Object.values(l01).filter((p) => typeof p === "string") : [];
        await cache.addAll(l01Clips.map((path) => `./audio/${path}`));
      }
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

  if (url.pathname.endsWith(".mp4") || url.pathname.endsWith(".ogv") || url.pathname.endsWith(".webm")) {
    // Video is left entirely to the browser: don't intercept, don't cache.
    // A <video> element fetches with Range headers and gets 206 Partial
    // Content back, which cache.put() rejects outright ("Partial response is
    // unsupported"), and a cached partial would be worse than none. The
    // Emerald Hollow cold open is ~11MB across three clips, which also has no
    // business sitting in the offline shell cache.
    return;
  }

  if (url.pathname.endsWith(".wav") || url.pathname.endsWith(".mp3") || url.pathname.endsWith(".m4a")) {
    // Audio is cache-first. Lesson 1's clips are already in the cache from
    // install (see above); everything else is cached lazily on first play —
    // the full 201-file, tens-of-MB catalog would blow the install-time budget.
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
