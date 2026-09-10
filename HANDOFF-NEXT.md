# Handoff — chord diagrams wired, four owner decisions still open

**Written 2026-09-10. Repo: `C:\Users\Hendrickson\Desktop\GuitarApp`, branch
`main`.**

Read this file first, then `docs/plans/STATUS.md` (the "Wave 9" section near
the bottom is the most recent work). Do not re-derive state from commit
history.

## What changed since the last handoff

The top-priority finding from the last beginner playtest — no chord diagram
ever rendered anywhere in the app — is fixed. `07-app/core/lesson-runner.js`
now wires `07-app/core/renderer.js`'s `chordSVG()` into the lesson view: a
gallery of every chord the lesson teaches, plus an inline diagram next to any
step whose instructions are about a specific chord. Verified in a real
browser (Lesson 3, Em) and against the full test baseline. Details, including
why it was wired via dynamic `import()` rather than a static one, are in
`docs/plans/STATUS.md`'s Wave 9 section — read that before touching
`lesson-runner.js`'s chord-diagram code again.

Test baseline, all currently green. Any regression here is a stop-the-line:

| Suite | Command | Expected |
|---|---|---|
| Coach server | `cd server && npm test` | 73 pass, 0 fail |
| App smoke | `npm run test:app-smoke` | 28 pass |
| End to end | `npm run test:playwright` | 35 pass |
| Core units | `node 07-app/core/<name>.test.mjs` | each 0 failed |

Sage runs on Haiku 4.5 (`claude-haiku-4-5-20251001`), owner's decision. Do
not change the model. Prompt caching never hits on it — known, accepted,
don't spend a session on it.

## Open owner decisions

1. **Coach service host.** Not chosen yet. **Railway is ruled out** — the
   owner has used it before and found it unreliable. Remaining candidates
   (`server/README.md` has the original three-way comparison, now missing
   Railway): Google Cloud Run with `min-instances=1` (~$5-10/mo, eliminates
   the cold-start trap entirely, more setup than Railway — Dockerfile +
   gcloud config), Render's paid tier (~$7/mo, its free tier has the
   cold-start trap that can silently serve canned text — paid tier removes
   it), or Fly.io (~$2-5/mo, cheapest, more CLI setup/maintenance). Once
   picked, set the `COACH_URL` repo variable in GitHub Actions settings so
   the deploy workflow can wire it in.
2. **Possible placeholder audio.** Every lesson's "intro" clip across
   lessons 1-5 (10 files) measures exactly 5.000s via ffprobe regardless of
   how long its paragraph is, while adjacent clips in the same lessons scale
   normally with text length. Not confirmed broken — the owner is listening
   and will report back. Try `07-app/audio/l03-voice/l03-01-ex1_intro.m4a`
   first.

**Resolved since the last handoff (2026-09-10):**
- `github/master` stale remote branch — owner said delete; deleted via
  `git push github --delete master` and pruned locally. No longer exists.
- 8090 vs 8091 PocketBase port in `07-app/app.js:466` — investigated (see
  `docs/plans/STATUS.md` "Open owner decisions" item 8 for the full trail);
  concluded it was a leftover dev-proof artifact, not intent. Fixed to 8090
  to match `pocketbaseSync.js`'s own default and the quick-start docs.

## Smaller bugs found, not yet fixed

- **Guardrail flake:** rejected one legitimate first question right after
  opening a lesson (`invented_token:E`), then passed identical questions
  immediately after. Fails safe to canned text, not a wrong-answer risk, but
  worth a look at whether it's a request-ordering race.
- **Local dev trap:** the documented `cd server && npm start` alone silently
  serves template prose, because `server/src/index.js` reads `process.env`
  directly with no dotenv — it needs `node --env-file=.env src/index.js`
  instead. Same "looks like success, isn't" failure class as the deploy
  banner fix, except this one bites on the exact command the README
  recommends. Fix the command, add dotenv, or both.

## Three things that cost time in a past parallel-agent run — don't
## rediscover them

1. **Six agents editing the same status file collides badly.** Never let a
   subagent touch `docs/plans/STATUS.md`. The lead updates it once at the
   end from all reports.
2. **A stale coach server on a held port silently serves old code.** Only
   one agent should ever start the coach server on 8787 in a given wave.
3. **`cd server && npm run test:live` makes real paid API calls and is not
   parallel-safe.** Only one agent per wave should run it.

None of the four open owner decisions above are safe for a subagent to make
alone — each is either genuinely the owner's call (host, branch, audio
listen) or explicitly flagged "don't guess" (the port). If the next session's
only task is one of the smaller bugs, it's small enough for a single agent
(or doing it directly) rather than a parallel wave.
