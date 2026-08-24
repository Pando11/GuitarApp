# HANDOFF — Grill #4 The Teacher (Emerald Hollow) — 2026-08-23

## Where we are

Grill #4 (The Teacher) is at the start of the build phase. All four owner decisions are locked, spec + ADR + tickets are written, and T-B1 (first scene proof) is ready to start.

## What's decided (do NOT re-ask — these are locked)

- **World 1 = Emerald Hollow** — the enchanted medieval Celtic village from the YouTube reference ("The Heart of an Enchanted Medieval Village | Emerald Hollow" — https://youtu.be/X3Q9-xj_XwM). Cozy fantasy tavern-in-the-woods. NOT photo-real for v1 — high-end animated (Godot 4.x).
- **First teacher = one chill instructor** — warm + encouraging (Grill #3 rule), one Chatterbox built-in voice (MIT, no cloning from a real person), high-quality animated look matching the world.
- **Performance ladder:** Level 1 (after lesson 6) → Level 2 (after lesson 13) → Level 3/capstone (lesson 25, bar with full band: bass + drums + teacher on 2nd guitar).
- **Duet:** Path B ships in v1 (pre-built smart accompaniment — loops/waits/simplifies). Path A (live adaptive) is a roadmap item (T-C1), NOT blocking v1.
- **T-A1 = B** (AI-generated stills + motion — FLUX→Wan→Chatterbox→Godot). **T-A2 = lesson 6 / lesson 13.** **T-A3 = A** (full 10-song catalog). **T-A4 = pre-built per song** (Path B, v1 — so Level 3 needs 10 accompaniment tracks).

## Files on disk (all in Desktop/GuitarApp/)

| File | Purpose |
|------|---------|
| `02-spec/guitar-app-spec-AMENDMENT-17.md` | The spec — what World 1 + first teacher ARE. 311 lines. |
| `.scratch/teacher/tickets.md` | Build tickets. Owner decisions now FILLED in. T-B1 starting. 576 lines. |
| `docs/adr/0004-the-teacher-world-1-emerald-hollow.md` | The ADR — hard-to-reverse decisions. |
| `brand-references/emerald-hollow/world-emerald-hollow.md` | Pixel-to-palette analysis — measured colors from 5 video slices. **The palette lock for any generated asset.** |
| `brand-references/emerald-hollow/video-01-montage.jpg` + `video-02-montage.jpg` | Two key frames from the reference video (proof of what the world looks like). |
| `CONTEXT.md` (updated) | New glossary: Teacher (world-locked), Performance ladder, Path B duet, Path A duet, Emerald Hollow, World factory. |

## Current state of each ticket

- **T-A1 through T-A4:** RESOLVED, recorded in tickets.md §Owner sign-off. All four picked up.
- **T-B1 (Emerald Hollow scene — first Godot world proof):** READY TO START. Depends on T-A1 (=B, FLUX/Wan pipeline) + T-A2 (lesson 6 gate). The scene is the tavern porch — eye-level, teacher framed center/right, porch railing + flower boxes, wooden barrels, moss-covered sod roof with multiple gables + stone chimney, half-timbered cottage walls, cobblestone ground, hanging wicker baskets, misty greens + tall evergreens behind, volumetric fog, overcast soft light, early-morning damp.
- **T-B2 (first teacher character — look + rig):** Blocked on T-A1 (=B) + T-B1. FLUX prompt needed: teacher on porch, holding guitar, chill posture, palette lock attached.
- **T-B3 through T-B8:** Defined, blocked on earlier tickets per the ticket file.
- **T-C1 (Path A roadmap):** Visible, never closed until the three prerequisites are met (student memory live + encrypted cross-device; listening engine reliable; adaptive prototype exists).

## Palette lock (DO NOT violate — it's measured, not guessed)

From `brand-references/emerald-hollow/world-emerald-hollow.md`:
- **Brightness:** 75–120/255 (dark-to-moody). Never bright.
- **Saturation:** 0.14–0.33 (muted-to-moderate). Never vibrant.
- **Dominant colors:** near-black shadow #202020, mid-dark stone #404040, forest greens #204020/#406040, muted olive-tan #404020/#606040. Light grey fog #c0c0c0.
- **Production palette (for FLUX prompts):** Deep Forest Green #2E8B57, Weathered Wood Brown #4B3621, Mossy Lime #C5E1A5, Slate/Cobblestone Grey #708090, Misty Blue-Grey #B0C4DE, Near-Black Shadow #202020, Stone Chimney Warm #8B7355.
- Rule: warm accents (firelight, lantern, wood warmth) are the contrast — NOT saturated color.

## Next step (pick up here)

**T-B1: Build the first Emerald Hollow Godot scene (tavern porch).**

Since T-A1 = B (FLUX→Wan pipeline), two things need to happen in parallel:
1. **Draft the FLUX prompt** for the first teacher-on-porch still. Attach the palette lock. Prompt must stay in the commercial-clean stack (FLUX.1[schnell] Apache-2.0 only; AMENDMENT-07; Midjourney excluded per AMENDMENT-08).
2. **Set up the Godot scene structure** — the porch scene files to be placed in `07-app/godot/` (or a subfolder) **once that tree exists on this machine** (the full `07-app/` tree did not survive the PC transfer — see PC transfer note below). Owner opens in Godot 4.7.x (engine NOT installed on this machine).

**CRITICAL install-state check before claiming FLUX is available:** The AGENTS.md install-state gotcha — never claim a model is installed without checking disk. **On this machine, `~/re/flux` does NOT exist** (verified — the `re/` home directory is absent). The FLUX→Wan pipeline is per T-A1=B (owner decision, 2026-08-23) but requires a rented cloud GPU (~$0.50 per 20-lesson set) because FLUX/Wan are not installed locally. Verify any future install with `ls -d ~/re/flux` and `test -d assets` before generating.

- AMENDMENT-09: Wan2.1-I2V motion + Godot story-world. **The Godot scaffold (`07-app/godot/` per AMENDMENT-09) is NOT present on this machine** — the full `07-app/` tree did not survive the PC transfer. Owner opens in Godot 4.7.x when the scaffold is available.

## What NOT to do

- Do NOT claim the FLUX pipeline has been run / assets exist without verifying on disk.
- Do NOT re-ask any of the four owner decisions (T-A1 through T-A4) — they're locked.
- Do NOT generate a hand/finger for the teacher with FLUX (AGENTS.md Rule 7 + memory: FLUX/Qwen are fine for backgrounds/atmosphere, NEVER for a figure that could render a hand). The teacher character still needs a hand-safe approach — for the first proof, the character can be shown without hands visible, or hands handled separately (the 2D fretboard diagram is the precision reference for fingerings per AMENDMENT-06; `chord-theory-check.js` data drives any demonstrated hand, not free-generation).
- Do NOT start T-B4 (Path B duet) until T-B1 + T-B2 + T-B3 are further along — T-B4 depends on them.

## Relevant hard rules (from AGENTS.md — always live)

- Rule 5: teacher copy cites stored mastery/confidence numbers only — never freelances a musical opinion.
- Rule 9: voice license blocklist = copyright law. Chatterbox (MIT) = shipping voice. ElevenLabs blocked for paid app. Never re-propose.
- Rule 2: no camera, no hand tracking.
- AMENDMENT-06: realistic/photoreal avatars + Chatterbox IN SCOPE. Avatars MAY demonstrate fingerings — driven from chord-theory-check.js data, not free-generated. (For the first proof, fingering demos may be out of scope — T-B2 says so.)
- AMENDMENT-07: FLUX.1[schnell] only for image gen. Midjourney excluded (AMENDMENT-08).
- AMENDMENT-09: Wan2.1-I2V motion + Godot story-world. **Godot scaffold (`07-app/godot/` per AMENDMENT-09) NOT present on this machine** — full `07-app/` tree did not survive PC transfer; owner opens in Godot 4.7.x when available.
- AMENDMENT-11: world-locked teacher + longitudinal student memory + teacher-student duet thesis.
- AMENDMENT-15: 25-lesson curriculum order is gated. Level 1/2 gates must map against AMENDMENT-15 order. Capstone = L25, last.
- AMENDMENT-12/14: song-progression track legal position. Level 3 song pick: House of the Rising Sun = public domain (no disclaimer); 9 others = "not affiliated / not endorsed" disclaimer on select card + reveal.
- AMENDMENT-16: PocketBase backend (MIT, self-hosted).

## Dependencies to track

- **ADR-0001** (always-on encrypted cross-device sync) — T-B7 (performance progress → student memory) is local-first until ADR-0001 is built. Don't block the ladder flow (T-B6) on ADR-0001.
- **Student memory (Grill #1)** and **practice delivery (Grill #2)** and **mystery mode (Grill #3)** are done — T-B3 (teacher voice) and T-B7 (progress save) can build against the existing patterns.

## Rollback / resume cue

To resume: open T-B1, draft the FLUX prompt for the first porch scene still (with palette lock attached), verify FLUX install state on disk, and set up the Godot scene structure. Then move to T-B2 (FLUX prompt for the teacher character), then T-B3 (voice + dialogue system). The tickets file has the full build order and dependencies.

## PC transfer note

The full `02-spec/` tree (AMENDMENT-01 through AMENDMENT-16) did NOT survive the PC transfer — only the 7 root files are on this machine. AMENDMENT-17 is being created fresh here. If the full repo is restored later, confirm AMENDMENT-17 is consistent with the restored amendments.
