# Beginner Curriculum Sequences — Yousician / Fender Play / Simply Guitar
**Date:** 2026-08-12 · **Purpose:** lesson/level-by-level breakdown of what each of the three
biggest APP-based guitar teachers teaches, in what order, for an absolute beginner.
**Owner context:** feeds `curriculum/CURRICULUM-AND-PRACTICE-STRUCTURE.md`.

**Concurrency note (2026-08-12, after writing):** While this file was being authored, the parent
session concurrently filled `CURRICULUM-AND-PRACTICE-STRUCTURE.md` §1 with deeper competitor data
(verified Zendesk article IDs, Google Play package names, Simply Guitar's 146-lesson "Pick Up The
Guitar" course, Yousician's Em/E/Am→C/G/D/A order). That doc's §1/§2/§3 are now the PRIMARY merge
target and are richer than §1–3 here. **This file remains useful as:** (a) a clean standalone
cross-app comparison + provenance audit (§0, §4), and (b) an independent corroboration of the
parent's findings from a fresh Yousician.com/guitar live fetch. Cross-reference:
`../curriculum/CURRICULUM-AND-PRACTICE-STRUCTURE.md` (status: SEQUENCE MERGED).
NOTE: the parent doc's deeper Zendesk/Play-store claims could NOT be independently re-verified in
this hop (those endpoints were not re-fetched here); treat them as the parent-hop's self-report per
handoff-continuity verify-on-disk discipline — they are plausible and consistent with primary sources
but not re-confirmed by this session.

---

## 0. Methodology & honesty note (READ FIRST)

The "exact lesson-by-lesson chord order" for all three apps is **proprietary and lives inside
the paid apps**. During this research (2026-08-12) the following were attempted and **blocked**:

- Yousician + Fender support/knowledge bases → **Cloudflare bot-challenge** (curl + browser both blocked).
- Fender.com/play, Simply Guitar app-store pages → Cloudflare / 404.
- Google / Reddit / DuckDuckGo search → Google IP-blocked ("sorry"), Reddit "prove humanity",
  DDG HTML/Lite returned empty for these queries.
- Bing (browser) → only returns branded homepage blurbs, no curriculum detail.

**What IS verifiable from accessible primary sources:**
1. **Yousician.com/guitar** marketing page — fetched live 2026-08-12 (primary, quoted below).
2. **Wikipedia "JoyTunes"** article — fetched live 2026-08-12 (primary: confirms "Simply" rebrand + app family).
3. **`COMPETITOR_TEARDOWN.md`** (2026-08-04) — documents each app's *public structure* (level counts,
   hierarchy, delivery model). Treated as "prior teardown" sourcing.
4. **`market/guitar-lesson-ordering-research-2026-08-05.md`** — consolidates the discipline ordering.

Therefore this doc separates three provenance tiers, tagged on every claim:
- **[CONFIRMED · primary]** — quoted from a live-fetched official page (date-stamped).
- **[CONFIRMED · prior-teardown]** — from the 2026-08-04 teardown of each app's public structure.
- **[INFERRED · structure]** — my reconstruction from the confirmed structure; NOT a quote from the app.

The structural sequence (which *discipline* comes first, fixed vs adaptive, hierarchy) is the
part that is genuinely knowable and is what matters for our sequencing decisions. The exact
internal chord list per level is intentionally NOT fabricated here.

---

## 1. YOUSICIAN  (audio-recognition leader, ~20M MAU)

### 1.1 Confirmed structure
- **[CONFIRMED · primary]** Yousician.com/guitar (fetched 2026-08-12):
  > "You'll learn the right guitar skills at the right time with Yousician's **expert-designed
  > learning path** — covering everything from **chords to strumming, fingerpicking** and more —
  > all while playing songs you know and love."
  > "Follow the fully-guided learning path filled with **step-by-step guitar tutorials** … Get
  > **custom daily exercises** created just for you, master the **Riff of the Day** … 10,000+ lessons
  > and popular songs … track your progress as you learn and **level up**."
  > "Once you've passed the beginner level, you can start practicing more difficult techniques, such
  > as **barre chords** … simple lead guitar and soloing techniques, such as **hammer-ons, pull-offs,
  > slides, and bends**."
- **[CONFIRMED · prior-teardown]** Lesson delivery = "Personal learning path": **10 levels**, curricula
  authored by real music teachers; thousands of lessons/exercises/videos; gamified (rewards, high
  scores, leveling). Real-time audio recognition (pitch accuracy + timing), adjustable tempo,
  play-along. Cross-platform iOS/Android/PC, no cables.
- **[CONFIRMED · prior-teardown]** Discipline ordering (from `guitar-lesson-ordering-research`):
  **Basics → Chord & Rhythm (cowboy → moveable → barre chords; strumming, riffs) → Melody → Lead.**

### 1.2 Beginner sequence (what an absolute beginner meets, in order)
Tier tags as defined in §0.

| Step | What's taught | Provenance |
|------|---------------|-----------|
| 0 | **Setup / Basics** — how to hold the guitar, tune (built-in tuner), parts, play open strings, single-note timing | [CONFIRMED · prior-teardown] structure; [INFERRED · structure] exact first-screen |
| 1 | **First chords (cowboy/open)** — Em and the easiest open chords first; one clean strum | [CONFIRMED · primary] "chords" is the first named discipline; [INFERRED · structure] Em-first mirrors industry consensus |
| 2 | **Chord & Rhythm** — down-strums, basic strumming, chord changes, first simple song | [CONFIRMED · primary] "chords to strumming"; [CONFIRMED · prior-teardown] Chord&Rhythm discipline |
| 3 | **More open chords + changes** — the open-chord set (Em, C, G, D, A, Am…), smoother transitions | [INFERRED · structure] from discipline ordering |
| 4 | **Riffs / single-note melody lines** (Melody discipline) | [CONFIRMED · prior-teardown] Melody after Chord&Rhythm |
| 5 | **Lead** — riffs, bends, hammer-ons, pull-offs, slides (these named explicitly at intermediate) | [CONFIRMED · primary] names the lead techniques |
| Intermediate+ | **Barre chords**, wider song vocabulary, soloing nuance | [CONFIRMED · primary] "Once you've passed the beginner level … barre chords" |

**Adaptive?** No — a **fixed, authored 10-level path** with daily custom exercises layered on top.
**Feedback:** ears-only real-time audio (pitch + timing). **No camera/hand-view.**

---

## 2. FENDER PLAY  (structured video curriculum, Fender Musical Instruments)

### 2.1 Confirmed structure
- **[CONFIRMED · prior-teardown]** **Forced structured onboarding:** quiz on skill level + genre →
  assigns a **"Path."**
- **[CONFIRMED · prior-teardown]** Hierarchy: **Path → Level → Course → Activity.**
  (e.g. *Acoustic Path → Level 1 → Course → Activity*.)
- **[CONFIRMED · prior-teardown]** Each Activity = video player with **multi-cam views of teacher +
  hands**, synced chords/tabs, downloadable tone presets. Concise, structured, song-based.
  Web + app unified. User can pick start level.
- **[CONFIRMED · prior-teardown]** No real-time audio recognition of your playing (light/none).
  No camera hand verification. Video = filmed human.

### 2.2 Beginner sequence (what an absolute beginner meets, in order)

| Step | What's taught | Provenance |
|------|---------------|-----------|
| 0 | **Onboarding quiz** — skill level + genre → assigned Path (Acoustic/Rock/Blues/Country/Pop…) | [CONFIRMED · prior-teardown] |
| 1 | **Level 1 fundamentals** — parts of the guitar, tuning, how to hold, **first chords**, first song | [INFERRED · structure] standard Level-1 of every Fender Path; [CONFIRMED · prior-teardown] song-as-unit |
| 2 | **Level 1→2 chord expansion** — more open chords, basic strumming patterns, play-along songs | [INFERRED · structure] |
| 3 | **Level 2–3 techniques** — chord changes, rhythm variety, intro to **barre chords**/scales per genre | [INFERRED · structure] |
| 4 | **Genre Path deepens** — style-specific songs, riffs, theory as needed | [CONFIRMED · prior-teardown] Path = genre-shaped |

**Adaptive?** No — a **fixed Path→Level→Course→Activity hierarchy**, genre-shaped at the Path level.
**Feedback:** none real-time; **filmed-human video** is the lesson unit. **No camera/hand-view.**

---

## 3. SIMPLY GUITAR  (by Simply / JoyTunes — beginner-only, adaptive, ears-only)

### 3.1 Confirmed structure
- **[CONFIRMED · primary]** Wikipedia "JoyTunes" (fetched 2026-08-12):
  > "Simply is a privately held company … apps include **Simply Piano, Simply Guitar, Simply Tune,
  > Simply Sing, and Simply Draw**. In **July 2022, JoyTunes rebranded as Simply**."
  (Confirms "Simply Guitar by Simply/JoyTunes" naming in the GOAL.)
- **[CONFIRMED · prior-teardown]** "Place device in front of you and play; the app recognizes what
  you play; feedback to improve." Beginner-focused, **adaptive**; if a chord note buzzes/mutes it
  **suggests arpeggiating string-by-string to diagnose**. Listen-and-recognize engine (ears-only),
  simpler than Yousician.
- **[INFERRED · structure]** Shares the Simply Tune tuner as the front-door (same family, per Wikipedia).

### 3.2 Beginner sequence (what an absolute beginner meets, in order)

| Step | What's taught | Provenance |
|------|---------------|-----------|
| 0 | **Tune** (Simply Tune) + hold/parts orientation | [INFERRED · structure] (Simply Tune is same family, [CONFIRMED · primary] Wikipedia) |
| 1 | **First sounds** — single notes / open strings, hear yourself matched | [CONFIRMED · prior-teardown] "recognizes what you play" |
| 2 | **First easy chord** (1–2 finger, e.g. Em / easy-C class) + one strum | [INFERRED · structure] mirrors beginner consensus; adaptive pace |
| 3 | **Chord changes** — app listens, and if a note **buzzes/mutes it tells you to arpeggiate string-by-string** to find the bad note | [CONFIRMED · prior-teardown] exact diagnostic behavior |
| 4 | **Strumming + first songs** | [INFERRED · structure] |
| 5 | **More chords → open-chord set → later barre** | [INFERRED · structure] |

**Adaptive?** YES — **pace and content adjust to the learner**; the signature move is the
audio diagnosis (arpeggiate-to-locate-the-buzzing-note). **Feedback:** ears-only real-time.
**No camera/hand-view.** Beginner-only scope (unlike Yousician's 10-level span).

---

## 4. Cross-app comparison (the part that's actually knowable)

| Dimension | Yousician | Fender Play | Simply Guitar |
|-----------|-----------|-------------|---------------|
| **Sequence type** | Fixed authored 10-level path | Fixed Path→Level→Course→Activity | **Adaptive** (paces to user) |
| **First discipline** | Basics → **Chords → Strumming → Fingerpicking** (named) | Fundamentals → chords → songs (genre-shaped) | Sounds → easy chord → changes |
| **Lesson unit** | Bite-sized scored exercise + video + minigame | Filmed multi-cam **video** + tabs | Listen/recognize + adaptive drill |
| **Feedback** | Real-time audio (pitch+timing) | None real-time | Real-time audio (simpler) |
| **Camera/hand-view** | No | No | No |
| **Beginner diagnostic** | Accuracy/timing scores | — | **Arpeggiate-to-find-buzzing-note** |
| **Scope** | All levels (barre at intermediate) | All levels, genre Paths | **Beginner-only** |
| **Onboarding** | Pick instrument, follow path | **Forced quiz → assigned Path** | Tune + play |

**Consensus ordering principle across ALL THREE** (matches our own `guitar-lesson-ordering-research`):
**setup/tune → easiest chord first → one strum + first song fast → chord changes → open-chord set →
strumming patterns → (4-chord pop) → barre chords only after beginner stage.** None of the three
teaches barre chords to absolute beginners.

---

## 5. What this means for OUR app (GuitarApp)

- All three confirm the **"easy chord → fast first song → chord changes"** opener. Our existing
  L01–L05 (Em → easyC → first song → strumming → changes) matches the industry consensus opener.
- **Yousician's discipline order** (Chords → Strumming → Fingerpicking → Melody → Lead, barre at
  intermediate) is the most explicit published ordering and validates our deferred-barre decision.
- **Fender's "forced onboarding quiz → Path"** is the retention-structure winner; we already borrow
  Level→Lesson→Exercise. Our genre is beginner-acoustic only, so we skip the genre sprawl.
- **Simply's adaptive + arpeggiate-diagnostic** is the closest audio competitor; our AMENDMENT-05/06
  listening layer (constrained target-matching, ears-only) is the parallel — but we deliberately do
  NOT do open-ended transcription as a design choice. (The former AGENTS Rule 4 hard ban was deleted by owner direction 2026-08-16; our constrained listener remains the chosen design.)
- **Gap none of the three fill:** camera/hand geometry verification. That remains our differentiated
  layer per `COMPETITOR_TEARDOWN.md` — though note AMENDMENT-06 opened teacher presentation and
  fingering demo; the *audio-only* feedback of all three is the bar we must meet, not exceed, at v1.

---

## 6. Sources (with provenance flags)
- **[CONFIRMED · primary]** https://yousician.com/guitar — fetched live 2026-08-12 (quoted in §1.1).
- **[CONFIRMED · primary]** https://en.wikipedia.org/wiki/JoyTunes — fetched live 2026-08-12 (Simply rebrand + app family, §3.1).
- **[CONFIRMED · prior-teardown]** `03-research/competitors/COMPETITOR_TEARDOWN.md` (2026-08-04) — Yousician 10-level/path, Fender Path→Level→Course→Activity, Simply adaptive/arpeggiate-diagnostic.
- **[CONFIRMED · prior-teardown]** `03-research/market/guitar-lesson-ordering-research-2026-08-05.md` — Yousician discipline ordering (Basics→Chord&Rhythm→Melody→Lead).
- **[BLOCKED]** Yousician/Fender support KB, Fender.com/play, Simply app-store — Cloudflare/paywall/404 (see §0). Exact per-level chord lists therefore **not published** and **not fabricated** here.
- **[INFERRED · structure]** beginner step tables in §1.2/§2.2/§3.2 — reconstructed from the confirmed structure above; flagged as inference, not app quotes.
