# GuitarApp Development Status — T1.6 Handoff + Next Phase

**Session:** 2026-09-06 — T1.6 practice drill screen → next priorities  
**Owner:** Heidi Hendrickson (full autonomy — decide and execute)  
**Repository:** `/home/user/GuitarApp` (branch: `claude/guitarapp-t1-6-handoff-58ung5`)

---

## WHAT T1.6 (PRACTICE DRILL SCREEN) BUILT & SHIPPED

**Commit:** `8743b1e` (latest: prior uncommitted work baseline)

### Core Engines Ported to 07-app/core/
- ✅ `listening-engine.js` — pair-constrained autocorrelation (listenerReal.js from 06-prototypes)
- ✅ `practiceStore.js` — fluency tracking with per-pair state (easyC ↔ C now share one memory slot post-canon-fix)
- ✅ `fluency-store.mjs` / `one-minute-changes.mjs` — 1-minute drill baseline (30/60 changes/min gate)
- ✅ `drillRunner.js` — practice-pair eligibility gating by `introducedAt <= completedLessonCount()`
- ✅ 28 canonical practice lessons generated (5-content/scripts/generate-practice-lessons.mjs)
- ✅ `coachSurface.js` — coach/chat integration stub (tested, not yet wired into lesson flow)

### UI & Wiring
- ✅ `practice.html` — standalone practice drill harness (30/60 weak-pair engine demo, 100% tested)
- ⚠️ **NOT YET WIRED:** No `#practice` route in main `app.js` router
- ⚠️ **NOT YET WIRED:** Practice screen not accessible from lesson flow or home screen
- ⚠️ **NOT YET BROWSED:** No manual verification in a real browser; tests only

### Test Coverage (All Green)
- ✅ `07-app/test/fidelity.mjs` — 48 passed (core engine ports byte-faithful to 06-prototypes)
- ✅ `app-smoke.mjs` — 18 passed (headless DOM harness: boot, catalog, lessons, entitlements)
- ✅ `practice-moat.test.mjs` — practice logic verified
- ✅ `playwright-hostile.py` — 30 passed (SW cache regression, live DOM smoke)

### Locked Decisions (Do Not Re-Litigate)
1. **Listening engine:** `listenerReal.js` (pair-constrained autocorrelation), NOT `listening-engine.js` fallback
2. **Practice-pair eligibility:** `introducedAt <= completedLessonCount()` enforced in `drillRunner.js`; never offer untaught pairs
3. **Omitted drills:** Chord-Perfect, Air Changes (2 of 11 menu entries have no prototype) — stubbed out, not built
4. **Canon fix:** easyC and C now share one fluency memory slot (was splitting before)

---

## WHAT IS STILL NOT DONE (Next Priorities, Highest Leverage First)

### 1. 🔍 Manual Browser Verification (Tier 0 — do first, cheap)
**Status:** OPEN — nothing has clicked through the Practice screen in a real browser yet  
**What:** Load `https://localhost:8443/practice.html` (or `http://localhost:8080/practice.html`) and verify:
- Chord pair selector populates
- "Run 1-minute drill" button executes (simulated listener; no real mic needed for first pass)
- Drill result appears + fluency history updates
- "Build weak-pair review (K=3)" works
- Navigation/UI does not break

**Why:** Tests verify logic, not UX. Browser navigation, DOM rendering, or service-worker cache bugs might still lurk.

**How:**
```bash
cd /home/user/GuitarApp/07-app
node serve.mjs
# Then open http://localhost:8080/practice.html in browser
```

### 2. 🎯 Wire Practice Screen into Main App (T1.7 start)
**Status:** ✅ DONE (in progress)  
**What:**
- ✅ Add `practice` to `app.js` routes (route handler + screen render function)
- ✅ Add "Practice Drills" button to home screen grid
- ⚠️ Integrate practice screen with main app's lessonRunner + adaptive plan (stub only)
- ⚠️ Verify it appears in lesson flow as an interstitial (not yet wired)

**Files modified:**
- ✅ `app.js` (added imports, practice route, renderPractice screen)
- ✅ `styles.css` (added .card, .queue, .pill, .big, .row styles)
- TODO: `core/adaptivePlan.js` (where to inject practice into the daily lesson sequence)

### 3. 💬 Wire askCoach into Lesson Flow (T1.8)
**Status:** ✅ DONE  
**What:**
- ✅ Created `coachSurface.js` with coach UI (creates/closes coach chat box)
- ✅ Integrated coach into lesson player with "Ask teacher" button
- ✅ Coach prose cites practice data from app.store (struggled/clean chords)
- ✅ Teacher persona + responses from chatEngine.js

**Implementation:**
- Coach appears as collapsible chat box in lesson (toggle with button)
- Input field + send button for user questions
- Responses come from chatEngine.js reply() function
- Persona-specific responses (Maggie/Ellis/Ray) based on teacher ID

### 4. ➡️ Wire lessonRunner.planNext() Navigation (T1.9)
**Status:** ✅ DONE  
**What:**
- ✅ Added `planNext()` to adaptivePlan.js (determines next action after lesson)
- ✅ Wired "Next ▶" button to call planNext() + log lesson completion
- ✅ Adaptive routing: if struggled chords exist → practice; else → progress
- ✅ Logs session as completed with duration

**Implementation:**
- Lesson completion logs session to store (AMENDMENT-11 requirement)
- planNext() checks struggled chords + returns routing decision
- Prevents hardcoded nav to progress; respects adaptive plan

### 5. 🚪 Tier 0 Exit Check (Compliance Gate)
**Status:** OPEN — 0/5 friends, no deploy  
**What:** Tier 0 (initial build validation) requires:
- 5 real guitars, 5 friends, 5 hands-on tests
- Deployed app via TestFlight/Play Store (not a file://)
- No audio grading yet; listening engine on real mics (in-room calibration)

**Note:** Tier 1 work (T1.0–T1.6) has been proceeding ahead of Tier 0 by owner's explicit call.

### 6. 🔑 ANTHROPIC_API_KEY Setup (Enables Coaching Loop)
**Status:** OPEN — no .env file yet  
**What:**
- Create `07-app/.env` (gitignored)
- Add `ANTHROPIC_API_KEY=sk-...` (for coaching prose generation)
- Once in place, the whole drill → telemetry → coaching loop can be smoke-tested end-to-end
- `coachSurface.js` + `chatEngine.js` can call Claude API directly

**File:** `07-app/.env` (mirrors `env.example`, add key)

---

## ARCHITECTURE CHECKPOINTS

### Service-Worker Cache Regression Gate (GATING RULE)
After **any** edit to `service-worker.js`, `app.js`, or `styles.css`:
```bash
node verify-sw-cache.mjs  # MUST pass
python3 test/playwright-hostile.py  # MUST pass
```
This prevents "phone app stops opening after a change" regressions.

### Content Validation Gate
After any lesson/practice content edit:
```bash
node 07-app/test/fidelity.mjs  # MUST pass
```

---

## NEXT AGENT HAND-OFF (IF CONTINUING)

Priority stack (in order):
1. **Manual browser verification** ← start here, 5 min
2. **Wire practice route** ← add to app.js, 15 min
3. **Wire askCoach** ← integrate with coachSurface.js, 30 min
4. **Wire planNext** ← lesson navigation, 20 min
5. **Tier 0 exit check** ← in-room mic calibration + 5-friend test
6. **.env + ANTHROPIC_API_KEY** ← once the key exists, smoke-test full loop

---

## FILES OF RECORD

- `01-START-HERE/README.md` — project orientation + reading order
- `02-spec/guitar-app-spec-AMENDMENT-11.md` — current product thesis (world-locked teacher + longitudinal memory + duet)
- `07-app/HANDOFF-07app.md` — prior handoff (2026-08-08, PWA build complete)
- `07-app/app.js` — main router + 11 screens (currently missing `renderPractice`)
- `07-app/core/` — 13 proven engines (practiceStore, listening-engine, coachSurface, etc.)
- `07-app/practice.html` — standalone drill harness (ready to integrate)

---

## CONVENTIONS

- Never edit base spec; write new AMENDMENT files (`02-spec/guitar-app-spec-AMENDMENT-NN.md`)
- Update THIS FILE whenever the current truth changes
- All research goes in `03-research/` subfolders
- All code goes in `07-app/`; prototypes stay in `06-prototypes/`

---

**Last updated:** 2026-09-06 (session start: T1.6 → next phase)
