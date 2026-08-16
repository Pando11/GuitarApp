# World Brief — Avalon's Hidden Lake (Quiet Sanctuary)

**Source URL:** https://youtu.be/aqgwKX_02aY
**Title / Uploader:** "Avalon's Hidden Lake | A Quiet Sanctuary | Medieval Celtic Summer Music | Medieval Hearth"
**Full duration:** 8823 s (2h27m) — but this is a STATIC ambient image set to music, not motion footage (see measured data).
**Captured:** 2026-08-15 via `yt-see` skill (montage + yt_analyze + vision inventory).

---

## Measured data (exact, from pixels — `avalon-hidden-lake_data.json`)

- **Source res / sampled window:** 640×360, sampled 120 s @ 2 fps (240 frames).
- **Overall avg RGB:** [76, 72, 58] — a muted, slightly warm earth-grey (no saturated color dominates).
- **Overall avg luminance:** 72.0 / 255 — mid-bright, softly lit (neither dark nor blown-out).
- **Palette buckets (share of frames):** grey **98.8%**, warm 0.8%, green/blue/dark/bright ~0%.
  → The whole clip sits in a calm, desaturated "grey" band. Color comes from local accents (sky, foliage, lantern), not the average.
- **Warm-glow pixels:** 1.06% of all pixels are bright amber/gold (the cottage window + door lantern). A small, intentional cozy-light focal point.
- **Shot changes:** 3 cuts in the first 2 s (a fade-in / cross-dissolve settling the image), then **ZERO cuts for the remaining 118 s**.
- **Motion:** After the ~2 s intro, every sampled frame is pixel-identical (RGB [76,72,58], lum 71.6 flat to t=120). **This is a single still image, not a moving scene.** No camera dolly, no pan, no zoom across the body of the video.

> Pipeline note: because the reference is static, Wan2.1-I2V has no real motion to learn here. Use it only for a *very slow* ambient drift (water shimmer, leaf sway) if you want life — do NOT invent a camera move the source doesn't have.

---

## Scene inventory (vision, single still — `avalon-hidden-lake_still.jpg`)

**Color mood**
- Sky: vibrant azure blue fading to hazy white at the horizon; wispy white clouds (clear, slightly humid day).
- Water: deep reflective teal-cyan river, white sun-hit ripples.
- Foliage: saturated emerald greens; foreground pops of magenta/pink foxgloves + roses, white/yellow daisies; a soft-pink blossoming tree on the right bank (spring feel).
- Stone/architecture: weathered sandstone greys + browns, heavy moss-green ivy; dark slate roofs.
- Light accents: warm amber/orange from windows + a door lantern — cozy contrast against cool daylight.

**Structures & placement**
- Foreground left: two-story ivy-covered stone cottage, steep shingled roof, wooden door with glass panes, stone staircase, warm window + doorway glow.
- Foreground center: low weathered stone retaining wall; rustic wooden table with potted plants + metal watering can on the grass.
- Mid-ground center: classic **three-arch stone bridge** spanning the river (connects left bank to village).
- Mid-ground right: small cluster of slate-roof stone cottages; one chimney with a wisp of smoke.
- Background: massive **castle on a high rocky cliff** with multiple spires/towers; a large waterfall cascades down the cliff left of the castle.
- Foreground path: winding cobblestone path from bottom-right, lined with a wooden post-lamp, leading toward the village.

**Nature**
- Flora: foxgloves, climbing roses, wild daisies, lush undergrowth.
- Trees: mature deciduous (oak-like) framing top-left/right as a natural vignette; dense coniferous forest (pines/firs) on the distant mountains.
- Topography: rolling green hills → jagged rocky mountains far back.

**Figures / animals:** none visible. Scene is environment-only — solitude, peace.

**Lighting / time-of-day:** late afternoon / golden hour. Sun high + slightly left, soft long shadows to the right, backlights the castle spires (halo). Interior lamp lit → twilight approaching or intentionally cozy.

**Emotional tone:** idyllic, serene, magical, secluded — "The Shire" meets high fantasy; a safe hidden sanctuary. Lived-in but timeless; cozy foreground cottage vs. majestic background castle gives scale + wonder.

---

## Pipeline hand-off (FLUX → Wan2.1 → Chatterbox → Godot — when installed)

**Palette lock (from measured + vision):**
- Base: muted earth-grey [76,72,58], luminance ~72.
- Accents: azure sky, teal-cyan water, emerald foliage, sandstone + slate stone, amber lantern glow (~1% warm pixels).
- Keep it SOFT and desaturated overall; let local accents carry the color.

**FLUX.1[schnell]** (Apache-2.0, legal — RED LINE, no Midjourney):
- Paint the still from the palette lock + scene inventory above. Prompt for style-match only.
- Key elements to lock: ivy cottage + lantern (foreground left), three-arch bridge (center), cliff castle + waterfall (background), pink-blossom tree + foxgloves (foreground right).

**Wan2.1-I2V-14B** (Apache-2.0):
- Source is static → generate only subtle ambient life: river shimmer, leaf/branch sway, lantern flicker, drifting mist. NO camera move (the data shows none).

**Chatterbox** (MIT, shipping voice) / **Kokoro-82M** (Apache-2.0, CPU fallback):
- Teacher voice. Ambient Celtic summer-music track = world BGM (the source's own genre).

**Godot 4.x** (MIT):
- World shell matching the inventory: directional sun (warm ~3500–4000K) top-left; point/omni warm (~2700K) inside cottage windows + path lamp; bloom on spires + warm lights; vignette toward center path. Modular stone meshes for cottage/bridge/castle; MultiMesh foliage for grass/flowers; water shader for the teal river.

---

## Artifacts in this folder
- `avalon-hidden-lake_montage.jpg` — 16-frame grid (all identical = confirms static image).
- `avalon-hidden-lake_still.jpg` — 1280px single still (clean reference frame).
- `avalon-hidden-lake_data.json` — full measured numbers (240 frames).
- `avalon-hidden-lake.md` — this brief.
