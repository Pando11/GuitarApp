# SPEC AMENDMENT 02 — ANIMATED TEACHER & VOICE
Date: 2026-08-04 · Amends `guitar-app-spec.md` §4 (avatar) and §5 (architecture)
Status: ACTIVE. Amendment 01 (audio-first v1) still stands; this adds to it.
Basis: three research reports in `03-research/animation-voice/`:
  - guitar-app-animated-teacher-research.md   (who uses animation vs filmed humans)
  - guitar-teacher-animation-research.md      (how to build it, real 2026 prices)
  - guitar-teacher-voice-options-research.md  (TTS options + commercial licensing)
Working prototype: `06-prototypes/animated-teacher-demo-v2.html` (double-click to run)

---

## 1. THE QUESTION ASKED

"Do other guitar apps use a live person or animation? I want to replace the live
person. Can we animate the teacher, and show finger location? And can we do the
voice without paying for ElevenLabs?"

## 2. FINDINGS

### Replacing the filmed human is already the industry norm — it is NOT a differentiator
Yousician, Simply Guitar, Melodics, Rocksmith+ and Gibson App all already replaced
filmed teachers. Guitar World described Yousician's animated fretboard as its
"heart and soul." Still filming humans: Fender Play, JustinGuitar (for Justin, the
human IS the brand), flowkey/Skoove (overhead real hands, piano).

**But they replaced the human with an animated FRETBOARD, not an animated CHARACTER.**
A character with personality is the open space — closer to Duolingo's Duo than to
anything in the guitar category.

### NO mainstream app animates a hand playing a guitar
Only novelty apps and YouTube one-offs. Four reasons, in order of importance:
1. **A hand occludes the fretboard.** Apps animate fretboards precisely to get
   fingers OUT of the way. (Same occlusion problem that killed the v1 camera feature.)
2. Hands are the hardest thing in animation; wrong finger anatomy teaches bad
   technique at scale — and the founder cannot verify correctness.
3. Semi-realistic hands land in the uncanny valley and read as cheap.
4. Per-song hand animation cost is unbounded; a programmatic fretboard scales to
   thousands of songs for free.

**This independently confirms spec §4's existing ban on animated playing hands with
three reasons beyond the two originally written down. §4 STANDS — do not reopen.**

### AI video generation cannot do this
Runway / Kling / Veo / Sora can produce a talking head but **cannot render correct
guitar fingering** — documented failures with wrong strings/frets and morphing hands
(AVGen-Bench 2026). Unsafe for teaching. Do not use for instructional content.

## 3. DECISIONS

| Topic | Decision |
|---|---|
| Teacher | **Animated 2D character.** No filmed human for lesson delivery. |
| Character's hands | **Never plays guitar.** Gestures, points, celebrates only. Confirms §4. |
| Finger display | **Programmatic 2D fretboard** — numbered dots generated from lesson JSON. Correct by construction; can never teach a wrong shape. |
| Animation tool | **Rive** — $9/mo Cadet to ship, no runtime fee, ~43KB iOS runtime, state machines + audio events for lip-sync. (Spine: no state machine. Lottie: can't lip-sync to live audio.) |
| Voice | **OpenAI TTS** (`gpt-4o-mini-tts`), pre-rendered into the app bundle. |
| Lip-sync | Rhubarb Lip Sync → phonemes → Rive state machine. |

### Voice cost — the ElevenLabs question, answered
200 lesson lines ≈ 24k characters ≈ **$0.36 on OpenAI TTS.**
ElevenLabs subscription floor: **$264–$1,188/year.** No reason to pay it.
Free $0 hedge if ever needed: **Kokoro-82M** (Apache-2.0, CPU real-time).

### VOICE LICENSE TRAP — hard block
The three best-sounding open-source voice cloners are **illegal in a paid app**:
- **XTTS-v2** — CPML non-commercial. Coqui shut down Jan 2024, so **there is nobody
  left to buy a commercial license from.** Note its MPL-2.0 covers the toolkit code
  only, NOT the weights.
- **F5-TTS** — CC-BY-NC-4.0 weights.
- **Fish Speech** — CC-BY-NC-SA-4.0.
- **Piper** — moved to GPL-3.0 in Oct 2025; per-voice licenses vary.

Commercially safe: **Kokoro-82M** (Apache-2.0), **Chatterbox** (MIT, needs ~6GB VRAM),
MeloTTS (MIT), Orpheus (Apache-2.0), StyleTTS2 (MIT).

Apple AVSpeechSynthesizer is free but screen-reader quality — fallback only, never
the character voice.

## 4. ADDITION TO V1 SCOPE

**20–30 short filmed human clips for pure technique moments** (posture, thumb
position, wrist angle, barre). One-time cost. This is the specific defense against
the documented "animated apps don't transfer to real playing" criticism. The avatar
handles everything else.

## 5. PROTOTYPE STATUS

`06-prototypes/animated-teacher-demo-v2.html` — character "Riff" with 4 expressions,
gestures (wave/point/cheer), confetti, lip-sync, animated fretboard, browser TTS.
Verified working: chord fingerings checked numerically (Em, C both correct),
full lesson sequence runs end to end.

**It is programmer art.** The FORMAT is validated; the DRAWING is not shippable.
Next step is a freelance illustrator + rebuild in Rive.

Pitfall found while building (relevant to any contractor): **CSS transforms silently
do not apply to SVG `<g>` elements in some engines** — the pose appeared unchanged
while every measurement reported success. Use the SVG `transform` attribute instead,
and verify visually, not just numerically.

## 6. OPEN QUESTIONS FOR THE OWNER

1. Character vibe — playful young guy (current) vs calm adult mentor?
2. Voice — gender and age?
3. Should the coach ever hold a guitar while talking (not playing)?
