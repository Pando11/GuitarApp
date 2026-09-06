# spec-reviews.md — Beginner Pain-Point Intelligence from Music Stack Exchange

**Source data:** `~/scraping-stack/harvester/out/FINAL3_reviews.jl` (51 rows, 0 non-question rows)
**Provenance:** 51 real Music Stack Exchange guitar questions, each linking to a genuine `music.stackexchange.com/questions/<id>` page (URLs are web.archive wrappers, content is authentic). Field `review_text` = question title (≤300 chars).
**Content-audit verdict (HANDOFF-2026-08-13-spider-report-contents.md):** clean, on-mission beginner-demand signal. Good feed for roadmap / pain points.
**Author:** Agent E (reviews subagent), 2026-08-13
**App context:** GuitarApp = beginner-focused, acoustic, sequenced lesson app, iOS + Android, one cross-platform codebase. Listening = constrained target-matching only (on-device, audio never uploaded). Chord correctness proven by ARITHMETIC (`chord-theory-check.js`), not a human.

---

## 1. Methodology

I read all 51 rows and classified each by:
- **Pain-point cluster** (what the learner is actually stuck on)
- **Skill level** (true-beginner / intermediate / advanced-or-off-mission)
- **In-scope for the acoustic-beginner sequenced app?** (Yes / Partial / Defer)

The goal is not to reproduce Stack Exchange answers. It is to convert *expressed confusion* into (a) lesson topics, (b) lesson framing that dissolves the confusion, and (c) a help-center outline. Where a topic depends on a chord shape, the app must drive that shape from `chord-theory-check.js` (arithmetic source of truth) — see §6.

> Note on one audit summary mismatch: the content-audit handoff paraphrased Q6 as "warmup … to avoid injury?" The actual `review_text` is *"Guitar warmup exercices, which strategy is better to avoid excessive fret wear?"* — i.e. fret-wear, not injury. Both warmup and injury-prevention are real pain points (see Q8, Q39, Q47), but the literal question is about fret wear. I use the real text below.

---

## 2. Pain-Point Taxonomy (all 51 rows classified)

| # | Question (short) | Cluster | Level | Scope |
|---|---|---|---|---|
| 1 | Pluck 1st string with fingers i and m | Right-hand fingerstyle | Beg/Int | Yes |
| 2 | D Tuning + Transposing standard notation | Alt tuning / Transposing | Int | Yes (partial) |
| 3 | Lower the nut on a classical guitar (safe?) | Setup / nut | Int | Yes (boundary) |
| 4 | Fusion chord changes | Chord changes / rhythm | Int | Yes |
| 5 | Ear training advantage for starting violin | Ear training (cross-inst) | Int | Partial |
| 6 | Warmup to avoid excessive fret wear | Warmup / fret care | Beg | Yes |
| 7 | Tactile fretboard markers (partially-sighted) | Accessibility | Beg | Yes |
| 8 | How important is posture/position | Posture / injury | Beg | Yes |
| 9 | Are tuning buttons interchangeable | Setup / machine heads | Int | Yes |
| 10 | Is C3 b13 in relation to the E chord | Theory / extensions | Int/Adv | Partial |
| 11 | Electrical specs of MIDI guitar controls | Gear (MIDI) | Adv | **Defer** |
| 12 | Smooth buzzy distorted guitar tone | Setup/buzz or tone | Int | Partial |
| 13 | Name for unusual chord progression (Edelweiss) | Theory / progressions | Int | Yes (concept only) |
| 14 | End let ring for one string | Notation / sustain | Beg/Int | Yes |
| 15 | How accurate are recordings (concert pitch) | Pitch reference / ear | Int | Yes |
| 16 | Finger management, multiple voices | Right-hand / polyphony | Int | Yes |
| 17 | Is Focusrite Scarlett good for me | Gear / recording | Adv | **Defer** |
| 18 | What is voice leading | Theory / voice leading | Int/Adv | Partial |
| 19 | Guitar + Piano accompanying voices | Arrangement | Adv | **Defer** |
| 20 | Imitate McCoy Tyner piano on guitar | Transcription / jazz | Adv | **Defer** |
| 21 | Confused about circle-of-fifths chord choice | Theory / CoF | Int | Yes |
| 22 | Evertune bridge sustain (zones) | Gear / bridge | Adv | **Defer** |
| 23 | Low B string in tune (baritone/7-string) | Intonation / tuning | Int/Adv | Partial |
| 24 | Master this guitar run | Technique / licks | Int | Yes |
| 25 | What does this notation mean on guitar tab | Notation / TAB literacy | Beg | Yes |
| 26 | Mixing modes with pentatonic positions | Theory / improv | Int/Adv | Yes |
| 27 | G string tuning problems | Tuning (specific string) | Beg | Yes |
| 28 | Interpret/build on a melody (beginner) | Theory / melody | Beg/Int | Yes |
| 29 | Up/down breves after fret-numbers in tabs | Notation / TAB literacy | Beg/Int | Yes |
| 30 | Accents in rhythmic slash notation | Notation / rhythm | Int | Yes |
| 31 | Strum chords; Em and E sound the same | Strumming / chord ID | Beg | Yes |
| 32 | Exercises for barre chords | **Barre chords** | Beg/Int | Yes |
| 33 | Retune Floyd Rose to open tuning | Tuning / tremolo | Adv | **Defer** |
| 34 | Can I learn how to sing | Singing (off-mission) | Beg | **Defer** |
| 35 | Clean high-gain with no muting | Technique / muting (electric) | Adv | **Defer** |
| 36 | Correct minor scale step pattern | Theory / scales | Beg/Int | Yes |
| 37 | Thumb + other fingers alternately | Right-hand fingerstyle | Beg/Int | Yes |
| 38 | DADGAD chords vs cut capo | Alt tuning / capo | Int | Yes |
| 39 | Ring finger bends from pinky | Hand anatomy / strain | Beg/Int | Yes |
| 40 | 1/4 tone bends in LilyPond | Notation software | Adv | **Defer** |
| 41 | "oamip" in flamenco tablature | Technique / flamenco | Adv | **Defer** |
| 42 | Interpreting two voices in a score | Notation / polyphony | Int | Yes |
| 43 | Two notes same string, distinct, no leftovers | Technique / legato | Int | Yes |
| 44 | Hammer-on adjacent notes when fast | Technique / legato | Int | Yes |
| 45 | Terminology: percussive rattle/buzz | Technique / terminology | Int | Partial |
| 46 | Cross symbol (X) on note stem | Notation | Int | Yes |
| 47 | Pointer finger bends doing barre | **Barre chords / anatomy** | Beg/Int | Yes |
| 48 | Fretting on a cigar box guitar | Niche instrument | Int | **Defer** |
| 49 | Am I playing barre chords too low? | **Barre chords** | Beg/Int | Yes |
| 50 | Compose classical works on a DAW | Composition / DAW | Adv | **Defer** |
| 51 | How to end a counterpoint exercise | Theory / counterpoint | Adv | **Defer** |

**Scope tally:** In-scope (Yes) ≈ 30 · Partial ≈ 11 · Defer (advanced/gear/off-mission) ≈ 10.

**Highest-signal beginner clusters (by raw frequency + pure-beginner frustration):**
1. **Barre chords** — Q32, Q47, Q49 (+ anatomy Q39 overlaps). The single loudest beginner scream.
2. **Tuning & intonation trouble** — Q27 (G-string), Q23 (low B), Q9 (machine heads), Q3 (nut), Q15 (pitch ref). Setup anxiety.
3. **Strumming & chord changes** — Q31 (Em/E), Q4 (chord changes).
4. **Right-hand fingerstyle** — Q1, Q37, Q16.
5. **Warmup / posture / hand health** — Q6, Q8, Q39, Q47.
6. **Notation & TAB literacy** — Q25, Q29, Q30, Q14, Q42, Q46.
7. **Theory for players** — Q21 (CoF), Q10 (extensions), Q13 (progressions), Q36 (scales), Q26 (modes), Q28 (melody).
8. **Transposing & alt tunings** — Q2, Q38.
9. **Articulation / legato** — Q43, Q44, Q24.
10. **Accessibility** — Q7.

---

## 3. (a) Lesson Topics That Deserve Coverage

Priority ordered. Each is grounded in ≥1 real question above.

### P0 — Must-have for a beginner app
- **L1 · Barre chords without the struggle.** Teach F and Bm as *angle + thumb placement + roll-to-bone*, not grip strength. Directly answers Q32 ("exercises for barre chords"), Q47 ("pointer finger bends"), Q49 ("too low on my finger"). Include the anatomical reality of index-finger hyperextension (Q39/Q47) as a *technique correction*, not a defect. Chord diagrams must come from `chord-theory-check.js`.
- **L2 · Tuning & staying in tune.** Separate three distinct failures beginners conflate: (i) *tuning* the string (machine heads, Q9), (ii) *intonation* (saddle/nut, Q23 low B, Q27 G-string), (iii) *pitch reference* (Q15 concert pitch). Teach when a problem is user-fixable vs. "see a tech."
- **L3 · Strumming & clean chord changes.** Rhythm fundamentals + the Em/E confusion (Q31: "they sound the same" → teach the 3rd note that distinguishes them and let the listening feature prove it). Chord-change drills (Q4).
- **L4 · Your first fingerstyle (right hand).** i/m alternation (Q1), thumb+ finger alternation (Q37), basic finger assignment for multiple voices (Q16). Builds the "which finger goes where" mental model beginners lack.

### P1 — High-value fundamentals
- **L5 · Warmup, posture & hand health.** Warmup strategy that protects frets *and* hands (Q6 fret wear, Q8 posture). Reframe "injury" as preventable technique, not inevitable. Address index/ring finger mechanics (Q39, Q47).
- **L6 · Reading TAB & notation.** A guided symbol glossary: what TAB numbers/breves mean (Q25, Q29), rhythmic slash accents (Q30), let-ring (Q14), two-voice scores (Q42), the "X" stem mark (Q46). Make this an *interactive in-app legend*, not a PDF.
- **L7 · Core theory for players (non-scary).** Minor scale step pattern (Q36), circle-of-fifths as a *chord-family picker* (Q21), chord extensions explained by ear (Q10), naming progressions conceptually (Q13 — original examples only, never reproduce Edelweiss).

### P2 — Stretch / intermediate
- **L8 · Transposing & alternate tunings.** Transpose standard notation (Q2), DADGAD + capo (Q38). Tie transposing to the listening feature (play it in any key, app checks the target).
- **L9 · Articulation & legato.** Hammer-ons (Q44), stopping string bleed (Q43), building a run (Q24).
- **L10 · Melody & simple improvisation.** Build/interpret a melody (Q28), mixing modes with pentatonic (Q26) — framed as "play over a loop," not jazz school.
- **L11 · Inclusive design — accessible fretboard.** Tactile/visual marker alternatives for low-vision users (Q7). A small but high-integrity inclusion win.

### Deferred (do NOT build in v1; log as roadmap)
MIDI guitar specs (Q11), recording interfaces (Q17), Evertune/Floyd Rose hardware (Q22, Q33), singing (Q34), electric high-gain muting (Q35), LilyPond/notation software (Q40), flamenco specifics (Q41), cigar box guitar (Q48), DAW composition (Q50), counterpoint (Q51), piano-imitation/jazz transcription (Q20, Q19), violin cross-training (Q5).

---

## 4. (b) Lesson Framing That Answers Real Confusion

For each top cluster, the *real confusion* (from the question) and the *reframe* the lesson should use.

| Topic | Real confusion (verbatim spirit) | Reframed lesson title & angle |
|---|---|---|
| Barre chords | "My finger bends / I can't get all strings to ring / am I too low on my finger" | **"Why your barre chord buzzes (and the 3 fixes that aren't 'press harder')"** — diagnose by *symptom* (which strings die), teach index roll-to-bone + thumb behind neck + elbow tuck. Normalize hyperextension as fixable, not a dead end. |
| Em vs E | "Em and E sound the same" | **"The one note that turns E into Em — and how to hear it"** — isolate the 3rd (G# vs G); use constrained listening: app plays target, confirms you added/removed the third. Turns a mystery into an audible difference. |
| Tuning | "G string won't stay / low B won't intonate / are tuners interchangeable" | **"Tuning vs. intonation: which problem is yours?"** — flowchart: stretch/tuning peg (user) → saddle/nut intonation (tech) → pitch ref (app metronome/tuner). Sets the safety boundary for Q3 (nut lowering is risky on classical — demo *when to stop and see a luthier*). |
| Fingerstyle | "Can I use i and m? / thumb + fingers alternately?" | **"Right-hand alphabet: which finger, which string"** — start from the question they actually asked (Q1) instead of dumping patterns. Build assignment logic, then apply. |
| Warmup | "Which warmup avoids fret wear?" | **"Warm up your hands, not your frets"** — distinguish hand-warmup (circulation) from unnecessary string scraping; teach efficient drills. Pair with posture (Q8) as the "play for years, not months" module. |
| Notation | "What does this symbol/tab mark mean?" | **In-app interactive legend**, not a lesson — tap any symbol (breve, accent, let-ring, X-stem, two-voice) → 5-sec explainer + audio example. Removes the #1 drop-off point for self-taught readers. |
| Circle of fifths | "Confused about which chords to choose" | **"The 5-minute chord picker"** — present CoF as a *setlist generator* (pick a key → get its safe chords), not a theory lecture. Directly resolves Q21. |
| Transposing | "D tuning + transposing standard notation" | **"Play any song in any key (without relearning it)"** — capo + transposition as a practical tool; let the listening feature verify the moved shape. |

**Framing principle:** beginners arrive with a *specific, narrow* question (often phrased as "is this allowed / why does mine do X"). Lessons should be titled in the learner's own words and diagnose by *symptom*, then teach the underlying rule — never lead with theory the learner didn't ask for.

---

## 5. (c) FAQ / Help-Section Outline

A help center mirroring the pain clusters, plus concrete FAQ entries mined from the questions. Group structure:

```
Help Center
├─ Getting Started
│   ├─ Am I too old / do I need talent? (spirit of Q34 "can I learn")
│   ├─ How the app listens (and what it does NOT do) ← see §6
│   └─ Posture & first session (Q8)
├─ Tuning & Your Guitar
│   ├─ My G string won't stay in tune (Q27)
│   ├─ What's the difference between tuning and intonation? (Q23, Q9)
│   ├─ Is it safe to adjust the nut myself? (Q3 — boundary: see a luthier)
│   ├─ Concert pitch / why recordings sound off (Q15)
│   └─ Alternate tunings & capo basics (Q2, Q38)
├─ Chords & Strumming
│   ├─ Why do E and Em sound the same to me? (Q31)
│   ├─ Barre chords buzz / my finger bends (Q32, Q47, Q49, Q39)
│   ├─ Smooth chord changes (Q4)
│   └─ First fingerstyle: which finger goes where (Q1, Q37, Q16)
├─ Technique & Health
│   ├─ Warmup that won't wear your frets (Q6)
│   ├─ Hand pain / finger bending — normal or problem? (Q39, Q47)
│   ├─ Hammer-ons, legato, clean runs (Q43, Q44, Q24)
│   └─ Muting & clean sound (Q35 — note: electric-focused, link to acoustic equivalent)
├─ Reading Music & TAB
│   ├─ Symbol glossary (interactive): breves (Q29), accents (Q30), let-ring (Q14), X-stem (Q46), two voices (Q42)
│   ├─ "What does this tab mean?" starter (Q25)
│   └─ Slash / rhythm notation (Q30)
├─ Music Theory (plain)
│   ├─ Minor scale steps (Q36)
│   ├─ Circle of fifths as a chord picker (Q21)
│   ├─ Chord extensions by ear (Q10)
│   ├─ Naming chord progressions (Q13 — concept, original examples)
│   └─ Melody & simple improv (Q28, Q26)
├─ Accessibility
│   └─ Fretboard markers for low-vision players (Q7)
└─ Out of Scope (honest pointers)
    ├─ Recording gear / interfaces (Q17) — not an acoustic-lesson app
    ├─ Electric/high-gain tone (Q12, Q35) — deferred
    ├─ Singing (Q34) — separate skill
    └─ Advanced: counterpoint, DAW, flamenco, jazz transcription (Q51, Q50, Q41, Q20)
```

**Sample FAQ answers (tone: direct, no jargon):**

- *"Why do E and Em sound the same to me?"* — They share two of three notes. E = E-G#-B; Em = E-G-B. The middle note is the only difference. The app's listening check can play each and confirm when you've added or dropped that third.
- *"Is it safe to lower the nut myself?"* — On a classical guitar, lowering the nut is easy to botch and can ruin playability. The app teaches *recognizing* a too-high nut (buzzing/open-string deadness) and when to hand it to a tech — we don't coach irreversible DIY surgery.
- *"My finger bends when I barre — am I doing it wrong?"* — Index-finger hyperextension is common and fixable: roll the barring finger slightly onto its bony side and tuck your elbow. It's a placement fix, not a strength problem.
- *"What do the symbols in my tab mean?"* — Tap any symbol in the lesson for a 5-second audio + text explainer (breves = sustained, accents = attacked, let-ring = hold, X = muted/percussive, stacked stems = two voices).

---

## 6. Compliance Notes (hard rules that constrain this spec)

- **Chord shapes are arithmetic-verified, not drawn.** Every chord the app teaches — especially barre chords (F, Bm) in L1 — must be generated from `06-prototypes/step0/schema/chord-theory-check.js`. The checker proves the fingering spells the claimed chord and is physically playable (no finger on two frets, no unassigned fretted string, no absurd stretch). Teacher-avatar finger demonstrations (permitted under AMENDMENT-06/10) must be *driven from this verified data* so hand and diagram cannot disagree. Ship gate: `node run-chord-check.js` → 0 errors, 0 warnings.
- **Listening is constrained target-matching only.** The FAQ entry "How the app listens" must state: the mic checks the *known target chord/note + tempo* you're supposed to play; it does **not** transcribe open-ended audio (≈50% accurate, ships false negatives). On-device, audio never uploaded. Below confidence threshold, the app says "play that again" — never a false red X.
- **No camera / no hand tracking.** FAQ should pre-empt "why can't the app watch my hands?" — verification is by *sound*, not video. This is a product decision, not a limitation to apologize for.
- **Legal line (intact).** This spec teaches concepts and original examples only. We do **not** reproduce copyrighted tabs, lyrics, or audio. The Edelweiss progression question (Q13) is used only to motivate *teaching the concept of naming progressions* with original loops — never to reproduce the song. SONGS-track content remains our own original 8-chord loops.
- **Scope discipline.** Deferred topics (§3, §5 Out-of-Scope) are explicitly logged as roadmap, not silently dropped — but must not enter v1 lesson authoring.

---

## 7. Appendix — Full 51-Row Index (question → cluster → scope)

See the table in §2 for the complete mapping. Row numbers match file line order in `FINAL3_reviews.jl`. All 51 rows are genuine questions (0 non-question rows, verified).

**One-line data-quality note:** The `url` fields are web.archive.org wrappers around `music.stackexchange.com/questions/<id>` — genuine targets, safe to cite as provenance. `source` is the `/questions/tagged/guitar` landing page for all rows.
