# ADR-0005 — Teacher's Memory: Three-Layer Architecture

**Status:** ACCEPTED (2026-08-29 by owner Heidi)
**Related:** ADR-0001 (always-on encrypted sync), AMENDMENT-11 (longitudinal student memory + Red Lines), AMENDMENT-18 (BI-4 emotional continuity), `02-spec/guitar-app-spec-STUDENT-MEMORY.md`, `07-app/core/practiceStore.js`.
**Legal floor:** Rule 5 (LLM prose-only, cites stored numbers), Rule 9 (license blocklist), Rule 2 (no camera/hand tracking). Unchanged.

---

## Context

The teacher's memory is the load-bearing piece of the product (AMENDMENT-11: "a teacher who remembers you and coaches forward"). The question "how do we build it?" was raised 2026-08-29. Investigation of the repo found most of it already exists — so this ADR records the ARCHITECTURE (three layers), what's built vs. new, the build order, and the rejected alternative (Obsidian / note-tools).

---

## Decision: three layers, built bottom-up

### Layer 1 — SKILL MEMORY (the numbers) — ALREADY BUILT
`07-app/core/practiceStore.js` (148 lines, ported + tested). Tracks per canonical chord: clean/fail/unsure counts, state (untried/learning/struggling/clean), streaks (current + longest), lesson completion, help requests ("you asked about X"), practice tempo. This is the Rule-5 data source. **Do not rebuild — build on it.**

### Layer 2 — STORY MEMORY (the meaning) — NEW BUILD (AMENDMENT-18 BI-4)
A thin layer that READS Layer 1 and derives a few emotional facts. Not new tracking — interpretation of data already stored:
- **Milestones** — first chord ever cleaned, first song played, new longest-streak record (`longestStreak()` exists; flag when beaten).
- **Comeback** — gap between the last two session timestamps. **> 7 days away = comeback flag** (owner, 2026-08-29) → Sage: "you're back — I kept your spot." (Pure subtraction on timestamps already in the store.)
- **Nemesis chord** — the chord with the most fails before it finally reached `clean`. (`getSkillMap()` has fail counts; find the max that later cleaned.) When beaten, Sage makes a moment of it.

Estimated ~60–80 lines that read the store and output flags. Small build, but it is the ENTIRE emotional payload of the app. All output is data → prose via templates (Rule 5 holds; no freelancing).

### Layer 3 — SYNC + PRIVACY SHELL (memory follows you, safely) — NEW BUILD (ADR-0001)
Encrypt the Layer 1 + Layer 2 blob on-device with a key only the student's devices hold. Push at session end, pull on app open. PocketBase stores ONLY ciphertext (zero-knowledge). Recovery = 4–6 word phrase set when adding a 2nd device. No server-side key custody.

---

## Build order (owner-approved 2026-08-29)

**Layer 2 (Story Memory) on LOCAL storage FIRST — encrypted sync (Layer 3) AFTER the Wave 0 slice proves the magic.**

Rationale: Story Memory is what makes the app feel magic and it works fine on one device (practiceStore is already local, "Ban 5: ZERO network"). Encrypted cross-device sync is important plumbing but makes an already-magic thing portable — it should not block the magic. Building sync first = weeks of crypto before Sage ever says one thing that gives someone chills. So the Wave 0 slice's "Sage remembers" beat runs on local Story Memory; Layer 3 follows once the slice validates.

---

## Privacy guardrail (sacred — from STUDENT-MEMORY.md "Banned")

Story Memory derives ONLY from playing data (fails, timestamps, streaks, lesson completion). It must NEVER drift into psychological/behavioral inference ("you practice when you're sad," "you seem like a visual learner"). Comebacks and nemesis chords are FACTS ABOUT THE GUITAR; moods and personality are BANNED (AMENDMENT-11 §4 scope cap, STUDENT-MEMORY.md). v1 memory cap holds: last 3 lessons + per-chord mastery + assigned practice + the derived story flags.

## Two data sources: mic-heard vs. student-said (BI-8, 2026-08-29)

Because the app ALWAYS shows self-report "Got it"/"Not yet" buttons (BI-8), memory records two kinds of signal that can disagree: what the listening engine MEASURED (mic-heard) and what the student SAID (self-report). Handling:
- Both are stored; neither is discarded.
- Self-report is trusted as the student's honest self-judgement; mic data is the measured signal.
- The forward-coaching generator (BI-7) and Story Memory must NEVER call the student a liar when the two disagree (e.g. "Got it" tapped on a buzzy chord). Sage coaches gently from what it knows, citing stored numbers under Rule 5, and leans on self-report when the mic had no clean read.
- A disagreement is a coaching signal ("let's double-check that one together"), never an accusation. Not a blocker — a design rule for the generator.

---

## Alternative rejected: Obsidian / general note-tools for student memory

Considered 2026-08-29, REJECTED. Reasons:
1. **Breaks zero-knowledge privacy (dealbreaker)** — Obsidian sync stores human-readable notes; ADR-0001 requires encrypted, server-unreadable storage. Putting a (possibly child) student's practice history into a general note-sync service crosses the exact privacy line the app was built to honor.
2. **Wrong shape** — memory is structured data ({chord: confidence 0–100, streaks, fails}); the teacher code reads it as data. Markdown prose would force parse-back-to-numbers on every read.
3. **Outside dependency** — Obsidian sync is a paid third-party service; violates the free + MIT/Apache + no-recurring-fee discipline (Rule 9 spirit).

**The valid use of note-tools:** organizing the OWNER's own build/planning notes (the `.scratch/` maps, spec docs) — not storing students' data. That split is fine.

---

## Consequences

- Wave 0 slice gains a concrete "Sage remembers" implementation: local Story Memory reading practiceStore.
- A new build item sequence: Layer 2 (local) → validate in slice → Layer 3 (encrypted sync).
- No new third-party dependency; stays on the locked stack.
