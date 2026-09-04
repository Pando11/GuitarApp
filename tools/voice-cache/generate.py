#!/usr/bin/env python3
"""
GuitarApp voice-cache generator (SKELETON — not runnable on the project PC).

WHAT IT DOES
  Walk lesson JSONs, pull every STATIC spoken teacher line
  (avatar_coaching_copy + exercises[].coaching), generate each ONCE with
  Chatterbox on a GPU, upload the clip to Cloudflare R2, and write a manifest
  mapping text -> R2 URL so app.js can stream cached audio instead of calling
  /api/tts live.

WHY THIS SAVES MONEY
  Static teacher lines are identical for every student. Generate once, serve
  forever. See docs/costing/VOICE-CACHE-PIPELINE.md.

REQUIREMENTS (NOT met on the project PC — no GPU, no lesson JSONs here)
  - GPU machine with Chatterbox installed (weights at ~/chatterbox-weights)
  - boto3 configured for Cloudflare R2 (account id + API token)
  - A populated 07-app/content/lessons/ directory

Run:  python generate.py --lessons 07-app/content/lessons --bucket guitarapp-voice
"""

import argparse
import hashlib
import json
import os

# ---- CONFIG (fill in on the GPU machine) ----
CHATTERBOX_WEIGHTS = os.path.expanduser("~/chatterbox-weights")
R2_ENDPOINT = "https://<accountid>.r2.cloudflarestorage.com"
R2_BUCKET = "guitarapp-voice"
VOICE = "chatterbox-builtin"  # Sage's single built-in voice (MIT, no cloning)


def collect_lines(lessons_dir):
    """Yield (lesson_id, text) for every static spoken teacher line."""
    lines = []
    for fn in sorted(os.listdir(lessons_dir)):
        if not fn.endswith(".json"):
            continue
        with open(os.path.join(lessons_dir, fn), encoding="utf-8") as f:
            lesson = json.load(f)
        lid = lesson.get("id", fn)
        copy = lesson.get("avatar_coaching_copy")
        if copy:
            lines.append((lid, copy))
        for ex in lesson.get("exercises", []):
            c = ex.get("coaching")
            if c:
                lines.append((lid, c))
    return lines


def key_for(text):
    return hashlib.sha256((VOICE + "|" + text).encode()).hexdigest()[:16]


def generate_clip(text, model):
    """Generate one ogg clip via Chatterbox. Returns raw audio bytes."""
    # Real call would be: model.generate(text=text, voice=VOICE) -> wav tensor
    # then encode to ogg. Placeholder returns None until run on GPU.
    raise NotImplementedError("Run on a GPU machine with Chatterbox installed.")


def upload_to_r2(key, audio_bytes):
    import boto3
    s3 = boto3.client("s3", endpoint_url=R2_ENDPOINT,
                      aws_access_key_id=os.environ["R2_ACCESS_KEY"],
                      aws_secret_access_key=os.environ["R2_SECRET_KEY"])
    s3.put_object(Bucket=R2_BUCKET, Key=f"audio/{key}.ogg",
                  Body=audio_bytes, ContentType="audio/ogg")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--lessons", required=True)
    ap.add_argument("--bucket", default=R2_BUCKET)
    args = ap.parse_args()

    lines = collect_lines(args.lessons)
    manifest = {}
    model = None  # lazy-load Chatterbox only on GPU machine
    for lid, text in lines:
        k = key_for(text)
        if k in manifest:
            continue
        audio = generate_clip(text, model)        # GPU work, ONE TIME
        upload_to_r2(k, audio)
        manifest[text] = f"https://<cdn>/{k}.ogg"

    with open("voice-cache-manifest.json", "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
    print(f"Wrote manifest: {len(manifest)} unique static lines.")


if __name__ == "__main__":
    main()
