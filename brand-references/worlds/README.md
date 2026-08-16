# GuitarApp Reference Worlds — Master Index

**Purpose:** One spot for every "world" Heidi envisions for the student to walk into
(inside which a teacher plays guitar and teaches the lesson). Each world is captured
from a YouTube reference URL via the `yt-see` skill:
  - a **montage** (what the agent can visually inspect),
  - an **analysis JSON** (exact pixel/color/motion numbers — see `elderwick-market_data.json` for schema),
  - a **brief** (`.md`) combining the numbers + scene inventory + how to feed it into the
    FLUX → Wan2.1 → Chatterbox → Godot pipeline once that is installed.

**How to add a world:** send Hermes a YouTube URL and say "save this world." Hermes runs
`yt_see.py` (montage) + `yt_analyze.py` (data) + `vision_analyze` (scene inventory), then
drops the three artifacts here and adds a row below. Everything stays in THIS folder so it's
findable later with one command: "show me the worlds we've saved."

## Worlds on file

| # | World name | Source URL | Mood | Palette (avg RGB) | Bright | Shots | Brief |
|---|------------|-----------|------|-------------------|--------|-------|-------|
| 1 | **Elderwick Market** (green/mossy village) | https://youtu.be/FYmRkScwJ8M | populated medieval village, pastel-golden-hour + misty | (75,84,76) | lum 81 | 4 | `elderwick-market.md` |
| 2 | **Celtic Ambience Village** (green/mossy, ruins) | https://youtu.be/idGNrUzRues | secluded village → stone bridge → underground ruins, overcast/misty | (67,82,75) | lum 77 | 1 (single slow dolly) | `celtic-ambience-village.md` |
| 3 | **Avalon's Hidden Lake** (quiet sanctuary) | https://youtu.be/aqgwKX_02aY | ivy cottage + lantern → 3-arch bridge → cliff castle + waterfall, golden-hour serene | (76,72,58) | lum 72 | 1 (static image; 3 cuts in 1st 2s fade-in only) | `avalon-hidden-lake.md` |
| 4 | **Emerald Vale / Enchanted Forest Trail** (mood library) | https://youtu.be/PBrscpvKuQg | slideshow of ~165 distinct medieval-fantasy scenes (forest path, lakeside village, ruins, tavern, snowy ritual) | (90,84,78) | lum 85.7 | 165 (fast slideshow, ~1.1s/scene) | `emerald-vale.md` |

### Builder's prompt-craft reference (NOT a world — a how-to-write-prompts aid for us)
| # | Name | Source URL | Use | Brief |
|---|------|-----------|-----|-------|
| R1 | **AI Video Prompt Generator** (prompt-craft tutorial) | https://youtu.be/oT-2VO8Jzpk | Demo of how to PHRASE scene prompts for FLUX/Wan2.2. Cold green look — do NOT copy its style; borrow only the prompt STRUCTURE. | `prompt-craft-ref_youtubepromptgenerator.md` |
| R2 | **Prompt Like THIS (5 Levels)** | https://youtu.be/P3cxhr8FJa8 | Full 5-level prompting ladder (L5 = locked character/location instances = AMENDMENT-11 world-locked teacher). Cold/cinematic look — copy structure + camera discipline only, NOT palette. | `prompt-craft-ref_5levels_transcript.txt` |

## Measured-data schema (from `yt_analyze.py`)
```
source: {width,height,duration}
frames_sampled, sampled_seconds
overall_avg_rgb: [r,g,b] 0-255
overall_avg_luminance: 0-255
palette_pct: {green,warm,grey,blue,dark,bright}  (share of frames in each bucket)
warm_glow_pct: % of pixels that are bright amber/gold (window/lantern glow)
shot_changes: [{cut_at, from_shot}]  (frame-accurate cuts)
num_shots
sample_curve: [{t,r,g,b,lum,warm_glow_px}]  (per sampled frame)
```

## Pipeline hand-off (when FLUX/Wan2.1/Chatterbox/Godot are installed)
- **FLUX.1[schnell]** (Apache-2.0, legal) — paint stills from the palette lock + scene inventory.
- **Wan2.1-I2V-14B** (Apache-2.0) — motion; match the slow dolly/pan (NOT whip-pan) seen in the data.
- **Chatterbox** (MIT, shipping) / **Kokoro-82M** (Apache-2.0, CPU fallback) — teacher voice; ambient Celtic music = world BGM.
- **Godot 4.x** (MIT) — the village shell; lesson triggers as a scene when the student reaches the teacher.
- **RED LINE:** Midjourney is excluded (AMENDMENT-07/08). Reference's MJ-style prompts are for *style-match only*.

## Status (2026-08-15)
Asset pipeline NOT installed: FLUX present (`~/re/flux`); Kokoro+whisper in `.venv-kokoro`;
**Chatterbox NOT on disk**; **Wan2.1 NOT on disk**; Godot scaffolded (`07-app/godot/`) but engine not installed.
These worlds are SAVED REFERENCE — feed them to the pipeline the moment it's ready.
