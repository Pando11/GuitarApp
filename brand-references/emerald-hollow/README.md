# Emerald Hollow — Brand Reference Kit

Source channel: **Emerald Hollow** / `@EmeraldHollow_Bun`
Channel ID: `UCAuFGYHehZbqhmHHxntIFUw`
Analysis date: 2026-08-09

## What's in this folder
- `avatar_greenman.jpg` — channel avatar (900x900, weathered "Green Man" stone carving, mossy greens/teals/greys)
- `banner_emerald-hollow.jpg` — channel banner (2048x1152, swirling teal/blue/green fog with "Emerald Hollow" serif text + faint glowing-eyed face)
- `asset_community-post.jpg` — bonus asset pulled from channel (1078x1081), possibly a community-post image
- `thumb_*.jpg` — 6 representative video thumbnails (1280x720), the AI-gen art style we analyzed

## Verdict (Part C)
The video thumbnails (and likely the banner) are **AI-generated** (Midjourney v5/v6 or SDXL-class), from a single consistent pipeline. The avatar is a real/sourced weathered stone carving (not AI).
AI tells: melted architecture, waxy/smooth stone+bark+snow textures, chaotic over-detailed roots/branches, blobby window glow with no reflection, mathematically uniform falling snow, no human figures.

## Thumbnail Formula (Part B) — replication blueprint
1. Subject (constant): 1 rustic medieval cottage / small village, deep snow, bare gnarled trees framing LEFT+RIGHT, heavy falling snow, warm glowing windows. Only the place-noun varies.
2. Palette (brand lock): cool base = deep teal / icy blue / desaturated grey (70-80%); warm accent = amber/golden window+lantern glow (20%, always opposite the cold).
3. Lighting: overcast/volumetric fog, soft diffuse shadows, cinematic rim-light on tree edges, bloom around windows. No hard sun.
4. Composition: centered path/vanishing point to the cottage; trees frame both sides; hero in lower-third. Reads at small size (high contrast, simple silhouette).
5. Typography: usually NO on-thumbnail text. YouTube title pattern: `"[Place] — Medieval Celtic Winter Ambience for [Calm/Focus/Sleep/Study/Rest]"`.
6. Production: Midjourney `--ar 16:9 --style raw --v 6`; batch by swapping only the place-noun + roof/village detail; keep palette/framing/lighting identical for brand cohesion.

## Reuse for the Guitar App
The Emerald Hollow "emerald + hollow + cozy-mystical" identity maps cleanly onto the GuitarApp brand direction Heidi wants:
- Use the GREEN/TEAL + STONE-GREY palette as the app's accent system (already echoed in the guitar-app free build art direction).
- Avatar concept: a weathered/illustrated emblem (Green Man, leaf, or a Celtic-knot guitar) — hand-made feel, NOT smooth AI.
- Banner concept: swirling mist + centered serif wordmark, faint mystical figure/eyes in background.
- Thumbnail/tile art for lessons: same "cozy-cottage-in-snow" mood but swap the cottage for a warm practice nook / hearth with a guitar; keep cold-vs-warm contrast.

## Prompt Kit
See `prompts.txt` (Midjourney prompts) and `batch.csv` (spreadsheet-ready batch of variations).

## Status of generated test thumbnails (Part B deliverable)
Image generation is BLOCKED in this Hermes environment (no FAL_KEY / no paid Nous credits).
=> The `image_generate` calls failed; no thumbnails were fabricated.
To produce the test thumbnails, either:
  (a) add a fal.ai key: `export FAL_KEY=<key>` then restart Hermes, OR
  (b) run the prompts in `prompts.txt` manually in Midjourney / your preferred generator.
The archived `thumb_*.jpg` originals are the exact reference to match against.
