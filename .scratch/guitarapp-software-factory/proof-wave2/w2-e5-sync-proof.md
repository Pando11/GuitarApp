# W2-E5 encrypted student-memory sync proof

## New bridge

- Module: `07-app/core/studentMemorySync.js`
- Offline test: `07-app/core/studentMemorySync.test.mjs`
- Live PocketBase test: `07-app/test/pocketbase-live-sync.mjs`

## What it does

- builds a single student-memory envelope from the live `PracticeStore`
- derives Layer 2 story memory from Layer 1 practice data
- saves that envelope locally under `guitarapp.student-memory.local`
- encrypts the same envelope into a PocketBase-ready record with `ciphertext`, `iv`, and `salt`
- decrypts a stored record back into:
  - the envelope
  - a restored `PracticeStore`
  - restored story-memory data

## Offline proof run

- Command: `node 07-app/core/studentMemorySync.test.mjs`
- Result: `14 passed / 0 failed`
- Log: `student-memory-sync.txt`

## Live PocketBase proof run

- PocketBase binary downloaded locally to `.scratch/pocketbase-live/pb-bin/pocketbase.exe`
- Local server run on `http://127.0.0.1:8091`
- Command: `PB_BASE_URL='http://127.0.0.1:8091' PB_ADMIN_EMAIL='wave2-admin@example.com' PB_ADMIN_PASS='Wave2LocalPass!123' node 07-app/test/pocketbase-live-sync.mjs`
- Result: `12 passed / 0 failed`
- Log: `pocketbase-live-sync.txt`

## Live read-back proof

The live test verified all of these with real execution:
- superuser auth to PocketBase succeeded
- `student_memory` collection was reachable
- first live push created a real PocketBase record
- second live push updated the same record id
- live pull fetched by `student_id` and decrypted correctly
- restored store kept completed lesson count, teacher id, and updated practice minutes
- stored ciphertext did not expose plaintext strings like `emerald-hollow`

## Honest scope note

- This proves the live local PocketBase path.
- It does **not** yet mean the phone/browser app is auto-calling the server in a full UI session.
- What is now proven is the real transport contract, not just offline crypto.
