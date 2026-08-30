# HANDOFF — Convert the 5 Spider Reports into Guitar-App Specs (agent-spawn task)

**Date:** 2026-08-13
**Project:** GuitarApp / scraping-stack (`~/scraping-stack/harvester`)
**Author:** Hermes
**Purpose:** Spawn ONE subagent per harvested report. Each agent reads its `.jl`
data file + the content-audit handoff, extracts ALL useful, actionable
information, and writes a focused spec contribution for the guitar lessons app.
This handoff is self-contained so it can run with no prior conversation context.

---

## Prerequisites (verified paths)

- Spider source (durable asset): `~/scraping-stack/harvester/harvester/spiders/`
- Harvested data: `~/scraping-stack/harvester/out/`
- Content audit (what each file REALLY says, row-verified 2026-08-13):
  `Desktop/GuitarApp/scale-100/HANDOFF-2026-08-13-spider-report-contents.md`

Row counts (proven by re-reading rows, 2026-08-13):

| Report | File | Rows |
|---|---|---|
| curriculum_arch | `FINAL_curriculum_arch.jl` | 18 |
| popular_songs | `FINAL_popular_songs.jl` | 56 (50 real songs + 6 non-song) |
| public_domain_songs | `FINAL_public_domain_songs.jl` | 348 (302 distinct titles; 46 raw dup rows / 49 normalized — NOT 38 as an earlier draft wrongly claimed) |
| chord_ref | `FINAL_chord_ref.jl` | 45 |
| reviews | `FINAL3_reviews.jl` | 51 |

---

## Task: spawn agents (delegate_task)

Spawn **5 subagents, one per report**. Max concurrent children = 3 for this
profile, so run in **two rounds**:

- **Round 1:** curriculum_arch, popular_songs, public_domain_songs
- **Round 2:** chord_ref, reviews

Each agent is a `leaf` (cannot delegate further).

For EVERY agent, pass the **shared context** (below) plus its **specific goal**
(below). Shared context:

> Spider data dir: `~/scraping-stack/harvester/out/`
> Content-audit handoff: `Desktop/GuitarApp/scale-100/HANDOFF-2026-08-13-spider-report-contents.md`
> Chord correctness is proven by ARITHMETIC (`06-prototypes/step0/schema/chord-theory-check.js`),
> not a human. Listening returned as constrained target-matching only (AMENDMENT-05), on-device,
> audio never uploaded. Cartoon-only mandate + fingering-demo ban are VOID (AMENDMENT-06).
> Legal line: SONGS lessons are ORIGINAL 8-chord loops — no lyrics/tabs/audio scraped or
> reproduced; song names/structure are facts (permitted). chord_ref voicings = chord shapes
> (facts). public_domain_songs = title catalog only. Tab CONTENT must never be harvested.

**Goal template for each agent:**
"Read your assigned `.jl` file. Extract ALL information useful to building the
GuitarApp guitar-lessons app. Write a structured spec markdown to your assigned
output file. Do NOT write to any other agent's file (parallel writes collide)."

---

## Output location

Write each spec to: `Desktop/GuitarApp/scale-100/02-spec/report-derived/`
(One file per agent. Create the dir if needed.)

| Agent | Report | Output file |
|---|---|---|
| A | curriculum_arch | `spec-curriculum-arch.md` |
| B | popular_songs | `spec-popular-songs.md` |
| C | public_domain_songs | `spec-public-domain-songs.md` |
| D | chord_ref | `spec-chord-ref.md` |
| E | reviews | `spec-reviews.md` |

---

## Per-agent specifics

### Agent A — curriculum_arch
Read `FINAL_curriculum_arch.jl` (18 rows: Andy Guitar Rock Rhythm 01–14
lesson-title sequence). **`chord_mention` == title in all rows — there is NO
chord data; do not invent chords.**
Extract: the lesson *ordering/sequencing* pattern (intro → isolated technique →
combined), what each stage implies, and a concrete proposal for how GuitarApp
should sequence its own lessons, citing the competitor shape as evidence. Open
follow-up: real chord symbols would require descending into each lesson page.

### Agent B — popular_songs
Read `FINAL_popular_songs.jl` (56 rows: 50 real song names with deep Songsterr
tab links `/a/wsa/<artist>-<song>-tab-s<id>` + 6 non-song rows: `Any instruments`,
`Guitar`, `Bass`, `Drums`, `Led Zeppelin`, `Backing track`).
Extract: the 50 real song names as a popularity-ranked name pool, the deep-link
URLs as per-song source references, and how this feeds the SONGS track.
**Legal line (must appear in spec): song NAMES and structure are facts
(permitted); do NOT scrape or reproduce lyrics, tabs, or audio. Tab CONTENT must
not be harvested. SONGS lessons use OUR OWN original 8-chord loops.**

### Agent C — public_domain_songs
Read `FINAL_public_domain_songs.jl` (348 rows; 302 distinct titles, 299
normalized; 46 raw dup rows / 49 normalized — correct the "38" error if you see
it). Categories: Maori Songs 132, School Projects 89, songlist 59, "NZFS song
pages to be made" 25, Regional 17, Christmas 15, etc. **Titles only — NO
chords/progressions (source has no chord markup).**
Extract: the PD/folk catalog as a zero-licensing-risk song source for
original-loop SONGS content, the category breakdown, and a proposal for drawing
safe material. Reaffirm legal line (original loops only).

### Agent D — chord_ref
Read `FINAL_chord_ref.jl` (45 rows: real chord pages with voicing alt-text lists;
all 45 carry ≥1 voicing). **Voicings are descriptive alt-text, NOT
machine-parseable fingering coordinates.**
Extract: how this serves as an external sanity-check reference for our
arithmetically-verified `chord-theory-check.js` (source of truth), which chords
are covered, and a process for validating teacher-avatar fingerings (AMENDMENT-06/10
allow fingering demos driven from verified data). Do NOT propose auto-import of
the alt-text.

### Agent E — reviews
Read `FINAL3_reviews.jl` (51 rows: real beginner-guitar Music SE questions; all
link to `/questions/<id>`; URLs are web.archive wrappers but genuine; 0
non-question rows).
Extract: the beginner pain points (nut adjustment, ear training, warmup injury,
transposing, etc.) and translate them into (a) lesson topics that deserve
coverage, (b) lesson framing that answers real confusion, (c) a FAQ/help-section
outline for the app.

---

## Acceptance / verification

After all agents finish, the orchestrating agent must:
1. Confirm 5 spec files exist in `02-spec/report-derived/` and each is non-empty.
2. Spot-check ONE claim per file against its `.jl` (e.g. row count, a sample row).
3. Report the 5 file paths + a one-line summary each back to the user.
