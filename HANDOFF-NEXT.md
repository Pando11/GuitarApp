# Handoff — wire up the chord diagrams

**Written 2026-09-10. Repo: `C:\Users\Hendrickson\Desktop\GuitarApp`, branch
`main`, clean at `7b4cd1e`, pushed and matching `github/main`.**

Read this file first, then `docs/plans/STATUS.md` (the "Wave 8" section
near the bottom is the most recent work). Do not re-derive state from commit
history.

## Where things stand

Wave 8 (six parallel agents, 2026-09-09/10) shipped: a loud on-screen
banner + failed CI step if a deployment ever ships with the coach URL
unset; a coach-hosting recommendation (Railway, still undecided); the
second hardcoded-localhost bug in `telemetry.js` fixed the same way the
coach URL was; offline caching for lessons 1-5 (the real gap was
`core/lesson-runner.js` never being precached, not the lesson JSON); ~1400
lines of dead code deleted (`app-refactored.js`, `EXAMPLES-COPY-PASTE.js`);
and a full manual beginner playtest of lessons 1-5. The local branch was
also renamed `master` → `main` to match GitHub's actual default branch and
the deploy workflow's `branches: [main]` trigger — everything agrees now.

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

## The one thing that matters most: no chord diagram ever renders

The beginner playtest found this, and it's the biggest single risk in the
app right now: `07-app/core/renderer.js` has a correct, unit-tested
`chordSVG()`/`CHORD_SVG_DOTS()` generator that builds a fretboard picture
straight from a lesson's own `chords` block — and it is imported **nowhere**
in `07-app/index.html` or `07-app/core/lesson-runner.js`. Lessons 3-5 teach
Em and easyC in prose only. A beginner has no picture to check a stated
fingering against, which matters more than usual here because a live model
already got a fret wrong once (see `WHAT-CHANGED-2026-09-08.md`). Wiring
`renderer.js`'s output into the lesson view is the highest-leverage next
build. The fingerings currently stated in lesson text are all correct
(hand-verified against real chord theory for Em and easyC) — this is about
adding the missing visual cross-check, not fixing wrong data.

## Open owner decisions

1. **Coach service host.** Not chosen yet. `server/README.md` has the
   comparison: Railway (~$5/mo, no cold-start trap) recommended over Render
   (free tier's cold start can silently exceed the coach's timeout and
   serve canned text — only safe on its paid tier) or Fly.io (more CLI
   setup). Once picked, set the `COACH_URL` repo variable in GitHub Actions
   settings so the deploy workflow can wire it in.
2. **`github/master`** — a stale remote branch (old commit `8743b1e`) left
   over from before the `main` rename. Delete it or leave it.
3. **8090 vs 8091 PocketBase port** (`07-app/app.js:466` uses 8091 for an
   admin/encrypted-sync path; everywhere else uses 8090). Traced to old
   encrypted-sync proof scripts, not a documented convention — could be a
   typo or a deliberate second instance for the frozen encrypted-sync
   feature. Unresolved; don't guess, ask or investigate further.
4. **Possible placeholder audio.** Every lesson's "intro" clip across
   lessons 1-5 (10 files) measures exactly 5.000s via ffprobe regardless of
   how long its paragraph is, while adjacent clips in the same lessons scale
   normally with text length. Not confirmed broken — needs an actual listen.
   Try `07-app/audio/l03-voice/l03-01-ex1_intro.m4a` first.

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

## Three things that cost time in the last parallel-agent run — don't
## rediscover them

1. **Six agents editing the same status file collides badly.** Never let a
   subagent touch `docs/plans/STATUS.md`. The lead updates it once at the
   end from all reports.
2. **A stale coach server on a held port silently serves old code.** Only
   one agent should ever start the coach server on 8787 in a given wave.
3. **`cd server && npm run test:live` makes real paid API calls and is not
   parallel-safe.** Only one agent per wave should run it.

If the chord-diagram work is the only task this session, it's one coherent
piece of work touching `lesson-runner.js`/`renderer.js`/`index.html` — a
single agent (or just doing it directly) is more appropriate than spawning
a parallel wave for it.
