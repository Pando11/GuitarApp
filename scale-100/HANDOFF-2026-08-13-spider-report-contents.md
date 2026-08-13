# HANDOFF — What the 5 Spider Reports Actually Say (content audit)

**Date:** 2026-08-13
**Project:** GuitarApp / scraping-stack (`~/scraping-stack/harvester`)
**Author:** Hermes
**Purpose:** This is NOT the build handoff. It is a plain-language report of what
each of the 5 harvested `.jl` files *contains*, verified by reading the rows,
not by trusting row counts. Earlier claims in
`HANDOFF-2026-08-13-songs-and-spiders.md` AND in an earlier draft of THIS file
were wrong and are corrected inline below (marked ⚠️ CORRECTION). A second
verification pass on 2026-08-13 re-read every row and surfaced three further
inaccuracies in the `popular_songs` description (see below).

Spider source files (the durable asset) live in:
`~/scraping-stack/harvester/harvester/spiders/`
Harvested data lives in: `~/scraping-stack/harvester/out/FINAL_*.jl`

---

## 1. `curriculum_arch` → `FINAL_curriculum_arch.jl`  (18 rows)

**Intended category:** competitor lesson *structure* (sequence + titles).
**What it actually contains:** the lesson-title sequence scraped from Andy
Guitar's course pages — `Courses`, `Get Started`, `Rock Rhythm 01 - Introduction`
through `Rock Rhythm 14` (and a few others). This IS the competitor structure
we wanted: it tells us *how a real course is ordered*.

⚠️ **CORRECTION (vs. earlier handoff):** I previously wrote "16/18 carry a real
`chord_mention`." That was FALSE. In every one of the 18 rows,
`chord_mention` is *identical to* `title` — it just echoes the lesson name
(one row differs only by surrounding whitespace: `\n Courses \n`).
**Zero rows contain an actual chord symbol.** So the value of this report is the
lesson *ordering/titles* (structure), NOT any chord data. Do not cite it as a
chord source.

**Fields:** `title`, `url`, `chord_mention` (== title), `source`.

---

## 2. `popular_songs` → `FINAL_popular_songs.jl`  (56 rows)

**Intended category:** most-wanted SONG NAMES (popularity signal for the SONGS track).
**What it actually contains:** **50 real song names** — `Master of Puppets`,
`Enter Sandman`, `Stairway to Heaven`, `Sweet Child O' Mine`, `Smells Like Teen
Spirit`, `Back In Black`, `Californication`, `Creep`, Metallica's `One`, etc. —
each with a **deep Songsterr tab link** (`/a/wsa/<artist>-<song>-tab-s<id>`).
The remaining **6 rows are NOT songs:** 4 UI/category rows (`Any instruments`,
`Guitar`, `Bass`, `Drums`) and 2 scrape-noise rows (`Led Zeppelin` = artist
index page, `Backing track` = a backing-track variant). `One` is a real Metallica
song, NOT a stray UI word.

⚠️ **CORRECTION (vs. earlier handoffs) — three prior claims were WRONG:**
  - I claimed "55 real song names + 1 stray UI word (`One`)." False — `One` is a
    **real Metallica song** (`.../metallica-one-tab-s444`). Real non-song noise
    = **6 rows**: 4 UI/category (`Any instruments`, `Guitar`, `Bass`, `Drums`) +
    2 scrape noise (`Led Zeppelin` artist page, `Backing track`). **Real songs = 50/56.**
  - I claimed "All 56 URLs are coarse section/index pages, NOT deep song links."
    False — **50/56 rows carry DEEP Songsterr tab links** (`/a/wsa/<artist>-<song>
    -tab-s<id>`). The earlier check used the wrong pattern (`/tab/\d`/`/song/\d`);
    Songsterr's real deep-link format is `/a/wsa/...-tab-s<id>`. Only the 6
    non-song rows are landing/listing pages.
  - I claimed "Dropped 5 UI-nav rows." The nav filter never fully matched; 4 UI
    rows + 2 noise rows remain (see above).

**Honest read:** the SONG NAMES (50 of 56) are real and useful as a popularity
signal, and — contrary to an earlier draft — **50/56 carry deep Songsterr tab
links** (`/a/wsa/<artist>-<song>-tab-s<id>`), so per-song source URLs ARE
present for the real songs. The 6 non-song rows (4 UI + 2 noise) are the only
coarse landing pages. For driving the SONGS track (our own original loops), the
names + deep links are sufficient; no further pass is needed unless you want tab
CONTENT — which must NOT be scraped (legal line). Do not cite this report as a
chord/tab source.

**Fields:** `song`, `url` (deep `/a/wsa/...-tab-s<id>` for real songs), `popularity_hint`, `source`.

---

## 3. `public_domain_songs` → `FINAL_public_domain_songs.jl`  (348 rows)

**Intended category (original):** PD song *chord progressions*.
**Reality (verified):** the source (folksong.org.nz) has NO chord markup — its
pages are lyrics/prose, so chord-progression harvesting is impossible there.
**What the spider now contains (after rewrite):** a **PD song CATALOG** — 348
rows, **302 distinct** real folk/PD song NAMES (299 after case/whitespace
normalization; 38 rows are duplicate titles spanning categories), each tagged
with a category.

**Categories (top):** Maori Songs (132), School Projects (89), songlist (59),
"NZFS song pages to be made" (25), Regional songs (17), Christmas (15), John
Archer's Ballads (7), Train Songs (2).

**Sample names:** `Apple Pickers' Ball`, `Auntie Alice Brought Us This`,
`Aunty May`, `Barb Wire Annie`, `Billy the Bus`, `Blood Red Roses`.

**Honest read:** this is a clean, legal catalog of public-domain / folk song
*titles* — useful as a "what PD material exists" reference. It does NOT contain
chords or progressions (348 rows, 302 distinct titles; the 38 duplicate-title
rows are the same song listed under multiple categories). The SONGS track still
uses our OWN original 8-chord loops (legal line), never reproductions.

**Fields:** `title`, `category`, `url`, `source`.

---

## 4. `chord_ref` → `FINAL_chord_ref.jl`  (45 rows)

**Intended category:** open chord-chart voicings to cross-check our fingerings.
**What it actually contains:** 45 REAL chord pages from guitar-chords.org.uk.
Each row has `chord_name` (e.g. `C Major Guitar Chord Diagrams`,
`C Sus 4 Guitar Chord Diagrams`, `Cm6/9 Guitar Chord Diagrams`) plus `voicings`
— a list of diagram/fingering alt-texts (e.g. `Cm6/9 chord diagram 1..6`,
`C Augmented chord diagrams`, `C Sus 4 chord diagrams`). All 45 rows carry ≥1
voicing. This is the one report that is genuinely what it was built to be.

**Honest read:** usable as an external sanity-check reference against
`chord-theory-check.js` (though the arithmetic checker remains the source of
truth). Note the voicings are *descriptive alt-text*, not machine-parseable
fingering coordinates — good for a human glance, not for auto-import.

**Fields:** `chord_name`, `voicings` (list), `url`, `source`.

---

## 5. `reviews` → `FINAL3_reviews.jl`  (51 rows)

**Intended category:** beginner DEMAND intelligence (what learners struggle with).
**What it actually contains:** 51 real Music Stack Exchange guitar QUESTIONS —
multi-word, each linking to a real `music.stackexchange.com/questions/<id>` page.
e.g. "In this piece, can I pluck the first string using fingers i and m?",
"D Tuning for Guitar and Transposing Standard Notation", "How easy/safe is it to
lower the nut on a classical guitar?", "Guitar warmup exercices, which strategy
is better to avoid injury?". 0 non-question rows.

**Honest read:** clean, on-mission beginner-demand signal. Good feed for the
product roadmap (what to teach / what confuses people).

**Fields:** `review_text` (question title, ≤300 chars), `url`, `source`.

---

## SUMMARY TABLE (verified by reading rows, 2026-08-13 second pass)

| # | Spider | Rows | What it REALLY says | Usable for |
|---|---|---|---|---|
| 1 | curriculum_arch | 18 | Lesson *titles/order* (Andy Guitar Rock Rhythm 01–14). **No chord data** (chord_mention==title). | Competitor structure |
| 2 | popular_songs | 56 | **50 real song names** (incl. Metallica "One") w/ **deep tab links**; 6 non-song rows (4 UI + 2 noise). | SONGS-track name pool |
| 3 | public_domain_songs | 348 | 348 rows; **302 distinct titles** (299 norm.) + category; 38 dup-title rows. No chords. | PD catalog reference |
| 4 | chord_ref | 45 | 45 real chord pages w/ voicing alt-text. | Fingering cross-check |
| 5 | reviews | 51 | 51 real beginner guitar questions. | Roadmap / pain points |

## LEGAL LINE (unchanged, intact)
- SONGS lessons are ORIGINAL 8-chord loops. No lyrics, tabs, or audio were
  scraped or reproduced. Song *names* and *structure* are facts (permitted).
- chord_ref voicings are chord *shapes* (facts, not expression).
- public_domain_songs is a title catalog only.

## OPEN FOLLOW-UPS (optional)
- popular_songs: the data is already good (50 real songs + 50 deep links). A
  further pass is only warranted if you want tab CONTENT — which must NOT be
  scraped (licensing risk). The names + deep links are sufficient for the
  SONGS track.
- curriculum_arch: if you want real chord symbols in competitor lessons, that
  requires descending into each lesson page (currently only the index/sequence
  was captured).
- Neither follow-up is required for the current product (SONGS uses original
  loops; structure is already captured).
