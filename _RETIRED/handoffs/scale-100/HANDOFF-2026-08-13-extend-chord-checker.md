# HANDOFF — Extend chord-theory-check.js to verify extended chords (ship-gate blocker)

**Date:** 2026-08-13
**Project:** GuitarApp (`~/Desktop/GuitarApp`)
**Why this exists:** A fresh conversation needs the full context to act on the
recommendation below. Proven evidence is included (verified by running the REAL
parser, not trusting a summary).

---

## The recommendation

Extend `chord-theory-check.js` so the ship gate (`node run-chord-check.js`, MUST
report 0 errors AND 0 warnings) can arithmetically verify **extended/alterated
chords** — 6, 9, 11, 13, add9, m6, dim, aug, dim7, m7b5, 7#5, 7b5, 6/9 — with
correct `QUALITIES` recipes AND `REQUIRED` tones. Until this is done, **any
teacher-avatar fingering demo of an extended chord (AMENDMENT-06/10) cannot be
proven correct** and must not ship.

---

## Why (proven, 2026-08-13)

Ran the real parser `06-prototypes/step0/schema/chord-theory-check.js` over the
45 chord_ref rows (`~/scraping-stack/harvester/out/FINAL_chord_ref.jl`):

- 45 names → **23 distinct chords** (roots are C and F ONLY; common beginner
  roots G/D/A/E/Am/Em are absent from this reference entirely).
- **3 fail CLOSED** (`Cm6/9`, `C6/9` ×2) — checker correctly refuses unknown
  quality. GOOD behavior, already fixed on 2026-08-08.
- **16 DEGRADE** to a base quality with NO `unknownQuality` flag, so they fall
  through to normal verify and can get a **false PASS** if a matching shape is
  fed, e.g.:
  - `C Augmented` → parsed `maj` (should be +11/#5)
  - `C Diminished` → parsed `maj` (should be ° / dim)
  - `C Minor Add 9` → parsed `min`
  - `C Thirteenth` → parsed `maj`
  - `C Ninth` → parsed `maj`
  - `C Diminished 7` → parsed `7`
- **26 parse cleanly** (plain C/F major/minor/7/maj7/sus).

So the checker today has recipes ONLY for: `maj, min, 7, min7, maj7, sus2, sus4, 5`.
Everything richer is either refused (fail-closed) or silently reduced (false
PASS risk). The agent's "57% fail-open" count was OVERSTATED; the real, honest
figure is **16/23 (~70%) could false-pass**, and the core blocker is confirmed.

---

## Exact code locations to edit

File: `06-prototypes/step0/schema/chord-theory-check.js`
(also mirrored at `07-app/core/chord-theory-check.js` — keep both in sync if
`07-app` is the live one; verify which the ship gate actually imports.)

Three maps near the top:
1. `QUALITIES` (lines ~13–22) — semitone recipes from root.
   e.g. add `'m6':[0,3,7,9], 'aug':[0,4,8], 'dim':[0,3,6], '7b5':[0,4,6,10],
   'm7b5':[0,3,6,10], 'dim7':[0,3,6,9], '9':[0,4,7,10,14], 'maj9':[0,4,7,11,14],
   'm9':[0,3,7,10,14], '11':[0,4,7,10,14,17], 'm11':[0,3,7,10,14,17],
   '13':[0,4,7,10,14,21], 'm13':[0,3,7,10,14,21], 'add9':[0,4,7,14],
   '6':[0,4,7,9], '6/9':[0,4,7,9,14], '7#5':[0,4,8,10], '7sus4':[0,5,7,10]`.
2. `REQUIRED` (lines ~26–29) — defining tones that MUST be present or it's an
   ERROR (not a warning). e.g. `'aug':[0,4,8], 'dim':[0,3,6],
   'dim7':[0,3,6,9], 'm7b5':[0,3,6,10], '6':[0,4,9], '9':[0,4,10,14],
   '13':[0,4,10,21]`, etc. (copy the tone sets from QUALITIES' defining
   intervals; the 7th/9th/13th are required for those named chords per Rule 8's
   "defining tone must be an error" principle.)
3. `KNOWN_QUALITY_TOKEN` (line ~32) and `UNKNOWN_QUALITY_TOKEN` (line ~33) —
   move the extended tokens from UNKNOWN → KNOWN so they no longer fail-closed
   AND no longer degrade. UNKNOWN_QUALITY_TOKEN should keep only genuinely
   unsupported ones.
4. `parseChordName` quality regex (lines ~86–92) — add branches so it sets the
   right `quality` for `aug`, `dim`, `m6`, `add9`, `6/9`, `9/11/13`, `7#5`,
   `7b5`, `m7b5`, `dim7`. Currently it defaults to `maj` and only recognizes
   m/min/maj7/min7/sus2/sus4/7/5.

## Quality-detection rules to honor while editing
- `dim` (no 7) = root+min3+dim5 (0,3,6). `dim7` = +dim7 (0,3,6,9). `m7b5` =
  half-diminished (0,3,6,10). Do NOT let `Cdim` parse as `maj` (the bug we're
  fixing).
- `aug` = root+maj3+#5 (0,4,8). `7#5` = +#5.
- `6` = maj triad + 6 (0,4,7,9). `m6` = min triad + 6 (0,3,7,9). `6/9` adds 9.
- `9/11/13` include the 7th by definition (a "C9" is a dominant 9th = 0,4,7,10,14).
- Keep `REQUIRED` strict per the 2026-08-08 principle: missing defining tone =
  ERROR, not warning.

---

## Acceptance gate (prove it, don't claim it)
After the edit:
1. Re-run the real parser over the 45 chord_ref names. Expect: 0 degrade, 0
   false-pass candidates; previously-degraded names (`C Augmented`, `C Diminished`,
   `C Minor Add 9`, `C Thirteenth`, `C Ninth`) now resolve to their true quality.
2. Add regression fixtures: a correct voicing for `C Aug`, `Cdim`, `C6`, `C9`,
   `Cm7b5`, `C13` each must `ok:true, errors:[]`; a WRONG voicing must `ok:false`.
3. `node run-chord-check.js` (the ship gate) still reports 0 errors / 0 warnings
   on the existing lesson set. If it now flags previously-silent shapes, FIX THE
   LESSON DATA, do not weaken the checker.
4. Only THEN is an extended-chord avatar fingering demo (AMENDMENT-06/10)
   arithmetically provable and safe to ship.

## Legal / guardrail reminders (unchanged)
- Chord voicings = chord SHAPES (facts), external-reference use is fine.
- SONGS lessons = ORIGINAL 8-chord loops; never transcribe lyrics/tabs/audio.
- LLM prose-only; cite only DSP/checker metric keys; never invent musical judgement.
- Do NOT auto-import the chord_ref descriptive alt-text (not parseable coords).
