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
- [ ] Deploy via GitHub Pages (decision made — see open decision #5). Repo
  Settings → Pages → set "Source" to "GitHub Actions"; the existing
  `.github/workflows/deploy-pages.yml` does the rest on the next push to
  `main` that touches `07-app/**`. **Deliberately deferred** — running
  locally for now, deploy when ready.
- [ ] Once deployed, confirm on a real phone: a lesson plays audio on
  cellular in under 5 seconds.
- [ ] **Get five people who are not you to open it.**
- [ ] Confirm the feedback button produces a readable row (requires a live
  PocketBase instance reachable from the deployed URL — currently only
  `pocketbase-dev` local dev config exists; the owner needs to stand up
  PocketBase somewhere the deployed app can reach, and point
  `telemetry.js`'s `baseUrl` at it).

Five real users have opened it: **0 / 5**

## Handoff to Tier 1 (written 2026-09-05, after Tier 0 build)

Tier 0's code is done and green, but its own Exit Check hasn't been met yet
(0/5 friends, no deploy) — per `TIER-1-make-ai-real.md`'s own header, **do
not start Tier 1 until Tier 0 is marked SHIPPED above**, not just
build-complete. This section is here so whoever starts Tier 1 doesn't have
to re-derive state from commit history.

Facts learned while building Tier 0 that Tier 1's tasks should account for:

- **Lesson model field is `model.lessonId`, not `model.id`.** T0.7 caught
  this the hard way in `lesson-runner.js`'s `openLesson()`. T1.2/T1.4 will
  touch `adaptivePlan.js`/`lesson-runner.js` again — check this before
  assuming a field name.
- **`lesson-runner.js` has no real "current step" concept** — it renders a
  lesson as one flat document. T0.7 approximated `stepIndex` from scroll
  position for telemetry. T1.2's adaptive planning and T1.3's copy-variant
  selection will need an actual step/unit boundary if they're going to
  target specific steps; consider whether that's worth formalizing before
  building on the scroll-position hack.
- **`drill_result` telemetry is defined but nothing fires it** — there is no
  drill/practice screen reachable from the current shell. T1.2's adaptive
  planning explicitly reasons about drill results (`justHappened:
  {drillId, passed, score, ratePerMin}`); that data path does not exist yet
  end-to-end. This is probably the single biggest gap between "Tier 0
  shipped" and "Tier 1 can build on real data" — investigate before writing
  T1.1's facts-envelope integration.
- **PocketBase is local-only.** `pocketbase-dev/` runs on `127.0.0.1:8090`;
  nothing is deployed. Tier 1's coaching service (`server/**`) will need its
  own decision about where it runs and how it reaches student data — this
  wasn't scoped in Tier 0 and isn't automatically solved by the GitHub Pages
  static deploy (Pages serves static files only, no server-side code).
- **`app-refactored.js`** (07-app/) is still sitting there, ~1500 lines
  diverged from `app.js`, unresolved from before Tier 0. Nobody has decided
  whether to delete it. Low risk, but it's dead weight in every future
  agent's search results.
- **Host decision:** GitHub Pages (see open decision #5). Deploy itself is
  deliberately deferred — the app is being run locally for now. Whoever
  picks this back up should deploy before running the five-friend test, not
  before Tier 1 — Tier 1 doesn't require a public URL, only Tier 0's exit
  check does.

## Tier 1 — Make the AI real — **IN PROGRESS** (started before Tier 0's exit
check was fully met — owner's explicit call, since 5 friends aren't
available yet; Tier 0's code is done, see above)

| Task | Status | Notes |
|------|--------|-------|
| T1.1 Coaching service | DONE | `server/`, no live-key smoke test yet (no `ANTHROPIC_API_KEY` set anywhere) |
| T1.2 Adaptive planning | DONE | fixed a confidence-scale bug (0-1 vs 0-100) caught during integration with T1.1 |
| T1.3 Copy variants L01–L05 | DONE | |
| T1.4 Client integration | DONE | coach-client/adaptive-plan seams built; only the learner-profile→lesson-copy path is actually wired into the shell (see gaps below) |
| T1.5 Reason to renew | TODO | **decision not yet made** — see T1.5 options |

**Not yet done, blocking a full end-to-end Tier 1 demo:**
- The coaching service has never made a real model call — no
  `ANTHROPIC_API_KEY` exists in this environment. Someone needs to supply one
  (in `server/.env`, gitignored) before `coach_served` telemetry or the
  prompt-cache-hit check can be verified for real, not just against a mocked
  SDK client.
- `chatEngine.js`'s `askCoach`/`replyWithCoach` (the actual AI coaching path)
  are built and tested but **not called from anywhere in the shell** —
  there's no chat/coach UI surface in `index.html`/`app.js` at all. Until one
  exists, the coaching service can be fully correct and still never produce
  a single real coaching moment for a student.
- `lessonRunner.planNext()` (adaptive next-lesson selection) is built but
  also **not called from anywhere** — there's no "continue"/next-lesson
  navigation logic in the shell to attach it to; lessons are opened by
  explicit index from catalog clicks only, unchanged from Tier 0.
- Only the copy-variant selection (kid/adult-beginner/returning phrasing on
  lessons 01-05) is genuinely reachable by a real user right now.

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
5. **Static host** for Tier 0: **decided — GitHub Pages.** Deploy itself is
   deferred; app runs locally for now.

## Measured numbers (fill these in as they become real)

- Cost per active student per month: _not measured_
- Free→paid conversion: _not measured_
- D7 retention: _not measured_
- Monthly churn: _not measured_
- Worst lesson for drop-off: _not measured_
