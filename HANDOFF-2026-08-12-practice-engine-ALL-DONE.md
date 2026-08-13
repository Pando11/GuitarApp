# HANDOFF — GuitarApp Practice Engine: Pieces A–D COMPLETED (2026-08-12)

**Author:** Hermes · **Read this FIRST** for any GuitarApp practice work.
**Status:** all 4 remaining practice-engine pieces (A–D) are built AND independently re-verified by a fresh agent. The practice engine is now feature-complete for the 7 tracked gaps.

---

## 0. TL;DR (for a fresh agent)

The practice engine is **7 of 7 gaps DONE + VERIFIED**. Pieces A–D were built by parallel leaf
subagents, then re-checked by a **separate fresh verifier** (standing rule: green builder output is
NOT the gate — the fresh re-check is). On-disk reality confirmed every claim below.

---

## 1. VERIFIED CURRENT STATE (all green, re-run by the fresh verifier THIS session)

```
cd C:\Users\The Yoda Trader\Desktop\GuitarApp
node --test 06-prototypes/practice-engine/practice-engine.test.mjs   # 17 pass, 0 fail
node 06-prototypes/practice-engine/validate-practice-lessons.mjs      # 0 failures
python3 06-prototypes/practice-engine/verify-ui.py                   # ALL UI CHECKS PASSED
```

**New-piece tests (the A–D work):**
- A: `listener-real.test.mjs` → **9 pass / 0 fail**
- B: `drills/*.test.mjs` → **33 pass / 0 fail** (8 modules, 5+4×7)
- C: `review-scheduler.test.mjs` → **11 pass / 0 fail**
- D: `storage-adapter.test.mjs` → **5 pass / 0 fail**

**License scan (23 new files):** clean — no copyleft (Essentia/aubio/TarsosDSP/madmom) or
forbidden voice libs. A uses original MIT pitch core + CREPE/basic-pitch hook (both approved).

**Integration proof (not just "files exist"):** the fresh verifier executed C and D against a live
fluency store — C's `computeReviewState` returned `needsReview:true` with `G::D`/`Em::easyC` flagged
on a decayed store; D's `save→load` round-trip preserved fluency + samples.

---

## 2. WHAT IS DONE (A–D, with proof)

| Piece | What shipped | Proof |
|---|---|---|
| **A — Real mic listener** | `listener-real.mjs` (MIT, CREPE/basic-pitch `pitchDetector` hook, emits engine-compatible `{chord,confident,t}`), `listener-real.test.mjs`, `listener-real.md`. `listener-sim.mjs` kept as test default. | 9/9 tests; verifier fixed a real matcher bug (lowercase lookup vs capitalized map keys) found during re-check |
| **B — 8 remaining §5.2 drills** | `drills/` = tempo-loop, wait-to-play, anchor-pivot, spider-warmup, metronome-ladder, weak-pair-review, muted-strum, count-out-loud — each `runDrill(params)` returning engine-compatible envelope. `practice-ui.html` extended (all 11 §5.2 drills in menu + runnable panels) and wires C/D mount points. `generate-practice-lessons.mjs` extended. | 33/33 drill tests; validate still 0 failures; UI passes |
| **C — Review reminder / streak nudge** | `review-scheduler.mjs` (`computeReviewState`/`computeStreak`/`pairNeedsReview`), `review-scheduler.test.mjs`, `ui-nudge.js` (renders into `#review-nudge`). | 11/11; live decayed-store call fires correctly |
| **D — Persist memory in app storage** | `storage-adapter.mjs` (`save`/`load`, in-memory fallback), `storage-adapter.test.mjs`, `storage-glue.js` (renders into `#storage-status`). Engine stays platform-free. | 5/5; live round-trip preserves data |

The UI mount points `#review-nudge` and `#storage-status`, plus `<script src="ui-nudge.js">` and
`<script src="storage-glue.js">`, are present in `practice-ui.html` and both glue scripts execute.

---

## 3. ENGINE CONTRACT (unchanged — do not drift)

Exports (verified by grep):
- `one-minute-changes.mjs`: `ADVANCE_PER_MIN=30`, `GOAL_PER_MIN=60`, `countChanges(strumEvents, pair)`, `measureOneMinute(pair, strumEvents, durationMin=1.0)`
- `fluency-store.mjs`: `createFluencyStore({ knownPairs=[], now })` → `.record/.selectWeakest(K=3)/.snapshot/.toJSON/.load`
- `pair-key.mjs`: `pairKey(a,b)` (order-independent), `parsePair(key)`
- `practice-loop.mjs`: `createPracticeLoop({ knownPairs=[], K=3, now })`
- `listener-sim.mjs`: `simulateStrumStream({ A, B, skillA, skillB, cadencePerMin, durationMin, seed })`
- `listener-real.mjs`: `createListenerReal({ pair, tempoPerMin, pitchDetector })`, `analyzeAudio({ buffer, pair, pitchDetector })`
- `drills/*.mjs`: each exports `runDrill(params)` → `{ drill, params, events:[{chord,confident,t}], metrics, ratePerMin, score, passed, summary }`

**Strum event shape:** `{ chord: 'Em'|'easyC'|'G'|'D'|'A'|'Am'|'E'|'Dm'|null, confident: true|false, t: ms }`.
A "change" = two consecutive confident, known events with different chords. Mashing one chord = 0 changes.

**§5.2 drill taxonomy (source of truth):** 11 items — Chord-Perfect, Air Changes, One-Minute Changes (original 3) + Tempo-Scaled Section Loop, Wait-To-Play, Anchor/Pivot, Spider warm-up, Metronome ladder, Weak-Pair Review, Muted/percussive strum, Count-out-loud. "Chord Challenge" is a COMPETITOR feature (§2), NOT a §5.2 drill.

---

## 4. WHAT STILL NEEDS TO BE DONE

These are **NOT** part of the 7 practice-engine gaps — they are the remaining GuitarApp work the
practice engine now supports but does not itself close:

1. **Wire the UI to a real mic (production path).** A's `listener-real.mjs` has the `pitchDetector`
   hook and a working CREPE-class core, but the browser `getUserMedia` → frame feed →
   `listener.pushFrame()` plumbing into `practice-ui.html`'s drill panels is not yet connected.
   (Sim remains the test default; real path is injectable but unwired in the UI.)

2. **Songs category not separated on disk (LOW).** Curriculum §5.4/§5.6 says songs are a separate
   category; on disk L03 still embeds a song and L23 "Your First 3-Chord Song" ships as a technique
   lesson. No `songs/` directory exists. Doc reconciled up (L23→seed S2) but the file move is
   unbuilt. Non-blocking.

3. **No C-graduation teaching beat (LOW).** easyC→standard C swap is handled by `canonChord`
   (memory continuity solved) but there's no explicit "you've graduated to C" lesson moment.
   Beginner-clarity nicety, not a moat bug.

4. **Real-device / audio e2e not exercised.** All tests are deterministic (sim + injected detectors).
   No on-device mic run has validated pitch detection against a real guitar. Recommended before
   any paid launch (RC live keys + App/Play).

5. **Persistence not yet called from the app loop.** D's adapter + glue exist and round-trip, but
   the app doesn't yet `initStorage` on open or `save()` after each drill in the real flow. The
   glue file documents where to call it.

6. **Repo still private / nothing pushed.** Per standing rule, no `git push`. When Heidi authorizes
   launch: strip `?dogfood=1` from `manifest.start_url`, set RC live keys, build App/Play packages.

---

## 5. RESUME ONE-LINER

Read §1, re-run the 4 proof commands (engine 17/0, validate 0, UI pass, plus the A/B/C/D test
suites), then pick from §4. The practice engine backend + drills + review + persistence are DONE;
remaining work is UI-mic wiring, songs-file move, and launch prep.
