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

**Correction (2026-09-09):** the line below is stale and was left uncorrected
too long. `drill_result` *is* fired — `07-app/core/drillRunner.js` fires it
around line 292 — and the Practice screen has been reachable since T1.6
(2026-09-06). Kept here, struck through, only so nobody re-derives the old
gap from history: ~~`drill_result` telemetry event is defined but never
fired — no drill/practice screen is reachable from the current shell.~~

**Exit check:** code is done; the remaining items are things only the owner
can do:
- [ ] Deploy via GitHub Pages (decision made — see open decision #5). Repo
  Settings → Pages → set "Source" to "GitHub Actions"; the existing
  `.github/workflows/deploy-pages.yml` does the rest on the next push to
  `main` that touches `07-app/**`. **Deliberately deferred** — running
  locally for now, deploy when ready.
- [ ] Once deployed, confirm on a real phone: a lesson plays audio on
  cellular in under 5 seconds.
- [x] ~~**Get five people who are not you to open it.**~~ **WAIVED by the
  owner, 2026-09-08.** Five outside testers are not available, and the gate
  was blocking work that does not depend on it. The gate is retired, not
  passed: nothing below should be read as "five people liked it." What it
  was protecting against — shipping on the author's own judgement of what a
  beginner needs — is now unguarded, so treat every claim about how the
  first lessons feel to a newcomer as untested until someone outside tries
  them. Re-open this the day a tester is available.
- [ ] Confirm the feedback button produces a readable row (requires a live
  PocketBase instance reachable from the deployed URL — currently only
  `pocketbase-dev` local dev config exists; the owner needs to stand up
  PocketBase somewhere the deployed app can reach, and point
  `telemetry.js`'s `baseUrl` at it).

Five real users have opened it: **0 / 5 — gate waived by the owner
2026-09-08, see above. No longer blocks any tier.**

## Coaching actually reaches the student — 2026-09-08

Sage served canned template prose on **every** call before today, in both the
lesson chat and the practice nudge. Three separate causes, all now fixed and
verified against the live API: the latency budget was under the measured cost
of a real call (2300 ms vs 1.9-2.4 s); the guardrail rejected any answer
naming the chord the open lesson teaches, because a beginner has no recorded
mastery for it; and the coach URL was hardcoded to loopback, so no deployed
copy could ever reach the service.

New envelope field `lessonChords` carries the lesson's own verified chord
shapes (name, frets, fingers). It exists because with only the chord name to
work from, the model answered "third fret of the D string" for Em, which is
the second fret — the guardrail cannot catch a spelled-out number, so the fix
was to stop making the model guess what the lesson already knows.

Live check, eight beginner questions on lesson 3: 7 of 8 served a real model
answer, 1 fell back to template. Previously 0 of 8. Server tests 49 -> 73.
Full write-up: `WHAT-CHANGED-2026-09-08.md`.

Still open, and the one that will look like success while failing: a deploy
**must** set `globalThis.GUITARAPP_COACH_URL` to the public coach URL. Left
unset, the app runs and answers — with canned text.

## Handoff to Tier 1 (written 2026-09-05, after Tier 0 build)

Tier 0's code is done and green. Its Exit Check originally gated every later
tier on five outside testers; the owner waived that gate on 2026-09-08 (see
above), so `TIER-1-make-ai-real.md`'s "do not start Tier 1 until Tier 0 is
SHIPPED" header no longer holds work back. Deploy is still open and still
worth doing. This section is here so whoever starts Tier 1 doesn't have to
re-derive state from commit history.

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
  picks this back up can deploy whenever it is useful — with the five-friend
  gate waived (2026-09-08) nothing is waiting on it, but a public URL is
  still what makes the coach reachable from a phone.

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
- **Resolved 2026-09-07 — see Wave 6 in the Tier W section below for the
  full story.** The coaching service now makes real model calls
  (`claude-haiku-4-5-20251001`) and `coach_served` telemetry fires
  end-to-end with a genuine response reaching the student, not a template
  fallback. One accepted tradeoff: no prompt-cache hit with Haiku (its
  cacheable-prefix floor is much higher than Opus's; not worth chasing with
  filler content given Haiku's low per-token cost).
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
- **Correction (2026-09-07):** this bullet originally said no
  `ANTHROPIC_API_KEY` had ever been set, and (as of 2026-09-06) that the
  coaching service had still never made a real model call. Both are now
  false: a real, workspace-scoped key is present in `server/.env`
  (gitignored, untracked), and as of 2026-09-07 the service makes real
  `claude-haiku-4-5-20251001` calls with `coach_served` telemetry firing
  end-to-end. See Wave 6 in the Tier W section below for the full story
  (model swap, a real latency-budget fix, and an accepted no-cache-hit
  tradeoff with Haiku).
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
| W1.1/W1.2 Run the world in Godot | DONE (2026-09-07) | O.1 satisfied — Godot 4.7.2 at `C:\Users\Hendrickson\godot\`. The cold open plays: B00 walk-in → B01 meet-Sage → B02 two-shot, ~15s total, with Sage's voice over clips 2 and 3. Needed the W3.1 render fix below before anything was visible |
| W2 Merge the world branch into main | DONE (2026-09-06) | commit `67305e2`, 825 files, +86,877 lines |
| W3.1 Godot project hygiene | DONE (2026-09-07) | `fdb4774`. Project converted 4.3→4.7; added the missing stretch mode; fixed the cold open rendering off-screen (see below). `.godot/` editor cache untracked |
| W3.2 Real lesson entry from the world | DONE (2026-09-07), pending owner F5 confirm | Cold open now hands off to a real on-screen entry screen instead of holding a dead frame; L01 is enterable via a still-image fallback. See notes below |
| W4 World/app integration decision | **DECIDED (2026-09-07, Option C)** | Keep both separate for now; ship web app first; world is local development focus |
| W5 Ship the web app publicly | IN PROGRESS (2026-09-07) | W5.1 workflow deploying (environment protection rule fixed), W5.2 cleanup complete (~23MB duplicate assets removed), awaiting W5.3 (five real users) |
| W6 Close out Tier 1 gaps | 3/3 DONE (2026-09-07) | Real coaching now reaches a student end-to-end for the first time — see notes below |

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

**W3.1 — why the world looked blank (2026-09-07).** The project ran correctly
from the first launch — manifest parsed, both voice lines fired, clean
stdout/stderr — but nothing was visible. Two layout faults, neither of which
raises an error:

1. **No stretch mode.** The 720x1280 portrait viewport was never scaled to the
   OS window, so on a desktop monitor content drew at native pixel size. The
   clips are **1280x720 landscape, 5.03s each** and landed mostly off-screen.
2. **Controls parented to a `Node2D` do not resolve anchors against the
   viewport** — they compute to zero size. `VideoStreamPlayer` sat directly
   under the Node2D root with full-rect anchors that did nothing; it rendered
   only because `expand` defaults to false (native size, ignores the rect).
   The Control tree now lives under a **CanvasLayer**, where anchors work.

Remember this shape: **a blank Godot window with no errors is usually a layout
fault, not a missing asset.** Screenshot a live run before touching assets. The
`.ogv` files were fine the whole time.

Also note the content mismatch this exposed: **the cinematics are 16:9 landscape
but the app is a portrait phone app.** They are letterboxed for now, which is
correct for a cutscene, but any future world art should decide orientation
deliberately rather than inheriting it from the generator.

**W3.2 — real lesson entry from the world (2026-09-07).** Two agents dispatched
in parallel, OWNS lists disjoint: `07-app/godot/world/World.gd` +
`World.tscn` (entry screen) / `07-app/godot/lesson/LessonScene.gd` +
`LessonScene.tscn` + `07-app/godot/data/lesson_manifest.json` (L01 still-image
fallback). `git diff --stat` confirmed each agent wrote only its OWNS files.

- `World.gd::_ready()` still auto-plays the `W1-coldopen` cutscene (that is
  the real opening beat now, not a demo shortcut — the `# DEMO HOOK` comment
  is gone), but `enter_lesson()` now connects to the `LessonScene.lesson_finished`
  signal that already existed on disk from W3.1. When it fires — cutscene end
  OR the new still-lesson back button below — `World.gd` frees the lesson
  scene and shows a new `EntryUI` `CanvasLayer` (sage_porch backdrop + one
  `Button` per lesson-manifest entry that isn't a sequenced cutscene, i.e.
  everything without a `clips` key). Clicking a door calls `enter_lesson(id)`.
- `L01-open-c` still has no generated video/voice (`assets/lessons/` is
  empty; the `_todo_blocked` marker is untouched — **not fabricated**).
  `lesson_manifest.json` now gives it a `still` field instead;
  `LessonScene.setup()` checks it before touching the clip-loading path at
  all, shows the still with the existing fingering overlay on top, and shows
  a new "Back to Emerald Hollow" button that emits the same `lesson_finished`
  signal the video path uses — so `World.gd` doesn't need to know which way
  a lesson ended.
- **Real bug caught during lead verification, not by either subagent:** both
  agents' code independently referenced `sage_porch.png` for the backdrop.
  Running Godot (`Godot_v4.7.2-stable_win64_console.exe --path
  07-app/godot`) threw `ERROR: Failed loading resource` /
  `Parse Error: [ext_resource] referenced non-existent resource` — `file`
  on that path shows it is actually **JPEG data saved with a `.png`
  extension** (`valid=false` in its `.import`, and all 4 of its sibling
  stills have the exact same defect — this is a systemic artifact of
  whatever generated them, not particular to this task). The project's own
  `assets/worlds/emerald-hollow/stills/manifest.json` names the fix
  directly: `sage_porch.png` is listed there as `raw_file` (pre-quantization
  generator output); `sage_porch.palette.png` is the real, valid,
  already-successfully-imported PNG (`file` in that manifest). Both
  references (`World.tscn`'s `ext_resource`, `lesson_manifest.json`'s
  `still` field) were repointed to the `.palette.png` version and its real
  uid (`uid://ctnu7iiklerbc`). Re-running Godot after the fix: zero
  load/parse errors, cold open completes (`Lesson 'W1-coldopen' finished.`
  printed) with no runtime error after. **If any future world work reaches
  for `coldopen_walk.png`, `sage_charsheet.png`, or `twoshot.png` directly
  (not their `.palette.png` siblings), it will hit this same defect —
  always use the `.palette.png` file per that manifest.**
- **Not yet verified: the on-screen button click itself.** The lead cannot
  drive Godot's GUI from this environment — verification so far is a full
  code/node-path trace by both subagents (re-checked independently) plus a
  clean, error-free console run of the actual cold-open-to-lesson_finished
  path. **Owner should press F5 once** to confirm the entry screen actually
  renders with a clickable "Your First Chord: Open C" door, and that
  clicking it shows the porch backdrop with the fingering overlay. `npm run
  test:all` re-confirmed unaffected (28/28+19/19) — these are Godot-only
  file changes.

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
- **W6.1 (`server/**`) — DONE (2026-09-07). Real coaching reaches a student
  end-to-end for the first time.** Original blocker: the key in `server/.env`
  was real but org-level, not workspace-scoped — every real call 400'd
  asking for an `anthropic-workspace-id` header. Owner supplied a second,
  workspace-scoped key (from `guitar app claude api key.txt`), which cleared
  that error immediately — confirmed via `npm run test:live`.
  That surfaced two more real, verified problems, not owner actions:
  1. **Latency vs. budget.** The spec'd model (`claude-opus-5`, adaptive
     thinking) took 4.1-4.8s per real call, but the server's own
     `MODEL_TIMEOUT_MS` (2300ms — "the student never waits on a network for
     coaching") discarded every real response before it arrived, always
     falling back to template. **Owner decision: swap to `claude-haiku-4-5-
     20251001`** — this is short templated fact-citing prose, not a reasoning
     task, Rule 5 is enforced in code (`guardrail.js`) independent of model
     choice, and Haiku is far cheaper besides. Real Haiku latency measured
     ~2.0-2.4s, now fitting the existing budget. Haiku also rejects
     `thinking: {type: 'adaptive'}` outright (400 "adaptive thinking is not
     supported on this model") — `modelClient.js`'s `callCoach()` now only
     sends `thinking`/`output_config` when `config.js` actually configures
     them (both `null` for Haiku); `modelClient.test.mjs` updated to assert
     against the `config.js` constants instead of a hardcoded
     `'claude-opus-5'` literal, so it won't need hand-editing on the next
     model swap either.
  2. **`coach_served` telemetry silently missing even on success.**
     `chatEngine.js`'s `logCoachServed()` fired `import('./telemetry.js').
     then(...)` without awaiting it, so `askCoach()` could resolve and
     return to its caller *before* the telemetry write landed — a real race,
     not a mocked-test artifact; found because the live smoke test checked
     `telemetry.getQueue()` right after `await askCoach(...)` and saw it
     empty despite a genuine model response. Fixed by awaiting it properly.
     New regression coverage in `chatEngine.test.mjs` (32→36) proves
     `coach_served` is already in the queue immediately after `askCoach()`
     resolves, both on the model-success and template-fallback paths.
  3. **Cache floor also fixed independently, then a Haiku tradeoff surfaced.**
     `modelClient.js`'s `buildSystemPrompt()` never used `T1.json`'s
     `persona.catchphrase`/`persona_lines` even though they were already
     loaded — real, owner-approved voice content, not filler. Wiring them in
     (plus restating the camera/copyright non-negotiables as explicit model
     rules) grew the prompt from ~250 to ~450 tokens, which cleared Opus's
     cacheable-prefix floor (`cache_read_input_tokens=609` confirmed on a
     second call, while still on Opus). **After the Haiku swap, no cache hit
     is observed** — Haiku's minimum cacheable-prefix length is much higher
     than Opus's, and this prompt doesn't reach it. Padding further with
     genuinely-uninformative filler just to hit that number was judged not
     worth it (owner + lead agreed): Haiku's per-token cost is already low
     enough that the dollar value of caching here is small. Accepted as a
     tradeoff, not left as an open bug.
  **Final verified state** (`cd server && npm run test:live`, real API,
  real HTTP round trip): first real model call succeeds; `coach_served`
  fires with `source: "model"`, latency ~2.0s; end-to-end `askCoach()`
  serves a genuine model response, not template fallback. Cache-hit line
  fails by design per the tradeoff above. Full baseline re-verified after
  every change: `test:all` 28/28+19/19, `test:fidelity` 84/84,
  `verify-sw-cache` 7/7, `chatEngine.test.mjs` 36/36, `coachSurface.test.mjs`
  26/26, server mocked suite 33/33.
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

### Wave 7 — the four things the owner reported broken (2026-09-08) — **DONE**

Owner report: buttons dead, the lesson not happening in the world, students
unable to ask the teacher, listening tab not working. All four were real; none
of them threw an error, which is why they read as "nothing happens".

| Task | Status | Notes |
|------|--------|-------|
| W7.1 Lesson completion is recorded | DONE | `markLessonComplete` only logged telemetry — write-only analytics — so `completedLessonCount()` was stuck at 0 forever and `selectPracticePair` gated every drill out. New `core/practiceProgress.js` owns one shared, persisted `PracticeStore`; the lesson screen, the practice screen and the weekly-plan card all use it instead of the three separate instances they each built. All 8 drills unlock after 4 lessons, verified in a browser. |
| W7.2 Practice pair copy | DONE | Said "Complete Lesson 1"; the earliest pair in `content/practice/index.json` is gated at 4. Now counted off the catalog. `ensureDrillRunner` also no longer caches a runner built before the practice index has loaded. |
| W7.3 Students can ask questions | DONE | There was an "Ask your coach" button and nowhere to type. Added a chat transcript + input to the lesson (`lesson-runner.js`), carried a `question` field end-to-end through `coachSurface.js` → `server/src/schema.js` → the model prompt, and gave a typed question its own longer latency budget on both sides. |
| W7.4 Coach service reachable from the browser | DONE | Four separate faults, each of which alone forced template prose: no CORS on the service (every real browser call died at the preflight, curl worked, so it looked fine); `learnerProfile` fields all required, so a student who skipped the deliberately-skippable onboarding was 400'd; `lessonId` required, so the practice screen could never call it; and `masteryFromSkillMap` emitting PracticeStore's state words (`clean`/`struggling`) against the service's `mastered`/`needs_work` enum. |
| W7.5 Guardrail false positives | DONE | It rejected "the A string" as an invented chord, and "0.71" as an invented number when the envelope carried 0.7166…. Now: a note letter qualified by the word "string" is exempt (a bare chord claim still is not), chords and numbers in the student's own question are allowed, and a number is checked numerically against one unit in its last decimal place rather than by exact string match. |
| W7.6 Listen screen | DONE | `tuner-engine.js` and `listening-engine.js` were complete and imported by nothing. New `core/listenView.js` mounts a tuner and a chord check on the real mic. Chord shapes come from the lessons' own verified `chords` blocks. Verified against synthetic tones fed to Chromium as a fake mic: the tuner names the right string and reads the offset. |
| W7.7 Emerald Hollow in the app | DONE | See ADR-0005's "Revisited" — Option C reversed at the owner's request. `core/worldView.js` plays the cold open (with Sage's voice over the silent clips) and shows the porch with a door per lesson; a door opens the app's real lesson and returns there. World assets restored from W5.2's deletion (~13MB); the service worker now skips video rather than trying to cache 206 responses. |

Suites after Wave 7: `test:all` 28/28 + 19/19, server 49/49 (up from 33 —
new cases cover the question field, the optional profile/lessonId, string
references and rounded numbers), `drillRunner` 35/35, `coachSurface` 26/26,
`chatEngine` 36/36.

**Still open (partly closed 2026-09-09, see Wave 8 below):** `chatEngine.js`
points at `http://127.0.0.1:8787/coach`, so coaching only works with the
service running locally. A deployed build needs that URL pointed at a hosted
instance, and `COACH_ALLOWED_ORIGINS` set to the deployed origin. The service
also does not read its own `.env` (no dotenv dependency) — start it with
`node --env-file=.env src/index.js`.

## Wave 8 — six parallel agents to finish the first set of lessons — 2026-09-09

Dispatched per `HANDOFF-NEXT.md` (now superseded by this section), one wave,
six agents, disjoint `OWNS` lists, verified independently by the lead via
`git status`/`git diff --stat` after each report. Full baseline unaffected
throughout: `cd server && npm test` 73/73, `npm run test:app-smoke` 28/28,
`npm run test:playwright` 35/35, every `07-app/core/*.test.mjs` 0 failed.

| Agent | Task | Status | Notes |
|---|---|---|---|
| 1 | Deploy reachability | DONE | `07-app/index.html` now shows an on-screen banner + `console.error` when a real deployment ships with the coach URL still unset (verified silent on local dev/tests). `.github/workflows/deploy-pages.yml` gained a step that substitutes a `COACH_URL` repo variable into the deployed copy, failing the deploy loudly if the expected config line has drifted. `deploy/netlify.toml` documents the Netlify-side equivalent via dashboard snippet injection. Also added the mirrored `GUITARAPP_TELEMETRY_URL` config line alongside the coach one (see Agent 3). Found the branch/workflow mismatch closed out below. |
| 2 | Coach service host | DONE (recommendation only, no host chosen) | `server/README.md` now has a "Deployment" section comparing Render (free tier has a cold-start trap that would silently re-trigger the exact canned-text failure this whole effort exists to prevent — only safe on its $7 paid tier), Railway (~$5/mo, no cold-start issue, simplest), and Fly.io (~$2-5/mo, more CLI setup). Recommendation if the owner wants one pick: Railway. `server/.env` confirmed still correctly gitignored regardless of host. `ANTHROPIC_WORKSPACE_ID` blank is fine unless a multi-workspace 400 actually shows up. **Open owner decision — see below.** |
| 3 | Second hardcoded localhost | DONE | `07-app/core/telemetry.js` now resolves its PocketBase URL via `defaultTelemetryUrl()` reading `globalThis.GUITARAPP_TELEMETRY_URL`, mirroring `chatEngine.js`'s `defaultCoachUrl()` shape exactly. `telemetry.test.mjs` 37→43 passing. **Unresolved, flagged not guessed:** `07-app/app.js:466` uses port **8091** for a PocketBase admin/encrypted-sync path, while everywhere else in the app uses 8090. Agent 3 traced 8091 back to a one-off second PocketBase instance used in old encrypted-sync proof scripts under `.scratch/`, not a documented convention — plausible typo, plausible deliberate second instance for the (currently frozen) encrypted-sync feature. Nobody has confirmed which. `app.js` was not touched. |
| 4 | Offline caching, lessons 1-5 | DONE | The real gap wasn't the lesson JSON (already dynamically cached) — it was `core/lesson-runner.js` itself, which nothing precached, so a lesson could not render offline even with its data present. Now precached, along with `audio/manifest.json`. Lesson 1's 9 voice clips are precached; lessons 2-25 stay lazy/cache-first (full 201-clip catalog is 90MB+, would defeat the purpose). `CACHE` bumped `v5`→`v6`. Confirmed `dfa6533` should have bumped `CACHE` and didn't (lesson-runner.js content changes + new core files landed without a bump) — this wave's bump covers both. |
| 5 | Dead code removal | DONE | Deleted `07-app/app-refactored.js` (769 lines) and `07-app/EXAMPLES-COPY-PASTE.js` (622 lines) after confirming zero references anywhere in the repo (app, Godot world, `automation/`, `scripts/`, service worker). `app-refactored.js`'s one real feature — the event-emitter/`appState` pattern — turned out to already be merged into current `app.js`; everything else in it was actually *behind* `app.js` (missing the audio-manifest fetch, missing practice-catalog mirroring `drillRunner.js` depends on). Nothing of value was lost; both are recoverable via git history if ever needed. |
| 6 | Beginner playtest, lessons 1-5 | DONE (verification only, nothing changed) | See findings below — **this is the one that matters most** and the first real check on lessons since the five-friend gate was waived. |

**Agent 6's findings, worst-first (all require an owner/content call, not a subagent fix):**

1. **No chord diagram is ever shown to the student, anywhere.** `07-app/core/renderer.js`'s `chordSVG()` generator (correct, unit-tested against `fidelity.mjs`) is never imported by `index.html` or `lesson-runner.js`. Lessons 3-5 teach Em and easyC in prose only — no picture to check a fingering against. Given that a live model once misstated a fret (see the 2026-09-08 section above), having zero visual cross-check is judged the single biggest risk for a first-time student. **Not fixed — needs a build task, not a hotfix.**
2. **Good news:** every fingering actually stated in lesson text is correct — Em (`frets:[0,2,2,0,0,0]`) and easyC (`frets:[null,3,2,0,null,0]`) both hand-verified against real chord theory. The specific "third fret" Em bug from the 2026-09-08 writeup is not present in the current build.
3. **Possible placeholder audio, unconfirmed.** Every lesson's "intro" clip (10 files across lessons 1-5) measures exactly 5.000s via ffprobe regardless of paragraph length, while adjacent same-lesson clips scale normally with text length. Flagged for an actual listen (`07-app/audio/l03-voice/l03-01-ex1_intro.m4a` named as the example) — not confirmed broken, no audio playback available in the verification environment.
4. **Minor guardrail flake:** one legitimate answer was rejected (`invented_token:E`) on the very first question asked right after opening a lesson; identical questions immediately after all passed. Fails safe to canned text, not a wrong-answer risk, but worth a look at a possible request-ordering race.
5. **Local dev trap:** `cd server && npm start` alone silently serves template prose because `server/src/index.js` reads `process.env` directly with no dotenv — the documented start command doesn't load `server/.env`. Must use `node --env-file=.env src/index.js` instead. Same "looks like success, isn't" failure class Agent 1 fixed for the deployed case, but it also bites locally, on the exact command the README recommends.
6. **Not a bug:** `LESSON_UNLOCK_COUNT=5` in `index.html` means lessons 1-5 are all unlocked from first load regardless of completion, so completion-gated unlock isn't actually exercised within this range. Progress recording itself works correctly (verified via `localStorage`).

Ask-Sage tally (8 real beginner questions on lesson 3, run twice + one via `test:live`): 7/8 real model answers, all read as correct and appropriately hedged (including one correct refusal to invent a diagnosis — "Am I holding it right?"); 1/8 guardrail fallback (see finding 4). World path (Emerald Hollow → door → lesson → back) verified working end to end. `npm run test:live`: real model calls succeeded every time; the only FAIL line is the pre-accepted no-cache-hit-on-Haiku one.

**Lead follow-up (2026-09-09), not part of any agent's OWNS list:** Agent 1 found `deploy-pages.yml` triggers on `branches: [main]` but the local repo's active branch was `master` (tracking `github/main` under a mismatched name — exactly the setup that makes a plain `git push` ambiguous or fail). Local branch renamed `master` → `main` to match GitHub's actual default branch and the workflow trigger; upstream tracking to `github/main` preserved. **`github/master` still exists as a separate, stale remote branch (old commit `8743b1e`) — left untouched, owner call on whether to delete it.**

## Wave 9 — chord diagrams wired up — 2026-09-10

Closes Wave 8 finding #1 (the top-priority item in `HANDOFF-NEXT.md`): no
chord diagram was ever rendered anywhere in the app, despite
`07-app/core/renderer.js`'s `chordSVG()` being correct and unit-tested
(`fidelity.mjs`) since Step 0.

`07-app/core/lesson-runner.js` now loads `renderer.js` via dynamic `import()`
(same pattern already used there for `coachSurface.js`/`adaptivePlan.js` —
`renderer.js` is an ES module, `lesson-runner.js` is a classic script), kicked
off eagerly at file load so it's normally already resolved by the time a
lesson opens; `openLesson` re-renders once it lands otherwise, mirroring the
existing audio-manifest pattern. `renderLessonHTML` now renders: (1) a
`chord-gallery` of every chord in the lesson's `chords` block, right after the
objectives list, and (2) a small diagram inline in any step whose
`params.chord`/`params.chord_name` names one of those chords — so the picture
sits next to the fingering instructions it backs up, not just in a gallery a
beginner has to scroll back to. CSS added to `07-app/index.html` only
(`.chord-gallery`, `.chord-diagram`). No caption text added — `chordSVG`
already draws the chord's name inside the diagram whenever `chord.name` is
set, true for every chord in every lesson today.

Verified in a real Chromium session (not just the test suites): opened Lesson
3, confirmed 3 `<svg>` chord diagrams render (1 gallery + 2 step-inline, both
referencing Em), fingering matches the JSON (`frets:[0,2,2,0,0,0]`,
fingers 2/3 on the A/D strings, opens elsewhere). Full baseline unaffected:
`cd server && npm test` 73/73, `npm run test:app-smoke` 28/28,
`npm run test:playwright` 35/35.

**Remaining Wave 8 findings, still open — see "Open owner decisions" below
and the smaller-bugs list in `HANDOFF-NEXT.md`:** coach service host
(Railway ruled out 2026-09-10 — owner used it before, found it unreliable),
possible placeholder audio (owner listening, not yet reported back),
guardrail flake, local-dev dotenv trap. `github/master` and the 8090/8091
port are resolved — see items 7-8 below.

## Tier 1B — Close the gaps — **TODO**

Plan: [`TIER-1B-close-the-gaps.md`](TIER-1B-close-the-gaps.md). Written
2026-09-10 from an owner grilling session following that day's redline.
Scope: deploy the coach service + confirm desktop works alongside phone,
fix the placeholder-audio bug (confirmed systemic — ~60 identical clips
across all 25 lessons, not just 5), wire in all four dormant Wayfinder
modules (practice remix, stylistic explorer, celebration, jam session), and
build jam session's real generative half on a cloud GPU. Tier 2 stays out
of scope. Owner is the sole tester for now by explicit choice — no task in
this tier is gated on finding other testers.

| Task | Status | Notes |
|------|--------|-------|
| 1A Coach deploy prep (Render) | DONE (2026-09-10) | `server/render.yaml` + README steps; dotenv trap fixed (`npm start` alone now loads `.env`); verified live: real `/coach` call returns `source:"model"`, 76/76 server tests green (73 baseline + 3 from 1C's guardrail fix). Independently re-verified by a second agent. Owner still must do the Render signup — see `server/README.md`'s numbered steps |
| 1B Placeholder audio fix | TODO | trace the real TTS pipeline, regenerate ~60 clips across 25 lessons |
| 1C Guardrail flake + LOG.md | TODO | |
| 2A Practice remix wiring | TODO | |
| 2B Stylistic explorer wiring | TODO | |
| 2C Celebration wiring | TODO | |
| 3A Jam session server route + unfreeze | TODO | try fal.ai first (existing live `FAL_KEY`, RunPod already failed once on this project — see WORLDFACTORY-DIAGNOSIS-2026-08-30.md); RunPod only as fallback |
| 3B Jam session client + UI | TODO | blocked on 3A having a verified working backend |
| 4 Hub wiring + full verification | TODO | blocked on Waves 2 and 3 |

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
6. **Coach service host** (2026-09-09, still undecided 2026-09-10): Agent 2's
   original recommendation was Railway, but the owner has used Railway before
   and found it unreliable — **Railway is out.** Remaining candidates:
   Google Cloud Run with `min-instances=1` (~$5-10/mo, eliminates the
   cold-start trap entirely, more setup than Railway — needs a Dockerfile +
   gcloud config), Render's paid tier (~$7/mo, same platform whose free tier
   has the cold-start trap — paid tier removes it), or Fly.io (~$2-5/mo,
   cheapest, more CLI setup/maintenance). Once chosen, set the `COACH_URL`
   repo variable (Settings → Secrets and variables → Actions → Variables) so
   `deploy-pages.yml` can wire it into the deployed app.
7. **Stale `github/master` remote branch** — **RESOLVED (2026-09-10, owner
   decision: delete).** Deleted via `git push github --delete master` and
   pruned locally. `github/master` no longer exists.
8. **8090 vs 8091 PocketBase port** in `07-app/app.js:466` — **RESOLVED
   (2026-09-10).** Investigated: `pocketbaseSync.js` (the library
   `initEncryptedSync()` actually calls) defaults to 8090 in two places;
   `app.js:466`'s own hardcoded default was the odd one out at 8091.
   `git log -S"8091" -- 07-app/app.js` traces it to one commit
   (`5475c55`, oddly labeled as an audio-pipeline commit) that added the
   whole `initEncryptedSync` block at once, no comment on the port choice.
   Two earlier proof docs (`.scratch/.../proof-wave2/w2-e5-sync-proof.md`,
   `proof-wave3/WAVE3-A-encrypted-sync-proof.md`) both ran their own
   standalone dev PocketBase instance on 8091 while testing encrypted sync —
   separate from the "regular" instance the quick-start guide has you run on
   8090 — most likely to avoid a port clash with an already-running 8090
   instance on the same dev machine. No ADR or doc anywhere calls for two
   separate PocketBase instances by design, so this reads as a leftover dev
   artifact, not intent. Owner agreed with that read; `app.js:466` now
   defaults to 8090, matching `pocketbaseSync.js` and the quick-start docs.
   (The feature stays frozen and gated behind admin credentials in the URL
   either way, so nothing depended on 8091.)

## Measured numbers (fill these in as they become real)

- Cost per active student per month: _not measured_
- Free→paid conversion: _not measured_
- D7 retention: _not measured_
- Monthly churn: _not measured_
- Worst lesson for drop-off: _not measured_
