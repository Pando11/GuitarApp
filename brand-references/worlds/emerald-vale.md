# World Brief — Emerald Vale / Enchanted Forest Trail

**Source URL:** https://youtu.be/PBrscpvKuQg
**Title / Uploader:** "Enchanted Forest Trail | Misty Woodland Ambience & Relaxing Medieval Fantasy Music | Medieval Legends"
**Full duration:** 13310 s (3h41m).
**Captured:** 2026-08-15 via `yt-see` skill + a local fallback capture (see note).

> ⚠️ **IMPORTANT — this is NOT a single walkable world.** Unlike Avalon's Hidden Lake (one static image) or the village worlds (one continuous scene), this video is a **fast slideshow of ~165 distinct scenes** in 180s (~1.1s each). The montage shows 16 totally different shots: lakeside village at dusk, stone village street, misty forest shrine path, snowy ritual stone circle, mountain castle ruins, magical library interior, lakeside sunset cottage, cliffside arch ruins, village by the lake, tavern interior, enchanted forest at night with glowing orbs, thatched village, Roman-style bathhouse, tavern table, tavern fireplace, village canal bridge. Treat it as a **mood/style palette library**, not one coherent place to drop a teacher into.

---

## Measured data (exact, from pixels — `emerald-vale_data.json`)

- **Source res / sampled window:** 640×360, sampled 180 s @ 2 fps (360 frames).
- **Overall avg RGB:** [90, 84, 78] — a soft, slightly warm neutral. Brighter than Avalon's [76,72,58].
- **Overall avg luminance:** 85.7 / 255 — bright, airy, daylight-forward.
- **Palette buckets (share of frames):** grey **47.2%**, blue **24.2%**, green **14.2%**, warm 1.1%, dark 0.3%, bright 0.0%.
  → Heavy on atmospheric grey + sky-blue + foliage-green. Lots of misty depth and open sky.
- **Warm-glow pixels:** **7.07%** — far higher than Avalon (1.06%). Driven by lanterns, candlelit interiors, sunset glow, firelight, glowing orbs.
- **Shot changes:** **164 cuts → 165 shots in 180s** (~1.1s/scene). Confirms slideshow, not motion footage.
- **Motion:** near-zero per-scene (each shot holds ~1s then hard-cuts). No camera dolly/pan to learn — only the cross-fades between stills.

---

## Scene inventory (vision — montage of 16 + still at t=50)

**Color mood (overall):** airy daylight with atmospheric haze; emerald/lime foliage; pale blue-grey mist; warm white/gold sun on lit faces; cool slate-blue shadows. Stone = weathered slate grey with lichen white/yellow.

**Scene types observed (the recurring "beats" of this world-set):**
1. **Lakeside village (dusk)** — calm water, low mist, stone arch bridge, wooden stilt houses, warm interior lights, dark blue sky.
2. **Stone village street** — cobblestone path, medieval stone buildings, clear stream alongside, overcast diffuse light.
3. **Misty forest path** — heavy fog, stone lanterns, small shrine/grave marker, paved steps, lantern-lit.
4. **Snowy ritual site** — coniferous snow trees, standing stone monoliths, carved ritual circle with candles.
5. **Mountain castle ruins** — jagged peak, ruins on top, valley mist, sunbeams through clouds.
6. **Magical library interior** — tall shelves, globe, arched windows, cool dim light, floating dust/sparkles.
7. **Lakeside sunset cottage** — wooden stilt cottage, dock/pier, lake reflecting warm orange sunset, mist off water.
8. **Cliffside arch ruins** — large stone archway, bright daylight, low bushes.
9. **Village by the lake** — shoreline, village houses, church spire, calm lake.
10. **Tavern interior** — long tables, fireplace, candles, warm firelight.
11. **Enchanted forest at night** — tall thin trees, mist, glowing orbs/fireflies, dirt path, stone archway.
12. **Thatched village by lake** — thatched roofs, wooden bridge, lake.
13. **Roman-style bathhouse** — stone columns, indoor pool, steam/mist, soft warm light.
14. **Tavern table close-up** — tall candles, statue/armor, wooden table.
15. **Tavern fireplace** — stone hearth, wooden beams, barrels, warm firelight.
16. **Village canal bridge** — wooden houses, wooden bridge over canal/lake, daylight.

**Structures:** medieval stone buildings, thatched cottages, stilt/wooden lakeside houses, stone arch bridges + bridges, castle/cliff ruins, Gothic ruined abbeys (pointed arches, tall narrow windows, ivy-covered), standing stones / ritual circles, taverns, libraries, bathhouses.

**Nature:** mixed broadleaf + coniferous forest, mossy grass, wildflowers, mist/fog (low-lying + valley atmospheric perspective), lakes/rivers/streams/canals, mountains with snow hints, dirt/cobblestone paths.

**Figures / animals:** none visible in any sampled frame — environment-only.

**Lighting / time-of-day:** spans full range — golden-hour/dusk, overcast daylight, dim lantern-lit, snow daylight, bright mountain sun, cool magical interior, sunset, night with glowing orbs, warm firelight. The mix is the point: cozy-interior-warm vs cool-exterior-mist contrast.

**Emotional tone:** serene, mystical, storybook-medieval. Solitude + wonder; melancholic majesty at the ruins; cozy safety at the tavern/hearth. "Safe hidden sanctuary" feel consistent with the other GuitarApp worlds.

---

## Pipeline hand-off (FLUX → Wan2.1 → Chatterbox → Godot — when installed)

**Palette lock (measured + vision):**
- Base neutral [90,84,78], luminance ~86 (bright/airy).
- Accents: emerald/lime foliage, pale blue-grey mist + sky, slate-grey weathered stone + lichen, warm gold/amber from lanterns/candles/firelight/sunset (~7% warm pixels — lean into cozy-interior warmth).
- Keep atmospheric haze for depth; contrast cool exteriors with warm lit windows/hengles.

**FLUX.1[schnell]** (Apache-2.0, legal — RED LINE, no Midjourney):
- Use as a **style + element library**, not one location. Best candidate single "world" to actually build: the **misty forest path (beat 3)** or **lakeside sunset cottage (beat 7)** — both are coherent, atmospheric, and teacher-friendly (a clear path/dock to stand on, soft mist, no clutter).
- Lock recurring elements: stone arch bridge, ivy Gothic ruins, thatched cottages, standing stones, lanterns, mist.

**Wan2.1-I2V-14B** (Apache-2.0):
- Source has NO real camera motion (hard-cut slideshow). Do NOT copy whip cuts. If you build the misty-forest or lakeside world, add only gentle ambient life (drifting mist, leaf sway, water shimmer, firefly drift) — slow, loopable.

**Chatterbox** (MIT, shipping voice) / **Kokoro-82M** (Apache-2.0, CPU fallback):
- Teacher voice. Ambient medieval-fantasy music = world BGM.

**Godot 4.x** (MIT):
- Per the ruins still: `DirectionalLight3D` upper-right (warm white/gold), cool blue-grey `AmbientLight` for shadows, low-density `FogVolume` (pale blue-grey, 0.01–0.02) for valley haze, tri-planar terrain blending rock + moss by slope, modular ruined-stone meshes (roughness 0.8–0.9) with ivy blend, `MultiMeshInstance3D` grass/rocks, `GPUParticles3D` distant trees. Camera low-angle ~70–80 FOV looking slightly up at ruins for scale.

---

## Artifacts in this folder
- `emerald-vale_montage.jpg` — 16-frame grid (distinct scenes — confirms slideshow).
- `emerald-vale_still_10.jpg` / `_50.jpg` / `_110.jpg` — clean 1280px reference frames.
- `emerald-vale_data.json` — full measured numbers (360 frames, 165 shots).
- `emerald-vale.md` — this brief.
- `capture_local.py` — local-file fallback capture (used because yt-dlp's default client 403'd; see note).

## Capture note (why a fallback script exists)
yt-dlp's default client chain (`web,tv,android_vr`) hit **HTTP 403** on this video this session — YouTube has the SABR-only streaming experiment on and this host has no JS runtime, so the `android_vr`/`web` clients are blocked. The **`ios,android`** client chain works. I downloaded a 3-min 480p slice with that client, then ran a self-contained `capture_local.py` (montage + measured analysis) on the local file. Reusable if other worlds 403. The shared `yt_see.py`/`yt_analyze.py` scripts themselves are fine — only the client selection needs overriding.
