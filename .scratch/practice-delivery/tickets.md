# .scratch/practice-delivery/tickets.md

**Feature:** Grill #2 — Practice Delivery (drills + file:// HTML UI + voice-first AI teacher)
**ADR:** `docs/adr/0002-practice-delivery.md`
**Grill:** #2 of rolling list (student memory #1, practice delivery #2, mystery mode #3, teacher #4, AMENDMENT-05 #5, curriculum #6, song-progression #7, backend #8)
**Status:** decisions locked; build tickets defined; build code did NOT survive the PC transfer (repo restore concern, not a blocker for this ADR)
**Issue tracker:** local file (this file) per `AGENTS.md` issue-tracker note. No GitHub needed.

---

## Legend

- **Owner-decision** = blocked until owner confirms. Agent does NOT guess.
- **Build** = agent implements. Ship gates apply where relevant (in this case: the missing gate T-B6 is the key verification; the chord-check gate still applies to any chord-bearing content).
- **Roadmap** = visible future item; never marked complete until its trigger is met.
- **Restore** = the build code for this feature did NOT survive the PC transfer; these tickets are the build plan for when the code is restored or recreated. They are not claiming the build exists on this machine.

---

## A. Owner decisions (block the build — resolve first)

These have to be decided before the build tickets below can be sized. Agent surfaces them here; owner picks. No default — each has a real choice.

### T-A1: file:// delivery target — confirm the practice UI is the file:// HTML, not a LAN server

**Why it blocks:** The ADR says the delivery target is `practice-ui.html` (file://), with inline mirrors of the engine modules because ES imports are CORS-blocked over `file://`. If the delivery target is actually a LAN server (like the lesson PWA on `https://localhost:8443`), the mirror approach is wrong — the real ES modules can be imported directly.

**Choices:**
- **A. file:// HTML UI** (per ADR decision #1). `practice-ui.html` with inline mirrors. Works offline on the student's device. Matches `AGENTS.md` delivery convention ("interactive, double-clickable file:// HTML, NOT localhost servers — their phone can't reach a local server").
- **B. LAN server** (like the lesson PWA). `07-app/` serves the practice UI over HTTPS; ES modules import directly; no mirrors needed. The phone can reach it on the LAN.

**Owner picks A or B.** If B, the mirror approach in the ADR is wrong and the build changes significantly (no listener-twin.js needed; real `listener-real.mjs` can be imported). If A, the mirrors + twin are required.

**Acceptance:** Owner's choice recorded in this file. If A, the inline-mirror + listener-twin recipe is the build path. If B, the mirror approach is dropped.

---

### T-A2: listener-twin.js generation recipe — how do we regenerate the twin?

**Why it blocks:** The ADR says listener-twin.js must be GENERATED as a byte-faithful IIFE transform of `listener-real.mjs` (strip `export `, wrap in `(function(global){…})(window)`), NOT hand-edited. The generated-inline-data-parity reference file did not survive the transfer — the recipe is gone.

**Choices:**
- **A. Re-create the generation script.** Write a script (Python or Node) that reads `listener-real.mjs`, strips `export `, wraps in the IIFE, and writes `listener-twin.js`. Re-run it every time `listener-real.mjs` changes. This is the cleanest — the twin never drifts.
- **B. Manual IIFE transform once, then regenerate on change.** Do the transform by hand for the first version, then use the script (A) for subsequent changes. Risky — manual transforms can introduce subtle differences.
- **C. No twin — run the real module in the browser.** Only possible if T-A1 = B (LAN server, ES imports work). If T-A1 = A (file://), this choice is off the table.

**Owner picks A, B, or C (C only if T-A1 = B).** The ADR's guard ("GENERATE the twin, don't hand-edit it") stands — whatever approach is chosen must keep the browser math from drifting from the proven Node module.

**Acceptance:** Owner's choice recorded. If A or B, the generation approach is documented in the ticket. If C, the twin is not needed (T-A1 = B).

---

### T-A3: voice-first AI teacher — Chatterbox voice + intent understanding scope

**Why it blocks:** The ADR says the student talks to the AI like a teacher, and the AI responds via Chatterbox voice as a teacher. The scope of "intent understanding" is open — how much does the AI actually understand vs. pattern-match?

**Choices:**
- **A. Structured intent list (v1).** A defined set of intents the student can express (e.g. "why does my C sound muted?", "show me slower", "I keep missing the G string", "what's next?", "keep going", "I need help") — each maps to a teaching response. The AI matches the student's speech to an intent and responds. Simple, predictable, verifiable. Chatterbox voice delivers the response.
- **B. Open-ended teacher chat (v1).** The AI handles any teaching question the student asks, like a real teacher conversation. More flexible, harder to verify ("did the AI give a useful response?"), and closer to an LLM-judgement risk (Rule 5 — the AI must not freelance a musical opinion).
- **C. Hybrid — structured intents for the drill-specific interactions (slower, loop, next, help) + open-ended for general questions, with Rule 5 guardrails.**

**Owner picks A, B, or C.** My suggestion: **A (structured intent list)** for v1 — it's verifiable (the missing gate T-B6 can test each intent end-to-end), it's safe under Rule 5 (each response is authored, cites stored data, doesn't freelance), and it delivers the differentiator (the student talks to a teacher) without the open-ended risk. B and C are later passes.

**Acceptance:** Owner's choice recorded. If A, the intent list is authored and the gate tests each intent. If B or C, the gate shape changes (harder to verify).

---

## B. Build tickets (in build order)

These depend on A1–A3 being resolved where relevant. Agent picks up where the owner decisions land. All tickets are "restore" tickets — the build code did not survive the transfer; these are the build plan for when the code is restored or recreated.

### T-B1: Practice lesson infrastructure — 1:1 structure + drill selector + evidence order

**Depends on:** T-A1 (delivery target — file:// vs LAN). Mostly independent of T-A2/T-A3.

**What:** The skeleton that assembles a practice lesson from the drill menu:

- **1:1 mapping:** one practice lesson per teaching lesson. For teaching lesson N, the practice lesson drills the chord(s) introduced in lesson N PLUS every chord taught before it (cumulative reinforcement). Structural — survives scaling.
- **Drill selector:** picks ≥3 drills from the §5.2 menu (decision #2) for the lesson, in evidence-backed order: warm-up → accuracy → retrieval → speed → spaced weak-pair review.
- **Lesson structure:** a practice lesson is a sequence of drill instances, each with its params (chord set, tempo, difficulty) drawn from the lesson's chord scope.
- **Canonical form:** `drills/<drill>.mjs` returns `{drill, params, events, metrics, ratePerMin, score, passed, summary}`.

**Acceptance:**
- A practice lesson can be assembled from the 11-drill menu, ≥3 options, in the evidence order.
- The 1:1 mapping is structural — the same group→chord map that introduces chords drives the practice scope.
- The lesson structure is data (not hardcoded prose in code) so drills can be tuned.

**Out of scope:** the actual drill implementations (T-B2), the file:// UI (T-B3), the voice layer (T-B5), the verification gate (T-B6). This ticket is the assembly skeleton.

---

### T-B2: Drill menu — 11 drills as `drills/<drill>.mjs`

**Depends on:** T-B1 (the selector that picks from this menu).

**What:** Each of the 11 drills implemented as a canonical `drills/<drill>.mjs` returning the engine envelope:

1. Chord-Perfect
2. Air Changes (the ONLY silent drill — form the shape in the air, no guitar sound)
3. One-Minute Changes (with the 30/60 gate — ≥30 changes/min = advance diagnostic, ≥60 = goal)
4. Tempo-Scaled Loop
5. Wait-To-Play
6. Anchor
7. Spider
8. Metronome ladder
9. Weak-Pair Review
10. Muted strum
11. Count-out-loud

**Drill contract (from the surviving skill):**
- Each drill is a self-contained exercise with its own params, events, metrics, ratePerMin, score, passed, summary.
- Listening-driven drills (all except Air Changes) use the on-device listening engine to verify the played chord/tempo. The listener contract expects `{ chord: <real name>|null, confident: bool, t }` — each strum matched against the KNOWN pair only.
- One-Minute Changes: counts clean chord *changes* in 60s. A change = two consecutive CONFIDENT strums that differ (mashing one chord = 0, low-confidence never counted). `countChanges` must take the pair's TWO REAL NAMES, not literal 'A'/'B'.
- Weak-Pair Review: selects the K=3 weakest pairs for a review session, using per-pair fluency with spacing-effect decay. The weakest pair per lesson is measured, not guessed.

**Acceptance:**
- All 11 drills implemented as `drills/<drill>.mjs` with the canonical envelope.
- Air Changes is marked and behaves as the only silent drill.
- Listening-driven drills correctly consume the `{ chord, confident, t }` stream.
- One-Minute Changes correctly counts changes (real names, not 'A'/'B').
- Weak-Pair Review selects K=3 weakest pairs with decay.

**Out of scope:** the file:// UI (T-B3), the voice layer (T-B5), the verification gate (T-B6). This ticket is the drill implementations.

---

### T-B3: file:// UI — practice-ui.html with inline mirrors

**Depends on:** T-A1 (= A, file://), T-A2 (listener-twin generation approach), T-B1 (lesson structure), T-B2 (drill implementations).

**What:** The `file://` HTML UI that runs the practice lesson:

- **`practice-ui.html`** — the single-page practice UI, double-clickable from the student's device (no server). Matches `AGENTS.md` delivery convention.
- **Inline mirrors** of the engine modules — because ES `import` is CORS-blocked over `file://`. The canonical `.mjs` stays for Node tests; the mirror is what the page actually runs.
- **`listener-twin.js`** — the browser mirror of `listener-real.mjs`, generated per T-A2 (byte-faithful IIFE: strip `export `, wrap in `(function(global){…})(window)`). This is what the browser's `getUserMedia` → `AudioContext` → `ScriptProcessorNode` → `listener.pushFrame(frame, tMs)` feeds.
- **`createStorageAdapterInline()`** — the browser mirror of `storage-adapter.mjs` (localStorage + in-memory fallback), so persistence works over file://.
- **`PracticeStorageGlue.persist()`** — called after every drill.

**Acceptance:**
- `practice-ui.html` runs the practice lesson end-to-end on file:// (double-click, no server).
- The inline mirrors match the canonical `.mjs` (no drift — the listener-twin generation guard from T-A2 applies).
- The UI shows the drill sequence, the mic toggle, the score/progress, and the voice-first interaction surface (T-B5).

**Out of scope:** the voice-first AI teacher logic (T-B5), the verification gate (T-B6), the seamless continuation (T-B8).

---

### T-B4: Mic permission + global toggle

**Depends on:** T-A1 (= A, file://), T-B3 (the UI), T-B2 (listening-driven drills).

**What:** The mic permission model from decision #3:

- **Once-per-session** — ask for mic permission the first time a listening-driven drill comes up; keep it for the session.
- **Global mic on/off toggle in the UI** — lets the student control it without re-asking each time.
- **`#realMicToggle` checkbox** — arms the real mic via `getUserMedia` → `AudioContext` → `ScriptProcessorNode` → `listener.pushFrame(frame, tMs)`. Falls back to the deterministic sim if mic/permission is absent.
- The same `events[]` stream both `measure()`/`finishDrill()` (Node) and the browser twin consume.

**Acceptance:**
- Mic permission is requested once per session, not per drill.
- The global toggle in the UI arms/disarms the real mic.
- The sim fallback works when mic/permission is absent (the deterministic sim can run a listening-driven drill without real audio).

**Out of scope:** the voice-first controls (T-B5 — that's the student's SPEAKING voice, a different stream from the guitar audio the mic captures for drills).

---

### T-B5: Voice-first practice controls — student talks to AI like a teacher

**Depends on:** T-A3 (intent scope — A, B, or C), T-B3 (the UI — the voice interaction surface), T-B1 (lesson context — the AI needs to know what lesson/drill the student is in to give a relevant response).

**What:** The differentiator — the student talks to the AI like it's a teacher, and the AI responds as a teacher via Chatterbox voice:

- The student speaks a teaching question/command (e.g. "why does my C chord sound muted?", "can you show me that again slower?", "I keep missing the G string", "what's next?", "keep going", "I need help with this chord").
- The AI **understands the intent** (per T-A3 scope — structured intents for v1 per my suggestion) and responds as a teacher.
- The response is delivered via **Chatterbox voice** (MIT) — the same voice stack as the teacher (ADR-0004 / AMENDMENT-06).
- **Rule 5 guard:** the AI's response cites stored mastery/confidence/practice data — never freelances a musical opinion. "Your C sounds muted" is a student statement the AI can address with data; "you're muting the G string" is a diagnosis the AI may NOT invent — it must come from the listening engine's actual output or be framed as a suggestion to check, not a claim.
- The voice layer is separate from the guitar-listening layer (decision #3) — the student's speaking voice goes to the AI; the student's guitar audio goes to the listening engine. Both are on-device; neither is uploaded (AMENDMENT-05).

**Acceptance:**
- The student can speak a teaching question/command and get a useful teacher response via Chatterbox voice.
- The response is a teaching response, not a generic "I didn't get that."
- Rule 5 is respected — the AI cites stored data or frames suggestions, never invents a musical diagnosis.
- The voice pipeline (mic capture → speech → intent → Chatterbox response) is end-to-end working on the file:// UI (this is the prerequisite for T-B6's gate).

**Out of scope:** the end-to-end verification gate (T-B6 — that's the PROOF that this works as a teaching experience). This ticket is the implementation.

---

### T-B6: End-to-end teaching interaction verification gate (THE missing gate)

**Depends on:** T-B5 (the voice-first implementation), T-B3 (file:// UI), T-B1 (lesson context). This is the gate that was missing as of 2026-08-16.

**What:** The gate that proves the student can actually talk to the AI like a teacher end-to-end, on the file:// UI. NOT just a command-test suite — a teaching-interaction verification:

- **For each intent in T-A3's scope** (e.g. "why does my C sound muted?", "show me slower", "I keep missing the G string", "what's next?", "keep going", "I need help"):
  - The student speaks the intent (or a close variant).
  - The AI understands the intent.
  - The AI gives a useful teacher response via Chatterbox voice.
  - The whole pipeline works on the file:// UI.
- **The gate verifies the teaching experience, not just the command parser.** "Useful teacher response" means the response is relevant to the student's question, cites stored data where relevant (Rule 5), and is delivered in the teacher's voice — not a canned "command recognized" acknowledgment.
- **This is the gate that was missing.** The engine was claimed `[BUILT]`, but this proof was not in place. T-B6 is the gate that closes it.

**Acceptance:**
- Every intent in scope passes end-to-end on the file:// UI: student speaks → AI understands → useful teacher response via Chatterbox → works on file://.
- The gate is a named, runnable verification (like `node run-chord-check.js` or the fidelity gate) — not a vague "we tested it." The gate produces a pass/fail result.
- The gate is documented in the repo as the voice-first verification gate (parallel to the other ship gates).

**Out of scope:** scaling to 100+100 (T-B9), the seamless continuation (T-B8). This ticket is THE gate.

---

### T-B7: Local-first store — persistence + ADR-0001 convergence

**Depends on:** T-B3 (the UI — the inline storage adapter), T-B1 (lesson context — what gets persisted per lesson). Independent of T-A1/T-A2/T-A3.

**What:** The local-first persistence layer from decision #6:

- **`createStorageAdapterInline()`** — browser mirror of `storage-adapter.mjs` (localStorage + in-memory fallback), so persistence works over file://.
- **`PracticeStorageGlue.persist()`** — called after every drill.
- **`fluencyStore.toJSON()` / `.load()` / `.snapshot()`** — so the glue can hydrate across reloads.
- **What's persisted:** per-pair fluency state, per-chord confidence, practice session history, drill scores. All as data — the teacher cites these numbers (Rule 5), never freelances.
- **ADR-0001 convergence:** this local-first store has the SAME SHAPE that ADR-0001's encrypted cross-device sync will use. When ADR-0001 lands, the local save converges to encrypted cross-device without a rewrite. The store is ADR-0001-ready by construction.

**Acceptance:**
- After a drill, the fluency/confidence/session data is persisted to the local store.
- The data survives a reload (hydrates from localStorage via `toJSON`/`load`).
- The store shape matches what ADR-0001 will use (same envelope, no rewrite needed when ADR-0001 lands).
- The teacher's voice responses (T-B5) can cite the persisted numbers (Rule 5).

**Out of scope:** ADR-0001 itself (that's a separate grill/build). This ticket is the local-first phase + the ADR-0001-ready shape.

---

### T-B8: Seamless lesson-to-lesson continuation — voice-first + button fallback, world + teacher persistent

**Depends on:** T-B1 (lesson structure — the "next lesson" link), T-B5 (voice-first — the "keep going" intent), T-B3 (UI — the "Next lesson ▶" button). Also depends on the world + teacher being persistent across lessons (ADR-0004 / Grill #4 — if World 1 + the teacher aren't built yet, this feature has nothing to persist across; it's structurally ready but asset-dependent).

**What:** From decision #7:

- **Voice-first:** at the end of a lesson, the student says "keep going" / "next lesson" / "what's next?" — and the next lesson starts in the **same world** with the **same teacher** (same voice, same look, same setting). No leaving/re-entering the world between lessons.
- **Button fallback:** a visible **"Next lesson ▶"** button — for when the student prefers to tap, or when the mic is off. The world + teacher persistence is the same either way.
- **World + teacher persistence:** the world (Emerald Hollow, per ADR-0004) and the teacher (the chill instructor, per ADR-0004) persist across the lesson boundary. The student doesn't close the world, come back, and find a different teacher or a blank screen.
- This is also referenced as feature #21 in `PROPOSED-FEATURES.md`: "Seamless lesson-to-lesson continuation — REVENUE (anti-churn), low — '✓ Complete → Next lesson ▶' keeps student in the teacher's world. PWA-first."
- **No leaving/starting the world between lessons.** This is the anti-friction design.

**Acceptance:**
- At lesson end, the student can say "keep going" (voice) or tap "Next lesson ▶" (button) and the next lesson starts.
- The next lesson starts in the same world with the same teacher (voice, look, setting persistent).
- The voice-first path is the obvious one; the button is the fallback (UI doesn't over-emphasize the button).
- This works end-to-end on the file:// UI (or the LAN server, per T-A1).

**Out of scope:** the world + teacher assets themselves (ADR-0004 / Grill #4 build) — those are the dependency. This ticket is the continuation logic + UI.

---

## C. Roadmap / future (not blockers for this grill)

### T-C1: Scale to 100+100 (deterministic generator)

**Status:** roadmap — the 1:1 mapping + structural scope (T-B1) is the enabler, but the actual 100+100 generation is a separate, later build.

**Goal:** Grow the spine to 100 teaching + 100 practice lessons WITHOUT hand-authoring 200 files. Write a generator that emits the locked schema (per the `scale-100-curriculum.md` reference in the guitarapp skill), then prove it with the repo's real gates.

**Not for this grill.** The structural decisions (1:1, cumulative reinforcement, same group→chord map for scope) are locked in T-B1 — that's the enabler. The generator itself is future.

**Acceptance (when it runs):** A generator emits 100+100 lessons from the locked schema; the repo's gates (chord-check, ordering, fidelity, song-progression) pass; the output is emitted to a NEW dir (`scale-100/`), never clobbering the shipping set.

---

## D. Blockers / notes

- **T-A1, T-A2, T-A3 are owner decisions.** Agent does NOT guess. Pick up the build tickets only after the relevant owner decision is recorded in this file.
- **Build code did NOT survive the PC transfer.** `06-prototypes/practice-engine/`, `07-app/content/practice/*.json`, the file:// UI, the listener-twin.js, the generated drills — all absent on this machine. This ADR (ADR-0002) is the on-disk record of the architecture and decisions. The build tickets above are the BUILD PLAN for when the code is restored or recreated. They are not claiming the build exists on this machine.
- **The missing gate (T-B6) is the key verification for this feature.** The engine was claimed `[BUILT]` as of 2026-08-16, but the end-to-end teaching interaction verification was not in place. T-B6 is the gate that closes it — it must be run and pass before the voice-first feature is considered "done."
- **listener-twin.js generation recipe (T-A2)** is a real dependency — the twin must be regenerated when `listener-real.mjs` changes, or the browser math silently drifts from the proven Node module. The generated-inline-data-parity reference file did not survive the transfer; the recipe needs to be re-created or re-confirmed.
- **Voice-first + seamless continuation both depend on the Chatterbox voice stack** (ADR-0004 / AMENDMENT-06). The voice license blocklist (Rule 9) applies — no ElevenLabs for a paid app.
- **ADR-0001 dependency:** the local-first store (T-B7) converges to ADR-0001 when the app shell ships. Don't block practice delivery on ADR-0001 being built.
- **ADR-0004 dependency:** seamless continuation (T-B8) assumes the world + teacher are persistent across lessons. If World 1 (Emerald Hollow) + the teacher aren't built yet (Grill #4), the feature is structurally ready but asset-dependent.

---

## Owner sign-off (to be filled)

- T-A1 (delivery target — file:// vs LAN): **TBD**
- T-A2 (listener-twin generation recipe): **TBD**
- T-A3 (voice-first intent scope — A/B/C): **TBD**

**Status update:** All seven decisions are locked in ADR-0002. Build tickets T-B1 through T-B8 are defined. T-A1 through T-A3 are the open owner decisions — pick up the build tickets only after they're recorded.

---

## Delivery note

Written in Hermes chat (Telegram + desktop). Grill rhythm: interview (one question at a time, plain language, suggestions offered) → ADR written → tickets written → build → review. This tickets file is the on-disk record for Grill #2 build plan on this machine; the original build code did not survive the PC transfer.

END OF TICKETS.
