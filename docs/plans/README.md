# GuitarApp Execution Plans — Master Index

**Created:** 2026-09-05
**Source of findings:** [`../../REDLINE-2026-09-05.md`](../../REDLINE-2026-09-05.md)
**Intended executor:** Claude Sonnet, running as the lead agent in Claude Code,
spawning subagents per the orchestration contract below.

If you are an agent starting a fresh conversation in this repo: **read this file
first, then read the tier file for the lowest tier that is not marked SHIPPED in
`STATUS.md`.** Do not start a tier whose predecessor is unfinished.

| Tier | File | Goal | Ships when |
|------|------|------|-----------|
| 0 | [`TIER-0-ship-it.md`](TIER-0-ship-it.md) | Friends can use it on their own devices, and you can see what they did | A friend completes Lesson 3 on their own phone and the event shows up in your log |
| 1 | [`TIER-1-make-ai-real.md`](TIER-1-make-ai-real.md) | The "AI-individualized" claim becomes true | Two different learner profiles get demonstrably different lesson paths and different coaching prose |
| 2 | [`TIER-2-business.md`](TIER-2-business.md) | Someone who is not you pays money and it recurs | First non-friend subscriber renews in month 2 |

Progress is tracked in [`STATUS.md`](STATUS.md). Update it at the end of every
working session — it is the only file the next conversation is guaranteed to read.

---

## Orchestration contract (read before spawning anything)

### The rule that matters most

**Two agents must never hold write access to the same file in the same wave.**
Every task below declares `OWNS:` — the exact files that task may write. If two
tasks in a wave share an owned file, they are not in the same wave. When you find
an unlisted collision mid-flight, stop the later agent, finish the earlier one,
then re-dispatch.

### Wave structure

Each tier is broken into **waves**. Within a wave, dispatch all tasks as
subagents **in a single message with multiple Agent tool calls** so they run
concurrently. Wait for every agent in the wave to report before starting the next
wave. Between waves, the lead agent (you) does the integration step: run the test
suite, resolve anything the agents left inconsistent, commit.

```
Wave N: [agent A] [agent B] [agent C]   ← one message, three Agent calls
        ↓ all report
        lead: npm run test:all, fix seams, git commit
Wave N+1: ...
```

### Subagent types to use

| Task shape | `subagent_type` | Notes |
|---|---|---|
| "find where X is handled" | `Explore` | Read-only. Use it before a build wave when the lead is unsure of the seam. |
| Build/edit code | `general-purpose` | The default for every `BUILD` task below. |
| Design a seam before building | `Plan` | Only when a task says `PLAN FIRST`. |

### Prompt template for every BUILD subagent

Copy this. Do not improvise a shorter version — the constraints block is what
keeps parallel agents from fighting.

```
You are implementing task <ID> from docs/plans/<TIER FILE>.

REPO: C:\Users\Hendrickson\Desktop\GuitarApp
Read docs/plans/<TIER FILE> and find task <ID>. Implement exactly that task.

FILES YOU MAY WRITE (nothing else, no exceptions):
<paste the OWNS: list verbatim>

HARD CONSTRAINTS:
- Do NOT edit any file outside the OWNS list. If the task appears to require
  it, stop and report the needed change instead of making it.
- Do NOT run `git commit`, `git push`, `git checkout`, or `git reset`. The lead
  agent commits.
- Do NOT install npm packages unless the task explicitly names them.
- Do NOT create new markdown status/handoff/summary documents. This repo has a
  documented over-documentation problem. Report your results in your final
  message only.
- Do NOT delete or rename existing files unless the task says to.
- Preserve the existing code style: the app uses plain ES modules and classic
  scripts, no framework, no build step, no TypeScript.

DONE MEANS: every line of the task's Acceptance section is true, verified by you
running the stated command. Paste the command output in your report.

REPORT: what you changed (file:line), the verification output, and anything you
found that the task got wrong.
```

### Non-negotiables the whole team inherits

Carried forward from the project's existing rules — do not silently break these:

1. **No camera, no hand tracking.** (Rule 2)
2. **License blocklist stands.** Do not add copyrighted song content. (Rule 9)
3. **The teacher cites stored numbers; it never invents a musical diagnosis.**
   (Rule 5) — Tier 1 makes the prose generated, not the facts.
4. **Audio is never uploaded.** The listening engine stays on-device. Tier 1's
   model call sends *derived numbers and text*, never microphone data.
5. **No API key ever ships to the client.** Every model call goes through a
   server you control.

### What is explicitly frozen

Do not build, extend, or refactor these until Tier 2 has shipped, no matter how
tempting the adjacency: Godot world shell, Emerald Hollow art production,
Mystery Mode, song-from-hum, voice commands, jam session, band engine, style
packs (blues/country), teachers T2 and T3, Path A live duet, encrypted
cross-device sync. If a task seems to need one of them, it doesn't — report it.
