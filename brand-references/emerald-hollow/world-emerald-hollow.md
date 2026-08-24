# brand-references/emerald-hollow/world-emerald-hollow.md

## Emerald Hollow — world reference brief (pixels → palette → production)

Source video: "The Heart of an Enchanted Medieval Village | Medieval Celtic Music for
Study & Focus | Emerald Hollow" — 183m47s, Celtic ambient music, no speech, pure
visual world reference. This is a **mood/style reference for a lesson world the
student walks into** (a teacher plays guitar and teaches), NOT a UI, NOT a marketplace.

---

## What the world IS

**Genre:** High fantasy / medieval rural — "cozy fantasy," Ghibli-meets-Breath-of-the-Wild
texture quality. A secluded, ancient, slightly magical hamlet deep in a verdant valley or
forest clearing.

**This is NOT:** a marketplace, a UI, a game interface. It's a *place* — a tavern in the
woods, a village street, an enchanted cottage. The teacher would stand in this world and
teach the lesson.

**Vibe:** mysterious yet cozy. Safe but enchanted. Quiet, still, damp, lush. Wet earth and
woodsmoke in the air. A place a traveler would rest.

---

## Architecture & structures

- **Main building (tavern/cottage hybrid):** Massive, sprawling, half-timbered Tudor style.
  Dark wooden beams against lighter weathered plaster walls. Walls heavily obscured by
  vegetation — the building is being *reclaimed by nature*.
- **Roof:** Steeply pitched, completely carpeted in thick vibrant green moss (sod roofs —
  not shingles). Multiple gables/peaks. Central stone chimney stack. Ivy and climbing vines
  drape from roof edges and upper stories.
- **Upper level:** Wooden balcony/porch running along the front, with railing and flower boxes
  overflowing with greenery.
- **Lower level:** Heavy stone foundations, arched stone doorway, small deep-set windows
  (look like leaded glass — old-world feel).
- **Foreground:** Rustic wooden shelter structure (well cover or cart shed) with sloped moss-
  covered roof.
- **Street furniture:** Wooden barrels lined up along front walls (tavern = serves ale/mead).
  Wicker hanging baskets from eaves/beams, overflowing with flowering plants and greenery.
  Window boxes on upper windows. Cobblestone street (irregular grey stones, old and worn).
- **Background:** Misty mountains or hills through fog. Tall dark evergreen trees framing the
  scene. Village street leads eye from bottom-right into center background — strong depth.

---

## Lighting & atmosphere

- **Time of day:** Early morning, or heavily overcast cloudy afternoon. Diffuse soft light,
  NO harsh shadows. The sun hasn't broken through the cloud cover.
- **Light quality:** Cool, slightly blue/grey tint. Contrasts with warm greens and browns of
  the building. Soft ambient occlusion — corners under roof dark and shadowy.
- **Atmosphere:** Volumetric fog/mist — thick in background, hangs low in the valley. Sense of
  humidity in the air. The fog limits view → mystery + isolation.
- **Mood:** tranquil, mysterious, cozy, slightly magical. Quiet and still. Early-morning damp.
- **Possible evening variant:** A lantern glowing on the porch as "lesson begins" — warm fire
  light inside visible through windows, smoke curling from chimney.

---

## Pixel-level color data (measured from 5 slices, 24fps, 640×360)

### Overall video stats
- Brightness range: **75–91/255** → consistently **DARK-to-MOODY** (dark < 80, moody < 120)
- Saturation range: **0.14–0.33** → **muted to moderate** (muted < 0.3, moderate < 0.5)
- The world is NOT vibrant/saturated — it's muted, earthy, naturalistic.

### Measured frame-average colors (RGB hex, across slices)

These are the *average* color of each sampled frame — useful as a "base tone" for that
moment:

| Segment | Frame 0 | Mid | Late |
|---------|---------|-----|------|
| 0:00-0:30 | #3d473c | #65675c | #686e50 |
| 1:00-1:30 | #646454 | #5c6356 | #696f61 |
| 3:00-3:30 | #54675b | #6d6e5d | #32322f |
| 5:00-5:30 | #3a4437 | #52635c | #3c4b3e |
| 8:00-8:30 | #5d664e | #4c5348 | #444d4f |

**Reading:** The world shifts subtly between greens (#3d473c → #54675b), cooler greys
(#444d4f late in slice 5), and warmer olive-tan (#696f61 in the 1:00 segment). No single
static color — the world breathes.

### Dominant quantized palette (color clusters, merged across all 5 slices)

These are the **discrete color buckets** that fill the frame — the building blocks of the
world. Ordered by prevalence:

| Rank | Hex | RGB | Role |
|------|-----|-----|------|
| 1 | #202020 | (32,32,32) | Near-black shadow / deep wood / darkest recesses — ~20-24% of frame |
| 2 | #404040 | (64,64,64) | Mid-dark stone / muted wood / shadow edge — ~12-15% |
| 3 | #204020 | (32,64,32) | Deep forest green — moss shadow, dark foliage — 3-9% |
| 4 | #000000 | (0,0,0) | Pure black (chimney interior, deepest shadow) — 3-5% |
| 5 | #606060 | (96,96,96) | Mid grey — cobblestone, fog, stone — 3-5% |
| 6 | #406040 | (64,96,64) | Mid forest green — moss mid-tone, foliage — 3-7% |
| 7 | #404020 | (64,64,32) | Olive-drab / weathered wood — 3-5% |
| 8 | #204040 | (32,64,64) | Deep teal-green — ivy shadow, wet foliage — 2-7% |
| 9 | #606040 | (96,96,64) | Olive-tan / dry grass / warm wood — 2-5% |
| 10 | #808060 | (128,128,96) | Light olive / sunlit moss / weathered plaster — 2-4% |
| 11 | #608060 | (96,128,96) | Light green — sunlit foliage, hanging baskets — 2-5% |
| 12 | #c0c0c0 | (192,192,192) | Light grey — fog highlight, stone highlight — ~2% |

### Production color palette (for FLUX prompts / Godot materials / artist reference)

Derived from the measured data + vision analysis. These are the *named* colors to use
when generating stills or building the animated world:

| Name | Hex | Use |
|------|-----|-----|
| Deep Forest Green | #2E8B57 (approx #204020 cluster) | Primary foliage/moss base |
| Weathered Wood Brown | #4B3621 (approx #404020 / #406040 cluster) | Beams, barrels, structures |
| Mossy Lime | #C5E1A5 (approx #808060 / #608060 cluster) | Sunlit moss, hanging basket flowers |
| Slate / Cobblestone Grey | #708090 (approx #606060 / #808080 cluster) | Street stones, stone foundations |
| Misty Blue-Grey | #B0C4DE (approx #404040 highlight + cool tint) | Background fog, distant hills |
| Near-Black Shadow | #202020 | Deep recesses, chimney interior, wood shadow |
| Stone Chimney Warm | #8B7355 (approximate warm neutral from chimney) | Chimney stack, warm stone |

**Rule for generation:** keep saturation muted-to-moderate (0.14–0.33), keep overall
brightness in the dark-to-moody range (75–120/255). A vibrant neon world breaks the reference.
Warm accents (firelight, lantern, wood warmth) are the contrast — not saturated color.

---

## Texture & material notes

- **Roof moss:** Thick, soft, fuzzy — looks like a rug of grass, NOT individual blades. Use
  soft volumetric / alpha-blended moss texture, not hard geometry.
- **Wood:** Weathered, dark, damp-looking — dark brown near-black (#202020 / #404020 range).
  Not fresh/raw wood.
- **Stone:** Rough, aged, cobblestone irregular. Mottled grey.
- **Vegetation:** Ivy climbs OVER beams (use vertex painting or alpha maps so vines hang over
  the geometry, not just texture-painted). Hanging baskets overflow. Window boxes full.
- **Ground:** Uneven, rocky, muddy — natural, unmanicured. Not a clean paved surface.
- **Atmosphere:** Volumetric fog is ESSENTIAL — it's what makes the world feel magical and
  hides the "end" of the world. Soft ambient occlusion in corners.

---

## Teacher placement in this world

**Exterior options:**
- Teacher on the wooden porch/balcony of the main tavern — leaning against the railing,
  guitar in hand. Flower boxes behind. Barrels to the side. Misty forest behind that.
- Teacher on a wooden bench or barrel in the street (though it looks damp — maybe a covered
  porch area).
- Low-angle shot looking up at the tavern = grand/imposing; eye-level from the street = inviting.

**Interior option:**
- Inside one of the half-timbered cottages — by a leaded-glass window looking out at the
  misty street, or on a covered interior porch. Warm firelight in background.

**For a lesson context:** An eye-level shot focusing on the porch area of the tavern is the
best first read — teacher visible, world readable, inviting not imposing.

**Suggested scene composition (first proof):**
- Camera: eye-level, teacher framed center or center-right, tavern porch behind, barrels to
  one side, misty greens behind.
- Animation beats: leaves rustling slightly, smoke curling from chimney, lantern glows as
  lesson starts.
- Acoustic feel: warm and intimate (porch) or breezy and natural (street).

---

## Mood keywords (for FLUX prompt + Godot lighting)

cozy fantasy, medieval village, enchanted forest, mossy roof, half-timbered cottage,
cobblestone street, hanging flower baskets, barrel-lined tavern, volumetric mist, overcast
soft light, early morning, wet earth, woodsmoke, verdant valley, secluded, ancient, welcoming,
mysterious, tranquil, Ghibli-texture, Breath-of-the-Wild environment feel

---

## What this means for Grill #4 (The Teacher — World 1)

- **World 1 = Emerald Hollow.** One animated teacher, one animated world, high-quality animated
  production. This is the proof world.
- **Medium:** High-end animated character + animated world (Godot 4.x). Not photo-real — that's
  a separate track to try later.
- **Teacher personality:** Chill, warm, encouraging (Grill #3 rule). Matched to the world —
  a chill teacher in a cozy forest tavern world makes sense.
- **Down the road:** World 2 = different setting + different teacher personality (e.g. upbeat
  in a different world). Forest world with a talking Beaver reserved as a fun future option.
- **Performance ladder:** Level 1 (~5-6 lessons) — student performs on the tavern porch with
  teacher accompanying. Level 2 (~10-12) — bigger moment. Level 3/capstone (L25) — full bar
  with band (bass, drums, teacher on second guitar).
