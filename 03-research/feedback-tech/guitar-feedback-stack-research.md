# Guitar Performance Analysis — Open-Source Stack & Build Recommendation

Scope: user records themselves on iPhone (audio + optional video); app returns feedback on note/pitch accuracy, chord correctness, timing vs a reference, strumming, and clean-vs-buzzy tone.

All star counts / licenses / last-push dates verified via GitHub API on 2026-08-04.

---

## 1. Library / repo inventory

### 1a. Pitch & note transcription (the core)

| Repo | URL | License | ★ | Last push | Solves |
|---|---|---|---|---|---|
| **spotify/basic-pitch** | https://github.com/spotify/basic-pitch | Apache-2.0 | 5,372 | 2025-11 | **Polyphonic** note transcription → MIDI, small (~20MB TF/CoreML-convertible ICASSP'22 model), instrument-agnostic, gives onset+pitch+bends. Best single off-the-shelf answer for "what notes did they play". |
| marl/crepe | https://github.com/marl/crepe | MIT | 1,410 | 2024-08 | Monophonic f0, CNN, very accurate. Good for single-note exercises / intonation / bends. Not chords. |
| Google **SPICE** | https://www.kaggle.com/models/google/spice (TF Hub) | Apache-2.0 | – | – | Tiny self-supervised monophonic pitch model; runs on-device fine (TFLite → Core ML). Weaker than CREPE but cheap. |
| aubio/aubio | https://github.com/aubio/aubio | **GPL-3.0** | 3,735 | 2026-04 | YIN/YINFFT pitch, onsets, tempo, beat. C, embeddable. ⚠ GPL — poison for a closed iOS app unless you buy/avoid. |
| JorenSix/TarsosDSP | https://github.com/JorenSix/TarsosDSP | **GPL-3.0** | 2,183 | 2026-06 | Java/Android DSP (YIN, MPM, onset). Same GPL problem; Android-only relevance. |
| sevagh/pitch-detection | https://github.com/sevagh/pitch-detection | MIT | 654 | 2025-01 | C++ YIN/MPM/SWIPE. **Permissive**, easy to embed in iOS for a real-time tuner. |
| KinWaiCheuk/nnAudio | https://github.com/KinWaiCheuk/nnAudio | MIT | 1,129 | 2026-05 | GPU/torch CQT+spectrograms — use if you train your own guitar model. |
| omnizart | https://github.com/Music-and-Culture-Technology-Lab/omnizart | MIT | 1,952 | 2026-05 | Multi-task transcription (music/chord/beat/vocal). Heavy, dated deps; research-grade, server-only. |

### 1b. Chords, beats, tempo, structure

| Repo | URL | License | ★ | Last push | Solves |
|---|---|---|---|---|---|
| CPJKU/madmom | https://github.com/CPJKU/madmom | BSD-ish "NOASSERTION" (custom: free for **non-commercial**, ask for commercial) | 1,689 | 2026-03 | Best-in-class RNN/DBN **beat & downbeat tracking**, onsets, chord recognition (`CNNChordFeature` + `CRFChordRecognition`). ⚠ Check the license text before shipping commercially. |
| MTG/essentia | https://github.com/MTG/essentia | **AGPL-3.0** (commercial license sold by MTG/UPF) | 3,678 | 2026-07 | Huge C++ MIR toolbox: HPCP chroma, key/chord, onset, rhythm, plus pretrained TF models. Has iOS build support. AGPL ⇒ must buy a license for a closed app. |
| librosa | https://github.com/librosa/librosa | **ISC** | 8,537 | 2026-08 | Chroma/CQT, onset detection, beat_track, **DTW** (`librosa.sequence.dtw`), feature plumbing. Permissive, Python-only (server). |
| mir_eval | https://github.com/mir-evaluation/mir_eval | MIT | 709 | 2026-02 | Scoring transcription/beat/chord against ground truth — use it to build your grading metrics and your regression test suite. |
| pretty_midi | https://github.com/craffel/pretty-midi | MIT | 1,035 | 2026-02 | MIDI reference handling / note-list diffing. |

### 1c. Alignment to a reference take (DTW)

- `librosa.sequence.dtw` (ISC) — subsequence DTW on chroma/CQT. **Start here.**
- wannesm/dtaidistance — https://github.com/wannesm/dtaidistance — custom/Apache-ish "NOASSERTION", 1,241★, 2026-07. Fast C DTW.
- DynamicTimeWarping/dtw-python — https://github.com/DynamicTimeWarping/dtw-python — **GPL-3.0**, 343★. Avoid for shipping.
- Practical alternative on-device: online DTW / score-following over chroma frames (implement yourself, ~300 lines).

### 1d. Preprocessing / cleanup

- facebookresearch/demucs — https://github.com/facebookresearch/demucs — MIT, 10,356★, **archived 2024-04**. Still the workhorse for stripping backing track/vocals from a phone recording. Archived = no fixes.
- sigsep/open-unmix-pytorch — https://github.com/sigsep/open-unmix-pytorch — MIT, 1,498★. Lighter, maintained-ish alternative.
- spotify/pedalboard — https://github.com/spotify/pedalboard — **GPL-3.0**, 6,233★ — great for offline augmentation/training data, do NOT link into the app.
- torchaudio — https://github.com/pytorch/audio — BSD-2, 2,920★, active. Loading, resampling, specaugment, training pipeline.

### 1e. iOS-native

- **AudioKit** — https://github.com/AudioKit/AudioKit — MIT, 11,426★, 2026-07 — audio engine, recording, taps, DSP nodes.
- **AudioKitEX / SoundpipeAudioKit** — https://github.com/AudioKit/AudioKitEX — MIT, 64★ — includes `PitchTap` (YIN-based) for a live tuner/monophonic feedback. Free, permissive, 20 lines of Swift.
- **Apple SoundAnalysis + Core ML + Create ML** — https://developer.apple.com/documentation/soundanalysis — free, on-device. Create ML's *Sound Classification* template is the pragmatic path for a **buzz / clean / muted classifier** (train on your own labeled clips; MFCC+CNN under the hood).
- **Apple Vision hand pose** — https://developer.apple.com/documentation/vision/vnhumanhandposerequest — 21 keypoints per hand, on-device, free.
- **MediaPipe Hands / Tasks** — https://github.com/google-ai-edge/mediapipe — Apache-2.0, 36,467★, active — cross-platform equivalent, better if you ever go Android.

### 1f. Data (for anything you have to train yourself)

- **GuitarSet** — https://github.com/marl/GuitarSet — MIT, 168★ — 360 excerpts, hexaphonic pickup ⇒ **per-string ground truth** + fret annotations. This is the only real public guitar-with-string-labels dataset.
- IDMT-SMT-Guitar (TU Ilmenau), plus cwitkowitz/guitar-transcription-with-inhibition (https://github.com/cwitkowitz/guitar-transcription-with-inhibition, MIT, 19★, stale 2022) — research code for **tablature** (string+fret) transcription. Small, unmaintained, but the right prior art.

---

## 2. On-device (Core ML) vs server-side Python

**Recommendation: hybrid, weighted on-device.**

| Feature | Where | Why |
|---|---|---|
| Live tuner, live single-note pitch | On-device (AudioKitEX PitchTap / CREPE-tiny Core ML) | Needs <30 ms; a network round trip is impossible. |
| Post-take full analysis (notes, chords, timing, score) | **Server (Python)** for v1 | basic-pitch + librosa + madmom in Python is 1 week of work; the same pipeline as Core ML + Swift DSP is 2 months. A 30 s take analyzes in 3–10 s on a cheap CPU box. |
| Buzz/tone classifier | On-device Core ML | Tiny model, and it's the feature users will spam. |
| Video fretting-hand | **On-device only** (Vision/MediaPipe) | Uploading video is expensive, slow, and a privacy/ATT headache. Extract keypoints locally, upload 2 KB of JSON if needed. |

Cost/latency reasoning: 30 s of 44.1 kHz mono AAC ≈ 250 KB upload — trivial. basic-pitch CPU inference ≈ 0.2–0.5× realtime, so a $40/mo 4-vCPU box handles ~thousands of takes/day; GPU is unnecessary. The real cost is engineering, not compute — so put v1 on the server where you can iterate and ship model changes without App Store review. **Migrate the hot path to Core ML once the algorithm stops changing.** basic-pitch is explicitly small enough to convert (Spotify ships a Core ML variant path via coremltools; TFLite/ONNX exports exist).

Offline mode matters for guitar practice (people practice on planes / in basements). Plan for on-device by v2 or you'll get 1-star reviews.

---

## 3. The hard parts (brutally honest)

1. **Polyphonic chord detection on solo acoustic guitar is not solved off-the-shelf.** madmom/Essentia chord models were trained on *full-band pop* (Beatles/Billboard sets). On a dry solo strummed acoustic, with the user's uneven voicing, they degrade badly. basic-pitch gives you the *notes*; you then have to do chord labeling yourself (pitch-class set → chord template matching, with voicing/inversion/bass rules). Expect to write this layer and tune it on your own recordings.
2. **String/fret ambiguity is fundamentally unsolvable from mono audio.** E4 exists in 4+ places on the neck. Any "you're playing the wrong fret" feedback needs either (a) video of the fretting hand, or (b) inference from context/plausibility (fingering cost models), or (c) hexaphonic pickup (not happening on a phone). The GuitarSet-trained tab models get maybe 80% string accuracy in-domain and much worse on your users' phones.
3. **Partial/muted/ghost notes and buzz have no public labeled dataset.** Fret buzz, dead notes, unintentional open strings — you will label these yourself (a few thousand clips) and train a small classifier. This is your actual moat, and it is a data problem, not a library problem.
4. **Phone mic reality**: AGC, room reverb, clipping from a strummed acoustic 30 cm from the mic, backing-track bleed from the phone's own speaker. Mitigations: force AVAudioSession `.measurement` mode (disables AGC/processing), require headphones for play-along, run demucs/open-unmix only if bleed is unavoidable, hard-fail takes with clipping or low SNR *before* analyzing (bad feedback is worse than no feedback).
5. **Alignment to a reference**: DTW over chroma works when the user roughly plays the right thing. It breaks exactly when you most need it — when the user stops, restarts, skips a bar, or plays garbage. You need a robust/subsequence DTW with a "lost" state and rejection thresholds, plus a decision about whether you grade against a *fixed metronome grid* (easier, fairer, better pedagogy) or against a *reference recording* (harder). **Grade against a grid + tempo track for MVP.**
6. **Onset timing precision**: guitar strums are not single onsets — a downstrum smears ~20–40 ms across strings. Naive onset-based rhythm scoring punishes correct playing. You need strum-group clustering and a tolerance window (±50 ms typical, tightened by skill level).
7. **Scoring/UX is the product, not the DSP.** Turning a note-error list into "your G-to-C change is 80 ms late" is bespoke work no library does.

---

## 4. Recommended 3-tier build path

### MVP (4–6 weeks) — server-side Python, audio only
- iOS: AVAudioEngine record (44.1 kHz, `.measurement` mode) → upload m4a; AudioKitEX `PitchTap` for a live tuner + a "hold this note" warmup.
- Backend: FastAPI + **basic-pitch** (Apache-2.0) → note events; **librosa** (ISC) onset/beat/chroma; grade against a **fixed reference MIDI/grid** you author per lesson (pretty_midi).
- Metrics shipped: correct-notes %, extra/missing notes, timing offset per note (±50 ms window), tempo drift, "chord X was incomplete — string 5 didn't ring".
- Chords: your own pitch-class template matcher over basic-pitch output. Don't use madmom's chord model yet.
- Buzz/tone: skip, or ship a crude proxy (spectral flatness / high-frequency inharmonic energy) labeled as "beta".
- Licenses used: Apache-2.0, ISC, MIT only. **No GPL/AGPL anywhere.**

### v2 (2–4 months)
- Collect labeled takes from MVP users (with consent) → train a **Create ML / Core ML sound classifier** for clean / buzz / muted / palm-mute. Ship on-device.
- Convert basic-pitch to Core ML (coremltools) for offline analysis + instant results; keep server as fallback/A-B.
- Real DTW alignment against reference *audio* (librosa subsequence DTW on CQT-chroma) with confidence gating, so users can play rubato.
- Video: Vision `VNHumanHandPoseRequest` on-device → fretting-hand keypoints → coarse position ("you're at the 5th fret region"), used to *disambiguate* audio, not to grade alone.
- Rhythm: madmom beat/downbeat if commercial license is cleared, else a librosa/onset-DBN of your own.

### Ambitious (6–12 months)
- Train a **guitar-specific transcription model** (CQT front-end via nnAudio, CRNN/Transformer) on GuitarSet + IDMT-SMT-Guitar + your own in-the-wild phone recordings, predicting per-string tablature and articulation (bend/slide/hammer/mute) jointly.
- Multimodal fusion: audio + fretting-hand keypoints + strumming-hand motion → string/fret disambiguation and strum direction (up/down) detection.
- Personalized skill model + adaptive curriculum; instrument/mic calibration pass at onboarding.
- On-device everything, streaming/real-time feedback while playing.

---

## 5. Licensing red flags (act on these now)

- **AGPL-3.0**: Essentia → needs a paid commercial license from MTG/UPF.
- **GPL-3.0**: aubio, TarsosDSP, pedalboard, dtw-python → do not link into the app.
- **madmom**: "NOASSERTION" — the actual terms are BSD-like *for non-commercial use only*, commercial use by agreement. Get written clearance or replace it.
- **Safe set**: basic-pitch (Apache-2.0), librosa (ISC), CREPE (MIT), mir_eval (MIT), pretty_midi (MIT), torchaudio (BSD-2), AudioKit/AudioKitEX (MIT), MediaPipe (Apache-2.0), GuitarSet (MIT), sevagh/pitch-detection (MIT), open-unmix (MIT), demucs (MIT, archived).

## 6. What off-the-shelf does NOT give you
Chord grading on solo acoustic · string/fret from mono audio · buzz detection · strum direction · robust alignment when the user goes off the rails · phone-mic robustness · pedagogically useful scoring. Budget your engineering there; everything else is `pip install`.
