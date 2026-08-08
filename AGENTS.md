# AGENTS.md — Guitar Lesson App

Auto-loaded project context. Also read `01-START-HERE/README.md` before acting.

## Hard rules

1. **`02-spec/` AMENDMENTS override `02-spec/guitar-app-spec.md`.**
   AMENDMENT-01 (audio-first v1), AMENDMENT-02 (animated teacher + voice),
   AMENDMENT-03 (AI-native movie-like lesson + open-source/no-fee stack; removed the
   old hand/AI-video bans), AMENDMENT-04 (sequenced lesson app), and **AMENDMENT-05
   (2026-08-07 — "The App That Listens": nine owner-approved AI features, constrained
   mic-listening reintroduced as headline, iOS+ANDROID, re-engagement texts, niche
   style-packs)** are current truth. The base spec is historical — never cite
   it without checking all amendments; AMENDMENT-05 is the latest word.
2. **Listening is BACK as the headline (AMENDMENT-05, 2026-08-07) — constrained form only.**
   The mic hears the student play and checks against the KNOWN target chord/note + tempo
   (never open-ended transcription — Rule 4). On-device, audio never uploaded, confidence
   honesty (Rule 6). Still NO camera, NO hand tracking, NO AI-drawn fingers. The old
   "record-a-take → send for critique" mechanic stays retired; what returned is live
   in-lesson verification, owner-directed.
3. **License blocklist — never propose these:** Essentia (AGPL), aubio (GPL),
   TarsosDSP (GPL), pedalboard (GPL), dtw-python (GPL), madmom (non-commercial).
   Approved: basic-pitch (Apache-2.0), librosa (ISC), CREPE (MIT), AudioKitEX (MIT).
4. **Never do open-ended audio transcription.** Always constrained matching against
   the known target chord + tempo. Open transcription is ~50% accurate and will ship
   false negatives, which is the #1 complaint about every competitor.
5. **The LLM writes prose only.** It may cite only metric keys present in the DSP
   output JSON. It never infers or invents a musical judgement.
6. **Confidence gating is a feature, not polish.** Below threshold, say "not sure,
   play that again." Never a false red X.
7. **No audio-recording / transcription / "send us your take" features.** The record-a-take →
  audio critique mechanic was RETIRED 2026-08-05 (AMENDMENT-04) — the owner never committed to it.
  Do NOT reintroduce recording, on-device or server-side audio grading, confidence-gating-as-FX, or
  camera/hand/fret-buzz detection in v1. The product is a SEQUENCED LESSON APP. If the owner later asks
  for any recording-based feedback, treat it as a new decision requiring a fresh amendment — not a
  resurrection of the old plan. Proceed on owner direction; the Reddit post remains optional extra info
  only (no gate, no validation).
8. **Chord correctness is non-negotiable — but it is verified by ARITHMETIC, not a human
   (UPDATED 2026-08-07, owner directive: there will be no contract guitarist).**
   `06-prototypes/step0/schema/chord-theory-check.js` computes the actual pitch each
   sounding string produces in standard tuning and proves the fingering spells the chord
   its name claims, plus physical playability (no finger on two frets, no unassigned
   fretted string, no absurd stretch). Ship gate: `node run-chord-check.js` must report
   0 errors AND 0 warnings. This is STRONGER than eyeballing — it already caught a real
   defect (D major had middle/ring swapped in all 3 lessons). Do NOT display
   "not verified by guitarist" warnings in the UI. Anything the checker cannot decide
   (tone, feel, teaching quality) is still a judgement call — flag it in prose, not a red box.
9. **VOICE license blocklist — never propose these for a paid app:** XTTS-v2 (CPML
   non-commercial; Coqui is defunct so no commercial license can be bought), F5-TTS
   (CC-BY-NC), Fish Speech (CC-BY-NC-SA), Piper (GPL-3.0 since Oct 2025).
   Approved: **OpenAI TTS** (shipping choice, ~$0.36 per 200 lesson lines),
   Kokoro-82M (Apache-2.0) as the free hedge, Chatterbox/MeloTTS/StyleTTS2 (MIT).
   Do NOT pay for ElevenLabs — $264–$1,188/yr for no benefit here.
10. **SVG gotcha:** CSS transforms silently do not apply to SVG `<g>` elements in
   some engines. Use the SVG `transform` attribute, and verify visually with a
   screenshot — numeric checks can report success while nothing moved.

## Decision conventions

- New decisions → new `02-spec/guitar-app-spec-AMENDMENT-NN.md`. Never rewrite history
  in the base spec. Then update `01-START-HERE/README.md` §7.
- New research → correct `03-research/` subfolder. Never loose on the Desktop.
- Deliverables the user will look at → interactive, double-clickable `file://` HTML.
  NOT localhost servers (their phone can't reach a local server).

## Product guardrails

- iOS **and Android** (AMENDMENT-05, one cross-platform codebase), acoustic-only, $12/mo, no free tier beyond tuner + metronome.
- One cartoon avatar. A rigged cartoon plays perfectly by construction and undercuts
  the product's promise if it demonstrates fingerings; default is data-driven 2D
  fretboard diagrams (provably correct). If a hand is ever animated, it must be a
  rigged hand with IK constrained to real fret coordinates, team-controlled and
  QA-able — never an AI-generated one (AI video cannot render correct fingering).
- Don't claim audio parity with Yousician at v1.
- Not a song-on-demand service (licensing = existential risk).

## Stack

Cross-platform iOS + Android, ONE codebase (AMENDMENT-05): Flutter or React Native —
one-page spike decides (open item, does not block). Audio: on-device pitch engine
(CREPE-class autocorrelation; approved libs basic-pitch Apache-2.0 / librosa ISC / CREPE MIT /
AudioKitEX MIT). Animation: open-source / no-membership stack only — GSAP (free, all plugins,
Webflow 2025), Lottie (MIT) for vector set-dressing, code-driven fretboard. NOTE: Rive dropped
from stack 2026-08-04 — $9/mo Cadet shipping fee violates the no-subscription rule; replaced by
Lottie + native canvas for the avatar layer. Teacher roster (AMENDMENT-05/owner 2026-08-07):
multiple cartoon teacher characters as skins over one shared curriculum + shared skeleton/rig;
voice = OpenAI TTS per-call. Images: FLUX.1[schnell]/Qwen-Image (Apache-2.0).
Backend: Supabase, RevenueCat, Cloudflare Workers, PostHog, Sentry.
Listening: constrained target-matching only (AMENDMENT-05), on-device, audio never uploaded.
Uploads: NONE for audio (on-device). If video ever lands, process on-device and discard.
