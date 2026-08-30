# Spec — Curriculum Architecture: Sequencing Model Derived from Competitor Evidence

**File:** `spec-curriculum-arch.md`
**Date:** 2026-08-13
**Author:** Hermes (subagent, report-derived analysis)
**Source evidence:** `~/scraping-stack/harvester/out/FINAL_curriculum_arch.jl` (18 rows)
**Companion docs:** `02-spec/guitar-app-first-20-lessons-2026-08-05.md` (Model A plan), `02-spec/guitar-app-spec-AMENDMENT-11.md` (world-locked teacher + longitudinal memory + duet)

---

## 0. Scope & guardrails (HARD rules that bound this spec)

This spec is about **lesson ORDERING/SEQUENCING**, not chord content.

- **No chord data exists in the source.** In all 18 rows of `FINAL_curriculum_arch.jl`, the `chord_mention` field is *identical to* `title` (one row differs only by surrounding whitespace: `\n Courses \n`). **Zero rows contain an actual chord symbol.** This file is therefore evidence for *structure*, never for chords, voicings, or progressions. Do not cite it as a chord source.
- **Do not invent chords.** Because the source carries none, this spec never infers chord symbols for the competitor and never fills GuitarApp lesson content with fabricated chords. GuitarApp's chord truth comes only from `06-prototypes/step0/schema/chord-theory-check.js` (arithmetic proof) — per AGENTS.md Rule 8.
- **Legal line (intact):** SONGS lessons use ORIGINAL 8-chord loops only. Song *names* and *structure* are facts (permitted); tabs/lyrics/audio are never scraped or reproduced. chord voicings = chord *shapes* (facts). public_domain = title catalog only.
- **Listening:** constrained target-matching only, on-device, audio never uploaded (AMENDMENT-05; the former AGENTS Rule 4/7 citation was deleted by owner 2026-08-16, but the constrained, on-device design remains).
- This is a **report-derived** analysis, not an AMENDMENT. It does not change bound decisions; it proposes a sequencing convention for skill tracks.

---

## 1. Evidence base — what the 18 rows actually contain

Verified by reading every row (not trusting the count). The 18 rows decompose as:

| # | `title` | Row type |
|---|---------|----------|
| 1 | `Courses` | Hub/nav (course landing) |
| 2 | `Courses` | Hub/nav |
| 3 | `Get Started` | Nav label |
| 4 | `Rock Rhythm 01 - Introduction` | **Lesson 01** |
| 5 | `Rock Rhythm 02 - Getting The Sound` | **Lesson 02** |
| 6 | `Rock Rhythm 03 - The 'Chicka' technique` | **Lesson 03** |
| 7 | `Rock Rhythm 04 - Rhythm Guitar Slides` | **Lesson 04** |
| 8 | `Rock Rhythm 05 - Most Common Rock Rhythm` | **Lesson 05** |
| 9 | `Rock Rhythm 06 - The Early 'One'` | **Lesson 06** |
| 10 | `Rock Rhythm 07 - String Muting` | **Lesson 07** |
| 11 | `Rock Rhythm 08 - Chromatic Run` | **Lesson 08** |
| 12 | `Rock Rhythm 09 - Hammer Ons Riff` | **Lesson 09** |
| 13 | `Rock Rhythm 10 - Quick Rhythm Run` | **Lesson 10** |
| 14 | `Rock Rhythm 11 - Classic Rock n Roll Riff` | **Lesson 11** |
| 15 | `Rock Rhythm 12 - 12 Bar Blues in All 12 Keys` | **Lesson 12** |
| 16 | `Rock Rhythm 13 - How To Write A Rock Riff` | **Lesson 13** |
| 17 | `Rock Rhythm 14 - How To Write A Rock Riff - Part 2` | **Lesson 14** |
| 18 | `Octave techniques for Rock Guitar` | **Bonus (unnumbered)** |

- **14 numbered lessons** (rows 4–17) carry the real sequence.
- **Rows 1–3** are scrape noise (course hub + "Get Started" nav) — not lessons.
- **Row 18** is an unnumbered *bonus/advanced* video hanging off the end of the path.

**Conclusion:** the durable asset is the *lesson-title sequence* of Andy Guitar's "Electric Guitar Level 2 — Rock Rhythm" course. It tells us **how a proven paid course is ordered**, with no chord dependency.

---

## 2. Extracted sequencing pattern (the competitor shape)

Grouping the 14 numbered lessons by pedagogical intent:

| Phase | Lessons | What it does |
|-------|---------|--------------|
| **A. Frame** | RR01 Introduction, RR02 Getting The Sound | Set context + gear/tone. No technique yet — just "here's the goal, here's how to sound right." |
| **B. Isolated techniques** | RR03 Chicka, RR04 Slides, RR05 Most Common Rock Rhythm, RR06 Early 'One', RR07 String Muting, RR08 Chromatic Run, RR09 Hammer Ons, RR10 Quick Rhythm Run | **One discrete, reusable building block per lesson.** RR05 is the *spine* pattern (the "most common" rhythm) but is still taught as a single concept; the rest are pure micro-techniques. |
| **C. Combined application** | RR11 Classic Rock n Roll Riff, RR12 12 Bar Blues in All 12 Keys | Recombine the isolated blocks into **real musical output** (a riff, a full 12-bar progression across keys). |
| **D. Synthesis / create** | RR13 How To Write A Rock Riff, RR14 …Part 2 | Capstone: the learner **becomes the creator**, not just a repeater. |
| **E. Bonus (advanced)** | Octave techniques (unnumbered) | Optional stretch content *off* the main numbered path. |

### The shape, stated plainly

```
FRAME (context + tone)
   ↓
ISOLATED TECHNIQUES  (one concept per lesson — the bulk of the course)
   ↓
COMBINED APPLICATION (recombine blocks into riffs / progressions)
   ↓
SYNTHESIS / CREATE   (learner writes their own)
   ↓
BONUS (optional advanced, unnumbered)
```

This is exactly the **`intro → isolated technique → combined`** arc named in the task brief, extended with a **synthesis capstone** and an **optional bonus** tail.

**Why it works (inference from structure, not from chord data):** each isolated lesson is a *reusable vocabulary item*. Combined lessons have no new primitives — they only *recombine* what was already drilled. That means a student can never hit a combined lesson and find an unexplained technique. The capstone then converts consumption into production, which is the strongest retention/identity moment.

---

## 3. The pattern generalized into a reusable template

Strip the domain and the shape is a 5-stage template any **skill track** can adopt:

1. **Frame** (1–2 lessons): purpose + setup/tone/gear. Low cognitive load.
2. **Isolate** (N lessons, N≈6–8): one self-contained concept each; each ends with a constrained listening/tempo check.
3. **Combine** (2–3 lessons): recombine the isolated blocks into musical material — no new primitives.
4. **Synthesize** (1–2 lessons): the learner produces their own (riff / progression / pattern).
5. **Bonus** (optional, unnumbered): advanced stretch, explicitly off the critical path.

---

## 4. Proposal — how GuitarApp should sequence its own lessons

### 4.1 Two sequencing models the competitor actually uses (evidence-corrected)

GuitarApp's existing `guitar-app-first-20-lessons` plan cites *"Andy's fast-song wins + Justin's technique-order rigour."* Reading the real `FINAL_curriculum_arch.jl` shows Andy deploys **two distinct models**, and the plan currently uses only one:

- **Model A — Song-first hook.** Andy's famous beginner course opens with a 2-chord song (the 38M-view "first lesson"). GuitarApp's L1–L20 plan already uses this: a 2-chord song by **L3**, core open chords by **L10**. Retention hook first, systematic build second.
- **Model B — Technique-scaffold.** The *Rock Rhythm 01–14* course in this file: **Frame → Isolate → Combine → Synthesize → Bonus** (Section 2). No early song; the payoff is deferred until the isolated blocks are drilled.

**Recommendation:** Keep **Model A** for the absolute-beginner **Onboarding / Chord track** (it is already spec'd and is the right retention play). Adopt **Model B as the canonical shape for every DEDICATED SKILL TRACK** — rhythm/strumming, lead, fingerpicking, theory, blues. Those tracks should *not* open with a song; they should open by isolating the building blocks, exactly as the competitor's paid skill course does.

### 4.2 Concrete GuitarApp track template (the "Isolate → Combine" loop)

For each skill track, author to the 5-phase template:

| Phase | GuitarApp lesson count | Per-lesson requirement |
|-------|------------------------|------------------------|
| Frame | 1–2 | Goal + setup; no new primitive. |
| Isolate | 6–8 | **One concept each.** Each lesson carries a constrained listening check (on-device chord/tempo match) per AMENDMENT-05 (the former AGENTS Rule 4/7 citation was deleted 2026-08-16). |
| Combine | 2–3 | Recombine *only* previously isolated blocks into musical material (original 8-chord loops for the SONGS track). |
| Synthesize | 1–2 | Learner produces original material; teacher coaches forward from stored mastery. |
| Bonus | 0–1 (unnumbered) | Optional advanced; off critical path. |

### 4.3 Worked example — a GuitarApp "Rock Rhythm" track mirroring the competitor shape

This maps the competitor's phases onto GuitarApp's *own* verified content. **No chords are invented** — rhythm/technique tracks need none; where a chord appears it is pulled from `chord-theory-check.js`, never from the competitor file.

| Competitor (evidence) | GuitarApp "Rock Rhythm" lesson (Model B) | GuitarApp twist |
|-----------------------|-------------------------------------------|-----------------|
| RR01 Introduction | **R1 — Welcome to Rhythm:** what rock rhythm is, why it matters | World-locked teacher sets the scene (AMENDMENT-11 §1) |
| RR02 Getting The Sound | **R2 — Tone & Pick:** dial a clean/distorted tone, hold the pick | Constrained listening: match target tempo on open strings |
| RR03 Chicka | **R3 — The Chicka (palm-mute scratch)** | Listening check: detect muted vs open strum |
| RR04 Slides | **R4 — Slides into chord changes** | Isolated; no song yet |
| RR05 Most Common Rhythm | **R5 — The Core 8th-note pattern** (spine) | The anchor pattern everything recombines around |
| RR06 Early 'One' | **R6 — Anticipating the beat** (the early "1") | Timing nuance; metronome-gated |
| RR07 String Muting | **R7 — String muting / damping** | Isolated technique |
| RR08 Chromatic Run | **R8 — Chromatic fills** | Isolated technique |
| RR09 Hammer Ons | **R9 — Hammer-on riff fragment** | Isolated technique |
| RR10 Quick Rhythm Run | **R10 — Quick rhythmic run** | Isolated technique |
| RR11 Classic Rock n Roll Riff | **R11 — Your first riff** (recombine R3/R5/R7/R9) | **Combine phase** — no new primitives |
| RR12 12 Bar Blues in All 12 Keys | **R12 — 12-bar in multiple keys** (recombine R5/R6/R8) | **Combine phase 2**; original loop, key-transposed |
| RR13–14 How To Write A Rock Riff | **R13–R14 — Write your own riff** (Synthesize) | Teacher coaches forward from stored `mastery` (Red Line 2) |
| Octave techniques (bonus) | **R15 (Bonus) — Octave doubles** | Optional, unnumbered |

This demonstrates the template is drop-in: the competitor's 14-lesson arc becomes GuitarApp's R1–R15 with the same pedagogical skeleton and GuitarApp's longitudinal/duet features layered on top.

### 4.4 Integration with AMENDMENT-11 (world-locked teacher + longitudinal memory + duet)

The Isolate→Combine loop is precisely what the longitudinal memory is built to feed:

- **Forward coaching across phases.** The teacher reads the per-student profile (`{technique/chord: mastery, last_lesson, weak_spots}`, Red Line 1) and says e.g. *"Last lesson you isolated string-muting — now in R11 we recombine it into a riff."* This is generated **from stored mastery numbers**, never from LLM vibe (Red Line 2 / Rule 5).
- **Phase-aware difficulty.** Weak spots detected during an *Isolate* lesson's listening check can be re-inserted before the *Combine* phase — the memory makes the linear template adaptive per student.
- **Duet as the ultimate "Combine."** The teacher–student duet (AMENDMENT-11 §1.3) is the emotional close of the arc and is gated on the listening engine being proven (Red Line 3). It is the competitor's "combined application" stage taken to its conclusion — teacher plays a beat ahead, student plays along.

---

## 5. Chord-data caveat — where GuitarApp chord truth lives

- `FINAL_curriculum_arch.jl` contains **no chords** (`chord_mention == title` in all 18 rows). It is structure-only evidence.
- GuitarApp chord correctness is sourced **exclusively** from `06-prototypes/step0/schema/chord-theory-check.js` (arithmetic proof of spelling + playability; ship gate `node run-chord-check.js` → 0 errors/0 warnings, AGENTS Rule 8). Curriculum sequencing here is *technique-ordered*; chords attach per-lesson from the verified schema, never from this competitor file.
- The **SONGS track** uses original 8-chord loops; song names/structure are facts; tabs/lyrics/audio are never scraped (legal line).

---

## 6. Recommendations & open items

1. **Adopt the 5-phase template (Frame → Isolate → Combine → Synthesize → Bonus) as the canonical shape for all dedicated GuitarApp skill tracks**; keep Model A (song-first) only for the beginner Onboarding/Chord track.
2. **Promote rhythm/strumming to its own Model-B track.** Today rhythm is folded into L11–L14 of the chord-centric First-20 plan. Evidence shows a proven paid course isolates rhythm technique *before* combining it — GuitarApp should mirror that with an R1–R15 track (Section 4.3).
3. **Build the per-student progress-profile module (AMENDMENT-11 Red Line 1).** It is the missing piece that turns the linear Isolate→Combine template into an adaptive, teacher-remembered loop.
4. **Gate the duet behind listening-engine ship + calibration (Red Line 3)** — the duet is the "Combine" payoff, not a v1 promise.
5. **No further scrape of the competitor is required** for sequencing: the title/order evidence is already captured. If real chord symbols in competitor lessons are ever wanted, that needs descending into each lesson page (out of scope; not needed — GuitarApp uses its own verified chord data).

---

*End of spec. Evidence: `FINAL_curriculum_arch.jl` (18 rows, read in full). No chords were present or invented. Legal line and AGENTS.md HARD rules preserved throughout.*
