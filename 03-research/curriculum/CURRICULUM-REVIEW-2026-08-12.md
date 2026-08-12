# GuitarApp — Curriculum Review (2026-08-12)

**Scope:** Verify the on-disk 20-lesson beginner curriculum (`05-content/guitar-lesson-01..20*.json`,
mirrored in `07-app/content/lessons/`) against the **locked teaching spine** documented in
`03-research/curriculum/CURRICULUM-AND-PRACTICE-STRUCTURE.md §5.1** (owner directive 2026-08-12),
and against the production memory/weak-pair-review path (`07-app/core/practiceStore.js`,
`06-prototypes/practice-engine/`).

**Method:** deterministic harness (`06-prototypes/curriculum-review/review-curriculum.mjs`) that
reads every lesson JSON, enumerates chord keys, and checks the §5.0 invariant (Group N practice
drills exactly the chords introduced in Group N + all prior groups). Findings are machine-checked,
not prose opinion. Full evidence in `06-prototypes/curriculum-review/report.json`.

**Verdict:** The curriculum is structurally sound and matches the industry consensus opener
(Em-first, fast first song, F/barre deferred). **3 issues found**, 2 of which share one root cause
that directly undercuts the §2.7 weak-pair-review moat.

---

## Findings

### [MED] C-IDENTITY-SPLIT — two chord identities for C fragment the memory moat
- `easyC` (2-finger C) is the chord key in lessons **3, 4, 5, 7, 15**.
- Standard `C` is the chord key in lessons **8–14, 17–20** (12 lessons).
- No lesson teaches both as the *same* chord; the only file containing both is **L15**, which
  lists them as two distinct keys (`Em, C, easyC, G, D`) with no transition exercise.
- The practice-engine SPINE constant (`06-prototypes/practice-engine/spine-check.mjs`) still uses
  `'easyC'` as the canonical spine token, while production lessons emit `'C'`.
- **Why it matters:** `07-app/core/practiceStore.js:52` keys per-chord fluency by the literal
  `chordName` returned by the listening engine, which comes straight from the lesson JSON chord key.
  So a student who builds easyC fluency in L03–07 gets a **separate memory slot** from the `C` they
  play in L08+. The §2.7 differentiator — *adaptive review of specific weak chord-pairs* — keys off
  exactly these identities, so `Em↔easyC` and `Em↔C` never merge. The moat leaks.

### [MED] NO-C-GRADUATION-LESSON — silent chord-identity swap at L08
- Root cause shared with C-IDENTITY-SPLIT: the student is never explicitly **graduated** from the
  2-finger `easyC` to the standard `C`. The identity silently changes at L08.
- Because fluency is keyed by literal chord name, the student's easyC progress (L03–07) does **not
  carry forward** into the C they play from L08 on. They effectively re-start C from zero in memory.
- **Fix options (owner call):** (a) normalize `'easyC' → 'C'` at content ingest so both shapes map
  to one memory token, or (b) add a dedicated graduation lesson that teaches both shapes
  side-by-side and retires easyC, or (c) unify the chord key to `C` in all lessons and keep easyC
  only as a *display* alias inside L03–07.

### [LOW] SONGS-NOT-SEPARATED — §5.4/§5.6 directive documented as resolved but not executed on disk
- §5.4/§5.6 states songs are a **separate category** (moved out of the technique spine; a SONGS
  category exists parallel to the 20 groups). On disk this is **not done**: L03 still embeds
  `EX2-loop: "Your first song — Em to easy C"` as a technique exercise, and no SONGS category
  directory exists under `05-content/` or `07-app/content/`.
- Structural, low urgency — but the doc overstates completion. Flag for Heidi; no learner-facing bug.

---

## What passed (no issues)

- **Spine ordering** matches every competitor: Em → easyC(or C) → G → D → A → Am → E → Dm; F/barre
  correctly deferred out of the beginner 20.
- **First song at L03** is earlier than Fender ("a few lessons") and only Simply's *app* claims
  faster — a genuine wedge, retained.
- **Cumulative chord set** is monotonic (every lesson's chords ⊆ all prior chords); no lesson
  introduces a chord out of ladder order.
- **Chord shapes arithmetically verified** (`qa_status: verified-by-theory-check-2026-08-08` on
  every chord object) — the strongest claim in the field, intact.
- **8-chord doc chain** `['Em','easyC','G','D','A','Am','E','Dm']` matches the on-disk ladder
  (after the easyC/C naming, which is the flagged issue, not a ladder-order problem).
- **Practice-engine** 30/60 sensor + weak-pair review (K=3) is built and tested (17 passing tests,
  per `practice-engine/README.md`) — the mechanics are sound; only the *key identity* fragments them.

---

## Recommendation (single root cause)

The two MED findings are one bug: **`easyC` and `C` are treated as distinct musical chords in the
memory layer.** Pick one canonical token (normalize at ingest, or unify the JSON key to `C` with
easyC as a display alias) and the moat is restored — weak-pair review will correctly aggregate all C
fluency. SONGS-NOT-SEPARATED is a separate, low-urgency doc-vs-disk gap for Heidi to sign off.

**No code was changed in this review** — only the harness + this report were added
(`06-prototypes/curriculum-review/`). Fixes are recommended, not applied, pending owner direction on
the easyC/C resolution (display-alias vs ingest-normalize vs graduation lesson).

---

## Reproduction

```
node 06-prototypes/curriculum-review/review-curriculum.mjs
# → scans 05-content/guitar-lesson-01..20*.json
# → writes 06-prototypes/curriculum-review/report.json
# → prints findings + per-lesson chord keys
```
