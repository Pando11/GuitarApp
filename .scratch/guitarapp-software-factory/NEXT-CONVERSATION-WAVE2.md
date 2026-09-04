# Next conversation — Wave 2 execution handoff

Date: 2026-09-02

## Purpose

Wave 1 is complete (engineering + offline proof). This file is the execution handoff for **Wave 2**, so the next session can start building immediately without re-planning.

---

## Wave 1 state (locked and done)

Source:
- `.scratch/guitarapp-software-factory/WAVE1-CLOSEOUT.md`
- `.scratch/guitarapp-software-factory/proof-wave1/*`

Completed:
- W1-E1 reusable lesson runner (`07-app/core/lesson-runner.js`)
- W1-E2 lessons 1–5 runner alignment
- W1-E3 Sage lesson-flow wiring (`07-app/core/wave1-flow.js`)
- W1-E4 first porch performance + Path B loop/wait + local save
- W1-E5 offline proof bundle (GREEN)

Known limitation carried forward:
- Visual browser screenshot proof needs desktop click for Chrome remote-debug permission.

---

## Wave 2 goals (complete now)

1. **Close Wave 1 visual proof gap** (desktop/phone walkthrough capture).
2. **Harden the real gates** so Wave 2 has trustworthy pass/fail signals.
3. **Finalize Sage production voice decision** for World 1.
4. **Cut and wire Performance Level 2 target lesson ID** (inside locked L10–L12 range).
5. **Start always-on cross-device student memory sync implementation** (encrypted sync path) without breaking Wave 1 flow.

---

## Read-first order

1. `AGENTS.md`
2. `01-START-HERE/README.md`
3. `02-spec/guitar-app-spec-AMENDMENT-17.md`
4. `docs/adr/0004-the-teacher-world-1-emerald-hollow.md`
5. `.scratch/guitarapp-software-factory/WAVE1-CLOSEOUT.md`
6. `.scratch/guitarapp-software-factory/proof-wave1/wave1_full_verify.txt`

---

## Wave 2 execution board

### W2-E1 — Visual proof completion (carryover closeout)
**Goal:** Produce real click-through evidence for the shipped Wave 1 flow.

**Do:**
- Open `07-app/index.html?dogfood=1`
- Capture lesson-card state (1–5 unlocked, 6+ locked)
- Capture Lesson 1 flow with Sage panel
- Capture Lesson 5 flow with porch-performance controls and status line
- Capture reopen/save persistence evidence for `guitarapp.wave1.pathb`

**Proof required:**
- Screenshots + command log + short walkthrough notes

**Blocker class:**
- Desktop interaction required

---

### W2-E2 — Gate hardening
**Goal:** Remove fake/weak gate risk and make CI-like trust explicit.

**Do:**
- Repair `07-app/test/app-smoke.mjs` (manifest/catalog assumptions currently stale)
- Replace/restore placeholder `07-app/test/fidelity.mjs` with real assertions or mark it explicitly as non-gate until restored
- Keep chord + ordering + song gates green

**Proof required:**
- Real pass output from each gate
- Explicit gate-trust matrix doc under `.scratch/guitarapp-software-factory/proof-wave2/`

---

### W2-E3 — Sage production voice lock
**Goal:** Select and lock Sage’s production voice path for World 1.

**Do:**
- Verify current voice wiring surfaces (`app.js`, `core/teacher.js`, `core/sageCoach.js`, content teacher manifests)
- Choose/lock one shipping voice profile (commercial-clean per AGENTS rules)
- Record exact voice choice + where configured

**Proof required:**
- Config diff + one sample invocation path + legal-floor check note

---

### W2-E4 — Performance Level 2 lesson pin + hook
**Goal:** Lock the second performance milestone at a single lesson ID in the approved range and wire the trigger.

**Do:**
- Pick one lesson in L10–L12 range
- Add/adjust trigger metadata and flow hook
- Ensure no drift against Wave 1 first-porch behavior

**Proof required:**
- Selected lesson ID documented + trigger evidence + no-regression run

---

### W2-E5 — Cross-device memory sync start (non-blocking to Wave 1)
**Goal:** Begin implementation of always-on encrypted cross-device memory sync path.

**Do:**
- Use existing PocketBase sync surfaces (`core/pocketbaseSync.js` etc.)
- Keep data encrypted client-side; no plaintext upload
- Preserve local-first behavior and Wave 1 stability

**Proof required:**
- Deterministic unit/integration test output
- Read-back proof that synced encrypted payload round-trips correctly

---

## Files to keep close

### Wave 1 implementation
- `07-app/core/lesson-runner.js`
- `07-app/core/wave1-flow.js`
- `07-app/index.html`
- `07-app/content/lessons/guitar-lesson-01-*.json` through `05-*.json`

### Gates and proof
- `.scratch/guitarapp-software-factory/wave1_full_verify.mjs`
- `.scratch/guitarapp-software-factory/proof-wave1/*`
- `06-prototypes/step0/run-chord-check.js`
- `tools/verify-curriculum-order.js`
- `tools/verify-song-progressions.js`
- `07-app/test/app-smoke.mjs`
- `07-app/test/fidelity.mjs`

### Voice + memory
- `07-app/core/teacher.js`
- `07-app/core/sageCoach.js`
- `07-app/core/pocketbaseSync.js`
- `07-app/core/storyMemory.js`
- `docs/adr/` (0001–0004)

---

## Constraints that must not drift

- World 1 remains **Emerald Hollow**.
- Teacher remains **Sage**.
- Path B ships first; Path A stays visible but deferred.
- Wave 1 behavior (lessons 1–5 + first porch performance) must not regress.
- Legal floor remains free + commercial-clean only.
- Chord correctness remains arithmetic-gated (0 errors / 0 warnings).
- Student-facing “done” requires:
  1) gate output,
  2) visible walkthrough proof,
  3) reopen/save proof.

---

## Stop-and-ask boundaries

Stop only for:
- money spend,
- legal risk,
- real-device human testing,
- major student-facing design fork.

---

## Resume cue

**To resume Wave 2 now:**
1. Run Wave 1 verify script and gates to confirm clean baseline.
2. Complete W2-E1 visual proof bundle (desktop click-through capture).
3. Execute W2-E2 gate hardening.
4. Lock W2-E3 Sage voice.
5. Wire W2-E4 Performance Level 2 trigger.
6. Start W2-E5 encrypted cross-device memory sync path with tests.
