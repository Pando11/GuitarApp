# HANDOFF — GuitarApp PWA build (07-app)

> Re-synced 2026-08-13. Original session was 2026-08-08 (overnight PWA spike). Two command paths
> below were corrected: `verify-sw-cache.mjs` lives in `07-app/` (not `07-app/test/`), and app-smoke
> is 20/0 (not 18/0). The defect log + structure below are accurate and kept.

Owner: Heidi Hendrickson. Single source of truth for what exists, what's proven, and what's NOT done.
Read this + `02-spec/FEATURES-LOCKED-v1-2026-08-07.md` + `PLAN-from-locked-spec-2026-08-07.md`
+ repo-root `HANDOFF.md` (current-state pointer).

## WHAT GOT BUILT THIS SESSION
A REAL, INSTALLABLE PWA (not another HTML prototype) under `07-app/`. Decision: spike resolved to PWA
(one codebase, installs on iOS Safari + Android Chrome, runs the proven engines via Web Audio + mic + Web
Speech). This host has Node 24 but NO Flutter/Dart/RN/Android SDK, so PWA is the only shippable form
buildable AND provable here. Engine layer stays SDK-agnostic for a later native rewrite.

## VERIFIED RIGHT NOW (re-run live, do not trust prior stamps)
- `cd 07-app/test && node fidelity.mjs`  → FIDELITY GATE 48 passed, 0 failed
  (proves 07-app/core ESM ports are byte-faithful to the proven 06-prototypes Node engines)
- `cd 07-app/test && node app-smoke.mjs`  → APP SMOKE 20 passed, 0 failed
  (headless DOM harness importing the REAL app.js: boot, catalog, entitlement gating, lesson render,
   teacher-swap invariant, voice intents all exercised)
- `cd 07-app && node verify-sw-cache.mjs` → SW CACHE GATE 4 passed, 0 failed
  (proves the service worker serves FRESH code over a stale cached copy — network-first. This is the
   guard that prevents "the phone app stops opening after a code change": the old cache-first SW with a
   hardcoded list + manual CACHE version bump was the recurring break. If a future edit reverts the SW
   to cache-first, this gate FAILS before it ever reaches a phone.)
- `python3 test/playwright-hostile.py` → HOSTILE PLAYWRIGHT 30 passed, 0 console/page errors (GREEN).
  Includes a runtime SW-cache regression test: loads the app (SW caches shell), mutates app.js on disk
  to simulate a code change, reloads, and asserts the browser received the NEW app.js. Hardened the
  harness to ignore the expected keyless-voice `/api/tts` 501 (documented OpenAI/Chatterbox stopgap,
  not a defect). Also made serve.mjs fail SOFT on a blocked HTTPS port so the HTTP server (used by the
  harness + desktop) stays up instead of the whole process crashing on EADDRINUSE.
- Both inherit the 16 prior Node gates (step0..step9, F7 band, F10 voice) which were ALSO re-run green.
## STRUCTURE (07-app/)
- core/ — 13 engines ported 1:1 from 06-prototypes (tuner-engine, listening-engine, chord-theory-check,
  schema/validate, renderer, band-engine, voice-command, teacher, entitlementStore, practiceStore,
  chatEngine, adaptivePlan, messages, streaks). Algorithms byte-identical; only `require('fs')` self-audit
  + `module.exports` removed. Proven faithful by fidelity.mjs.
- audio/audioio.js — device boundaries: MicAnalyzer (Web Audio mic -> pitch/verify), playBuffer (band
  playback, closes AudioContext after), speak() (OpenAI TTS per-call w/ speechSynthesis fallback),
  startListening() (Web Speech STT). Ban 5: audio never leaves device.
- lib/storage.js — AppState: PracticeStore + EntitlementStore + settings in localStorage. RevenueCat
  drop-in hook (purchase() flips to sandbox until keys; attachRevenueCatAdapter for live keys).
- lib/catalog.js — discovers content/ JSON over fetch + manifest.json; content-only pack scale-out (F8).
- app.js — router + 11 screens (home, lessons, tuner, metronome, roster, teacherDetail, chat, plan,
  progress, band, packs, upgrade, lesson, paywall). Wires proven engines end-to-end.
- index.html, styles.css, manifest.webmanifest, icon.svg, service-worker.js, serve.mjs (zero-dep static host).
## DEFECTS I FOUND AND FIXED THIS SESSION (before hostile review returned)
1. Tuner dead code (app.js renderTuner): computed a `verdict` var never used from a convoluted
   expression; cleaned to use `nearestOpen(f)` + note name. Cosmetic/logic clarity, not a wrong-note bug.
2. AudioContext leaks: playBuffer() now closes its ctx after playback; metronome registers a one-shot
   close on screen leave. Prevents accumulation of dangling AudioContexts.
3. serve.mjs path bug: ROOT had a trailing separator causing 403 on every route. Rewritten with
   fileURLToPath + resolve + trailing-sep strip. Verified serving 200 on all routes (NOTE: a stale node
   on :8080 masked this during testing — always kill node before re-testing the server).
4. SW cache-first -> network-first (ROOT CAUSE of "phone app stops opening after a code change"):
   old service-worker.js served JS/CSS cache-first with a hardcoded list + manual CACHE version bump.
   After any PC code change the phone kept the stale bundle and blank-screened until the version was
   bumped by hand. Fixed to NETWORK-FIRST with offline fallback + a visible fatal-error screen in
   app.js. Added `verify-sw-cache.mjs` (Node) + a playwright hostile SW-cache regression test.

## GATING RULE (do not skip)
After ANY edit to `service-worker.js`, `app.js`, or `styles.css`: run `node verify-sw-cache.mjs` AND
`python3 test/playwright-hostile.py` (GREEN required). The SW gate FAILS if the SW ever reverts to
cache-first, so a future "app won't open after a change" regression is caught in CI, not on Heidi's phone.

## WHAT IS STILL NOT DONE / OPEN (honest)
- HOSTILE RE-REVIEW PENDING: a fresh subagent (deleg_58c5c1d6) was dispatched to attack 07-app/app.js,
  lib/, audio/ for integration defects. Its structured report had NOT returned at handoff time. Treat
  "app done" as NOT claimed until that returns clean. The prior 16 subsystem gates + fidelity(48) +
  app-smoke(18) are green, but the app-integration layer specifically has not yet been hostile-reviewed.
- REVENUECAT: owner-blocked on live keys. purchase() uses sandbox stub until RC_IOS/ANDROID keys exist
  (drop-in via attachRevenueCatAdapter). The $4,500/mo target (450 subs) needs the real App/Play listing
  + keys + a store listing + distribution (YouTube funnel F13 is spec'd, not built as a channel yet).
- LIVE MIC CALIBRATION: in-lesson listening logic is proven on synthetic tones (step5 30/30) but a real
  strummed-chord acoustic capture sign-off is still an open item (in-room, on a real guitar).
- TEACHER ART: roster logic + names (Maggie/Ellis/Ray/Roscoe) + personas are done; visual character art
  (cartoon rigs) is NOT generated yet. Fretboard is code-driven (Ban 1 satisfied by arithmetic).
- FLUTTER/RN SPIKE: resolved to PWA by environment constraint — documented as the spike decision, not a
  native build. Native rewrite is a later port, not a blocker (engines are SDK-agnostic).
- STYLE PACKS content present (blues+country) but the PACKS screen + teacher T4 wiring is gated/partial;
  verify pack lesson -> lesson-player path in the hostile pass.


