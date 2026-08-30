# BOARD_OPS_TRIAGE — 2026-08-21 (morning operational triage)

PROPOSE-ONLY. Signals surfaced + routed; nothing executed/fixed live.
Run window: gates executed 2026-08-21 ~09:1x; cron logs scanned through 2026-08-21 09:12.

## Signal table

| # | Signal | Source | Class | Likely owner | Ask |
|---|--------|--------|-------|--------------|-----|
| 1 | chord-check gate: 0 errors / 0 warnings (25 lessons, 81 chords) | `06-prototypes/step0/run-chord-check.js` | NOISE (green) | — | none |
| 2 | fidelity gate: 48 passed / 0 failed | `07-app/test/fidelity.mjs` | NOISE (green) | — | none |
| 3 | curriculum-order gate: 0 errors (25 lessons) | `tools/verify-curriculum-order.js` | NOISE (green) | — | none |
| 4 | song-progressions gate: 0 errors / 0 warnings (10 progressions, 11 shapes) | `tools/verify-song-progressions.js` | NOISE (green) | — | none |
| 5 | Reply-parser health log: all 9 entries clean (rp_exit=0, ra_exit=0, err=0); latest 2026-08-21 09:00:23 | `teamops_health.log` | NOISE (healthy) | — | none |
| 6 | Reply-parser 2-day stall: no run Aug-18 14:00 → Aug-20 18:08, then self-recovered (ran Aug-20 18:08, healthy since) | `teamops_health.log` / cron output c4751ca05a2b | WATCH (transient, self-recovered) | watchdog | Not a live break. Consistent with the host being offline/sleeping that window (see #7). No route; recorded for context. |
| 7 | Network/DNS outage @ 2026-08-20 18:08 — 4 GuitarApp crons FAILED with `RuntimeError: [Errno 11001] getaddrinfo failed` (ops-triage, growth, guitar-expert, board-content) | `cron/output/*/2026-08-20_18-08-16.md` | NOISE (environmental) | infra | Host DNS blip; self-recovered. No code defect. No route. |
| 8 | Guitar Expert cron FAILED @ 2026-08-21 09:12 with `getaddrinfo failed` | `cron/output/f1c353190f39/2026-08-21_09-12-20.md` | NOISE (environmental) | infra | Transient DNS at run time. No route. |
| 9 | **Reply-parser watchdog cron is DEAD**: `exit 127` — `/bin/bash` gets `C:\Users\...\teamops_reply_parser_watchdog.sh` (Windows backslashes) → "No such file or directory". Script DOES exist. getaddrinfo also present. | `cron/output/5b6a76777570/2026-08-20_18-08-21.md` | **ACTIONABLE** | watchdog / infra (ops) | Fix cron exec-path to bash-resolvable form (MSYS forward-slash `/c/Users/.../teamops_reply_parser_watchdog.sh` or proper conversion) so the watchdog can run. Until fixed the reply-parser is UNMONITORED — and indeed the #6 stall went uncaught. |
| 10 | **Board-content inventory JSON not persisted**: report produced but verifier refused write — "candidate content fails .json syntax validation" for `automation/BOARD_CONTENT_INVENTORY_2026-08-21.json`. (08-20 run also FAILED, via getaddrinfo.) | `cron/output/54ca06545f1d/2026-08-21_09-06-52.md` | **ACTIONABLE** | ops (board-content job) | Fix the inventory JSON generator / agent JSON emission so the `.json` sidecar writes; re-run to land the file. Verifier correctly blocked corrupt JSON — artifact simply missing. |

## Tally
- **10 signals** total.
- **2 actionable** (routed → `BOARD_OPS_ROUTING_2026-08-21.md`): #9 watchdog dead, #10 board-content JSON refused.
- **1 watch** (self-recovered, not routed): #6 parser 2-day stall.
- **7 noise** (green gates ×4, clean health log, network batch ×1, guitar-expert DNS ×1): no action.

## Honesty notes
- The 18:08 batch (#7) and #8 are environmental `getaddrinfo` blips (host DNS), not app/cron code defects → treated as NOISE per the transient-exclusion guard.
- #6 self-recovered and the parser is healthy now → WATCH only, not routed, to avoid inventing a task for a resolved stall.
- The one genuine, persistent, verified defect is **#9** (the watchdog's own script path is unresolvable by bash). Its impact is amplified: it left the reply-parser unmonitored, so #6 slipped through.
