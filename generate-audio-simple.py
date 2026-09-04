#!/usr/bin/env python3
"""
Generate teacher voice audio for guitar lessons using Kokoro TTS.
Simple, focused version - generates WAV files from lesson coaching copy.
"""

import json
import os
import sys
from pathlib import Path

# Test kokoro import
try:
    from kokoro import Kokoro
    print(f"✓ Kokoro TTS loaded successfully")
except ImportError as e:
    print(f"ERROR: Failed to import Kokoro: {e}", file=sys.stderr)
    sys.exit(1)

# Audio dependencies
try:
    import numpy as np
    from scipy.io import wavfile
    print(f"✓ NumPy and SciPy loaded successfully")
except ImportError as e:
    print(f"ERROR: Failed to import audio dependencies: {e}", file=sys.stderr)
    sys.exit(1)

PROJECT_ROOT = Path(__file__).parent
CONTENT_DIR = PROJECT_ROOT / "05-content"
AUDIO_OUT_DIR = PROJECT_ROOT / "07-app" / "audio"

# Create output directory
AUDIO_OUT_DIR.mkdir(parents=True, exist_ok=True)

# Initialize Kokoro
print("Initializing Kokoro TTS (CPU mode)...")
kokoro = Kokoro(lang="en-US", device="cpu")
print(f"✓ Kokoro ready. Available voices: {kokoro.voices if hasattr(kokoro, 'voices') else 'default'}")

def sanitize_for_tts(text):
    """Make text TTS-friendly."""
    if not text:
        return ""
    # Expand chord symbols
    replacements = {
        "Em": "E minor", "Am": "A minor", "Dm": "D minor",
        "A7": "A seven", "E7": "E seven", "G7": "G seven",
        "C7": "C seven", "F7": "F seven", "D7": "D seven",
        "—": " ", "'": "'", '"': '"'
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    return text.strip()

def generate_lesson_audio(lesson_num, lesson_file):
    """Generate all audio files for one lesson."""
    try:
        with open(lesson_file, 'r', encoding='utf-8') as f:
            lesson = json.load(f)
    except Exception as e:
        print(f"  ERROR reading lesson file: {e}")
        return

    if "avatar_coaching_copy" not in lesson:
        print(f"  SKIP: No coaching copy found")
        return

    coaching = lesson["avatar_coaching_copy"]
    lesson_audio_dir = AUDIO_OUT_DIR / f"l{lesson_num:02d}-voice"
    lesson_audio_dir.mkdir(parents=True, exist_ok=True)

    print(f"\n  Generating voice files...")
    generated_files = []

    for key in sorted(coaching.keys()):
        text = coaching.get(key, "")
        if not isinstance(text, str) or not text.strip():
            continue

        # Create output filename
        if key == "intro":
            filename = f"l{lesson_num:02d}-00-intro.wav"
        elif key == "results":
            filename = f"l{lesson_num:02d}-99-results.wav"
        elif key == "wrap":
            filename = f"l{lesson_num:02d}-99-wrap.wav"
        elif key.startswith("ex") and "_intro" in key:
            ex_num = key.replace("ex", "").replace("_intro", "")
            try:
                ex_idx = int(ex_num) + 1
                filename = f"l{lesson_num:02d}-{ex_idx:02d}-ex{ex_num}.wav"
            except:
                filename = f"l{lesson_num:02d}-{key}.wav"
        else:
            filename = f"l{lesson_num:02d}-{key}.wav"

        filepath = lesson_audio_dir / filename

        # Skip if exists
        if filepath.exists():
            print(f"    - {filename} [exists, skipping]")
            generated_files.append(filepath)
            continue

        try:
            sanitized = sanitize_for_tts(text)
            print(f"    - Generating {filename}...", end=" ", flush=True)

            # Generate audio with Kokoro
            # Using default voice parameters
            audio = kokoro.create(sanitized, voice="af", speed=1.0)

            # Get sample rate (Kokoro default is 24000)
            sample_rate = 24000

            # Convert audio to int16 and save
            if isinstance(audio, np.ndarray):
                audio_data = audio
            else:
                audio_data = np.array(audio)

            # Normalize if needed
            if audio_data.dtype == np.float32 or audio_data.dtype == np.float64:
                audio_data = np.clip(audio_data * 32767, -32768, 32767).astype(np.int16)
            else:
                audio_data = audio_data.astype(np.int16)

            wavfile.write(str(filepath), sample_rate, audio_data)
            duration = len(audio_data) / sample_rate
            print(f"✓ ({duration:.1f}s)")
            generated_files.append(filepath)

        except Exception as e:
            print(f"ERROR: {e}")
            continue

    # Create full lesson audio by concatenating
    if generated_files and len(generated_files) > 1:
        print(f"  Creating full lesson audio...", end=" ", flush=True)
        try:
            full_file = lesson_audio_dir / f"l{lesson_num:02d}-full.wav"
            all_audio = []

            for audio_file in generated_files:
                sr, audio = wavfile.read(str(audio_file))
                if audio.dtype != np.float32:
                    audio = audio.astype(np.float32) / 32768.0
                all_audio.append(audio)

            # Add short silence between clips (0.3 seconds)
            silence = np.zeros(int(24000 * 0.3), dtype=np.float32)
            combined = np.concatenate(
                [item for pair in zip(all_audio, [silence] * len(all_audio)) for item in pair][:-1]
            )

            combined_int16 = np.clip(combined * 32767, -32768, 32767).astype(np.int16)
            wavfile.write(str(full_file), 24000, combined_int16)
            print("✓")
        except Exception as e:
            print(f"ERROR: {e}")

def main():
    """Generate audio for all lessons."""
    print("=" * 60)
    print("GuitarApp Audio Generation - Kokoro TTS")
    print("=" * 60)

    # Find all lesson files
    lesson_files = sorted(CONTENT_DIR.glob("guitar-lesson-*.json"))
    if not lesson_files:
        print(f"ERROR: No lessons found in {CONTENT_DIR}")
        sys.exit(1)

    print(f"\nFound {len(lesson_files)} lessons to process\n")

    # Generate for each lesson
    for i, lesson_file in enumerate(lesson_files, 1):
        print(f"Lesson {i:2d}/25: {lesson_file.name}")
        generate_lesson_audio(i, lesson_file)

    print("\n" + "=" * 60)
    print("✓ Audio generation complete!")
    print(f"Output: {AUDIO_OUT_DIR}")
    print("=" * 60)

if __name__ == "__main__":
    main()
