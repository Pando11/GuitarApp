# GuitarApp software factory map

## Destination

Set up a clear, repeatable development system for GuitarApp so Hermes can build, operate, and manage World 1 / Emerald Hollow v1 with less confusion, better proof, and cleaner handoff.

## Notes

- Read `AGENTS.md` first, then `01-START-HERE/README.md`, then the latest amendment and ADRs.
- Disk truth beats prose claims when they disagree.
- Use the Michael Shimeles pattern for discipline, not as a demand to copy his tool stack.
- V1 must keep Path A visible on the roadmap without letting it block Path B shipping.
- Legal floor stays locked: free + commercial-clean only.
- This map is for planning and sequencing. It is not permission to start broad implementation work all at once.

## Decisions so far

- [Repo truth comes before repo lore](issues/01-repo-truth-pass.md): before new development, verify live files, real gates, and stale docs on disk instead of trusting older summaries.
- [Ratify World 1 teacher and performance ladder](issues/02-ratify-world-1-teacher-and-performance-ladder.md): World 1 stays Emerald Hollow, the teacher is Sage, Path B ships in v1, Path A stays on the roadmap, and the first two performance beats are early/mid journey milestones.
- [Lock the first shippable factory slice](issues/03-lock-the-first-shippable-factory-slice.md): the first slice is a phone-ready 5-lesson World 1 loop that ends in the first porch performance and proves saved progress on reopen.
- [Define agent roles, proof and stop rules](issues/04-define-agent-roles-proof-and-stop-rules.md): Hermes only stops for money, legal risk, real-device human testing, or a major design fork; every task gets a separate verifier pass; student-facing proof must include gates, visible walkthrough, and reopen/save proof.
- [Install task template, status board and closeout](issues/05-install-task-template-status-board-and-closeout.md): shared factory files now exist for task shape, queue status, proof rules, blocker handling, and closeout.
- [Sequence World 1 implementation](issues/06-sequence-world-1-implementation.md): build inside the pre-existing world, start with one reusable lesson runner, plug in the 5 lesson scripts, add Sage voice/lines, then the first porch performance, then phone proof.
- [Cut the v1 line for student memory and duet](issues/07-cut-the-v1-line-for-student-memory-and-duet.md): the first slice only needs local save plus reopen proof, and the duet only needs basic Path B loop/wait behavior; cross-device memory and deeper duet behavior stay for later waves.
- [Create the first execution board](issues/08-create-the-first-execution-board.md): Wave 1 is now split into five branch-safe execution tasks, from reusable world runner through phone proof.

## Frontier

No open frontier tickets in this map right now. The planning path is clear enough to begin execution from `execution-board-wave1.md`.

## Not yet specified

- Exact Chatterbox built-in voice for the World 1 teacher.
- Asset-generation budget, cadence, and proof format for the first Emerald Hollow scene pack.
- Exact lesson ID for Performance Level 2 inside the ratified ~10–12 range.

## Out of scope

- World 2 and later worlds.
- Photo-real teacher track.
- Path A live adaptive duet implementation.
- Full 100 + 100 curriculum expansion before World 1 proof exists.
