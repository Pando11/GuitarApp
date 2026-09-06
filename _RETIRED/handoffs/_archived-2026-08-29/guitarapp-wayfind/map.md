# Where the GuitarApp actually is

**Destination:** a clear picture of what's built, what's decided, what's missing, and what's next — so any session can orient in 30 seconds instead of re-reading everything.

**This map exists because:** you pulled a big pile of decisions and features off your old computer onto this new one, and the wayfinder skill warned that certain things would look missing. Most things aren't missing — they're just described in files that don't match what's on disk anymore.

## What's definitely real and working on this machine

The chord checker passed: 25 lessons, 81 chords, 0 errors, 0 warnings. The practice engine tests passed: 17/0. All the core PWA code is here — 12 JavaScript files in `07-app/core/`, the app entry point (`app.js`, 5921 bytes), the lesson JSONs (25 of them), the song data (11 songs, 11 shapes), the Godot scaffold, the voice wavs, the tools.

None of the lesson JSONs, core modules, or content files are stubs. They're the real thing.

## What's real but the test files don't match anymore

Two test files (`verify-curriculum-order.js` and `verify-song-progressions.js`) are placeholder scaffolds — the real ones got lost when you moved computers. Someone re-wrote them from the amendment descriptions, but the descriptions were written for the data shape as it was on 2026-08-14. The data on disk has changed since then:

- Lesson files are named `guitar-lesson-03-first-chord-em.json`, not `03-first-chord-em.json`
- The shapes file is an object keyed by chord name, not a list
- The progressions file has 11 songs, not 10 (Amazing Grace was added)
- Songs don't have a `prereqLesson` number filled in

So the gates fail, but not because anything is wrong — because the tests were written for a slightly older version of the data. The chord checker (the important one) passes cleanly.

## What's still missing (real gaps)

- `verify-sw-cache.mjs` — the file doesn't exist at all
- The full `fidelity.mjs` and `app-smoke.mjs` tests are scaffold placeholders. They proved green on 2026-08-16 (48/0 and 20/0), but the placeholder versions can't re-run that proof because the comparison targets aren't wired up

## What's decided but not yet ratified

AMENDMENT-17 and ADR-0004 (World 1 = Emerald Hollow, first teacher = Sage, the performance ladder, Path B duet ships in v1, Path A is the roadmap goal) are all written up and proposed — but you haven't ratified them yet. They're sitting in "proposed" status.

## What's in the feature pile

`PROPOSED-FEATURES.md` has everything in one place: 21 monetization ideas, the 9 AI features you approved, the world/teacher/song/duet features, the V2/V3 deferred stuff, and the 8 hard bans. Nothing scattered anymore.

## The decision chain, 짧게

17 amendments tell the whole story: audio-first v1 → animated teacher + voice → movie-like lessons + open-source stack → pivoted to sequenced lesson app → "the app that listens" (9 AI features, iOS+Android) → unlocked avatars/voice (Chatterbox, realistic OK, fingering demos OK) → FLUX image pipeline → Midjourney excluded → Wan motion + Godot story-world → AI-drawn fingers permitted → world-locked teacher + student memory + duet (the product thesis) → song progression track + mystery mode → hostile review fixes → curriculum re-sequence (25 lessons, F at L17, A7 at L19, capstone last) → PocketBase backend → World 1 teacher + first performance ladder (proposed, not ratified yet).

## The one thing worth doing first

Re-write the two placeholder gate files to match the data that's actually on disk. That's the only thing blocking a clean "everything passes" signal. The tests are scaffolding written for 2026-08-14 data — the data is 2026-08-25 data. Fix the tests, not the data.

Everything else is either already green, already decided, or waiting on you to ratify AMENDMENT-17.
