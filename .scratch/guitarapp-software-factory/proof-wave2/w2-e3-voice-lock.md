# W2-E3 Sage voice lock

## Decision

- **Teacher ID:** `T1`
- **Teacher name:** `Sage`
- **Shipping voice provider:** `chatterbox`
- **Shipping voice ID:** `builtin-sage-emerald-v1`
- **Style:** `warm, calm, medium-slow`

## Where it is locked

- `07-app/content/teachers/T1.json`
- `06-prototypes/step3/teachers/T1.json`
- `07-app/app.js`
  - `DEFAULT_VOICE`
  - `loadTeacherCatalog()`
  - `composeSpeechRequest()`

## Sample invocation path

Shell path in the app:
1. `window.GuitarApp.composeSpeechRequest('Warm up on the porch.')`
2. resolves the current teacher voice from `T1.json`
3. returns payload fields:
   - `teacher_id: T1`
   - `provider: chatterbox`
   - `voice_id: builtin-sage-emerald-v1`
   - `style: warm, calm, medium-slow`
4. `window.GuitarApp.speak(...)` uses that payload for the `/api/tts` server path, or keeps the same voice hints on the local `speechSynthesis` fallback.

## Proof

- `07-app/test/app-smoke.mjs` passed `24 passed / 0 failed`
- The smoke gate asserts:
  - T1 teacher catalog entry is `Sage`
  - `composeSpeechRequest()` returns `provider === 'chatterbox'`
  - `composeSpeechRequest()` returns `voice_id === 'builtin-sage-emerald-v1'`
- Visual proof speech capture shows:
  - `providerHint: chatterbox`
  - `voiceHint: builtin-sage-emerald-v1`
  - see `visual-proof-command.log`

## Legal-floor note

- Commercial-clean floor preserved.
- No ElevenLabs.
- No voice cloning from a real person.
- Chatterbox remains the shipping target and Kokoro remains the fallback only.
