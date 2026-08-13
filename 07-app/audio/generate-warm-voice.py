#!/usr/bin/env python3
"""
Generate warm, human-like voice audio for GuitarApp L02.

Uses Kokoro-82M (Apache-2.0) — the approved CPU-viable, license-clean fallback
per AGENTS Rule 9 / AMENDMENT-06. Chatterbox (MIT, shipping voice) is the
production target but needs ~6GB VRAM; the desktop GTX 970 has 4GB, so we prove
the warm-voice path with Kokoro here and swap to Chatterbox on a GPU host.

ROOT-CAUSE FIX (2026-08-11): the spoken copy is NO LONGER hardcoded here. It is
read from the lesson JSON (07-app/content/lessons/guitar-lesson-02-first-chord-em.json)
— the single source of truth — so the audio can never silently drift from the
chords/fingers data (the bug class where a stale "fourth finger" wav shipped while
the JSON said "ring finger"). The fretboard diagram and the voice now come from the
same file; 04-validation/verify-finger-copy.js proves the finger NAMES in the copy
match the finger NUMBERS in the data before ship.

Output: 07-app/audio/l02-voice/l02-*.wav (one per scene) + l02-full.wav (concatenated).
"""
import os, sys, json

try:
    from kokoro import KPipeline
    import soundfile as sf
    import numpy as np
except ImportError as e:
    print(f"IMPORT_FAIL: {e}")
    sys.exit(2)

HERE = os.path.dirname(__file__)
OUT = os.path.join(HERE, "l02-voice")
os.makedirs(OUT, exist_ok=True)

LESSON_JSON = os.path.join(HERE, "..", "content", "lessons", "guitar-lesson-02-first-chord-em.json")

def load_scenes():
    with open(LESSON_JSON, "r", encoding="utf-8") as fh:
        lesson = json.load(fh)
    copy = lesson.get("avatar_coaching_copy", {})
    practice = ("Your turn now. Hold E minor and strum down four times. "
                "Go slow, keep your wrist loose. If it buzzes, that's fine. "
                "You're building the muscle. I'll wait.")
    scenes = {
        "01-intro": copy.get("intro", ""),
        "02-teach-shape": copy.get("ex1_intro", ""),
        "03-teach-strum": copy.get("ex2_intro", ""),
        "04-practice": practice,
        "05-praise": copy.get("results", ""),
        "06-wrap": copy.get("wrap", ""),
    }
    missing = [k for k, v in scenes.items() if not v.strip()]
    if missing:
        print(f"WARN: empty copy fields: {missing} (check {os.path.basename(LESSON_JSON)})")
    return scenes

VOICE = "af_heart"  # warm female US; 'am_eric' = warm male US.

def main():
    scenes = load_scenes()
    pipeline = KPipeline(lang_code="a")
    full = []
    for key, text in scenes.items():
        if not text.strip():
            print(f"  SKIP {key} (empty)")
            continue
        print(f"  generating {key} ...")
        chunks = list(pipeline(text, voice=VOICE, speed=0.95, split_pattern=r"[.?!]"))
        audio_segs = [c[2] for c in chunks if c[2] is not None]
        if not audio_segs:
            print(f"  WARN: no audio for {key}")
            continue
        audio = np.concatenate(audio_segs)
        path = os.path.join(OUT, f"l02-{key}.wav")
        sf.write(path, audio, 24000)
        full.append(audio)
        print(f"  wrote {path} ({len(audio)/24000:.1f}s)")
    if full:
        sf.write(os.path.join(OUT, "l02-full.wav"), np.concatenate(full), 24000)
        print("  wrote l02-full.wav")
    print("DONE")

if __name__ == "__main__":
    main()
