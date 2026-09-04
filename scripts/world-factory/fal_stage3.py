#!/usr/bin/env python3
"""
fal_stage3.py — World 1 (Emerald Hollow) @Sage voice via Chatterbox (MIT) on fal.ai.

Renders @Sage's spoken lines with Chatterbox's built-in default voice, tuned warm/calm
(exaggeration 0.5). NO voice cloning — the brief forbids cloning a real person, and
AGENTS.md rule 9 bans non-MIT voices (ElevenLabs excluded). Chatterbox MIT weights are
the approved shipping voice; it matches the warm ElevenLabs-style narration quality the
owner referenced, legally. The closeness comes from calm delivery + clear script style.

Lines (from world-brief-emerald-hollow-L1.md cold-open + L2, written in a warm, clear
reader tone). Rule 5: praise lines cite a stored number slot, never freelance a musical
opinion. For the demo we render a templated version with a placeholder; wire to
practiceStore at integration.

Output: 07-app/assets/worlds/emerald-hollow/voice/*.wav  (+ voice/manifest.json)

Run:
  python fal_stage3.py
"""
import os
import sys
import json
import argparse

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import fal_common as fc

VOICE_DIR = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "..", "..", "07-app", "assets",
    "worlds", "emerald-hollow", "voice",
)

# @Sage lines. Each = (filename, text, register). Two registers per AMENDMENT-18 BI-5
# (kid-warm vs adult-peer) — same voice, different warmth. Demo renders both variants
# for the welcome + praise lines; ambient lines are single.
LINES = [
    # Cold-open BLOCK 01 — Sage looks up, small wave.
    ("B01_welcome_adult", "Hey, you made it. Grab a seat on the porch, and let's play.", "adult"),
    ("B01_welcome_kid",   "Hey, you made it! Come sit on the porch with me, and we'll play.", "kid"),
    # Cold-open BLOCK 02 — after the strum.
    ("B02_youvegotthis",  "There it is. That's your first chord. You've got this.", "adult"),
    # Reusable L2 welcome.
    ("sage_welcome",      "Glad you're here. Take a breath, and let's make some music together.", "adult"),
    # Rule-5 praise line — cites a number slot, no musical freelancing.
    ("sage_praise_progress",
     "Your Em took five tries last week, and two today. That's real progress, and I'm proud of it.",
     "adult"),
]


def stage3():
    os.makedirs(VOICE_DIR, exist_ok=True)
    manifest = []
    for name, text, register in LINES:
        print(f"[stage3] '{name}' ({register}): {text}", flush=True)
        url = fc.gen_voice(text, exaggeration=0.5, temperature=0.7)
        wav_path = os.path.join(VOICE_DIR, f"{name}.wav")
        # download the wav (curl is reliable here; python urllib had transient timeouts)
        import subprocess
        r = subprocess.run(["curl", "-s", "-m", "60", "-o", wav_path, url],
                           capture_output=True, text=True)
        if r.returncode != 0 or not os.path.exists(wav_path):
            raise RuntimeError(f"voice download failed for {name}: {r.stderr}")
        manifest.append({
            "line": name,
            "text": text,
            "register": register,
            "model": "chatterbox",
            "fal_model": fc.VOICE_MODEL,
            "license": "MIT",
            "exaggeration": 0.5,
            "temperature": 0.7,
            "file": os.path.relpath(wav_path, os.path.dirname(VOICE_DIR)),
            "bytes": os.path.getsize(wav_path),
        })
        print(f"[stage3]   -> {wav_path} ({os.path.getsize(wav_path)} bytes)", flush=True)

    manifest_path = os.path.join(VOICE_DIR, "manifest.json")
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)
    print(f"[stage3] wrote {len(manifest)} lines -> {manifest_path}", flush=True)
    return manifest


def main():
    ap = argparse.ArgumentParser()
    ap.parse_args()
    stage3()
    print("DONE_STAGE3")


if __name__ == "__main__":
    main()
