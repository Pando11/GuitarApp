# Wave 2 gate-trust matrix

Date: 2026-09-02

## Green gates run in this pass

| Gate | Command | Result | Trust note | Log |
|---|---|---:|---|---|
| Wave 1 verifier | `node .scratch/guitarapp-software-factory/wave1_full_verify.mjs` | GREEN (0 failures) | Deterministic Node harness. Verifies runner export, Wave 1 parity, Path B local save/reopen. | `wave1-full-verify.txt` |
| App smoke | `node 07-app/test/app-smoke.mjs` | 28 passed / 0 failed | Real `07-app/index.html` classic-script shell in JSDOM. Verifies 25-card catalog, 5/20 unlock split, home performance rail, Path A visibility note, Lesson 1 Sage panel, Lesson 5 Level-1 Path B save/reopen, and Lesson 12 Level-2 hook. | `app-smoke.txt` |
| Fidelity | `node 07-app/test/fidelity.mjs` | 48 passed / 0 failed | Real assertion gate comparing 06-prototypes CommonJS engines against 07-app ESM ports. Not a placeholder. | `fidelity.txt` |
| Sage coaching | `node 07-app/core/sageCoach.test.mjs` | 10 passed / 0 failed | Rule-5 safety check: only stored numbers, no freelanced praise. | `sage-coach.txt` |
| PocketBase crypto | `node 07-app/core/pocketbaseSync.test.mjs` | 12 passed / 0 failed | Offline client-crypto roundtrip. | `pocketbase-sync.txt` |
| Live PocketBase transport | `PB_BASE_URL=... node 07-app/test/pocketbase-live-sync.mjs` | 12 passed / 0 failed | Real HTTP auth + collection reachability + create/update/pull/decrypt against a local PocketBase server. | `pocketbase-live-sync.txt` |
| Student memory sync bridge | `node 07-app/core/studentMemorySync.test.mjs` | 14 passed / 0 failed | Local envelope + encrypted roundtrip + restored store/story proof. | `student-memory-sync.txt` |
| Chord arithmetic | `cd 06-prototypes/step0 && node run-chord-check.js` | 25 lessons / 81 chords / 0 errors / 0 warnings | Ship gate. Arithmetic truth source for chord correctness. | `chord-gate.txt` |
| Curriculum ordering | `node tools/verify-curriculum-order.js` | 0 errors | Real manifest/order/prereq gate. | `curriculum-gate.txt` |
| Song progressions | `node tools/verify-song-progressions.js` | 0 errors / 0 warnings | Real structural/legal-mechanics gate for song track. | `song-gate.txt` |

## Visual proof status

- Hermes remote browser still blocked localhost, so visual proof was captured with the **local Windows Edge executable** plus `playwright-core`.
- Capture command: `node .scratch/guitarapp-software-factory/capture-wave2-visual-proof.mjs`
- Command log: `visual-proof-command.log`
- Walkthrough notes: `visual-walkthrough.md`
- DOM/state dump: `visual-proof.json`
- Screenshots:
  - `w2-e1-home-unlocks.png`
  - `w2-e1-lesson1-sage.png`
  - `w2-e1-lesson5-level1-before.png`
  - `w2-e1-lesson5-level1-after.png`
  - `w2-e1-lesson5-level1-reopen.png`
  - `w2-e1-home-after-level1.png`
  - `w2-e4-lesson12-level2.png`

## Trust calls

- **Trustworthy now:** Wave 1 verifier, app smoke, fidelity, chord gate, curriculum gate, song gate, Sage Rule-5 test, PocketBase offline crypto test, PocketBase live transport test, student-memory-sync bridge test, and the local visual proof bundle.
- **Still limited:** the UI shell now shows performance progress and the live transport is proven, but the browser app is not yet auto-posting to PocketBase during a real lesson/performance run.
