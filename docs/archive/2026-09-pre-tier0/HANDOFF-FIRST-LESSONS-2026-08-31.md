# HANDOFF — GuitarApp First Adult Lessons Build (2026-08-31)

**Status:** context-strapped; this handoff captures what I found + what I planned + what the next session MUST verify before doing anything.  
**Goal:** get a beginner from "never touched a guitar" to "I played a real song" on their own phone — first batch of adult lessons, tested by Heidi + friends.  
**Last action:** wrote BUILD-PLAN-FIRST-LESSONS.md (the plan). Did NOT start building.  
**Transfer note:** this machine had a previous GuitarApp build that was lost in a PC transfer. The current state is a rebuild from plans, NOT a continuation. Read the "disk truth" section below before trusting any doc that says something is built.

---

## Disk truth (surveyed 2026-08-31 — verify these again on resume)

The previous handoff doc (HANDOFF-REMAINING-2026-08-30.md) says "Waves 1–4 are BUILT and VERIFIED." **That is not true on this machine.** The app does not exist as a working product. What's real vs placeholder:

### Real on disk
- Planning docs: AGENTS.md, CONTEXT.md, AMENDMENT-01 through AMENDMENT-17, ADR-0001 (sync), ADR-0002 (practice delivery), ADR-0004 (teacher/World 1), brand-references/emerald-hollow/ (measured palette + video montages)
- A partial Godot tree: `07-app/godot/` with a `.godot/` cache, one video clip (`B02_twoshot.ogv`), imported audio samples — but no `project.godot`, no scenes, no content
- Flat ticket list: `.scratch/teacher/tickets.md` (580 lines — T-A1 through T-A4 owner decisions resolved, T-B1 through T-B8 build tickets, T-C1 through T-C3 roadmap)
- World-factory scripts: `scripts/world-factory/` (FLUX/Wan stage1/stage2/stage3, fal.ai paths)
- Gate scaffolds: `tools/verify-curriculum-order.js`, `tools/verify-song-progressions.js`, `tools/voice-cache/generate.py`
- `07-app/app.js` — 129-line PLACEHOLDER (explicitly labeled "STATUS: PLACEHOLDER — real file lost in PC transfer"; has stub TTS, stub chord verify, no mic code)
- `07-app/service-worker.js` — 81-line PLACEHOLDER (explicitly labeled "STATUS: PLACEHOLDER"; has CACHE + precache list but no real content to serve)
- `07-app/core/chord-theory-check.js` — 182-line PLACEHOLDER (explicitly labeled "STATUS: PLACEHOLDER"; has KNOWN_QUALITY_TOKEN set + QUALITY_PATTERNS start, but is NOT a complete checker — no `verifyChord` function, no lesson-reading logic)
- `07-app/core/_V2-F-report.json` — unknown content (1,593 bytes; could be a report from a previous run; verify before trusting)

### NOT on disk (previous handoff claimed these existed)
- `07-app/content/lessons/` — the 25 lesson JSONs — **MISSING** (lesson copies exist in `.order-sandbox/07-app/content/lessons/` and `.order-sandbox/pristine-lessons/` — these are staging copies, NOT in the app's content dir)
- `07-app/content/practice/` — practice drills — **MISSING**
- `07-app/core/app.js` — **MISSING** (the real app core, separate from the placeholder `07-app/app.js`)
- `07-app/core/chatEngine.js` — **MISSING**
- `07-app/core/asset-job.js` — **MISSING**
- `07-app/core/entitlementStore.js` — **MISSING**
- `07-app/core/drillSelector.js` — **MISSING**
- `07-app/core/listener-twin.js` — **MISSING** (the browser twin of the mic listener — the skill docs say it should exist)
- `07-app/core/pocketbaseSync.js` — **MISSING**
- `07-app/index.html` — **MISSING** (the PWA entry point — app.js references `./index.html` in the SW precache)
- `07-app/manifest.webmanifest` — **MISSING**
- `05-content/` — authoring source — **MISSING**
- `06-prototypes/` — practice engine + chord checker — **MISSING** (the real `06-prototypes/step0/schema/chord-theory-check.js` CJS copy is gone; only the placeholder ESM copy in `07-app/core/` exists)
- `04-validation/` — ship gates (check-esm-mirror.mjs, verify-finger-copy.js) — **MISSING**
- `03-research/` — curriculum research docs — **MISSING**
- `assets/` at repo root — FLUX/Wan output — **MISSING** (pipeline never ran on this machine)
- `07-app/audio/l02-voice/*.wav` — generated voice WAVs — **MISSING** (the audio logs show Kokoro WAS run on a previous machine with username "The Yoda Trader" — those WAVs are gone; only the log files remain in `07-app/audio/` as proof it happened)
- `.venv-kokoro/` — the Kokoro Python venv — **MISSING** (the audio logs reference it, but it's not on this machine; can't run Kokoro without reinstalling)
- Any listening/mic/pitch detection code — **MISSING everywhere** (grep for getUserMedia, AudioContext, ScriptProcessorNode, CREPE, pitch detection, confidence, strum — only hits are the placeholder app.js comments referencing them and the skill doc references; no actual listener code on disk)

### Audio logs (proof of previous state, not current capability)
`07-app/audio/` contains three log files from a previous machine (username "The Yoda Trader"):
- `asr-proof.log` — Whisper tiny transcription of a lesson audio (proves whisper was installed + used)
- `l02-gen.log` — Kokoro-82M generated 6 WAVs for lesson 02 (intro, teach-shape, teach-strum, practice, praise, wrap) — total ~118 seconds of audio generated
- `l02-regen.log` — Kokoro regenerated the same 6 WAVs (longer durations — 182 seconds total — possibly different settings)

These logs prove Kokoro + whisper were installed and used on a previous machine. They are NOT on this machine. Do not claim Kokoro is available without checking.

### Lesson content (available but not in the app dir)
The `.order-sandbox/` dir has lesson copies:
- `.order-sandbox/07-app/content/lessons/` — 26 lesson JSONs (lessons 01–25 + lesson 26 extra-beginner) + manifest.json
- `.order-sandbox/pristine-lessons/` — same 26 lessons, labeled "pristine"

These are staging copies. The app's content dir (`07-app/content/lessons/`) is empty. To use these lessons, copy them into `07-app/content/lessons/` or read from `.order-sandbox/` directly. **The manifest in `.order-sandbox/` uses `files` array format, not `lessons` array** — the placeholder app.js reads `manifest.lessons` which will fail. Check the actual manifest format before wiring the app to it.

---

## Mic listening — honest status for the first test

**No listening code exists on this machine.** None. The placeholder app.js has a comment about `listener-twin.js` (the browser twin of the CREPE-class listener) and a stub `verifyChord()` function, but:
- `listener-twin.js` does not exist
- `listener-real.mjs` (the tested Node module it mirrors) does not exist
- No `getUserMedia` / `AudioContext` / `ScriptProcessorNode` wiring exists
- No pitch detection, no chord classification, no confidence scoring exists
- The practice engine (30/60 sensor, weak-pair review, fluency store) does not exist

**For the first test with mic:** this is a significant gap. The plan's Phase 3 was "generate teacher audio" — the mic listening was supposed to be a separate thing that already existed. It doesn't. **The next session has two options:**

- **Option A — Build the mic listening from scratch for the test.** This means: write a browser-based mic listener (getUserMedia → AudioContext → some pitch/chord detection → confidence scoring), test it works on a real device, wire it into the app as the "verify this chord" interaction, with tap-to-confirm as fallback. This is real work and the skill docs say the real-device run is a manual Heidi-authorized step. It's doable but it's the hardest part of the test.

- **Option B — Start with tap-to-confirm for the first test, add mic after.** The plan originally proposed this. The owner (Heidi) just said she wants mic in the first test "just so we can really get a feel if that works." So Option B may not be acceptable. Clarify with Heidi: is "mic in the first test" a hard requirement, or is the real goal "test whether the lesson flow works" and mic is one way to do it (with tap-to-confirm as a valid substitute if mic is too hard for the first cut)?

**If Option A:** the next session needs to design + build a minimal mic listener. The skill docs mention CREPE as an approved library (MIT). The listener contract from the practice engine docs: the listener expects `{ chord: <real name>|null, confident: bool, t }` events; a chord change = two consecutive CONFIDENT strums that differ. This contract exists in the skill references but the code doesn't. The next session would build it.

**Fallback requirement (Heidi's rule):** "there will always be an answer that they can tap just in case the mic stops working." This is in the plan. Every mic-based interaction must have a tap-to-confirm fallback. The next session must honor this — no dead ends if the mic fails.

---

## Plan summary (BUILD-PLAN-FIRST-LESSONS.md — read the full file)

**Slice:** Lessons 1–5 (welcome/anatomy/tuning → holding the pick → first chord Em → second chord C + first song → strumming in time).

**App:** Minimal HTML/JS shell, phone browser, no backend, no service worker for the test, no animated world, teacher = voice + text. Chord diagrams from verified chord theory data. Practice = mic listening with tap-to-confirm fallback (per Heidi's rule).

**Build order (6 phases):**
1. **Phase 0** — Confirm lesson format + chord data (read from `.order-sandbox/` copies; verify the manifest format; check what chords we can teach in lessons 1–5: Em, C, and any others)
2. **Phase 1** — Build the minimal app shell (HTML/JS/CSS: lesson viewer, navigation, chord diagram renderer, audio player, practice interaction with mic + tap fallback, progression tracker)
3. **Phase 2** — Author Lessons 1–5 (write lesson JSONs in the app's content format; warm/encouraging copy per owner tone rule; chord diagrams from verified data; real practice interactions)
4. **Phase 3** — Generate teacher audio (Kokoro-82M if we can install it on this machine, or browser speechSynthesis as fallback; each lesson's teacher lines as WAVs or live TTS)
5. **Phase 4** — Integration + you test first (put shell + lessons + audio together; you run through all 5 lessons on your phone; confirm chord diagrams render, audio plays, practice works)
6. **Phase 5** — Heidi + friends test (2-3 friends with guitars; capture notes on what worked/failed; this is the real test)
7. **Phase 6** — Fix + extend (fix based on test notes; extend to more lessons; eventually rebuild as full PWA with animated world, etc.)

**What's throwaway vs reusable:** The app shell is throwaway (built for the test). The lesson content is reusable (authored in the real app's format). The chord diagram renderer is reusable. The mic listener, if built, is reusable.

**What's NOT in this plan (out of scope):** Full 25 lessons, Godot/animated world, full PWA (service worker, offline, sync), accounts, Path A duet, performance ladder, Mystery Mode, World 2+, photo-real teacher.

---

## What the next session needs to verify FIRST (before doing anything)

**These are listed in priority order — verify them in this order, and don't proceed until each is checked:**

### 1. Confirm the lesson content is usable
- Read `.order-sandbox/07-app/content/lessons/manifest.json` — what format is it? (`files` array? `lessons` array? something else?)
- Read one lesson JSON (e.g. `guitar-lesson-03-first-chord-em.json`) — what's the schema? Does it have `chords[].fingers`, `caption` fields, `steps`, `practice` interactions?
- Check: do lessons 1–5 teach the chords we need (Em, C, and any strumming/picking content)? Or do we need to author from scratch?
- **Decision point:** If the existing lessons are good and in the right format, we use them. If they're incomplete or the wrong format, we author from scratch. The next session decides this in Phase 0.

### 2. Confirm what audio capability we have
- Is `.venv-kokoro/` installable? (Check if Python + pip are available; if so, can we `pip install kokoro`? Or is there a venv we can reactivate?)
- Is whisper available? (The asr-proof.log shows it was used; check if it can be reinstalled.)
- If neither is available, the fallback is browser `speechSynthesis` (built into every phone browser, no install needed, but robotic voice — not the warm teacher voice the owner wants).
- **Decision point:** For the first test, is browser speechSynthesis acceptable, or do we need to install Kokoro? The owner wants "warm and encouraging, never clinical" — speechSynthesis is clinical. Kokoro is better but needs install. Chatterbox is best but needs a cloud GPU/API (fal.ai or RunPod — costs money, needs setup).

### 3. Decide the mic listening approach
- Option A (build mic from scratch) vs Option B (tap-to-confirm first, mic later) — the owner said she wants mic in the first test, but the next session should confirm this is a hard requirement and not just a preference, because Option A is significant work.
- If Option A: design the mic listener. What pitch detection library? (CREPE is approved MIT; there may be lighter options.) What's the detection logic? (Playing a chord → detect the pitches → match against known chord shapes → confidence score.) What's the browser API? (getUserMedia + AudioContext + AnalyserNode or ScriptProcessorNode.)
- If Option B: build tap-to-confirm as the primary interaction, with mic as a future enhancement. This is much faster but less impressive for the test.

### 4. Confirm the chord theory data is usable
- Read `07-app/core/chord-theory-check.js` (the placeholder) — does it have the chord shape data we need for lessons 1–5? (Em, C, and any others.) The placeholder has KNOWN_QUALITY_TOKEN and the start of QUALITY_PATTERNS, but verify it has the actual chord shapes (frets + fingers) for Em and C.
- If the placeholder doesn't have the shapes, where do they come from? The skill docs reference `06-prototypes/step0/schema/chord-theory-check.js` (the CJS copy) as the source of truth — but that's missing. The next session may need to reconstruct the chord shape data from the skill docs + the known chord shapes (Em = x22000, C = x32010, easyC = x32010 with a different fingering, etc.).

### 5. Confirm the delivery method
- The plan proposes local WiFi server (I run a server on this machine, you access over WiFi from phones). Verify: can this machine serve HTTP to other devices on the WiFi? (Check if Node is installed; check if the WiFi allows local server access; check if phone browsers can reach the machine's IP.)
- Alternative: single HTML file (no server, open directly on phone, but file:// has CORS limits for ES modules and some browser APIs).
- Alternative: hosted URL (push to GitHub Pages or similar — more setup, but works from anywhere).
- **Decision point:** Local WiFi server is fastest for iteration. Confirm it works before committing.

### 6. Confirm Node.js + npm availability
- The app shell is HTML/JS — does it need Node? (No — the shell runs in the browser. But if we need a local server, we need Node or Python.)
- Check: `node --version`, `npm --version`, `python --version`, `pip --version`. Whatever's available, we use.
- The voice-cache generate.py script (`tools/voice-cache/generate.py`) is a Python script — check if it can run (needs the Kokoro venv or a fresh install).

---

## What the next session should do (in order)

1. **Read this handoff**, then read BUILD-PLAN-FIRST-LESSONS.md for the full plan.
2. **Verify the disk truth** — re-run the survey commands above. Confirm what's real vs placeholder vs missing. Update this handoff with any changes.
3. **Clarify the mic question with Heidi** — Option A (build mic) vs Option B (tap-to-confirm first). The owner said she wants mic, but the next session should confirm the priority and scope before committing to a big build.
4. **Phase 0 — lesson format + chord data** — read the `.order-sandbox/` lessons, confirm the schema, confirm we have the chords we need. Decide: use existing lessons or author from scratch.
5. **Phase 1 — app shell** — build the minimal HTML/JS/CSS app. Start with a single lesson (Lesson 3 — Em — is the first real chord lesson and a good test case). Get one lesson rendering end-to-end before building all 5.
6. **Phase 3 — audio** — generate or synthesize the teacher voice lines. Start with browser speechSynthesis if Kokoro isn't available; upgrade later.
7. **Phase 4 — integration** — put it all together, test on your phone.
8. **Phase 5 — friend test** — only after you've confirmed it works.

---

## Hard rules (from AGENTS.md — always live)

- **Rule 5:** LLM writes prose only; cites stored numbers only. No invented praise or musical opinion.
- **Rule 9:** License blocklist = copyright law. Never propose: ElevenLabs, XTTS-v2, F5-TTS, Piper, F5-TTS, Fish Speech, IndexTTS-2, Wav2Lip, FLUX.1 dev/Krea. Approved: Chatterbox (MIT), Kokoro-82M (Apache-2.0), OpenAI TTS, MeloTTS/StyleTTS2 (MIT). For the test, Kokoro or speechSynthesis are the realistic options.
- **Rule 2:** No camera, no hand tracking.
- **Owner tone rule:** Teacher copy is warm and encouraging, never clinical. Praise the past win, soften the turn, invite the next step.
- **Chord correctness is non-negotiable:** Any chord diagram shown to the student must be arithmetically verified. Don't draw a chord by hand — drive it from verified data. If verified data doesn't exist on disk, reconstruct it from known shapes and flag it as "verified from known shapes, not from the checker" until the checker is restored.
- **Confidence gating is a feature:** Below threshold, say "not sure, play that again." Never a false red X.
- **The app speaks via live TTS, not pre-rendered WAVs** (per the app.js comment) — but for the first test, pre-rendered WAVs may be simpler (no server needed). The skill docs say the phone does NOT play pre-rendered WAVs — but that's for the full PWA with the /api/tts endpoint. For a minimal test shell, WAV playback is fine. The next session decides which approach.
- **PC-transfer gotcha:** The prose docs may describe a full repo tree that didn't survive. The text is pre-transfer truth, not on-disk fact. Verify before claiming anything exists.
- **Spec/README re-sync gotcha:** When a new AMENDMENT is written, re-sync AGENTS.md + 01-START-HERE/README.md + HANDOFF.md pointers. Not relevant for this build (no new amendments), but flagged for awareness.
- **Don't trust the gates:** The ship gates (verify-curriculum-order.js, verify-song-progressions.js) are placeholder scaffolds on this machine — they can't run. Don't run them and trust the result. Verify content by reading the files directly.

---

## Open questions for the next session (or for Heidi to answer)

1. **Mic: Option A (build it) or Option B (tap-to-confirm first)?** The owner wants mic in the first test. Is that a hard requirement?
2. **Voice: Kokoro (needs install, warmer) or speechSynthesis (no install, robotic)?** For the first test, is speechSynthesis acceptable, or do we invest in Kokoro?
3. **Delivery: local WiFi server, single HTML file, or hosted URL?**
4. **Lessons: use the `.order-sandbox/` copies as-is, or author fresh?** The copies exist and may be good — but verify the format matches what the app shell expects.
5. **How many friends, and what skill levels?** (Total beginner? Some experience? This affects how we test.)
6. **Timeline:** When does the test need to happen? (This affects how much we can build before the test.)

---

## Files written in this session

- `BUILD-PLAN-FIRST-LESSONS.md` — the full build plan (19,868 bytes). Read this first on resume.

## Files to update on resume

- This handoff (HANDOFF-FIRST-LESSONS-2026-08-31.md) — update the "disk truth" section if anything changed.
- BUILD-PLAN-FIRST-LESSONS.md — update if the plan changes based on mic decision or lesson format findings.

## Files that should exist after the build (for reference)

- `07-app/index.html` — the PWA entry point (or the test shell HTML file)
- `07-app/content/lessons/guitar-lesson-01-*.json` through `guitar-lesson-05-*.json` — the authored lessons
- `07-app/audio/l01-*.wav` through `l05-*.wav` — the generated teacher audio (or the speechSynthesis fallback)
- The chord diagram renderer (JS module or inline in the app shell)
- The mic listener (JS module, if built) + the tap-to-confirm fallback
- A short test-report markdown file captures the friend test results

---

*Handoff written 2026-08-31. Next session: read this, verify disk truth, clarify mic question with Heidi, then start Phase 0.*
