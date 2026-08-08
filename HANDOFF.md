# HANDOFF — GuitarApp (2026-08-08, evening)

## GOAL
Cross-platform (iOS + Android) acoustic-guitar-teaching app to the LOCKED spec.
Revenue target: $4,500/mo = 450 subs @ $12/mo.

## SOURCE OF TRUTH — read these, ignore the rest
- `AGENTS.md` (hard rules, auto-loaded)
- `02-spec/FEATURES-LOCKED-v1-2026-08-07.md`
- `02-spec/PLAN-from-locked-spec-2026-08-07.md`
- **STALE, never use:** `02-spec/guitar-build-plan.md`, `02-spec/PLAN-app-plus-youtube-4500-2026-08-07.md`

## STATE — all gates re-run and green this session
| Step | Gate | Result |
|---|---|---|
| 0 chord arithmetic | `cd step0 && node run-chord-check.js` | 11 chords, 0 errors, 0 warnings |
| 5 listening (F2) | `cd step5 && node verify-step5.js` | 30/30 |
| 7 paywall (F12) | `cd step7 && node verify-step7.js` | 36/36 |
| 8 style packs | `cd step8 && node verify-step8.js` | 94/94 |
| 9 YouTube (F13) | `cd step9 && node verify-step9.js` | 33/33 |
| 6 store keystone | `cd step6 && node verify-step6-store.js` | 22/22 |
| 7-extra band (F7) | `cd step7-extra && node verify-band.js` | 18/18 |
| 7-extra voice (F10) | `verify-voice.js` | **NOT WRITTEN YET — F10 unverified** |

Project is a git repo (initialized this session: `fdc9e3b`). All vendored third-party
clones excluded via `.gitignore` (1.2 GB `03-research/reference-repos/` not in history).
No secrets committed.

## WHAT WAS BUILT THIS SESSION

### F7 — The band that follows you (CORE feature — DONE, double hostile-reviewed)
Files in `06-prototypes/step7-extra/`:
- `band-engine.js` — deterministic tempo-following loop. Synthesizes original drums
  (kick/snare/hat) + root–fifth bass + chord stabs from the lesson's own chord frets,
  reusing `step2/engine/tuner-engine.js` (makeStringTone) and `step5/engine/listening-engine.js`
  (detectPitchSet/notesMatch). Follows the student's LAST practice BPM via
  `practiceStore.lastPracticeTempo()` or the lesson default. Never a fixed click.
- `verify-band.js` — 18/18 DONE BAR (determinism, tempo-following incl. adversarial
  clamps 5→30 / 999→240, measured stem pitch via the SAME listener math, Ban 4/5/1,
  core modules byte-identical to `step8/CORE-UNTOUCHED.sha256`).
- `band-player.html` + `band-source.js` + `gen-band-source.js` — double-clickable
  `file://` demo so the owner can HEAR the band at her practice tempo.
- `practiceStore.js` gained two ADDITIVE methods: `recordPracticeTempo` /
  `lastPracticeTempo` (validated, clamped 30..240). Step 6 store gate: 22/22, unchanged.

**Hostile review history (your standing "verify with a fresh hostile agent" rule):**
1. First hostile agent found 1 BLOCKER (band-player.html loaded `band-source.js` AFTER
   the shim that needed it → demo dead on arrival) + 2 real issues. All fixed; gate 18/18.
2. Second hostile agent (different) found a REAL BLOCKER I had WRONGLY dismissed: the bass
   FIFTH was emitted at octave shift −1 (B1), an octave below the root register, so
   root/fifth were inconsistent and the gate's "fifth ok" was a false green. The first
   reviewer had flagged this; I initially overruled it incorrectly. **Fixed:**
   `band-engine.js:152` now uses shift 0 (B2, same register as root E2). Independent
   re-check confirms fifth heard = [B2]. Gate still 18/18.
   HONEST NOTE: my earlier "did not reproduce" claim about the fifth was WRONG — the
   engine source carried the −1 the whole time; the reviewer was right. Logged above.

### F10 — Voice-first practice controls (CORE feature — IN PROGRESS, NOT DONE)
File: `06-prototypes/step7-extra/voice-command.js`
- Browser-free, DOM-free text→intent engine. Intents: `slower` / `again` / `whats-next`
  / `tune-my-guitar`, plus out-of-scope rejection (guardrailed — "order pizza" / "weather"
  → ignore, never executed). `tune-my-guitar` delegates to the REUSED step2 tuner engine.
- Deterministic (same text → same intent); testable without a mic.
- Two bugs found and fixed THIS session: (1) apostrophe escape in adapter string
  (`I\\'ll` → `I'll`); (2) bare `what` token mis-mapped "what is the weather" to
  `whats-next` → now ignored; bare `next` re-added so "next!" maps correctly.
  14/14 mapping cases verified.
- **NOT YET:** no `verify-voice.js` DONE BAR, no `file://` player wiring, no hostile
  review. Per the standing rule, F10 is NOT "done" until a fresh hostile agent passes it.
  The real STT capture + mic button is a device boundary (Web Speech API / stub) — the
  engine only takes recognized text, so it's testable today without mic/STT.

## HONEST GAPS (carry forward)
- **F10 is unverified.** Needs `verify-voice.js` (DONE BAR) + a fresh hostile re-review
  before it can be marked done. The mapping logic is built and 14/14 self-tested, but it
  has not been put through the hostile-agent gate the other steps passed.
- F7 `band-player.html` is not browser-tested here (no browser in this env) — the
  inlined engine path was verified by eval-ing `band-source.js`+`band-engine.js` in Node
  with the same shim; script order was fixed and structurally confirmed. A real click-test
  on a phone remains the in-room sign-off.
- RevenueCat live wiring still owner-blocked (no `appl_…`/`goog_…` public keys). Adapter
  flips to live with no code change once keys land (Step 10 gate 43/43 proven in stub mode).
- Step 5 live mic calibration on a real strummed chord — logic proven, in-room sign-off pending.
- No YouTube channel name/handle yet.
- Two chord gates (step0 / step8) overlap — worth unifying; not blocking.

## NEXT
1. **F10 voice controls** — write `verify-voice.js` (DONE BAR), wire a `file://` demo
   (tap-to-talk button → recognized text → engine → player intents), then hand to a
   FRESH hostile agent for re-review. Only then mark F10 done.
2. RevenueCat live wiring — the moment keys land (2 minutes).
3. Optional: unify the two chord gates.
4. Flutter-vs-RN spike note, teacher art, SMS cadence caps — open items, not blocking.

## CONVENTIONS (unchanged, still enforced)
- Addy Osmani order: spec → plan → build → test → review → simplify → ship. Never skip.
- New decisions → `02-spec/guitar-app-spec-AMENDMENT-NN.md`, then update `01-START-HERE/README.md` §7.
- Deliverables the owner opens = double-clickable `file://` HTML, never localhost.
- Free tier STRICT (owner override 2026-08-08): tuner + metronome + L01 ONLY. Lever =
  `FEATURE_TIER` in `06-prototypes/step7/entitlementStore.js`. The 'shell' tier was
  REMOVED — do not revert (verified 36/36).
- Verification is arithmetic, not human. No "unverified" warning boxes in any UI.
- Hostile re-review is mandatory per build before "done" — already done for F7 (2 passes);
  F10 still needs its pass.

## GIT
- `git init` done; working tree clean; 4 commits this session
  (fdc9e3b init · f7625dd F7 build · caad686 F7 hostile fixes · 783b7f2 F7 2nd hostile fix + F10 in-progress).
- Recovery: any overwrite of `HANDOFF.md` or source is now recoverable via git.
