// storage-glue.js — thin browser glue connecting the fluency store to the
// storage adapter.
//
// This file is intentionally DECOUPLED: it receives the store and the adapter
// as arguments (it does NOT import fluency-store.mjs or storage-adapter.mjs),
// so neither the pure engine nor the adapter carry DOM/platform dependencies.
// It only knows how to (a) hydrate the store from saved data on app open and
// (b) update an OPTIONAL #storage-status indicator. If that element is absent
// (another agent is responsible for creating <div id="storage-status">),
// every status call NO-OPs gracefully.
//
// ---------------------------------------------------------------------------
// WHERE THE APP SHOULD CALL THIS
// ---------------------------------------------------------------------------
//   1) ON APP OPEN (after the fluency store is created, e.g. DOMContentLoaded):
//
//        const store   = createFluencyStore({ knownPairs });
//        const adapter = createStorageAdapter();
//        PracticeStorageGlue.initStorage(store, adapter);
//
//      initStorage() reads adapter.load() and, if data exists, calls
//      store.load(data) to hydrate memory from the previous session, then
//      updates #storage-status ("restored N pairs" / "no saved data").
//
//   2) AFTER EACH COMPLETED DRILL (in the drill-finished handler, immediately
//      after store.record(...)):
//
//        store.record(pair, { ratePerMin });
//        PracticeStorageGlue.persist(store, adapter);   // adapter.save(store.toJSON())
//
//      persist() writes the latest store snapshot to storage and refreshes the
//      #storage-status indicator ("saved"). This is the per-drill save step;
//      initStorage is ONLY for cold-start hydration.
//
// The store's `now()` injection used by the unit tests is never touched here —
// this glue only ever calls store.load / store.toJSON / store.snapshot.
// ---------------------------------------------------------------------------

(function (global) {
  'use strict';

  // Optional status indicator. NO-OPs if the element is absent or `document`
  // is unavailable (e.g. running outside a browser).
  function statusEl() {
    try {
      return typeof document !== 'undefined' ? document.getElementById('storage-status') : null;
    } catch {
      return null;
    }
  }

  function setStatus(text) {
    const el = statusEl();
    if (!el) return; // NO-OP if #storage-status is absent
    el.textContent = text;
  }

  // Hydrate `store` from the adapter on app open.
  // Returns the (possibly hydrated) store. Safe when there is no saved data.
  function initStorage(store, adapter) {
    if (!store || !adapter) {
      setStatus('storage unavailable');
      return store;
    }
    let loaded = null;
    try {
      loaded = adapter.load();
    } catch {
      setStatus('load failed');
      return store;
    }
    if (loaded && typeof store.load === 'function') {
      try {
        store.load(loaded);
        const count =
          typeof store.snapshot === 'function' ? store.snapshot().length : 0;
        setStatus(count > 0 ? 'restored ' + count + ' pairs' : 'no saved data');
      } catch {
        setStatus('restore failed');
      }
    } else {
      setStatus('no saved data');
    }
    return store;
  }

  // Per-drill persistence: write the latest store snapshot and refresh status.
  // Returns true on success. Never throws — surfaces failure via status text.
  function persist(store, adapter) {
    if (!store || !adapter) {
      setStatus('storage unavailable');
      return false;
    }
    try {
      const json = typeof store.toJSON === 'function' ? store.toJSON() : store;
      adapter.save(json);
      setStatus('saved');
      return true;
    } catch {
      setStatus('save failed');
      return false;
    }
  }

  const api = { initStorage, persist, setStatus };

  // Dual export: global for classic <script> and module contexts; module.exports
  // for any CommonJS/bundler consumers. Safe to load either way.
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (global) global.PracticeStorageGlue = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
