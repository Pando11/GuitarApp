# Practice Engine — 30/60 sensor + weak-pair review (the moat)

Verified, dependency-free ES modules. Pure arithmetic — no audio hardware, no network,
no React. The real mic boundary (CREPE → constrained match) is simulated deterministically
so the counting logic is fully testable.

## What it does

```
1-min-changes (30/60)  ──measures per-pair fluency──►  on-device memory
        ▲                                                      │
        │                                                      ▼
   weak-pair review  ◄──selects K weakest pairs──  adaptive practice session
```

- **30/60 SENSOR** (`one-minute-changes.mjs`): counts clean chord *changes* in 60s.
  ≥30/min = advance (diagnostic), ≥60/min = goal. A "change" needs two CONSECUTIVE
  CONFIDENT strums that differ — so mashing one chord = 0, and low-confidence strums
  (Rule 6: "play that again") are never counted. This makes the count the real
  JustinGuitar benchmark, not a button-mash exploit.
- **MEMORY** (`fluency-store.mjs`): on-device per-pair fluency. Spacing-effect decay
  (tau=3 days) surfaces stale pairs. Cold-start: every taught pair begins at fluency 0
  so the first review always has material. Pair keys are normalized (`sort(A,B)`) so
  `Em↔C` == `C↔Em` — one memory slot, no phantom splits.
- **WEAK-PAIR REVIEW** (`practice-loop.mjs`): picks the K=3 weakest pairs for a review
  session. This is the differentiator — adaptive review of *specific weak chord pairs*,
  which (per the curriculum doc §2.7) no competitor ships.

## Decisions locked (owner: "you decide")

1. **Diagnostic, not a wall** — a 30/min miss reports progress and feeds memory; it does
   NOT block the next linear technique lesson (a hard gate would wall the student when a
   new chord adds up to 6 new pairs at once).
2. **Measure the weakest pair** — when a lesson teaches chord X, run 1-min-changes on
   EVERY new pair (X↔prior) and record each; the weakest is what surfaces in review.
3. **K = 3** review pairs per session (tunable).

## Files

- `pair-key.mjs` — normalized chord-pair key.
- `one-minute-changes.mjs` — the 30/60 counter (contract: listener already matched per strum).
- `fluency-store.mjs` — on-device memory (decay, weak-pair selection, persistence).
- `listener-sim.mjs` — deterministic stand-in for the real constrained listener (tests only).
- `practice-loop.mjs` — wires sensor → memory → review.
- `practice-engine.test.mjs` — 17 unit + integration tests (node --test).

## Run

```
node --test 06-prototypes/practice-engine/practice-engine.test.mjs
node 06-prototypes/practice-engine/spine-check.mjs   # full-spine demo
```

## Production boundary (not yet built — this is the spec target)

`listener-sim.mjs` is replaced by: mic → CREPE-class autocorrelation (approved:
basic-pitch Apache-2.0 / CREPE MIT) → match each strum against the KNOWN pair only
(AMENDMENT-05 Rule 4) emitting `{chord, confident, t}`. Everything downstream (counting,
memory, review) is already written and tested and never touches the audio bytes — so the
"audio never uploaded" rule holds by construction.
