# HANDOFF — 3 open items: (1) Warm all 20 lessons · (2) Chatterbox prod voice · (3) App won't open on double-click

Date: 2026-08-09 · Owner: Heidi · App: GuitarApp (Desktop/GuitarApp)
Prerequisite context: see `HANDOFF-2026-08-09-voice-warm-flow-fix.md` (the completed L02
"m" bug fix + warm rewrite + Kokoro voice proof). This handoff covers the THREE follow-ups.

====================================================================
ITEM 3 (DO FIRST — blocks owner from even seeing the app)
====================================================================
## SYMPTOM
Owner: "the app is not opening up." Double-clicking `07-app/index.html` shows a BLANK page.

## ROOT CAUSE (confirmed, not guessed)
`07-app/index.html` line 43: `<script type="module" src="app.js"></script>`.
ES modules are fetched with CORS, and **browsers refuse to load ES modules over `file://`**
(the double-click scheme). Result: module never executes → blank white screen, console error
like "Cross-Origin Request Blocked" / "Failed to load module script". This is NOT a code bug —
the app is healthy; it was never meant to be opened by double-click.

## FIX (verified)
The project already ships the correct launcher: `07-app/serve.mjs` (zero-dep Node static server).
1. cd Desktop/GuitarApp/07-app
2. node serve.mjs
3. Open http://localhost:8080/?dogfood=1   ← THIS is the URL, NOT the file path.
VERIFIED 2026-08-09: server returns HTTP 200 for index.html + app.js (text/javascript);
headless Chromium on http://localhost:8080/?dogfood=1 → title "GuitarApp — Learn Guitar",
app content mounted, **0 console errors**.

## ACTUAL OWNER SYMPTOM 2026-08-09 (the "⚠ Mic needs a secure connection" message)
This is NOT the double-click blank-page case. The app OPENS fine; the mic fails on click.
- Trigger: `navigator.mediaDevices` is `undefined` at click time → `app.js`/`audioio.js`
  `isMicAvailable()` is false → the "needs a secure connection" message fires.
- `navigator.mediaDevices` only exists in a **secure context**. `http://localhost` and
  `https://*` ARE secure; plain `http://LAN-IP` (e.g. http://192.168.1.72:8080) and
  `file://` are NOT. So the owner is almost certainly opening the **LAN-IP HTTP URL**
  or double-clicking the file — NOT `http://localhost:8080`.
- VERIFIED live: on `http://localhost:8080/?dogfood=1` the server returns HTTP 200 and
  localhost is a secure context by W3C spec, so the mic works with NO cert needed.
- SECONDARY REAL BUG (found while diagnosing): the app's own escape-hatch link points to
  `https://192.168.1.72:8443/?dogfood=1`, but `cert.pem` was generated with SAN
  `DNS:localhost, IP:127.0.0.1` ONLY — it does NOT list the LAN IP. So that "open secure
  version" link fails with a cert hostname-mismatch error. The escape hatch is itself broken
  for phone/LAN use. Fix = regenerate cert with the LAN IP in its SAN (see START.bat work).
- IMMEDIATE FIX for desktop: open exactly `http://localhost:8080/?dogfood=1`
  (not the 192.168.1.72 link). Mic works there with zero cert hassle.

## WHY NOT a double-click fix
The whole app is ES modules + a service worker (PWA) + mic API (getUserMedia), all of which
require a secure context. http://localhost IS secure; file:// is not. So the server is mandatory,
not optional. Do NOT "fix" by removing type="module" — that breaks the import graph.

## OPTIONS to make it more owner-friendly (recommend A)
- A) Add a one-line Windows launcher: `07-app/START.bat` containing
   `@echo off & cd /d "%~dp0" & node serve.mjs & start http://localhost:8080/?dogfood=1`
   (owner double-clicks the .bat). NOT YET CREATED — owner to approve.
- B) Document the node serve.mjs step in README §7 (already partially there).
- C) Leave as-is (owner runs node serve.mjs manually).

====================================================================
ITEM 1 — Warm all 20 lessons (L02 done; L01,L03–L20 pending)
====================================================================
## WHAT'S DONE
L02 (`05-content/guitar-lesson-02-first-chord-em.json`) already rewritten warm/human.
The "m" normalizer (07-app/audio/tts-normalize.js) covers ALL 20 lessons' spoken copy
automatically — so the pronunciation bug is dead app-wide WITHOUT this task. This task is
only about making the OTHER 19 lessons' *tone* as warm/human as L02.

## WHAT'S NEEDED (the copy pass)
For each of L01, L03–L20 (19 files in 05-content/ and their 07-app/content/lessons/ mirrors):
1. Rewrite `avatar_coaching_copy` (intro/exN_intro/results/wrap) + each exercise `coaching`
   to warm, human-to-human, flowing — mirror L02's voice:
   - Open with acknowledgment ("You're exactly where every guitarist started…").
   - Drop robotic instructionalese; use "I/we/you" naturally.
   - Add connective tissue between scenes (the "choppy, no flow" complaint).
   - End with genuine encouragement ("I mean it — that's a real win").
2. WRITE CHORD NAMES AS WORDS in all spoken fields ("E minor" not "Em"). The normalizer
   already saves pronunciation, but writing words is defense-in-depth AND reads cleaner in
   any caption surface. (Do NOT change on-screen symbol fields like `params.chord:"Em"` —
   those are data, not speech.)
3. Keep `qa_block.must_verify` noting warm-tone author pass + no-bare-symbol-in-spoken-copy.

## GUARDRAILS (from AGENTS.md)
- Chord fingerings stay arithmetically verified (chord-theory-check.js, 0 errors/0 warnings).
- No song material (licensing = existential risk, spec §3/R6).
- Teacher voice = OpenAI TTS per-call today; Kokoro/Chatterbox later (see Item 2).
- DO NOT change the cartoon/realistic avatar decision — that's OPEN per AMENDMENT-06; this
  task is copy only.

## VERIFY PER LESSON
- node 06-prototypes/step0/schema/validate.js <file>  → exit 0
- node 06-prototypes/step0/schema/chord-theory-check.js <file> → 0 errors, 0 warnings
- python audit (reuse from L02): 0 dangerous bare-chord tokens in spoken copy.
- Optionally regenerate that lesson's voice WAV via 07-app/audio/generate-warm-voice.py
  (extend it to take a lesson arg) to hear the new copy.

## ESTIMATE
19 lessons × ~3 spoken fields + 2–3 exercise coaching blocks. Batchable: can parallelize
across subagents (leaf) with the L02 file as the style template. Keep each subagent to a
range of lessons; verify with the gates above before committing.

====================================================================
ITEM 2 — Production realistic voice: wire Chatterbox (MIT, AMENDMENT-06)
====================================================================
## STATUS TODAY
Voice path proven with **Kokoro-82M** (Apache-2.0, CPU) — 7 warm L02 WAVs generated,
Whisper-confirmed "e minor" spoken correctly. Kokoro is the approved no-GPU fallback.

## TARGET (AMENDMENT-06, AGENTS Rule 9)
**Chatterbox (Resemble AI) — MIT on code AND weights** = THE shipping realistic voice
(zero-shot cloning + emotion). ~6GB VRAM needed. Desktop GTX 970 = 4GB → CANNOT run here.
Must run on a GPU host (cloud GPU, or the Acemagic S3A is iGPU-only so also no; rent cloud).

## WHAT TO BUILD
1. New `07-app/audio/tts-chatterbox.py` (or extend generate-warm-voice.py) that:
   - Loads ChatterboxTTS (pip: `chatterbox-tts`, MIT).
   - Takes lesson spoken copy → generates WAV per scene → concatenates.
   - Same warm copy input as Kokoro path (reuse the SCENES dict / lesson JSON reader).
2. Wire into `audioio.js speak()`: add a `provider:'chatterbox'` branch that fetches/plays
   a pre-generated WAV (or streams). Keep Kokoro + OpenAI + speechSynthesis as fallbacks.
   The normalizer (Item A) still applies BEFORE any TTS — Chatterbox gets "E minor" text too.
3. License: Chatterbox MIT = safe for paid app. Do NOT use XTTS-v2/F5/Fish/Piper/IndexTTS-2/
   Wav2Lip/FLUX.1-dev (blocklist, copyright law — survives all amendments).

## VERIFY
- Generated WAV non-silent (rms > 0.01).
- Whisper/transcribe a clip → chord names correct ("E minor"), no "m".
- App fidelity gate 48/48 still passes after wiring.

## BLOCKER
Needs a GPU host with ≥6GB VRAM + the chatterbox-tts pip install. Owner to provision
(cloud GPU) or defer until Acemagic replacement has a discrete GPU. NOT doable on this desktop.

====================================================================
FILES / COMMANDS REFERENCE
====================================================================
- Launch app:        cd 07-app && node serve.mjs  → http://localhost:8080/?dogfood=1
- "m" normalizer:    07-app/audio/tts-normalize.js  (test: node 07-app/audio/tts-normalize.test.mjs → 12/12)
- App gate:          cd 07-app && node test/fidelity.mjs  → 48/48
- Warm L02 demo:     06-prototypes/lesson-02-warm-flow-demo.html (file://, double-click OK — it's a standalone demo, not the app)
- Voice gen (Kokoro):. .venv-kokoro/Scripts/activate && python 07-app/audio/generate-warm-voice.py
- Lesson gates:      node 06-prototypes/step0/schema/validate.js <f>
                      node 06-prototypes/step0/schema/chord-theory-check.js <f>

## RECOMMENDED NEXT ORDER
1. Item 3 (add START.bat or document serve.mjs) — unblocks owner seeing the app. 30 min.
2. Item 1 (warm the other 19) — parallelizable copy pass; biggest UX lift after L02.
3. Item 2 (Chatterbox) — blocked on GPU host; do when provisioned.

## DECISIONS NEEDED FROM OWNER
- Item 3: approve START.bat launcher? (recommended)
- Item 1: warm all 19 now, or only a few priority lessons (e.g. L01 first-impression, L15 speed)?
- Item 2: provision a cloud GPU for Chatterbox, or stay on Kokoro until then?
