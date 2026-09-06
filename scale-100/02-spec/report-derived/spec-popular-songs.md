# spec-popular-songs.md — Popular-Song Name Pool (SONGS track feed)

**Source file:** `~/scraping-stack/harvester/out/FINAL_popular_songs.jl`
**Verified by:** row-level read of the 56-row `.jl` (2026-08-13 content audit, `HANDOFF-2026-08-13-spider-report-contents.md`).
**Purpose:** Provide a popularity-ranked pool of real, well-known song NAMES plus their deep Songsterr tab source URLs, to inform the SONGS track of the GuitarApp lesson app.

---

## LEGAL LINE (must be preserved verbatim in any downstream artifact)

> **Song NAMES and song STRUCTURE are facts (permitted).** Do **NOT** scrape, reproduce,
> transcribe, or redistribute song **lyrics**, **tab CONTENT** (the note-for-note tablature on
> the Songsterr pages), or **audio**. Tab CONTENT must **never** be harvested.
> Every SONGS lesson in GuitarApp is built from **OUR OWN original 8-chord loops** -- the
> popular-song names here are used only as recognizable *titles/labels* and a popularity
> signal, never as a basis for copying protected expression. Public-domain `chord_ref`
> voicings are chord *shapes* (facts, not expression).

---

## 1. What the file contains (verified)

- **56 total rows.**
- **50 real song rows** -- each carries a **deep Songsterr tab link** of the form
  `https://web.archive.org/web/<ts>/https://www.songsterr.com/a/wsa/<artist>-<song>-tab-s<id>`.
- **6 NON-song rows** (excluded from the name pool):
  - 4 UI / category rows: `Any instruments`, `Guitar`, `Bass`, `Drums` (Songsterr nav landing pages).
  - 2 scrape-noise rows: `Led Zeppelin` (artist index page `/a/wsa/led-zeppelin-tabs-a25`)
    and `Backing track` (a backing-track variant of Stairway to Heaven).
- All 50 deep links are **Web-Archive-wrapped** (snapshot 2026-08-13), so each URL is a
  stable reference cite, not a live scrape. The link points *to the page*; its CONTENT is not extracted.

> NOTE: Earlier drafts claimed 55 songs plus 1 stray word ('One') and that all URLs were
> coarse index pages. Both were wrong and are corrected above. 'One' is a real Metallica
> song (`.../metallica-one-tab-s444`); 50 of 56 rows are genuine deep tab links.

---

## 2. Popularity-ranked name pool (50 real songs)

Rank follows source-file order (the harvester captured them in descending popularity;
the shared `popularity_hint` field confirms the top cluster). The deep-link URL is the
per-song **source reference** (cite only -- never harvested for content).

| # | Song name | Deep source link (reference only) |
| 1 | Master of Puppets | https://web.archive.org/web/20260813051303/https://www.songsterr.com/a/wsa/metallica-master-of-puppets-tab-s455118 |
| 2 | Nothing Else Matters | https://web.archive.org/web/20260813051303/https://www.songsterr.com/a/wsa/metallica-nothing-else-matters-tab-s439171 |
| 3 | Enter Sandman | https://web.archive.org/web/20260813051303/https://www.songsterr.com/a/wsa/metallica-enter-sandman-tab-s19 |
| 4 | Stairway to Heaven | https://web.archive.org/web/20260813051303/https://www.songsterr.com/a/wsa/led-zeppelin-stairway-to-heaven-tab-s27 |
| 5 | Sweet Child O' Mine | https://web.archive.org/web/20260813051303/https://www.songsterr.com/a/wsa/guns-n-roses-sweet-child-o-mine-tab-s23 |
| 6 | Smells Like Teen Spirit | https://web.archive.org/web/20260813051303/https://www.songsterr.com/a/wsa/nirvana-smells-like-teen-spirit-tab-s269 |
| 7 | Come As You Are | https://web.archive.org/web/20260813051303/https://www.songsterr.com/a/wsa/nirvana-come-as-you-are-tab-s14 |
| 8 | Crazy Train | https://web.archive.org/web/20260813051303/https://www.songsterr.com/a/wsa/ozzy-osbourne-crazy-train-tab-s61178 |
| 9 | Creep | https://web.archive.org/web/20260813051303/https://www.songsterr.com/a/wsa/radiohead-creep-tab-s97 |
| 10 | Back In Black | https://web.archive.org/web/20260813051303/https://www.songsterr.com/a/wsa/ac-dc-back-in-black-tab-s1024 |
| 11 | Californication | https://web.archive.org/web/20260813051303/https://www.songsterr.com/a/wsa/red-hot-chili-peppers-californication-tab-s439 |
| 12 | One | https://web.archive.org/web/20260813051303/https://www.songsterr.com/a/wsa/metallica-one-tab-s444 |
| 13 | Fade to Black | https://web.archive.org/web/20260813051303/https://www.songsterr.com/a/wsa/metallica-fade-to-black-tab-s20 |
| 14 | Hotel California | https://web.archive.org/web/20260813051303/https://www.songsterr.com/a/wsa/eagles-hotel-california-tab-s447 |
| 15 | Paranoid | https://web.archive.org/web/20260813051303/https://www.songsterr.com/a/wsa/black-sabbath-paranoid-tab-s296 |
| 16 | Killing in the Name | https://web.archive.org/web/20260813051303/https://www.songsterr.com/a/wsa/rage-against-the-machine-killing-in-the-name-tab-s360 |
| 17 | For Whom The Bell Tolls | https://web.archive.org/web/20260813051303/https://www.songsterr.com/a/wsa/metallica-for-whom-the-bell-tolls-tab-s572 |
| 18 | Seek & Destroy | https://web.archive.org/web/20260813051303/https://www.songsterr.com/a/wsa/metallica-seek-destroy-tab-s247 |
| 19 | Iron Man | https://web.archive.org/web/20260813051303/https://www.songsterr.com/a/wsa/black-sabbath-iron-man-tab-s8 |
| 20 | Zombie | https://web.archive.org/web/20260813051303/https://www.songsterr.com/a/wsa/cranberries-zombie-tab-s431 |
| 21 | Everlong | https://web.archive.org/web/20260813051303/https://www.songsterr.com/a/wsa/foo-fighters-everlong-tab-s86505 |
| 22 | Can't Stop | https://web.archive.org/web/20260813051303/https://www.songsterr.com/a/wsa/red-hot-chili-peppers-cant-stop-tab-s12 |
| 23 | Where Is My Mind? | https://web.archive.org/web/20260813051303/https://www.songsterr.com/a/wsa/pixies-where-is-my-mind-tab-s14912 |
| 24 | Do I Wanna Know? | https://web.archive.org/web/20260813051303/https://www.songsterr.com/a/wsa/arctic-monkeys-do-i-wanna-know-tab-s383929 |
| 25 | The Trooper | https://web.archive.org/web/20260813051303/https://www.songsterr.com/a/wsa/iron-maiden-the-trooper-tab-s338 |
| 26 | Johnny B. Goode | https://web.archive.org/web/20260813051303/https://www.songsterr.com/a/wsa/chuck-berry-johnny-b-goode-tab-s10 |
| 27 | Sultans Of Swing | https://web.archive.org/web/20260813051303/https://www.songsterr.com/a/wsa/dire-straits-sultans-of-swing-tab-s30084 |
| 28 | Thunderstruck | https://web.archive.org/web/20260813051303/https://www.songsterr.com/a/wsa/ac-dc-thunderstruck-tab-s1352 |
| 29 | Symphony Of Destruction | https://web.archive.org/web/20260813051303/https://www.songsterr.com/a/wsa/megadeth-symphony-of-destruction-tab-s487 |
| 30 | Hysteria | https://web.archive.org/web/20260813051303/https://www.songsterr.com/a/wsa/muse-hysteria-tab-s11430 |
| 31 | Bohemian Rhapsody | https://web.archive.org/web/20260813051303/https://www.songsterr.com/a/wsa/queen-bohemian-rhapsody-tab-s270 |
| 32 | Smoke On The Water | https://web.archive.org/web/20260813051303/https://www.songsterr.com/a/wsa/deep-purple-smoke-on-the-water-tab-s329 |
| 33 | Highway To Hell | https://web.archive.org/web/20260813051303/https://www.songsterr.com/a/wsa/ac-dc-highway-to-hell-tab-s289 |
| 34 | Under The Bridge | https://web.archive.org/web/20260813051303/https://www.songsterr.com/a/wsa/red-hot-chili-peppers-under-the-bridge-tab-s99 |
| 35 | Beat It | https://web.archive.org/web/20260813051303/https://www.songsterr.com/a/wsa/michael-jackson-beat-it-tab-s10259 |
| 36 | The House Of The Rising Sun | https://web.archive.org/web/20260813051303/https://www.songsterr.com/a/wsa/animals-the-house-of-the-rising-sun-tab-s63 |
| 37 | Sweet Home Alabama | https://web.archive.org/web/20260813051303/https://www.songsterr.com/a/wsa/lynyrd-skynyrd-sweet-home-alabama-tab-s58984 |
| 38 | My Own Summer (Shove It) | https://web.archive.org/web/20260813051303/https://www.songsterr.com/a/wsa/deftones-my-own-summer-shove-it-tab-s595 |
| 39 | Wish You Were Here | https://web.archive.org/web/20260813051303/https://www.songsterr.com/a/wsa/pink-floyd-wish-you-were-here-tab-s153 |
| 40 | Toxicity | https://web.archive.org/web/20260813051303/https://www.songsterr.com/a/wsa/system-of-a-down-toxicity-tab-s21961 |
| 41 | Heart-Shaped Box | https://web.archive.org/web/20260813051303/https://www.songsterr.com/a/wsa/nirvana-heart-shaped-box-tab-s31 |
| 42 | Aerials | https://web.archive.org/web/20260813051303/https://www.songsterr.com/a/wsa/system-of-a-down-aerials-tab-s3709 |
| 43 | Comfortably Numb | https://web.archive.org/web/20260813051303/https://www.songsterr.com/a/wsa/pink-floyd-comfortably-numb-tab-s271 |
| 44 | Another One Bites the Dust | https://web.archive.org/web/20260813051303/https://www.songsterr.com/a/wsa/queen-another-one-bites-the-dust-tab-s371 |
| 45 | Seven Nation Army | https://web.archive.org/web/20260813051303/https://www.songsterr.com/a/wsa/white-stripes-seven-nation-army-tab-s265 |
| 46 | Psychosocial | https://web.archive.org/web/20260813051303/https://www.songsterr.com/a/wsa/slipknot-psychosocial-tab-s19615 |
| 47 | Feel Good Inc. | https://web.archive.org/web/20260813051303/https://www.songsterr.com/a/wsa/gorillaz-de-la-soul-feel-good-inc-tab-s549 |
| 48 | War Pigs | https://web.archive.org/web/20260813051303/https://www.songsterr.com/a/wsa/black-sabbath-war-pigs-tab-s10137 |
| 49 | Chop Suey! | https://web.archive.org/web/20260813051303/https://www.songsterr.com/a/wsa/system-of-a-down-chop-suey-tab-s3708 |
| 50 | Money | https://web.archive.org/web/20260813051303/https://www.songsterr.com/a/wsa/pink-floyd-money-tab-s15761 |

---

## 3. Excluded rows (6 -- NOT songs)

| Row | Label | URL | Reason |
| -- | Any instruments | https://web.archive.org/web/20260813051303/https://www.songsterr.com/ | non-song (UI/category or scrape noise) |
| -- | Guitar | https://web.archive.org/web/20260813051303/https://www.songsterr.com/?inst=guitar | non-song (UI/category or scrape noise) |
| -- | Bass | https://web.archive.org/web/20260813051303/https://www.songsterr.com/?inst=bass | non-song (UI/category or scrape noise) |
| -- | Drums | https://web.archive.org/web/20260813051303/https://www.songsterr.com/?inst=drum | non-song (UI/category or scrape noise) |
| -- | Led Zeppelin | https://web.archive.org/web/20260813051303/https://www.songsterr.com/a/wsa/led-zeppelin-tabs-a25 | non-song (UI/category or scrape noise) |
| -- | Backing track | https://web.archive.org/web/20260813051303/https://www.songsterr.com/a/wsa/led-zeppelin-stairway-to-heaven-backing-track-s27 | non-song (UI/category or scrape noise) |

---

## 4. How this feeds the SONGS track

1. **Popularity signal / lesson prioritization.** The 50 names are the most-requested,
   recognizable songs learners search for. They tell the SONGS track *which recognizable
   titles* to attach to our original practice loops so the catalog feels relevant --
   without ever using the original recordings, tabs, or lyrics.
2. **Naming & labeling only.** A SONGS lesson may be *titled* after a well-known song
   (e.g. a practice loop 'in the style of / inspired by' a named track) to aid discovery.
   The underlying 8-chord loop is **original**, arithmetically verified by
   `06-prototypes/step0/schema/chord-theory-check.js` (source of truth for chord spelling +
   playability), and carries no protected material.
3. **Per-song source refs.** The deep Songsterr links are kept as *human-readable citations*
   (where the popularity signal came from) and as a 'go to the real tab' pointer. The link
   target's tab CONTENT is **never** fetched, parsed, stored, or reproduced by GuitarApp.
4. **No dependency on protected expression.** Because names/structure are facts and the
   loops are original, the SONGS track has zero licensing exposure from this dataset.
   Consistent with the product guardrail: 'Not a song-on-demand service (licensing = existential risk).'
5. **Legal firewall.** The 6 non-song rows are dropped. No lyrics, no tabs, no audio, no
   transcription. If deeper tab data is ever wanted, it is out of scope per the legal line
   and would require a fresh owner decision plus licensing, not this dataset.

---

## 5. Provenance

- **Raw data:** `~/scraping-stack/harvester/out/FINAL_popular_songs.jl` (56 rows).
- **Fields per row:** `song`, `url`, `popularity_hint`, `source`.
- **Audit:** `Desktop/GuitarApp/scale-100/HANDOFF-2026-08-13-spider-report-contents.md`
  (second-pass, row-level content audit; corrects prior miscounts).
- **Generated:** 2026-08-13, subagent spec extraction for `02-spec/report-derived/`.

**LEGAL LINE (repeat):** song NAMES/structure are facts (permitted); do NOT scrape/reproduce
lyrics, tabs, or audio; tab CONTENT must not be harvested; SONGS lessons use OUR OWN original
8-chord loops.