# GuitarApp — Gap Register (open questions + improvements)

**Date:** 2026-08-29
**Owner:** Heidi Hendrickson
**Companion to:** `REDLINED-MASTER-PLAN-2026-08-29.md` + `SUBAGENT-BUILD-PLAN-2026-08-29.md`.
**Source:** Boris two-view gap-hunt (plan claims vs. what the app needs to ship + make money), reading the code, specs, competitor intel, and complaints research. Ranked by how badly each can hurt.

**Legend:** `[DECIDED]` owner ruled 2026-08-29 · `[OPEN]` needs an owner decision · `[TODO]` build/verify task.

---

## CORRECTED GROUND TRUTH (verified on disk 2026-08-29)

**Lessons: DATA authored, ZERO produced.** 25 lesson JSONs exist with chords/exercises/coaching copy/Q&A (the *script*). But NOTHING is produced as the animated + voiced + in-world experience a student sees: `assets/` (FLUX/Wan output) is empty, only 8 proof-of-concept voice wavs from one old lesson exist, the Godot world is a code skeleton with no real art. So "no lessons are built yet" is TRUE in the way that matters — the data is a script; nothing's been filmed. First-launch scope = "how many lessons do we PRODUCE," starting from zero.

---

## TIER 1 — CAN KILL THE APP (resolve before/at Wave 0)

### G1 — The "coaches forward" bridge is not built `[DECIDED — headline build item]`
`teacher.js` today emits COSMETIC pre-written strings, hard-walled from ever touching chord/lesson data (a coded invariant). `practiceStore.js` holds the numbers. **Nothing connects them.** The whole thesis (AMENDMENT-11) and the #1 competitor edge (complaint #3: "nobody remembers you") is Sage saying "your Em took 5 tries last week, 2 today." That Rule-5-safe forward-coaching generator — reads stored numbers → emits the coaching line, never freelancing — IS the product.
**Owner decision (2026-08-29):** build it as a TOP build item. → Added as build item **BI-7** and a Wave 2 task.

### G2 — Listening-engine real-world accuracy is assumed, never measured `[OPEN]`
Complaint #1 (what beginners hate most): "app says I'm wrong when I'm right." Our answer ("constrained matching") is a design claim, not a measured number. We have NO accuracy figure for a beginner's buzzy chord on a cheap phone in a noisy room. Wave 0 measures it — but the plan must state: **what accuracy % is "good enough to ship," and what's plan B if we miss it?**
**Needs owner input:** the pass bar. (Suggested starting bar: ≥90% correct-accept on a clean chord, <5% false-reject — tune after Wave 0 data.)

### G3 — Backup answer buttons so the student is never blocked `[DECIDED — always-visible self-report buttons]`
Some beginners will fail the mic (bad phone, loud room, out-of-tune guitar). A student must NEVER be hard-blocked by the microphone.
**Owner decision (2026-08-29, refined):** the screen ALWAYS shows backup answer buttons — **self-report "Got it" / "Not yet"** — on every lesson, mic working or not (not a fallback that only appears on mic failure). The student honestly tells Sage how it went and the lesson moves on. → build item **BI-8**.
**Design note (for ADR-0005 memory):** memory now has TWO data sources — what the mic HEARD vs. what the student SAID (self-report). They can disagree (a student taps "Got it" on a buzzy chord). The Story Memory + forward-coaching generator (BI-7) must handle both gracefully and never call the student a liar; self-report is trusted as the student's honest judgement, mic data is the measured signal. Not a blocker — a design consideration.

---

## TIER 2 — COSTS MONEY / BLOCKS LAUNCH (resolve during build)

### G4 — Pricing / paywall placement / free-trial shape undecided `[OPEN — deferred by owner]`
21 monetization ideas, zero pricing decisions. What's free vs paid, when the paywall appears (critically: before or after the first "I can play!" moment), trial length.
**Owner decision (2026-08-29):** DEFER — pricing comes after the Wave 0 slice proves people want it. Revisit post-slice. (Old target on record: $12/mo, 450 subs.)

### G5 — App Store subscription path (rule 3.1.2) unconfirmed for PWA-first `[TODO]`
`03-research/appstore/app-store-3.1.2-risk.md` flags subscription-app rejection risk. We're PWA-first — confirm the PWA→App Store path even works for a PAID app before committing to it. A rejection = weeks lost. Verify before Wave 5.

### G6 — Legal counsel sign-off is an unscheduled launch gate `[TODO]`
AMENDMENT-14: distinctive song progressions tied to famous recordings need counsel sign-off before PAID launch (Williams v. Gaye). Plan has a "counsel-prep pack" but no actual lawyer, budget, or timeline. Cannot take money for the song track until done. Real-world lead time — schedule early.

---

## TIER 3 — QUALITY / RETENTION (resolve as you go)

### G7 — First-launch produced-lesson scope `[DECIDED — staged from zero]`
25 lesson JSONs (data) exist; 0 produced. Producing animated+voiced lessons is heavy GPU time.
**Owner decision (2026-08-29):** STAGE from zero — slice = 1 produced lesson; then Level 1 (~5-6) for first launch; full 25 produced later. → Reflected in Wave 0 → Wave 3 sequencing.

### G8 — World-factory cost ceiling unknown `[OPEN]`
FLUX + Wan on rented GPU costs real money per produced lesson. Research has a cost model; the plan has no budget cap.
**Needs owner input:** max spend to produce World 1 (a number, so the GPU bill isn't open-ended).

### G9 — Age / parent-setup / accessibility `[DECIDED — deferred to before-public-launch; NOT a slice concern]`
BI-5 handles Sage's tone (kid vs adult register). Age gating, parent-setup, and COPPA (US law: parental consent required to collect personal data from under-13s) were raised as v1 questions.
**Owner decision (2026-08-29):** the FIRST build (Wave 0 slice) is a PRIVATE trial — just the owner + a couple of friends she personally knows, to see if the app works and feels good. Not public, no strangers, no selling, no unknown kids. At that stage COPPA / age-gate / parent-setup do NOT apply (a private test among known adults is not public data collection). So **build NO age/parent machinery now.**
**REQUIRED GATE before any PUBLIC or PAID launch (do not skip):** decide minimum age (owner leaned 13+ for self-signup), whether under-13s are allowed via a parent-held account, COPPA parental-consent flow if kids are in scope, App Store age rating, and accessibility (reading level, button size, text-vs-voice for pre-readers, parent-setup flow). Revisit AFTER the private trial tells us the app is worth selling. Owner will return with what worked, then the legal/age work happens before money or public users.
**Reconciles the "both ages" vision:** the 10-year-old audience is NOT dropped — it's staged. The private slice is adults-who-know-each-other; the kid experience (BI-5 register + kids mode + parent accounts) is designed fully at the before-launch gate, not now. Don't pre-build it (owner: "deal with kids mode fully when we get there").

---

## New build items created from this register
- **BI-7** Forward-coaching generator (Rule-5 bridge: practiceStore numbers → Sage's coaching line). Headline. [G1]
- **BI-8** No-mic fallback (tap-to-confirm / silent path so the mic never hard-blocks). [G3]

## Open decisions still owed by owner
- G2 listening-engine pass bar (after Wave 0 data)
- G8 world-factory budget cap
- G4 pricing (deferred until after slice)

## Before ANY public or paid launch (required gates — not slice concerns)
- G9 age / parent-setup / COPPA / App Store age rating / accessibility — decided AFTER the private trial (owner returns with what worked, then legal/age work happens before selling or public users).
- G5 App Store subscription path (rule 3.1.2) verified.
- G6 legal counsel sign-off on the song track (Williams v. Gaye risk).
- G4 pricing finalized.

**Scope reminder (owner, 2026-08-29):** the first build is a PRIVATE trial — owner + a couple of known friends — to see if the app works. Not public, no selling. All launch/legal/age gates come AFTER that trial validates the app is worth selling.
