# HANDOFF — Dogfood-Free Mode (local unlock; no production paywall change)

Date: 2026-08-08 (after F1/F2/F3 done, F4 crossed off) · Owner: Heidi Hendrickson
Active repo: `C:\Users\The Yoda Trader\Desktop\GuitarApp` (git, master)
App root: `07-app/`

## WHY THIS IS THE NEXT BUILD (grounded in live code, not opinion)

Owner directive (HANDOFF-2026-08-08-free-build.md, line 6-10): "Build the WHOLE thing
free. No payments, no signup, no store accounts yet. I'll use it myself and offer it to
~5 people for feedback first."

Reality check against `07-app/core/entitlementStore.js` (read this session):
- `FREE_LESSONS = ['L01']` (line 5).
- `FEATURE_TIER` (lines 7-21) marks `teacherRoster, chat, adaptive, messages, streaks,
  lesson, listening, band, stylePacks, reports, voice` ALL as `premium`. Only `tuner` +
  `metronome` are `free`.
- `app.js:isPremium()` (line 33) = `app.entitlement.isPremium()` → false for a non-paying user.
- So a free user (and therefore each of the 5 dogfood friends, and the LAN install in F5)
  can reach ONLY L01, tuner, metronome. Everything else hits `renderPaywall` (app.js:34-37,
  434). Packs are explicitly `🔒 Pro` (app.js:396).

Conclusion: F5 (phone install) and F6 (feedback) are BLOCKED by the paywall today, not by
missing code. The strict paywall is correct for the REAL launch (do NOT revert it — see
memory rule "FEATURE_TIER ... do not revert"). But the dogfood-first directive needs a
separate, clearly-labeled LOCAL unlock that does not alter production policy.

This handoff defines that unlock. It is the highest-leverage next build: it makes F5 and
F6 actually usable, costs $0, needs no account, and leaves `entitlementStore.js` untouched.

---

## WHAT TO BUILD — Dogfood-Free Mode

### Design constraints (hard)
1. **Do NOT modify `core/entitlementStore.js`** — no change to `FEATURE_TIER`, `FREE_LESSONS`,
   or the `EntitlementStore` class. The production strict tier stays intact for launch.
2. **No network, no account, no RevenueCat, no key.** Pure local state in `localStorage`.
3. **Clearly labeled.** A persistent "DOGFOOD" badge in the app header when the mode is on,
   so it can never be mistaken for a production entitlement. (AGENTS.md: never display false
   "verified" red boxes — a labeled badge is fine and is the opposite: it signals non-prod.)
4. **Reversible.** One tap/param turns it off and the app returns to strict free tier.

### Implementation (concrete, buildable)
- New tiny module `07-app/lib/dogfood.js`:
  - `const KEY = 'guitarapp.dogfood';`
  - `export function isDogfood() { return localStorage.getItem(KEY) === '1'; }`
  - `export function setDogfood(on) { localStorage.setItem(KEY, on ? '1' : '0'); }`
  - `export function toggleDogfood() { const n = !isDogfood(); setDogfood(n); return n; }`
- In `app.js`:
  - Add `app.dogfood = isDogfood();` at boot (near the `EntitlementStore` load, app.js ~line 30-40).
  - Change `function isPremium() { return app.entitlement.isPremium(); }` (line 33) to:
    `function isPremium() { return app.dogfood || app.entitlement.isPremium(); }`
    This is the ONLY behavioral change. It layers dogfood on top of the entitlement decision
    without touching the store. All existing `guardPremium`/`canAccess*` paths now pass for
    dogfood users.
  - Add a header badge: in the top nav (renderHome or the persistent header), if
    `app.dogfood`, append a small `<span class="dogfood-badge">DOGFOOD</span>`.
  - Add a trigger. Recommended: read `?dogfood=1` on boot (e.g. you open
    `http://192.168.x.x:8080/?dogfood=1` on the phone) → `setDogfood(true)` and persist.
    Also expose a hidden toggle for desktop: e.g. long-press the home logo 2s calls
    `toggleDogfood()` + `save()` + re-render. (Pick ONE trigger; URL param is simplest for
    the LAN/F5 flow and is fully verifiable.)
- `styles.css`: `.dogfood-badge { ... amber pill, small, top-right ... }`.

### What it unlocks when ON (all local, no prod change)
Full curriculum (L01–L20), Style Packs (Blues w/ Roscoe, Country), teacher roster, chat,
adaptive plan, streaks, in-lesson listening verify, band, voice. Same surface a $12/mo
subscriber sees — which is exactly what the 5 friends should dogfood.

---

## VERIFICATION (keep both gates GREEN; add dogfood assertions)

Run from inside `07-app/`:
1. `node test/fidelity.mjs` → must stay **48 passed, 0 failed** (we touch only app.js
   wrapper + new `lib/dogfood.js` + styles.css; no `core/` engines, no `entitlementStore.js`).
2. `python test/playwright-hostile.py` → must stay GREEN, 0 console/page errors.
   - ADD assertion: "with `?dogfood=1`, a free (no trial) user can open L02 and a Style Pack
     lesson without a paywall" → PASS.
   - KEEP all existing production assertions (premium gating for a NON-dogfood free user must
     STILL show 🔒 and hit paywall) so we prove the production path is untouched.
   - ADD assertion: "DOGFOOD badge present in header when `?dogfood=1`" → PASS.
3. Screenshot `test/shots/dogfood-L02.png`: header shows DOGFOOD badge + Lesson 2 content
   open for a free user (no trial started).
4. Screenshot `test/shots/dogfood-pack.png`: Blues pack lesson opens with Roscoe for a free user.

---

## FILES TOUCH (all within 07-app/, nothing in core/ or entitlementStore.js)
- NEW `lib/dogfood.js`
- `app.js` — boot reads `?dogfood=1`/persists; `app.dogfood` flag; `isPremium()` augmented;
  header badge element; (optional) hidden toggle.
- `styles.css` — `.dogfood-badge`.
- `test/playwright-hostile.py` — add 2–3 dogfood assertions (keep production ones).
- NEW `test/shots/dogfood-L02.png`, `test/shots/dogfood-pack.png`.

## OUT OF SCOPE (unchanged)
RevenueCat live keys, real purchases, App/Play listings, OpenAI TTS key, YouTube mass
posting, any database, and the production paywall policy itself.

## NEXT SESSION POINTERS
- After build: re-run both gates, keep GREEN, then F5 (serve over LAN IP, install on phone +
  5 friends — they just open `http://<LAN-IP>:8080/?dogfood=1`) and F6 (feedback capture) become
  real, not blocked.
- To turn dogfood OFF for a production-simulation test: clear `localStorage` key
  `guitarapp.dogfood` (or the hidden toggle), reload — app returns to strict free tier.

---

## PARKING LOT (as of this handoff)
- **F4 — Live mic strum calibration**: CROSSED OFF by owner 2026-08-08 ("there is not going to
  be any live strumming"). No code, no sign-off needed. If owner ever wants it back, it is a
  fresh decision, not a resurrected task.
- **F5 — PWA phone install over LAN IP**: code-complete (manifest + service-worker + serve.mjs).
  Blocked only by the paywall (now closed by this dogfood mode). Owner to serve over LAN IP and
  install on phone + 5 friends. Trigger: after this handoff's build, open
  `http://<LAN-IP>:8080/?dogfood=1`.
- **F6 — Daily dogfood + feedback capture**: process, no code. Unblocked by this build.
