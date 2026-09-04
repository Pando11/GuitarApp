#!/usr/bin/env python3
"""
Generate teacher voice audio for all 25 guitar lessons using Kokoro TTS.
Reads lesson JSON files from 05-content/, generates WAV files for each voice line.
"""

import json
import os
from pathlib import Path
import sys

try:
    from kokoro import KokoroTTS
except ImportError:
    print("ERROR: kokoro-onnx not installed. Run: pip install kokoro-onnx torch numpy scipy")
    sys.exit(1)

# Initialize Kokoro with default voice (female, calm)
tts = KokoroTTS(device="cpu", lang="en-US")

# Paths
PROJECT_ROOT = Path(__file__).parent
CONTENT_DIR = PROJECT_ROOT / "05-content"
AUDIO_OUT_DIR = PROJECT_ROOT / "07-app" / "audio"
LESSONS_DIR = CONTENT_DIR

# Create audio output directory if needed
AUDIO_OUT_DIR.mkdir(parents=True, exist_ok=True)

def normalize_for_tts(text):
    """Convert coaching copy for TTS readability."""
    if not text:
        return ""
    # Expand chord symbols for TTS
    text = text.replace("Em", "E minor")
    text = text.replace("Am", "A minor")
    text = text.replace("Dm", "D minor")
    text = text.replace("A7", "A seven")
    text = text.replace("E7", "E seven")
    text = text.replace("G7", "G seven")
    text = text.replace("C7", "C seven")
    text = text.replace("F7", "F seven")
    text = text.replace("D7", "D seven")
    # Clean up em-dashes and ellipsis
    text = text.replace("—", " ")
    text = text.replace("'", "'")
    return text

def generate_lesson_audio(lesson_num, lesson_file):
    """Generate audio for a single lesson."""
    with open(lesson_file, 'r') as f:
        lesson_data = json.load(f)

    if "avatar_coaching_copy" not in lesson_data:
        print(f"  SKIP: No avatar_coaching_copy in lesson {lesson_num}")
        return

    coaching = lesson_data["avatar_coaching_copy"]
    lesson_id = lesson_data.get("lesson", {}).get("id", f"L{lesson_num:02d}")

    # Create lesson audio directory
    lesson_audio_dir = AUDIO_OUT_DIR / f"l{lesson_num:02d}-voice"
    lesson_audio_dir.mkdir(parents=True, exist_ok=True)

    # Generate audio for each coaching line
    voice_lines = []
    for key in sorted(coaching.keys()):
        text = coaching[key]
        if not text or not isinstance(text, str):
            continue

        # Generate filename
        if key == "intro":
            filename = f"l{lesson_num:02d}-00-intro.wav"
        elif key == "results":
            filename = f"l{lesson_num:02d}-99-results.wav"
        elif key == "wrap":
            filename = f"l{lesson_num:02d}-99-wrap.wav"
        elif key.startswith("ex") and key.endswith("_intro"):
            ex_num = key.replace("ex", "").replace("_intro", "")
            filename = f"l{lesson_num:02d}-{int(ex_num)+1:02d}-exercise-{ex_num}.wav"
        else:
            filename = f"l{lesson_num:02d}-{key}.wav"

        filepath = lesson_audio_dir / filename

        # Skip if already generated
        if filepath.exists():
            print(f"  SKIP: {filename} (already exists)")
            voice_lines.append((key, str(filepath)))
            continue

        try:
            # Normalize text for TTS
            normalized = normalize_for_tts(text)

            # Generate audio (Kokoro returns audio data and sample rate)
            print(f"  Generating {filename}...", end=" ", flush=True)
            audio_data, sample_rate = tts.create(normalized, voice="af_bella", speed=1.0)

            # Save as WAV (using scipy.io.wavfile if available)
            try:
                from scipy.io import wavfile
                import numpy as np

                # Convert to 16-bit PCM
                audio_int16 = np.clip(audio_data * 32767, -32768, 32767).astype(np.int16)
                wavfile.write(str(filepath), sample_rate, audio_int16)

                # Get duration
                duration = len(audio_data) / sample_rate
                print(f"✓ ({duration:.1f}s)")
                voice_lines.append((key, str(filepath)))
            except ImportError:
                print("ERROR: scipy not installed")
                return False
        except Exception as e:
            print(f"ERROR: {e}")
            continue

    # Generate full-lesson WAV (concatenate all parts)
    if voice_lines:
        try:
            print(f"  Building full lesson audio...", end=" ", flush=True)
            full_audio_file = lesson_audio_dir / f"l{lesson_num:02d}-full.wav"

            from scipy.io import wavfile
            import numpy as np

            all_audio = []
            sample_rate = None

            for key, filepath in voice_lines:
                sr, audio = wavfile.read(filepath)
                if sample_rate is None:
                    sample_rate = sr
                if audio.dtype != np.float32:
                    audio = audio.astype(np.float32) / 32768.0
                all_audio.append(audio)

            # Concatenate with small silence between clips (0.5s)
            silence = np.zeros(int(0.5 * sample_rate), dtype=np.float32)
            combined = np.concatenate([item for pair in zip(all_audio, [silence]*len(all_audio)) for item in pair])

            combined_int16 = np.clip(combined * 32767, -32768, 32767).astype(np.int16)
            wavfile.write(str(full_audio_file), sample_rate, combined_int16)
            print(f"✓")
        except Exception as e:
            print(f"ERROR: {e}")

    return True

def main():
    """Generate audio for all 25 lessons."""
    print("GuitarApp Audio Generation — Kokoro TTS")
    print("=" * 50)

    # Find all lesson files
    lesson_files = sorted(LESSONS_DIR.glob("guitar-lesson-*.json"))
    if not lesson_files:
        print(f"ERROR: No lesson files found in {LESSONS_DIR}")
        sys.exit(1)

    print(f"Found {len(lesson_files)} lessons")
    print()

    # Generate audio for each lesson
    for i, lesson_file in enumerate(lesson_files, 1):
        print(f"Lesson {i:2d}: {lesson_file.name}")
        generate_lesson_audio(i, lesson_file)
        print()

    print("=" * 50)
    print("Audio generation complete!")
    print(f"Output: {AUDIO_OUT_DIR}")

if __name__ == "__main__":
    main()
