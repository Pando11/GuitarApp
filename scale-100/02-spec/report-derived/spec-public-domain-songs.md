# Spec — Public-Domain / Folk Song Catalog (Zero-Licensing-Risk Source)

**Source file:** `~/scraping-stack/harvester/out/FINAL_public_domain_songs.jl`  
**Generated:** 2026-08-13  
**Prepared by:** Hermes subagent (report→spec derivation)  
**Project:** GuitarApp / SONGS track  

> **SCOPE OF THIS DOCUMENT.** Titles only. This is a *catalog of song names* 
drawn from a public-domain / folk archive. It contains **no chords, no chord 
progressions, no lyrics, and no audio.** The upstream source (folksong.org.nz) 
carries no chord markup; chord harvesting there is impossible and was never 
attempted. See §7 for the binding legal line.

## 1. Purpose

GuitarApp's SONGS track ships **original 8-chord loops** — never reproductions 
of real songs. This catalog is the *safe material pool*: a verified list of 
public-domain and traditional folk song **names** we may legitimately reference 
by name (song titles are facts, not expression) and draw *thematic / naming* 
inspiration from when composing our own loops. It is a reference index, not a 
content source to transcribe.

## 2. Provenance & Shape of the Source

- **Rows:** 348 JSON-Lines records, one per (song, category) listing.
- **Fields per row:** `title`, `category`, `url` (web.archive.org snapshot of the 
  folksong.org.nz page), `source` (the index page the row was harvested from).
- **Origin:** `folksong.org.nz` — a New Zealand folk-song archive; all rows are 
  NZ/Polynesian traditional, Māori, school, regional, and Christmas folk material.
- **No chord/lyric payload:** confirmed by content audit 
  (`HANDOFF-2026-08-13-spider-report-contents.md` §3). The archive's pages are 
  lyrics/prose with no chord markup, so no chord data exists to import.
- **Category encoding:** `category` is a compound string `<collection> * <subcategory>`; 
  this spec uses the **subcategory** as the bucket (e.g. `NZ Folksong * Maori Songs` → `Maori Songs`).

## 3. Verified Metrics (reconciled by re-reading every row)

| Metric | Value |
|---|---|
| Total rows | 348 |
| Distinct titles (exact) | 302 |
| Distinct titles (normalized: lowercase + whitespace-collapsed) | 299 |
| Duplicate rows beyond exact distinct | 46 |
| Duplicate rows beyond normalized distinct | 49 |

**Normalization note.** The 3 titles that collapse under normalization are pure 
case differences — `In The Tararua Ranges` / `In the Tararua Ranges`, 
`STATS` / `stats`, `Pinepine Te Kura` / `Pinepine te Kura`. They are the same songs.

> ⚠️ **CORRECTION vs. earlier draft.** A prior handoff stated **38** duplicate-title 
> rows. That figure was an error from an earlier draft. The verified count is 
> **46** raw (49 normalized) duplicate rows. Use the numbers in this table.

## 4. Category Breakdown

| # | Category (subcategory bucket) | Rows | Distinct titles in bucket |
|---|---|---|---|
| | Maori Songs | 132 | 129 |
| | New Zealand Folk Songs for School Projects | 89 | 88 |
| | songlist | 59 | 59 |
| | NZFS song pages to be made | 25 | 25 |
| | Regional songs | 17 | 17 |
| | Christmas Songs | 15 | 15 |
| | John Archer's Ballads | 7 | 7 |
| | Train Songs | 2 | 2 |
| | Playground Rhymes | 2 | 2 |
| | **TOTAL** | **348** | **302** |

Buckets in priority order for SONGS content (largest, richest pools first): 
**Maori Songs (132)**, **School Projects (89)**, **songlist (59)**, 
**NZFS song pages to be made (25)**, **Regional (17)**, **Christmas (15)**, 
**John Archer's Ballads (7)**, **Train Songs (2)**, **Playground Rhymes (2)**.

> Note: the `NZFS song pages to be made` bucket (25 rows) are *planned* pages in 
> the source — titles exist but the detail pages were not yet authored. Treat as 
> lower-confidence entries (name-only; verify before use).

## 5. The Catalog (titles only, by category)

Each bucket lists its **distinct** titles. A `×N` after a title means it is listed 
N times *within* that bucket (same song, repeated listing). A `_also: <cat>_` note 
means the same normalized title also appears under another bucket (cross-listing). 
No chords, lyrics, or audio are included or implied.

### Maori Songs  (132 rows, 129 distinct)

- 1st
- 2nd Pinepine te Kura
- 2nd Takoto Rawa Iho
- Anania
- Anei rā ngā mahi e
- Arawa
- Arnold
- CD recording hints
- David
- Dean
- Deane
- Derek
- Difficulties translating moteatea
- Dovey
- Dr Hirini
- E Ko Te Tui
- E Noho Ana Au
- E Noho Tuheitia
- E Tū Tautoko Noho
- Eddie
- Engari Te Tītī  _(also: Regional songs)_
- Engari Te Tītī -
- Fa'ama'i
- Flick
- Full details
- Grey's 'Ko Nga Mahinga'
- Guide Bella
- HERE
- Ha-ere Mai
- Haere mai a Hana Koko
- Haere mai te manuhiri
- Haere rā e hine
- Haunui & Wairaka
- He Potiki Mo Wharaurangi
- He pipi māu e hine
- He rā whānau koa ki a koe
- He tangata pai rawa ia
- He tira tira
- Henare
- Hinewehi
- Hirini
- Hohepa
- Hori
- Howard
- I ngā wā o mua rā
- I te whare tarutaru
- John
- Ka Panapana
- Kaore Hoki Koia Te Rangi Nei  _(also: New Zealand Folk Songs for School Projects)_
- Kaore Hoki Te Mānukanuka
- Kaore Te Aroha Mo...
- Kaore he Pouri i Aotearoa-
- Kapokapo whetū iti
- Kei hea te tuna?
- Kingi ×2
- Ko wai kei Puketi?
- Korikori
- Kua riro C. A. T.
- Kupe & Wheki
- Kura Tīwaka Kaua
- Kīkiki Kokoko
- Kīkiki Kākaka
- Maewa
- Mahunga, pakihiwi...
- Mai Nga Ra o Mua
- Mainstream NZ Songs
- Maisy
- Manu iti
- Maori Dictionaries On-line
- Maori dictionaries
- Maori songbooks
- Me kā harikoa koe
- Mihi-ki-te-
- Moe Moe Moemoeā
- Moremore tākiki
- Motokā iti rawa e
- Mrs Kohine
- My Old Man's an All Black  _(also: New Zealand Folk Songs for School Projects, songlist)_
- Mā is white
- Māku Ra Pea
- Mārie Te Pō
- Nga Moteatea
- Ngata's
- Ngoi
- Ngā Tai o Honipaka
- Ngā rā o te wiki
- Now is the Hour
- Ohakune himene
- Oma rāpeti
- Pania
- Paraire
- Pinepine te Kura  _(also: New Zealand Folk Songs for School Projects)_
- Polly
- Prince
- Princess ×2
- Princess Te Rangi
- Pukeko in a Punga Tree  _(also: New Zealand Folk Songs for School Projects)_
- Pāpā hipi mangu
- Richard
- Rummage around and take whatever is useful.
- Ruru
- Si'i Lili Viola  _(also: New Zealand Folk Songs for School Projects)_
- Sir Apirana
- Takoto Rawa Iho
- Tama
- Tangi tangi pere
- Tapu Te Pō
- Taumarumaru
- Tauranga Moana
- Te matuku i hea?
- Tipu Ra Nga Uri
- Tohora nui
- Toia Tainui Tapotu ×2  _(also: Regional songs)_
- Toia Toia Mai Ra
- Tua Tua Koi Ranginui  _(also: New Zealand Folk Songs for School Projects)_
- Tuini
- Turongo
- Tuta
- Uhi Tai
- Upoko Upoko  _(also: Regional songs)_
- Whakawhiti rori
- What A Dopey Gang
- Whati - mistakes in waiata
- dates
- school songs
- songwriters
- stats  _(also: songlist)_
- waiata
- Ā haka mana

### New Zealand Folk Songs for School Projects  (89 rows, 88 distinct)

- - Marie Te Po
- - Rainbird in the Teatree
- A Fast Pair of Skis
- Apple Pickers' Ball  _(also: songlist)_
- Aunty May  _(also: songlist)_
- Barb Wire Annie  _(also: songlist)_
- Billy the Bus  _(also: songlist)_
- Bohemian Polka
- Charlie's Bash  _(also: songlist)_
- Christmas Begins With You  _(also: Christmas Songs)_
- Digger's Farewell
- Eel Song  _(also: songlist)_
- Engari Te Titi -
- Farewell to the Gumfields  _(also: songlist)_
- Fixin' To Die Rag
- Geraldine
- God Rest Ye Merry Gentlemen
- Goodnight Ruby  _(also: songlist)_
- Hakaru Races  _(also: songlist)_
- Hard Oil  _(also: Regional songs, songlist)_
- He Kau Ra
- How High's the Vai, Tinaana?
- In the Tararua Ranges  _(also: songlist)_
- Jersey Cow Came Mooing
- Kaore Hoki Koia Te Rangi Nei  _(also: Maori Songs)_
- Kaore Hoki Taku Manukanuka
- Kaore Hoki Te Manukanuka
- Kiwiana Christmas  _(also: Christmas Songs)_
- Lady loader-Driver  _(also: songlist)_
- Long and Friendly Road
- Looking for the Yeller
- MacKenzie
- Mahurangi Regatta
- Mail Coach Line  _(also: Regional songs)_
- Marie Te Po
- Matangi
- McKenzie's Ghost
- Me & Convoy 22
- Merry Minuet
- Merry Minuet - How High's the Vai
- Military Reports
- My Man's Gone Now -
- My Old Man's an All Black  _(also: Maori Songs, songlist)_
- My Tractor  _(also: John Archer's Ballads, Regional songs, songlist)_
- No Boots at All
- No More Double-Bunking
- O'Brien & the Whale
- Okaihau Express  _(also: Regional songs, songlist)_
- On the Slopes of Mt Alpha
- One on a Tractor -
- Opo
- Opo the Dolphin  _(also: Regional songs)_
- Pelorus Jack
- Pillows of the Dead
- Pinepine Te Kura  _(also: Maori Songs)_
- Postholes
- Postholes -
- Promises to Keep
- Pukeko in a Ponga Tree -
- Pukeko in a Punga Tree  _(also: Maori Songs)_
- Rainbird In the Tea-tree  _(also: songlist)_
- Richard 'King Dick' Seddon
- Rugby, Racing & Beer  _(also: songlist)_
- Run to the Brunner
- Seal Children - O'Brien and The Whale
- Send the Boats Away
- Shaky Isles
- Si'i Lili Viola ×2  _(also: Maori Songs)_
- State House Song  _(also: songlist)_
- Sticky Beak the Kiwi  _(also: Christmas Songs)_
- Super Man
- Tahora Nui
- Takato Rawa Iho
- Te Harinui  _(also: Christmas Songs)_
- The Canary Song
- The Marathon Song
- The Old Gum-diggers' Bar
- The Old Mackenzie Trail
- The Peavey Song
- The Southern Cross Looks Down  _(also: Christmas Songs)_
- The Terror of the Teraneek
- The Waipu Settlers
- Tinana?
- Tua Tua Koi Ranginui  _(also: Maori Songs)_
- Upside Down Christmas
- Walking on My Fee
- We Don't need Another Hero
- Working for the Roads Board  _(also: Regional songs, songlist)_

### songlist  (59 rows, 59 distinct)

- Apple Pickers' Ball  _(also: New Zealand Folk Songs for School Projects)_
- Auntie Alice Brought Us This
- Aunty May  _(also: New Zealand Folk Songs for School Projects)_
- Ballad writing
- Barb Wire Annie  _(also: New Zealand Folk Songs for School Projects)_
- Billy the Bus  _(also: New Zealand Folk Songs for School Projects)_
- Blood Red Roses
- Books
- Charlie's Bash  _(also: New Zealand Folk Songs for School Projects)_
- Chocolate
- Crossing the Kaipara Bar
- Down Trou
- Eel Song  _(also: New Zealand Folk Songs for School Projects)_
- Farewell to the Gumfields  _(also: New Zealand Folk Songs for School Projects)_
- Fields Of The Gum
- Folkies
- Friendly Road  _(also: NZFS song pages to be made)_
- Goodnight Ruby  _(also: New Zealand Folk Songs for School Projects)_
- Hakaru Races  _(also: New Zealand Folk Songs for School Projects)_
- Hard Oil  _(also: New Zealand Folk Songs for School Projects, Regional songs)_
- Hungover Liver
- I Got You
- I Only Spoke Portuguese
- In The Tararua Ranges  _(also: New Zealand Folk Songs for School Projects)_
- Ko'rareka
- Lady loader-Driver  _(also: New Zealand Folk Songs for School Projects)_
- Mangamahu  _(also: John Archer's Ballads)_
- My Old Man's an All Black  _(also: Maori Songs, New Zealand Folk Songs for School Projects)_
- My Tractor  _(also: John Archer's Ballads, New Zealand Folk Songs for School Projects, Regional songs)_
- New Zealand Christmas
- O'Brien and the Whale
- Okaihau Express  _(also: New Zealand Folk Songs for School Projects, Regional songs)_
- One on a Tractor  _(also: Christmas Songs)_
- Opo the Dolphin.
- Peavey Song
- Pukeko in a Ponga Tree
- Rainbird In the Tea-tree  _(also: New Zealand Folk Songs for School Projects)_
- Records
- River of Life
- Robber Kim
- Rugby, Racing & Beer  _(also: New Zealand Folk Songs for School Projects)_
- Run to the Brunner, Girls, Run
- Russian Jack
- STATS  _(also: Maori Songs)_
- Sea shanties
- Seal Children
- Seddon's Jubilee Song  _(also: Regional songs)_
- Somewhat Under the Weather
- Soon May The Needleman Come
- State House Song  _(also: New Zealand Folk Songs for School Projects)_
- Suited calloused fragile mystic
- Tahora (Don't Worry Mate)
- Taranaki Spring
- The
- The Girls Have Got The Tow Rope
- Waipu Settlers
- Walking On My Feet
- Working for the Roads Board  _(also: New Zealand Folk Songs for School Projects, Regional songs)_
- Writers

### NZFS song pages to be made  (25 rows, 25 distinct)

- Bird in the Thyme
- Click Go The Claws
- Exult for Te Kooti
- Farewell to Geraldine
- Friendly Road  _(also: songlist)_
- He Ngeri
- In Sight of the Mountain
- Jack's Song
- Kakino Georgy Grey
- Lament For The Moriori
- Leatherman
- Little Bird
- Oh Mr Frazer
- Only an Old Hearth Wall
- Seasons in the Valley
- Smoko
- Talking Dog
- The Kiwi
- The Mill
- The New Chum
- The Shearing's Coming Round
- Timber
- Untouchable Girl
- Waitaki River
- Wool Away Jack

### Regional songs  (17 rows, 17 distinct)

- E Tu Tautoko Noa
- Engari Te Tītī  _(also: Maori Songs)_
- Hard Oil  _(also: New Zealand Folk Songs for School Projects, songlist)_
- Kura Tīwaka Tāua
- Kāore Hoki Taku Manukanuka
- Mail Coach Line  _(also: New Zealand Folk Songs for School Projects)_
- My Tractor  _(also: John Archer's Ballads, New Zealand Folk Songs for School Projects, songlist)_
- Okaihau Express  _(also: New Zealand Folk Songs for School Projects, songlist)_
- Opo the Dolphin  _(also: New Zealand Folk Songs for School Projects)_
- Rainbird in the Teatree
- Seddon's Jubilee Song  _(also: songlist)_
- State House
- Toia Tainui
- Toia Tainui Tapotu  _(also: Maori Songs)_
- Tua Tua
- Upoko Upoko  _(also: Maori Songs)_
- Working for the Roads Board  _(also: New Zealand Folk Songs for School Projects, songlist)_

### Christmas Songs  (15 rows, 15 distinct)

- An Upside Down Christmas
- Christmas Begins With You  _(also: New Zealand Folk Songs for School Projects)_
- Christmas in New Zealand
- Christmas on the Beach
- Jingle Bells
- Kiwiana Christmas  _(also: New Zealand Folk Songs for School Projects)_
- Märie Te Pö
- One on a Tractor  _(also: songlist)_
- Sticky Beak the Kiwi  _(also: New Zealand Folk Songs for School Projects)_
- Summer Wonderland
- Tapu Te Po
- Te Harinui  _(also: New Zealand Folk Songs for School Projects)_
- The Jersey Cow Came Mooing
- The Night Before Christmas
- The Southern Cross Looks Down  _(also: New Zealand Folk Songs for School Projects)_

### John Archer's Ballads  (7 rows, 7 distinct)

- Black River Mine
- Mangamahu  _(also: songlist)_
- My Tractor  _(also: New Zealand Folk Songs for School Projects, Regional songs, songlist)_
- Sugra The Juggler
- The Eel
- The Lady Loader-Driver
- Wet Dag Crutching Blues

### Train Songs  (2 rows, 2 distinct)

- The Okaihau Express
- he Posthole Song

### Playground Rhymes  (2 rows, 2 distinct)

- Elastics
- PDF document

## 6. Proposal — Drawing Safe Material

**Principle:** the catalog is a *name and theme* pool, not a transcription source. 
Every SONGS lesson remains an **original 8-chord loop** composed by us. The PD/folk 
titles buy us (a) legally safe *lesson names* and (b) culturally grounded *themes* 
to compose around — nothing more.

1. **Use titles as lesson names / themes, not content.** A loop themed "Pukeko in a 
   Punga Tree" or "Okaihau Express" is fine to *name* that way; the loop itself is 
   our original chord sequence. Naming after a PD/folk title is a factual reference, 
   not reproduction.
2. **Prioritize the large, clearly-traditional buckets.** Maori Songs, School 
   Projects, and the generic songlist are traditional/folk by nature — safest. These 
   are ideal for "folk-flavored" original loops without touching any modern work.
3. **Seasonal content from Christmas (15).** The Christmas bucket supports a 
   zero-licensing holiday set of original loops (traditional carols/titles are PD).
4. **De-duplicate first.** Work from the **299 normalized distinct** titles, not the 
   348 rows. The 49 normalized duplicates are the same song listed under multiple 
   categories — pick one canonical name per song.
5. **Quarantine low-confidence buckets.** `NZFS song pages to be made` (25) are 
   planned/empty pages — name-only; verify the title is a real song before using it 
   as a lesson name. `Playground Rhymes` and `Train Songs` are tiny (2 each) — fine 
   as occasional flavor, not a content pillar.
6. **Compose, don't transcribe.** Even where a title maps to a real traditional 
   melody, we write our OWN 8-chord progression. We never reproduce the original 
   tune, lyrics, or arrangement. (This is also true for PD works — the rule is 
   original loops regardless of the source's PD status.)
7. **Data-quality gate.** The raw catalog contains scrape noise that must be filtered 
   before it is treated as a 'safe' pool. Four classes: (a) **case-dup pairs** — 
   collapse `STATS`/`stats` and `In The/ the Tararua Ranges`; (b) **lone artifacts** — 
   drop the stray title `The` (a `#mail` anchor captured as a song); (c) **section-header 
   / non-song noise** — entries that are clearly not songs, e.g. `1st`, `2nd Pinepine te 
   Kura`, `Full details`, `CD recording hints`, `Books`, `Records`, `Folkies`, `Ballad 
   writing`, `Sea shanties`, `Difficulties translating moteatea`, `Guide Bella`, `HERE`; 
   (d) **modern-song strays** — at least one clearly non-folk/non-PD title slipped in 
   (`We Don't need Another Hero`, a Tina Turner song); it must be removed, not used. A 
   human one-pass clean against the 299 normalized distinct titles is required before 
   any bucket is published as lesson material.
## 7. Legal Line (reaffirmed — binding)

- **SONGS lessons use ORIGINAL 8-chord loops only.** We never scrape, transcribe, 
  or reproduce real songs, their lyrics, their tabs, or their audio.
- **Song names and song structure are facts** (permitted to reference by name). This 
  catalog is exactly that — a list of facts (titles), nothing expressive.
- **Public-domain entries are title catalog only.** Even PD status does not license 
  us to copy a melody; we still compose original loops. PD simply removes any 
  naming/theme concern.
- **No chord/tab content was or will be harvested** from this source (it has none, 
  and the rule forbids it regardless).
- **Listening feature (if used) is constrained target-matching only** — on-device, 
  audio never uploaded, never open-ended transcription (per `AGENTS.md` rules 2 & 4).

## 8. Appendix — Reconciliation

- Rows = 348; distinct exact = 302; distinct normalized = 299.
- Raw duplicate rows = 46 (= 348 − 302). Normalized duplicate rows = 49 (= 348 − 299).
- Buckets sum: 132 (Maori Songs) + 89 (New Zealand Folk Songs for School Projects) + 59 (songlist) + 25 (NZFS song pages to be made) + 17 (Regional songs) + 15 (Christmas Songs) + 7 (John Archer's Ballads) + 2 (Train Songs) + 2 (Playground Rhymes) = 348.
- Cross-listed (normalized title under >1 bucket): 39 titles.

**Source integrity:** every row was parsed and counted by re-reading the `.jl` 
file; counts above are derived, not inherited from any prior summary.

