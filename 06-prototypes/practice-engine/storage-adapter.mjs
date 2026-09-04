// storage-adapter.mjs — tiny persistence layer for the fluency store.
//
// PURPOSE
//   The pure engine (fluency-store.mjs) is platform-free: it only knows how to
//   toJSON() itself and load(json) a saved blob. This adapter owns *where* that
//   blob lives — browser localStorage in the app, or an in-memory map in tests /
//   when storage is blocked (private mode, sandboxed iframe, quota errors).
//
//   The engine NEVER imports this file, so its `now()` injection (used by the
//   unit tests) stays untouched and it remains runnable in plain Node.
//
// INTERFACE (tiny)
//   const adapter = createStorageAdapter();
//   adapter.save(store.toJSON());   // after each drill
//   const json = adapter.load();    // on app open -> store.load(json)
//   adapter.clear();                // optional
//
// FALLBACK
//   If localStorage is unavailable or a write throws, the adapter silently
//   degrades to an in-memory backend so the session keeps working. `save`
//   rethrows on the *original* failure so the caller can surface it, but the
//   data is still retained in memory for the life of the page.

const DEFAULT_KEY = 'guitarapp:fluency-store:v1';
const FORMAT_VERSION = 1;

// ---- backends -------------------------------------------------------------

// In-memory backend: a Map. Used in Node tests and as the fallback when
// localStorage is missing or throws. Exported so tests can inject it and stay
// deterministic regardless of any global localStorage.
export function createMemoryBackend() {
  const mem = new Map();
  return {
    kind: 'memory',
    get(key) { return mem.has(key) ? mem.get(key) : null; },
    set(key, val) { mem.set(key, val); },
    remove(key) { mem.delete(key); },
  };
}

function createLocalStorageBackend(ls) {
  return {
    kind: 'localStorage',
    get(key) { return ls.getItem(key); },
    set(key, val) { ls.setItem(key, val); },
    remove(key) { ls.removeItem(key); },
  };
}

// Pick a backend: prefer localStorage (browser), fall back to memory.
// `typeof localStorage` is safe even when the global is undeclared (returns
// 'undefined' without throwing).
function detectBackend() {
  try {
    if (typeof localStorage !== 'undefined' && localStorage) {
      const probe = '__guitarapp_storage_probe__';
      localStorage.setItem(probe, '1');
      localStorage.removeItem(probe);
      return createLocalStorageBackend(localStorage);
    }
  } catch {
    // Access denied / unavailable (private mode, sandbox, etc.) -> fall through.
  }
  return createMemoryBackend();
}

// ---- adapter --------------------------------------------------------------

export function createStorageAdapter({ key = DEFAULT_KEY, backend = null } = {}) {
  // May be swapped to memory at runtime if a persist write throws.
  let active = backend || detectBackend();

  // Persist the store's JSON blob. Returns true on success.
  // Throws if the *original* backend rejects the write (e.g. quota), after
  // copying the value into the in-memory fallback so the session survives.
  function save(json) {
    const payload = { v: FORMAT_VERSION, savedAt: Date.now(), data: json };
    const raw = JSON.stringify(payload);
    try {
      active.set(key, raw);
      return true;
    } catch (e) {
      if (active.kind !== 'memory') active = createMemoryBackend();
      try { active.set(key, raw); } catch { /* give up silently */ }
      throw new Error('storage save failed: ' + (e && e.message ? e.message : String(e)));
    }
  }

  // Load the saved store JSON, or null if none / corrupt.
  function load() {
    let raw = null;
    try { raw = active.get(key); } catch { raw = null; }
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || parsed.data == null) return null;
      return parsed.data; // the raw toJSON() blob -> store.load(data)
    } catch {
      return null; // corrupt payload: treat as "no saved store"
    }
  }

  function clear() {
    try { active.remove(key); } catch { /* no-op */ }
  }

  return { save, load, clear, get backend() { return active; } };
}
