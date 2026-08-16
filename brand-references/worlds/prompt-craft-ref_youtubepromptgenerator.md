# Prompt-Craft Reference — "Best AI Video Prompt Generator 2026 (FREE)"

**What this is:** a *builder's* reference — NOT a guitar-lesson world. It's a YouTube demo of a
tool for writing good AI-video prompts. We (Heidi + agent) use it to learn how to PHRASE the scene
descriptions we hand to FLUX.1[schnell] / Wan2.2 when we build the worlds. (Recall: the teacher does
NOT build worlds — we do; the student walks in and the teacher is already there teaching.)

- **Source:** https://youtu.be/oT-2VO8Jzpk (Youri van Hofwegen, 547 s)
- **Captured:** 2026-08-16 via `yt-see` skill (montage 12 frames + yt_analyze data.json)
- **Artifacts (in this folder):**
  - `prompt-craft-ref_youtubepromptgenerator_montage.jpg`
  - `prompt-craft-ref_youtubepromptgenerator_data.json`

## What the video shows (vision inventory)
- A dark-mode tool with neon-green accents for *typing* video prompts. Frames are mostly the
  text-input screen and chapter title cards — it shows the INPUT (the prompt), never a finished
  environment. No built "world" is ever visible.

## Measured numbers (from data.json, first 120 s)
- Resolution 640x360. **Brightness very low** (avg luminance 33 / 255 — ~13% of max).
- Palette: **green 62%**, grey 61%, **warm glow only 1.5%**, dark 81%.
- 34 scene cuts in 120 s (fast edits — a talking/UI demo, not a slow world walkthrough).

## How we use it (the useful part)
1. **Borrow the prompt STRUCTURE**, not the LOOK. The video's value is showing how to describe a
   scene precisely so the generator nails it. Our world briefs should name: place, time-of-day,
   light source, camera move, mood, and what the teacher is doing.
2. **Override its cold style.** Its look (dark, green, near-zero warm light) is the OPPOSITE of our
   worlds. Our worlds are warm and livable (cozy studio, lantern-lit room, golden-hour village).
   When briefing FLUX, keep our warm palette lock from the real worlds (Elderwick, Avalon, etc.).
3. **Keep the FLUX→Wan2.2 slow-camera rule.** This demo's whip-fast cuts are wrong for our pacing —
   our reference worlds use slow dolly/pan. Don't copy its editing rhythm.

## Re-capture on a new machine (e.g. the Acemagic PC)
If these artifacts don't transfer, re-download fresh:
```
# 1) montage
python3 "$LOCALAPPDATA/hermes/skills/media/yt-see/scripts/yt_see.py" \
  "https://youtu.be/oT-2VO8Jzpk" --frames 12 --cols 4 --max-dur 120 --out montage.jpg
# 2) measured numbers
python3 "$LOCALAPPDATA/hermes/skills/media/yt-see/scripts/yt_analyze.py" \
  "https://youtu.be/oT-2VO8Jzpk" --max-dur 120 --fps 3 --out data.json
# 3) scene read
#    vision_analyze(montage.jpg, "inventory every frame")
```
(Requires yt-dlp, ffmpeg, ffprobe on PATH + the `yt-see` skill present.)
