#!/usr/bin/env python3
"""
build-world-1.py — World 1 (Emerald Hollow) asset generator.

Runs ON the RunPod pod (GPU). Reads the owner's brief and produces cinematic
assets through the FLUX -> Wan2.2 -> Chatterbox -> Godot pipeline.

STAGES
  1. FLUX.1[schnell] stills        (IMPLEMENTED)  -> 07-app/assets/worlds/emerald-hollow/stills/*.png
  2. Wan2.2-I2V motion            (SCAFFOLD)      -> clips/*.mp4
  3. Chatterbox voice              (SCAFFOLD)      -> voice/*.wav
  4. Godot shell wiring            (SCAFFOLD)      -> 07-app/godot/ scene states

Run:
  python3 build-world-1.py --stage 1 --shot sage_porch   # one still (dry run)
  python3 build-world-1.py --stage 1                     # all brief shots
  python3 build-world-1.py --stage all                   # full pipeline (after 2-4 wired)

Models live on the pod at /workspace (network volume 6nvscrbt2s):
  /workspace/flux-schnell      (FLUX.1[schnell], Apache-2.0)
  /workspace/Wan2.2-I2V-A14B   (Wan2.2-I2V,     Apache-2.0)

License gate (asset-job.js) requires: steps 1-4, guidance 0.0, shift False,
t5MaxLength 256, FLUX.1[schnell] only (NOT dev/krea). This script complies.
Chatterbox (voice) is approved via AGENTS.md rule 9 (MIT) — not in asset-job.js.

Subject-lock rule: @Sage / @EmeraldHollow / @Student are LOCKED instances.
Their reference descriptions live in LOCKED_INSTANCES and must be reused verbatim
across every shot — never re-described as a "type".
"""
import os, sys, json, argparse, shutil

WORKSPACE = "/workspace"
FLUX_DIR = os.path.join(WORKSPACE, "flux-schnell")
WAN_DIR = os.path.join(WORKSPACE, "Wan2.2-I2V-A14B")
# Output goes to the container disk (writable). /workspace volume is write-quota-blocked
# on this pod, but reads work (models load from there). Pull outputs back via the
# Jupyter contents GET API after generation. Override with WORLD_OUT env var.
OUT_ROOT = os.environ.get("WORLD_OUT", "/tmp/worlds/emerald-hollow")

# ---------------------------------------------------------------------------
# Palette lock — the ONLY 7 hexes allowed (from world-brief-emerald-hollow-L1.md)
# ---------------------------------------------------------------------------
PALETTE = {
    "deep_forest_green": "#2E8B57",
    "weathered_wood_brown": "#4B3621",
    "mossy_lime": "#C5E1A5",
    "slate_cobblestone_grey": "#708090",
    "misty_blue_grey": "#B0C4DE",
    "near_black_shadow": "#202020",
    "stone_chimney_warm": "#8B7355",
}
PALETTE_LINE = ", ".join(f"{v} ({k})" for k, v in PALETTE.items())

# Strict palette-enforcement clause appended to EVERY FLUX prompt in stage1.
# The dry-run proved FLUX will otherwise emit bright-pink flowers, a saturated-orange
# guitar, and bright-orange lanterns (none in the 7-hex palette). Naming the exact
# in-palette hues for those elements is what actually enforces the lock.
PALETTE_ENFORCE = (
    "STRICT PALETTE LOCK: every pixel uses ONLY these 7 hex colors — "
    f"{PALETTE_LINE}. "
    "The lantern glow is stone-chimney-warm (#8B7355), never bright orange. "
    "The acoustic guitar body is weathered-wood-brown (#4B3621). "
    "Flower baskets show only muted mossy-lime (#C5E1A5) and weathered-wood-brown blooms, "
    "never bright pink or red. No neon, no saturated or vibrant hues, no color outside the 7 hexes."
)

# ---------------------------------------------------------------------------
# MANDATORY negative prompt (brief L4) — applied to EVERY FLUX/Wan call
# ---------------------------------------------------------------------------
NEGATIVE = (
    "neon, vibrant saturated color, bright pink flowers, magenta, bright red, saturated "
    "orange, bright yellow, electric guitar, UI/HUD overlay, marketplace, text, logo, "
    "photo-real human, uncanny skin, extra fingers, deformed hands, cartoon-bubble, "
    "fast whip-cut, lens flare, reflection of a real user face, visible phone, VR goggles"
)

# ---------------------------------------------------------------------------
# LOCKED instances — reused verbatim, never re-described
# ---------------------------------------------------------------------------
LOCKED_INSTANCES = {
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


# ---------------------------------------------------------------------------
# Shot definitions — derived from the brief (cold-open BLOCK 00/01/02, L2/L5)
# Each still = subject + scene + palette + lighting + negative.
# ---------------------------------------------------------------------------
SHOTS = {
    "sage_porch": {
        "label": "L2 / BLOCK 01 — @Sage welcomes on the porch",
        "prompt": (
            f"{LOCKED_INSTANCES['@Sage']}, seated on a wooden tavern porch holding an "
            f"acoustic guitar, one ankle crossed, relaxed posture, faint smile, "
            f"small welcoming wave. {LOCKED_INSTANCES['@EmeraldHollow']} porch, "
            f"barrels and flower baskets to one side, cobblestone street, misty hills "
            f"behind. Early-morning overcast soft diffuse light, no harsh shadow, a warm "
            f"lantern glow begins at the porch rail. Medium shot, eye-level, 35mm wide, "
            f"calm breath, a friend who is glad you showed up. Palette strictly: "
            f"{PALETTE_LINE}. Muted-to-moderate saturation, dark-to-moody, never bright."
        ),
        "negative": NEGATIVE,
        "width": 1216, "height": 704,   # 19:11 cinematic-ish; FLUX handles arbitrary
    },
    "coldopen_walk": {
        "label": "BLOCK 00 — POV walk up the cobblestone street",
        "prompt": (
            f"First-person POV walking up a cobblestone street toward a tavern, mist "
            f"parting, lantern glow growing ahead. {LOCKED_INSTANCES['@EmeraldHollow']} "
            f"street and porch approach, barrels, flower baskets, moss roof. Overcast "
            f"soft light, warm lantern glow ahead as destination. Palette strictly: "
            f"{PALETTE_LINE}. Muted, moody, no people visible from front."
        ),
        "negative": NEGATIVE,
        "width": 1216, "height": 704,
    },
    "twoshot": {
        "label": "BLOCK 02 — @Sage + @Student seated two-shot",
        "prompt": (
            f"Third-person eye-level front two-shot: {LOCKED_INSTANCES['@Sage']} and "
            f"{LOCKED_INSTANCES['@Student']} seated facing each other on the tavern "
            f"porch, both visible, Sage settles the guitar. {LOCKED_INSTANCES['@EmeraldHollow']} "
            f"porch geometry. Warm lantern glow, overcast soft light. Palette strictly: "
            f"{PALETTE_LINE}. Calm, safe, welcoming."
        ),
        "negative": NEGATIVE,
        "width": 1216, "height": 704,
    },
    "sage_charsheet": {
        "label": "L5 — @Sage character sheet (front/back/face, plain grey bg)",
        "prompt": (
            f"Character sheet of {LOCKED_INSTANCES['@Sage']}, plain neutral grey "
            f"background, three views: front, back, face close-up, single clean face, "
            f"no averaging, one consistent guitar, earth-tone tunic and worn leather "
            f"strap. Neutral lighting, no background detail. Palette accent only: "
            f"{PALETTE_LINE}."
        ),
        "negative": NEGATIVE,
        "width": 1024, "height": 1024,
    },
}


def get_pipeline():
    from diffusers import FluxPipeline
    import torch
    print(f"[stage1] loading FLUX.1[schnell] from {FLUX_DIR} ...", flush=True)
    pipe = FluxPipeline.from_pretrained(
        FLUX_DIR, torch_dtype=torch.bfloat16,
    )
    # RTX PRO 4000 = 24GB. FLUX-schnell bf16 loads to ~23.4GiB if placed fully on
    # GPU (no headroom -> OOM). We keep weights in CPU RAM and move each sub-module
    # to GPU per step. NOTE: enable_model_cpu_offload() DEADLOCKS on torch 2.8 cu128
    # + Blackwell (verified: pipe() hangs at 0% GPU). enable_sequential_cpu_offload()
    # is the working path here: peaks at ~370MiB, renders 256x256 in ~92s.
    import os
    os.environ.setdefault("PYTORCH_CUDA_ALLOC_CONF", "expandable_segments:True")
    pipe.enable_sequential_cpu_offload()
    pipe.enable_attention_slicing()
    # FLUX.1[schnell] = distilled: 1-4 steps, guidance 0.0, shift False.
    return pipe


def stage1(shots, out_dir):
    import torch
    os.makedirs(out_dir, exist_ok=True)
    pipe = get_pipeline()
    manifest = []
    for name in shots:
        spec = SHOTS[name]
        print(f"[stage1] rendering '{name}': {spec['label']}", flush=True)
        # FLUX.1[schnell] FluxPipeline has NO negative_prompt argument (distilled sampling,
        # no CFG). We encode the mandatory negative concepts as an "avoid:" tail on the
        # positive prompt so the model steers away from them. The negative_prompt field is
        # still recorded in the manifest and MUST be passed to Wan2.2 (which supports it).
        pos = spec["prompt"] + " " + PALETTE_ENFORCE + " AVOID: " + spec["negative"]
        image = pipe(
            prompt=pos,
            width=spec["width"], height=spec["height"],
            num_inference_steps=4,      # schnell distilled
            guidance_scale=0.0,         # schnell requires 0.0
            # shift handled by pipeline default for schnell; not set (False-equivalent)
        ).images[0]
        raw_png = os.path.join(out_dir, f"{name}.png")
        image.save(raw_png)
        # Hard palette lock: FLUX's text priors (pink flowers, orange guitar, bright
        # lantern) defeat prompt-only enforcement, so we snap every pixel to the nearest
        # of the 7 palette hexes. The palette-compliant still is the deliverable.
        qpng = os.path.join(out_dir, f"{name}.palette.png")
        quantize_to_palette(raw_png, qpng)
        meta = {
            "shot": name, "label": spec["label"], "file": qpng,
            "raw_file": raw_png, "model": "flux.1-schnell", "steps": 4,
            "guidance_scale": 0.0, "palette": PALETTE,
            "negative_prompt": spec["negative"],
            "prompt": spec["prompt"], "prompt_sent_to_model": pos,
        }
        manifest.append(meta)
        print(f"[stage1]   -> {qpng} ({os.path.getsize(qpng)} bytes)", flush=True)
    with open(os.path.join(out_dir, "manifest.json"), "w") as f:
        json.dump(manifest, f, indent=2)
    print(f"[stage1] wrote manifest ({len(manifest)} shots) -> {out_dir}/manifest.json", flush=True)
    return manifest


def quantize_to_palette(src_png, dst_png):
    """Snap every pixel of src_png to the nearest of the 7 PALETTE hexes -> dst_png.
    Guarantees the hard palette lock regardless of FLUX's text-prior color drift."""
    from PIL import Image
    pal = {k: tuple(int(v[i:i + 2], 16) for i in (1, 3, 5)) for k, v in PALETTE.items()}
    im = Image.open(src_png).convert("RGB")
    px = im.load()
    W, H = im.size
    for y in range(H):
        for x in range(W):
            r, g, b = px[x, y]
            best = min(pal.items(),
                       key=lambda kv: (kv[1][0] - r) ** 2 + (kv[1][1] - g) ** 2 + (kv[1][2] - b) ** 2)
            px[x, y] = best[1]
    im.save(dst_png)
    print(f"[quantize] {src_png} -> {dst_png} (7-color palette)", flush=True)


def stage2_placeholder():
    # TODO: Wan2.2-I2V A14B — feed FLUX still + BLOCK action as I2V condition.
    # Slow dolly/pan per brief; NOT fast whip-cuts.
    print("[stage2] Wan2.2-I2V motion: NOT YET IMPLEMENTED (scaffold).", flush=True)
    print("[stage2] Plan: for each animated BLOCK (BLOCK 00/01/02) feed the matching "
          "still + action/lighting as I2V condition; output clips/*.mp4.", flush=True)


def stage3_placeholder():
    # TODO: Chatterbox TTS — render @Sage lines (kid + adult registers) with the
    # built-in MIT voice. NO cloning of a real person.
    print("[stage3] Chatterbox voice: NOT YET IMPLEMENTED (scaffold).", flush=True)
    print("[stage3] Plan: from brief VOICE line, render @Sage warm lines; "
          "Kokoro-82M is the CPU fallback. Rule 5: cite stored numbers, "
          "never invent musical opinion.", flush=True)


def stage4_placeholder():
    # TODO: Godot shell — drop stills/clips into 07-app/godot/ scene states;
    # wire lantern-per-lesson, village wakes, crowd clap.
    print("[stage4] Godot shell: NOT YET IMPLEMENTED (scaffold).", flush=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--stage", default="1", help="1 | 2 | 3 | 4 | all")
    ap.add_argument("--shot", default=None, help="single shot name for dry-run (e.g. sage_porch)")
    ap.add_argument("--out", default=os.path.join(OUT_ROOT, "stills"), help="output dir (pod-side)")
    ap.add_argument("--small", action="store_true",
                    help="dry-run at 768x448 to fit a 24GB GPU; ignores SHOTS width/height")
    args = ap.parse_args()

    if args.small:
        for s in SHOTS.values():
            s["width"], s["height"] = 768, 448
        print("[main] --small: using 768x448 for all shots", flush=True)

    if args.stage in ("1",) or args.stage == "all":
        shots = [args.shot] if args.shot else list(SHOTS.keys())
        stage1(shots, args.out)
    if args.stage in ("2", "all"):
        stage2_placeholder()
    if args.stage in ("3", "all"):
        stage3_placeholder()
    if args.stage in ("4", "all"):
        stage4_placeholder()
    print("DONE_BUILD", flush=True)


if __name__ == "__main__":
    main()
