# HANDOFF — Parallel Build Wave DONE + 2 real bugs found & fixed

Date: 2026-08-08 (night) · Owner: Heidi Hendrickson
Active repo: `C:\Users\The Yoda Trader\Desktop\GuitarApp` (git, master)
App root: `07-app/`  (UNTRACKED — `git status` shows `?? 07-app/`. Safe to edit; nothing committed.)

## GOAL (this wave)
Build the app fully playable + shareable with 5 friends for FREE feedback, $0, no account,
no signup. Owner directive: "build the WHOLE thing free... dogfood with ~5 friends first."
RevenueCat / store / TTS key / DB = OUT OF SCOPE.

## WHAT SHIPPED (verified on disk)

### B1 — Dogfood-free local unlock  ✅
- NEW `lib/dogfood.js` (localStorage key `guitarapp.dogfood`; isDogfood/setDogfood/toggleDogfood).
- `app.js`: import dogfood helpers; `isPremium()` → `app.dogfood || app.entitlement.isPremium()`;
  `canLesson(id)` → `app.dogfood || app.entitlement.canAccessLesson(id)`; boot reads `?dogfood=1`
  and sets `app.dogfood`; renderHome shows DOGFOOD badge + feedback link.
- `service-worker.js`: `./lib/dogfood.js` added to CORE cache list.
- `core/entitlementStore.js`, `FEATURE_TIER`, `FREE_LESSONS` UNTOUCHED (production paywall intact).

### B2 — Phone install over LAN  ✅
- `serve.mjs` now prints LAN IPv4 URLs: `Open on your phone: http://192.168.x.x:8080/?dogfood=1`.
- NEW `LAN-INSTALL.md` (friend-proof steps) + `start-lan.bat` (one line: `node "%~dp0serve.mjs"`).

### B3 — Feedback capture  ✅
- NEW `lib/feedback.js` (window.GuitarFeedback: addFeedback/allFeedback, localStorage only).
- NEW `feedback.html` (standalone, mobile-friendly form + "previously submitted" list + back link).
- NO server, NO account (Ban 5: zero network calls).

### B4 — Country pack teacher + art  ✅
- NEW `content/packs/country/T5.json` — "Dixie Hart" (T5), "The Front-Porch Picker",
  all T4 fields mirrored incl `art: "assets/teachers/T5.svg"`.
- NEW `assets/teachers/T5.svg` — HAND-AUTHORED flat SVG, head+shoulders only, ZERO hands/fingers
  (AGENTS.md rule 7; no FLUX/Qwen). grep hand|finger|palm|wrist = NONE.
- `content/packs/country/manifest.json` — appended `"T5.json"` (mirrors blues' T4 pattern) so
  boot injects Dixie into the roster. Roster is now 5: Maggie, Ellis, Ray, Roscoe, Dixie.

### B5 — Extra beginner lessons  ✅
- NEW `content/lessons/guitar-lesson-21-holding-the-pick.json` (L21)
- NEW `content/lessons/guitar-lesson-22-switching-em-and-c.json` (L22)
- NEW `content/lessons/guitar-lesson-23-first-three-chord-song.json` (L23)
- `content/lessons/manifest.json` — 3 filenames appended.
- validateLesson → {"valid":true,"errors":[]} for all 3; chord-theory-check 0 errors/0 warnings;
  frets/fingers arrays length 6; qa_status whitelisted.

## TWO REAL BUGS FOUND & FIXED DURING VERIFY WAVE (this is the important part)

The subagents reported "all green," but I re-verified against LIVE code + browser state and found
two genuine defects that green self-checks hid:

### BUG 1 — `guardPremium` ignored the dogfood flag (silent paywall under dogfood)
- Symptom: `isPremium()` was patched to honor `app.dogfood`, but `renderRoster`/`renderChat`/
  `renderPlan`/`renderProgress`/`renderBand`/`renderPacks`/voice all call `guardPremium(feature, fn)`,
  which ONLY checked `app.entitlement.paywallDecision()` — it never consulted `app.dogfood`.
  So a dogfood user still hit the Pro paywall on every `guardPremium`-gated screen (roster, packs,
  etc.). Lesson 2 worked (uses `canLesson`/`isPremium`, not `guardPremium`), which is why the
  subagent's narrower check passed.
- Fix (`app.js` line 39): `guardPremium` now short-circuits to `fn()` when `app.dogfood` is true:
  `if (app.dogfood) { fn(); return; }` — before the entitlement check. One-line fix unlocks ALL
  gated screens at once, no change to `entitlementStore.js`.
- Proof: browser console on `?dogfood=1` → `app.dogfood=true, isPremium=false, rosterCount=5`
  (Maggie/Ellis/Ray/Roscoe/Dixie); roster screenshot shows 5 cards, NO paywall.

### BUG 2 — Stale service-worker cache would block LAN updates
- Symptom: SW pinned cache `guitarapp-v1`. Once a friend installs the PWA, edits (incl. the B1
  unlock) would NEVER reach their phone until the cache version bumped. Also caused my live-browser
  verification to show a stale paywall (old cached app.js) until cleared.
- Fix: bumped `CACHE` constant in `service-worker.js` to `guitarapp-v3` (v1→v2→v3 across the wave;
  the activate handler deletes old caches, so installed clients pull fresh code on next load).
- Rule going forward: ANY edit to `app.js`/`index.html`/`styles.css`/`lib/*` MUST bump the SW
  `CACHE` version string, or installed phones won't update.

### TEST GAP that hid BUG 1 (also closed)
- The original playwright dogfood assertions only checked the DOGFOOD badge + Lesson 2 open.
  Neither actually CLICKED a `guardPremium`-gated screen. Added assertion (playwright-hostile.py):
  "dogfood: Teachers roster renders 5 cards (no paywall) (B1)" — which FAILED on the buggy code
  and PASSES after the fix. This is now a regression guard.

## GATE STATUS (end of wave)
- `node test/fidelity.mjs` → **FIDELITY GATE: 48 passed, 0 failed** ✅
- `python test/playwright-hostile.py` → **GREEN (rc=0)** after the guardPremium fix (BUG 1) +
  a corrected roster assertion. Final clean run (port 8080 free) shows all assertions PASS incl.
  the new "dogfood: Teachers roster renders 5 cards (no paywall) (B1)". 0 console / 0 page errors.
- Note: the roster assertion initially had a FALSE POSITIVE — it flagged the descriptive sub-label
  "(Pro feature.)" as a paywall. Corrected to detect the real paywall marker ("Start free trial" +
  "free tier includes"). The app was correct; the test was wrong. Both now agree.
- Screenshots: `test/shots/dogfood-home.png`, `dogfood-lesson2.png`, `dogfood-roster.png` (roster
  shows 5 teacher cards, no paywall).

## OPERATIONAL NOTE (caught during verify)
- A leftover `serve.mjs` background process was holding port 8080, silently serving a STALE SW
  cache and interfering with the test's own server (EADDRINUSE → test talked to the stale server).
  Killed PID 9848. LESSON: before running `playwright-hostile.py`, ensure nothing else is bound to
  8080 (`curl -sI http://localhost:8080/` should 404/CONNREFUSED, not 200, unless you intend it).
  The test starts its own server; do NOT leave a manual `serve.mjs` running.

## HOW TO DOGFOOD NOW (owner)
1. On your machine: `cd 07-app && node serve.mjs` (or double-click `start-lan.bat`).
2. Note the printed `Open on your phone: http://<LAN-IP>:8080/?dogfood=1`.
3. Your phone + 5 friends: same Wi-Fi → open that URL → browser menu → "Add to Home Screen".
4. Inside the app: tap "feedback" (top of home) to send notes; they land in localStorage
   (you can read them via devtools console: `window.GuitarFeedback.allFeedback()`).

## PARKING LOT
- **F4 — Live mic strum**: CROSSED OFF by owner ("no live strumming"). Not built.
- **F5 / F6**: now covered by B2 (LAN install) + B3 (feedback). Done at code level; needs owner to
  actually serve + distribute.
- OUT OF SCOPE unchanged: RevenueCat, store listings, OpenAI TTS key, YouTube mass posting, DB.

## NEXT SESSION POINTERS
- Re-run BOTH gates after any `07-app/` change: `node test/fidelity.mjs` then
  `python test/playwright-hostile.py` (from inside `07-app/`). Keep GREEN.
- After editing any cached asset, bump `CACHE` in `service-worker.js`.
- `07-app/` is untracked — when owner is ready to commit, `git add 07-app`.
