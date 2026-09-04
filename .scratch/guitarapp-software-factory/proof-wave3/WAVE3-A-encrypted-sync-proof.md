# WAVE3-A — encrypted sync (real PocketBase) proof

**Local PocketBase server used:** `http://127.0.0.1:8091` (running during this proof run)

## What changed (integration)
- `07-app/app.js`: added encrypted sync wiring:
  - **Pull on app open** from PocketBase (`pullMemory` in LIVE mode)
  - **Push on performance-state updates** by intercepting `localStorage.setItem` for:
    - `guitarapp.wave1.pathb`
    - `guitarapp.wave2.pathb.level2`
  - Uses **device-side encryption** via the existing `studentMemorySync` + `pocketbaseSync` layers.
- `07-app/index.html`: added a small `type="module"` loader that exposes the sync functions to `window.GuitarApp.__encryptedSync`.
- `07-app/test/app-smoke.mjs`: skips `type="module"` scripts so unit smoke stays classic-script compatible.

## Proof script executed
Command (with env vars set):
```bash
PB_BASE_URL='http://127.0.0.1:8091' \
PB_ADMIN_EMAIL='pb_admin@local.test' \
PB_ADMIN_PASS='(set in env)' \
node 07-app/test/wave3-a-pocketbase-browser-live-sync-proof.mjs
```

## Observed results
- `pullMemory` on first open: record initially **not found** (expected for a fresh student)
- Level 1 loop completion triggered a **LIVE push** to PocketBase
- PocketBase record exists + has non-empty `ciphertext` and `iv`
- Ciphertext **does not contain** plaintext tokens (search for `"chordName":"easyC"` and `"chordName":"Em"` within the stored ciphertext field)
- Second open restored local performance state from the pulled encrypted blob:
  - `guitarapp.wave1.pathb.loopsCompleted === 1`
  - `guitarapp.wave1.pathb.expectedIndex === 0`

**Script final line:** `RESULT: GREEN`
