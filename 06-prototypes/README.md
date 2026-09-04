# 06-prototypes — What to open

Double-click any HTML below (they are `file://` prototypes, no server needed).
Latest first.

## ★ CURRENT / RECOMMENDED
- **`lesson-director-v4.html`** — the "Lesson Director" (AI-native pipeline, Camp 3).
  Pick a lesson (C / G / Am) from the dropdown → director reads lesson JSON → emits a
  scene manifest → renderer animates it (AI style frame + teacher + data-driven fretboard).
  Proves the lesson scales without hand-built scenes. Assets in `assets/`.
  Auto-plays L01 on open. Buttons: Direct this lesson · Speak (TTS) · Frame AI/sim.

## PRIOR ITERATIONS (history — do not cite as current)
- `lesson-scene-movie-v3.html` — single-scene movie proof (one C-chord lesson, AI frame wired in).
- `animated-teacher-demo-v2.html` — character "Riff" 4 expressions, gestures, lip-sync (Amendment 02 format proof).
- `animated-teacher-demo.html` — first teacher demo.
- `guitar-lesson-01.html`, `guitar-lesson-01-demo.html`, `guitar-lesson-prototype.html`, `GuitarApp_OS.html` — earlier sketches.

## Assets
- `assets/studio_golden_hour.png` — AI frame, "encouraging" mood (REAL generated)
- `assets/midnight_practice.png` — AI frame, "focused" mood (REAL generated)
- `assets/greenroom.png` — AI frame, "calm" mood (REAL generated)
- `assets/preview-director.png` — static screenshot of v4 for quick reference
- `assets/lesson-director-demo.mp4` — 11s screen recording of v4 playing (C lesson)
- `assets/lesson-director-demo.gif` — same, as a looping GIF for inline sharing

Note: the GIF/MP4 are RENDERED CAPTURES of the live HTML, not the live app.
Open `lesson-director-v4.html` (or `open-demo.bat`) for the interactive version
where you can switch lessons and trigger TTS.

## How to view live
Double-click `lesson-director-v4.html`, OR run `open-demo.bat` in this folder.
Note: prototype animation needs a real browser; the `.png` is only a still.

## Stack used (open-source, $0)
GSAP (free, Webflow 2025) · Lottie (MIT) · SVG/CSS · AI frames FLUX-class (Apache-2.0 path).
Rive intentionally excluded (membership export fee). See 02-spec/AMENDMENT-03.md.
