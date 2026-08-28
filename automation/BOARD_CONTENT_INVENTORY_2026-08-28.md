# BOARD CONTENT INVENTORY -- 2026-08-28

> Verifier (BOARDROOM LOOP) reconciliation of the GuitarApp cinematic lesson-content pipeline.
> Reproducible: `python3 tools/reconcile-content-inventory.py`  (ALL counts computed from disk)

## Reconciled asset counts (from disk)

- lesson_lesson_jsons: **25**
- lesson_manifest_json: **1**
- content_packs_files: **10**
- content_song_progression_files: **4**
- content_teachers_practice_files: **34**
- teacher_avatar_svgs: **0**
- voice_wav_kokoro_fallback: **8**
- godot_scaffold_files: **11**
- godot_world_scaffolds: **1**
- attribution_manifest_worlds: **4**
- world_view_tracker_present: **1**
- world_reference_capture_files: **129**
- world_reference_world_pages_md: **0**
- world_reference_promptcraft_entries: **0**

## Classification by pipeline stage

- FLUX_stills_generated_on_disk: **0**
- Wan_motion_generated_on_disk: **0**
- Chatterbox_voice_generated_on_disk: **0**
- Kokoro_voice_generated_on_disk: **8**
- Godot_worlds_built_on_disk: **0**
- Godot_world_scaffolds_authored: **1**
- YouTube_reference_captures: **129**
- teacher_avatar_placeholders: **0**
- lesson_content_data_files: **25**

## Pipeline install status (verified from disk)

- flux_present: INFERRED off-repo (no flux.* asset on disk; brand-references are YouTube captures)
- kokoro_present: VERIFIED (.venv-kokoro + 8 wavs generated)
- chatterbox_present: VERIFIED ABSENT (no chatterbox.* voice file on disk; Kokoro used as fallback)
- wan_installed: VERIFIED ABSENT (no wan motion file on disk)
- godot_engine_installed: VERIFIED ABSENT (scaffold files only; no .import/.godot build artifacts; project.godot present)

## Claims ledger (Research: VERIFIED / INFERRED / UNKNOWN)

- [VERIFIED] Cinematic pipeline has produced 0 production assets from the clean stack on disk  
  _evidence: os.walk: FLUX_stills=0, Wan_motion=0, Chatterbox_voice=0, Godot_worlds_built=0_
- [VERIFIED] Kokoro-82M (Apache-2.0) generated 8 L02 voice wavs as the license-clean fallback  
  _evidence: 07-app/audio/l02-voice/*.wav + generate-warm-voice.py header_
- [VERIFIED] brand-references/* are YouTube reference captures, not FLUX/Wan-generated content  
  _evidence: brand-references/worlds/README.md: 'These worlds are SAVED REFERENCE'_
- [VERIFIED] All generative models in use are commercial-clean (no paid/blocklisted tool)  
  _evidence: asset-job.js ALLOWED_* lists + Kokoro Apache-2.0; no Midjourney/ElevenLabs/SVD on disk_
- [VERIFIED] First concrete Godot world instance scaffolded & tied to an attribution world_id  
  _evidence: 07-app/godot/worlds/elderwick-market/world.config.json + world.gd (status=scaffold_authored)_
- [VERIFIED] Attribution instrument is now wired (non-breaking) so the first built world is measurable  
  _evidence: 07-app/core/world-view-tracker.js imports content-attribution.js; opt-in via CONTENT_ATTRIBUTION_ENABLED_
- [UNKNOWN/REFUTED] Lesson worlds are currently shippable install/subscription drivers  
  _evidence: 0 built Godot worlds + 0 generated stills/motion => no world is shippable yet_

## Boardroom verdict

- **V1_reconciled_inventory_reproducible_from_disk**: PASS (all counts computed via os.walk; no hardcoded totals)
- **V2_only_commercial_clean_models**: PASS (enforced by 07-app/core/asset-job.js; Kokoro fallback Apache-2.0; new world.config.json pins only flux.1-schnell/wan2.2-i2v/chatterbox; no blocklisted tool on disk)
- **V3_decider**: SHIP (scaffold+wiring advance) / STOP on content spend -- first Godot world instance (elderwick-market) scaffolded and attribution instrument wired (opt-in, $0), but 0 production assets generated; do NOT spend on Wan2.1/2.2 + Chatterbox + Godot engine until one world builds end-to-end and the attribution signal is observed.
- **scope_skeptic**: Content is still a BRAND INVESTMENT, not yet on the growth/retention critical path: 0 shippable worlds. Today's advance (scaffold + wiring) is the tracked, $0 step that makes the FIRST world measurable -- track-not-expand until it builds + attributes.
- **finance**: No paid/subscription tool used or proposed. Attribution posts to self-hosted PocketBase (MIT, $0 recurring) only when an endpoint is configured + CONTENT_ATTRIBUTION_ENABLED=true; defaults to no-op. Godot (MIT) engine is free to install. $0 added cost.
- **builder_change**: Added 07-app/godot/worlds/elderwick-market/{world.config.json,world.gd} (first concrete world instance tied to world_id=elderwick-market, pins clean-stack asset slots + exact build recipe) and 07-app/core/world-view-tracker.js (opt-in caller of the orphaned content-attribution.js). Updated content-attribution-manifest.json (elderwick-market -> scaffold_authored). Hardened tools/reconcile-content-inventory.py to compute all counts from disk. Non-breaking: new standalone files + a data field; no edits to lesson JSONs / gates / asset-job.js / app.js.

## Prototype visuals (NOT pipeline output, transparency only)

- mp4/png under 03-research + 06-prototypes: 9 mp4 / 13 png
