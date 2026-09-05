# Execution Status

**This is the file every session updates and every new session reads first.**
One line per task. No prose reports, no new markdown files — edit this one.

Legend: `TODO` · `IN PROGRESS` · `BLOCKED (reason)` · `DONE`

---

## Tier 0 — Ship it — **NOT STARTED**

| Task | Status | Notes |
|------|--------|-------|
| T0.1 Archive doc sprawl | TODO | |
| T0.2 Audio transcode | TODO | needs `ffmpeg` on PATH |
| T0.3 Deploy target | TODO | owner must do the one-time host setup |
| T0.4 Learner profile | TODO | |
| T0.5 Wire lesson audio | TODO | fixes the known Playwright failure |
| T0.6 Event logging | TODO | |
| T0.7 Shell integration | TODO | single agent, contended files |

**Exit check:** not met. Five real users have opened it: **0 / 5**

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
