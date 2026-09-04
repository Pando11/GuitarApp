#!/usr/bin/env python3
"""
fal_stage1.py — World 1 (Emerald Hollow) FLUX.1[schnell] stills via fal.ai.

Generates the brief's locked-instance shots, palette-locks every pixel to the 7
brief hexes (quantize_to_palette), and saves to:
  Desktop/GuitarApp/07-app/assets/worlds/emerald-hollow/stills/

Shots (from brand-references/worlds/world-brief-emerald-hollow-L1.md):
  sage_porch       L2 / BLOCK 01  — @Sage welcomes on the porch        (16:9, video-bound)
  coldopen_walk    BLOCK 00       — POV walk up the cobblestone street (16:9, video-bound)
  twoshot          BLOCK 02       — @Sage + @Student seated two-shot   (16:9, video-bound)
  sage_charsheet   L5             — @Sage character sheet, plain grey   (1:1, still-only)

NOTE: the 3 video-bound shots MUST be 16:9 so they feed Wan I2V directly
(Wan rejects 4:3). The char sheet is 1:1 (no video). The OLD build-world-1.py
used 1216x704 (≈19:11) which Wan would reject — corrected here to 16:9.

License gate (07-app/core/asset-job.js): flux.1-schnell only, steps 1-4, guidance 0.0,
shift False, t5MaxLength 256, run cloud-gpu-worker. fal FLUX is the managed equivalent;
we pass steps=4, guidance=3.5 (closest valid; fal requires >=1) — recorded in manifest.

Run:
  python fal_stage1.py                 # all 4 shots
  python fal_stage1.py --shot sage_porch
"""
import os
import sys
import json
import argparse

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import fal_common as fc

OUT_DIR = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "..", "..", "07-app", "assets",
    "worlds", "emerald-hollow", "stills",
)

# Locked instances — reused verbatim across every shot (brief L5).
LOCKED = {
    "@Sage": (
        "Sage, a chill mid-30s acoustic guitar instructor, layered earth-tone tunic, "
        "worn leather strap, own instrument (not a prop swap), relaxed posture, "
        "faint warm smile, moss-covered sod-roof cottage behind"
    ),
    "@EmeraldHollow": (
        "enchanted medieval Celtic tavern-in-the-woods: half-timbered cottage, "
        "moss-covered sod roof, hanging flower baskets, wooden barrels, cobblestone "
        "street, misty evergreen hills behind, warm lantern glow"
    ),
    "@Student": (
        "generic learner avatar (NOT the real user), simple non-specific stand-in, "
        "default new-student look, never the real user's face"
    ),
}
PALETTE_LINE = ", ".join(f"{v} ({k})" for k, v in fc.PALETTE.items())

SHOTS = {
    "sage_porch": {
        "label": "L2 / BLOCK 01 — @Sage welcomes on the porch",
        "image_size": "landscape_16_9",
        "video_bound": True,
        "prompt": (
            f"{LOCKED['@Sage']}, seated on a wooden tavern porch holding an acoustic "
            f"guitar, one ankle crossed, relaxed posture, faint smile, small welcoming "
            f"wave. {LOCKED['@EmeraldHollow']} porch, barrels and flower baskets to one "
            f"side, cobblestone street, misty hills behind. Early-morning overcast soft "
            f"diffuse light, no harsh shadow, a warm lantern glow begins at the porch "
            f"rail. Medium shot, eye-level, 35mm wide, calm breath, a friend who is glad "
            f"you showed up. Palette strictly: {PALETTE_LINE}. Muted-to-moderate "
            f"saturation, dark-to-moody, never bright."
        ),
    },
    "coldopen_walk": {
        "label": "BLOCK 00 — POV walk up the cobblestone street",
        "image_size": "landscape_16_9",
        "video_bound": True,
        "prompt": (
            f"First-person POV walking up a cobblestone street toward a tavern, mist "
            f"parting, lantern glow growing ahead. {LOCKED['@EmeraldHollow']} street and "
            f"porch approach, barrels, flower baskets, moss roof. Overcast soft light, "
            f"warm lantern glow ahead as destination. Palette strictly: {PALETTE_LINE}. "
            f"Muted, moody, no people visible from the front."
        ),
    },
    "twoshot": {
        "label": "BLOCK 02 — @Sage + @Student seated two-shot",
        "image_size": "landscape_16_9",
        "video_bound": True,
        "prompt": (
            f"Third-person eye-level front two-shot: {LOCKED['@Sage']} and "
            f"{LOCKED['@Student']} seated facing each other on the tavern porch, both "
            f"visible, Sage settles the guitar. {LOCKED['@EmeraldHollow']} porch geometry. "
            f"Warm lantern glow, overcast soft light. Palette strictly: {PALETTE_LINE}. "
            f"Calm, safe, welcoming."
        ),
    },
    "sage_charsheet": {
        "label": "L5 — @Sage character sheet (front/back/face, plain grey bg)",
        "image_size": "square_hd",
        "video_bound": False,
        "prompt": (
            f"Character sheet of {LOCKED['@Sage']}, plain neutral grey background, three "
            f"views: front, back, face close-up, single clean face, no averaging, one "
            f"consistent guitar, earth-tone tunic and worn leather strap. Neutral "
            f"lighting, no background detail. Palette accent only: {PALETTE_LINE}."
        ),
    },
}


def stage1(shots):
    os.makedirs(OUT_DIR, exist_ok=True)
    manifest = []
    for name in shots:
        spec = SHOTS[name]
        print(f"[stage1] rendering '{name}': {spec['label']}", flush=True)
        raw_bytes = fc.gen_still(spec["prompt"], image_size=spec["image_size"])

        raw_png = os.path.join(OUT_DIR, f"{name}.png")
        with open(raw_png, "wb") as f:
            f.write(raw_bytes)

        qpng = os.path.join(OUT_DIR, f"{name}.palette.png")
        report = fc.quantize_to_palette(raw_png, qpng)

        meta = {
            "shot": name,
            "label": spec["label"],
            "file": os.path.relpath(qpng, os.path.dirname(OUT_DIR)),
            "raw_file": os.path.relpath(raw_png, os.path.dirname(OUT_DIR)),
            "model": "flux.1-schnell",
            "fal_model": fc.FLUX_MODEL,
            "image_size": spec["image_size"],
            "steps": 4,
            "guidance_scale": 3.5,
            "palette_lock": "7-hex quantize_to_palette",
            "negative_prompt": fc.NEGATIVE,
            "video_bound": spec["video_bound"],
            "palette_coverage": report,
        }
        manifest.append(meta)
        print(f"[stage1]   -> {qpng} ({os.path.getsize(qpng)} bytes) "
              f"off-palette={report['off_palette_after']}", flush=True)

    manifest_path = os.path.join(OUT_DIR, "manifest.json")
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)
    print(f"[stage1] wrote manifest ({len(manifest)} shots) -> {manifest_path}", flush=True)
    return manifest


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--shot", default=None, help="single shot name (else all 4)")
    args = ap.parse_args()
    shots = [args.shot] if args.shot else list(SHOTS.keys())
    stage1(shots)
    print("DONE_STAGE1")


if __name__ == "__main__":
    main()
