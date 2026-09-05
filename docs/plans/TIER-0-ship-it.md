# TIER 0 — Get it in front of five humans

**Goal:** a friend opens a URL on their own phone, does Lessons 1–3 with audio,
taps "this was confusing" once, and you can see all of it in a log tomorrow
morning.

**Target:** one week. **Ships when:** the Exit Check at the bottom passes.

**Read `README.md` in this folder before dispatching anything.**

---

## Wave 0 — Repo hygiene (single agent, no parallelism)

Do this alone and first. It touches paths everything else depends on.

### T0.1 — Archive the documentation sprawl
**Type:** `general-purpose` · **OWNS:** everything at repo root that is `*.md`
except `CLAUDE.md`, `CONTEXT.md`, `AGENTS.md`, `REDLINE-2026-09-05.md`; plus `docs/archive/**`

1. `mkdir -p docs/archive/2026-09-pre-tier0`
2. `git mv` every root-level `*.md` into it **except**: `CLAUDE.md`,
   `CONTEXT.md`, `AGENTS.md`, `REDLINE-2026-09-05.md`. (There is no root
   `README.md`; do not create one.)
3. `git rm` the stale backups: `AGENTS.md.bak-20260817`, `HANDOFF.md.bak-20260817`,
   `PROPOSED-FEATURES.md.bak-20260817`, `07-app/core/lesson-runner.js.backup`.
   Also `git rm 07-app/app-refactored.js` — `app.js` already absorbed it
   (commit `607e60d`); confirm with `diff` before removing, and if they differ,
   report instead of deleting.
4. In `CONTEXT.md`, delete the three glossary entries whose cited files do not
   exist (`guitar-app-spec-STUDENT-MEMORY.md`, `guitar-app-spec-PRACTICE-DELIVERY.md`,
   `docs/adr/0003-mystery-mode.md`), or rewrite each to drop the dead citation.
   Verify with: for each `docs/` or `02-spec/` path mentioned in CONTEXT.md, the
   file exists.

**Acceptance:** `ls *.md` at root returns exactly 4 files. `npm run test:all`
still passes. No path referenced in `CONTEXT.md` is missing from disk.

---

## Wave 1 — Three independent builds, dispatch together

These three touch disjoint files. **Send all three Agent calls in one message.**

### T0.2 — Compress the audio and get WAVs out of the shipping path
**Type:** `general-purpose` · **OWNS:** `07-app/audio/**`, `.gitignore`,
`scripts/transcode-audio.mjs` (new), `package.json` (scripts block only)

The repo carries 73 MB of uncompressed WAV in `07-app/audio/l*-voice/`. That is
undeliverable over a network.

1. Write `scripts/transcode-audio.mjs` — walks `07-app/audio/l*-voice/*.wav`,
   shells out to `ffmpeg` producing `.m4a` (AAC 64 kbps mono, 22.05 kHz) beside
   each source. If `ffmpeg` is not on PATH, fail loudly with the install hint;
   do not silently skip.
2. Add `"audio:transcode": "node scripts/transcode-audio.mjs"` to package.json
   scripts. Run it.
3. Move the `.wav` masters to `07-app/audio/_masters/` and add that directory to
   `.gitignore`. `git rm --cached` the tracked WAVs. Commit only the `.m4a`.
   **Do not `git filter-branch` or rewrite history** — old blobs staying in
   history is acceptable; report the repo size if the owner wants that later.
4. Produce `07-app/audio/manifest.json`: `{ lessonId: { clipId: relativePath } }`
   built from what actually exists on disk, so T0.3 has one thing to read.

**Acceptance:** `du -sh 07-app/audio/l01-voice` under 3 MB. `git status` shows no
tracked `.wav`. `07-app/audio/manifest.json` lists every lesson that has clips,
and every path in it resolves on disk.

### T0.3 — Deploy target
**Type:** `general-purpose` · **OWNS:** `deploy/**` (new), `.github/workflows/**`
(new), `07-app/service-worker.js`, `07-app/manifest.webmanifest`

The app is currently only runnable from the local filesystem. Make it a URL.

1. Pick a static host that needs no account setup decision from the owner —
   **write the config for both Netlify (`deploy/netlify.toml`) and a GitHub
   Pages workflow**, and document in your report which one needs which one-time
   owner action. Do not create accounts or push anything.
2. Publish root is `07-app/`. Ensure every asset path in `index.html` and
   `service-worker.js` is relative (`./`) so it works under a subpath.
3. Bump the service worker cache version and confirm `verify-sw-cache.mjs`
   still passes. Add the new `.m4a` audio to the SW precache list **lazily**
   (cache on first play, not on install — do not make install download 20 MB).
4. Note in your report: the app has **no auth**, so the URL is public. That is
   fine for a five-friend test and must be flagged before Tier 2.

**Acceptance:** `node 07-app/verify-sw-cache.mjs` passes. `grep -c 'src="/' 07-app/index.html`
returns 0 (no absolute paths). Both deploy configs exist and the report names
the exact one-time step the owner must take.

### T0.4 — Onboarding: capture the learner profile
**Type:** `general-purpose` · **OWNS:** `07-app/core/learnerProfile.js` (new),
`07-app/core/learnerProfile.test.mjs` (new), `07-app/onboarding.html` (new)

Nothing in the app knows who the student is. Start collecting on day one, even
before anything consumes it.

Four questions, one screen each, skippable, stored locally:
- **age band** — `under-13` / `13-17` / `18-34` / `35-54` / `55+`
  (under-13 is a COPPA flag: record it, and note in your report that Tier 2 must
  handle parental consent before any payment or account. Do not build that now.)
- **experience** — `never-held-one` / `tried-and-quit` / `returning-player`
- **goal** — `play-a-song` / `campfire-friends` / `understand-music` / `just-curious`
- **minutes per day** — `5` / `15` / `30` / `60+`

`learnerProfile.js` exports `getProfile()`, `setProfile(partial)`,
`isComplete()`, and `PROFILE_SCHEMA`. Persist to `localStorage` under
`guitarapp.learnerProfile.v1`. Pure module — no DOM imports, so the Node test
can run it. Ship `learnerProfile.test.mjs` in the existing `node --test`-free
style used by `07-app/core/*.test.mjs` (match `sageCoach.test.mjs`'s harness).

Do **not** wire it into `index.html` — T0.7 does that. Do not branch any lesson
content on it yet — that is Tier 1.

**Acceptance:** `node 07-app/core/learnerProfile.test.mjs` passes with at least 8
assertions including a round-trip and a rejected invalid age band.

---

## Wave 2 — Two builds, dispatch together

Depends on Wave 1. `T0.5` needs `T0.2`'s manifest; `T0.6` is independent but
sequenced here to keep `app.js` uncontended.

### T0.5 — Wire lesson audio into the UI
**Type:** `general-purpose` · **OWNS:** `07-app/core/lesson-runner.js`,
`07-app/core/audioCache.js`, `07-app/core/audio-config.js`

Playwright currently reports `Audio elements present in lesson: found 0`. Twenty-
five lessons of TTS were generated and never reached the screen.

1. Read `07-app/audio/manifest.json` (from T0.2) at lesson open.
2. For each lesson step that has a clip, render a real `<audio controls preload="none">`
   element with the clip, plus a visible play button on the step. Keyboard
   reachable; `aria-label` naming the step.
3. Autoplay is **off**. A parent in a quiet house should never be ambushed.
4. Missing clip = no audio element, no console error, lesson still fully usable.

**Acceptance:** `npm run test:playwright` passes fully, including the previously
failing `Audio elements present in lesson` assertion. `npm run test:app-smoke`
still 28/28.

### T0.6 — Event logging
**Type:** `general-purpose` · **OWNS:** `07-app/core/telemetry.js` (new),
`07-app/core/telemetry.test.mjs` (new), `pocketbase-dev/**`

You are about to run a feedback round with no instrumentation. Without this the
friend test produces opinions and no data.

Events, each `{ event, ts, sessionId, anonId, lessonId?, payload? }`:
`app_open`, `onboarding_complete`, `lesson_start`, `lesson_step_complete`,
`lesson_complete`, `lesson_abandon` (fired on unload mid-lesson),
`drill_result` (`{drillId, passed, score}`), `audio_play`, `feedback_submit`.

- `anonId` is a random UUID minted once and kept in localStorage. **No email, no
  name, no IP-derived anything.** This is a privacy floor, not a nicety.
- Buffer to localStorage; flush by `navigator.sendBeacon` to a PocketBase
  collection. Offline is normal: the queue must survive reload and retry, never
  block the UI, never throw into the lesson flow.
- Add the PocketBase collection schema alongside the existing
  `07-app/core/pocketbaseSchema.json` conventions — **a separate `events`
  collection**, not mixed into the encrypted student-memory collection. Event
  data is deliberately plaintext and deliberately not personal.

**Acceptance:** `node 07-app/core/telemetry.test.mjs` passes, covering: queue
survives simulated reload, flush retries after a failed POST, and no event body
contains any key from `PROFILE_SCHEMA`'s free-text space.

---

## Wave 3 — Integration (lead agent, or one agent alone)

### T0.7 — Wire it together in the shell
**Type:** `general-purpose` · **OWNS:** `07-app/index.html`, `07-app/app.js`

Everything above is inert until this lands. Single agent — these two files are
the contention point of the whole tier.

1. First run: if `learnerProfile.isComplete()` is false, show the onboarding
   flow before the lesson grid. Skippable in one tap.
2. Call `telemetry` at each event site named in T0.6.
3. Add the **feedback button**: persistent on every lesson screen, one tap, four
   options — `confusing` / `too fast` / `too slow` / `something broke` — plus an
   optional one-line free text. Fires `feedback_submit` with the current
   `lessonId` and step index. No modal that traps the user; escape closes it.
4. Preserve the existing XSS discipline in this file — it uses DOM APIs and an
   `esc()` helper deliberately (commit `cf5f6a1`). **Do not reintroduce
   `innerHTML` with interpolated values.**

**Acceptance:** `npm run test:all` passes. Manually (or via Playwright): a fresh
profile sees onboarding, completes it, opens Lesson 1, hears audio, taps
feedback, and `localStorage` holds a queued `feedback_submit` event.

---

## Exit Check — Tier 0 is SHIPPED when all are true

- [ ] The app is reachable at a URL from a phone that has never seen this repo.
- [ ] `npm run test:all` passes green (28 smoke + 19 playwright).
- [ ] Root has 4 markdown files; no dangling path in `CONTEXT.md`.
- [ ] `07-app/audio/` under 8 MB tracked; no `.wav` in git.
- [ ] A lesson plays audio on a real phone, on cellular, in under 5 seconds.
- [ ] Onboarding captures the four fields and they land in the event log.
- [ ] The feedback button produces a row you can read tomorrow.
- [ ] **Five people who are not you have opened it.**

Then update `STATUS.md` and only then open `TIER-1-make-ai-real.md`.

---

## Notes for the lead agent

- The known-flaky seam is `index.html`'s classic-script + ES-module hybrid
  loading (`CONTEXT.md`'s "file://-mirror" concept). If a module import breaks
  when served over HTTP, that is a **good** break — the CORS workaround is no
  longer needed once there is a real origin. Simplify toward real modules rather
  than preserving the mirror, and say so in the commit.
- Resist scope creep into Tier 1 during T0.4. Collecting the profile and *using*
  the profile are deliberately separated so Tier 0 can ship this week.
