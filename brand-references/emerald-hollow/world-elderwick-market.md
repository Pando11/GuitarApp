# World Brief: "Elderwick Market" — Green/Mossy Village variant (Emerald Hollow)

**Type:** Reference world brief for GuitarApp cinematic lessons.
**Captured:** 2026-08-15 by Hermes (yt-see skill — sampled frames, then vision-described).
**Source videos Heidi pointed at (reference only, NOT a marketplace UI):**
- V1: https://youtu.be/FYmRkScwJ8M — "Elderwick Market: A Medieval Village in the Emerald Woods | Medieval Celtic Music for Study & Focus" (11,097 s)
- V2: https://youtu.be/idGNrUzRues — "Medieval Village with This Celtic Ambience | Medieval Celtic Music for Deep Focus & Calm" (11,144 s)

**Captured montages (saved alongside this file):**
- `video1-elderwick-market-montage.jpg` — 12 frames, first 60 s of V1
- `video2-celtic-ambience-montage.jpg` — 12 frames, first 60 s of V2
- `video1-elderwick-market-full.jpg` — 24 frames across the full 409 s of V1 (proves no UI appears later)

> Both videos are AI-generated fantasy artwork set to **ambient Celtic study music** (no speech, no interface, no marketplace UI). They are REFERENCE for the *visual world mood* the student walks into inside GuitarApp. Heidi's framing: "the student goes into a world, and someone is playing guitar and teaches the lesson." These clips are an example of the kind of world to build.

## What the world looks like (observed from the frames)
- **Setting:** a lush, moss-covered medieval/Tudor village in a green forest ("Emerald Woods"). Steep thatched roofs heavy with green moss, wooden beams, stone foundations. A clock tower in the background.
- **Populated, not empty:** cloaked figures walk cobblestone streets; there are **market stalls / carts** (a "market"). This is a *living village*, distinct from the lone-cottage mood of the winter thumbnails.
- **Water:** a stone bridge arches over a stream/ravine, overgrown with moss and vines; another underground/ruin scene with stone pillars + water channels.
- **Sky/light:** pastel pink + pale-yellow skies (golden-hour feel) in the brighter shots; cooler misty/overcast in others. Soft volumetric fog rolling down paths.
- **Depth/atmosphere:** dense trees, fog, strong sense of a hidden valley.

## Mood / feeling
Cozy-mystical, calm, "a peaceful world untouched by time." The student walks in; the teacher is somewhere in the village (on a bridge, in a market corner, by a hearth) playing guitar and teaching.

## Palette lock (consistent with the existing `emerald-hollow` kit)
- **Cool base (~70–80%):** moss green, emerald, deep teal, stone grey, desaturated grey.
- **Warm accent (~20%):** amber / golden window + lantern glow, always opposite the cold.
- **Lighting:** soft diffuse / volumetric fog, cinematic rim-light on tree edges, bloom around windows. No hard sun. Golden-hour OR pastel-sky both acceptable.

## Relationship to the existing winter kit
The existing `brand-references/emerald-hollow/` kit (README.md + prompts.txt) analyzed the **SNOW / WINTER** thumbnails (snowy cottages, frozen forest). These two videos are the **GREEN / MOSSY SUMMER village** variant — same palette family, but lush greenery, pastel skies, a *populated market village* with cloaked figures and stone bridges. So the Emerald Hollow brand gives GuitarApp **two mood options**:
- **(a) Winter cottage** — cozy hearth, snow, single dwelling (existing kit + prompts.txt G1–G4 guitar variants).
- **(b) Elderwick Market green village** — populated, mossy, market stalls, bridges (this brief).

For a "world the student walks into," (b) reads more like a place; (a) reads more like a safe nook. Either can host the teacher.

## How to feed this into the pipeline (once FLUX / Wan2.1 / Chatterbox / Godot are installed)
- **FLUX.1[schnell]** (Apache-2.0) paints the mossy Tudor village still + a teacher figure with an acoustic guitar (on the stone bridge / in a market corner). Recreate the palette lock above.
- **Wan2.1-I2V-14B** (Apache-2.0) turns the still into slow cinematic motion — the source clips use a *slow, steady dolly/pan* (consecutive frames near-identical), so match that gentle camera move, not a whip-pan.
- **Chatterbox** (MIT, shipping voice) / **Kokoro-82M** (Apache-2.0, CPU fallback) — the teacher's voice. The ambient Celtic music can be the world BGM bed.
- **Godot 4.x** (MIT) — the village shell the student walks into; the lesson triggers as a scene when the student reaches the teacher.
- **License redline:** generation MUST use the commercial-clean stack above. The reference's Midjourney-flavored `prompts.txt` is for *style-matching only* — **do NOT generate with Midjourney** (AMENDMENT-07 / AMENDMENT-08: Midjourney excluded). FLUX.1[schnell] is the only legal image gen.

## Status
Asset pipeline NOT yet installed as of 2026-08-15: FLUX present (`~/re/flux`); Kokoro+whisper in `.venv-kokoro`; **Chatterbox NOT on disk**; **Wan2.1 NOT on disk**; Godot scaffolded (`07-app/godot/`) but engine not installed. This brief + the three montages are SAVED REFERENCE to feed the pipeline the moment it is ready. Re-run `yt-see` on the two URLs if fresher frames are needed.
