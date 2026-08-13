# spec-chord-ref.md — Using `FINAL_chord_ref.jl` as an External Sanity-Check Reference for `chord-theory-check.js`

**Date:** 2026-08-13
**Author:** Hermes (subagent, content-audit + arithmetic-verification pass)
**Project:** GuitarApp guitar-lessons app
**Source data:** `~/scraping-stack/harvester/out/FINAL_chord_ref.jl` (45 rows, verified by reading every row)
**Source of truth:** `Desktop/GuitarApp/06-prototypes/step0/schema/chord-theory-check.js` (run via `node run-chord-check.js`)
**Governing rules:** AGENTS.md Hard Rule 8 (arithmetic proof, no human), AMENDMENT-06/10 (avatars MAY demonstrate fingerings **only** when driven from arithmetically-verified `chord-theory-check.js` data).

---

## 1. Purpose & Scope

This spec defines how the harvested chord reference (`FINAL_chord_ref.jl`) is used as a
**secondary, external sanity-check** against our arithmetically-verified chord engine, which
chords it covers, and the validation process for teacher-avatar fingering demos.

**It is NOT the source of truth.** `chord-theory-check.js` is the only authority for chord
correctness (AGENTS.md Rule 8). `FINAL_chord_ref.jl` is a cross-check, a nomenclature
validator, and a coverage/regression corpus — never a fingering data source.

**Explicit non-goal (per task + Rule 8):** we do **NOT** auto-import the `voicings` alt-text
into our fingering data. The alt-text is descriptive ("C major chord open position"), not
machine-parseable fret/finger coordinates, and Rule 8 requires fingerings to be proven by
arithmetic on our own data — not reverse-engineered from scraped prose.

---

## 2. What `FINAL_chord_ref.jl` Actually Contains (verified)

45 JSON-lines rows. Each row:

| Field | Meaning |
|---|---|
| `chord_name` | e.g. `"C Major Guitar Chord Diagrams"`, `"Cm6/9 Guitar Chord Diagrams"` |
| `voicings` | list of **descriptive alt-texts** for each chord diagram on the page, e.g. `["C major chord open position", "C major chord five string barre", "C major chord D form"]`. All 45 rows carry ≥1 voicing. |
| `url` / `source` | archived `guitar-chords.org.uk` page (Web Archive snapshot). Each of the 45 rows has a **distinct** archive URL (different crawl timestamps). |

- **Real source:** guitar-chords.org.uk — an independent, externally-published chord authority.
- **Voicings are alt-text, not coordinates.** They name the *kind* of shape (open position,
  five/six-string barre, D form, G form, "diagram N") but contain no fret numbers or finger
  assignments. This is confirmed by reading the rows: `voicings` are human-readable labels.
- **Legal status (HANDOFF §LEGAL LINE):** chord voicings are chord *shapes* — facts, not
  expression. Reference use is clean.

### Data-quality caveats inside the reference itself (it is scraped, not curated)
- **45 rows → only 23 distinct `chord_name` values.** The rest are duplicate captures of the
  same chord at different archive timestamps (e.g. `C Major Guitar Chord Diagrams` appears 2×,
  `C Minor Add 9` 3×, `C Major Six` 3×). Dedupe to **23 distinct chords** before counting coverage.
- **One mislabeled row:** row 11 `chord_name` = `"f Diminished Guitar Chord Diagrams"` (wrong
  root + lowercase), but its `voicings` = `["C Half Diminished m7b5 chord diagrams"]` and its URL
  is `c-half-diminished-chord.html`. The reference is itself imperfect — treat it as a sanity
  check, not gospel.
- **Root coverage is narrow:** distinct roots are **C and F only** (`F Sus 2` and the mislabeled
  `f Diminished`). The beginner-core roots (G, D, A, E, Am, Em, …) are **absent**. As a
  "coverage" reference it validates C-chord vocabulary almost exclusively.

---

## 3. How It Serves as an External Sanity-Check Reference

Three distinct roles, none of which supplant the arithmetic checker:

1. **Nomenclature validation (independent authority).** The reference proves that each chord
   *name* we use is a real, documented chord type on an external site — i.e. our chord taxonomy
   is not hallucinated. If we ever mint a chord label the reference has never heard of, that is a
   red flag for our own naming, surfaced by an independent source.

2. **Voicing shape-family catalog.** For each chord, the `voicings` list enumerates the *kinds*
   of shapes that exist in the wild (open, barre ×2, D-form, G-form, add9 "diagram N", etc.). This
   lets us sanity-check that our generated fingering spans the expected shape families and does
   not produce a voicing that contradicts all known real shapes for that chord. **Catalog check
   only** — we never copy the alt-text.

3. **Coverage / regression corpus for the checker itself (see §4).** The 23 distinct chords are
   overwhelmingly the *extended/altered* chords (6, 9, 11, 13, add9, m6, dim, aug, dim7, m7b5)
   that dominate real voicings. Running our own `parseChordName` over them exposes a gap in
   `chord-theory-check.js`. The reference is therefore a ready-made regression set for closing
   that gap.

---

## 4. Coverage Analysis (verified by running the real `parseChordName`)

We ran `parseChordName` from the **actual** `chord-theory-check.js` against all 45 `chord_name`
values (deduped to 23 distinct). Result — the source-of-truth checker currently handles the
reference poorly:

| Bucket | Distinct chords | % of 23 |
|---|---|---|
| **Correctly parsed & verifiable** (spells the true quality) | 8 | 35% |
| **FAIL-OPEN misparse** (silently degrades to a simpler quality — dangerous) | 13 | 57% |
| **FAIL-CLOSED** (checker refuses: unknown quality token) | 2 | 9% |

### 4a. Correctly handled (8) — these verify cleanly today
`C Major`, `C Minor`, `C Sus 2`, `C Sus 4`, `C Dominant 7` (`7`), `C Major Seventh` (`maj7`),
`C Minor Seventh` (`min7`), `F Sus 2` (`sus2`).
*(Plus the mislabeled `f Diminished` row, which parses as `F maj` — "correct" only because the
row is itself wrong; exclude from coverage credit.)*

### 4b. FAIL-OPEN misparse (13) — checker SILENTLY degrades them (this is the worst case)
The parser has no recipe for these names and **wrongly treats them as a simple chord**, so a
wrong fingering can pass. Examples confirmed by execution:

| Reference name | Checker parses as | Reality |
|---|---|---|
| `C Augmented` | `C maj` | should be `aug` |
| `C Diminished` | `C maj` | should be `dim` |
| `C Diminished 7` | `C 7` | should be `dim7` |
| `C Thirteenth` | `C maj` | should be `13` |
| `C Eleventh` | `C maj` | should be `11` |
| `C Ninth` | `C maj` | should be `9` |
| `C Major Nine` | `C maj` | should be `maj9` |
| `C Major Six` | `C maj` | should be `6` |
| `C Minor Six` | `C min` | should be `m6` |
| `C Minor Ninth` | `C min` | should be `m9` |
| `C Major Add 9` | `C maj` | should be `maj+add9` |
| `C Minor Add 9` | `C min` | should be `min+add9` |
| `C Half Diminished` (mislabeled `f Diminished`) | `F maj` | should be `m7b5` |

> This is exactly the failure class AGENTS.md Rule 8's 2026-08-08 adversarial review warned about
> ("`Cdim`/`C6`/`G9` silently degraded to major and passed (blocker)"). The review added a
> FAIL-CLOSED guard for *some* tokens, but the `parseChordName` quality regex still does not
> recognize `Augmented`, `Diminished`, `ninth/eleventh/thirteenth`, `add9`, `6`, `m6`, `m7b5`, etc.
> So those names slip through as `maj`/`min`/`7` — a **false PASS** if a wrong shape is supplied.

### 4c. FAIL-CLOSED (2) — checker correctly refuses
`Cm6/9` (unknown token `m6`) and `C6/9` (unknown token `6`). These are *loud* refusals — safe,
but they mean no verification exists yet for those chords either.

**Bottom line:** Of the 23 distinct reference chords, **only 8 verify correctly today; 15
(65%) are either silently misverified (13) or unverifiable (2).** The extended chords that make
up most real voicings are precisely the ones the arithmetic checker cannot yet judge.

---

## 5. Process for Validating Teacher-Avatar Fingerings (AMENDMENT-06/10)

AMENDMENT-06/10 permits avatars to demonstrate fingerings **only when driven from the
arithmetically-verified `chord-theory-check.js` data**, so the hand and the diagram cannot
disagree. The reference plays a supporting (never primary) role. Required steps:

**Step 1 — Author the fingering in OUR data.** Define `frets[6]` + `fingers[6]` for the chord in
the curriculum/lesson JSON. **Never** derive coordinates from `FINAL_chord_ref.jl` alt-text
(non-goal; alt-text has no coordinates anyway).

**Step 2 — Arithmetic gate (mandatory, the only proof).** Run `node run-chord-check.js`. Ship
gate = **0 errors AND 0 warnings**. This is the source of truth per Rule 8.

**Step 3 — Guard against the FAIL-OPEN misparse (critical, given §4b).** Inspect the checker's
output `spells` field. It MUST equal the intended chord quality. If the name is
`C Augmented` but `spells` = `C maj` (0 errors), the gate is **INVALID** — that is a missing
recipe, not a valid chord. **HOLD the chord from avatar demonstration** and route to Step 5
(recipe extension). Do not let a clean-but-wrong pass reach the avatar.

**Step 4 — External sanity-check via `FINAL_chord_ref.jl` (catalog cross-check, not import):**
  - (a) **Nomenclature:** confirm the chord *name* exists as a real documented chord in the
    reference (independent authority that the name is legitimate).
  - (b) **Shape-family:** confirm the *kind* of voicing our fingering represents has a matching
    entry in that chord's `voicings` list (e.g. an open-position C-major fingering should map to
    `"C major chord open position"`). This validates we are in the right neighborhood; it does
    **not** validate exact coordinates.
  - This step may be human or script-assisted, but it is a check — it supplies no data.

**Step 5 — Render only after Steps 2–4 pass.** The avatar's hand is bound to the **same**
`frets`/`fingers` the checker validated. The 2D fretboard diagram (from verified data) remains
the precision reference; the avatar is a presentation layer over identical coordinates.

**Step 6 — Extended-chord block.** For any chord whose quality is in the §4b/§4c set (6, 9, 11,
13, add9, m6, dim, aug, dim7, m7b5) the avatar MUST NOT demonstrate a fingering until
`chord-theory-check.js` gains a recipe (Step 3 would otherwise catch it as a misparse). Until
then those chords are out of avatar scope; they may still be shown as static 2D diagrams if the
fingering is human-flagged (Rule 8: "Anything the checker cannot decide is still a judgement
call — flag it in prose, not a red box"), but not avatar-demonstrated as "verified."

---

## 6. Recommended Follow-Up (closing the gap the reference exposed)

1. **Extend `chord-theory-check.js` recipes** (`QUALITIES`, `REQUIRED`, `KNOWN_QUALITY_TOKEN`)
   to cover the 13 misparsed + 2 fail-closed qualities above. Until then, AMENDMENT-06/10 avatar
   demos for those chords are blocked by Rule 8 (no arithmetic proof exists).
2. **Adopt `FINAL_chord_ref.jl` (deduped to 23) as a regression corpus** for the checker: every
   reference chord name must `parseChordName` to its true quality and `verifyChord` must not
   false-pass. Add a unit test that fails if any reference name degrades to `maj`/`min`/`7`.
3. **Broaden root coverage** of the reference if C/F-only is insufficient for beginner lessons
   (G, D, A, E, Am, Em are absent). The reference validates naming, not root completeness.
4. **Quarantine the `f Diminished` mislabel** (row 11) so it is not mistaken for an `F` chord in
   any downstream use.

---

## 7. Traceability

- Reference: `C:/Users/The Yoda Trader/scraping-stack/harvester/out/FINAL_chord_ref.jl` (45 rows, 23 distinct names)
- Source of truth: `C:/Users/The Yoda Trader/Desktop/GuitarApp/06-prototypes/step0/schema/chord-theory-check.js`
- Content audit: `C:/Users/The Yoda Trader/Desktop/GuitarApp/scale-100/HANDOFF-2026-08-13-spider-report-contents.md` (§4 chord_ref)
- Verification method: `parseChordName` executed over all 45 `chord_name` values (node, 2026-08-13) — counts in §4 are empirical, not estimated.
