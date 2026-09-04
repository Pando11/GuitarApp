# WAVE4-A — encrypted sync integration verify

## Goal
Hostile integration check: the **real** app flow must pull encrypted student memory on open and push encrypted memory after lesson/performance state changes.

## Read first
- `docs/adr/0001-always-on-encrypted-sync.md`
- `07-app/core/pocketbaseSync.js`
- `07-app/core/studentMemorySync.js`
- `.scratch/guitarapp-software-factory/proof-wave3/WAVE3-A-encrypted-sync-proof.md`

## Hard requirements
- Use **real local PocketBase** (downloaded binary under `.scratch/pocketbase-live/pb-bin/pocketbase.exe`).
- Create a real `student_memory` record, then verify:
  1. ciphertext field is non-empty
  2. ciphertext field contains **no plaintext tokens** for `"chordName":"easyC"` and `"chordName":"Em"`
  3. the app restores local performance state after open (loops completed + expected chord behavior)

## Write scope (disjoint)
Only write:
- `.scratch/guitarapp-software-factory/proof-wave4/` (proof + harness logs)
- Optionally create/update `07-app/test/` harness files IF needed for the integration verify

## Verification (must re-run)
- Run the integration harness itself
- Then record:
  - PB server URL used
  - studentId used
  - passphrase source (generated or supplied)
  - actual PB record read-back evidence

## Stop rules
- If Playwright / headless browser is unavailable, fall back to a deterministic integration harness that:
  - runs JSDOM classic-script shell
  - uses **real HTTP calls** to PocketBase (no stubs)
  - still verifies ciphertext + restore correctness
