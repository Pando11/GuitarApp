# HANDOFF — GuitarApp FREE build list (no signup, no money, dogfood-first)

Date: 2026-08-08 (night) · Owner: Heidi Hendrickson
Active repo: `C:\Users\The Yoda Trader\Desktop\GuitarApp` (git, master, HEAD = `6e38d90`)

## Owner directive (this session)
"Build the WHOLE thing free. No payments, no signup, no store accounts yet. I'll use it
myself and offer it to ~5 people for feedback first." → Everything below is $0 and requires
NO external account. The money plumbing (RevenueCat keys, App/Play listing, OpenAI TTS key,
YouTube channel) is EXPLICITLY OUT OF SCOPE until real users validate.

Preceding context: `HANDOFF-2026-08-08-playwright-B.md` (hostile Playwright review = GREEN,
23/0). That review established the app integration layer is clean. This handoff picks up the
FREE build items the prior handoffs listed as "not done."

---

## VERIFIED STATE (read before building — do not trust stale summaries)

Re-checked live this session:
- `07-app/test/playwright-hostile.py` → **GREEN 23/0, 0 console/page errors.**
- `07-app/content/teachers/`: **T1 Maggie Cole, T2 Ellis Nakamura, T3 Ray Boudreaux** ONLY.
  These JSONs have NO art/image fields (pure text: name, tagline, teaching_style, voice, skin,
  handoff_line, persona_lines). Art is a clean ADD — no field collision.
- `07-app/content/packs/blues/T4.json` = **Roscoe Bell**, the BLUES PACK teacher. He is NOT in
  the global `CATALOG.teachers` (which loads only T1–T3 from `content/teachers/`). So the roster
  shows 3 teachers, but the blues pack carries a 4th (Roscoe) the app's teacher logic doesn't
  know about. **This is a real free-list gap (see F2).**
- `renderPacks()` (app.js) shows the pack list, but the per-pack lesson → lesson-player path and
  the pack's teacher (T4/Roscoe) wiring is "gated/partial" per prior handoff.
- Voice: `audio/audioio.js speak()` uses OpenAI TTS when a key exists, else falls back to
  browser `speechSynthesis` (FREE, works today). No key needed to dogfood.
- PWA is installable (manifest.webmanifest + service-worker.js + serve.mjs). Phone can't reach
  localhost — use the machine's LAN IP (e.g. http://192.168.x.x:8080).

---

## FREE BUILD LIST (priority order)

### F1 — Teacher cartoon art (FREE, visible gap)
- The 4 teachers have personas but NO visual art. Fretboard diagrams are already code-driven
  (correct by arithmetic — Ban 1), so only the avatar/character art is missing.
- Approach: generate with FLUX.1[schnell] / Qwen-Image (Apache-2.0, free) or a clean
  placeholder SVG. Keep it a rigged-or-static cartoon — NEVER AI-generated fingers/hands
  (AGENTS.md rule 7). If a hand is ever shown, it must be code-driven/IK-constrained, not AI art.
- Wire: add an `art` field (path to svg/png) to each teacher JSON; render in roster card
  (`renderRoster`), teacher detail (`renderTeacherDetail`), and lesson header
  (`applyTeacher` in core/teacher.js + renderer.js).
- Verify: `node test/fidelity.mjs` (48/0) + re-run `test/playwright-hostile.py` (must stay GREEN);
  screenshot roster + teacher detail with art present.

### F2 — Roscoe (T4) into the global teacher system (FREE, real bug-gap)
- T4/Roscoe exists only as the blues-pack teacher. The roster/global teacher chip/lesson
  `applyTeacher` don't see him. Decide + implement ONE of:
  (a) promote T4 into `content/teachers/` so `loadTeachers()` picks him up (roster = 4 teachers),
  or (b) have `loadPacks()` inject pack teachers into `CATALOG.teachers` at boot.
- Then verify a lesson opened from the blues pack renders with Roscoe via `applyTeacher`.
- Verify: `window.__APP__.CATALOG.teachers.length === 4` after boot; roster shows Roscoe;
  playwright roster check still = 3 expected → UPDATE the harness's `len(cards) == 3` assertion
  to `>= 3` (or 4) when Roscoe is added.

### F3 — Style Packs screen → lesson-player path (FREE, partial today)
- `renderPacks()` lists packs; clicking a pack should show its lessons and open them in the
  lesson player. Prior handoff flagged this "gated/partial." Complete the click →
  `navigate('lesson', {id, path, raw})` flow for both blues + country.
- Verify: click a pack → click a pack lesson → lesson player renders with correct teacher.

### F4 — Live mic strum calibration (FREE, you do it)
- Listening engine proven on synthetic tones (step5 30/30). Needs a real in-room strum sign-off.
- Owner action: open the app, grant mic, play a real chord, confirm the on-device verification
  matches. No code unless a defect surfaces. Log any mismatch as a bug to fix.

### F5 — PWA install + phone dogfood (FREE)
- Confirm "Add to Home Screen" works; serve over LAN IP; install on your phone + 5 friends' phones.
- Verify offline (service worker caches). Screenshot install prompt.

### F6 — Daily dogfood + feedback capture (FREE, process)
- Use it daily; collect the 5 friends' feedback. No code. Feed findings back as a HANDOFF addendum.

---

## EXPLICITLY OUT OF SCOPE (do NOT build — owner will revisit after feedback)
- RevenueCat live keys / real purchases (sandbox stub is fine for dogfood).
- App Store / Play Store listings.
- OpenAI TTS key (browser speechSynthesis fallback is sufficient).
- YouTube funnel posting (the B task prototype is allowed; mass posting is not).
- Any database / Supabase / backend (app is localStorage-only by design).

---

## CONVENTIONS (unchanged — read AGENTS.md)
- Addy Osmani order: spec→plan→build→test→review→simplify→ship. Free tier STRICT (tuner +
  metronome + L01 only; everything else gated until trial). Verification = arithmetic.
- Hostile re-review is a normal, welcome step (owner directive). Keep playwright-hostile.py GREEN.
- NEVER `git stash/checkout/reset` the shared worktree — work in temp copies.
- F7 band gate MUST launch via `run-gate.sh` (never bare `node verify-band.js`).
- After ANY edit to baseline-pinned files: re-pin CORE-UNTOUCHED.sha256 + CORE_BASELINE_PIN,
  re-run both gates.
- Re-run `test/playwright-hostile.py` after any `07-app/` change; stay GREEN before "done".

## SUGGESTED FIRST EXECUTION ORDER
F1 (art) → F2 (Roscoe) → F3 (packs path) → re-run gates → F5 (phone) → F4/F6 (dogfood).
F1+F2+F3 are the "looks unfinished" gaps; knocking them out makes the app presentable to the 5.
