REPO ROOT (your workdir): C:/Users/Hendrickson/Desktop/GuitarApp

LEGAL FLOOR (never violate):
- Rule 5: prose only, cite stored numbers, never invent musical opinion.
- Rule 9: commercial-clean + free ONLY (you are wiring/transcoding, NOT generating new assets).
- Rule 2: no camera/hand tracking.
- Rule 8: chord correctness via arithmetic checker, 0 errors/0 warnings to ship.

VERIFIED ON DISK 2026-08-30 (trust these, do not re-litigate):
- 3 Wan2.2 clips at 07-app/assets/worlds/emerald-hollow/clips/ : B00_walkin.mp4, B01_meetsage.mp4, B02_twoshot.mp4
- ffmpeg present at C:/Users/Hendrickson/AppData/Local/Microsoft/WinGet/Links/ffmpeg.exe
- Godot binary MISSING: C:/Users/Hendrickson/godot/godot.exe does NOT exist
- 07-app/assets/lessons/ is EMPTY (L01-open-c.* does NOT exist)
- 4 FLUX stills + 5 Chatterbox wavs also in emerald-hollow/

TASKS:
1. Transcode each mp4 to Theora .ogv (Godot 4 imports ONLY .ogv, NOT mp4/webm). For Bxx in {B00_walkin, B01_meetsage, B02_twoshot} run:
   C:/Users/Hendrickson/AppData/Local/Microsoft/WinGet/Links/ffmpeg.exe -i 07-app/assets/worlds/emerald-hollow/clips/Bxx.mp4 -c:v libtheora -q:v 7 -pix_fmt yuv420p 07-app/assets/worlds/emerald-hollow/clips/Bxx.ogv
   Confirm each .ogv produced with a non-zero byte size.

2. Wire scenes to REAL produced asset paths:
   - 07-app/godot/world/World.tscn
   - 07-app/godot/lesson/LessonScene.tscn
   - 07-app/godot/data/lesson_manifest.json
   Update any reference to res://assets/lessons/L01-open-c.mp4 or placeholder .ogv clips so the cold-open / world clips point at res://assets/worlds/emerald-hollow/clips/Bxx.ogv (the files you just produced).

3. FIX lesson_manifest.json: the W1-coldopen clips array references .ogv — confirm those map to your transcoded Bxx.ogv files. The L01-open-c entry references res://assets/lessons/L01-open-c.mp4 which DOES NOT exist (assets/lessons/ empty) -> leave a FLAGGED TODO comment in the manifest (e.g. // TODO(BLOCKED): res://assets/lessons/L01-open-c.mp4 not generated yet - assets/lessons/ is empty), do NOT fabricate the file.

4. Godot binary is verified MISSING -> do NOT attempt to run godot. Report run-verify as BLOCKED (binary missing) and state the build is statically complete but unverified-in-engine.

REPORT (verifiable handles, no claims):
- Absolute paths + byte sizes of the 3 produced .ogv files (ls -la output)
- Manifest diff: the before/after key lines you changed (paste the exact old and new lines)
- Explicit BLOCKED statement for in-engine run-verify with the reason (binary missing)
