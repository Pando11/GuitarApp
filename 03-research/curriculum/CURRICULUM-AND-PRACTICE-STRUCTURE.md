# GuitarApp — Curriculum & Practice Structure Reference

**Status:** CURRICULUM SEQUENCE MERGED (2026-08-12) — competitor level/lesson order filled from
`03-research/competitors/APP_CURRICULUM_SEQUENCES_2026-08-12.md`. Practice-drill taxonomy (§2) still open.
**+ OWNER STRUCTURE DIRECTIVE (2026-08-12, §5):** teaching spine ordered into **20 lesson groups**;
**1:1 practice model** — every teaching lesson gets a dedicated practice lesson offering *many* drill
options; **songs are a SEPARATE CATEGORY** (parallel track, outside the 20 groups) and never count as a
technique lesson or as practice.
**Purpose:** The single reference for *what to teach, in what order, and how to make
students rehearse it* — synthesized from how every major competitor does it, then turned
into a concrete structure for our app.

**Research method:** live `curl` fetches of official sites, Zendesk support-article JSON
APIs (Fender Play + Yousician), Google Play server-rendered listings, JustinGuitar lesson
pages, Andy Guitar course pages, plus prior teardowns in `03-research/competitors/`.
Every competitor claim is tagged **[VERIFIED]** (cited live source), **[INFERRED]**
(deduced from verified material), or **[UNVERIFIED]** (could not confirm).

> This is a RESEARCH + STRUCTURE doc, not a spec amendment. Product decisions still go in
> `02-spec/guitar-app-spec-AMENDMENT-NN.md`.

---

## 0. Our current curriculum (BASELINE — what already exists on disk)

Source: `05-content/guitar-lesson-01..20*.json` — 20 lessons authored, chord shapes
arithmetically verified by `chord-theory-check.js`.

| # | Lesson | New chord | Drills present |
|---|---|---|---|
| 01 | Welcome, Anatomy & Tuning | — | Meet the guitar · Tune with free tuner · First open-string strum |
| 02 | Your First Chord: Em + One Strum | **Em** | Make the Em shape · One clean down-strum |
| 03 | Second Chord + YOUR FIRST SONG | **easyC** | Make easy C · First song Em→easyC |
| 04 | Strumming in Time | — | Down-strums on the beat · Loop with rhythm |
| 05 | Chord Changes: Em ↔ easy C | — | Find the anchor · Air changes · 1-minute change drill |
| 06 | New Chord: G | **G** | Make G · Em→G pivot · 1-minute Em↔G |
| 07 | New Chord: D | **D** | Make D · Four-change rotation |
| 08 | New Chord: A | **A** | Make A · Rotation with A |
| 09 | New Chord: Am + the Big Four | **Am** | Make Am · All six change pairs |
| 10 | Four-Chord Songs (**MILESTONE**) | — | G–D–Em–C loop · Smooth the transitions |
| 11 | Up-Strums + D-DU-UDU | — | The up-strum · D-DU-UDU |
| 12 | Strumming Patterns Library | — | Island strum · Boom-chick |
| 13 | Dynamics + "THE Pattern" | — | Loud and soft · Alternating bass |
| 14 | Capo Basics | — | Place the capo · G–D–Em–C capo 2 |
| 15 | Faster Chord Changes (**SPEED BUILDER**) | — | Spider exercise · Finger lift-off · 1-min changes |
| 16 | New Chord: E (cowboy set complete) | **E** | Make E · E↔A, A↔Em |
| 17 | Minor Progressions + Dm | **Dm** | Make Dm · Minor progressions |
| 18 | Fingerpicking Intro (Travis) | — | Thumb the bass · Travis pattern |
| 19 | Read Any Chord Chart / TAB | — | Read the box · Read TAB · Play one new chart |
| 20 | Consolidation + First "Performance" | — | Capstone · 10-min daily routine · 2-week plan |

**Our chord order:** Em → easyC → G → D → A → Am → E → Dm.
**No F / no barre chords in the 20** — deferred. ✅ Correct: matches every competitor.

Lesson JSON already carries `exercises[]` with `id`, `name`, `purpose`, `params`,
`coaching`, `qa_status` — the practice layer has a schema to grow into.

**Category separation (2026-08-12):** songs are now a distinct parallel track
under `05-content/songs/` (seed S1 = Em→easyC first song, S2 = G–D–Em–C four-chord
loop). They are NOT technique lessons and are excluded from the 20-group spine and
from `validate-practice-lessons.mjs`. See `05-content/songs/README.md`.

**Milestone beat (2026-08-12):** the easyC→C graduation moment is documented at
`05-content/graduation-easyc-to-c.md`. `canonChord` already collapses easyC→C for
memory continuity; this beat makes that invisible continuity legible to the student.
Content only — no engine/UI changes.

---

## 1. How the three big APPS sequence a beginner

### Yousician
- *Standalone cross-app comparison + provenance audit also at
  `../competitors/APP_CURRICULUM_SEQUENCES_2026-08-12.md` (2026-08-12).*
- **Structure:** guided path of **Missions** → grouped into **difficulty Levels**, starting at **"Basics"**. Two parallel themes: **"Playing"** (technique, chords, melody, songs) and **"Knowledge"** (theory, ear, jamming). [VERIFIED]
- **Chords:** open "cowboy chords" taught **one at a time**; full named set = A, Am, C, D, Dm, E, Em, F, G. Their own practice article teaches **E major, E minor, A minor first**, then C, G, D, A. [VERIFIED]
- **Exercise taxonomy (useful to steal):** Chords split into **Cowboy / Fancy / Moveable / Barre**; Melody split into **Riffs / Rhythm / Fingerpicking / Melody-Lead / Rhythm+Lead**. "Fancy" = Am7, Dsus4, Cadd9. "Moveable" = deliberate stepping-stone to barre. [VERIFIED]
- **Barre chords = explicitly intermediate.** [VERIFIED]
- **Theory:** drip-fed via the separate Knowledge theme. [VERIFIED]
- **Practice mode:** tempo slider **25–125%**, **"Wait To Play"** (pauses until you hit it right), section looping, metronome, auto-adjust speed, mute-song. [VERIFIED]
- **Review philosophy:** *"move on, then cycle back"* — advance at reasonable confidence, revisit later. [VERIFIED]
- **Gamification:** streak timeline, badges, activity report, points/multipliers, leaderboards, Weekly Challenges. [VERIFIED]

### Fender Play
- **Structure:** onboarding quiz (instrument + **style**: Rock/Pop/R&B/Country/Blues/Folk) → assigns a **Path** → **Levels → Courses → Activities**. Curriculum built with USC Thornton + Musician's Institute advisors. [VERIFIED]
- **First lesson verified:** *"How to hold your instrument"* → then "building dexterity and confidence." Lessons 2–5 not published. [VERIFIED / UNVERIFIED]
- **Lesson lengths (very useful benchmark):** Chords **1–3 min**, Riffs **3–5 min**, Skills & Exercises **2–5 min**, Song lessons **8–10 min**. [VERIFIED]
- **First song:** *"after a few short lessons you'll be able to play something new — a skill, a recognizable riff, or a full song."* [VERIFIED]
- **Practice:** **Practice Sessions after most lessons** — auto-scrolling tab, metronome, backing tracks, **Practice Mode + Feedback Mode** (mic, real-time), speeds **100/75/50%**. Plus **Chord Challenge**: pick up to 4 chords, metronome + timer, drill switching. [VERIFIED]
- **Progress:** progress bars per Level/Course/Lesson, "My Path", completed courses turn green, "Last Watched". **No documented streak system.** [VERIFIED / UNVERIFIED]
- Flexible: skip ahead or circle back freely. [VERIFIED]

### Simply Guitar (JoyTunes)
- **Structure:** Courses. Beginner course **"Pick Up The Guitar" = 146 lessons**. Later: "Chords, Scales and Arpeggio Level 2". [VERIFIED]
- **First 5 web lessons are pure ORIENTATION, no playing:** 1 Be Comfortable · 2 Consistency is key · 3 Equipment Tips · 4 Look after your ears! · 5 What chair to use when practicing. [VERIFIED]
- **App contradicts the web course:** app markets *"Play chords & songs straight away!"* [VERIFIED as marketing] — the app front-loads a quick win.
- **Stated technique ladder:** fundamentals → **read and play tabs** → playing chords → chord switching → strumming → technique exercises. So **single notes before chords** — the outlier of the three. [VERIFIED]
- **Theory:** minimal/avoided at beginner. [INFERRED]
- **Tools:** metronome, tuner (incl. by-ear), YouTube Slow Downer, loop start/end, mic feedback. No named practice mode, no documented streak. [VERIFIED / UNVERIFIED]

### Free-teacher benchmarks (from prior teardowns, still authoritative)
- **Consensus open-chord order:** E/Em → A → D → (Am, Dm) → C → G → **F/barre deliberately last.**
- **JustinGuitar Grade 1** (~75 lessons, ~8h): M0 basics (tuning, chord boxes, pick hold) → M1 **A & D + first song** → M2 rhythm/changes + first riff → M3 capo, minors, up-strums → M4 metronome, stretches, "THE pattern", Dm → M5 basic theory, songbook, C → M6 6:8 time, G-chord hack, alternate picking → M7 air changes, dynamics, consolidation. Grade 2 = **F, power chords, blues, fingerpicking**. Grades 4–6 = barre chords, CAGED.
- **Andy Guitar:** free 10-Day Starter (L1→L10) → site Beginner L0–9.

### 📊 Comparison table

| Dimension | Yousician | Fender Play | Simply Guitar | JustinGuitar | **OURS** |
|---|---|---|---|---|---|
| **Unit structure** | Missions → Levels, 2 themes | Path → Level → Course → Activity | Courses (146-lesson beginner) | Grades → Modules → Lessons | 20 sequenced lessons |
| **Lesson 1 is…** | tune/hold [INFERRED] | "how to hold your instrument" | orientation (web) / chord+song (app) | tuning, chord boxes, pick hold | Welcome, Anatomy & Tuning ✅ |
| **First chord** | Em / E / Am | not published | ~Em after tabs | **A & D** | **Em** ✅ |
| **Chord order** | Em,E,Am → C,G,D,A | song-driven | tabs → chords | A,D → C,G → Dm | Em,easyC,G,D,A,Am,E,Dm |
| **Single notes vs chords** | chords first | chords first | **tabs first** | chords first | chords first ✅ |
| **First song** | Level 1 | "a few short lessons" | "straight away" (app) | **Module 1** | **Lesson 3** ✅ earliest of all |
| **Theory** | separate Knowledge theme | embedded in songs | avoided | own parallel course | drip-fed |
| **Barre/F** | intermediate | intermediate | Level 2+ | Grade 2 (F), G4–6 (barre) | **not in 20** ✅ |
| **Practice mode** | ✅ full (25–125%, Wait-To-Play, loop) | ✅ Practice Sessions + Chord Challenge | tools only | Practice Assistant + timers | ⚠️ **drills exist, no dedicated mode** |
| **Streak/gamify** | ✅ heavy | progress bars only | mark-done | app streaks | ⚠️ **gap** |
| **Spaced review** | "move on, cycle back" | free circle-back | mark-done | routine rotation | ⚠️ **gap** |

---

## 2. Practice & drill taxonomy — how to rehearse what was learned

The most valuable finding: **JustinGuitar publishes hard numeric benchmarks**, which is
exactly what our "arithmetic, not human QA" doctrine needs (AGENTS.md rule 8).

### 2.1 Chord-change drills
| Drill | What the student does | Success metric | Source |
|---|---|---|---|
| **One-Minute Changes** ⭐ | Pick 2 chords, switch back and forth for exactly 60s, count changes | **≥30 changes/min to advance; 60/min (one per second) = goal** | JustinGuitar [VERIFIED] |
| **Air Changes** | Form the whole shape *in the air*, all fingers land at once (not one at a time) | Qualitative; JG warns it may take **a month** to feel progress | JustinGuitar [VERIFIED] |
| **Chord Perfect** | Slowly place a shape, pick string-by-string, fix any buzz/mute; accuracy over speed | Every string rings clean | JustinGuitar [VERIFIED] |
| **Anchor/pivot fingers** | Identify the finger shared between two chords; keep it planted through the change | Anchor never lifts | JustinGuitar + ours (L05) |
| **Chord Challenge** | Choose up to 4 chords; metronome + timer drills switching among all pairs | Timed | Fender Play [VERIFIED] |

> Our L05/L06/L15 already use 1-minute changes, air changes, and anchors — **we match the
> gold standard.** What we lack is the *counter and the 30/60 gate*.

### 2.2 Rhythm & strumming drills
- **Metronome laddering** — start slow, raise BPM only when clean. (Universal; Yousician: "set the metronome slow until you can perform with ease." [VERIFIED])
- **Percussive/muted strumming** — mute strings, drill the strum hand alone so rhythm isn't hidden by chord errors. (Andy Guitar has a dedicated muting lesson. [VERIFIED])
- **Tempo scaling** — Yousician **25–125%** slider; Fender **50/75/100%**. Slow-down is table stakes.
- **Loop a section** — both Yousician and Simply expose loop start/end.
- **Count out loud** while strumming (1-&-2-&) — standard beginner rhythm anchor.

### 2.3 Dexterity / warm-up drills
- **Spider exercise** ⭐ — "walk your fingers up and down the fretboard like a spider"; trains fretting dexterity *and* picking. Explicitly recommended as the **session warm-up**. [VERIFIED Yousician] (we already have this in L15)
- **Chromatic 1-2-3-4 / string-crossing** — index F1, middle F2 but move to the next string each finger, etc. [VERIFIED Yousician]
- **Finger lift-off** — lift fingers off the shape and replace without looking (ours, L15).
- **Stretching before playing** — Yousician frames it as injury prevention + flexibility, "you wouldn't lift the heaviest weights without warming up." [VERIFIED]
- **Hammer-ons / pull-offs** — introduced as picking-hand efficiency drills. [VERIFIED]

### 2.4 Fretting-quality drills
- **String-by-string arpeggio check** — pick each string of a held chord to find the buzz. Notably, **Simply Guitar's mic diagnosis suggests exactly this** when a chord is muted/buzzing. [VERIFIED] This is the audio-verifiable drill most compatible with our constrained-listening rule.
- **Pressure calibration** — press only as hard as needed (reduces pain/fatigue; JG frames 1-minute changes as also a *pain-tolerance* device since "one minute isn't very long"). [VERIFIED]

### 2.5 Song-application practice
- **Play-along with backing track** (Fender: backing tracks in Practice Sessions [VERIFIED]).
- **Sectional practice** — loop only the hard bar, not the whole song.
- **Slow-down tooling** — Simply ships a "YouTube Slow Downer". [VERIFIED]
- **Repertoire building** — Andy Guitar's routine: pick **3 songs that showcase the skill you're currently working on**. [VERIFIED]

### 2.6 Memory / recall / ear drills
- Chord-box and **TAB reading** as its own skill (ours = L19; Justin has a dedicated "How To Read Chord Boxes" lesson). [VERIFIED]
- Fretboard note recall; Justin sells separate **Note Trainer / Time Trainer / Ear Trainer** apps. [VERIFIED]
- Yousician's **Knowledge theme** includes picking songs by ear. [VERIFIED]

### 2.7 Review / spaced repetition (industry's weakest area = our opening)
- Yousician: **"move on, then cycle back"** — advance at reasonable confidence, revisit later. [VERIFIED]
- Fender: free skip/circle-back, progress bars, "Last Watched". [VERIFIED]
- Andy: **alternate between any two focus areas every two weeks**, hold one longer if needed. [VERIFIED]
- Justin: practice routines you assemble from lesson-attached practice items; Practice Assistant with **timers + a statistics counter**. [VERIFIED]
- **Nobody ships true adaptive spaced repetition keyed to individual weak chord-pairs.** [INFERRED — no source documents it]

### 2.8 Session structure & dosage
- **Andy Guitar's 4-step routine:** (1) written long- AND short-term goals ("what am I achieving this half hour? this week? this 6 months?") → (2) pick focus areas, **rotate every 2 weeks** → (3) find 3 songs showcasing that skill → (4) build repertoire. [VERIFIED]
- **Warm up first**, always (stretch + spider). [VERIFIED]
- **Fender lesson lengths** imply the micro-unit: 1–5 min per skill activity, 8–10 min per song.
- Ours: L20 already prescribes a **10-minute daily routine + 2-week plan** ✅ — consistent with the industry.

---

## 3. What this means for OUR app

### ✅ Where we already match or beat the field
1. **First song at Lesson 3** is earlier than Fender ("a few lessons") and the Simply web course (5 orientation lessons before playing). Only Simply's *app* claims faster. Keep this.
2. **Em first** is pedagogically sound (mostly open strings, low finger count) and matches Yousician's own teaching article.
3. **F/barre excluded** from the beginner 20 — unanimous industry agreement.
4. **We already use the three best drills in the world** (1-minute changes, air changes, anchor fingers) plus spider — sourced from the most respected free teacher alive.
5. **Chord shapes are arithmetically verified.** Nobody else can claim this; it already caught a real D-major defect.

### ⚠️ Three concrete gaps worth closing
1. **No dedicated Practice Mode.** Every serious competitor has one, with the same primitives: **tempo scaling, section looping, metronome, and "wait until correct."** Our drills live inside lessons but there's no place to *just practice*. Yousician's **"Wait To Play"** is the single most borrowable mechanic — and it's a perfect fit for our constrained-listening engine (we know the target chord; we wait until we hear it).
2. **No numeric progress gate.** JustinGuitar's **30 changes/min to advance, 60/min goal** is exactly the kind of decidable, arithmetic criterion AGENTS.md rule 8 demands. A counted 1-minute-changes drill would let the app say "you're ready" without a human judging. **→ BUILT (2026-08-12): `06-prototypes/practice-engine/` — `one-minute-changes.mjs` counts clean changes; 30/60 gate is diagnostic (no human QA). 17 tests pass.**
3. **No spaced review.** Everyone hand-waves this ("cycle back," "rotate every 2 weeks"). Our **on-device student memory** (Amendment-11) makes real adaptive review of *specific weak chord-pairs* buildable — this is a genuine differentiator, not a shiny feature. **→ BUILT (2026-08-12): `fluency-store.mjs` + `practice-loop.mjs` — per-pair fluency with spacing-effect decay; weak-pair review selects the K=3 weakest pairs. Full-8-chord-spine simulation confirms it targets specific weak pairs (e.g. Dm::G @14/min), which no competitor does.**

### 🎯 Structural recommendation
Keep our 20-lesson spine as-is; add a **third layer** beside Lesson and Exercise:

```
Lesson (teach)  →  Exercise (drill it now)  →  PRACTICE (return to it later)
```

Practice-mode primitives to build, in priority order:
1. **Counted 1-Minute Changes** with the 30/60 gate (arithmetic, no human QA)
2. **Tempo scaling + section loop** (25–125% à la Yousician)
3. **Wait-To-Play** on the constrained listener
4. **Weak-pair review queue** driven by on-device memory ← our moat
5. **Streak/consistency loop** — cheapest retention mechanic in the industry; Simply devotes its **second** lesson to "Consistency is key"

### Open question for Heidi
Simply Guitar teaches **single-note tabs before chords**; everyone else does chords first.
We're chords-first. I don't recommend changing — chords give a song faster, which is our
Lesson-3 advantage — but it's a real fork in the road worth a conscious decision.

---

## 5. Ordered teaching spine + 1:1 practice model (owner directive 2026-08-12)

### 5.0 The invariant (locked structure rule)

```
TEACHING track  ──►  ordered into 20 lesson GROUPS
PRACTICE track  ──►  1 practice lesson per teaching lesson (1:1), each with MANY drill options
SONGS category  ──►  SEPARATE category (parallel track, OUTSIDE the 20 groups); a song is NEVER a
                   technique lesson and NEVER a practice lesson
```

- **20 lesson groups** are the technique container scaffold. Today each beginner teaching lesson occupies
  its own group → 20 teaching + 20 practice = **40 technique lessons across 20 groups (2 per group)**.
- **Scale to 100:** add ~4 more teaching lessons (and their 4 practice companions) inside each group
  → 100 teaching + 100 practice, still 20 groups. The 1:1 ratio is enforced at the group level.
- **Songs are a SEPARATE category** — a parallel track outside the 20 technique groups. A song *applies*
  chords already taught in the technique spine; it is neither a technique lesson nor a practice lesson.
  Rule: "learning a song" is its own category and can never substitute for a technique or practice lesson.

**Reality of the shipping build (reconciled UP, 2026-08-12):** the app that actually ships
(`07-app/content/lessons/`, manifest = 23 lessons) contains **3 lessons outside the locked 20-group
spine**. These are intentional and are reconciled UP here (not stripped), per owner decision:
- **L21 "Holding the Pick"** — technique-*support* lesson (grip/posture), `chords=[]`; sits pre-L02,
  not a group of its own.
- **L22 "Switching Between Em and C"** — technique-*support* transition drill for the Em↔easyC pair.
- **L23 "Your First 3-Chord Song"** (G/Em/easyC) — a **SONG**, belongs in the SONGS category (§5.6),
  not as a technique lesson. It is the first realized song lesson (maps to seed S2).

Therefore the accurate invariant is: **20 technique groups + N technique-support lessons (L21/L22) +
a SONGS category (L23 → S2, etc.)**. The 1:1 practice ratio is enforced at the 20-group level; songs
get their own practice/performance layer (§5.6). `05-content/` holds the 20-lesson spine; `07-app/`
is the shipping superset (20 spine + 3 support/song). Reviewed set MUST equal shipped set — keep
`07-app/` as the source of truth and treat `05-content/` as the spine subset.

### 5.1 The 20 ordered groups — strictly matched (practice chord set == teaching chord set)

**Matching rule (locked):** Group *N*'s practice lesson drills EXACTLY the chord(s) introduced in
Group *N*'s teaching lesson, PLUS every chord taught in groups 1..N−1 (cumulative reinforcement).
A song applied in the teaching slot is NEVER the practice lesson. Each practice lesson offers **≥3
options** from the §5.2 menu so there are always *many* ways to drill the same chord(s).

| Grp | Teaching lesson | New chord | Practice lesson — chords drilled (cumulative) → options offered |
|-----|-----------------|-----------|----------------------------------------------------------------|
| 1 | L01 Welcome, Anatomy & Tuning | — | (no chords yet) → Tuner-by-ear · open-string strum rhythm · posture/hold recall · string-name quiz |
| 2 | L02 Em + one strum | **Em** | **Em** → Chord-Perfect (string-by-string) · one clean down-strum on beat · Em hold & relax |
| 3 | L03 Second chord: easyC *(first song lives in SONGS §5.6)* | **easyC** | **Em↔easyC** (all taught so far) → 1-Min Changes counted · Air Changes · anchor finger · tempo loop |
| 4 | L04 Strumming in Time | — | **Em, easyC** in time → Metronome ladder (down-strums) · loop one bar · count out loud (1-&-2-&) |
| 5 | L05 Chord Changes Em↔easyC | — | **Em↔easyC** → 1-Min Changes w/ 30/60 gate · Air Changes · anchor · Weak-Pair Review |
| 6 | L06 G | **G** | **Em, easyC, G** → Make G · Em→G pivot · 1-Min Em↔G · Chord-Perfect |
| 7 | L07 D | **D** | **Em, easyC, G, D** → Make D · 4-change rotation · Chord-Perfect D · Spider warm-up |
| 8 | L08 A | **A** | **Em, easyC, G, D, A** → Make A · rotation w/ A · anchor · Chord-Perfect |
| 9 | L09 Am + Big Four | **Am** | **Em, easyC, G, D, A, Am** → Make Am · all six change pairs · Spider · 1-Min Changes |
| 10 | L10 Four-chord progression G–D–Em–C *(songs live in SONGS §5.6)* | — | **G–D–Em–C** → G↔D, D↔Em, Em↔C changes · tempo-scaled loop (25–125%) · sectional loop |
| 11 | L11 Up-Strums + D-DU-UDU | — | **all 6** in rhythm → Muted/percussive up-strum · D-DU-UDU metronome ladder · loop 2 bars |
| 12 | L12 Strumming Patterns Library | — | **all 6** across patterns → Island strum · boom-chick · pattern switcher · count out loud |
| 13 | L13 Dynamics + THE Pattern | — | **all 6** → Loud/soft loop · alternating bass · dynamics ladder |
| 14 | L14 Capo Basics | — | **G–D–Em–C capo 2** → Place capo · transpose drill · capo-2 loop |
| 15 | L15 Faster Chord Changes (SPEED) | — | **all 6, all pairs** → Spider · finger lift-off · 1-Min all pairs · tempo ladder |
| 16 | L16 E (cowboy set complete) | **E** | **+E; E↔A, A↔Em** → Make E · Chord-Perfect · pair drills |
| 17 | L17 Minor Progressions + Dm | **Dm** | **Am, Dm, Em** minor set → Make Dm · minor progressions · Weak-Pair Review |
| 18 | L18 Fingerpicking Intro (Travis) | — | **C, G, Am** fingerpick set → Thumb bass · Travis pattern · slow-down loop |
| 19 | L19 Read Any Chord Chart / TAB | — | **all taught chords** (retrieval) → Box recall drill · TAB read · play-one-chart |
| 20 | L20 Consolidation + Daily Routine | — | **all 8 chords, full routine** → 10-min routine loop · Weak-Pair Review queue · mock performance |

*(Songs are NOT in this table — they live in the SONGS category, §5.6, and never count as technique or practice.)*

**Scale check (100 teaching / 100 practice):** the same matching rule holds — when groups 1–20 each
absorb ~5 extra teaching lessons (and their 5 practice companions), Group *N* practice always drills
the exact chord(s) introduced in Group *N* teaching + everything before. The matching is structural,
not hand-tuned, so it survives the expansion without rework.

### 5.2 The practice-lesson "many options" menu

Every practice lesson is assembled from this modular drill menu — the student picks, or the app
sequences, **multiple ways to rehearse the same chord/material** (satisfies "many options and ways
to practice"):

1. **Chord-Perfect** — place shape slowly, pick string-by-string, fix buzz/mute (accuracy)
2. **Air Changes** — form whole shape in air, all fingers land at once (not one at a time)
3. **One-Minute Changes** — counted, **30/min to advance, 60/min goal** (arithmetic gate, no human QA)
4. **Tempo-Scaled Section Loop** — 25–125% slider, loop the hard bar
5. **Wait-To-Play** — constrained listener waits until it hears the target chord (fits our audio engine)
6. **Anchor/Pivot drill** — keep the shared finger planted through the change
7. **Spider warm-up** — walk fingers up/down fretboard (session warm-up)
8. **Metronome ladder** — raise BPM only when clean
9. **Weak-Pair Review** — adaptive, driven by on-device student memory ← our moat (Amendment-11)
10. **Muted/percussive strum** — rhythm hand alone, isolate timing from chord errors
11. **Count-out-loud** — 1-&-2-& rhythm anchor

Each practice lesson curates a subset + an order (e.g. warm-up → accuracy → speed → weak-pair). The
menu is the same across all 20 groups; the *chord pairs and gates* differ per lesson.

### 5.3 Why this satisfies the directive

- **Ordered teaching spine:** L01–L20 reaffirmed (matches every competitor; Em-first, F/barre deferred).
- **20 groups:** the container is fixed at 20; lessons fill groups and scale to 100 without restructuring.
- **Many practice options:** the §5.2 menu gives 11 distinct ways to drill one chord — far more than any
  competitor's single practice screen.
- **Songs = separate category:** a parallel track outside the 20 groups; never a technique lesson, never a practice lesson (see §5.6).

### 5.4 Songs are a separate category (RESOLVED)

Per owner directive 2026-08-12: **songs are their own category**, a parallel track outside the 20
technique groups. L03/L10/L20's *song* content moves to the SONGS category (§5.6); the technique spine
stays pure technique. The song-application *exercises* currently inside those lesson JSONs become
SONGS-category items, not practice lessons. The 20-group count and the 1:1 practice ratio are unaffected
by how many songs exist.

### 5.5 Evidence base — why this practice model (grounded, not invented)

**Competitor drills VERIFIED in §2** (live Zendesk / Google Play / JustinGuitar research):
- One-Minute Changes, Air Changes, Chord Perfect, Anchor/pivot, Chord Challenge → JustinGuitar/Fender [VERIFIED]
- Tempo scaling 25–125% + section loop + Wait-To-Play → Yousician [VERIFIED]
- Spider warm-up, chromatic, lift-off, stretching → Yousician [VERIFIED]
- "Move on, then cycle back" spaced review → Yousician; rotate every 2 weeks → Andy Guitar [VERIFIED]

**Learning science [VERIFIED-LEARNING-SCIENCE, Wikipedia REST API, 2026-08-12]:**
- **Spaced repetition** — "proven to increase the rate of learning"; difficult items shown more often. → grounds our Weak-Pair Review queue (§5.2 #9).
- **Spacing effect** — spaced sessions encode more into long-term memory than cramming. → grounds the 1:1 daily practice companion (a little, often) over one long lesson.
- **Testing effect** — long-term memory increases when time is spent *retrieving* from memory. → grounds recall drills (§5.2 box/TAB recall #11, weak-pair retrieval #9).

**Net:** the §5.2 menu is every VERIFIED competitor mechanic, sequenced by VERIFIED learning-science
principles. Every practice lesson follows a fixed evidence-backed order:
`Warm-up (spider) → Accuracy (Chord-Perfect) → Retrieval (Air Changes / recall) → Speed (1-Min Changes + 30/60 gate) → Spaced weak-pair review`.

### 5.6 SONGS — separate category (parallel track, outside the 20 groups)

- **Songs are their own category.** They are unlocked only when the chords they need are *already taught*
  in the technique spine, so a song is always application, never instruction.
- **A song lesson = apply the chord set to a real song (play-along).** It is NOT a technique lesson and
  NOT a practice lesson. The drilling for those chords already happened in the matching technique group's
  practice lesson; the song is the *performance* layer on top.
- **Each song declares its required chord set** (must be a subset of already-taught chords) so the app
  can gate it. Seed list:
  - **S1 "First Song"** → needs {Em, easyC} — unlocks after Grp 3
  - **S2 "Four-Chord Song"** → needs {G, D, Em, C} — unlocks after Grp 10
  - **S3 "Performance Song"** → needs {all 8 taught chords} — unlocks after Grp 20
- **Realized song lessons on disk (match to seeds):** **L23 "Your First 3-Chord Song"** (G/Em/easyC)
  is the first built song lesson and maps to seed **S2** (its chord set {G,Em,easyC} ⊂ S2's {G,D,Em,C}).
  It currently ships as a *technique* lesson in `07-app/content/lessons/` — that placement is the
  known LOW-severity gap (§5.4 directive "songs separate" not yet executed on disk): it should be
  relocated to the SONGS category. **L21/L22 are NOT songs** (technique-support only) and stay in the
  technique track. No `songs/` directory exists yet — creating it and moving L23 is the build action
  that closes the gap (non-blocking; tracked, not auto-done here).
- **Songs scale independently:** 100 technique + 100 practice + *N* songs. Songs never inflate the
  20-group count or the 1:1 practice ratio. Learning a song is progress in the Songs category only.

---

## 4. Sources

**Yousician:** yousician.com/guitar · blog/guitar-practice-routine · blog finger-exercises ·
Support (Zendesk API) arts. 201682971, 360001819378, 201558362, 206912609, 115005190525,
360000478477 · Google Play `com.yousician.yousician`
**Fender Play:** play-support.fender.com Zendesk API arts. 43004686659483, 44538398193819,
44538454058267, 44538464500507, 44538598249755, 52721676934299, 44538951526555,
44538531716251, 44538506005147, 44538600109723 · Google Play `com.fender.play`
**Simply Guitar:** simplyguitar.com/courses · /my-courses/pick-up-the-guitar · /faq ·
Google Play `com.joytunes.simplyguitar`
**JustinGuitar:** justinguitar.com one-minute-changes lesson · air-changes lesson ·
classes/beginner-guitar-course-grade-one
**Andy Guitar:** andyguitar.co.uk/videos/02-structure-a-practice-routine · muting lesson
**Prior internal:** `03-research/competitors/COMPETITOR_TEARDOWN.md`,
`guitar-lesson-channels-competitive-teardown.md`, `guitar-channel-teardown.md`,
`guitar-chord-teaching-teardown.md`

**Method caveats (honest):** all three apps gate real in-app lesson content behind login,
so exact lesson-by-lesson names for Yousician and Fender Play could not be scraped —
those are marked INFERRED from support articles + store descriptions. Apple App Store
pages are JS-rendered and unscrapeable; Google Play (server-rendered) was used instead.
Marketing claims are labeled separately from curriculum listings throughout.
