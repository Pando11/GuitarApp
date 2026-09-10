# Handoff — finish the first set of lessons

**Written 2026-09-09. Repo: `C:\Users\Hendrickson\Desktop\GuitarApp`, branch `master`, clean at `dfa6533`.**

Read this file first, then `WHAT-CHANGED-2026-09-08.md`, then
`docs/plans/STATUS.md`. Do not re-derive state from commit history.

## Where things stand

The app works. Lessons 1-25 have complete content and complete narrated
audio (201 of 201 voice files present). The Emerald Hollow world, the porch
doors, the lesson flow, the Ask Sage chat, the tuner and progress recording
all pass in a real browser.

As of yesterday Sage gives real model answers instead of canned text. That
had never worked before: the latency budget was shorter than a call takes,
the Rule 5 guardrail rejected any answer naming the chord the open lesson
teaches, and the model was inventing fingerings because the lesson's verified
chord shapes were never sent to it. All three are fixed and verified live.

Test baseline, all currently green. Any regression here is a stop-the-line:

| Suite | Command | Expected |
|---|---|---|
| Coach server | `cd server && npm test` | 73 pass, 0 fail |
| App smoke | `npm run test:app-smoke` | 28 pass |
| End to end | `npm run test:playwright` | 35 pass |
| Core units | `node 07-app/core/<name>.test.mjs` | each 0 failed |

**Sage runs on Haiku 4.5** (`claude-haiku-4-5-20251001`), owner's decision,
reaffirmed 2026-09-08. `server/src/config.js` is the source of truth. Do not
send `thinking` or `output_config` — Haiku 4.5 returns a 400 on both.

**The five-friend gate is waived.** It no longer blocks any tier. It is
retired, not passed: nobody new to guitar has tried these lessons, so treat
every claim about how the first lessons *feel* as untested.

## How to run this

Spawn the six subagents below **in parallel, in a single message**. They own
disjoint files and will not collide if you respect the ownership lines. Give
each one the full text of its task, plus the baseline table above.

Three hard rules to pass to every agent:

1. **Never edit `docs/plans/STATUS.md`.** Every agent will want to. You, the
   lead, update it once at the end from their reports. This is the only file
   that would otherwise conflict six ways.
2. **Never start the coach server on port 8787.** Only Agent 6 does. Two
   servers on that port produce a confusing `EADDRINUSE` crash mid-suite, and
   the second one silently serves stale code — that cost real debugging time
   yesterday.
3. **`cd server && npm run test:live` makes real paid API calls.** Only Agent
   6 runs it. It is cheap on Haiku, but it is not free and it is not
   parallel-safe.

Tell each agent to report back: what it changed, which tests it ran with
actual counts, and anything it found but did not fix. Do not let an agent
report success without having run the suites that cover its files.

---

## Agent 1 — Make the deployed app reachable

**Owns:** `07-app/index.html` (the config script block only),
`.github/workflows/deploy-pages.yml`, `deploy/netlify.toml`.

The static app has a GitHub Pages workflow ready and has never been
deployed. The one-time repo setting is the owner's to do: Settings → Pages →
Source → "GitHub Actions". Do not attempt it yourself; write down exactly
what the owner must click.

The trap, and it is the whole reason this task exists: `07-app/index.html`
sets `globalThis.GUITARAPP_COACH_URL` to `http://127.0.0.1:8787/coach`. A
phone cannot reach that. **Left unset at deploy time the app loads, opens
lessons, and answers questions — with canned template text.** It is a
failure that looks exactly like success. Make it impossible to miss: a build
step that fails loudly, a visible banner when the coach is unreachable, or
whatever you judge best. Say which you chose and why.

Coordinate with Agent 2 — the coach service has no host yet, so you may not
have a real URL to point at. Design for that: the mechanism should be
correct now and the value fillable later.

## Agent 2 — Find the coach service a home

**Owns:** `server/README.md`, any new deploy config under `server/`.
**Does not touch** `server/src/**` — Agent 6 is verifying that code.

`server/` is the only process that holds `ANTHROPIC_API_KEY`. It runs only
on the owner's desktop. GitHub Pages serves static files only, so the static
deploy does not solve this.

This needs an owner decision, so **do not pick a host and start signing
things up**. Produce a short recommendation: two or three options, what each
costs per month, what the owner has to do for each, and how the key gets
there without landing in git. Note that `server/.env` is correctly gitignored
and must stay that way. Flag that `ANTHROPIC_WORKSPACE_ID` is currently blank
and whether that matters for the host you recommend.

## Agent 3 — Kill the second hardcoded localhost

**Owns:** `07-app/core/telemetry.js`, `07-app/core/telemetry.test.mjs`.

`telemetry.js` around line 181 hardcodes `http://127.0.0.1:8090` as the
PocketBase address. This is the same bug the coach URL had: correct on the
owner's machine, silently broken everywhere else. Feedback rows and event
logging from a deployed app go nowhere.

Fix it the same way the coach URL was fixed, for consistency: a
`globalThis`-set value with the loopback address as fallback, so local
development needs no configuration. Read `07-app/core/chatEngine.js`'s
`defaultCoachUrl()` and match its shape and its comment style.

There is also `07-app/app.js` around line 466 using port **8091** for a
PocketBase admin path. Work out whether that port difference is deliberate or
a typo. If you cannot tell, say so rather than guessing — do not "fix" it
into agreement.

Run `node 07-app/core/telemetry.test.mjs` (37 passing now) and add cases for
the new resolution.

## Agent 4 — Make the app work on a bad connection

**Owns:** `07-app/service-worker.js`.

`PRECACHE_URLS` lists ten files. It does **not** include
`core/lesson-runner.js`, any of the 25 lesson JSON files, or any audio. A
student on a weak connection gets an app shell with no lesson in it, which
for a beginner reads as "this is broken."

Work out what actually has to be cached for lessons 1 through 5 to open and
play offline, and cache that. Audio is the judgement call: 201 files is a lot
to precache, but a lesson without Sage's voice is not the lesson. Consider
precaching lesson 1's voice and fetching the rest on demand. Explain your
choice.

The file's own header says to bump `CACHE` on every content change. It is at
`guitarapp-v5`. Bump it, and check whether the changes committed in `dfa6533`
should have bumped it already.

Verify with `npm run test:playwright` (35 passing).

## Agent 5 — Remove the dead weight

**Owns:** `07-app/app-refactored.js`, `07-app/EXAMPLES-COPY-PASTE.js`.

`app-refactored.js` is 769 lines that nothing loads. `index.html` loads
`app.js`. It has been flagged as unresolved in the plan docs since before
Tier 0 and it pollutes every future agent's search results.
`EXAMPLES-COPY-PASTE.js` is another 622 unloaded lines.

**Before deleting anything, prove it is actually dead.** Search the whole
repo, including the Godot world under `07-app/assets/worlds/`, the
`automation/` and `scripts/` directories, and the service worker. Then diff
`app-refactored.js` against `app.js` and report whether it contains anything
`app.js` lacks — an earlier session's note says it "differs substantially"
and nobody has checked what that difference is. **If it holds a real
improvement that was never merged, say so and delete nothing.** It is in git
history either way, so deletion is recoverable, but a silent loss of good
work is not what anyone wants.

## Agent 6 — Play the first five lessons like a beginner

**Owns:** verification only. Changes nothing without reporting first.

This is the task that matters most and the one with no automated coverage,
because the five outside testers who would have caught this do not exist.

Start the coach server (`cd server && npm start`, port 8787 — you are the
only agent allowed to) and serve the app (`node serve-local.js`). Then
actually go through lessons 1 to 5 as a total beginner would, in a browser:

- Does the audio play, and does it match the text on screen?
- Do the chord diagrams match the `chords` block in each lesson's JSON? A
  wrong fingering shipped to a beginner is the worst bug in this app, and one
  already got through — the model said "third fret" for Em, which is the
  second fret.
- Ask Sage the questions a real beginner asks. "Why does it buzz." "My
  fingers hurt." "Am I holding this right." "How long until I can play a
  song." Record how many get a real answer versus a canned fallback, and read
  every answer for correctness, not just for whether one arrived. **A
  confident wrong answer is worse than a fallback.** The server logs a warning
  line whenever the guardrail rejects prose; watch that log.
- Does the world path work? Enter Emerald Hollow, open a lesson through a
  door, come back out.
- Does completing a lesson unlock the next one and record progress?

Report findings ranked by how badly they would hurt someone on their first
evening with a guitar. Fix nothing until you have reported — several of these
will turn out to be content issues rather than code issues, and the owner
should decide.

---

## After the agents report

Update `docs/plans/STATUS.md` yourself, once, from their reports. While you
are in there, one note is now stale: it says `drill_result` telemetry is
defined but never fires and that no drill screen is reachable. Both are false
— `07-app/core/drillRunner.js` fires it around line 292 and the Practice
button reaches the screen. Correct it.

Then commit. Do not push without asking the owner.

## Known and deliberately accepted

Prompt caching never hits. The prompt is around 655 tokens and Haiku's
cacheable-prefix floor is higher than that, so `npm run test:live` prints a
FAIL line about it on every run. This is a money question, not a correctness
one, and it has already been accepted twice. **Do not spend a session trying
to fix it.**
