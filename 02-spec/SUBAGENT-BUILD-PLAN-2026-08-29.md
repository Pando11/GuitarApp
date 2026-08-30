# GuitarApp — Sub-Agent Build/Deploy Plan

**Date:** 2026-08-29
**Owner:** Heidi Hendrickson
**Companion to:** `02-spec/REDLINED-MASTER-PLAN-2026-08-29.md` (the decisions). This file = HOW to build them with parallel agents.
**Scope chosen by owner:** FULL app end-to-end, parallel workstreams.
**Discipline:** this is a PLAN. Building happens in separate sessions. Nothing here runs an agent yet.

---

## 0. How to read this

Work is grouped into **waves**. Agents inside a wave run in parallel (`delegate_task`, up to the concurrency cap). A wave starts only when its blocking wave is verified done. Two kinds of task can NOT be fully automated and are marked **[HITL]** (needs you) — everything else is **[AFK]** (agent alone).

Every agent must respect the legal floor (Rule 2/5/8/9) and verify its own output against the ship gates before reporting done. Agent self-reports are NOT trusted — each wave ends with a verification step you or I run.

---

## 1. Blockers first (must clear before the dependent waves)

| # | Blocker | Blocks | Type | Owner |
|---|---|---|---|---|
| B1 | **World-building-prompt skill run for Emerald Hollow** — produce the L2→L5 world brief (palette lock + `@Sage`/`@EmeraldHollow` locked instances). Decides the animated-character source. | Wave 3 (world factory) | **[HITL]** — you + Hermes in chat | Heidi |
| B2 | **Wan2.2-I2V finish downloading** on RunPod (currently ~12%). FLUX is done. | Wave 3 (asset generation) | **[AFK]** GPU task | agent + RunPod handoff |
| B3 | **Voice stack decision for live vs batch** — Chatterbox needs ~6GB VRAM (cloud GPU); Kokoro-82M is the CPU live fallback. Confirm which runs where. | Wave 2 (agent voice), Wave 3 | **[HITL]** quick confirm | Heidi |
| B4 | **PocketBase instance stood up** (local first, MIT, single binary). | Wave 2 (memory sync), Wave 4 (entitlement) | **[AFK]** | agent |

B1 and B2 can proceed in parallel right now. Nothing in Wave 3 starts until BOTH are done.

---

## 1.5 Wave 0 — THE DE-RISK VERTICAL SLICE (do this FIRST, before Waves 1–5)

**Owner directive (AMENDMENT-18, 2026-08-29):** build ONE beautiful Emerald Hollow slice first, test it on 5-10 real beginners, before committing to the full build. The slice must prove all three at once + secretly run the real-phone listening test.

- **A0.1 [HITL]** Run the world-building-prompt skill (= blocker B1) to get the Emerald Hollow porch brief. This is the true first action — nothing renders without it.
- **A0.2 [AFK]** Build the slice: teach ONE real chord (real learning), set on the Emerald Hollow porch that REACTS (BI-2), with a fast proud-sound cold open (BI-3), and ONE memory beat where Sage greets the student remembering last time (BI-4 via **Layer 2 Story Memory on LOCAL storage** — reads the existing practiceStore; comeback = >7 days; ADR-0005). Register picked at onboarding (BI-5).
- **A0.3 [AFK]** Wire the on-device listening engine into the slice so it grades the one chord (BI-6). Fingering overlay from verified chord data (Rule 8).
- **A0.4 [HITL]** Real-beginner test (5-10 people, own phones). Score the 3 yes/no's:
  1. Can they play the chord AFTER? (real learning)
  2. Did they smile / want to keep going? (fun)
  3. Did Sage HEAR them correctly on their own phone? (the load-bearing risk)

**Wave 0 exit gate:** all three yes across the testers → full build is de-risked, proceed to Wave 1. If the listener fails on real phones → STOP and fix the listener before anything else (cheapest possible place to learn it).

---

## 2. Wave 1 — Foundation & truth-up (parallel, no blockers)

Goal: get the repo to a clean, all-green, drift-free baseline so build agents stand on solid ground.

- **A1.1 [AFK] Ratify + re-sync** — flip AMENDMENT-17 / ADR-0004 to "ratified 2026-08-29" (+ world-building-prompt routing), then re-sync the 3 pointers (AGENTS.md, README, HANDOFF) and re-run all 3 ship gates. Fix the stale ADR-0004 "scaffold NOT present" line.
- **A1.2 [AFK] Spec cleanup** — update song-count wording 10→11 across spec; note SP11 Amazing Grace = PD.
- **A1.3 [AFK] Rebuild practice-remix prototype** — re-create `06-prototypes/practice-engine/practice-remix-q5-prototype.html` from the resolved ticket spec (G↔D weak spot, three framings). Throwaway, matches the two surviving prototypes.
- **A1.4 [AFK] Promotion-path audit** — verify the 20 authoring lessons (`05-content/`) map correctly to the 25 shipping lessons (`07-app/content/lessons/`) after the AMENDMENT-15 re-sequence. Report mismatches; do not "fix" data silently.

**Wave 1 exit gate:** all 3 ship gates green + 3 pointers agree + prototype exists + promotion audit clean.

---

## 3. Wave 2 — App core & backend (parallel; needs B3, B4)

Goal: the PWA shell + the agent brain + memory, all runnable locally.

- **A2.1 [AFK] PWA shell hardening** — `07-app/app.js` + service worker + manifest; confirm `?dogfood=1` start_url gotcha; live-server smoke test (renderer, tuner, lesson player).
- **A2.2 [AFK] Agent (Sage) as lesson director + FORWARD-COACHING BRIDGE (BI-7, G1 — headline)** — wire `teacher.js` + `chatEngine.js` + `voice-command.js` to the 3-layer memory; build the Rule-5-safe generator that reads practiceStore numbers → emits Sage's forward-coaching line ("your Em took 5 tries last week, 2 today"), NEVER freelancing. This bridge is THE product (today teacher.js copy is cosmetic + walled off from data). Voice via B3's decision.
- **A2.5 [AFK] Always-visible backup answer buttons (BI-8, G3)** — every lesson shows self-report "Got it" / "Not yet" buttons on screen at all times (mic working or not), so a student is NEVER hard-blocked by the microphone. Student honestly tells Sage how it went; lesson moves on. Also seeded in the Wave 0 slice. NOTE: this gives memory two data sources (mic-heard vs student-said) — see ADR-0005.
- **A2.3 [AFK] PocketBase memory sync (Layer 3, ADR-0005)** — schema for encrypted student blob (ciphertext only), push-at-session-end / pull-on-open, client-side crypto handshake, 4–6 word recovery phrase at 2nd device (ADR-0001). Wraps Layer 1 (practiceStore) + Layer 2 (Story Memory, already built local in Wave 0). Built AFTER the Wave 0 slice validates the magic.
- **A2.4 [AFK] Entitlement/subs stub** — PocketBase + RevenueCat entitlement store (`entitlementStore.js`), no real payments yet.

**Wave 2 exit gate:** app boots on file:// + localhost; Sage speaks from stored numbers; memory round-trips ciphertext through PocketBase; entitlement gate flips.

---

## 4. Wave 3 — World factory pipeline (needs B1 + B2 done)

Goal: Emerald Hollow + Sage real on screen for World 1. **This is the wave that consumes the world-building-prompt brief.**

- **A3.1 [AFK] FLUX stills** — from the B1 brief, paint Emerald Hollow scenes + Sage character sheet (front/back/face on plain bg — L5 locked instance, no averaging).
- **A3.2 [AFK] Wan2.2 motion** — animate the stills (slow dolly/pan per the warm-world refs, NOT whip-cuts). Sage playing, fretboard overlay carries accuracy.
- **A3.3 [AFK] Chatterbox voice** — Sage's lines from the VOICE field of the brief; Kokoro CPU fallback for live.
- **A3.4 [AFK] Godot world assembly** — drop assets into the wired scaffold (`lesson/` + `world/`); lesson triggers as a scene when student reaches `@Sage`; porch scene (Level 1) first.
- **A3.5 [AFK] Fingering overlay accuracy** — FingeringOverlay driven from `chord-theory-check.js` verified data, never free-drawn (AMENDMENT-10 + Rule 8).

**Wave 3 exit gate:** one playable Emerald Hollow porch scene, Sage animated + speaking, fretboard overlay arithmetic-correct. (This is also the natural "vertical slice" proof even though full scope was chosen.)

---

## 5. Wave 4 — The five AI features (parallel; needs Wave 2, some need Wave 3)

- **A4.1 [AFK] Song discovery by taste** — two-lane match on the 11-song catalog + taught-chord set from PocketBase memory; voice-primary; disclaimer + PD flag.
- **A4.2 [AFK] Call-and-response jam** — ACE-Step/YuE generative round-trip (on-device listen → facts to cloud → audio back); AI grades against known chords; weaves into lessons. (Shares pipeline w/ Path B duet.)
- **A4.3 [AFK] Stylistic explorer** — strum/rhythm one bar w/ counts, style-as-category, within-lesson.
- **A4.4 [AFK] Celebration moments** — stored-number recap + backing groove + Sage voice; push as lesson opener; OS share sheet; two-layer privacy.
- **A4.5 [AFK] Practice remix** — six framings on the adaptive plan; engagement-data-only sequencer.

**Wave 4 exit gate:** each feature demoable against real on-disk content + memory; Rule 5 held (no invented praise); every song screen shows the disclaimer.

---

## 6. Wave 5 — Integration, gates, dogfood (needs Waves 3+4)

- **A5.1 [AFK] Full ship-gate sweep** — chord, curriculum-order, song-progression, fidelity, app-smoke, sw-cache, band, voice. All green + proven-to-bite.
- **A5.2 [HITL] Real-device mic dogfood** — install PWA on phone (`?dogfood=1`), verify listening + voice-first on real hardware. **Cannot be done headlessly — needs you.**
- **A5.3 [HITL] Human lyric read-through** — every song's hint/reveal text read by a human for paraphrased-lyric leaks (AMENDMENT-14 CRITICAL; regex can't catch it).
- **A5.4 [AFK] Counsel-prep pack** — assemble the legal position (trademark disclaimers, PD flags, progression-risk note) for counsel sign-off before paid launch.

**Wave 5 exit gate:** green gates + real-device pass + human lyric read-through signed + counsel pack ready.

---

## 7. Dependency graph (quick view)

```
Wave 1 (foundation)  ──►  Wave 2 (app+backend)  ──►  Wave 4 (5 features) ──►  Wave 5 (integ/dogfood)
                                                          ▲
B1 [HITL world brief] ─┐                                  │
B2 [Wan download]    ──┴─►  Wave 3 (world factory)  ──────┘
B3 [voice where] ──► Wave 2/3
B4 [PocketBase up] ──► Wave 2/4
```

---

## 8. Concurrency & safety notes for the build sessions

- Use `delegate_task` for the AFK agents; give each the redlined master plan + the relevant ticket as context (children know nothing of chat history).
- Spawn code-editing agents with git worktree isolation (`-w`) to avoid conflicts when several touch `07-app/`.
- **Verify every child's claim** — an agent saying "gate green" is a self-report; re-run the gate yourself. External side effects (assets generated on RunPod, PocketBase rows) need a verifiable handle (path, row count), not a claim.
- The RunPod pod is $0.57/hr — Wave 3 agents must stop the pod when the sync/generation finishes (per the RunPod handoff).
- HITL gates (B1, B3, A5.2, A5.3) block their waves — schedule them with Heidi, don't let an agent fake them.

---

*Plan only. No agent has been spawned. When you say "start building," Wave 1 is the entry point.*
