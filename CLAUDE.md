# CLAUDE.md — read this first

## If you are starting a new conversation in this repo

**The active work plan is `docs/plans/`. Start there, in this order:**

1. `docs/plans/STATUS.md` — what is done, what is next, what decisions are open.
2. `docs/plans/README.md` — the orchestration contract (wave structure, subagent
   prompt template, file-ownership rule). Read it before spawning any subagent.
3. The tier file for the lowest tier not marked SHIPPED in STATUS.md:
   - `docs/plans/TIER-0-ship-it.md` — get it in front of five humans
   - `docs/plans/TIER-1-make-ai-real.md` — make the AI/personalization claim true
   - `docs/plans/TIER-2-business.md` — accounts, payments, acquisition

Background on why the plan is shaped this way: `REDLINE-2026-09-05.md`.

## Standing rules for anyone working here

- **Do not create new status, handoff, phase, or summary markdown documents.**
  This project has a documented over-documentation problem: ~45 such files
  against 11 code commits. Record progress by editing `docs/plans/STATUS.md`.
- **Add an entry to `docs/plans/LOG.md`** at the end of a session instead of creating a new handoff/status/summary file — see that file's own header for the format.
- **File ownership is enforced.** When running subagents in parallel, no two may
  write the same file in the same wave. See the orchestration contract.
- **Frozen scope** until Tier 2 ships: Mystery Mode, song-from-hum, voice
  commands, band engine, style packs, teachers T2/T3, Path A live
  duet, encrypted cross-device sync.
- **Emerald Hollow is NOT frozen** (unfrozen 2026-09-06 by the owner). The Godot
  world shell and Emerald Hollow art are active work — the world lives on `main`
  under `07-app/godot/` and the plan is `docs/plans/TIER-W-emerald-hollow.md`.
  Note that `band-engine.js` and Path A live duet are still frozen even though
  they sit adjacent to the world.
- **Jam session's generative half is NOT frozen.** Unfrozen 2026-09-10
  (owner) — jam session's generative half only; the rest of the frozen list
  is unchanged. See `docs/plans/TIER-1B-close-the-gaps.md` Wave 3.
- **Non-negotiables:** no camera or hand tracking; no copyrighted song content;
  the teacher cites stored numbers and never invents a musical diagnosis; audio
  never leaves the device; no API key ever ships to the client.

## Commands

```bash
npm run test:app-smoke   # 28 assertions, fast
npm run test:playwright  # browser tests
npm run test:all         # both
```

## Layout

- `07-app/` — the shipping app (no framework, no build step, plain ES modules
  plus classic scripts)
- `07-app/core/` — engines: listening, tuner, lesson runner, chat, practice
- `07-app/content/lessons/` — the 25 lesson JSONs (`chords` blocks carry
  `qa_status` and are load-bearing — do not edit them casually)
- `05-content/` — authoring source for lessons and the voice guide
- `docs/adr/` — decisions that are hard to reverse
- `docs/plans/` — **the current work plan**
