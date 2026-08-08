# AMENDMENT-04 — Pivot to a Sequenced Lesson App (record-a-take critique RETIRED)

Date: 2026-08-05 · Owner: Heidi Hendrickson. Overrides prior amendments where they imply the
async record-a-take → audio critique is the v1 differentiator. Amendments are append-only; this is
the current truth on product scope.

## 1. Decision
The owner has confirmed she never committed to the **record-a-take → audio critique → send-back**
mechanic. It is **RETIRED**. v1 is a **structured, sequentially-ordered beginner-acoustic lesson app**:

- Free **tuner + metronome** as the App Store funnel front door (unchanged from spec §3).
- A **paid, correctly-sequenced curriculum** of avatar-led lessons (LLM-generated + guitarist-QA'd),
  progressing in the proven teaching order (see `guitar-app-first-20-lessons-2026-08-05.md`).
- **Progress tracking, streaks, practice logging, adaptive review** as the retention/return engine.
- One clean subscription: **$12/mo** (unchanged).

## 2. What changes vs Amendments 01–03
- **Amendment 01 §1/§7 "audio-first v1 / record-a-take critique = the moat"** → superseded. v1 has
  **NO recording, NO audio grading, NO camera, NO hand tracking**. (Camera was already v2; now the
  entire audio-feedback concept is dropped, not deferred.)
- **README §5 "Record-a-take → audio critique" and "Confidence gating" bullets** → replaced by the
  sequenced curriculum + streaks (README patched 2026-08-05).
- **README positioning "Record it. Know exactly what to fix."** → replaced (README patched).
- **HANDOFF.md "Gap I — audio-moat tech spike"** → RETIRED. No tech spike; the spike was gated on a
  feature that no longer exists.
- **AGENTS Rule 7 "no feedback-engine code"** → re-pointed: the audio/recording feedback engine is
  retired; do not reintroduce recording-based features without explicit owner go-ahead.

## 3. What stays the same
- License blocklist (Rule 3), voice rules (Rule 9), guitarist-QA mandate (Rule 8), SVG gotcha (Rule 10).
- Avatar/animation: one 2D cartoon coach, data-driven fretboard, no filmed human, no AI finger video
  (Amendment 02/03). Open-source/no-fee stack (GSAP, Lottie, SwiftUI/Canvas, FLUX.1[schnell]/Qwen-Image).
- iOS-only, acoustic-only, no free tier beyond tuner+metronome, no song-on-demand (licensing risk).
- The free tuner + metronome funnel; the $12/mo single price.

## 4. The new "moat" (honest framing)
Not audio grading. It is: **a clean, correctly-sequenced, avatar-led beginner path with one obvious
price + fast first-song wins + streaks**, where competitors are either free-but-unstructured (Justin),
song/game-led (Yousician/Fender/Simply), or fragmented in pricing (Justin's stack). The pedagogy and
ordering — not a recorder — is the product. See `03-research/market/guitar-lesson-ordering-research-2026-08-05.md`.

## 5. Build order (restated, lesson-app)
0. Content schema + lesson-JSON renderer (schema first, de-risks everything).
1. Free tuner + metronome (funnel front door).
2. Lesson player + avatar shell.
3. **Sequenced curriculum renderer + first 20 lessons** (the core product).
4. Progress / streaks / practice logging / adaptive review.
5. Subscriptions (RevenueCat).
6. (v2, optional) camera/posture — only with explicit owner direction; NOT assumed.

## 6. Action required of next agent
- Do NOT propose audio recording, transcription, or "send us your take" features unless Heidi explicitly
  asks. The critique is dead; treat it as historical like the base spec.
- Continue per the first-20-lessons plan and the lesson-ordering research.
