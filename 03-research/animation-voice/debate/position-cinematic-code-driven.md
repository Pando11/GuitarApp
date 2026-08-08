POSITION PAPER — Cinematic / Code-Driven Camp for GuitarApp v1
================================================================

Heidi wants "almost like a movie that teaches." She can have it. But "movie" and "real-time game engine living in the app" are two different products, and only one fits our settled constraints.

THE CORE ARGUMENT
We generate the cinematic lesson scenes with Motion Canvas (motion-canvas/motion-canvas, MIT, 18.9k★), render them to MP4, and play them in iOS AVPlayer. The single interactive cartoon avatar stays in Rive for the moments that must react to the student. Nothing else animates a hand. Rule 10 and Rule 11 are not bent — they are the reason this architecture exists.

WHY NOT PURE REAL-TIME
The opposing camp wants a live scene graph on device. Here is why that is wrong for a teaching movie:

1. Determinism. A lesson must look pixel-identical on every iPhone, every play. Real-time scene graphs drift with frame rate, thermal throttling, and OS version. Pre-rendered MP4 is a fixed asset — AVPlayer just plays it. Zero runtime surprises.

2. The constraint forces our hand correctly. The Rule says: native runtime OR pre-rendered video. A real-time cinematic layer needs a heavy native engine (Unity/SceneKit) bolted into SwiftUI — bundle bloat, battery drain, a second render pipeline to maintain. Pre-render deletes that cost.

3. Scale. We will ship hundreds of lessons. Code-driven generation means one scene template + lesson JSON renders 200 episodes. Real-time authoring means 200 hand-built scenes by an animator. That is unbounded cost — the exact failure Rule 10 was written to stop, now happening in 3D.

4. Safety. Real-time tempts people to "just animate the fingers." Pre-rendered, data-driven fretboard dots (from lesson JSON, never a hand model) make a Rule 10 violation structurally impossible. AI video (Rule 11) is off the table because we never generate pixels — we composite vectors.

THE INTERACTIVITY TRADEOFF — OWNED
Yes, a movie is less reactive than a live avatar. But a teaching movie does not need frame-level reactivity. It needs scene-granular reactivity: swap the intro clip, the "you got it wrong" clip, the "great job" clip based on lesson state. That is a state machine over pre-rendered scenes — trivial, deterministic, and exactly how every children's learning show already works.

THE PROTOTYPE DELIVERABLE
Heidi reviews double-clickable file:// HTML, not localhost servers. For those, GSAP (greensock/GSAP, 27.4k★) drives the cinematic sequencing in a single self-contained page — no build step, no server, just open the file. This is the same motion language Motion Canvas renders, so what she approves is what ships.

TOP 3 REPO PICKS
1. motion-canvas/motion-canvas (18.9k★) — the render backbone. Deterministic, code-driven, version-controllable scene generation to MP4. MIT.
2. greensock/GSAP (27.4k★) — the file:// prototype layer Heidi actually clicks. Industry-standard timeline sequencing, zero-dependency, opens from disk.
3. rive-app/rive-ios (802★) — the native runtime for the one reactive avatar. Small but official, MIT, Swift-first; satisfies the "native runtime" half of the constraint for the interactive bits only.

BOTTOM LINE
We give Heidi her movie: cinematic, multi-scene, multi-character, deterministic, version-controllable — and it respects every settled rule because the architecture makes breaking them impossible. Real-time is the expensive, drifting, Rule-10-riskier path. We render once, ship forever.
