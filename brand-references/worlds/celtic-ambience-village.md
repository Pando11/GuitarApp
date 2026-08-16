# World Brief 2 — "Celtic Ambience Village" (green/mossy, ruins)

**Source URL:** https://youtu.be/idGNrUzRues
("Medieval Village with This Celtic Ambience | Medieval Celtic Music for Deep Focus & Calm", 11,144 s — ambient music, no speech, no UI)
**Captured:** 2026-08-15 via yt-see skill (montage + analyze + vision).
**Artifacts:** `celtic-ambience-village_montage.jpg`, `celtic-ambience-village_data.json`.

## Exact measurements (first 90s, 270 frames @ 3fps, 640×360)
- **Overall average color:** RGB (67, 82, 75) — muted **green-grey**, green leads a bit more than world 1.
- **Average brightness:** 77.3 / 255 — **mid-toned, slightly darker** than Elderwick (more overcast/misty).
- **Palette %:** green 100.0%, grey 62.2%, blue 0.0%, warm 0.0%, dark 0.0%, bright 0.0%.
- **Warm-glow pixels:** 0.27% — negligible in this window (exterior daylight/mist).
- **Shot cuts:** **none detected** in 90s → effectively **1 continuous slow shot** (a single unbroken dolly through the environment). Strongest "walking-sim" feel of the two.

## Scene inventory (from vision, per the 12-frame montage)
- **Architecture progression (exterior → interior):**
  1. Rustic cottage/inn entrance, steep mossy roof, warm-lit doorway (dappled sun).
  2. Half-timbered houses + winding dirt path into forest.
  3. Tudor village cluster, steep dark roofs (sunny patches).
  4. Large Tudor buildings + a tower (overcast).
  5. Tudor row, slate roofs + chimneys, misty background.
  6. **Stone castle / fortified manor**, ivy-covered walls, round tower (grand, ancient).
  7. **Single-arched stone bridge**, moss + ivy, water underneath.
  8. **Multi-arched stone bridge / viaduct**, mossy, timeless.
  9. **Street market stalls with RED cloth**, timber building; two figures (yellow/white tunic; brown near stall).
  10. Street corner: stone spire building (church/guild hall) + timber house; two cloaked figures.
  11. **Underground ruins / crypt** — stone arches + pillars around a water channel, dim/mysterious.
  12. Underground ruins — arches + pillars around a still pool, echoing.
- **Flora:** dense forest, moss on every roof/stone, ivy on walls/bridges.
- **Inhabitants:** cloaked/hooded figures in frame 9–10 (market + corner); none in the ruins.
- **Atmosphere:** secluded, serene, ancient; overcast/misty throughout; the underground scenes are dim and mysterious.
- **Camera:** static high-quality establishing shots implying a **slow continuous dolly forward** (no cuts in 90s) — from village → bridge → market → underground.

## Mood summary
A quieter, more mysterious cousin of Elderwick: same green/mossy Tudor world, but it **walks the student from a cozy cottage down to a stone bridge, through a market, and into underground ruins**. More "journey" than "market square." The underground-ruins ending is a distinctive beat — a possible "secret lesson spot."

## Palette lock (for FLUX/Godot)
- Same cool green/grey/stone base as Elderwick; this one runs **darker + more overcast** (lum 77 vs 81).
- Warm accent reserved for the cottage doorway glow + any lantern; used very sparingly.
- Lighting: overcast + ground mist as the default; the underground scenes need cool dim stone + faint reflected water light.

## Pipeline hand-off
FLUX paints the cottage → castle → bridges → market → underground-ruins sequence. Teacher placed at the bridge or in the underground ruin (intimate, echoing "secret lesson" beat). Wan2.1 must hold the **single unbroken slow dolly** (the data shows 0 cuts in 90s — this world is defined by continuous motion, not montage cuts). Chatterbox = voice; Celtic ambient = BGM. Godot = linear path shell (cottage → ruins) with the lesson scene at the bridge/ruin. License: FLUX.1[schnell] only — no Midjourney.
