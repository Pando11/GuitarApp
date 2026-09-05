# Execution Status

**This is the file every session updates and every new session reads first.**
One line per task. No prose reports, no new markdown files — edit this one.

Legend: `TODO` · `IN PROGRESS` · `BLOCKED (reason)` · `DONE`

---

## Tier 0 — Ship it — **BUILD COMPLETE, AWAITING OWNER STEPS**

| Task | Status | Notes |
|------|--------|-------|
| T0.1 Archive doc sprawl | DONE | `app-refactored.js` kept as-is — differs substantially from `app.js`, not a safe delete; needs an owner call on whether to remove it |
| T0.2 Audio transcode | DONE | 201 WAVs → `.m4a`, masters moved to gitignored `_masters/` |
| T0.3 Deploy target | DONE | both Netlify + GH Pages configs written; owner still must do the one-time host setup |
| T0.4 Learner profile | DONE | wired into the shell by T0.7 |
| T0.5 Wire lesson audio | DONE | fixed the known Playwright failure; 19/19 passing |
| T0.6 Event logging | DONE | `events` PocketBase collection added, separate from encrypted `student_memory` |
| T0.7 Shell integration | DONE | onboarding banner, telemetry hooks, feedback button all wired |

`npm run test:all` is fully green: 28/28 smoke + 19/19 Playwright.

**Known gap:** `drill_result` telemetry event is defined but never fired — no
drill/practice screen is reachable from the current shell. Not blocking the
five-friend test (no lessons currently render a drill), but worth tracking.

**Exit check:** code is done; the remaining items are things only the owner
can do:
- [ ] Pick Netlify or GitHub Pages (see `docs/plans/STATUS.md` open decision
  #5) and do the one-time host setup — instructions are in T0.3's report,
  captured in commit `414742a`.
- [ ] Once deployed, confirm on a real phone: a lesson plays audio on
  cellular in under 5 seconds.
- [ ] **Get five people who are not you to open it.**
- [ ] Confirm the feedback button produces a readable row (requires a live
  PocketBase instance reachable from the deployed URL — currently only
  `pocketbase-dev` local dev config exists; the owner needs to stand up
  PocketBase somewhere the deployed app can reach, and point
  `telemetry.js`'s `baseUrl` at it).

Five real users have opened it: **0 / 5**

## Tier 1 — Make the AI real — **BLOCKED (Tier 0)**

| Task | Status | Notes |
|------|--------|-------|
| T1.1 Coaching service | TODO | |
| T1.2 Adaptive planning | TODO | |
| T1.3 Copy variants L01–L05 | TODO | |
| T1.4 Client integration | TODO | |
| T1.5 Reason to renew | TODO | **decision not yet made** — see T1.5 options |

## Tier 2 — Business — **BLOCKED (Tier 1)**

| Task | Status | Notes |
|------|--------|-------|
| T2.1 Accounts | TODO | |
| T2.2 Server entitlements | TODO | |
| T2.3 Payments | TODO | owner must set up Stripe personally |
| T2.4 Pricing / paywall | TODO | **decision not yet made** — free tier scope |
| T2.5 Landing + acquisition | TODO | **decision not yet made** — which channel |
| T2.6 Retention dashboard | TODO | |

---

## Open owner decisions (agents must not decide these alone)

1. **Free tier scope.** Current code: tuner + metronome + L1 only. Recommendation
   in the redline: free through the Lesson 5 performance. — *undecided*
2. **T1.5 renewal feature:** (a) weekly practice plan [recommended] /
   (b) weekly new song / (c) scored challenges. — *undecided*
3. **Acquisition channel.** YouTube is the standing suggestion. — *undecided*
4. **Under-13 policy:** support with parental consent, or exclude from paid. — *undecided*
5. **Static host** for Tier 0: Netlify vs GitHub Pages. — *undecided*

## Measured numbers (fill these in as they become real)

- Cost per active student per month: _not measured_
- Free→paid conversion: _not measured_
- D7 retention: _not measured_
- Monthly churn: _not measured_
- Worst lesson for drop-off: _not measured_
