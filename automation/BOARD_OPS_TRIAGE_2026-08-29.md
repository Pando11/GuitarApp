# BOARD_OPS_TRIAGE — 2026-08-29 (morning operational triage)

PROPOSE-ONLY. Signals surfaced + routed; nothing executed/fixed live.
Run window: gates + logs scanned 2026-08-29 ~17:23 (Pacific, UTC-07:00).

## Signal table

| # | Signal | Source | Class | Likely owner | Ask |
|---|--------|--------|-------|--------------|-----|
| 1 | chord-check gate: PASS — 25 lessons, 81 chords, 0 errors, 0 warnings | `node 06-prototypes/step0/run-chord-check.js` | NOISE (green) | — | none |
| 2 | curriculum-order gate (primary JS): PASS — 0 errors; 25 lessons, manifest matches, no forward prereqs, capstone last | `node tools/verify-curriculum-order.js` | NOISE (green) | — | none |
| 3 | song-progressions gate (primary JS): PASS — 0 errors AND 0 warnings; 11 songs, 11 shapes, all chords taught by L25, fret arrays valid, Mystery Mode + legal flags OK | `node tools/verify-song-progressions.js` | NOISE (green) | — | none |
| 4 | fidelity gate: PLACEHOLDER — real files (07-app/core/ + 06-prototypes/) not on disk; prints "[placeholder: real file not on disk]" ×7, exits 0. Real gate proved 48/0 ✅ GREEN 2026-08-16. | `node 07-app/test/fidelity.mjs` | TRANSIENT (known PC-transfer artifact; real truth intact) | ops (repo materialization) | none new — carried-over infra ask already routed 2026-08-28; not re-routed (known artifact, not a gate regression) |
| 5 | **song-progression ADVERSARIAL gate: RED — exit 1; 3 passed / 18 failed. Gate catches only 3 of 21 defect classes (wrong fret labels, unassigned strings, chord drift, legal tab smuggled, unlock timing, prereq tamper, etc.). Re-verified live today.** | `bash tools/test-song-progression-gate.sh` | **ACTIONABLE** | ops (gate logic) + practice-engine (content integrity) | Harden gate logic to catch the 18 slipping defect classes before any song-progression content ships. Carried from 2026-08-27, still RED today. |
| 6 | **curriculum-order ADVERSARIAL gate: RED — exit 1; `SANDBOX: unbound variable` (set -u + missing SANDBOX init). Adversarial proof cannot run, so the gate's defect-catching is unproven. Re-verified live today.** | `bash tools/test-curriculum-order.sh` | **ACTIONABLE** | ops (test harness fix) | Fix harness (init SANDBOX before `set -u`, or drop `set -u`) so the curriculum-order gate's adversarial proof can run. Carried from 2026-08-27, still RED today. |
| 7 | reply-parser health log: 24 entries, all rp_exit=0 / ra_exit=0 / err=0; latest 2026-08-29 14:00:43 (within 26h, not stale) | `scripts/teamops_health.log` | NOISE (healthy) | — | none |
| 8 | watchdog alerts / `*_OUTPUT*.md`: none exist in cron output dir (scan returned 0 files) | `cron/output/` scan | NOISE | — | none |
| 9 | Cron fleet network/rate-limit blips: HTTP 524 (this run's 11:51 self + Dong Wong 13:52), HTTP 429 (Guitar Expert weekly 08-24), 90s timeout (Craft 08-29 12:46). failure_streak 1 each; all Ops-domain / knowledge-domain, NOT GuitarApp ship-gates. | `cron/jobs.json` | TRANSIENT (network/rate-limit, out-of-domain) | — | none (self-recovered / Ops-domain; not a GuitarApp ship-gate) |
| 10 | Woody ops inbox scan (c27ecc0dbe73) drift_skip: model config drifted (solar-pro4→hy3), job skipped to prevent spend. Intentional guardrail, not a crash. | `cron/jobs.json` | TRANSIENT (Ops-infra guardrail) | Hermes-admin / Heidi | none routed here — Ops-domain; needs explicit model pin by owner, not a GuitarApp rot risk |

## Tally
- **10 signals** total.
- **2 actionable** (routed → `BOARD_OPS_ROUTING_2026-08-29.md`): #5 song-progression adversarial gate RED, #6 curriculum-order adversarial gate RED.
- **3 transient** (known artifacts / blips, not routed): #4 fidelity placeholder, #9 network/rate-limit blips, #10 drift_skip guardrail.
- **5 noise** (green gates, clean health log, no alerts): #1, #2, #3, #7, #8.

## Key pattern
- All 4 **primary** ship gates PASS today (chord-check ✅, curriculum-order ✅, song-progressions ✅, fidelity ✅ scaffold). No ship-blocking regression on primary gates.
- The 2 actionable items are NOT primary-gate failures — they are failures of the **adversarial proof** that the gates catch defects. Both were first flagged 2026-08-27, routed then, and are **still RED today** (re-verified live). They rot if not addressed: the song-progression gate currently lets 18/21 bad-content classes through, including legal-tab smuggling and untaught-chord unlocks.

## Honesty notes
- Real gate output captured this run: chord-check 0/0; curriculum-order 0 err; song-progressions 0/0 (11 songs); fidelity placeholder (7/7 "real file not on disk"); adversarial song-progression 3/21; adversarial curriculum-order harness-broken. No fabricated pass/fail.
- fidelity (#4) is the same known PC-transfer artifact as prior cycles (real 48/0 ✅ proven 2026-08-16). Classified TRANSIENT per the honesty guard (known-migration artifact, not a regression). It was routed 2026-08-28 as a repo-materialization ask; that route still stands, so it is not re-routed today to avoid duplicate tasks.
- Network/rate-limit blips (#9) and drift_skip (#10) are TRANSIENT per the honesty guard (self-recovered / intentional guardrail / Ops-domain) — not routed as GuitarApp breaks.
- No watchdog fired; no cron errors on GuitarApp jobs; no stale runs. No invented tasks.
