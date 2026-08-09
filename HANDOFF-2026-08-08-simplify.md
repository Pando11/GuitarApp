# HANDOFF — Simplify pass (post wave-1 build)

Date: 2026-08-08 (night) · Owner: Heidi Hendrickson
Active repo: `C:\Users\The Yoda Trader\Desktop\GuitarApp` (git, master)
App root: `07-app/`  (UNTRACKED — `git status` shows `?? 07-app/`.)

## WHAT WAS SIMPLIFIED (verified, both gates still GREEN after)
Only DEAD CODE removed — no behavior change. Anchored in `07-app/app.js`.

1. **Removed `lessonIdShort(rawId)` (was line 33)** — duplicate identity function,
   NEVER called anywhere. Dead.
2. **Removed `shortToLxx(rawId)` (was line 122)** — second identity function
   (`return rawId`). Its sole caller `renderLessons` now calls `canLesson(lesson.id)`
   directly (lesson.id is already the full id). Deleting it removed a misleading
   "keep full id for entitlements" comment that described a no-op.
3. **Removed dead `s` variable in `renderLesson` `paint()` (was line 154)** —
   `const s = (view ? view.scenes : manifest.scenes).map(x => x)[sceneIdx.i];`
   computed then never read (next line recomputes `src`). Pure dead assignment.

NOT removed (deliberate): `lib/dogfood.js` `toggleDogfood()` is currently unused, but
it is a legitimate exported API the dogfood handoff references as a future "hidden toggle"
— deleting library surface the docs mention is over-simplifying, not simplifying.

## FILES CHANGED
- `07-app/app.js` — 3 dead-code deletions only. (Net: -4 lines, no logic change.)
- Confirmed UNTOUCHED: `core/entitlementStore.js`, all `core/` engines, `lib/dogfood.js`,
  `lib/feedback.js`, `feedback.html`, `serve.mjs`, `service-worker.js` (still `guitarapp-v3`),
  all content JSON, all SVG.

## GATE STATUS (post-simplify)
- `node test/fidelity.mjs` → **FIDELITY GATE: 48 passed, 0 failed** ✅
- `python test/playwright-hostile.py` → **GREEN (rc=0)**, 0 console / 0 page errors ✅
  (incl. all dogfood assertions: badge, Lesson 2 free, roster 5 cards no paywall)

## REMAINING SMELL (not removed — flagged for owner decision, needs product call)
- `renderPlan` is the only screen indented with a stray 2-space offset inside its
  `guardPremium` callback (lines 345-355). Cosmetic only; no behavior impact. Leave unless
  doing a broader style pass.
- `lib/dogfood.js` `toggleDogfood()` is unused (see above) — either wire a hidden toggle
  (long-press home logo) or drop it. Owner's call; not a correctness issue.

## NEXT SESSION POINTERS
- Re-run after ANY `07-app/` change: `node test/fidelity.mjs` then
  `python test/playwright-hostile.py` (from inside `07-app/`). Keep GREEN.
- After editing any SW-cached asset, bump `CACHE` in `service-worker.js`
  (currently `guitarapp-v3`).
- `07-app/` is untracked — `git add 07-app` when owner is ready to commit.

## RELATED HANDOFFS (this wave)
- `HANDOFF-2026-08-08-wave1-done.md` — the 5 builds (B1–B5) + 2 bugs found/fixed.
- `HANDOFF-2026-08-08-dogfood-mode.md` — original dogfood design (superseded by wave1-done).
- `HANDOFF-2026-08-08-F1F2F3-done.md` — prior "looks unfinished" gaps.
