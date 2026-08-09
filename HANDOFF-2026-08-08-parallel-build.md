# HANDOFF — Parallel Build Wave: "Playable for me + 5 friends, no money"

Date: 2026-08-08 · Owner: Heidi Hendrickson
Active repo: `C:\Users\The Yoda Trader\Desktop\GuitarApp` (git, master)
App root: `07-app/`  (NOTE: `07-app/` is UNTRACKED — `git status` shows `?? 07-app/`. Safe to
edit; nothing committed will be clobbered. Do NOT `git stash/checkout/reset` the worktree.)

## CONTEXT (verified this session — read before building)
- F1/F2/F3 DONE + proven (avatars, Roscoe, packs path). `fidelity.mjs` 48/0,
  `playwright-hostile.py` GREEN, 0 console/page errors.
- F4 (live mic strum) **CROSSED OFF** by owner — "no live strumming." Not a task.
- Standing directive (HANDOFF-2026-08-08-free-build.md): build the WHOLE app FREE, no signup,
  no money, dogfood with ~5 friends first. RevenueCat/store/TTS-key/DB are OUT OF SCOPE.
- **Keystone blocker found in code:** `07-app/core/entitlementStore.js` enforces a STRICT
  paywall — `FREE_LESSONS=['L01']`, and `FEATURE_TIER` marks lessons L02–L20, Style Packs,
  roster, chat, adaptive, streaks, listening, band, voice ALL `'premium'`. So a free user
  (and the 5 friends, and the LAN install) can reach ONLY L01 + tuner + metronome today.
  The production paywall must STAY (owner: "do not revert FEATURE_TIER"). The dogfood build
  layers a LOCAL unlock on top WITHOUT touching `entitlementStore.js`.

## GOAL OF THIS WAVE
Make the app fully playable + shareable with 5 friends for feedback, $0, no account:
1. Local dogfood-free unlock (bypass the paywall for local use only).  → B1
2. Phone install over LAN IP (PWA).                                    → B2
3. Feedback capture from the 5 friends (local, no server).            → B3
4. Country pack teacher + art (packs are half-wired; Country has NO teacher/art). → B4
5. A few more beginner lessons so the free curriculum feels complete. → B5

## CONCURRENCY / FILE-OWNERSHIP RULE (this is what makes "built at once" safe)
`app.js` and `index.html` are SINGLE-FILE bottlenecks. To avoid merge collisions, ONLY **B1**
edits `app.js` / `index.html` / `styles.css`. The other 4 agents own DISJOINT files
(content JSON, standalone HTML, docs/scripts, SVG). Run them in parallel — they cannot clash.

If your orchestrator caps parallel subagents at 3 (it does), split into TWO waves:
- **Wave 1 (parallel):** B1, B2, B3
- **Wave 2 (parallel, after Wave 1 done):** B4, B5
Then a **Verify wave** runs both gates + screenshots.

Each build agent does its OWN syntax/import self-check only. NO agent runs
`playwright-hostile.py` against the live app during the build (the app is half-edited) — the
Verify wave runs both gates ONCE at the end.

---

## B1 — Dogfood-free mode (the unblocker; ONLY agent touching app.js)
GOAL: a local, labeled, reversible unlock that makes the whole app usable for free, without
modifying `core/entitlementStore.js`.

FILES OWNED (exclusive):
- NEW `07-app/lib/dogfood.js`
- `07-app/app.js`  (edit ONLY the 3 sites below)
- `07-app/styles.css`  (add `.dogfood-badge` only)
- `07-app/service-worker.js`  (add `./lib/dogfood.js` to CORE array)
- `07-app/test/playwright-hostile.py`  (add assertions in Verify wave, OR add now and let
  Verify run them — safer to ADD assertions now, run in Verify wave)

EXACT ANCHORS in `app.js` (current line numbers — re-confirm before editing):
- Line 33: `function isPremium() { return app.entitlement.isPremium(); }`
  → change to: `function isPremium() { return app.dogfood || app.entitlement.isPremium(); }`
- Boot block ~line 445-465 (`async function boot()`): after `app = ...`/`app.entitlement`
  load, read `?dogfood=1` query param and persist; set `app.dogfood = isDogfood();`.
  Pattern:
  ```
  const params = new URLSearchParams(location.search);
  if (params.get('dogfood') === '1') setDogfood(true);
  app.dogfood = isDogfood();
  ```
- `renderHome()` (line 65): in the top header/nav area, if `app.dogfood`, append
  `<span class="dogfood-badge">DOGFOOD</span>` AND a small `<a href="feedback.html">feedback</a>`
  link (feedback.html is built by B3 — B1 only references the URL string).

`lib/dogfood.js` shape:
```
const KEY = 'guitarapp.dogfood';
export function isDogfood(){ return localStorage.getItem(KEY)==='1'; }
export function setDogfood(on){ localStorage.setItem(KEY, on?'1':'0'); }
export function toggleDogfood(){ const n=!isDogfood(); setDogfood(n); return n; }
```
Import it in app.js: add to an `import` line near top:
`import { isDogfood, setDogfood } from './lib/dogfood.js';`

`styles.css`: add `.dogfood-badge { background:#f5a623; color:#1a1206; font-size:11px;
font-weight:700; padding:2px 8px; border-radius:999px; margin-left:8px; }`

`service-worker.js`: add `'./lib/dogfood.js'` to the CORE array (so offline still works).

DO NOT: edit `core/entitlementStore.js`, `FEATURE_TIER`, `FREE_LESSONS`, or any `core/` engine.
SELF-CHECK: `node --check app.js` and `node --check lib/dogfood.js` pass; `node test/fidelity.mjs`
still 48/0 (you touched no core engines).
VERIFY-WAVE ASSERTIONS to add in `playwright-hostile.py` (B1 may add them now; Verify runs):
- "with `?dogfood=1`, a NON-premium (no trial) user opens Lesson 2 without paywall" → PASS
- "DOGFOOD badge present in header when `?dogfood=1`" → PASS
- KEEP all existing production assertions (a free user WITHOUT `?dogfood=1` still hits 🔒/paywall)
  so we prove the production path is UNTOUCHED.

---

## B2 — Phone install over LAN IP (F5)
GOAL: Heidi + 5 friends install the PWA on phones over the home LAN, $0, no store.
FILES OWNED (exclusive): `07-app/serve.mjs` (tweak), NEW `07-app/LAN-INSTALL.md`,
NEW `07-app/start-lan.bat` (and/or `.sh`).
WHAT TO BUILD:
- `serve.mjs` already binds all interfaces (Node `listen(PORT)` default = 0.0.0.0), so LAN
  works. IMPROVE: on startup, print the machine's LAN IPv4(s) using `os.networkInterfaces()`
  so Heidi sees e.g. `http://192.168.1.42:8080/?dogfood=1` without hunting. Keep PORT 8080.
- `LAN-INSTALL.md`: step-by-step for a non-technical friend — (1) Heidi runs `start-lan.bat`
  on her machine, (2) friend connects to SAME Wi-Fi, (3) opens the printed LAN URL, (4) taps
  browser menu → "Add to Home Screen" (iOS Safari share sheet / Android Chrome ⋮), (5) app
  installs; offline works via service worker. Note: must open WITH `?dogfood=1` to get full
  free access. Screenshot placeholders optional.
- `start-lan.bat`: `node serve.mjs` (Windows). Keep it one line.
SELF-CHECK: `node --check serve.mjs`; start the server, `curl -sI http://localhost:8080/`
  returns 200. Do NOT run playwright.
DO NOT touch app.js / entitlementStore.js.

---

## B3 — Feedback capture (F6)
GOAL: the 5 friends can send feedback from their phone, stored locally (no server, no account).
FILES OWNED (exclusive): NEW `07-app/lib/feedback.js`, NEW `07-app/feedback.html`.
WHAT TO BUILD:
- `lib/feedback.js`: a tiny localStorage store.
  ```
  const KEY='guitarapp.feedback';
  export function addFeedback({who, rating, text, ts=Date.now()}){
    const a=JSON.parse(localStorage.getItem(KEY)||'[]'); a.push({who,rating,text,ts});
    localStorage.setItem(KEY, JSON.stringify(a)); return a.length;
  }
  export function allFeedback(){ return JSON.parse(localStorage.getItem(KEY)||'[]'); }
  ```
- `feedback.html`: a standalone page (works under serve.mjs; also openable via file://).
  Simple form: name (optional), 1–5 stars, free-text "what was confusing / what you liked",
  Submit → `addFeedback` → shows "thanks" + a list of previously submitted feedback
  (so a friend can see their own). Plain, mobile-friendly, no framework. Link back to
  `index.html?dogfood=1`. Heidi can later `console.log`/export the JSON to read feedback.
SELF-CHECK: `node --check lib/feedback.js`; open feedback.html via `curl`/browser, confirm it
loads (manual or a tiny node http check). Do NOT edit app.js. (B1 adds the in-app link to this
page; B3 only builds the page.)
DO NOT touch app.js / entitlementStore.js.

---

## B4 — Country pack teacher + art (content only)
GOAL: the Country Style Pack currently has NO teacher and NO art (only Blues has Roscoe/T4).
Give Country its own guest teacher + hand-authored SVG, wired via the existing pack-teacher
injection (no app.js change needed — boot already injects `pack.teacher`).
FILES OWNED (exclusive): NEW `07-app/content/packs/country/T5.json` (or
`07-app/content/teachers/T5.json` — mirror Blues), NEW `07-app/assets/teachers/T5.svg`,
EDIT `07-app/content/packs/country/manifest.json` (add `teacher` ref).
WHAT TO BUILD:
- READ FIRST: `content/packs/blues/manifest.json` and `content/packs/blues/T4.json` to mirror
  the exact shape (T4 has `id`, `name`, `tagline`, `teaching_style`, `voice`, `skin`,
  `handoff_line`, `persona_lines`, AND an `art` field added in F1). Also read an existing
  `content/teachers/T1.json` for the persona schema.
- Create a Country teacher (e.g. id `T5`, name like "Dixie Hart" or owner's pick — use a
  plausible country persona). Give them `art: "assets/teachers/T5.svg"`.
- `T5.svg`: HAND-AUTHORED flat SVG, HEAD + SHOULDERS ONLY, ZERO hands/fingers (AGENTS.md rule 7
  — never AI-generated hands; do NOT use FLUX/Qwen). Themed palette (e.g. denim blue / tan).
  Keep ~780 bytes like the other T*.svg. Verify visually with a screenshot.
- `content/packs/country/manifest.json`: add `"teacher": "T5"` (or the path) mirroring how
  `blues/manifest.json` references T4, so `loadPacks()` populates `pack.teacher` and boot
  injects them into `CATALOG.teachers`. Confirm the blues manifest's exact key name and use it.
SELF-CHECK: `node --check` won't apply to JSON; instead run `node -e "JSON.parse(require('fs')
  .readFileSync('content/packs/country/manifest.json'))"` for each edited JSON to prove valid.
  Confirm `T5.svg` contains no hand/finger/palm/wrist paths (grep).
DO NOT touch app.js / entitlementStore.js (boot injection already handles T5).

---

## B5 — Extra beginner lessons (content only)
GOAL: the free curriculum is only L01 today (rest is behind paywall, unlocked by B1 locally).
Add 2–3 MORE beginner lessons so dogfooding feels like a real course start, not a single lesson.
FILES OWNED (exclusive): NEW `07-app/content/lessons/guitar-lesson-21-*.json` etc.,
EDIT `07-app/content/lessons/manifest.json` (register new files).
WHAT TO BUILD:
- Author 2–3 new lessons that follow on from L01 (e.g. "Holding the Pick", "Your First Song
  (3 chords)", "Switching Between Em and C"). Mirror the schema of an existing lesson
  (READ `content/lessons/guitar-lesson-01-welcome-anatomy-tuning.json` for the exact shape:
  `lesson`, `scenes[]` with `chord`/`frets`/`caption`/`speech.persona_line`, `qa_status`, etc.).
- Each chord `frets` array MUST be length 6 and pass `core/schema/validate.js` (validateLesson).
  Keep `qa_status` whitelisted (e.g. "auto"). NO hand-tracking, NO recording features.
- Register each new file in `content/lessons/manifest.json` `files[]` (mirror existing entries).
SELF-CHECK: for each new lesson, `node -e "const v=require('./core/schema/validate.js');
  const j=JSON.parse(require('fs').readFileSync('content/lessons/<new>.json'));
  console.log(v.validateLesson(j))"` returns no errors. Also run
  `node 06-prototypes/step0/schema/chord-theory-check.js` if available, or at minimum confirm
  each `frets` length === 6 and fingers reference valid frets.
DO NOT touch app.js / entitlementStore.js.

---

## VERIFY WAVE (after B1–B5 done; run by orchestrator / a verify subagent)
1. `cd 07-app && node test/fidelity.mjs` → expect **48 passed, 0 failed** (no core engines
   changed by this wave).
2. `cd 07-app && python test/playwright-hostile.py` → expect **GREEN, 0 console/page errors**.
   Existing 20 assertions still PASS (production paywall intact) + new dogfood assertions PASS.
3. Start `serve.mjs`, open `http://localhost:8080/?dogfood=1`, screenshot:
   - `test/shots/dogfood-L02.png` (Lesson 2 open for free user, DOGFOOD badge visible)
   - `test/shots/dogfood-country.png` (Country pack shows T5 teacher + art)
   - `test/shots/feedback.png` (feedback.html loads + submit works)
4. Confirm `git status` still shows `?? 07-app/` (untracked, nothing clobbered).
5. Report: gates GREEN? New art present? LAN doc + start script present? Feedback store works?

## PARKING LOT (as of this handoff)
- **F4 — Live mic strum**: CROSSED OFF (owner: no live strumming). Not built, not needed.
- **F5 — Phone PWA install**: now B2 (buildable, code-complete server + new install doc).
- **F6 — Feedback capture**: now B3 (buildable, local store + page).
- Out of scope unchanged: RevenueCat, store listings, OpenAI TTS key, YouTube mass posting, DB.

## SUCCESS = all five built, both gates GREEN, and Heidi can:
open `http://<LAN-IP>:8080/?dogfood=1` on her phone → install → play L01–L20 + Blues/Country
packs with teachers → and any of the 5 friends can do the same and tap "feedback" to send notes.
No money, no signup, no server.
