# HANDOFF — L02 Voice Bug Fix ("m") + Warm/Human Rewrite + Realistic Voice (Part B)

Date: 2026-08-09 · Owner: Heidi · App: GuitarApp (Desktop/GuitarApp)
Session: fixed the "voice says m" bug + made L02 warm/human + proved realistic voice path.

## THE BUG (what owner reported)
L02 voice read "Em" as the letters E + "m" → student heard **"m"**. Confirmed at source:
- `speak()` in `07-app/audio/audioio.js` passed raw coaching text (full of bare chord
  symbols like "Em", "C", "G") straight to the speech engine. No normalizer existed.
- Affected ALL 20 lessons (every lesson JSON has bare chord symbols in spoken copy).

## FIX A — TTS normalizer (one chokepoint, covers all 20 lessons)
- NEW FILE: `07-app/audio/tts-normalize.js` — `normalizeForTTS(text)`.
  Maps Em→"E minor", Am→"A minor", C→"C major", G→"G major", etc.
- Wired into `07-app/audio/audioio.js` `speak()` — applied to BOTH the OpenAI-TTS path
  AND the browser speechSynthesis fallback (variable renamed `text`→`spoken`).
- Conservatively guarded so it NEVER mangles legit text:
  - "a" article untouched (lowercase).
  - "easy C" teaching label protected.
  - Already-expanded ("C major") not doubled.
  - Guitar string/note names protected: "A string", "low E", "high e", "A second fret",
    "G note", "E 2" shorthand, etc. — NOT turned into "A major string"/"low E major".
  - "the A chord" DOES expand to "A major chord" (real chord usage).
- TEST: `07-app/audio/tts-normalize.test.mjs` — **12 passed, 0 failed** (node).
- APP GATE: `cd 07-app && node test/fidelity.mjs` — **48 passed, 0 failed** (normalizer
  edit did not break the app).

## FIX A-2 — L02 warm/human copy rewrite
- FILE: `05-content/guitar-lesson-02-first-chord-em.json` (and mirror in
  `07-app/content/lessons/`).
- Rewrote all spoken copy (intro/ex1_intro/ex2_intro/results/wrap + exercise coaching)
  to be warm, human-to-human, flowing. Added connective tissue + acknowledgment
  ("Every guitarist started here", "I'm proud of that — and I mean it").
- ALL chord names written as WORDS ("E minor") in spoken copy — no bare symbols.
- Verified: 0 dangerous bare-chord tokens remain in L02 spoken copy (python audit).
- L02 still passes schema validate + chord-theory-check (gates green).

## FIX B — Realistic warm voice (AMENDMENT-06 shipping voice path)
- VOICE ENGINE: Kokoro-82M (Apache-2.0) — license-clean CPU fallback per AGENTS Rule 9.
  (Chatterbox MIT is the production target but needs ~6GB VRAM; desktop GTX 970 = 4GB,
  so Kokoro proves the warm-voice path here; swap to Chatterbox on a GPU host later.)
- SCRIPT: `07-app/audio/generate-warm-voice.py` — generates 7 WAVs from the warm L02 copy
  (af_heart warm female US voice).
- OUTPUT: `07-app/audio/l02-voice/` — l02-01..06-*.wav + l02-full.wav (real, non-silent).
- ASR PROOF (honest): transcribed l02-02-teach-shape.wav with whisper tiny →
  "...That shape is e minor. It already looks like a guitar cord, doesn't it?"
  CONTAINS 'E MINOR': True · ENDS_IN_BARE_M: False. Bug provably gone in real audio.
- VENV: `.venv-kokoro/` (uv). Activate: `. .venv-kokoro/Scripts/activate`.

## DELIVERABLE (what owner opens)
- `06-prototypes/lesson-02-warm-flow-demo.html` — double-click `file://` playable demo.
  Warm smiling avatar (rendered + verified via headless Chromium screenshot), code-driven
  fretboard, 6 flowing scenes, in-page normalizer confirmed ("That is Em."→"That is E minor."),
  0 console errors. Browser ▶ = default TTS w/ normalization; production = warm Kokoro/Chatterbox.
- Screenshot: `06-prototypes/lesson-02-warm-shot.png`.

## HOW TO RE-RUN PROOFS (next session / hostile verify)
1. node 07-app/audio/tts-normalize.test.mjs        → expect 12/12
2. cd 07-app && node test/fidelity.mjs              → expect 48/48
3. node 06-prototypes/render-warm.js (or python playwright on the .html) → 0 console errors
4. . .venv-kokoro/Scripts/activate && python 07-app/audio/generate-warm-voice.py → regen WAVs

## OPEN / NEXT
- The other 19 lessons still contain bare chord symbols in spoken copy, BUT the normalizer
  at the speak() chokepoint handles them all correctly (verified on L06 worst case:
  A,B,C,D,E,Em,G + "low E"/"high e" all correct). No per-lesson copy edit required for
  the "m" bug — only L02 got the warm rewrite (owner's explicit ask was L02 + flow).
- If owner wants ALL 20 lessons warm (not just L02), that's a copy-pass task, separate.
- Production voice swap: wire Chatterbox (MIT) on a GPU host; same generate-warm-voice.py
  shape, different backend. Desktop 970 can't run it (~4GB vs ~6GB needed).

## FILES CHANGED (git status will show)
- 07-app/audio/tts-normalize.js            (NEW)
- 07-app/audio/tts-normalize.test.mjs     (NEW)
- 07-app/audio/audioio.js                 (MODIFIED — speak() normalizes)
- 05-content/guitar-lesson-02-first-chord-em.json   (MODIFIED — warm copy)
- 07-app/content/lessons/guitar-lesson-02-first-chord-em.json (mirror, should match)
- 07-app/audio/generate-warm-voice.py     (NEW)
- 07-app/audio/l02-voice/*.wav            (NEW — 7 files)
- 06-prototypes/lesson-02-warm-flow-demo.html (NEW)
- 06-prototypes/render-warm.js            (NEW — playwright check)
- .venv-kokoro/                            (NEW venv, gitignore candidate)
