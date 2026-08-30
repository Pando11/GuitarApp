# GuitarApp — Sub-Agent Execution Path (2026-08-30, updated from disk truth)

**Companion to:** `REDLINED-MASTER-PLAN-2026-08-29.md` + `SUBAGENT-BUILD-PLAN-2026-08-29.md`.
**Author:** Hermes. **Discipline:** this file is the EXECUTION path — it records what is
already built (verified on disk) and the exact dispatch recipe for building the rest.

## 0. VERIFIED on disk (re-checked 2026-08-30, two batches)

- World 1 assets BUILT: 4 palette-locked FLUX stills, 3 Wan2.2 clips (now transcoded to `.ogv`), 5 Chatterbox wavs — all under `07-app/assets/worlds/emerald-hollow/`.
- AMENDMENT-17/18 RATIFIED; 3 pointers synced; 19 amendments + 4 ADRs on disk.
- Chord gate GREEN (re-run after W2/W3 touched content): `node 06-prototypes/step0/run-chord-check.js` → 25 lessons / 81 chords / 0 err / 0 warn.
- Core PWA REAL: `07-app/core/` has practiceStore, teacher, chatEngine, voice-command, entitlementStore, listening-engine, plus NEW sageCoach, storyMemory, backupButtons, pocketbaseSync, jamSession, practiceRemix, stylisticExplorer, songDiscovery, celebration — all with node self-tests passing.
- Godot scaffold WIRED + ASSETS LANDED: 3 clips transcoded to `.ogv` (B00/B01/B02), lesson_manifest.json wired to real emerald-hollow ogv paths, headless `--quit` smoke EXIT 0 (Godot 4.7.2 binary present in `C:/Users/Hendrickson/godot/`, just not at the `godot.exe` name). L01-open-c.mp4 FLAGGED BLOCKED (assets/lessons/ empty).
- `ffmpeg` present at `C:/Users/Hendrickson/AppData/Local/Microsoft/WinGet/Links/ffmpeg.exe`.
- Wave 1 prototype REBUILT: `06-prototypes/practice-engine/practice-remix-q5-prototype.html` (11,085 bytes, file:// safe). Promotion audit: 20 authoring → 25 shipping, 5 orphan shipping lessons flagged (see TICKETS).
- Layer 2 Story Memory (BI-4) + Layer 3 crypto (PBKDF2/AES-GCM, offline-verified) + entitlement stub DONE.

## 1. Build status (after both batches — 2026-08-30)

| Wave | Work | Status |
|---|---|---|
| W1 | Truth-up: rebuild prototype + promotion audit + 10→11 song wording | ✅ DONE (audit surfaced 5 orphan shipping lessons; spec wording locations pinned) |
| W2 | Sage bridge (sageCoach), backup buttons (BI-8), Story Memory (BI-4), PocketBase crypto + entitlement stub | ✅ DONE (Sage bridge + Story Memory + backup buttons built; PB server round-trip BLOCKED — no binary; live browser smoke SMOKE-PENDING-HITL) |
| W3 | Godot landing (mp4→ogv, scene wiring, headless smoke) | ✅ DONE (verified-in-engine; L01-open-c asset flagged BLOCKED) |
| W4 | 5 AI features (song-discovery, jam, stylistic-explorer, celebration, practice-remix) | ✅ DONE (4 ported to core modules + celebration; jam generative half BLOCKED — no GPU/RunPod) |
| W0 | De-risk vertical slice (porch + listening + memory beat) | ⏳ HITL — agent can scaffold, real-beginner test needs you |
| W5 | Integration + dogfood + human lyric read-through | ⏳ HITL — real device + human; gates re-runnable |

### Blocked / needs-you (do NOT fake — see TICKETS file)
- PocketBase live server (binary absent this machine) — client crypto verified offline.
- Jam generative audio (ACE-Step/YuE) — no cloud GPU/RunPod this session.
- L01-open-c.mp4 + .ogg — assets/lessons/ empty, needs generation.
- 5 orphan shipping lessons (holding-the-pick, switching-em-and-c, first-three-chord-song, new-chord-f, new-chord-a7) — no authoring source.
- PWA live-browser smoke, Wave 0 real-beginner test, Wave 5 dogfood + human lyric read-through — HITL.

## 2. DISPATCH RECIPE — first batch (run these 3 in PARALLEL via delegate_task)

Each child gets: this file's §0 + its ticket + the legal floor (Rule 5/8/9/2). They know nothing of chat history.
Repo root passed as workdir. Each must VERIFY its own output and report a verifiable handle (path / stdout / row count), not a claim.

### AGENT-1 — Wave 3: Godot World-1 landing
- Transcode `07-app/assets/worlds/emerald-hollow/clips/B00_walkin.mp4`, `B01_meetsage.mp4`, `B02_twoshot.mp4`
  → `.ogv` via: `ffmpeg -i Bxx.mp4 -c:v libtheora -q:v 7 -pix_fmt yuv420p Bxx.ogv`
  (ffmpeg at `C:/Users/Hendrickson/AppData/Local/Microsoft/WinGet/Links/ffmpeg.exe`). Godot 4 does NOT import mp4/webm — only Theora `.ogv`.
- Place ogv into `07-app/assets/worlds/emerald-hollow/clips/`.
- Wire `07-app/godot/world/World.tscn` + `lesson/LessonScene.tscn` + `07-app/godot/data/lesson_manifest.json`
  to the REAL asset paths (manifest currently references `res://assets/lessons/L01-open-c.mp4` and `.ogv` clips that must now point at the produced files).
- FIX `lesson_manifest.json`: the `W1-coldopen` clips array references `.ogv` — confirm those map to the transcoded files; `L01-open-c` references a `res://assets/lessons/` file that does NOT exist yet (assets/lessons/ is empty) → leave a flagged TODO, do not fabricate.
- If `C:\Users\Hendrickson\godot\godot.exe` exists, run a headless `godot --headless --check-only` import smoke; ELSE report run-verify as BLOCKED (binary missing) and state the build is statically complete but unverified-in-engine.
- Report: list of produced `.ogv` files with sizes + the manifest diff.

### AGENT-2 — Wave 1: truth-up
- Rebuild `06-prototypes/practice-engine/practice-remix-q5-prototype.html` (throwaway, file:// double-clickable):
  one weak spot G↔D, fluency 0.25, 15/min, THREE framings (Tempo challenge / Play-along groove / Calm slow),
  inline mirrors of the engine (ES modules are CORS-blocked over file://). Match the two surviving prototypes' shape.
- Promotion-path audit: verify `05-content/` (20 authoring) maps to `07-app/content/lessons/` (25 shipping)
  after AMENDMENT-15 re-sequence. Report mismatches; DO NOT edit lesson data silently.
- Confirm spec song-count wording 10→11 where it still says 10; note SP11 Amazing Grace = PD.
- Report: prototype path + audit findings (counts, mismatches).

### AGENT-3 — Wave 2: Sage forward-coaching bridge (headline product piece)
- Read `07-app/core/teacher.js`, `practiceStore.js`, `chatEngine.js`, `voice-command.js`.
- Build a Rule-5-safe generator module (e.g. `07-app/core/sageCoach.js`): reads practiceStore numbers
  (clean/fail/unsure counts, tries, streaks, help requests) → emits ONE forward-coaching line that cites ONLY
  stored numbers (e.g. "your Em took 5 tries last week, 2 today"). NO invented praise, NO musical opinion.
- Wire `teacher.js` to call it (today teacher.js copy is cosmetic + walled off from data).
- Ship a `node` self-test feeding fake numbers; assert the emitted line contains a real number from the input
  and contains NO freelanced opinion (a banned-word scan: "great musician", "natural", "talented", etc. fails).
- Voice delivery stays on the existing TTS path — do NOT regenerate wavs.
- Report: module path + self-test stdout.

## 3. Legal floor (every agent)
Rule 5 prose-only/cites stored numbers · Rule 8 chord arithmetic 0 err/0 warn · Rule 9 commercial-clean only · Rule 2 no camera/hand tracking.

## 4. Verification after agents return (parent re-runs, not trust)
- AGENT-1: `ls` the `.ogv` files; `node` not available for Godot — parent confirms sizes + manifest diff.
- AGENT-2: open the prototype path existence; read audit output.
- AGENT-3: `node 07-app/core/sageCoach.test.mjs` (or the self-test) green.
- Re-run chord gate once W2/W3 touch content: `node 06-prototypes/step0/run-chord-check.js`.

## 5. Next (after this batch verifies)
W2 PocketBase sync (schema + client crypto; server can't run here) → W4 five features → W5 HITL dogfood.
The Wave 0 de-risk slice (BI-1..BI-6) is the优先 real-device test Heidi must run; agents can scaffold it but the 5-10 beginner test is HITL.
