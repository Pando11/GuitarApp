# T-B1 deliverable — FLUX prompt draft for Emerald Hollow porch scene (first proof still)

**Ticket:** T-B1 (Emerald Hollow scene — first Godot world proof)
**Date:** 2026-08-23
**Status:** prompt drafted — pending FLUX execution + Godot scene setup

---

## Scene being prompted

Emerald Hollow tavern porch — the first proof still for World 1. Eye-level, teacher framed center or center-right.

**What must be visible (from the spec + brand-references analysis):**
- Tavern porch, eye-level view
- Porch railing + flower boxes overflowing with greenery (behind the teacher)
- Wooden barrels to one side (tavern = serves ale/mead)
- Moss-covered sod roof (multiple gables, stone chimney) visible behind/above the porch
- Half-timbered cottage walls (dark wooden beams + weathered plaster)
- Cobblestone ground (irregular grey stones, old and worn)
- Hanging wicker baskets from eaves/beams
- Background: misty greens, tall evergreen trees, volumetric fog
- Mood: overcast soft light, no harsh shadows, early-morning damp
- NO teacher hands visible in this first still (hand-safe rule — see notes below)

**Teacher presence in this still:** The teacher should be present in the scene (world-locked = always there), framed center or center-right on the porch. For the FIRST proof still, the teacher is present but we keep it hand-safe — the character is visible (posture, clothing, guitar) without requiring rendered hands/fingers. The fretboard diagram is the precision reference for fingerings (AMENDMENT-06); any demonstrated hand later comes from chord-theory-check.js data, not free-generation.

---

## Palette lock (measured from 5 video slices, 24fps, 640×360 — DO NOT violate)

From `brand-references/emerald-hollow/world-emerald-hollow.md`:

- **Brightness:** 75–120/255 (dark-to-moody). Never bright.
- **Saturation:** 0.14–0.33 (muted-to-moderate). Never vibrant.
- **Dominant colors:**
  - Near-black shadow #202020 (deep wood, darkest recesses, ~20-24% of frame)
  - Mid-dark stone #404040 (muted wood, shadow edge, ~12-15%)
  - Deep forest green #204020 (moss shadow, dark foliage, 3-9%)
  - Mid forest green #406040 (moss mid-tone, foliage, 3-7%)
  - Olive-drab / weathered wood #404020 (3-5%)
  - Deep teal-green #204040 (ivy shadow, wet foliage, 2-7%)
  - Olive-tan / warm wood #606040 (2-5%)
  - Light olive / weathered plaster #808060 (2-4%)
  - Light green / sunlit foliage #608060 (2-5%)
  - Light grey / fog highlight #c0c0c0 (~2%)
- **Production palette (named colors for FLUX prompt):**
  - Deep Forest Green #2E8B57 — primary foliage/moss base
  - Weathered Wood Brown #4B3621 — beams, barrels, structures
  - Mossy Lime #C5E1A5 — sunlit moss, hanging basket flowers
  - Slate / Cobblestone Grey #708090 — street stones, stone foundations
  - Misty Blue-Grey #B0C4DE — background fog, distant hills
  - Near-Black Shadow #202020 — deep recesses, chimney interior, wood shadow
  - Stone Chimney Warm #8B7355 — chimney stack, warm stone
- **Rule:** warm accents (firelight, lantern, wood warmth) are the contrast — NOT saturated color. A vibrant/neon world breaks the reference.

---

## FLUX prompt (draft — FLUX.1[schnell], Apache-2.0, AMENDMENT-07 compliant)

**Model:** FLUX.1[schnell] (Apache-2.0). NOT FLUX.1 dev / Krea (non-commercial weights, Rule 9 / AMENDMENT-07). NOT Midjourney (AMENDMENT-08).

**Prompt:**

> A cozy fantasy medieval tavern porch in an enchanted forest village, eye-level view, a chill guitar teacher standing on the wooden porch framed center-right holding an acoustic guitar, warm and relaxed posture, wearing comfortable earth-toned clothes, wooden porch railing with overflowing flower boxes and greenery behind, stacked wooden barrels to one side, a steeply pitched moss-covered sod roof with multiple gables and a stone chimney rising behind the cottage, half-timbered Tudor walls with dark wooden beams over weathered plaster, irregular grey cobblestone ground, wicker hanging baskets from the eaves, misty green forest and tall evergreen trees in the background through soft volumetric fog, overcast soft diffuse light, no harsh shadows, early-morning damp atmosphere, muted earthy color palette: deep forest greens, weathered wood browns, mossy lime accents, slate grey cobblestones, misty blue-grey fog, near-black shadows, warm stone chimney — dark-to-moody lighting, muted-to-moderate saturation, cozy mysterious tranquil mood, Ghibli-meets-Breath-of-the-Wild texture quality, cinematic composition, no hands visible on the guitar, hands not shown

**Negative prompt (if FLUX.1[schnell] supports it — otherwise omit):**

> bright saturated colors, neon, vibrant, harsh shadows, sunny, dry, cartoon, anime, 3d render look, plastic, glossy, bright white, hands, fingers, manicured, colorful, vivid

---

## Notes for the next session

1. **Verify FLUX install state BEFORE running the prompt.** Per AGENTS.md install-state gotcha: `ls -d ~/re/flux` (should exist) + `test -d assets` (its ABSENCE means the pipeline was NEVER executed even if a model dir exists). As of 2026-08-21: FLUX present at `~/re/flux` but UNEXECUTED (no `assets/`). If FLUX is not actually executable on this machine, the pipeline needs a rented cloud GPU (~$0.50 per 20-lesson set, one-time — NOT a subscription). Do NOT claim assets exist without checking.

2. **Hand-safe rule:** This first still intentionally has NO hands visible on the guitar. FLUX/Qwen are fine for backgrounds/atmosphere, but NEVER for a figure that could render a hand (AGENTS.md Rule 7 + memory). The teacher character is present in the scene, but the fretboard diagram is the precision reference for fingerings (AMENDMENT-06) — any demonstrated hand later comes from chord-theory-check.js data, not free-generation. If the generated still accidentally renders hands, re-prompt or crop. Do not ship a FLUX-generated hand.

3. **Godot scene setup (parallel track):** The scene files go in `07-app/godot/` (or a subfolder). The scaffold lives there per AMENDMENT-09 (`project.godot` + World/LessonScene/FingeringOverlay scenes). The Godot engine is NOT installed on this machine — owner opens in Godot 4.7.x. The agent prepares: a scene file for the porch, tile/prop set (cobblestone ground, barrels, flower boxes, hanging baskets, moss roof tiles, cottage walls), lighting (overcast soft, no harsh shadows, volumetric fog), and a placeholder for the teacher (the FLUX still, or a Godot character placeholder if T-A1 lands differently). The scene reads as Emerald Hollow: porch + barrels + moss roof + flower boxes + misty greens behind.

4. **Palette spot-check after generation:** After FLUX generates the still, spot-check the colors against the palette lock. The world-emerald-hollow.md has a measurement script pattern (slice the still, quantize colors, compare to the dominant palette). If the generated still is too bright or too saturated, re-prompt with stronger brightness/saturation constraints.

5. **Output location:** Generated still should land in `brand-references/emerald-hollow/` (alongside the existing montages) as `still-01-porch-first-proof.jpg` (or similar), AND/OR in `07-app/godot/` assets if it's going straight into the scene. Document which.

---

## Acceptance (T-B1, from the tickets file — restated)

- [ ] A FLUX prompt draft is on disk (this file) with the palette lock attached.
- [ ] FLUX install state verified on disk before generation (ls ~/re/flux + test -d assets).
- [ ] A generated still of the Emerald Hollow porch is on disk, reads as Emerald Hollow (porch + barrels + moss roof + flower boxes + misty greens behind), palette respects the measured range.
- [ ] A Godot scene file (or scene + tile/prop set) for the Emerald Hollow porch is on disk in `07-app/godot/` (or subfolder), ready for the owner to open in Godot 4.7.x.
- [ ] Either the teacher character is visible in the scene (FLUX still placed, hand-safe), or the scene is empty-but-correct and T-B2 (teacher character) is the next step.
- [ ] Out of scope: animation, teacher voice/dialogue (T-B3), accompaniment (T-B4/T-B5), performance ladder flow (T-B6).

---

## Owner-facing note

This is the first visual proof of Emerald Hollow. When the owner sees the generated still + opens the Godot scene, they should immediately recognize "yes, that's the world I showed you" — the porch, the moss roof, the barrels, the misty greens. If it doesn't read that way, the prompt needs tightening before we build T-B2 (the teacher character) on top of it.
