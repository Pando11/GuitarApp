# Video Analysis + AI Critique for an iOS Guitar Lesson App — Research Findings

Date: 2026-08-04. Scope: (1) hand/fretboard CV, (2) multimodal LLM critique, (3) hybrid architecture, (4) cost at 1,000 users.

## TL;DR

- **Posture, strum arm motion, gross hand shape/position: YES, tractable today** with on-device pose/hand tracking.
- **Exact fret-and-string finger placement from a phone camera: NO, not reliably.** This is the single hardest thing and every published system either constrains the camera rigidly, uses depth, or leans on audio.
- **Audio is the truth source.** Chord correctness, timing, strum direction, buzzing/muting are far more reliably measured from the mic than from pixels.
- **The credible product is hybrid**: deterministic audio DSP + on-device pose/hand metrics → a compact JSON "metrics report" → LLM writes coaching prose. Do **not** hand a raw clip to a VLM and ask "critique my technique."
- **Cost is not the blocker.** ~$0.003–$0.02 per 30–60s analyzed recording at Flash-tier pricing; the blocker is measurement validity.

---

## 1. Hand / finger / fretboard tracking

### 1.1 Hand pose — MediaPipe Hands vs Apple Vision

| | MediaPipe Hand Landmarker | Apple Vision `VNDetectHumanHandPoseRequest` |
|---|---|---|
| Landmarks | 21 per hand, 2D + "world" 3D | 21 per hand, 2D + confidence |
| Perf | real-time on mobile CPU/GPU | real-time, Neural Engine, zero dependency |
| Docs | https://developers.google.com/edge/mediapipe/solutions/vision/hand_landmarker | https://developer.apple.com/documentation/vision/vndetecthumanhandposerequest |
| iOS fit | needs MediaPipe Tasks framework bundled | native, free, no binary bloat — **default choice for iOS** |

Google reports **95.7% average precision for palm detection** (https://research.google/blog/on-device-real-time-hand-tracking-with-mediapipe/) — note that's *palm detection*, not per-fingertip localization accuracy, and it is measured on generic hand imagery, not hands wrapped around a guitar neck.

**Known failure mode that directly hits this use case: occlusion.** Practitioners report MediaPipe keypoints degrading badly when the hand is partially hidden or gripping an object (e.g. https://www.reddit.com/r/computervision/comments/1l7s26d/best_model_for_2d_hand_keypoint_detection_in/). A fretting hand is *the worst case*: fingertips are pressed against the fretboard and occluded by the neck itself, the palm is behind the neck, and fingers cross each other in barre chords. The landmarks you most need (fingertips) are the ones most often hidden or hallucinated.

Apple additionally ships **Create ML hand-pose classification** (WWDC21 session 10039, https://developer.apple.com/videos/play/wwdc2021/10039/) — you can train a chord-shape classifier on hand-pose landmark sequences rather than raw pixels. This is a realistic path for a *closed set* of ~10 open chords, and it's cheap and on-device.

### 1.2 Fretboard / string localization

- **TapToTab (arXiv:2409.08618, 2024)** — YOLO for real-time fretboard detection + FFT audio analysis for note ID. https://arxiv.org/abs/2409.08618. Notably, the authors **use audio, not vision, for the actual note identification** — vision handles fretboard localization only. That division of labor is the headline lesson.
- Pretrained fretboard detector to bootstrap: https://universe.roboflow.com/ghaleb/guitar-fretboard (384 images — small; expect to collect your own).
- Classical CV pipeline (Hough lines for strings/frets, Canny + morphological dilation for fingers): Asmar 2022, Polytechnique Montréal, https://publications.polymtl.ca/10470/1/2022_MarkAsmar.pdf. Works, but is brittle to lighting, wood grain, and non-fronto-parallel neck angles.
- Single-image fretboard/string localization via oriented bounding boxes + geometry, current student work: https://www.reddit.com/r/computervision/comments/1rbhkn1/

### 1.3 Chord-shape recognition from video — published accuracy reality

- **CNN transfer learning, 5-chord classifier (C, D, Em, F, G)** — Stanford CS230, https://cs230.stanford.edu/projects_fall_2019/reports/26255715.pdf. Five classes. That's the honest state of "chord shape from a picture."
- **Finger-pattern deep learning** — Ooaku et al., ACM ICIIT 2019, https://dl.acm.org/doi/10.1145/3290420.3290422
- **3D vision-based chord recognition using MediaPipe** — Computer Music Journal, https://direct.mit.edu/comj/article/doi/10.1162/COMJ.a.690/135590/ — uses 3D data, i.e. beyond a single RGB stream.
- **Depth-image based chord recognition** — Shintaku et al., ICMU 2023, https://www.computer.org/csdl/proceedings-article/icmu/2023/10412164/1U85BrTKCoU — again, depth, not plain RGB.
- Open-source references: https://github.com/paulden/guitar-fingering-recognition , https://github.com/ilDeffo/Guitar-Fingering-Chords-Recognition (both student projects, demo-grade, small chord vocabularies, controlled capture).

**Pattern across the literature: every system that reports good numbers either (a) restricts to a handful of chords, (b) fixes the camera, or (c) adds depth or audio.** There is no published RGB-only, arbitrary-angle, arbitrary-lighting, full-chord-vocabulary fingering recognizer. If your marketing says "we check your finger placement," you will be caught out.

### 1.4 Capture requirements you'd have to impose (and enforce in-app)

- **Angle**: fretboard must be visible and roughly side-on/above; a straight-on selfie shot hides the fretting hand behind the neck almost entirely. Consider prompting for a "neck visible, camera to your left/right" framing with an on-screen guide overlay.
- **Distance**: fret spacing at the 1st–5th fret must be several pixels wide; phone at ~0.5–1.5m.
- **Lighting**: even, front-lit. Backlit-by-window (extremely common at home) destroys edge-based fret detection and degrades hand landmarking.
- **Guitar variation**: dark rosewood vs light maple boards, cutaways, capos, dreadnought vs classical width — all shift geometry. Expect per-guitar calibration or a calibration frame ("hold an open E and tap the screen").
- **iPhone Pro LiDAR** exists but is depth-limited/noisy at fingertip scale and Pro-only — not a shippable dependency.

### 1.5 Posture and strumming — the easy wins

These are genuinely deliverable and under-marketed:
- **Body pose** via Vision's 19-point body pose (https://developer.apple.com/documentation/vision/detecting-human-body-poses-in-images): shoulder tilt/hunch, head-down-staring-at-fretboard, guitar neck angle, wrist collapse on the fretting hand, elbow flare.
- **Strumming hand**: track the wrist landmark's vertical position over time → a 1D signal. From it you derive stroke rate, up/down alternation, tempo stability (std-dev of inter-stroke interval), and whether the student is moving from the elbow vs the wrist (compare wrist vs elbow displacement amplitude). This is simple signal processing on a robust landmark and it maps directly onto real teaching advice.
- **Cross-check strums against the audio onsets** — if your visual stroke count and audio onset count disagree, you have a confidence signal for free.

### 1.6 Audio is the stronger signal — use it

- **GuitarSet** (ISMIR 2018, https://archives.ismir.net/ismir2018/paper/000188.pdf) is the benchmark dataset; note the paper's own warning that "existing transcription algorithms perform woefully badly on polyphonic solo guitar recordings," with a Deep Salience multi-f0 baseline at **46% accuracy**.
- Even 2024–2025 SOTA is modest: "High Resolution Guitar Transcription via Domain Adaptation," https://arxiv.org/html/2402.15258v1 ; a 2025 seq2seq thesis reports **onset F1 0.518, full-note F1 0.302** (https://scholarworks.sjsu.edu/cgi/viewcontent.cgi?article=9292&context=etd_theses).
- **But**: full polyphonic transcription is a much harder problem than what you need. For a lesson app you know the target chord and the target tempo. Verifying "did the audio in bar 3 match a G major chroma template, and were the onsets within ±40ms of the metronome grid" is a **constrained** problem and is highly accurate. Onset detection and chroma matching are near-solved; open-ended transcription is not.
- Practical stack: `basic-pitch` (Spotify, 17K params, runs on-device) or CoreML-converted CREPE for pitch, plus a simple onset detector + chroma/chord-template match. AutoTab reports 87.8% note / 78% chord accuracy in an interactive constrained setting (https://sol.sbc.org.br/index.php/semish/article/download/36816/36602/).

---

## 2. Multimodal LLMs critiquing a performance clip

### 2.1 What each option actually does with video

| Model | Native video? | Notes |
|---|---|---|
| **Gemini (2.5/3 Flash & Pro)** | **Yes** — file upload or inline <100MB | Samples at **1 FPS** by default; audio processed at 1Kbps single-channel. Docs: https://ai.google.dev/gemini-api/docs/video-understanding |
| **GPT-4o / GPT-5** | **No native video input** | You extract frames and send them as images (+ separate Whisper audio). Open request for parity: https://github.com/openai/openai-node/issues/1778 |
| **Qwen-VL / Qwen2.5-VL** | Yes, frame-sequence video | Self-hostable, cheapest at scale, weakest at fine motor judgment |

### 2.2 The 1 FPS problem — this is disqualifying for technique

Gemini's own docs: *"Be aware that fast action sequences might lose detail due to the 1 FPS sampling rate."* A strum at 90 BPM in eighth notes is **3 strokes per second**. At 1 FPS you literally cannot see strumming. You can raise FPS via custom sampling, but you pay 258 tokens/frame and latency scales with it.

Even setting frame rate aside, VLMs are weak at frame-to-frame fine motion. Long-standing practitioner report: GPT-4V "was likely not trained on a lot of sequences of images, which is apparent on a lot of clips when it just cannot grasp simple yet obvious things that changed from one frame to another" (https://community.openai.com/t/reading-videos-with-gpt4v/523568). Academic work on sports feedback generation confirms VLMs need external structure to give actionable, fine-grained guidance rather than generic praise (WACV 2026, https://openaccess.thecvf.com/content/WACV2026/papers/Rai_Generalizing_Sports_Feedback_Generation_by_Watching_Competitions_and_Reading_Books_WACV_2026_paper.pdf ; also https://arxiv.org/html/2607.11844v1).

### 2.3 What a VLM *is* reliably good at here

- Reading the **scene**: is the guitar visible, is it in frame, is the student left-handed, is there a capo, is lighting adequate → a great **pre-flight quality gate** before you spend compute.
- Coarse **posture description**: hunched, neck angled down, guitar sliding off the leg, wrist collapsed. It will say sensible things about a still frame.
- **Writing the coaching prose** from structured numbers — this is where it shines, and it's basically free.
- What it will **not** do: correctly tell you the student's ring finger is on the 2nd fret of the D string rather than the 3rd. It will *confidently claim to*. That hallucination is the product-killing risk — a student who is actually correct being told they're wrong destroys trust in one session.

### 2.4 Latency

- Gemini Flash on a 30s clip at 1 FPS ≈ 9K tokens in → typically ~3–8s to first token, ~10–20s for a full structured critique. Upload of a 30s 1080p clip over cellular (~15–40MB) often dominates: 5–30s. **Design for async**: "analyzing your take…" with a push notification, not a spinner.
- Downscale and trim client-side before upload (720p, 30s max, H.265) — cuts upload time and token cost together.

---

## 3. The hybrid design — yes, this is the credible path

```
[iOS capture, 30–60s]
        │
        ├─► ON-DEVICE (free, private, instant)
        │     • Vision body pose  → posture metrics (shoulder tilt, head angle, neck angle, wrist flexion)
        │     • Vision hand pose  → fretting-hand shape features; strum-wrist Y-signal
        │     • Audio DSP         → onsets, tempo & timing deviation vs metronome grid,
        │                           chroma vs expected chord template, buzz/mute detection,
        │                           dynamics consistency
        │     • Confidence flags  → "fretboard not visible", "backlit", "hand occluded 60% of frames"
        │
        ├─► METRICS JSON  (~1–3 KB, deterministic, auditable, testable)
        │
        ├─► OPTIONAL: 3–6 keyframes at musically-chosen timestamps (worst-timing bar,
        │   chord-change moments) → VLM for posture/scene commentary only
        │
        └─► LLM (text-mostly) → coaching prose, prioritized to 2–3 actionable items,
              tone-matched to skill level, referencing your own lesson content
```

Why this wins:
1. **Every claim is backed by a number you computed.** "Your chord changes averaged 380ms late" is checkable; "your fingers look cramped" is not.
2. **Testable.** You can regression-test the DSP layer. You cannot regression-test vibes.
3. **Cheap and fast** — the heavy lifting is on-device and free.
4. **Degrades gracefully** — if hand tracking confidence is low, you drop those metrics and still deliver audio-based feedback rather than making things up.
5. **Honest UX**: gate finger-placement claims behind a confidence threshold, and when it's low, say "I couldn't see your fretting hand clearly — try angling the camera to your left" instead of guessing.

Design guardrails:
- Give the LLM an explicit **"only comment on metrics present in the JSON; never infer finger positions"** instruction, and validate its output against the metric keys before display.
- Cap feedback to 2–3 items. Survey work with 21 guitarists on an AI guitar assistant found learners want *precise* feedback on "posture, attack, and hand position" specifically (https://www.frontiersin.org/journals/computer-science/articles/10.3389/fcomp.2025.1549335/full) — precision beats volume.
- Ship a **"why do you think that?"** affordance showing the underlying number/timestamp. Builds trust and gives you free error reports.

---

## 4. Cost at scale (1,000 users)

Assumptions: 1,000 active users, **10 analyzed recordings/user/month = 10,000 clips/month**, 30s each.

**Token math** (from https://ai.google.dev/gemini-api/docs/video-understanding): 258 tokens/frame at default media resolution, 66 tokens/frame at `media_resolution: low`, 32 tokens/s audio, 1 FPS default → ~**300 tokens/s of video** default, ~**100 tokens/s** at low res.

| Approach | Input tokens / 30s clip | Cost per clip (Flash-tier ≈ $0.30/M in, $2.50/M out; ~800 out tokens) | 10,000 clips/mo |
|---|---|---|---|
| **A. Hybrid (recommended)** — on-device metrics + ~2K text tokens, no video to cloud | ~2,000 | **~$0.0026** | **~$26/mo** |
| **B. Hybrid + 6 keyframes** for posture | ~2,000 + 1,550 | ~$0.0031 | ~$31/mo |
| **C. Full video, low media res** | ~3,000 | ~$0.0029 | ~$29/mo |
| **D. Full video, default res** | ~9,000 | ~$0.0047 | ~$47/mo |
| **E. Full video, Pro-tier** (~$2/M in, $12/M out) | ~9,000 | ~$0.028 | ~$280/mo |

Verify current rates at https://ai.google.dev/gemini-api/docs/pricing before committing — Gemini pricing has moved repeatedly and the newer Omni/video-output SKUs are billed differently (e.g. 5,792 tokens/s for *video output*, which you do not need).

**The real costs are elsewhere:**
- **Bandwidth/storage** if you upload clips: 10,000 × ~20MB = ~200GB/mo ingress plus retention. Egress and storage will exceed your inference bill. Strong argument for on-device analysis + **discard the video**, keeping only the metrics JSON.
- **Privacy/compliance**: video of a user's home (and possibly minors — guitar learners skew young) is a materially heavier regulatory burden than a JSON blob. On-device-first is a legal and marketing asset, not just an optimization.
- **Engineering**: building and validating the DSP/pose metric layer is the dominant real cost — months, not dollars.

---

## 5. Honest list of what will fail

1. **Precise fret/string identification from a phone camera.** Don't ship it as a claim. Nothing in the literature supports it at consumer capture quality.
2. **Barre chords** — the exact thing beginners struggle with most is the hardest to see: the index finger is a flat occluded bar, and whether it's pressing evenly is invisible. Audio (buzzing/dead strings) is your only real detector here, and it's a good one.
3. **Fast strumming** at 1 FPS VLM sampling — invisible. Must be handled by on-device tracking + audio onsets.
4. **Backlighting and dark fretboards** — a large fraction of real-world submissions will be unusable for fretboard CV. Build the "retake with better framing" flow first, not last.
5. **Left-handed players, capos, classical vs steel-string, 7-strings, ukuleles** — each breaks geometric assumptions. Ask at onboarding.
6. **VLM confident hallucination** about finger placement. Structurally prevent it; don't rely on prompt politeness.
7. **Generic feedback fatigue.** If the model says "great job, keep practicing!" three times, users churn. Feedback must cite a number and change between sessions.

## 6. Recommended build order

1. **Audio-only feedback v1** (timing vs grid, chord chroma match, clean/buzzy) + LLM prose. Highest accuracy-per-effort, works in any lighting, no camera framing problem. Ships fastest.
2. **Add Vision body pose** → posture coaching. Cheap, robust, visibly "AI-ish" to users, low hallucination risk.
3. **Add strum-hand wrist tracking** cross-validated against audio onsets.
4. **Only then** attempt fretting-hand analysis, scoped to a closed set of ~8–12 chord shapes via Create ML hand-pose classification, gated behind an explicit guided-framing capture mode and a confidence threshold.

## Key URLs

- Gemini video understanding & token rates — https://ai.google.dev/gemini-api/docs/video-understanding
- Gemini pricing — https://ai.google.dev/gemini-api/docs/pricing
- Apple Vision hand pose — https://developer.apple.com/documentation/vision/vndetecthumanhandposerequest
- Apple body pose — https://developer.apple.com/documentation/vision/detecting-human-body-poses-in-images
- Create ML hand pose/action classification (WWDC21) — https://developer.apple.com/videos/play/wwdc2021/10039/
- MediaPipe Hand Landmarker — https://developers.google.com/edge/mediapipe/solutions/vision/hand_landmarker
- MediaPipe accuracy claim — https://research.google/blog/on-device-real-time-hand-tracking-with-mediapipe/
- TapToTab (YOLO fretboard + audio) — https://arxiv.org/abs/2409.08618
- GuitarSet / transcription baseline 46% — https://archives.ismir.net/ismir2018/paper/000188.pdf
- High-res guitar transcription — https://arxiv.org/html/2402.15258v1
- CNN visual chord classification (5 chords) — https://cs230.stanford.edu/projects_fall_2019/reports/26255715.pdf
- 3D/MediaPipe chord recognition (CMJ) — https://direct.mit.edu/comj/article/doi/10.1162/COMJ.a.690/135590/
- Depth-image chord recognition (ICMU 2023) — https://www.computer.org/csdl/proceedings-article/icmu/2023/10412164/1U85BrTKCoU
- Classical CV guitar transcription thesis — https://publications.polymtl.ca/10470/1/2022_MarkAsmar.pdf
- AI guitar assistant user study (21 guitarists) — https://www.frontiersin.org/journals/computer-science/articles/10.3389/fcomp.2025.1549335/full
- VLM sports feedback generation (WACV 2026) — https://openaccess.thecvf.com/content/WACV2026/papers/Rai_Generalizing_Sports_Feedback_Generation_by_Watching_Competitions_and_Reading_Books_WACV_2026_paper.pdf
- GPT-4V frame-sequence weakness (practitioner) — https://community.openai.com/t/reading-videos-with-gpt4v/523568
- OpenAI lacks native video input — https://github.com/openai/openai-node/issues/1778
- Repos: https://github.com/paulden/guitar-fingering-recognition · https://github.com/ilDeffo/Guitar-Fingering-Chords-Recognition · https://universe.roboflow.com/ghaleb/guitar-fretboard
