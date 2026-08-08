# HANDOFF — GuitarApp (2026-08-08, after RevenueCat credential boundary)

## GOAL
Build the cross-platform (iOS + Android) acoustic-guitar-teaching app to the LOCKED spec.
Revenue target: $4,500/mo = 450 subs @ $12/mo.

## SOURCE OF TRUTH — read these, ignore the rest
- `AGENTS.md` (hard rules, auto-loaded)
- `02-spec/FEATURES-LOCKED-v1-2026-08-07.md`
- `02-spec/PLAN-from-locked-spec-2026-08-07.md`
- **STALE, never use:** `02-spec/guitar-build-plan.md`, `02-spec/PLAN-app-plus-youtube-4500-2026-08-07.md`

## STATE — all gates re-run and green on 2026-08-08

| Step | Gate command (from `06-prototypes/`) | Result |
|---|---|---|
| 5 listening (F2) | `cd step5 && node verify-step5.js` | 30/30 `STEP-5-LISTENING-OK` |
| 7 paywall (F12) | `cd step7 && node verify-step7.js` | 36/36 `STEP-7-F12-OK` |
| 8 style packs | `cd step8 && node verify-step8.js` | 94/94 PASS |
| 9 YouTube (F13) | `cd step9 && node verify-step9.js` | 33/33 PASS |
| 10 RC boundary | `cd step7 && node verify-step10-revenuecat.js` | 43/43 `STEP-10-RC-BOUNDARY-OK` |
| chord arithmetic | `cd step0 && node run-chord-check.js` | 11 chords, 0 errors, 0 warnings |

2 style packs shipped (Blues + Country), both **pure content, zero core-code change**.
6 YouTube videos rendered in `step9/out/` (3 Blues + 3 Country).

## DONE THIS SESSION
1. **Re-verified** every prior claim by re-running the gates, not trusting the handoff.
2. **RevenueCat credential boundary (Step 10)** — new files in `06-prototypes/step7/`:
   - `revenuecatConfig.js` — reads keys from `process.env`, validates shape, picks live vs stub. No secrets in repo.
   - `revenuecatAdapter.js` — the ONLY file that touches the network. Maps RevenueCat CustomerInfo → EntitlementStore.
   - `verify-step10-revenuecat.js` — 43-check DONE BAR; live path proven with an **injected fake fetch** (no network, no real key).
   - `REVENUECAT-WIRING.md` — the 3 owner steps + exact env-var commands.
   - `entitlementStore.js` **NOT modified** — Hard Ban 5 (zero network in core) re-asserted by the gate.
3. **Cleanup** — deleted 3 stale duplicate videos (`out/youtube-guitar-lesson-b*.html`) left from an old naming pass.

## HONEST GAPS
- **Live RevenueCat is owner-blocked.** Real `appl_…` / `goog_…` public SDK keys cannot be
  fabricated — a fake key fails on first call and would make the gate lie. With no keys the
  app runs in proven `stub` mode; it never pretends a purchase succeeded.
  Unblock: RevenueCat dashboard → iOS+Android apps → copy **public** keys (not `sk_`);
  App Store Connect + Play Console → $12/mo sub + sandbox tester; entitlement named `premium`.
  Then `export RC_IOS_PUBLIC_KEY=… RC_ANDROID_PUBLIC_KEY=… && node verify-step10-revenuecat.js`.
  Adapter flips to live with **no code change**.
- Step 5 open item: live mic calibration on a real strummed chord (logic proven, in-room sign-off pending).
- Chord checker covers L01–L03 (11 chords); pack chords are covered by the *separate* Step 8 gate.
  Two gates covering chords = a pack could slip if someone edits the pack gate. Worth unifying. Not blocking.
- No channel name/handle picked for YouTube yet.

## NEXT
1. **F7 band engine** — next core feature, unblocked, in progress.
2. **F10 voice controls** — core, after F7.
3. RevenueCat live wiring — the moment keys land (2 minutes).
4. Optional: unify the two chord gates.

## CONVENTIONS
- Addy Osmani order: spec → plan → build → test → review → simplify → ship. Never skip spec/plan.
- New decisions → new `02-spec/guitar-app-spec-AMENDMENT-NN.md`, then update `01-START-HERE/README.md` §7.
- Deliverables the owner opens must be double-clickable `file://` HTML, never localhost.
- Free tier is STRICT (owner override 2026-08-08): tuner + metronome + L01 ONLY.
  Lever = `FEATURE_TIER` in `06-prototypes/step7/entitlementStore.js`. The 'shell' tier was REMOVED — do not revert.
- Verification is arithmetic, not human. No "unverified" warning boxes in any UI.
