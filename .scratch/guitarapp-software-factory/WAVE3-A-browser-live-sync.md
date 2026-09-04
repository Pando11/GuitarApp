# WAVE3-A — Browser app live encrypted sync

## Goal

Take the sync path from "transport proven in test" to "the browser app actually does encrypted pull on open and encrypted push after lesson/performance changes."

## Read first

- `AGENTS.md`
- `docs/adr/0001-always-on-encrypted-sync.md`
- `.scratch/guitarapp-software-factory/proof-wave2/w2-e5-sync-proof.md`
- `.scratch/guitarapp-software-factory/proof-wave2/gate-trust-matrix.md`

## Current truth

Already working:
- `07-app/core/pocketbaseSync.js` can do real live create/update/pull/decrypt against a local PocketBase server
- `07-app/core/studentMemorySync.js` builds the local envelope and roundtrips it
- `07-app/test/pocketbase-live-sync.mjs` passed `12 passed / 0 failed`

What is NOT done yet:
- the browser app is not yet auto-calling the server during a real lesson/performance flow

## Write scope

Only write inside:
- `07-app/app.js`
- `07-app/core/studentMemorySync.js`
- `07-app/core/pocketbaseSync.js`
- new sync helpers under `07-app/core/` if needed
- new tests under `07-app/test/` or `07-app/core/`
- proof files under `.scratch/guitarapp-software-factory/proof-wave3/`

Do NOT edit performance-shell files unless the parent agent explicitly reassigns scope.

## Required behavior

- pull latest encrypted student memory on app open
- restore local state from the pulled envelope
- push encrypted student memory at session end or after a meaningful performance-state update
- keep local-first behavior intact if PocketBase is unavailable
- never upload plaintext
- keep World 1 and Sage assumptions intact

## Proof required

- real local PocketBase server run
- real write to `student_memory`
- read-back proof that the browser-app-triggered data can be decrypted and restored
- explicit proof that plaintext strings are not stored in ciphertext
- updated logs in `.scratch/guitarapp-software-factory/proof-wave3/`

## Verification

Must re-run at least:
- `node 07-app/test/app-smoke.mjs`
- sync-specific tests you add
- `node 07-app/test/pocketbase-live-sync.mjs`

## Stop rules

Stop only for:
- a real schema mismatch you cannot resolve from docs/code
- a legal/privacy issue
- a conflict with Rule 5 / ADR-0001
