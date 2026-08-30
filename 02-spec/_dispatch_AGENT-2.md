REPO ROOT (your workdir): C:/Users/Hendrickson/Desktop/GuitarApp

LEGAL FLOOR (never violate):
- Rule 5: prose only, cite stored numbers, never invent musical opinion/praise.
- Rule 9: commercial-clean + free ONLY.
- Rule 2: no camera/hand tracking.
- Rule 8: chord correctness 0 errors/0 warnings.

VERIFIED ON DISK 2026-08-30 (trust these):
- 06-prototypes/practice-engine/ contains TWO surviving prototypes (look at them to match shape) plus the now-REBUILD target practice-remix-q5-prototype.html (file was lost in PC transfer; rebuild it)
- 05-content/ holds 20 authoring lessons (pre-AMENDMENT-15-resequence numbering)
- 07-app/content/lessons/ holds 25 shipping lesson JSONs
- Song track = 11 songs SP01-SP11 in progressions.json (spec wording may still wrongly say 10); SP06 House of the Rising Sun + SP11 Amazing Grace are public domain

TASKS:
1. Rebuild 06-prototypes/practice-engine/practice-remix-q5-prototype.html — throwaway, double-clickable over file:// (inline ALL JS/CSS; ES module imports are CORS-blocked over file:// so mirror engine logic inline). Match the shape of the two surviving prototypes in that dir. Content spec: one weak-spot transition G<->D, fluency 0.25, 15/min tempo, THREE framings selectable (Tempo challenge / Play-along groove / Calm slow), using only real stored numbers / real lesson data; no invented praise (Rule 5).

2. Promotion-path audit: verify 05-content/ (20 authoring) maps to 07-app/content/lessons/ (25 shipping) after the AMENDMENT-15 re-sequence. Count both, list any authoring lesson with no shipping counterpart and any shipping lesson with no authoring source. Report mismatches; DO NOT edit lesson data silently — report only.

3. Spec song-count: search the repo (02-spec/, docs/, any spec md) for wording still saying '10' songs and note it should be '11'. Note SP11 Amazing Grace = public domain. Report the file:line locations.

REPORT (verifiable handles):
- Absolute path of the rebuilt prototype + confirm it exists (ls -la)
- Audit: count(05-content)=?, count(07-app/content/lessons)=?, list of mismatches (authoring-without-shipping and shipping-without-authoring)
- List of file:line locations where '10 songs' wording still appears + the SP11 PD note
