# HANDOFF — F1 + F2 + F3 EXECUTED (free build gaps, "looks unfinished")

Date: 2026-08-08 (night) · Owner: Heidi Hendrickson
Active repo: `C:\Users\The Yoda Trader\Desktop\GuitarApp` (git, master, HEAD = `6e38d90`)
App root: `07-app/` (NOTE: `07-app/` is entirely UNTRACKED in git — `git status` shows `?? 07-app/`.
There is no committed baseline of the app; editing is safe and nothing was stashed.)

Preceding context: `HANDOFF-2026-08-08-free-build.md` (the F1–F6 list) + the B-task
YouTube-funnel agent (finished; scope was funnel content, NOT `07-app/`, so no contention).

## WHAT GOT DONE THIS SESSION

### F2 — Roscoe (T4) into the global teacher system  ✅ DONE (real wiring gap closed)
Root cause confirmed in code:
- `lib/catalog.js` `loadTeachers()` reads ONLY `content/teachers/` → T1–T3.
- `loadPacks()` loaded T4 as `pack.teacher` but NEVER added him to `CATALOG.teachers`.
- `app.js` `renderLesson` resolved the teacher as
  `CURRENT_TEACHER || CATALOG.teachers.find(currentTeacherId) || [0]` → **Maggie always**,
  so a Blues lesson rendered with Maggie, not Roscoe. That was the actual bug.

Fix (chose option (b) from the handoff — inject from the pack layer, do NOT move files):
- `app.js` `boot()`: after `loadTeachers()`, fold each `pack.teacher` into `CATALOG.teachers`
  (deduped by id) and re-sort. Roscoe now exists in the roster, the teacher chip, and is
  resolvable for lessons. Roster = 4 (Maggie, Ellis, Ray, Roscoe).
- `renderLesson()`: honors a `packTeacherId` navigate param, so a lesson opened from a Style
  Pack uses THAT pack's guest teacher (Roscoe for Blues) without hijacking the user's globally
  chosen teacher.
- `renderPacks()`: clicking a pack lesson now navigates with `packTeacherId: pack.teacher.id`.

### F3 — Style Packs → lesson-player path  ✅ DONE (click-through complete)
- The path was already partially wired (`renderPacks` listed lessons and navigated), but it did
  NOT bind the pack's teacher and the harness considered it "gated/partial". With F2's
  `packTeacherId` binding, the full flow now works: Packs → Blues Pack → lesson → renders with
  Roscoe. Verified by a new hostile assertion (see GATES).

### F1 — Teacher cartoon art  ✅ DONE (hand-authored SVG, no AI, no hands)
Hard rule (AGENTS.md #7 / memory): NEVER AI-generated fingers/hands. A cartoon avatar is exactly
where image models sneak hands in, so I did NOT use FLUX/Qwen. Instead, 4 hand-authored flat SVG
avatars (head + shoulders only, ZERO hands/fingers) themed to each teacher's palette:
- `07-app/assets/teachers/T1.svg` (Maggie — blue), `T2.svg` (Ellis — green),
  `T3.svg` (Ray — orange/square-jaw), `T4.svg` (Roscoe — roadhouse brown).
- Added an `art` field to T1–T3 `content/teachers/*.json` and T4 `content/packs/blues/T4.json`.
  `validateTeacher` only checks REQUIRED keys + forbids lesson-content keys, so `art` is a clean
  additive field — no schema conflict.
- Wired rendering in THREE places: `renderRoster` (`.t-art` 64×70), `renderTeacherDetail`
  (`.t-art-detail` 96×104), and `renderLesson` header (`.t-art-detail`). Added CSS in styles.css.

## GATES (real, in 07-app/ — NOT the 06-prototypes gates)
IMPORTANT CORRECTION to the free-build handoff's verification recipe:
- The handoff said to re-pin `CORE-UNTOUCHED.sha256` / re-run `run-gate.sh` / `verify-band.js`.
  Those files live in `06-prototypes/step7-extra/` and `06-prototypes/step8/` — they are the
  PROTOTYPE step7 gates, NOT app gates. There is NO baseline-pin machinery inside `07-app/`.
  The "re-pin + recipe" step is VOID here. Do not re-run a non-existent re-pin.
- The REAL app gates are: `test/fidelity.mjs` and `test/playwright-hostile.py`. Both are GREEN.

Results this session:
- `node test/fidelity.mjs` → **FIDELITY GATE: 48 passed, 0 failed** (rc=0). Port-faithfulness
  of the core engines unchanged by F1–F3 (we touched only app.js catalog/router + teacher JSONs
  + new SVG assets, none of the core/ engines).
- `python test/playwright-hostile.py` → **RESULT: GREEN (rc=0)**, **0 console errors**,
  0 uncaught page errors. New/changed assertions:
  - `roster lists 4 teacher cards (Maggie/Ellis/Ray/Roscoe)` → PASS (harness updated from ==3 to ==4)
  - `blues pack lesson renders with Roscoe (F2/F3)` → PASS (NEW assertion added)
  - All 24 prior hostile checks still PASS.
- VISUAL PROOF (screenshots in `07-app/test/shots/`):
  - `blues-lesson-roscoe.png` → shows Roscoe's avatar + "Roscoe Bell · 1 min" (F1+F2+F3 combined).
  - `teacher-detail.png` → shows Ellis's green avatar + name + "Make this my teacher" (F1).

## FILES CHANGED (all within 07-app/)
- `app.js` — boot() injects pack teachers; renderLesson honors packTeacherId; renderPacks passes
  packTeacherId; renderRoster/renderTeacherDetail/renderLesson render `t.art` <img>.
- `styles.css` — `.t-art` / `.t-art-detail` avatar sizing.
- `content/teachers/T1.json`, T2.json, T3.json — added `art` field.
- `content/packs/blues/T4.json` — added `art` field.
- `test/playwright-hostile.py` — roster assertion 3→4; added Blues-pack→Roscoe assertion.
- NEW: `assets/teachers/T1.svg`, T2.svg, T3.svg, T4.svg.

## NOT DONE (still open, owner's call)
- F4 (live mic strum calibration) — needs Heidi on a real guitar; code-complete, sign-off is hers.
- F5 (PWA install + phone dogfood over LAN IP) — code-complete (manifest + service-worker +
  serve.mjs exist); needs Heidi to serve over her LAN IP and install on phone + 5 friends.
- F6 (daily dogfood + feedback capture) — process, no code.
- Out of scope (unchanged): RevenueCat live keys, store listings, OpenAI TTS key (browser
  speechSynthesis fallback works), YouTube mass posting, any database.

## NEXT SESSION POINTERS
- Re-run after any `07-app/` change: `node test/fidelity.mjs` then
  `python test/playwright-hostile.py` from inside `07-app/`. Keep both GREEN.
- git: `07-app/` is untracked. When Heidi is ready to commit, `git add 07-app` (it is NOT in
  .gitignore). No secrets in the app (no .env referenced by 07-app).
- Roscoe is a GUEST Blues-pack teacher by design (his `_note` says so). If later you want him in
  the selectable "make this my teacher" set permanently, promote `content/packs/blues/T4.json`
  into `content/teachers/` and add it to `content/teachers/manifest.json` — but that is a
  product decision, not a bug fix. Current injection approach is intentional and verified.
