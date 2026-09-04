#!/usr/bin/env python3
"""
fal_stage2.py — World 1 (Emerald Hollow) Wan2.2-I2V clips via fal.ai.

Takes the Stage-1 palette-locked stills, uploads them to fal storage, and runs
fal-ai/wan/v2.2-a14b/image-to-video (Apache-2.0) to produce slow cinematic clips
matching the brief's BLOCK 00/01/02 motion. Saves mp4s to:
  Desktop/GuitarApp/07-app/assets/worlds/emerald-hollow/clips/

Verified live 2026-08-30:
  * stills must be 16:9 (Wan rejects 4:3) — our stage1 shots are landscape_16_9.
  * Wan is ASYNC; fal_client.subscribe() handles queue + poll + result.
  * negative_prompt param is accepted by the fal Wan endpoint.

BLOCKS (brief L4 / cold-open):
  B00_walkin   coldopen_walk  -> slow forward track up the street
  B01_meetsage sage_porch     -> slow dolly-in as Sage waves
  B02_twoshot  twoshot        -> smooth pull-out to two-shot

License gate: wan2.2-i2v on allowlist. Motion is SLOW per brief, not whip-cuts.

Run:
  python fal_stage2.py               # all 3 blocks
  python fal_stage2.py --block B00_walkin
"""
import os
import sys
import json
import argparse

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import fal_common as fc

STILLS_DIR = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "..", "..", "07-app", "assets",
    "worlds", "emerald-hollow", "stills",
)
CLIPS_DIR = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "..", "..", "07-app", "assets",
    "worlds", "emerald-hollow", "clips",
)

WAN_NEGATIVE = fc.NEGATIVE

BLOCKS = {
    "B00_walkin": {
        "still": "coldopen_walk.palette.png",
        "motion": (
            "slow forward camera track up a misty cobblestone street toward a warm "
            "lantern-lit tavern, mist gently parting, lantern glow growing, calm, steady, "
            "no sudden movement, overcast soft light"
        ),
    },
    "B01_meetsage": {
        "still": "sage_porch.palette.png",
        "motion": (
            "slow dolly-in on the seated guitar teacher as he looks up and gives a small "
            "welcoming wave, relaxed, warm lantern light, one continuous take, no cuts, "
            "no whip-pan"
        ),
    },
    "B02_twoshot": {
        "still": "twoshot.palette.png",
        "motion": (
            "smooth slow pull-out to a third-person front two-shot of the teacher and the "
            "seated student facing each other, both visible, gentle settle, warm lantern "
            "glow, calm, no cuts"
        ),
    },
}


def stage2(blocks):
    os.makedirs(CLIPS_DIR, exist_ok=True)
    manifest = []
    for name, spec in blocks.items():
        still_path = os.path.join(STILLS_DIR, spec["still"])
        if not os.path.exists(still_path):
            raise FileNotFoundError(f"Stage-1 still missing: {still_path} (run fal_stage1.py first)")
        print(f"[stage2] BLOCK {name}: uploading {spec['still']} ...", flush=True)
        image_url = fc.upload(still_path)

        print(f"[stage2] BLOCK {name}: generating Wan I2V clip (async) ...", flush=True)
        video_url = fc.gen_clip(image_url, spec["motion"], aspect_ratio="16:9",
                               num_frames=81, fps=16)

        # download the mp4
        import urllib.request
        mp4_path = os.path.join(CLIPS_DIR, f"{name}.mp4")
        data = urllib.request.urlopen(video_url).read()
        with open(mp4_path, "wb") as f:
            f.write(data)

        manifest.append({
            "block": name,
            "file": os.path.relpath(mp4_path, os.path.dirname(CLIPS_DIR)),
            "model": "wan2.2-i2v",
            "fal_model": fc.WAN_MODEL,
            "source_still": spec["still"],
            "frames": 81,
            "fps": 16,
            "aspect_ratio": "16:9",
            "video_url": video_url,
            "bytes": len(data),
        })
        print(f"[stage2]   -> {mp4_path} ({len(data)} bytes)", flush=True)

    manifest_path = os.path.join(CLIPS_DIR, "manifest.json")
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)
    print(f"[stage2] wrote {len(manifest)} clips -> {manifest_path}", flush=True)
    return manifest


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--block", default=None, help="single BLOCK name (else all 3)")
    args = ap.parse_args()
    blocks = {args.block: BLOCKS[args.block]} if args.block else BLOCKS
    stage2(blocks)
    print("DONE_STAGE2")


if __name__ == "__main__":
    main()
