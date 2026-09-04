# GuitarApp — Pre-Generate & Cache Voice Pipeline (proposed)

**Status:** proposed (design sketch, NOT wired into the app yet — needs owner sign-off)
**Why:** Live GPU TTS for every student is the app's main scaling cost. Most teacher lines are
*static* (they come from lesson JSON and don't change per student). Generate them **once**, cache
the audio, and stream it like a music file. Keep **live** TTS only for dynamic lines.

---

## Important honesty note (read before building)
Per `guitarapp` skill + `07-app/app.js`: the phone **currently speaks via live TTS**
(`app.js → speak(text) → POST /api/tts` server-side Chatterbox, or device `speechSynthesis`).
Pre-rendered wav files in `07-app/audio/` are a *proof artifact* the phone does NOT play.
So caching only saves money if `app.js`'s `speak()` is **changed** to fetch a cached audio URL
for known-static lines instead of calling `/api/tts`. This doc is a *proposal for that change*.

---

## Hybrid design (recommended)
- **STATIC lines** (lesson coaching copy, mystery reveals text, graduation beats) →
  pre-generated once with Chatterbox → stored on R2 → served as a URL.
- **DYNAMIC lines** (duet playback, any personalized/student-name callout) →
  keep live TTS (device `speechSynthesis` + server `/api/tts` fallback).

```
lesson JSON (07-app/content/lessons/*.json)
   │  extract: avatar_coaching_copy + exercises[].coaching
   ▼
[generate.py]  Chatterbox (GPU, ONE TIME)  ── needs GPU + weights on disk
   │  key = sha256(text+voice)
   ▼
R2 bucket:  audio/<hash>.ogg
   │
   ▼
voice-cache-manifest.json  (text → R2 URL)
   │
   ▼
app.js speak(): if text in manifest → <audio src=URL>; else → live /api/tts
```

## Generation cost (one-time)
- 25 lessons × ~15 spoken lines ≈ **375 audio clips**.
- At Chatterbox's estimated ~real-time speed on one GPU, that's **well under an hour of GPU time**
  ≈ **<$1** one-time (RunPod ~$0.58/hr).
- After that: $0 recurring for those lines.

## Serving change (app.js)
Modify `speak(text)`:
1. Look up `text` in `voice-cache-manifest.json` (bundled with the app, like lesson JSON).
2. If found → play the cached `audio` element (instant, free, no server TTS call).
3. If not found (dynamic) → existing `speechSynthesis` / `POST /api/tts` path.

This keeps the SW-cache bump workflow (edit lesson JSON → regenerate affected clips → bump cache).

## Generator script
`tools/voice-cache/generate.py` (skeleton in repo). **Cannot run on this PC** — no GPU,
and the lesson JSONs aren't present on this machine. Run it on a GPU machine with lessons + R2 creds.

## Caveats
- Requires a design change to `app.js` (owner approval per grill/ratify culture).
- Regenerating clips after a wording edit is a new step in the content workflow.
- Dynamic lines (duet) still need live GPU on demand — budgeted separately in COST-PER-SUBSCRIBER.md.
