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
| T1.1 Coaching service | DONE | `server/`, real `ANTHROPIC_API_KEY` present in `server/.env` (gitignored, untracked, verified 2026-09-06) but no live-key smoke test run yet — still verified only against a mocked SDK client |
| T1.2 Adaptive planning | DONE | fixed a confidence-scale bug (0-1 vs 0-100) caught during integration with T1.1 |
| T1.3 Copy variants L01–L05 | DONE | |
| T1.4 Client integration | DONE | coach-client/adaptive-plan seams built; only the learner-profile→lesson-copy path is actually wired into the shell (see gaps below) |
| T1.5 Reason to renew | DONE | weekly practice plan card, degrades to honest "no-data" state today (no drill screen exists to feed it real data yet) |
| T1.6 Practice drill screen | DONE (2026-09-06) | ported the 06-prototypes/practice-engine prototype into 07-app/core/ and wired a real Practice screen — see below |

**T1.6 — Practice drill screen (built 2026-09-06):** closes the "no drill
screen" gap named in both the Tier 0→1 and Tier 1→2 handoffs below. Ported
from `06-prototypes/practice-engine/`: `fluencyStore.js`, `oneMinuteChanges.js`,
`pairKey.js`, `listenerReal.js` (+ `listenerTwin.js` browser mirror),
`listenerSim.js`, `practiceLoop.js`, `reviewScheduler.js`, and all 8
implemented drills under `07-app/core/drills/` (anchor, count-out-loud,
metronome-ladder, muted-strum, spider, tempo-loop, wait-to-play,
weak-pair-review — `Chord-Perfect`/`Air Changes` still have no prototype, the
runner omits them from the menu rather than crashing). New
`practiceFluencyBridge.js` composes the fluency store for `practiceStore.js`,
which now has `recordDrillResult(...)`/`getWeakPairs(k)`. New
`coachSurface.js` wraps `chatEngine.js`'s `askCoach` behind a Rule-5-safe
envelope builder. New `07-app/core/drillRunner.js` wires it all into a real
`#practice-view` in `index.html`, firing `telemetry.log('drill_result', ...)`
on completion — the call site that unblocks `adaptivePlan.js`, `weeklyPlan.js`,
and the coaching service's `justHappened` field.

**Locked decision: listening engine is `listener-real.mjs` → `listenerReal.js`
(pair-constrained autocorrelation), not `listening-engine.js`.** ADR-0002 §3
names `listener-real.mjs`/`listener-twin.js` explicitly as the
practice-delivery architecture; `listening-engine.js` is a different
full-chord/fret-based design used only by the two frozen files
(`band-engine.js`, `song-from-hum.js`), which this work did not touch. Do not
re-litigate this — any future practice-drill audio work builds on
`listenerReal.js`.

**Taught-chords gate (owner-required):** `drillRunner.js`'s
`selectPracticePair(practiceIndex, practiceStore)` filters every candidate
practice pair (including `getWeakPairs()` hits) to `pair.introducedAt <=
practiceStore.completedLessonCount()`, using the `introducedAt` field already
present in `07-app/content/practice/index.json`. A student is never offered a
chord pair before its teaching lesson is completed. Covered by
`drillRunner.test.mjs`'s required acceptance case.

Verified: `npm run test:all` 28/28 smoke + 19/19 Playwright; `npm run
test:fidelity` 84/84 (was 48; +36 from this work); `drillRunner.test.mjs`
33/33; `practiceFluencyBridge.test.mjs` 16/16; `coachSurface.test.mjs` 20/20;
all 8 `drills/*.test.mjs` green.

**Not yet done, blocking a full end-to-end Tier 1 demo:**
- The coaching service has never made a real model call. A real
  `ANTHROPIC_API_KEY` is already present in `server/.env` (gitignored,
  untracked, verified 2026-09-06) — the missing piece was the call never
  having been made, not the key being absent. `coach_served` telemetry and
  the prompt-cache-hit check still need to be verified against a real call,
  not just a mocked SDK client. See Wave 6 in `TIER-W-emerald-hollow.md`
  (unblocked, no longer waiting on O.5).
- `chatEngine.js`'s `askCoach` is now reachable from the practice screen via
  `coachSurface.js`/`drillRunner.js`'s "Ask your coach" control (T1.6), but is
  still not wired into the main lesson-runner flow (`lesson-runner.js`) —
  only the practice screen can trigger it today.
- `lessonRunner.planNext()` (adaptive next-lesson selection) is built but
  still **not called from anywhere** — there's no "continue"/next-lesson
  navigation logic in the shell to attach it to; lessons are opened by
  explicit index from catalog clicks only, unchanged from Tier 0.
- No manual browser click-through of the Practice screen has been done yet
  (only automated smoke/Playwright/unit tests) — worth a real click-through
  before calling T1.6 fully verified end-to-end.
- Copy-variant selection (kid/adult-beginner/returning phrasing on lessons
  01-05) and the new Practice screen are the two things genuinely reachable
  by a real user right now.

## Handoff to Tier 2 (written 2026-09-05, after Tier 1 build)

Tier 1's code is done (T1.1-T1.5 all DONE), started early at the owner's
explicit direction before Tier 0's own exit check was met (still 0/5
friends, no deploy). Per `TIER-2-business.md`'s presumed header (not yet
read in this session), the same caution applies: **code-complete is not
the same as validated.** Nothing in Tier 1 has been exercised by a real
student yet.

**Update (2026-09-06, T1.6):** the gap described below — "no drill/practice
screen anywhere in the app" — is now closed. See T1.6 above for what shipped.
The rest of this section is left as written for history; re-read T1.6 for
current state before assuming any of the bullets below still hold.

**The one gap that touches almost everything built in Tier 1 (historical —
now closed by T1.6):** there is
still no drill/practice-taking screen anywhere in the app. This was flagged
in the Tier 0→1 handoff above and remains true after all of Tier 1:
- The coaching service's `justHappened` field will always be null in real
  traffic.
- `adaptivePlan.js`'s mastery-gate logic will never see real confidence
  data, so it will always take the "gate clear, advance" branch.
- The weekly practice plan (T1.5) will always render its honest "no-data"
  message, never a real weak-pair-driven week.
- `chatEngine.js`'s `askCoach`/`replyWithCoach` (the actual AI coaching
  functions) are built, tested, and **not called from anywhere in the
  shell** — there is no chat/coach UI surface in `index.html`/`app.js` at
  all. A student today cannot trigger a single real coaching moment no
  matter how correct the server is.
- `lessonRunner.planNext()` (adaptive next-lesson selection) is also built
  and unwired — no "continue"/next-lesson navigation exists to attach it to.

In short: Tier 1 built the entire adaptive/AI *engine* correctly, but the
app still has no UI surface that produces the input data that engine needs,
and no UI surface that shows the engine's output to a student (beyond the
one copy-variant path that's wired). **Before Tier 2's business layer
(accounts, payments) makes this worth paying for, the practice/drill screen
is probably the highest-leverage next build** — it's the one missing piece
that would make T1.1, T1.2, and T1.5 all become real simultaneously. It
isn't in either tier's task list as written.

Other facts for whoever starts Tier 2:
- **Correction (2026-09-06):** this bullet originally said no
  `ANTHROPIC_API_KEY` had ever been set in this environment — that was false
  as of this date. A real key is present in `server/.env` (gitignored,
  untracked, verified 2026-09-06). The coaching service still has never made
  one real model call — `coach_served` telemetry, the guardrail, and the
  cache-hit behavior are all verified only against a mocked SDK client — but
  that is now unblocked, not waiting on a missing key. See Wave 6 in
  `TIER-W-emerald-hollow.md`.
- `adaptivePlan.js`'s confidence scale is 0-100 (fixed during Tier 1 — it
  was originally coded as 0-1, contradicting `CONTEXT.md`). Any new code
  reading `mastery[].confidence` should assume 0-100.
- `app-refactored.js` is still unresolved (see Tier 0 handoff).
- GitHub Pages deploy is still deferred — app runs locally only.

## Tier W — Emerald Hollow — **IN PROGRESS**

Plan: [`TIER-W-emerald-hollow.md`](TIER-W-emerald-hollow.md). Started 2026-09-06
at the owner's direction.

| Task | Status | Notes |
|------|--------|-------|
| W0.0 Push all branches to GitHub | DONE (2026-09-06) | the three local branches had never been pushed; 16 commits existed on one disk only |
| W0.1 Lift the Emerald Hollow freeze | DONE (2026-09-06) | owner signed off; lifted in both `README.md` and `CLAUDE.md`. Only the Godot world shell + Emerald Hollow art were unfrozen — everything else on that list still stands |
| W1.1/W1.2 Run the world in Godot | TODO | needs Godot 4.7.x installed (O.1); not installed on this machine as of 2026-09-06 |
| W2 Merge the world branch into main | DONE (2026-09-06) | commit `67305e2`, 825 files, +86,877 lines |
| W3 Wire the world to a real lesson | TODO | |
| W4 World/app integration decision | **TODO — owner decision** | Godot-wraps-all vs world-as-front-door vs keep-separate |
| W5 Ship the web app publicly | TODO | blocked on owner steps O.2 (default branch) + O.3 (Pages source) |
| W6 Close out Tier 1 gaps | 2/3 DONE, 1 BLOCKED (2026-09-06) | W6.2/W6.3 done and verified; W6.1 blocked on a new owner step — see notes below |

**W2 merge notes.** `h5-05content-backfill` turned out to be a superset of both
`boardroom/growth-2026-08-30` and `boardroom/content-pipeline-recon-20260826`,
so one merge brought in all three. 38 files conflicted. App code resolved to
main (newer); the world, its assets and its docs came from h5. Four resolutions
were load-bearing and are documented in the merge commit message — read it
before assuming anything about who won a given file. In particular: **h5 still
carried the superseded Maggie Cole teacher on `openai-tts`**; main's Sage
(Chatterbox, per ADR-0004) was kept. Lesson `chords` blocks were byte-identical
on both sides, so no fingering data was touched.

`CHORD_NAME` in `chatEngine.js` was fixed rather than side-picked — both
branches were defective in different ways — and `07-app/core/chatEngine.test.mjs`
(32 assertions) was added to cover it. That test file is new coverage, not a
port; it is the one place W2 went past a pure merge.

**Freeze resolved 2026-09-06 (was blocking every task in this tier).** The
"explicitly frozen" lists in `README.md` and `CLAUDE.md` both named the Godot
world shell and Emerald Hollow art, which contradicted the world now being
merged into `main`. A subagent following the orchestration contract would have
refused every Tier W task. The owner signed off and both lists were amended.
**Scope of the lift: those two items only.** `band-engine.js`, Path A live duet,
Mystery Mode, song-from-hum, voice commands, jam session, style packs, and
teachers T2/T3 all remain frozen — the first two are adjacent enough to world
work to be mistaken for fair game.

**W6 close-out notes (2026-09-06).** Three agents dispatched in parallel per
`TIER-W-emerald-hollow.md`'s Wave 6 table (OWNS: `server/**` /
`07-app/core/lesson-runner.js` / `07-app/app.js`+`07-app/index.html`). Verified
independently by the lead, not just from self-reports: `git diff --stat`
confirmed each agent wrote only its OWNS files; the full baseline suite is
still green — `npm run test:all` 28/28 + 19/19, `npm run test:fidelity` 84/84,
`node 07-app/verify-sw-cache.mjs` 7/7, `node 07-app/core/chatEngine.test.mjs`
32/32; `server`'s own mocked suite 33/33 (unaffected).

- **W6.2 (`lesson-runner.js`) — DONE.** `askCoach` is now reachable from
  inside a lesson via a new "Ask your coach" button, mirroring the practice
  screen's existing `askCoachAbout` contract exactly. Rule 5 holds — the
  envelope only ever carries `lessonId`/`learnerProfile` plus real (or empty)
  `mastery`/`justHappened`/`recentHistory`, never invented text. Confirmed by
  reading the diff directly.
- **W6.3 (`app.js`/`index.html`) — DONE.** Finishing a lesson now calls
  `lessonRunner.planNext()` and offers a gated "Continue to next lesson"
  action; the reason text shown is always `plan.reason`
  (`planNextUnit`'s own stored-number-derived string), never invented, and
  the target lesson is checked against `LESSON_UNLOCK_COUNT` before the
  button is shown. Confirmed by reading the diff directly.
- **W6.1 (`server/**`) — BLOCKED, new owner action required.** The key in
  `server/.env` is real but **org-level, not workspace-scoped** — every real
  call (`messages.create` and `messages.countTokens`) returns a reproducible
  `400 invalid_request_error`: *"This API key is not scoped to a workspace,
  so this request must include the anthropic-workspace-id header..."* — the
  lead reproduced this independently, it is not just the subagent's claim.
  Code is ready (`config.js`/`modelClient.js` now read
  `ANTHROPIC_WORKSPACE_ID` and pass it as the `anthropic-workspace-id`
  header; `server/test/real-call.smoke.mjs` is the live verification script,
  named so it's excluded from `npm test`'s glob and never runs or costs
  money except via `npm run test:live`) — it just has nothing to
  authenticate with yet. **New owner step:** get a workspace-scoped key, or
  the workspace ID (`wrkspc_...`) itself, from the Anthropic Console, and set
  `ANTHROPIC_WORKSPACE_ID` in `server/.env`. Then re-run
  `cd server && npm run test:live` for the real `coach_served`/cache-hit
  verification this task still needs.
- **`anonId` gap — FIXED (2026-09-07).** `coachSurface.js`'s
  `buildCoachEnvelope()` now accepts `anonId` and passes it through verbatim
  when it's a non-empty string ≤128 chars (server/src/schema.js's
  `MAX_ANON_ID_LEN`, duplicated in a comment there since the server shares no
  code with this client bundle) — never generated, same "never invent"
  posture as every other field. Both call sites now derive it from
  `telemetry.js`'s `getAnonId()` (the same stable per-device id already used
  for event logging), with an explicit override still possible for tests:
  `drillRunner.js`'s `askCoachAbout` reads it off the `telemetry` object
  already passed into `createDrillRunner({...})`; `lesson-runner.js`'s
  `askCoachAbout` reads it off a new `options.telemetry`, wired up by
  `index.html` passing `telemetry: telemetry()` into
  `createLessonRunner({...})`. Verified: a hand-built envelope through this
  path now passes `server/src/schema.js`'s `validateFactsEnvelope()` with
  `ok: true, errors: []` (previously `schema_validation` on `anonId`).
  `coachSurface.test.mjs` extended with 5 new assertions (26/26 total,
  up from 21) covering pass-through, omission on invalid/missing input, and
  the 128-char boundary. Full baseline suite re-verified unaffected:
  `test:all` 28/28+19/19, `test:fidelity` 84/84, `verify-sw-cache` 7/7,
  `chatEngine.test.mjs` 32/32, server mocked suite 33/33. **This closes the
  last gap blocking a real coaching round-trip once W6.1's workspace-ID
  issue is separately resolved by the owner.**

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
2. **T1.5 renewal feature:** **decided (2026-09-05, owner) — (a) weekly
   practice plan.** Cheapest to build, reuses adaptivePlan.js (T1.2), no
   licensing exposure. Do not build (b) or (c).
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
