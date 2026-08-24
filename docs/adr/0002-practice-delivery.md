# docs/adr/0002-practice-delivery.md

**Status:** ratified (Grill #2, 2026-08-23 — owner re-confirmed on this machine)
**Supersedes:** nothing (new ADR; the original `02-spec/guitar-app-spec-PRACTICE-DELIVERY.md` did not survive the PC transfer)
**Related:** ADR-0001 (always-on encrypted sync — the local-first store converges to it), ADR-0003 (mystery mode), ADR-0004 (the teacher — World 1), AMENDMENT-05 (nine AI features — #1 listening, #4 adaptive practice, #9 voice-first controls), AMENDMENT-11 (product thesis — longitudinal student memory), AMENDMENT-15 (25-lesson curriculum — the 1:1 mapping is against this order)

---

## Context

The product's core educational mechanic is the practice lesson — the thing between teaching lessons where the student actually gets better. The original spec (`02-spec/guitar-app-spec-PRACTICE-DELIVERY.md`) defined the practice lesson, the drill menu, the file:// UI, the listening engine integration, the 30/60 + weak-pair engine, voice-first controls, and the local-first store. That spec file did not survive the PC transfer. This ADR is the on-disk record for Grill #2 on this machine.

The practice lesson is **distinct from a technique lesson** and **distinct from a song**. It is assembled from a modular drill menu, in an evidence-backed order, and it drills the chords introduced in the matching teaching lesson plus every chord taught before it (cumulative reinforcement).

---

## Decision

### 1. Core shape

- **1:1 mapping:** one practice lesson per teaching lesson (1:1). Group *N*'s practice lesson drills EXACTLY the chord(s) introduced in Group *N*'s teaching lesson PLUS every chord taught before it (cumulative reinforcement). If we teach a chord, the matching practice lesson MUST contain that chord. Structural — survives scaling to 100+100.
- **Delivery target:** `file://` HTML UI (`practice-ui.html`). ES modules are blocked over `file://` (CORS origin "null"), so the UI uses **inline mirrors** of the engine modules — self-contained copies inlined into the page (classic `<script>` or inline module, NO external import). The canonical `.mjs` stays for Node tests; the mirror is what the page actually runs.
- **Listening-driven default:** drills that produce a chord or strum are listening-driven by default — the on-device listening engine (AMENDMENT-05) verifies the played chord/tempo. Silent drills (no guitar sound needed) are the exception, not the rule.

### 2. Drill menu (§5.2)

Eleven modular drills, each a self-contained exercise:

1. Chord-Perfect
2. Air Changes (the only silent drill — form the shape in the air, no guitar sound)
3. One-Minute Changes (with the 30/60 gate)
4. Tempo-Scaled Loop
5. Wait-To-Play
6. Anchor
7. Spider
8. Metronome ladder
9. Weak-Pair Review
10. Muted strum
11. Count-out-loud

Canonical form: `drills/<drill>.mjs` returning an engine envelope `{drill, params, events, metrics, ratePerMin, score, passed, summary}`.

Each practice lesson assembles **≥3 options** from this menu. Evidence-backed order within a lesson: **warm-up → accuracy → retrieval → speed → spaced weak-pair review**.

### 3. Mic permission model

- **Once-per-session.** Ask for mic permission the first time a listening-driven drill comes up; keep it for the session. Asking every drill breaks flow.
- **Global mic on/off toggle in the UI.** Lets the student control it without re-asking each time.
- `#realMicToggle` checkbox arms the real mic (via `getUserMedia` → `AudioContext` → `ScriptProcessorNode` → `listener.pushFrame(frame, tMs)`). Falls back to the deterministic sim if mic/permission is absent.
- **listener-twin.js** — the browser mirror of `listener-real.mjs`. A byte-faithful IIFE transform (strip `export `, wrap in `(function(global){…})(window)`), NOT a hand-rewritten copy, so the browser math can never drift from the proven Node module. GENERATE the twin; don't hand-edit it.
- The same `events[]` stream both `measure()`/`finishDrill()` (Node) and the browser twin consume.

### 4. Voice-first practice controls — the differentiator

- The student **talks to the AI like it's a teacher**, not as a command parser.
- The student asks things like: "why does my C chord sound muted?", "can you show me that again slower?", "I keep missing the G string", "what's next?", "keep going".
- The AI responds **as a teacher** — via Chatterbox voice (MIT) — understanding the intent, giving a useful teaching response, not a generic "I didn't get that."
- This is the product's differentiator — a new way to learn guitar, fun, AI does what it can, the student learns through talking to a teacher.
- Voice license blocklist (Rule 9 / copyright): Chatterbox (MIT) = approved. ElevenLabs blocked for a paid app. Never re-propose.

### 5. The missing gate — end-to-end teaching interaction verification

The voice-first engine was claimed `[BUILT]` as of 2026-08-16, but the **gate** that proves it was still missing. The gate is NOT just a command-test suite. It is:

- **End-to-end teaching interaction verification:** student speaks a teaching question/command → the AI understands the intent (not just the literal words) → gives a useful teacher response via Chatterbox voice → the whole pipeline works on the `file://` UI.
- The gate proves the student can actually talk to the AI like a teacher and get a real teaching response, end-to-end, in the browser on the file:// delivery target (which has the same CORS/ES-module constraints as the rest of the practice UI).
- This gate is the thing that was missing — the engine existed but the verification that it works as a teaching experience was not in place.

### 6. Persistence — local-first store

- v1 practice persists fluency + weak-pair data to the device via a **local-first store**.
- `storage-adapter.mjs` is mirrored as `createStorageAdapterInline()` in the `file://` UI (localStorage + in-memory fallback).
- `PracticeStorageGlue.persist()` is called after every drill.
- `fluencyStore` has `toJSON()`/`load()`/`snapshot()` so the glue can hydrate across reloads.
- This local-first store is the v1 persistence layer. It **converges to ADR-0001's encrypted cross-device sync** when the app shell ships — same shape, so it does not need a rewrite when ADR-0001 lands.
- What's persisted (per the surviving skill + glossary): per-pair fluency state, per-chord confidence, practice session history, drill scores. All as data — the teacher cites these numbers (Rule 5), never freelances.

### 7. Seamless lesson-to-lesson continuation

- At the end of a lesson, the student does **not** have to leave the world, close the app, re-enter, and find the teacher again.
- They say **"keep going"** / **"next lesson"** / **"what's next?"** (voice-first) — and the next lesson starts in the **same world** with the **same teacher** (same voice, same look, same setting).
- A visible **"Next lesson ▶"** button is the fallback — for when the student prefers to tap, or when the mic is off.
- The world + teacher persistence is the same either way. This is what makes the app feel continuous — the teacher remembers you AND stays with you, lesson to lesson.
- This is also referenced as feature #21 in `PROPOSED-FEATURES.md`: "Seamless lesson-to-lesson continuation — REVENUE (anti-churn), low — '✓ Complete → Next lesson ▶' keeps student in the teacher's world. PWA-first."
- **No leaving/starting the world between lessons.** This is the anti-friction design — the student stays in the flow.

---

## Consequences

### Positive

- The practice lesson is structurally sound: 1:1 mapping + cumulative reinforcement means it survives scaling to 100+100 without drift (the generator builds scope from the same group→chord map it uses to introduce chords).
- The file:// UI with inline mirrors means the practice experience works offline on the student's device without a LAN server — matches the `AGENTS.md` delivery convention ("interactive, double-clickable file:// HTML, NOT localhost servers — their phone can't reach a local server").
- The listening engine is the default for chord-producing drills, with a clear exception (Air Changes) — no ambiguity about which drills need the mic.
- The mic permission model (once-per-session + global toggle + sim fallback) keeps flow intact and handles the no-permission case gracefully.
- Voice-first practice controls are the product's differentiator — the student learns guitar by talking to a teacher, not by tapping a screen. This is the "new way to learn" the owner wants.
- The missing gate (end-to-end teaching interaction verification) is now explicit — the engine existed but the proof that it works as a teaching experience was absent. This ADR names it so it gets built and verified.
- Seamless lesson continuation (voice-first + button fallback, world + teacher persistent) removes the "leave the world, come back, find the teacher again" friction between lessons. Anti-churn by design.
- The local-first store converges to ADR-0001 encrypted cross-device sync when the app shell ships — no rewrite needed.

### Negative / trade-offs

- **The missing gate is real and was genuinely unfinished as of 2026-08-16.** The engine was claimed built, but the proof that the student can actually talk to the AI like a teacher end-to-end on the file:// UI was not in place. This is a real gap to close — not a documentation issue.
- **listener-twin.js must be regenerated, not hand-edited.** If `listener-real.mjs` changes, the twin must be regenerated (byte-faithful IIFE transform). A hand-edited twin silently drifts from the proven Node module. The generated-inline-data-parity recipe (referenced in the skill) is the guard — that reference file did not survive the transfer, so the recipe needs to be re-created or re-confirmed.
- **The "≥3 options per lesson" is a minimum, not a target.** A lesson with exactly 3 options is compliant but thin. The menu is 11 drills; a richer lesson draws more. The minimum is a floor, not a goal.
- **Voice-first is the primary path, but the button fallback exists.** If the button is over-emphasized in the UI, the voice-first differentiator gets diluted. The UI should make voice the obvious path and the button the fallback, not the other way around.
- **Seamless continuation assumes the world + teacher are already persistent across lessons.** If World 1 (Emerald Hollow) + the teacher aren't built yet (they're Grill #4), the continuation feature has nothing to persist across. The feature is structurally ready; the world/teacher assets are the dependency.

### Neutral

- **The practice engine's test count (75 unit tests + 9 listener-real + 33 drills + 11 review-scheduler + 5 storage-adapter + 6 e2e-realmic)** is claimed in the surviving skill. The build code (`06-prototypes/practice-engine/`) did not survive the transfer — this ADR records the architecture and decisions; re-running the tests is a "repo restore" concern.
- **The 30/60 sensor** (`one-minute-changes.mjs`) counts clean chord *changes* in 60s (≥30 advance diagnostic, ≥60 goal). A change = two consecutive CONFIDENT strums that differ (mashing one chord = 0, low-confidence never counted). The listener contract expects `{ chord: <real name>|null, confident: bool, t }` — each strum matched against the KNOWN pair only.
- **Weak-pair review** (`fluency-store.mjs` + `practice-loop.mjs`) keeps on-device per-pair fluency with spacing-effect decay and selects the K=3 weakest pairs for a review session. The weakest pair per lesson is measured, not guessed.
- **Voice-first + seamless continuation both depend on the Chatterbox voice stack** (ADR-0004 / AMENDMENT-06). The voice license blocklist (Rule 9) applies to both — no ElevenLabs for a paid app.

---

## Open items

### From this grill (all closed)

All seven decisions are locked. No carry-forward open items from Grill #2 itself.

### Cross-grill dependencies (not blockers for this ADR)

- **ADR-0001 (encrypted sync):** the local-first store (decision #6) is v1; it converges to ADR-0001 when the app shell ships. The store shape is ADR-0001-ready. Don't block practice delivery on ADR-0001 being built.
- **ADR-0004 (the teacher — World 1):** seamless lesson continuation (decision #7) assumes the world + teacher are persistent across lessons. The feature is structurally ready; the Emerald Hollow world + teacher assets are the dependency (Grill #4 build).
- **The missing gate (decision #5):** end-to-end teaching interaction verification is a build + verify task (T-B6 in the tickets). It's explicitly named here so it's not forgotten or claimed "done" prematurely.

---

## Red lines inherited from AGENTS.md (always live)

- **Rule 5:** LLM writes prose only; cites stored numbers only. The AI teacher's voice responses cite stored mastery/confidence/practice data — never freelances a musical opinion. "Your C chord sounds muted" is a student statement the AI can address with data; "you're muting the G string" is a diagnosis the AI may not invent — it must come from the listening engine's actual output or be framed as a suggestion to check, not a claim.
- **Rule 9:** Voice license blocklist is copyright law. Chatterbox (MIT) = shipping voice for voice-first controls AND for the teacher's voice. ElevenLabs blocked for a paid app. Never re-propose.
- **Rule 2:** No camera, no hand tracking.
- **AMENDMENT-05:** Listening is BACK as the headline — constrained target-matching only, on-device, audio never uploaded. Voice-first controls use the mic for the student's voice (speaking to the AI), which is a different stream from the guitar audio (AMENDMENT-05 constrained listening). Both are on-device; neither is uploaded. The AI's voice response is generated (Chatterbox server-side or device `speechSynthesis` fallback) — not a recording of a real person.
- **AMENDMENT-06:** Realistic/photoreal avatars + Chatterbox IN SCOPE. The voice-first AI teacher is a Chatterbox voice — no cloning from a real person for v1.
- **AMENDMENT-11:** Longitudinal student memory is the practice engine's persistence layer (decision #6). This ADR implements the practice-delivery piece of that thesis.
- **AMENDMENT-15:** The 1:1 practice lesson → teaching lesson mapping (decision #1) is against the 25-lesson AMENDMENT-15 curriculum order. The mapping is structural — a generator that builds scope from the same group→chord map it uses to introduce chords cannot drift.

---

## Delivery note

Written in Hermes chat (Telegram + desktop). Grill rhythm: interview (one question at a time, plain language, suggestions offered) → ADR written → tickets → build → review, all in one chat. ADR-0002 is the on-disk record for Grill #2 on this machine; the original `02-spec/guitar-app-spec-PRACTICE-DELIVERY.md` did not survive the PC transfer.

The build code (`06-prototypes/practice-engine/`, `07-app/content/practice/*.json`, the file:// UI, the listener-twin.js) did NOT survive the transfer — this ADR records the architecture and decisions; re-verifying the claimed "75 unit tests / 17/0" is a "repo restore" concern, not something this ADR can prove on this machine.

END OF ADR.
