# TIER 1B — Close the gaps

**Written:** 2026-09-10. **Source:** owner grilling session following the
2026-09-10 redline (`.claude` conversation; gist recorded in `STATUS.md`).
**Executor:** Claude, lead agent, spawning subagents per the orchestration
contract in `docs/plans/README.md`. Read that file before dispatching anything
below — wave structure, OWNS-list rule, subagent prompt template all apply
here unchanged.

**Goal:** get the app into a state the owner can use end-to-end on their own
phone AND desktop browser, with real AI coaching reachable from a public URL,
the four dormant Wayfinder feature modules wired in and testable, a real
generative call-and-response jam, and the placeholder-audio bug actually
fixed. **Explicitly out of scope for this plan:** Tier 2 (accounts, payments,
pricing) — deferred by owner decision. **Explicitly not a gate:** getting
other people to test it. The owner is the only tester right now and will
keep looking for others on their own timeline; do not make any task
conditional on outside testers.

---

## Decisions locked (do not re-litigate)

1. **Scope:** finish Tier 0 / Tier 1 / Tier W to a real, testable state. Do
   not start Tier 2.
2. **Must work on desktop browsers, not just phone.** Every "verify in a
   browser" acceptance check in this plan means both a mobile viewport and a
   real desktop-width window. This was not explicit in earlier tiers and
   should not be assumed done just because mobile was checked.
3. **Coach service host: Render, paid tier (~$7/mo).** Not Railway (ruled
   out — owner used it before, unreliable), not Cloud Run, not Fly.io.
4. **All four orphaned Wayfinder modules get wired in and made testable**
   (`practiceRemix.js`, `stylisticExplorer.js`, `celebration.js`,
   `jamSession.js`) — none are being deleted.
5. **Jam session gets the real generative half built**, not a text
   stand-in: a hosted generative-music model, real generated audio response.
   This requires formally unfreezing "jam session" in `CLAUDE.md` and
   `docs/plans/README.md`'s frozen-scope list, the same way Emerald Hollow was
   unfrozen on 2026-09-06 — do this as part of Wave 3, not silently.
   **Backend choice, corrected after owner input (2026-09-10): try fal.ai
   before RunPod.** RunPod already has a documented failure on this exact
   project — see `brand-references/worlds/WORLDFACTORY-DIAGNOSIS-2026-08-30.md`:
   a stale hardcoded proxy port, a container that silently stopped serving,
   and a real GPU-capacity shortage in the pod's region (EU-RO-1 had zero
   capacity on every GPU type) that blocked pod start outright. World 1's
   FLUX/Wan generation was rebuilt on **fal.ai** instead — a managed,
   per-request API with no pod to keep alive — and it worked
   (`docs/archive/2026-09-pre-tier0/FAL-AI-WORLD1-PLAN.md`,
   `fal.md`). A live, tested `FAL_KEY` already sits in the repo's `.env`
   from that work — no new signup needed if fal.ai carries a suitable model.
   RunPod is not ruled out (the owner does have a working account, and
   AMENDMENT-18 §4 names ACE-Step/YuE specifically as the bound stack), but
   given the project's own history, spend the first real effort on fal.ai's
   catalog before returning to pod management.
6. **The placeholder-audio bug is confirmed, not hypothetical, and it is much
   bigger than previously flagged.** Verified this session: every
   `exN_intro` clip across **all 25 lessons** (not just lessons 1–5) is
   byte-identical (`md5 11507e6c73326c665863b05ccc9cb1a8`), roughly 60 files,
   while each lesson's own `l0X-00-intro.m4a` is genuinely unique. The lesson
   JSON already has real, distinct text for every exercise intro
   (`avatar_coaching_copy.ex1_intro`, `.ex2_intro`, ...) — the text was
   authored correctly and never synthesized. This is a real regression to
   fix, not a design question.

## Owner actions this plan cannot do for you

Subagents cannot create accounts or hold payment credentials. Flagging these
up front so they don't block a wave silently:

- **Render account + service.** Wave 1's coach-deploy task prepares
  everything code-side (config, docs, CORS) and hands back an exact numbered
  list of dashboard clicks. You do the signup, connect the repo, paste in
  `ANTHROPIC_API_KEY`, and hand back the resulting public URL.
- **`COACH_URL` GitHub Actions variable.** Settings → Secrets and variables →
  Actions → Variables, once the Render URL exists.
- **Only if fal.ai turns out not to carry a usable model:** a RunPod pod for
  jam session, provisioned with the port-resolution fix already written in
  `scripts/world-factory/pod_run.py`/`pod_shell.py` from the World 1 diagnosis
  (do not repeat the hardcoded-port mistake). The owner's RunPod account and
  API key already exist in `.env` (`RUNPOD_API_KEY`) — no new signup, but a
  fresh pod/volume choice is needed since the existing volume is FLUX/Wan
  models, not a music-gen model, and is region-locked to EU-RO-1, which is
  exactly where the capacity shortage happened.
- **Listening to the regenerated audio once Wave 1's fix lands** — a
  subagent can prove the files are no longer byte-identical duplicates, but
  only a human ear confirms they sound right.

---

## Wave 1 — Foundation (dispatch together, disjoint OWNS)

### 1A — Coach service: deploy prep for Render

**OWNS:** `server/render.yaml` (new), `server/README.md`,
`.github/workflows/deploy-pages.yml`, `deploy/` (new Render notes alongside
the existing Netlify ones), `server/src/index.js`, `server/package.json`,
`server/package-lock.json`.

Prepare everything needed to deploy `server/` to Render's paid tier:
a `render.yaml` (or documented dashboard settings if Render's Node
buildpack needs no Dockerfile — check before assuming one is needed),
confirm `server/src/index.js` reads `PORT`/`ANTHROPIC_API_KEY` from the
environment the way Render injects them, and add a "Render" section to
`server/README.md`'s existing Deployment comparison (Railway/Cloud
Run/Fly.io are already there — add Render as the chosen one, keep the
others for context). Update `deploy-pages.yml`'s existing `COACH_URL`
substitution step (added Wave 8) if Render's URL shape needs anything
different from what it currently assumes.

**Also fix while in this territory (small, same-file-family):**
`server/src/index.js` doesn't load `.env` — `npm start` alone silently
serves template prose. Add `dotenv` as a real dependency and load it at the
top of `index.js`, OR change the documented start command to
`node --env-file=.env src/index.js` consistently everywhere it's
documented. Pick one, don't leave both stated as valid.

**DONE MEANS:** a fresh clone of `server/` plus the owner's own Render
account can deploy with no code changes, following only the README's
steps. `cd server && npm start` alone (no flags) reaches a real model call
when `server/.env` has a real key. Paste the exact numbered owner steps
(account, connect repo, env vars, get URL) in your final report.

### 1B — Placeholder audio: trace the real pipeline, then fix all 25 lessons

**OWNS:** `07-app/audio/l*-voice/*ex*_intro.*` (regenerated files only —
do not touch `-00-intro`, `-99-results`, `-99-wrap`, or plain
`exN.{wav,m4a}` coaching files, all of which are already correct),
`07-app/audio/manifest.json` (regenerated by the existing transcode script,
not hand-edited), `scripts/regenerate-ex-intros.mjs` (new — only if none of
the existing generation scripts can be reused as-is for a targeted
re-run; do not modify the existing `generate-*.{mjs,py}` scripts at repo
root, treat them as read-only reference).

**Step 1 — find out which script actually works.** Multiple candidate
generation scripts exist at repo root
(`generate-lesson-audio.mjs`, `generate-audio-nodejs.mjs`,
`generate-audio-simple.py`, `generate-audio-wavmaker.mjs`,
`generate-all-audio.py`) plus a `gapp-tts/` directory. `.venv-kokoro` has
`kokoro_onnx` installed (not Chatterbox, despite what older docs assume —
verify before trusting a doc's claim about which engine is live). Use `git
log`/file mtimes to work out which script actually produced the *correct*,
unique `-00-intro`/`-99-results`/`-99-wrap` clips already on disk, confirm
it reads `avatar_coaching_copy.exN_intro` correctly (it should —
`extractCoachingText()` in `generate-lesson-audio.mjs` already builds the
right `{type, text, filename}` list; the bug is downstream of text
extraction, not in it), and use that exact pipeline.

**Step 2 — regenerate.** Every `exN_intro` slot, all 25 lessons (~60
files) — check each lesson JSON's `avatar_coaching_copy` block for the real
text per lesson; do not reuse one lesson's script for another.

**Step 3 — verify no collapse.** `md5sum` every regenerated file. None of
the ~60 new files may share a hash with each other or with the current
placeholder hash `11507e6c73326c665863b05ccc9cb1a8`. Spot check 3 lessons
by listening (list which ones in your report) — but flag clearly in your
report that a full-catalog listen is still an owner step.

**Step 4 — re-run `node scripts/transcode-audio.mjs`** so `.m4a` files and
`manifest.json` regenerate from the new masters, exactly like Wave 8's
audio task did.

**DONE MEANS:** `md5sum 07-app/audio/l*-voice/*ex*_intro.m4a | awk '{print
$1}' | sort | uniq -c` shows no count above 1. `npm run test:all` still
green (these clips aren't asserted on by name in tests today, so this
should be a no-op check, not a new failure).

### 1C — Small confirmed bugs

**OWNS:** `server/src/guardrail.js`, `server/test/guardrail.test.js`
(corrected 2026-09-10 — the plan originally named a `07-app/core/` path
that doesn't exist; the real guardrail is server-side, tested via `cd
server && npm test`), `docs/plans/LOG.md` (new).

Two unrelated small fixes, bundled because both are quick:

1. **Guardrail flake — RESOLVED (2026-09-10).** Rejected one legitimate
   first question right after a lesson opens (`invented_token:E`), passed
   identical questions immediately after (see `HANDOFF-NEXT.md`). Root
   cause: `buildAllowedChordSet()` only licensed a chord's bare root letter
   (`Em` → also allow `E`) when the chord came from the lesson's own
   `lessonChords` data; the mastery-sourced and student-question-echo paths
   only added the exact matched token. A chord's very first mention from
   either of those other two sources got rejected. Fixed via a shared
   `addChordAndRoot()` helper used consistently across all three sources
   (`server/src/guardrail.js`); 3 new regression tests added.
2. **Start `docs/plans/LOG.md`**, an append-only dated-bullet log (one line
   per session: date, what shipped, one-sentence why). This replaces the
   habit of new root-level `HANDOFF-*.md`/`WHAT-CHANGED-*.md`/
   `FIXES-APPLIED-*.md` files — 12 such files exist at root again as of this
   session. Do not delete the existing ones (history, not yours to judge);
   just start the new log and add one line to `CLAUDE.md`'s standing rules
   pointing new sessions at it instead of a fresh file.

**DONE MEANS:** `guardrail.test.mjs` includes the reproduced-then-fixed
case. `docs/plans/LOG.md` exists with a first entry recording this plan's
kickoff.

---

## Wave 2 — Wire in the three simple orphaned modules (dispatch together, disjoint OWNS)

All three of these are pure on-device logic already — no new
infrastructure, this is UI wiring only. Each gets its own new view module,
mirroring the existing `listenView.js`/`worldView.js` pattern, to avoid
three agents fighting over `lesson-runner.js` or `index.html` in the same
wave.

### 2A — Practice remix

**OWNS:** `07-app/core/practiceRemixView.js` (new), `07-app/core/practiceRemix.test.mjs` (extend if needed).

Build the view module that calls `practiceRemix.js`'s `remixPlan(plan,
engagement)` using real data from `practiceFluencyBridge.js`/
`practiceStore.js` (the weak-pair + rate-per-min data already flows into
the practice screen per T1.6). Render the three framings (Tempo challenge /
Play-along groove / Calm slow) as a chooser the student sees before a drill
starts, with the engagement-selected one pre-highlighted. Do not touch
`drillRunner.js` or `index.html` yet — export a `mountPracticeRemix(container,
practiceStore)` function; Wave 4 wires the mount call in once all three
Wave 2 view modules exist, avoiding an index.html collision this wave.

### 2B — Stylistic explorer

**OWNS:** `07-app/core/styleExplorerView.js` (new).

Build the view module that calls `stylisticExplorer.js`'s
`exploreStyle(progression)` for whatever chord/progression the current
lesson step is teaching, rendering the folk/blues/punk/ballad cards (strum
arrows + rhythm-feel text) as a "try it a different way" panel. Source the
progression from the lesson's own `chords` block, never invented. Export
`mountStyleExplorer(container, lessonModel)`; no `index.html`/
`lesson-runner.js` edits yet (Wave 4).

### 2C — Celebration moments

**OWNS:** `07-app/core/celebrationView.js` (new).

Build the view module that calls `celebration.js`'s `buildCelebration(numbers)`
using real stored numbers already available from `practiceProgress.js` /
`weeklyPlan.js` (streak days, chords cleaned, days practiced — check
`weeklyPlan.js` for what's already computed rather than recomputing).
Render as a card usable from the weekly-plan surface. Export
`mountCelebration(container, numbers)`; no `index.html` edits yet (Wave 4).

**DONE MEANS (all of 2A/2B/2C):** each view module has its own
`*.test.mjs` covering the mount function against fixture data (no DOM
framework needed — same style as existing `*.test.mjs` files). `npm run
test:all` still green.

---

## Wave 3 — Jam session: the real generative build

Single-threaded, not parallel — this wave depends on an owner action
(RunPod account) between two of its steps.

### 3A — Unfreeze + server-side generation route (fal.ai first)

**OWNS:** `CLAUDE.md` (frozen-scope list only), `docs/plans/README.md`
(frozen-scope list only), `server/src/musicGen.js` (new),
`server/src/router.js`, `server/src/config.js`, `server/README.md`.

First, edit the two frozen-scope lists: remove "jam session" from both,
add a one-line note mirroring the Emerald Hollow unfreeze precedent
("Unfrozen 2026-09-10 (owner) — jam session's generative half only; the
rest of the frozen list is unchanged").

**Step 1 — check fal.ai's catalog first, before RunPod.** Query fal.ai's
model listing (or its docs) for a hosted ACE-Step, YuE, or equivalent
commercial-clean (Apache-2.0 or comparably licensed — check the license
per AMENDMENT-18 §4's bound stack, don't assume) music/audio-generation
model, the same way `fal_stage1.py`/`fal_stage2.py` were verified for
FLUX/Wan in `docs/archive/2026-09-pre-tier0/FAL-AI-WORLD1-PLAN.md`. The
repo's `.env` already has a live, tested `FAL_KEY` from that work — reuse
it, don't request a new one. If fal.ai has a usable model: build
`server/src/musicGen.js` against it directly (sync or async queue per
fal's contract for that model, mirroring the queue-poll pattern
`fal_stage2.py` used for Wan video), and this wave needs no further owner
action — the key already works. If fal.ai genuinely has nothing suitable,
fall back to RunPod: reuse `RUNPOD_API_KEY` from `.env`, but do **not**
reuse the existing pod/volume (`RUNPOD_POD_ID`/`xgcitppkl4lcm9`) as-is —
it's a FLUX/Wan volume region-locked to EU-RO-1, the exact region that had
zero GPU capacity during the World 1 build
(`WORLDFACTORY-DIAGNOSIS-2026-08-30.md`). A music-gen pod needs its own
volume, ideally in a region checked for capacity first, and must reuse the
dynamic-port-resolution fix already written in
`scripts/world-factory/pod_run.py`/`pod_shell.py` (never hardcode the
Jupyter proxy port — that was root cause #1 of the original failure).
Record which path was taken and why in the report — don't silently default
to RunPod without showing fal.ai was actually checked.

`musicGen.js` takes the `emitFacts()`-shaped payload (`chordsMatched`,
`chordsMissed`, `accuracy`) and returns `{ audioUrl }`. Fail with a clear
typed error (not a silent stub) if the relevant env vars are unset.
Document the working setup in `server/README.md`'s new "Jam session
generation" section (model used, env vars, rough cost per generation,
verified test call and its output).

**DONE MEANS:** a live test call against the real chosen backend returns
real audio (paste the request/response proof, same discipline as
`fal_stage1.py`'s A2 connectivity test). If a config var genuinely isn't
set, the route fails clearly rather than faking a response. A mocked-client
test suite (same pattern as `modelClient.test.mjs`) covers the
request/response shape.

### 3B — Client wiring + UI (dispatch once 3A has a working, verified backend)

**OWNS:** `07-app/core/jamSession.js` (unstub `generateResponse` only —
Part A grading/facts logic is untouched and already correct),
`07-app/core/jamSessionView.js` (new), `07-app/core/jamSession.test.mjs`.

Replace `generateResponse`'s intentional `GEN_BLOCKED` throw with a real
call to the new server route (mirror `coachSurface.js`'s envelope/fetch
pattern — same error-handling shape, same "never invents, fails safe"
posture). Build `jamSessionView.js`: student plays a phrase (reuse the
existing on-device listener from `listenView.js`'s tuner/chord-check
plumbing, don't build a second mic pipeline), `gradeStudentPhrase()` scores
it, `emitFacts()` builds the payload, the server generates and returns
audio, the view plays it back. Export `mountJamSession(container,
lessonModel)`; no `index.html` edit yet (Wave 4).

**DONE MEANS:** a live round-trip against the real RunPod endpoint produces
playable audio (paste the command/output proving it, same discipline as
`npm run test:live`). Update `jamSession.js`'s header comment — it
currently says "BLOCKED" at the top of the file; that's now false and
must be corrected, not left stale.

---

## Wave 4 — Hub wiring + full verification (single agent, sequential, touches shared files last)

**OWNS:** `07-app/index.html`, `07-app/core/lesson-runner.js`,
`07-app/core/drillRunner.js`, `07-app/service-worker.js` (cache-version
bump only, following the existing `CACHE` version-bump convention from
Wave 8).

This is the one wave allowed to touch the shared hub files, precisely
because it's last and single-threaded — no collision risk. Wire in all
four Wave 2/3 view modules' `mount*()` functions at their natural surface
points (practice remix → practice screen, stylistic explorer → lesson
view, celebration → weekly-plan card, jam session → lesson view or its own
entry point — use judgement matching how `listenView`/`worldView` are
currently surfaced, and say in your report exactly where each landed and
why). Bump the service-worker `CACHE` version since new core files are
being added (same bug Wave 8 caught once already — don't repeat it).

**Then run full verification, both viewport sizes:**
- `cd server && npm test`, `npm run test:app-smoke`, `npm run
  test:playwright`, every `07-app/core/*.test.mjs` — all green, paste
  counts.
- Manual click-through in a real browser at **two widths**: a phone
  viewport and a real desktop-width window (≥1280px) — this plan's
  decision #2. For each: open a lesson, see the chord diagram, ask Sage a
  question and get a real (not template) answer, reach the practice screen
  and see the remix framing chooser, see a stylistic-explorer panel, see a
  celebration card with real numbers, and reach jam session and complete
  one round-trip. Screenshot both widths.
- Confirm the deployed app (once Render's URL is live per Wave 1) shows no
  "coach URL unset" banner (the one Wave 8 added specifically to catch
  this).

**DONE MEANS:** every item in the manual click-through above is true on
both viewport sizes, pasted as evidence, not asserted from reading the
diff.

---

## After this plan

Update `docs/plans/STATUS.md` with a new "Tier 1B" section (same table
format as the other tiers) summarizing what shipped, and append the
session to `docs/plans/LOG.md`. Do not create a new handoff/summary
document for this — that's exactly the habit Wave 1C's LOG.md was meant to
end.

---

## Wave 5 — Sage speaks (added 2026-09-10, after Waves 1-4 shipped)

**Why:** Waves 1-4 fixed the app's *pre-recorded* lesson narration, but the
owner asked a sharper question afterward: when a student asks Sage a real
question, does the answer come back as a spoken voice, or just text? It's
text only today — `chatEngine.js`'s `askCoach()` returns prose that lands in
the DOM via `textContent` (confirmed by reading `lesson-runner.js`), never
synthesized. This wave closes that gap.

**Investigated and verified live before writing this section** (same
discipline as Wave 3A's fal.ai research, not assumed): fal.ai hosts Kokoro
TTS directly (`fal-ai/kokoro`), same account/`FAL_KEY` already in `.env`.
Live test: submitted a real coaching-style line, completed in ~2s, returned
real HEAD-confirmed `audio/wav`. It offers voice `af_heart` — the exact
voice already used for the 61 lesson clips fixed in Wave 1B, so Sage's
scripted lines and live answers can sound like the same person. Pricing:
$0.02/1000 characters (~1 cent per typical coaching answer). Latency: ~2s
added after the existing ~2-4s Haiku response, comfortably inside the
existing `MODEL_TIMEOUT_QUESTION_MS` (12s) — no timeout bump needed, unlike
jam session's.

**Decisions locked (owner grilled 2026-09-10):**
1. **Tap-to-play, not autoplay.** A speaker/play control appears next to
   the text answer; most mobile browsers block autoplay without a direct
   gesture anyway, so this is also the more reliable choice, not just the
   safer one.
2. **Both surfaces at once** — the lesson chat (`lesson-runner.js`'s
   `askCoachAbout`) and the practice-screen coach (`drillRunner.js`'s
   `askCoachAbout`), not just one first.

### 5A — Server-side voice route

**OWNS:** `server/src/voiceGen.js` (new), `server/src/voiceGen.test.mjs`
(new), `server/src/router.js`, `server/src/config.js`, `server/README.md`.

Build `server/src/voiceGen.js` mirroring `musicGen.js`'s shape closely (same
fal.ai async queue submit/poll/fetch pattern, same typed-error posture) but
for `fal-ai/kokoro`: input is prose text (+ optional voice override,
defaulting to `af_heart`), output is `{ audioUrl }`. New route — extend the
existing `/coach` response to optionally include an `audioUrl` alongside
`prose` (add a `speak: true` flag the client can set on the request, so text
still comes back fast even when the client doesn't want audio yet — e.g. a
first render before the student taps play), or add a separate
`POST /coach/speak` endpoint taking already-generated prose and returning
just `{ audioUrl }` (simpler, decouples voice failure from the text
response entirely — prefer this shape unless you find a strong reason not
to, and explain your choice in the report). Mocked test suite following
`musicGen.test.mjs`'s pattern exactly (queue polling, error paths, no real
network calls in tests). Document the new route, voice choice, pricing, and
a live test transcript in `server/README.md`.

**DONE MEANS:** a live test call against the real route returns real,
HEAD-confirmable `audio/wav`. Full server test baseline green (102 + new
voiceGen tests).

### 5B — Client wiring, both surfaces (dispatch after 5A is verified)

**OWNS:** `07-app/core/coachSurface.js`, `07-app/core/lesson-runner.js`,
`07-app/core/drillRunner.js`, `07-app/index.html` (styling for the
play-button control only).

Add a tap-to-play control next to every rendered coach answer, on both the
lesson chat and the practice screen. On tap: call the new voice route
(passing the already-shown prose text — don't regenerate the text answer,
only synthesize speech for what's already on screen), show a loading state,
then play the returned audio via a plain `<audio>` element. Handle failure
honestly (a "couldn't load audio" message, never a silent no-op or fake
success) — voice is additive, a failure here must never hide or break the
already-working text answer underneath it.

**DONE MEANS:** real live round trip on both surfaces (lesson chat and
practice screen), tap → real audio plays, in the exact `af_heart` voice
used for the app's other narration. Full app-side baseline green
(`test:app-smoke`, `test:playwright`, all `07-app/core/*.test.mjs`).
Manual click-through on both viewport widths (mobile + desktop), same
discipline as Wave 4.

Both 5A and 5B get an independent second-agent verification pass before
committing, same as every task in Waves 1-4.
