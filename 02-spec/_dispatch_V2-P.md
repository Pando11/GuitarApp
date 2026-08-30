REPO ROOT (your workdir): C:/Users/Hendrickson/Desktop/GuitarApp
LEGAL FLOOR (never violate): Rule 5 — prose only. Rule 9 — commercial-clean + free ONLY. Rule 2 — no camera/hand tracking. Rule 8 — chord correctness 0 errors/0 warnings.

YOUR FILE OWNERSHIP (write ONLY these): EDIT 07-app/app.js, EDIT 07-app/manifest.webmanifest, EDIT/EXTEND 07-app/service-worker.js, CREATE NEW FILE 07-app/core/backupButtons.js (the BI-8 always-visible self-report UI). Do NOT touch other agents' files (practiceStore, sageCoach, storyMemory, feature modules, entitlementStore).

CONTEXT: 07-app/app.js (5921 bytes) is the PWA shell and already exists. service-worker.js + manifest.webmanifest exist. The headline Sage coaching bridge (sageCoach.js) is done; listening engine exists in 07-app/core/listening-engine.js.

TASKS:
1. PWA SHELL HARDENING (A2.1):
   - Confirm app.js registers the service worker and the manifest is linked; fix if missing.
   - Handle the `?dogfood=1` start_url gotcha: ensure app boots correctly when launched with ?dogfood=1 (it should NOT require a real server-only flag to run; it should still load on file:// and localhost). If there's a hardcoded dev-only guard that breaks file://, make it tolerant.
   - Keep all logic dependency-free enough to load over file:// (no bare ES-module imports that break file://; inline or use relative non-module scripts, matching existing app.js style).
   - Verify syntax with `node --check 07-app/app.js` and `node --check 07-app/service-worker.js`. Validate manifest.webmanifest is valid JSON (`node -e "JSON.parse(require('fs').readFileSync('07-app/manifest.webmanifest','utf8'))"`).
   - NOTE: a true live-browser smoke (renderer/tuner/lesson player rendering) is HITL (needs a real browser/device). Report it as SMOKE-PENDING-HITL, not as done.

2. ALWAYS-VISIBLE BACKUP BUTTONS (BI-8 / A2.5):
   - Create 07-app/core/backupButtons.js exposing `mountBackupButtons(rootEl, {onReport})` that injects two always-visible on-screen buttons "Got it" / "Not yet" (so a student is NEVER hard-blocked by the mic). Clicking calls onReport('got'|'not-yet').
   - Wire a minimal hook in app.js to mount them on lesson views (guard so it never throws if root missing). The buttons give memory a SECOND data source (student-said) alongside mic-heard (ADR-0005) — just emit the report; persistence can be added later.
   - Self-test (node, jsdom-free): since DOM may be absent in node, instead export a pure helper `classifyReport(report)` returning {source:'student-said', value: 'got'|'not-yet'} and unit-test that; the DOM mounting function should be guarded for browser-only use (typeof document check). Print PASS.

REPORT (verifiable handles): list files edited/created with byte sizes; node --check results (must pass for app.js + sw); manifest JSON valid (yes/no); self-test stdout (PASS); explicit SMOKE-PENDING-HITL statement.
