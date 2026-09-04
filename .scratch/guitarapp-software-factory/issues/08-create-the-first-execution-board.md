Type: task
Status: resolved
Blocked by: 05-install-task-template-status-board-and-closeout, 06-sequence-world-1-implementation, 07-cut-the-v1-line-for-student-memory-and-duet

## Question

How should the first implementation wave be broken into branch-safe execution tasks so Hermes can start building without file collisions or scope drift?

## Answer

Created `execution-board-wave1.md` with the first branch-safe build wave.

The board splits the work into five tasks:
- W1-E1 world lesson runner
- W1-E2 lessons 1-5 script pack
- W1-E3 Sage voice/copy wiring
- W1-E4 first porch performance + basic Path B loop/wait
- W1-E5 proof pack + phone verification

The dependencies are explicit so work can move without file collisions or scope drift.
