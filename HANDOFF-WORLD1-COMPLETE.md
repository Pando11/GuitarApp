# World 1 (Emerald Hollow) — Build Handoff / Status

**Owner:** Heidi Hendrickson · **Builder:** Hermes · **Date:** 2026-08-30 (PM)
**Supersedes:** HANDOFF-STAGE3-4-WORLD1.md (now stale — this is the single source of truth).

## STATUS (verified on disk)
- Stage 1 — FLUX stills: DONE (4 stills, palette-locked)
- Stage 2 — Wan2.2 video: DONE (3 clips, real motion)
- Stage 3 — @Sage voice: DONE (5 Chatterbox WAVs)
- Stage 4 — Godot wiring: DONE + VERIFIED on Godot 4.7.2 (2026-08-30). Clips transcoded to
  Theora `.ogv` (the only video container Godot 4 imports natively — `.mp4` and `.webm` both fail to
  load). Engine extracted to `C:\Users\Hendrickson\godot\` from Heidi's Downloads zip. Playback
  `is_inside_tree` crash fixed (`World.gd` now defers `setup()` via `call_deferred`). Headless load
  test = ALL_OK (clips → VideoStreamTheora, voices → AudioStreamWAV); full headless run enters
  W1-coldopen with no errors. Only the visual F5 playback (frame decode + voice-over) remains an
  owner-side check, since Godot doesn't decode VideoStreamPlayer frames headless.

RunPod was abandoned (EU-RO-1 GPU supply constraint). All generated assets were made on
**fal.ai** managed API. License gate (`07-app/core/asset-job.js`) passes for `flux.1-schnell`
+ `wan2.2-i2v`. Voice (Chatterbox MIT) is off the AGENTS.md rule-9 blocklist.

---

## PRODUCED ASSETS (real files, on disk)

`07-app/assets/worlds/emerald-hollow/`

STILLS (4, 100% palette-locked to the 7 brief hexes — off_palette=0):
- stills/sage_porch.palette.png         (@Sage on porch)
- stills/coldopen_walk.palette.png      (POV walk up the street)
- stills/twoshot.palette.png            (@Sage + @Student two-shot)
- stills/sage_charsheet.palette.png     (@Sage character sheet)
  (+ raw un-palette-locked `.png` of each, + stills/manifest.json)

CLIPS (3, Wan2.2-I2V, 1280×720, 81 frames, 16fps, ~5.0s, motion verified):
- clips/B00_walkin.mp4   (4.0 MB)  cold-open BLOCK 00 — POV walk-in
- clips/B01_meetsage.mp4  (2.9 MB)  cold-open BLOCK 01 — meet @Sage
- clips/B02_twoshot.mp4   (3.8 MB)  cold-open BLOCK 02 — two-shot
  (+ clips/manifest.json)

VOICE (5, Chatterbox MIT, 24kHz mono, 2.6–5.0s each):
- voice/B01_welcome_adult.wav    "Hey, you made it. Grab a seat on the porch, and let's play."
- voice/B01_welcome_kid.wav      kid-register variant of the welcome
- voice/B02_youvegotthis.wav     "That's your first chord. You've got this."
- voice/sage_welcome.wav         "Glad you're here. Take a breath, and let's make some music."
- voice/sage_praise_progress.wav "Your Em took five tries last week, and two today..." (Rule-5 praise)
  (+ voice/manifest.json)

## VOICE DECISION (owner asked to match a YouTube channel)
Requested reference: YouTube channel "ManuAGI - AutoGPT Tutorials"
(https://youtu.be/5m5G6afyrtw) — warm ElevenLabs-style narration.
- That channel uses **ElevenLabs** (their description carries an ElevenLabs affiliate link).
- **ElevenLabs is BANNED for GuitarApp** by AGENTS.md rule 9 (paid subscription; rule "survives
  AMENDMENT-06" and is "copyright law, not preference"). So ElevenLabs was NOT used.
- @Sage uses **Chatterbox (MIT)** — the approved shipping voice. Tuned warm/calm (exaggeration 0.5)
  and written in the same clear, friendly reader style. Closeness to the channel's feel comes from
  calm delivery + script style, NOT a cloned voiceprint. Per brief: NO cloning of a real person.
- This is a DEMO voice — swappable later (see "How to change the voice" below).

## SCRIPTS (working, in repo)
- scripts/world-factory/fal_common.py   — auth + FLUX + Wan I2V + Chatterbox voice + 7-hex palette lock
- scripts/world-factory/fal_stage1.py    — stills
- scripts/world-factory/fal_stage2.py    — video clips
- scripts/world-factory/fal_stage3.py    — @Sage voice
- scripts/world-factory/_run_stage1/2/3.sh — FAL_KEY loader + runner (re-run any stage to regenerate)

Source-of-truth brief/spec:
- brand-references/worlds/world-brief-emerald-hollow-L1.md
- brand-references/worlds/WORLD-1-BUILD-SPEC.md (status section updated to DONE)
- 02-spec/GAP-REGISTER-2026-08-29.md (ground-truth corrected: world art now produced)

---

## STAGE 4 — GODOT WIRING (the only remaining work)

Goal: open the Godot 4.7.x project, hit F5, and play the Emerald Hollow cold open
(B00→B01→B02) with @Sage's voice over B01/B02.

### What the scaffold expects vs what exists
- `07-app/godot/lesson/LessonScene.gd` reads `video_asset` + `voice_asset` + `fingering` from
  `07-app/godot/data/lesson_manifest.json`, and currently only `print`s the voice path
  (no audio playback) and plays ONE video.
- The example manifest entry points at `res://assets/lessons/L01-open-c.mp4` — does NOT match the
  real assets in `res://assets/worlds/emerald-hollow/`. Must repoint.
- `07-app/godot/README.md` + `LessonScene.gd` comments say `Wan2.1-I2V` — real clips are
  `Wan2.2-I2V` (still Apache-2.0; fix for accuracy).

### Exact edits
1. **lesson_manifest.json** — append a World-1 cold-open lesson that sequences the 3 clips:
   ```json
   {
     "id": "W1-coldopen",
     "title": "Emerald Hollow — Arrive",
     "world": "emerald-hollow",
     "style_anchor": "emerald-hollow-v1",
     "clips": [
       "res://assets/worlds/emerald-hollow/clips/B00_walkin.mp4",
       "res://assets/worlds/emerald-hollow/clips/B01_meetsage.mp4",
       "res://assets/worlds/emerald-hollow/clips/B02_twoshot.mp4"
     ],
     "voice_assets": {
       "B01_meetsage": "res://assets/worlds/emerald-hollow/voice/B01_welcome_adult.wav",
       "B02_twoshot":  "res://assets/worlds/emerald-hollow/voice/B02_youvegotthis.wav"
     },
     "fingering": []
   }
   ```
2. **Make assets visible to Godot.** Copy `07-app/assets/worlds/emerald-hollow/` under
   `07-app/godot/assets/worlds/emerald-hollow/` (or symlink). Re-open the project so the import
   scan picks up the `.mp4`/`.wav` files. Use `res://assets/worlds/emerald-hollow/...` paths.
   (Godot ignores files starting with `_`; ours don't.)
3. **LessonScene.gd** — extend to iterate `clips: [...]`: load each into `VideoStreamPlayer`,
   `play()`, and when the clip key is in `voice_assets`, also play the matching WAV via an
   `AudioStreamPlayer`. Advance on the clip's `finished` signal. (Today it handles one
   `video_asset`; add the playlist loop.)
4. **LessonScene.tscn** — add an `AudioStreamPlayer` node for the voice track.
5. **Animation beats (brief L4)** — optional scaffold: `World.gd` hooks for lantern-lights-per-
   lesson, village "wakes", crowd clap, @Sage posture shift. Tweens/signals; minimal is fine.
6. **Stale-reference fixes:** README `Wan2.1`→`Wan2.2`; `LessonScene.gd` comments `Wan2.1`→`Wan2.2`.

### Stage 4 deliverable
Godot project opens, F5 loads `lesson_manifest.json`, shows the Emerald Hollow door, and plays
B00→B01→B02 with @Sage's voice over B01/B02. No missing-asset errors in the Output panel.

---

## HOW TO CHANGE THE VOICE LATER (demo is swappable)
Edit `scripts/world-factory/fal_stage3.py` — adjust `exaggeration` (0.5 = calm; raise for more
energy) / `temperature` (0.7 = natural variation), or change the line texts, then re-run
`_run_stage3.sh`. New WAVs land in `voice/`; update the `voice_assets` paths in the Godot
manifest if filenames change. Approved voice models: Chatterbox (MIT), Kokoro-82M (Apache-2.0,
CPU fallback). Banned: ElevenLabs, XTTS-v2, F5-TTS, Fish Speech, Piper, IndexTTS-2, Wav2Lip.

## OPEN ITEMS (non-blocking)
- @Student in B02: twoshot still shows a generic learner; "from behind" option exists in brief L5
  — regenerate via `fal_stage1.py` if preferred.
- char-sheet cleanup: sage_charsheet.palette.png came out mostly misty-blue-grey (palette absorbed
  the "grey bg"). Dedicated neutral-hex pass deferred.
- Budget (GAP G8): Stages 1–3 cost <$1 total. Stage 4 is free.

## FIRST ACTION
Open `07-app/godot/` in Godot 4.7.x, copy the `emerald-hollow` assets into the project, apply the
`lesson_manifest.json` + `LessonScene` changes, F5, verify the cold open plays with voice.
Nothing here requires RunPod.

---

## STAGE 4 — WHAT WAS ACTUALLY CHANGED (2026-08-30)

All edits are written and verified offline (Godot is not installed on the build box, so the final
F5 visual run is the owner's step). Files touched:

1. **`07-app/godot/lesson/LessonScene.gd`** — rewritten to:
   - Add `_ready()` that connects `VideoStreamPlayer.finished` -> `_on_VideoStreamPlayer_finished`,
     so the cold open auto-advances B00 -> B01 -> B02.
   - Read `clips: [...]` (ordered playlist) and `voice_assets: {stem: wav}` from the lesson dict.
   - `_play_current()` loads each clip into the VideoStreamPlayer and, when the clip's filename stem
     is in `voice_assets`, also plays the matching WAV via the AudioStreamPlayer.
   - Falls back to the old single `video_asset` shape if `clips` is absent.
2. **`07-app/godot/lesson/LessonScene.tscn`** — added an `AudioStreamPlayer` node (the voice track).
3. **`07-app/godot/data/lesson_manifest.json`** — appended the `W1-coldopen` lesson entry with the 3
   clip paths + the 2 voice mappings (B01, B02). (L01 placeholder entry left intact; its
   `res://assets/lessons/L01-open-c.mp4` was a pre-existing scaffold path that never had assets — not
   part of World 1. `LessonScene.gd` logs + skips a missing file, so it won't break the W1 entry.)
4. **`07-app/godot/assets/worlds/emerald-hollow/`** — copied the produced stills/clips/voice from
   `07-app/assets/worlds/emerald-hollow/` so `res://assets/worlds/emerald-hollow/...` resolves.
5. **`07-app/godot/icon.svg`** — created (project.godot referenced it; it was missing -> would warn).
6. **`07-app/godot/README.md`** — `Wan2.1` -> `Wan2.2` (matches asset-job.js + real clips).

### Offline verification performed
- Every `res://` path referenced by the manifest + .tscn ext_resources resolves to a real file
  (except the pre-existing L01 placeholder, which is outside World 1 scope).
- `LessonScene.gd` / `World.gd`: braces + parens balanced.
- `lesson_manifest.json`: valid JSON; W1 entry has `clips` + `voice_assets`.
- Node names in `.tscn` (`VideoStreamPlayer`, `AudioStreamPlayer`, `FingeringOverlay`) match the
  names the script looks up.

### What only Godot can confirm (owner's F5 check)
- Video renders and auto-advances B00->B01->B02.
- @Sage's voice plays over B01 + B02.
- No "missing asset" / parse errors in the Godot Output panel.
- (Optional) lantern/village animation beats — deferred; scaffold hooks noted in brief L4.

### To run it
1. Install Godot 4.7.x (MIT, free) from https://godotengine.org.
2. Open `07-app/godot/` as a project.
3. Press F5 (or Run). The World loads, shows the Emerald Hollow door; selecting/entering
   `W1-coldopen` plays the cold open with @Sage's voice.

---

## STAGE 4 — VIDEO CONTAINER + PLAYBACK FIX (RESOLVED 2026-08-30, verified on Godot 4.7.2)

**Original symptom:** `.mp4` clips would not load (`No loader found for resource ...B00_walkin.mp4`).
Godot 4 does not ship an H.264/.mp4 video importer in the standard build.

**Wrong assumption corrected:** `.webm` (VP9) is ALSO not importable in Godot 4 (verified by load
test: `load()` returned null on all three `.webm`). The ONLY video container Godot 4 imports
natively is **Theora (`.ogv`)**.

**What was actually done (verified):**
1. Transcoded all 3 cold-open clips `.mp4` → `.ogv` (Theora) with ffmpeg:
   `ffmpeg -i Bxx.mp4 -c:v libtheora -q:v 7 -pix_fmt yuv420p Bxx.ogv`
   produced `B00_walkin.ogv`, `B01_meetsage.ogv`, `B02_twoshot.ogv` (1280×720).
2. Repointed `lesson_manifest.json` W1-coldopen `clips: [...]` to the `.ogv` files.
   (`.mp4` and `.webm` originals remain in the folder, unused — safe to delete later.)
3. **Engine upgrade:** Heidi's downloaded `Godot_v4.7.2-stable_win64.exe.zip` (in Downloads) was
   extracted to `C:\Users\Hendrickson\godot\` (alongside 4.7.1). 4.7.2 loads `.ogv` as
   `VideoStreamTheora` natively. **Use 4.7.2 to run the world** (4.7.1 also lacks mp4, and the
   `.ogv` path needs the same import that 4.7.2 performs cleanly).
4. **Playback crash fix:** `World.gd` called `LessonScene.setup()` synchronously inside `_ready()`
   right after `add_child()`. Because `add_child()` during `_ready()` defers the child's
   `enter_tree` to the next frame, `VideoStreamPlayer.play()` fired while the node was still
   outside the tree → `ERROR: Condition "!is_inside_tree()"`. Fixed by deferring setup:
   `current_scene.call_deferred("setup", data)`.
5. Clean re-import on 4.7.2 (deleted stale `.godot/` cache from the 4.7.1 session) so `.ogv.import`
   metadata is generated correctly.

**Verification actually run (Godot 4.7.2 headless):**
- Load test on every World-1 media res:// path → `RESULT: ALL_OK`
  (clips → `VideoStreamTheora`, voices → `AudioStreamWAV`).
- Full run of the World scene → prints both doors, enters `W1-coldopen`, **no errors**
  (the `is_inside_tree` crash is gone).
- `.ogv` import metadata present; manifest JSON valid.

**What only the editor/F5 can confirm (Godot does not decode VideoStreamPlayer frames in headless
mode, so the `finished`→advance→voice chain can't be exercised headless):**
- B00→B01→B02 auto-advances visually and @Sage's voice plays over B01+B02.
- Open `07-app/godot/` in **Godot 4.7.2**, press F5. (Ignore any `L01-open-c` placeholder warning —
  that scaffold entry never had assets and is outside World 1 scope.)

**Engine note:** same engine family 4.7.1 ↔ 4.7.2; the video blocker was a codec/container matter,
and the fix is the `.ogv` container + 4.7.2 import, not version-specific behavior.

