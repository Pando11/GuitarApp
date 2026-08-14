# AMENDMENT-14 — Hostile-Review Corrections to the Song-Progression Track

**Date:** 2026-08-14
**Status:** CURRENT TRUTH. Amends AMENDMENT-12 and AMENDMENT-13.
**Trigger:** Owner directive — *"Make sure to have a separate agent review and check what you have written."*
Three independent hostile reviewers audited the track (music content, gate logic, legal/product
consistency). They found real defects, including three CRITICALs. This amendment records the
corrections. **The reviewers were right and the original claims were overstated.**

---

## 1. What was actually wrong

### CRITICAL 1 — a protected lyric was sitting in a mystery hint
`SP10 Stairway to Heaven` hint_2 read:

> "1971. There is a lady, and she is buying something."

That is a thin paraphrase of the protected lyric. AMENDMENT-12's own redline bans LYRICS —
and the gate passed it anyway, because the gate was scanning for *tab notation*, which cannot
detect a lyric paraphrase. **The mechanical gate gave false assurance exactly where it mattered.**

Fixed: hint_2 is now `"1971. Eight minutes long, and it starts this quietly."` — factual,
non-lyric. **A lyric-adjacency read-through by a human (or a reviewing agent) is now a required
step for every new song; no regex can replace it.** See §4.

### CRITICAL 2 — the legal redline regex was a toy
The old pattern `/\b(tab|tablature|riff notation|e\|-|E\|-|\d+h\d+|\d+p\d+|--\d)/` was evaded
**seven** ways, all shipping green: a non-`e` string label (`G|-3-5-7-`), a Unicode pipe
(`e│-3-5-7-`), uppercase `TAB`, capitalised `Tablature`, numeric-only tab (`3 5 7 0 2 3`),
the bare word `riff`, and tab hidden in an unknown nested field.

Fixed: `tools/verify-song-progressions.js` now normalises Unicode pipe/dash homoglyphs and
lowercases before matching, and applies a two-tier pattern set over EVERY string in the object
tree (`scanRedline`), reporting the exact field path. Proven by `tools/test-legal-redline.sh`
(22/22): all seven evasions blocked, plus hammer-on/pull-off/bend/slide forms.

**Deliberate design point:** `riff`, `solo`, `lick`, `lyrics`, `melody` are permitted **only**
inside `honest_claim`, which exists precisely to say "the recorded riff stays off-limits."
Banning them everywhere would flag our own disclaimers and pressure an author to delete the
disclaimer to get green — worse than the hole it closes. Time signatures (`4/4`, `6/8`, `12/8`,
`3/4`) are whitelisted against the slide-notation pattern; an earlier version flagged
"slow driving 4/4" as tab.

### CRITICAL 3 — the gate trusted the file it claimed to re-derive
AMENDMENT-13 stated the gate "re-derives the prereq map from the lesson manifest, so it cannot
drift." **It did not.** It read `chord-prereqs.json` and trusted it, and never opened
`manifest.json`. Setting every `first_taught` to 1 and every `unlock_after_lesson` to 1 shipped
GREEN — defeating the entire Mystery-Mode fairness guarantee by editing a generated file.

Fixed: `derive-chord-prereqs.js` now exports `deriveFirstTaught()`, and the gate calls it
in-process, compares the committed file against a fresh derivation (failing on any
disagreement), and **enforces using the freshly-derived values only**. A tampered or stale
`chord-prereqs.json` can now only make the gate red, never weaken it. Three TAMPER cases in
`tools/test-song-progression-gate.sh` prove it, including the exact consistent-lie attack.

### Also fixed
- **Reveal check was case-sensitive and substring-satisfiable.** A reveal saying "from zombie
  by…" went red incorrectly, while a title of `Go` was "named" by "Let us go play it!".
  Now the reveal must contain the title **in quotes** — decidable, and already house style.
- **Hint-leak check false-positived on short titles** (a title of `A` matched any prose).
  Now word-boundary matched.
- **Duplicate song ids** were undetected (they collide with `data-id` in the preview). Now fail.
- **"12-bar blues … centuries-old"** was factually false (blues is ~1 century old). Now
  "a public, long-standing structure (over a century old)".
- **Highway to Hell's honest_claim said "we teach the chords and the stab"** — the stab *is* the
  riff's signature. Now "a generic stab rhythm; the recorded riff's specific timing and
  articulation stay off-limits."
- **Stale lesson counts** corrected: AMENDMENT-12 §3 said "23-lesson" (now 25);
  `01-START-HERE/README.md` said "20 authored lessons (23 shipping)" (now 22 / 25).
- **AGENTS.md Rule 1 was mangled**: a dangling `amendments;` line asserted "AMENDMENT-11 is the
  latest word" immediately above AMENDMENT-12/13, and a broken clause read as if AMENDMENT-05
  (in force) had been "removed". Both fixed.

---

## 2. Legal position — corrected and NARROWED

AMENDMENT-12 overstated the safety of the position. The corrected position:

| Element | Status | What we do |
|---|---|---|
| Song **title** (copyright) | Not copyrightable | We may name songs factually |
| Band / artist **name** | **TRADEMARK — not covered by the copyright analysis** | Nominative use only: factual identification, never implied endorsement. **A disclaimer is required.** |
| **Generic** progression (I–V–vi–IV) | Generally not protectable | We teach it |
| **Distinctive** progression tied to one famous recording | **Elevated risk — not a safe harbour** | Teach the abstract harmony only; needs counsel sign-off before paid launch |
| Riff / melody / lyrics / arrangement / tab | Protected | **Never taught, never reproduced, never paraphrased** |

**Three things AMENDMENT-12 got wrong or omitted:**

1. **Trademark was never mentioned.** Band names (Metallica, Pink Floyd, AC/DC, The Cranberries,
   Led Zeppelin) are registered marks. "We name songs freely and honestly" is overconfident for
   a $12/mo commercial product with no disclaimer.
   **REQUIRED:** ship `Not affiliated with, endorsed by, or sponsored by any artist, band, or
   rights-holder. Song and artist names are used for factual identification only.` on the
   app's legal/notices screen and anywhere the song list appears.
   **REQUIRED marketing rule:** write "the chord progression behind the song popularly known as
   'X' by Y" — never the possessive "Y's X" framing, which implies affiliation.

2. **"Generally not protectable" was applied uniformly, including to distinctive progressions.**
   *Williams v. Gaye* (Blurred Lines) found infringement on non-literal elements — groove,
   harmony, "feel" — with no riff copied. Pairing a distinctive progression with a famous title
   and `feel`/`bpm` cues edges toward that. This is **not** self-executing safety.
   **REQUIRED:** counsel review of this track before any paid launch. The gate cannot supply it.

3. **The 12-bar blues claim was factually wrong** (see §1).

---

## 3. What is machine-proven vs. what is human judgement

AMENDMENT-12 §5 claimed the gate "proves, arithmetically: … the legal redline". **That
conflated "no tab strings present" with "legally safe."** Corrected scope:

**Machine-proven (arithmetic, re-runnable):**
1. every chord shape spells the chord its name claims, and is physically playable
2. every loop chord is declared, and every declared chord is used
3. every mystery block is complete; the reveal names the song in quotes; no hint leaks the title
4. no field contains tab/riff **notation strings** — *necessary, NOT sufficient*
5. every song's `unlock_after_lesson` equals its last-taught chord's lesson, computed from the
   lesson manifest at run time
6. no song requires a chord the curriculum never teaches
7. no duplicate song ids

**NOT proven — human judgement, and it must stay labelled as such:**
- that a progression actually matches the recording — **RESOLVED 2026-08-14**: a
  knowledge-only second-party review verified all 10 progressions match the recordings' harmony
  and 11/11 shapes spell correctly (see AMENDMENT-15 §6). Two data fixes resulted (SP03 key
  D→G major; SP06 honest_claim softened for recording copyright).
- that an `honest_claim` is *true* — the gate only checks it is present and clean
- that a hint does not paraphrase a lyric (CRITICAL 1 proves a regex cannot do this)
- anything about legal exposure

---

## 4. Required process for every new song (added)

1. Write the progression + mystery block.
2. Run `node tools/verify-song-progressions.js` — must be 0 errors AND 0 warnings.
3. Run `bash tools/test-legal-redline.sh` and `bash tools/test-song-progression-gate.sh`.
4. **Human/second-agent read-through for lyric adjacency and endorsement tone.** Not optional,
   not automatable. CRITICAL 1 was invisible to the gate.
5. Confirm the `honest_claim` is *true*, not just present.

---

## 5. Open question for the owner (NOT decided)

A reviewer flagged the curriculum shape: `manifest.json` now runs
… 20 = consolidation/performance, 23 = first-three-chord-song, **24 = F**, **25 = A7**.

F is the chord that makes beginners quit, and A7 is foundational to the blues. Both now sit
*after* a consolidation/performance capstone — so a student "performs" before learning them,
and five mystery songs stay locked until the very end.

**Recommendation:** re-sequence F to roughly lesson 10–12 and A7 to roughly 14, then move the
consolidation/performance lesson to the true end. This renumbers lessons, which changes every
`unlock_after_lesson` (the gate recomputes them, so the risk is low).

**Not done — this is a curriculum-shape decision for Heidi.** Flagged rather than executed.
