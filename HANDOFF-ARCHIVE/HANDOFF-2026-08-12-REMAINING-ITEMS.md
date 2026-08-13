# HANDOFF — GuitarApp Practice Engine: REMAINING ITEMS (2026-08-12)

**Author:** Hermes · **Read AFTER** `HANDOFF-2026-08-12-practice-engine-ALL-DONE.md` (which is the authoritative baseline for A–D being DONE + VERIFIED).

**Status of baseline:** A–D are green (proven by re-running: engine 17/0, validate 0, A 9/9, B 33/33, C 11/11, D 5/5, UI pass). This file tracks the 6 remaining items from ALL-DONE §4, with the gotchas discovered while wiring the resume point.

**Discipline reminder:** green builder output is NOT the gate. After any agent returns, re-run the proof commands below and verify on disk before marking anything done. Subagent summaries are self-reports — verify.

---

## 0. WIRING MAP (read this before touching `practice-ui.html`)

The browser UI (`06-prototypes/practice-engine/practice-ui.html`) deliberately uses **inline mirrors** of the engine because **ES module imports are blocked over `file://` (CORS origin "null")** — see the comment at UI line ~388. So:
- `makeStore(known)` — inline mirror, defined UI line 205. API: `record(pair, ratePerMin, nowMs)`, `selectWeakest(K, nowMs)`. **Lacks** `toJSON()` / `load()` / `snapshot()` (which D's `storage-glue.js` calls).
- `simStream(A,B,skillA,skillB,cadencePerMin,durMin)` — inline sim, UI line 225.
- `measure([A,B], events, durMin)` — inline mirror of `measureOneMinute`, used at UI line 336.
- `STORE` is the inline mirror (UI line 240), seeded + 4 synthetic `record()` calls in `init()` (lines 298–302).
- `finishDrill(pair, m)` (UI line 357) — calls `STORE.record(...)` then `refreshReview()`. **This is where per-drill persistence (#5) must hook.**
- Mount points exist: `#review-nudge` (UI line 159), `#storage-status` (UI line 163).
- `modeBadge` (UI line 44) already shows "SIMULATED listener" — natural place to flip to "REAL mic".

**The real engine modules** (`listener-real.mjs`, `storage-adapter.mjs`, `fluency-store.mjs`, `drills/*.mjs`) are exercised by Node tests, NOT imported by the HTML. Any real-mic or real-persistence path the UI needs must be **mirrored inline** OR the import strategy must change (out of scope — keep the inline pattern).

---

## 1. ITEM #1 — Wire UI to a REAL mic (production path)  ·  [AGENT A]

**Goal:** `getUserMedia` → `AudioContext` → `ScriptProcessorNode` (or `AudioWorklet`) → `listener.pushFrame(frame, tMs)`, producing the same `{chord,confident,t}` events the sim produces, fed into the existing `measure`/`finishDrill` flow.

**Contract (from `listener-real.mjs`):**
- `createListenerReal({ pair:['Em','easyC'], tempoPerMin:60, sampleRate:44100, frameSize:4096, confidenceThreshold:0.5, pitchDetector })`.
- `.pushFrame(Float32Array, tMs)` accumulates peaks per strum window; `.getEvents()` returns engine-compatible events.
- Built-in `pitchDetector` default = `detectPitchClasses(frame,{sampleRate})` (CREPE-class core, dependency-free). No external model needed for the wiring.

**GOTCHA:** `listener-real.mjs` cannot be `import`ed over `file://`. Mirror the streaming contract INLINE in `practice-ui.html` (consistent with `simStream`/`measure` already being inline mirrors). I.e. add an inline `createListenerReal`-equivalent (or paste the pushFrame+classify logic) so the browser path needs no cross-file import. Swapping in the real CREPE/basic-pitch model later is via the `pitchDetector` injection — document that hook.

**Scope:**
- Add a "Use real mic" toggle that flips `modeBadge` to "REAL mic" and switches the `startBtn` handler from `simStream` to the mic-fed `pushFrame` loop.
- Capture via `navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false}})` → `AudioContext` → `ScriptProcessorNode` (4096 frame) → `listener.pushFrame(e.inputBuffer.getChannelData(0), currentTimeMs)`. AMENDMENT-05 Rule 4: constrained to the known pair + known tempo only; audio never leaves device (Rule 4); below-confidence → `confident:false` (Rule 6), never a false red X.
- Keep `simStream` as the default/test path and the fallback if mic permission is denied.
- Verify UI still loads with no console errors via `python3 verify-ui.py` (ALL UI CHECKS PASSED) and SIMULATED drill still runs. **Real-mic pitch accuracy CANNOT be verified headlessly — that is ITEM #4.**

**Proof:** `python3 verify-ui.py` → ALL UI CHECKS PASSED; plus a new inline self-test (or small Node check) that `pushFrame` on a synthetic buffer yields `getEvents()` with the right shape.

---

## 2. ITEM #5 — Persistence in the app loop  ·  [AGENT A]

**Goal:** D's adapter + glue actually persist the UI store across reloads.

**GOTCHA (the real work):** The bottom script (UI lines 532–538) passes **DUMMY** store/adapter to `PracticeStorageGlue.initStorage`. And `makeStore` (UI line 205) lacks `toJSON()`/`load()`/`snapshot()` that `storage-glue.js` calls. So:
1. Extend `makeStore` to expose `toJSON()` (return the `mem` Map as a serializable object), `load(json)` (rehydrate `mem`), and `snapshot()` (array of `{pair,fluency,samples,lastPracticed}` — `selectWeakest` already exists; `snapshot` = full dump). Keep `record`/`selectWeakest` behavior identical (don't regress the decay math).
2. Replace the dummy block (UI lines 532–538) with:
   ```js
   const _adapter = window.PracticeStorageAdapter ? window.PracticeStorageAdapter.createStorageAdapter()
                                                   : createStorageAdapterInline();
   PracticeStorageGlue.initStorage(STORE, _adapter);   // hydrate from saved
   ```
   Note: `storage-glue.js` is a classic script exposing `window.PracticeStorageGlue`. `storage-adapter.mjs` is an ES module — mirror the adapter inline too (or load it via a non-module `<script>` build). Simplest: paste a tiny inline `createStorageAdapter()` mirror (localStorage + memory fallback) so the UI has no import dependency.
3. In `finishDrill` (UI line 357), after `STORE.record(...)`, call `PracticeStorageGlue.persist(STORE, _adapter)`.
4. On `init()`, `initStorage` must run AFTER `STORE = makeStore(...)` and the seed `record()`s — hydrate then optionally overwrite with saved data (decide: saved data wins over seed; current seed is demo-only).

**Proof:** a Node test (new `practice-ui-persist.test.mjs` or extend) proving `makeStore` round-trips `toJSON`→`load` and that a `persist`/`initStorage` cycle restores fluency across a simulated reload. Plus `python3 verify-ui.py` still passes and `#storage-status` renders "restored N pairs" / "saved".

---

## 3. ITEM #2 — Songs category separated on disk  ·  [AGENT B]  ·  LOW

**Current:** Curriculum §5.4/§5.6 says songs are a separate category; on disk L03 still embeds a song and L23 "Your First 3-Chord Song" ships as a technique lesson. No `songs/` directory exists. Doc was reconciled (L23→seed S2) but the file move is unbuilt.

**Scope (pure repo/content reorg, NO `practice-ui.html` edits):**
- Create `05-content/songs/` (or the canonical content dir) and move/relabel the song lessons there as a distinct category.
- Update `03-research/curriculum/CURRICULUM-AND-PRACTICE-STRUCTURE.md` to reflect the separated `songs/` category and the L23→S2 seed reconciliation.
- Leave the UI spine mirror alone (it's demo-only; songs not in the practice menu yet).
- Confirm `generate-practice-lessons.mjs` / `validate-practice-lessons.mjs` still pass (songs are out of the 20-lesson practice spine, so 0 failures must hold).

**Proof:** `node validate-practice-lessons.mjs` → 0 failures; `songs/` dir exists with the moved lessons; curriculum doc updated (grep for `songs/`).

---

## 4. ITEM #3 — C-graduation teaching beat  ·  [AGENT B]  ·  LOW

**Current:** easyC→standard C swap is handled by `canonChord` (memory continuity solved), but there's no explicit "you've graduated to C" lesson moment. Beginner-clarity nicety.

**Scope (content, NO `practice-ui.html` edits):**
- Author a short graduation lesson/content beat (e.g. `05-content/.../graduation-easyc-to-c` or a nudge in the curriculum) explaining the easyC→C transition and when it triggers.
- Optionally register it in the curriculum spine as a milestone marker. Keep it non-blocking for the practice engine.
- Do NOT edit `practice-ui.html` (avoids collision with Agent A).

**Proof:** lesson file exists; curriculum references it; `validate-practice-lessons.mjs` still 0 failures.

---

## 5. ITEM #4 — Real-device / audio e2e  ·  [AGENT C: HARNESS ONLY]  ·  PRE-LAUNCH GATE

**Reality:** Cannot be satisfied headlessly. Needs a human + a real guitar + a mic. No subagent can complete this. What CAN be done now:
- Scaffold an e2e harness in `06-prototypes/practice-engine/` that exercises `listener-real.mjs`'s CREPE-class core against **synthetic guitar tones** (sine/triangle sums at the chord's pitch classes, e.g. Em = E2/G2/B2 formant-ish stack) and asserts `analyzeAudio` / `createListenerReal.pushBuffer` classifies the right chord with `confident:true`, and a wrong chord / noise yields `confident:false`. This de-risks the detector math without a device.
- New file `e2e-realmic.test.mjs` (or `.mjs` harness) — deterministic, runs in Node, no audio device.

**Proof:** `node --test e2e-realmic.test.mjs` → passes on synthetic tones. **The on-device run (real guitar through a real mic in a browser) remains a manual Heidi-authorized step before paid launch — do NOT mark #4 "done" without it.**

---

## 6. ITEM #6 — Launch prep (strip ?dogfood=1, RC keys, App/Play)  ·  HEIDI-GATED

**Not agent-completable** — it is a launch authorization decision. Prep checklist only:
- Locate `manifest.start_url` carrying `?dogfood=1`; prepare the strip (remove the param) — but DO NOT execute until Heidi says go (standing rule: never push public; repo stays private).
- RC live keys + App/Play build are Heidi's call.
- When authorized: strip `?dogfood=1`, set RC live keys, build App/Play packages, then `git push` (currently nothing pushed).

---

## 7. RESUME ONE-LINER

Baseline (A–D) is DONE+VERIFIED — don't rebuild it. Remaining: **#1+#5** = UI wiring (Agent A, `practice-ui.html`); **#2+#3** = content/repo (Agent B, `05-content`+curriculum, no UI edits); **#4** = e2e harness only (Agent C), real-device run stays Heidi-gated; **#6** = launch prep, Heidi-gated. After agents return, re-run ALL proof commands and verify on disk before claiming done.

**Proof commands (re-run after every agent):**
```bash
cd C:\Users\The Yoda Trader\Desktop\GuitarApp\06-prototypes\practice-engine
node --test practice-engine.test.mjs          # 17 pass / 0 fail (baseline)
node validate-practice-lessons.mjs             # 0 failures
node --test listener-real.test.mjs             # 9/9 (A)
node --test drills/*.test.mjs                  # 33/33 (B)
node --test review-scheduler.test.mjs          # 11/11 (C)
node --test storage-adapter.test.mjs           # 5/5 (D)
node --test e2e-realmic.test.mjs               # NEW (C harness)
python3 verify-ui.py                           # ALL UI CHECKS PASSED
```
