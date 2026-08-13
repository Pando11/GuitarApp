# HANDOFF — GuitarApp Practice Engine (LATEST, 2026-08-12)

**Author:** Hermes · **Read this FIRST** for any GuitarApp practice work.
**This file is authoritative and self-contained** — a fresh agent needs nothing else to pick up the work.

---

## 0. TL;DR (for a fresh agent)

We built a **practice backend** for the GuitarApp: a 30/60 chord-change sensor, on-device
per-pair memory with spaced review, a generated 1:1 practice-lesson spine, and a working UI.
**Three of seven practice gaps are DONE + VERIFIED.** Four remain. Owner wants: if we build the
remaining pieces with **parallel subagents**, a **DIFFERENT (fresh) agent must re-verify everything**
before anything is called done.

---

## 1. VERIFIED CURRENT STATE (run these to confirm — they are green as of 2026-08-12)

```
cd C:\Users\The Yoda Trader\Desktop\GuitarApp
node --test 06-prototypes/practice-engine/practice-engine.test.mjs   # 17 pass, 0 fail
node 06-prototypes/practice-engine/validate-practice-lessons.mjs      # 0 failures
python3 06-prototypes/practice-engine/verify-ui.py                   # ALL UI CHECKS PASSED
```

**Files that exist and pass:**
- `06-prototypes/practice-engine/` — engine (12 .mjs/.py/.html/.md files; see §3)
- `05-content/practice/guitar-practice-01..20-*.json` — 20 generated practice lessons
- `03-research/curriculum/CURRICULUM-AND-PRACTICE-STRUCTURE.md` — §5 = the practice curriculum

**Decisions locked (owner said "you decide"):**
1. 30/min is a **diagnostic, NOT a hard gate** — a miss feeds memory, does not block the spine.
2. Measure the **weakest pair per lesson** (1-min-changes on every new pair, surface weakest).
3. **K = 3** review pairs per session.

---

## 2. WHAT IS BUILT vs NOT BUILT

### DONE + VERIFIED
| Item | Where | Proof |
|---|---|---|
| 30/60 sensor (counts clean changes; ≥30 advance, ≥60 goal) | `one-minute-changes.mjs` | 17 tests |
| On-device per-pair fluency memory + spacing decay (τ=3d) + K-weakest | `fluency-store.mjs` | 17 tests |
| Practice loop wiring (sensor→memory→review) | `practice-loop.mjs` | integration test |
| Deterministic listener stand-in for tests | `listener-sim.mjs` | — |
| 20 generated practice lessons, cumulative-matched | `05-content/practice/` | validate: 0 fail |
| Practice UI (30/60 counter + weak-pair review) | `practice-ui.html` | Playwright: pass |
| Curriculum §5 (20 groups + 1:1 practice + SONGS separate) | `CURRICULUM-AND-PRACTICE-STRUCTURE.md` | reviewed |

### NOT BUILT (the 4 remaining pieces — see §4 for subagent briefs)
1. **Real mic listener** — CREPE → constrained target-match (AMENDMENT-05 "app that listens").
   Everything downstream is done; only this boundary is simulated (`listener-sim.mjs` stands in).
2. **The other 8 §5.2 drills** (§5.2 items 4–11) — only Chord-Perfect, Air Changes,
   One-Minute Changes are wired. Not yet interactive: Tempo-Scaled Section Loop (25–125%),
   Wait-To-Play, Anchor/Pivot, Spider warm-up, Metronome ladder, Weak-Pair Review,
   Muted/percussive strum, Count-out-loud. (Chord-Perfect/Air/One-Minute already done.)
   NOTE: the UI already DISPLAYS weak-pair review rows (proof 3) — "weak-pair-review-as-a-drill"
   here means the dedicated drill module exporting `runDrill()`, not the display which is done.
   Do NOT re-build the display; do NOT build "Chord Challenge" (not a §5.2 item).
3. **Review reminder / streak nudge** — memory knows what's weak + decays, but nothing *prompts*
   the student to review days later (retention mechanic every competitor has).
4. **Persist memory in real app storage** — `toJSON()`/`load()` exist but aren't wired to app storage.

---

## 3. ENGINE CONTRACT (for any agent touching the code)

**Exports (verified by grep):**
- `one-minute-changes.mjs`: `ADVANCE_PER_MIN=30`, `GOAL_PER_MIN=60`, `countChanges(strumEvents, pair)`, `measureOneMinute(pair, strumEvents, durationMin=1.0)`
- `fluency-store.mjs`: `createFluencyStore({ knownPairs=[], now })` → `.record(pair, ratePerMin, nowMs)`, `.selectWeakest(K=3, nowMs)`, `.snapshot(nowMs)`, `.toJSON()`, `.load(json)`
- `pair-key.mjs`: `pairKey(a,b)` (sorted → `Em::C` == `C::Em`), `parsePair(key)`
- `practice-loop.mjs`: `createPracticeLoop({ knownPairs=[], K=3, now })`
- `listener-sim.mjs`: `simulateStrumStream({ A, B, skillA, skillB, cadencePerMin, durationMin, seed })`

**Strum event shape:** `{ chord: 'Em'|'easyC'|...|null, confident: true|false, t: ms }`.
A "change" = two consecutive *confident, known* events with different chords. Mashing one
chord = 0 changes. Low-confidence strums are never counted (AGENTS.md Rule 6).

**§5.2 drill taxonomy (source of truth for piece #2) — verbatim from CURRICULUM-AND-PRACTICE-STRUCTURE.md §5.2; 11 items total:** 1. Chord-Perfect · 2. Air Changes · 3. One-Minute Changes · 4. Tempo-Scaled Section Loop (25–125%) · 5. Wait-To-Play · 6. Anchor/Pivot · 7. Spider warm-up · 8. Metronome ladder · 9. Weak-Pair Review · 10. Muted/percussive strum · 11. Count-out-loud. Of these, **3 are already wired** (Chord-Perfect, Air Changes, One-Minute Changes). **8 remain** (§5.2 items 4–11): Tempo-Scaled Section Loop, Wait-To-Play, Anchor/Pivot, Spider warm-up, Metronome ladder, Weak-Pair Review, Muted/percussive strum, Count-out-loud. NOTE: "Chord Challenge (≤4 chords)" is a *competitor* feature cited in §2 — it is NOT a §5.2 menu item; do not build it as a drill.
JustinGuitar 30/min-to-advance / 60/min-goal is the numeric benchmark (AGENTS.md Rule 8: arithmetic, not human).

**License guardrails (AGENTS.md):** audio pitch libs MUST be Apache-2.0/MIT/ISC only
(basic-pitch, librosa, CREPE, AudioKitEX). NEVER Essentia(aGPL)/aubio(GPL)/TarsosDSP(GPL)/madmom.
Voice: Chatterbox(MIT) / Kokoro(Apache-2.0) only — never XTTS-v2/F5/Fish/Piper/GPT-SoVITS (copyleft, paid app = legal exposure).

---

## 4. SUBAGENT BUILD BRIEFS (fan out in parallel; each is self-contained)

> Fan-out rule: spawn these as **leaf** subagents (they cannot delegate further here).
> They MUST add tests and run the proof commands. After ALL finish, a **separate fresh verifier**
> (§5) re-checks everything. A builder's green pass is NOT sufficient.

### BRIEF A — Real mic listener (piece #1)
**Goal:** Replace `listener-sim.mjs` with a real on-device listener that, given a known target
chord pair + tempo, emits `{chord, confident, t}` events into the existing engine contract.
**Constraints:** On-device only, audio never uploaded (AMENDMENT-05 Rule 4). Constrained matching
against the KNOWN target chord + tempo — NEVER open-ended transcription. Approved pitch lib: CREPE
(MIT) or basic-pitch (Apache-2.0). Output JSON must match the strum-event shape in §3 so
`countChanges`/`measureOneMinute` work unchanged. Confidence gating is a feature (AGENTS.md Rule 6):
below threshold emit `confident:false`, never a false red X.
**Deliver:** new `listener-real.mjs` (+ small wasm/model loader if needed), a test that feeds a
synthesized chord tone and asserts the emitted chord matches, and a README note on how the UI swaps
sim→real. Do NOT modify the engine math files. Keep `listener-sim.mjs` as the test default.

### BRIEF B — Wire the other 10 §5.2 drills (piece #2)
**Goal:** Make the §5.2 drill menu actually interactive, not just Chord-Perfect / Air / One-Minute.
**Scope:** the 8 not-yet-interactive §5.2 drills (items 4–11): Tempo-Scaled Section Loop
(speed slider 25–125%), Wait-To-Play (only counts after student starts), Anchor/Pivot (highlight
shared finger), Spider warm-up, Metronome ladder (raise BPM on clean), Muted/percussive strum
(strum-hand only), Count-out-loud, and Weak-Pair Review-as-a-drill (pulls K weakest pairs from the
store and drills them). Each drill = a small module exporting a `runDrill(params)`
that returns engine-compatible results, plus a UI panel in `practice-ui.html`.
**Deliver:** `drills/` folder with one module per drill, each with a unit test; extend
`practice-ui.html` to render the menu and run each; extend `generate-practice-lessons.mjs` so the
generated practice JSON lists the new drill types. Re-run `validate-practice-lessons.mjs` (must stay 0 fail).

### BRIEF C — Review reminder / streak nudge (piece #3)
**Goal:** Use the existing fluency store (which already decays fluency over time) to *prompt*
review of cold/decayed pairs.
**Scope:** A scheduler hook (pure function is fine for v1) that, given the store snapshot + last-seen
timestamps, returns "review now" for pairs below a fluency threshold or not practiced in N days.
Surface in the UI as a streak/consistency indicator + a "your weakest pairs are getting cold" nudge.
No network, no account needed for v1. Respect AGENTS.md: no false-negative framing.
**Deliver:** `review-scheduler.mjs` (+ test asserting it fires for a decayed pair and stays quiet
for a fresh one), UI nudge element in `practice-ui.html`, and a unit test.

### BRIEF D — Persist memory in app storage (piece #4)
**Goal:** Wire `fluency-store.toJSON()` / `load()` to the app's real storage so progress survives
app close.
**Scope:** A storage adapter (localStorage for web PWA / AsyncStorage-equivalent for RN) behind a
tiny interface (`save(json)`, `load()`). On app open, `load()` the store; after each drill,
`save()`. Must not break the engine's `now()` injection used by tests. Keep the pure engine free of
platform deps (adapter is a separate file). Provide a fallback if storage is unavailable.
**Deliver:** `storage-adapter.mjs` (+ the platform glue), a test that round-trips a store through
save/load and asserts fluency + samples survive, and a note on where the app calls it.

---

## 5. MANDATORY FRESH-AGENT RE-VERIFICATION (owner directive)

After parallel build, launch a **separate, fresh agent** (no shared context with the builders) that:

1. Re-runs the three proof commands (§1) — must be green. If a builder changed an engine file,
   the 17-test suite must still pass.
2. Reads back **actual generated files** (spot-check 2–3 `05-content/practice/*.json`, the UI
   `practice-ui.html`, and any new drill/listener modules) and confirms they match the contract in §3.
3. Runs each new piece's own tests (Briefs A–D each require tests).
4. Confirms no license violations (§3 guardrails) were introduced.
5. Reports PASS/FAIL per piece. **Green builder output is NOT the gate — the fresh re-check is.**

---

## 6. OPEN OWNER QUESTIONS (still pending, low priority)
- Songs = separate category (RESOLVED). Seed songs S1/S2/S3 placeholders live in §5.6 of the
  curriculum doc; need real song→chord mappings when ready.
- "Single-note tabs before chords" fork was recommended against (chords-first kept); not formally
  resolved by owner.

## 7. RESUME ONE-LINER
Read §1, run the 3 commands, then pick a piece from §4 (or fan them all out per §5).
