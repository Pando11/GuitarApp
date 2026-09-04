#!/usr/bin/env python3
"""
fal_common.py — shared helpers for the fal.ai World-1 build.

Replaces the old on-pod torch pipeline (build-world-1.py / stage2_wan.py) with
managed fal.ai API calls. No pod, no GPU, no 30 GB download.

Verified live 2026-08-30 against the real fal.ai API:
  * fal-ai/flux/schnell        -> HTTP 200, image URL (FLUX.1[schnell] Apache-2.0)
  * fal-ai/wan/v2.2-a14b/image-to-video -> async queue -> mp4 (Wan2.2-I2V Apache-2.0)
  * fal_client.upload_file()   -> fal.media URL (so palette-locked stills feed Wan)
  * Wan REQUIRES aspect_ratio in {16:9, 9:16, 1:1}; a 4:3 still is rejected.

Auth: reads FAL_KEY from env (set in Desktop/GuitarApp/.env). fal_client picks it up.

Palette lock (brief mandate): every still pixel is snapped to the nearest of the
7 lockdown hexes via quantize_to_palette(). This is the deliverable for stills.
"""
import os
import sys
import io
from pathlib import Path

import fal_client
from PIL import Image

# ---------------------------------------------------------------------------
# Palette lock — the ONLY 7 hexes allowed (world-brief-emerald-hollow-L1.md)
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
_PALETTE_RGB = {
    k: tuple(int(v[i:i + 2], 16) for i in (1, 3, 5)) for k, v in PALETTE.items()
}

FLUX_MODEL = "fal-ai/flux/schnell"
WAN_MODEL = "fal-ai/wan/v2.2-a14b/image-to-video"
VOICE_MODEL = "fal-ai/chatterbox/text-to-speech"  # MIT weights, hosted on fal.ai

# Mandatory negative prompt (brief L4) — applied to EVERY FLUX/Wan call.
NEGATIVE = (
    "neon, vibrant saturated color, bright pink flowers, magenta, bright red, saturated "
    "orange, bright yellow, electric guitar, UI/HUD overlay, marketplace, text, logo, "
    "photo-real human, uncanny skin, extra fingers, deformed hands, cartoon-bubble, "
    "fast whip-cut, lens flare, reflection of a real user face, visible phone, VR goggles, "
    "harsh sunlight, hard shadow, modern clothing"
)

# Strict palette-enforcement clause appended to every FLUX prompt (name exact in-palette
# hues; text alone does not enforce, so we ALSO snap pixels post-hoc in quantize_to_palette).
PALETTE_ENFORCE = (
    "STRICT PALETTE LOCK: every pixel uses ONLY these 7 hex colors — "
    + ", ".join(f"{v} ({k})" for k, v in PALETTE.items())
    + ". The lantern glow is stone-chimney-warm (#8B7355), never bright orange. "
    "The acoustic guitar body is weathered-wood-brown (#4B3621). Flower baskets show only "
    "muted mossy-lime (#C5E1A5) and weathered-wood-brown, never bright pink or red. "
    "No neon, no saturated or vibrant hues, no color outside the 7 hexes."
)


def _ensure_key():
    """Ensure FAL_KEY is present in the environment.

    The fal_client SDK reads FAL_KEY from the environment automatically, so we only
    need to guarantee the var exists (from env or from the project .env). We do NOT
    set fal_client.configuration.token — that attribute does not exist in this version.
    """
    key = os.environ.get("FAL_KEY")
    if key:
        return
    env_path = Path(__file__).resolve().parents[2] / ".env"
    if env_path.exists():
        for line in env_path.read_text().splitlines():
            s = line.strip()
            if s.startswith("FAL_KEY="):
                os.environ["FAL_KEY"] = s.split("=", 1)[1].strip().strip('"')
                return
    raise RuntimeError("FAL_KEY not set. Export it or put it in Desktop/GuitarApp/.env")


def upload(path: str) -> str:
    """Upload a local file to fal storage, return its public URL."""
    _ensure_key()
    return fal_client.upload_file(path)


def gen_still(prompt: str, image_size: str = "landscape_16_9", steps: int = 4,
             guidance: float = 3.5) -> bytes:
    """Generate a FLUX.1[schnell] still. Returns raw PNG/JPEG bytes."""
    _ensure_key()
    out = fal_client.subscribe(FLUX_MODEL, arguments={
        "prompt": prompt + " " + PALETTE_ENFORCE + " AVOID: " + NEGATIVE,
        "num_inference_steps": steps,
        "guidance_scale": guidance,
        "image_size": image_size,
    })
    # fal returns {"images":[{"url":..., "content_type":"image/jpeg", ...}]}
    url = out["images"][0]["url"]
    import urllib.request
    return urllib.request.urlopen(url).read()


def gen_clip(image_url: str, motion_prompt: str, aspect_ratio: str = "16:9",
             num_frames: int = 81, fps: int = 16) -> str:
    """Generate a Wan2.2-I2V clip from an image URL. Returns the mp4 URL."""
    _ensure_key()
    out = fal_client.subscribe(WAN_MODEL, arguments={
        "prompt": motion_prompt,
        "image_url": image_url,
        "negative_prompt": NEGATIVE,
        "aspect_ratio": aspect_ratio,
        "num_frames": num_frames,
        "fps": fps,
    })
    # fal returns {"video":{"url":..., "content_type":"video/mp4", ...}}
    return out["video"]["url"]


def gen_voice(text: str, exaggeration: float = 0.5, temperature: float = 0.7) -> str:
    """Generate @Sage's voice line via Chatterbox (MIT) on fal.ai. Returns the .wav URL.

    Voice character (brief VOICE line): chill, warm, encouraging. We tune Chatterbox's
    built-in default voice (NO cloning — brief forbids cloning a real person, and rule 9
    bans non-MIT voices). exaggeration ~0.5 = warm/calm, not excitable. The closeness to
    the ManuAGI ElevenLabs-style narration comes from the calm delivery + clear script style,
    not a cloned voiceprint.
    """
    _ensure_key()
    out = fal_client.subscribe(VOICE_MODEL, arguments={
        "text": text,
        "exaggeration": exaggeration,
        "temperature": temperature,
    })
    # fal returns {"audio":{"url":..., "content_type":"audio/wav", ...}}
    return out["audio"]["url"]


def quantize_to_palette(src_png: str, dst_png: str) -> dict:
    """Snap every pixel of src_png to the nearest of the 7 PALETTE hexes -> dst_png.
    Returns a coverage report: counts per hex + the % that matches exactly (==100%)."""
    im = Image.open(src_png).convert("RGB")
    px = im.load()
    W, H = im.size
    counts = {k: 0 for k in _PALETTE_RGB}
    exact = 0
    for y in range(H):
        for x in range(W):
            r, g, b = px[x, y]
            best_k, best_v = min(
                _PALETTE_RGB.items(),
                key=lambda kv: (kv[1][0] - r) ** 2 + (kv[1][1] - g) ** 2 + (kv[1][2] - b) ** 2,
            )
            if (r, g, b) == best_v:
                exact += 1
            counts[best_k] += 1
            px[x, y] = best_v
    im.save(dst_png)
    total = W * H
    return {
        "total_pixels": total,
        "exact_before_quantize": exact,
        "exact_after_pct": 100.0,  # by construction
        "per_hex_counts": counts,
        "off_palette_after": 0,
    }


if __name__ == "__main__":
    print("fal_common OK — FLUX:", FLUX_MODEL, "WAN:", WAN_MODEL)
    print("palette hexes:", list(PALETTE.values()))
