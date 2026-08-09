# HANDOFF — GuitarApp: Playwright hostile review DONE + next agent task (B)

Date: 2026-08-08 (night) · Owner: Heidi Hendrickson
Supersedes: HANDOFF-2026-08-08-night.md (kept, untracked). Read with that file + the
locked spec (`02-spec/FEATURES-LOCKED-v1-2026-08-07.md`) + `PLAN-from-locked-spec-2026-08-07.md`.

Active repo: `C:\Users\The Yoda Trader\Desktop\GuitarApp` (git, master, HEAD = `6e38d90`).

---

## 1. WHAT WAS JUST PROVEN (this session)

**The pending hostile re-review of the `07-app` integration layer is now COMPLETE — via real
headless-Chromium Playwright, not just the Node subsystem gates.**

New test: `07-app/test/playwright-hostile.py` (Python, uses the Playwright install in the
Maverick venv at `C:\Users\The Yoda Trader\maverick-tc\.venv\Scripts/python.exe`, Chromium
already installed at `AppData\Local/ms-playwright`).

**Run it:**
```
cd C:\Users\The Yoda Trader\Desktop\GuitarApp\07-app
C:\Users\The Yoda Trader\maverick-tc\.venv\Scripts\python.exe test/playwright-hostile.py
```

**RESULT: GREEN — 23/0 checks, 0 console errors, 0 uncaught page errors (rc=0).**
Evidence screenshots: `07-app/test/shots/` (route-*.png, teacher-detail.png).

What it exercises (real browser, real clicks):
- Every free-tier route renders: home, lessons, tuner, metronome, packs, upgrade.
- FREE-TIER STRICT confirmed: roster, progress, chat, plan, band all show the Pro paywall
  pre-trial (no leak of premium content).
- Real "Try free" button → `isPremium()=true`; then roster shows 3 teacher cards
  (Maggie Cole / Ellis Nakamura / Ray Boudreaux), teacher detail renders with set-button,
  progress shows stats, chat/band/plan render.
- Lesson player renders lesson content; tuner + metronome screens render.
- RevenueCat sandbox stub path works (purchase() flips to sandbox until keys exist).

**Prior Node gates (re-verified earlier this session, still green):**
- F7 band gate `bash 06-prototypes/step7-extra/run-gate.sh` → 34/0 (exit 0)
- F10 voice gate `node 06-prototypes/step7-extra/verify-voice.js` → 57/0
- `07-app/test/fidelity.mjs` → 48/0 ; `07-app/test/app-smoke.mjs` → 18/0

**Integration-layer hostile review = CLOSED. No real defects found.** Every earlier "FAIL" was a
test-harness artifact (wrong nav selector, wrong paywall marker, clicking the current teacher),
not an app bug. Root-caused and fixed in the harness.

---

## 2. CLOARIFICATION ON "SUPABASE / database"

There is NO database in the working GuitarApp and NONE is needed for v1.
- App persists to browser `localStorage` only (`07-app/lib/storage.js`, "Ban 5: everything
  stays on-device"). No Supabase, no Postgres, no network DB.
- The `DATABASE_URL` in `C:\Users\The Yoda Trader\maverick-tc\.env` is **Railway Postgres for
  the Maverick TC project**, unrelated to GuitarApp, and owner says it's no longer used.
- Decision (owner, this session): do NOT stand up Supabase or any new infra. Expand to a
  backend only if/when real clients demand cross-device sync. localStore is fine for v1.

---

## 3. KNOWN OPEN ITEMS (still true from prior handoff, NOT blockers for B)

- **RevenueCat live keys** — owner-blocked. `purchase()` uses sandbox stub until
  `RC_IOS_PUBLIC_KEY` / `RC_ANDROID_PUBLIC_KEY` exist. Needs Apple/Google dev accounts +
  RC account (owner action, not code).
- **Teacher cartoon art** — roster logic/names/personas done; visual rigs NOT generated yet.
- **Live mic strum calibration** — listening logic proven on synthetic tones (step5 30/30);
  real acoustic capture sign-off is an in-room open item.
- **Style Packs** — content present (blues + country); PACKS screen + T4 wiring partial.
- **Flutter/RN native port** — resolved to PWA by environment constraint; engines are
  SDK-agnostic for a later native rewrite.

---

## 4. NEXT AGENT TASK = (B): YouTube funnel (app distribution channel)

Per `02-spec/PLAN-app-plus-youtube-4500-2026-08-07.md`, YouTube is the free billboard; the
app is the store. Goal math: ~100k views/mo → 450 paying subs × $12 = $4,500/mo net target.

**What (B) actually is (decide scope before coding — owner has NOT green-lit build yet, this is
the planning/build task):**
1. A **content pipeline** that turns the existing 20 lessons (or subsets) into short
   "teaser" videos using the SAME assets the app uses — code-driven fretboard diagrams
   (provably correct, Ban 1), cartoon teacher (OpenAI TTS voice per-call, FLUX/Qwen images for
   art), no AI-drawn fingers/hands (AGENTS.md rule 7 + license blocklist).
2. Each video ends with the CTA: "full 20-lesson path, tuner, metronome, streak tracker — in
   the app, $12/month."
3. thumbnails, titles, descriptions, and a posting cadence (the plan assumes steady ~weekly
   publishing to reach 100k views/mo steady state).

**Hard constraints to honor (from AGENTS.md):**
- License blocklist for voice: approved = OpenAI TTS (shipping), Kokoro-82M (Apache-2.0 free
  hedge), Chatterbox/MeloTTS/StyleTTS2 (MIT). NEVER XTTS-v2 / F5-TTS / Fish Speech / Piper.
- Images: FLUX.1[schnell] / Qwen-Image (Apache-2.0). No Rive (dropped, $9/mo Cadet fee).
- No camera, no hand tracking, no AI-generated fingering. Fretboard is code-driven.
- Confidence gating honest; listening is constrained target-matching only; audio never uploaded.
- Verification = arithmetic where decidable (chord correctness proved by
  `06-prototypes/step0/schema/chord-theory-check.js`, ship gate `node run-chord-check.js` = 0
  errors/0 warnings). No "not verified by guitarist" red boxes in any UI.

**Suggested first moves for the next agent:**
- Read `02-spec/PLAN-app-plus-youtube-4500-2026-08-07.md` fully (it has the funnel math, the
  content plan, and an F13 reference).
- Inventory the 20 lesson JSONs in `07-app/content/lessons/` — they are the source material;
  confirm each has a script-able structure (title, scenes, chord targets) usable for video.
- Prototype ONE teaser video end-to-end (pick lesson 1) with the approved stack, prove the
  fretboard rendering is byte-identical to the app's `core/renderer.js`, and get owner sign-off
  on look/voice BEFORE batching 20.
- Do NOT touch the database question — there isn't one; don't introduce Supabase for this.

---

## 5. CONVENTIONS (unchanged, read before acting)
- Addy Osmani order (spec→plan→build→test→review→simplify→ship). Free tier STRICT.
- Verification = arithmetic; hostile re-review is a normal, welcome step (owner directive).
- Hostile agents: NEVER `git stash/checkout/reset` the shared worktree — work in temp copies.
- F7 gate MUST launch via `run-gate.sh` (never bare `node verify-band.js`).
- After ANY edit to baseline-pinned files: re-pin `CORE-UNTOUCHED.sha256` + `CORE_BASELINE_PIN`,
  re-run both gates.
- Keep deliverables as double-clickable `file://` HTML where possible (their phone can't reach
  a localhost server) — except the PWA itself, which needs `serve.mjs` (http) for SW + fetch.
- Re-run `test/playwright-hostile.py` after any `07-app/` change and keep it GREEN before "done".
