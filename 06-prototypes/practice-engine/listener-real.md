# listener-real.mjs — real on-device constrained mic listener

**Replaces** `listener-sim.mjs` (the deterministic test stand-in) with a working
pitch-detection path. Per AMENDMENT-05 it is **CONSTRAINED**: it only ever
matches incoming audio against the **KNOWN target chord pair {A, B}** at a
**KNOWN tempo**. It never does open-ended transcription. Audio **never leaves the
device** and below-confidence strums are reported as `confident:false`
("play that again") rather than a false red X (Rule 6).

## Output contract (unchanged engine math)
Emits `{ chord: <token>|null, confident: bool, t: ms }` exactly like the simulator,
so `countChanges` / `measureOneMinute` (one-minute-changes.mjs) consume it unchanged.

## How the UI swaps sim → real
1. Keep `listener-sim.mjs` as the test default (deterministic, no mic).
2. In the browser, capture audio via `getUserMedia({audio:true})`, obtain a
   `Float32Array` per frame (Web Audio `AnalyserNode` or `AudioWorklet`), and feed
   it to `listener.pushFrame(frame, tMs)` (or `pushBuffer(buffer)` for a whole clip).
3. Read results with `listener.getEvents()` and hand them to `measureOneMinute(pair, events)`.

## Pitch-detection pluggability (the production hook)
The module ships with a dependency-free CREPE-class pitch core so it runs identically
in Node (tests) and the browser. To use a real model in production, pass an approved
pitch lib via the `pitchDetector` injection hook — **no engine-math change required**:
- `createListenerReal({ pair, pitchDetector: myCrepe })` — inject CREPE (MIT) or
  basic-pitch (Apache-2.0); both are on the AGENTS.md approved list.
- `analyzeAudio({ buffer, pair, pitchDetector })` for a one-shot buffer.

The injected `pitchDetector(frame, {sampleRate})` must return
`[{ pc: 0..11, mag: number }, ...]` (pitch class + energy). The module maps those to
the known chord pitch-class templates and gates on confidence.

## License
Original MIT-licensed code. The pitch core is compatible with the approved stack
(basic-pitch Apache-2.0 / CREPE MIT / librosa ISC). No copyleft dependency is used.
