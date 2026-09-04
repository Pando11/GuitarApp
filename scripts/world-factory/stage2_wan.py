#!/usr/bin/env python3
"""
stage2_wan.py — Stage 2 (Wan2.2-I2V) runner for World 1 (Emerald Hollow).

Runs ON the RunPod pod (GPU). Turns the FLUX.1[schnell] stills (Stage 1 output)
into slow cinematic MOTION clips, per the world brief's BLOCK 00/01/02 beats.

Why this approach (not guessing):
  Wan2.2-I2V-A14B ships its OWN pipeline under `wan/` — it is NOT a diffusers class.
  The repo's own `generate.py` (`--task i2v-14B`) is the supported, 14B-A14B-aware
  entry point. We call `python generate.py ...` as a subprocess with the model dir
  as the checkpoint. This is the documented invocation for this exact repo id.

Input : Stage 1 stills (palette-locked .palette.png) at /tmp/worlds/emerald-hollow/stills/
Output: clips/*.mp4  (one per animated BLOCK) at /tmp/worlds/emerald-hollow/clips/

Each clip uses the matching still as the FIRST FRAME (image-to-video conditioning),
a brief motion prompt (slow dolly / pull-out per the brief), and a NEGATIVE prompt
(mandatory, from the brief). Motion is SLOW (our refs), NOT fast whip-cuts.

License: Wan2.2-I2V-A14B is Apache-2.0 (verified) — commercial-clean per asset-job.js.
"""
import os, sys, json, subprocess, argparse, shutil

WORKSPACE = "/workspace"
WAN_DIR = os.path.join(WORKSPACE, "Wan2.2-I2V-A14B")
GEN = os.path.join(WAN_DIR, "generate.py")

# Stage 1 output (palette-locked stills). Override with env WORLD_OUT to match.
OUT_ROOT = os.environ.get("WORLD_OUT", "/tmp/worlds/emerald-hollow")
STILLS = os.path.join(OUT_ROOT, "stills")
CLIPS = os.path.join(OUT_ROOT, "clips")
MANIFEST_IN = os.path.join(STILLS, "manifest.json")

# Mandatory negative (brief L4) — fed to Wan, which supports negative_prompt.
WAN_NEGATIVE = (
    "neon, vibrant saturated color, harsh sunlight, hard shadow, modern clothing, "
    "electric guitar, UI/HUD overlay, marketplace, text, logo, photo-real human, "
    "uncanny skin, extra fingers, deformed hands, cartoon-bubble, fast whip-cut, "
    "lens flare, floating camera, VR goggles, visible phone, reflection of a real user face"
)

# Animated BLOCKS: name -> (still, motion_prompt, frames, fps, size)
# Sizes kept at the I2V model's native 480P to fit 24GB with bf16 + offload.
BLOCKS = {
    "B00_walkin": {
        "still": "coldopen_walk.palette.png",
        "motion": ("slow forward camera track up a misty cobblestone street toward a "
                   "warm lantern-lit tavern, mist gently parting, lantern glow growing, "
                   "calm, steady, no sudden movement, overcast soft light"),
        "size": "832*480", "frames": 81, "fps": 16,
    },
    "B01_meetsage": {
        "still": "sage_porch.palette.png",
        "motion": ("slow dolly-in on the seated guitar teacher as he looks up and gives a "
                   "small welcoming wave, relaxed, warm lantern light, one continuous take, "
                   "no cuts, no whip-pan"),
        "size": "832*480", "frames": 81, "fps": 16,
    },
    "B02_twoshot": {
        "still": "twoshot.palette.png",
        "motion": ("smooth slow pull-out to a third-person front two-shot of the teacher and "
                   "the seated student facing each other, both visible, gentle settle, warm "
                   "lantern glow, calm, no cuts"),
        "size": "832*480", "frames": 81, "fps": 16,
    },
}


def find_still(name):
    p = os.path.join(STILLS, name)
    if not os.path.exists(p):
        # fall back to non-palette raw if palette missing
        alt = p.replace(".palette.png", ".png")
        if os.path.exists(alt):
            return alt
        raise FileNotFoundError(f"Stage 1 still missing: {p} (run Stage 1 first)")
    return p


def run_block(name, spec, offload, ckpt=None):
    still = find_still(spec["still"])
    out = os.path.join(CLIPS, name)
    os.makedirs(out, exist_ok=True)
    ckpt_arg = ["--ckpt_dir", WAN_DIR] if ckpt is None else ["--ckpt_dir", ckpt]
    cmd = [
        "python", GEN,
        "--task", "i2v-14B",
        "--size", spec["size"],
        "--frame_num", str(spec["frames"]),
        "--fps", str(spec["fps"]),
        "--image", still,
        "--prompt", spec["motion"],
        "--neg_prompt", WAN_NEGATIVE,
        "--sample_shift", "8",          # I2V default per Wan2.2 docs
        "--sample_guide_scale", "5.0",  # I2V default for 14B
        "--sample_steps", "30",
        "--save_file", os.path.join(out, name + ".mp4"),
        *ckpt_arg,
    ]
    if offload:
        cmd += ["--offload_model", "True"]
    print(f"[stage2] BLOCK {name}: {' '.join(cmd)}", flush=True)
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=1800)
    print(r.stdout, file=sys.stderr)
    if r.returncode != 0:
        print("[stage2] STDERR:\n" + r.stderr, file=sys.stderr)
        raise RuntimeError(f"BLOCK {name} failed rc={r.returncode}")
    mp4 = os.path.join(out, name + ".mp4")
    if not os.path.exists(mp4):
        raise RuntimeError(f"BLOCK {name}: mp4 not produced at {mp4}")
    print(f"[stage2]   -> {mp4} ({os.path.getsize(mp4)} bytes)", flush=True)
    return mp4


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--block", default=None, help="single BLOCK name (else all)")
    ap.add_argument("--offload", action="store_true", help="pass --offload_model True")
    ap.add_argument("--ckpt", default=None, help="override --ckpt_dir")
    args = ap.parse_args()

    if not os.path.exists(GEN):
        raise RuntimeError(f"Wan2.2 generate.py not found at {GEN}; pod volume layout differs.")
    os.makedirs(CLIPS, exist_ok=True)

    blocks = {args.block: BLOCKS[args.block]} if args.block else BLOCKS
    manifest = []
    for name, spec in blocks.items():
        mp4 = run_block(name, spec, args.offload, args.ckpt)
        manifest.append({"block": name, "file": mp4, "model": "wan2.2-i2v-a14b",
                         "frames": spec["frames"], "fps": spec["fps"], "size": spec["size"]})
    with open(os.path.join(CLIPS, "manifest.json"), "w") as f:
        json.dump(manifest, f, indent=2)
    print(f"[stage2] wrote {len(manifest)} clips -> {CLIPS}/manifest.json", flush=True)
    print("DONE_STAGE2", flush=True)


if __name__ == "__main__":
    main()
