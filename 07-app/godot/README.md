# GuitarApp World — Godot scaffold (AMENDMENT-09)

**Engine:** Godot 4.7.x (MIT, `godotengine/godot`). One-click export to iOS + Android + Web.
**Purpose:** the game-like **story-world shell** for the whole app. The student *enters* the
world; lessons trigger as scenes. The teacher is **one character**, not the product. World art
direction is per-lesson (`style_anchor`), not a global rule.

## Layout
```
godot/
  project.godot            # Godot 4 project config (main_scene = World.tscn)
  world/
    World.gd / World.tscn  # story-world root; reads lesson_manifest.json; enter_lesson(id)
  lesson/
    LessonScene.gd/.tscn   # a lesson as a scene: plays Wan2.1 clip + Chatterbox voice
    FingeringOverlay.gd/.tscn # draws fingering from verified data OR AI-drawn art (AMENDMENT-10 lifted the old ban)
  data/
    lesson_manifest.json   # data-driven lessons (schema-first, matches app discipline)
```

## Pipeline wired (per AMENDMENT-09)
```
Flux-schnell (Apache-2.0, cloud)  -> painted scene still
Wan2.1-I2V (Apache-2.0, cloud)    -> cinematic motion  -> video_asset (.mp4)
Chatterbox (MIT)                  -> voice_asset (.ogg)  (synced to clip)
Godot (MIT)                       -> wraps it into the walkable world; lessons = scenes
chord-theory-check.js             -> fingering[] (overlay only renders verified data)
```

## License gate (enforced in 07-app/core/asset-job.js, not here)
- Video models allowed: `wan2.1-i2v` only (SVD=LICENSE:other blocked; LTX/Hunyuan/CogVideoX=other unverified).
- Image: `flux.1-schnell` / `qwen-image`. Voice: `chatterbox`. Blocked vendor: `midjourney`.

## How to run (local, for the owner to open)
1. Install Godot 4.7.x (MIT) — https://godotengine.org (free, no subscription).
2. Open this `godot/` folder as a project.
3. F5 / Play → World loads `lesson_manifest.json`, shows lesson "doors", enters a lesson scene.
   (Asset .mp4/.ogg are placeholders until the cloud worker generates them.)

## Next steps (not yet built)
- Wire `World.enter_lesson` to actual UI buttons / Supabase curriculum.
- Replace placeholder art with Flux stills + Wan2.1 motion from the cloud-gpu-worker.
- Sync Chatterbox voice to the clip timeline.
