# POSITION PAPER — GuitarApp v1 Animation: Stay Real-Time, Stay Rive-First

Heidi wants v1 to feel "almost like a movie" — past "one character sitting there." I agree we should level up. But "movie-like" is a FEELING, not a file format. A movie is cinematic choreography: camera moves, parallax, scene cuts, multiple characters. Every one of those is achievable in real time with Rive state machines. None of it requires a pre-rendered MP4.

Pre-rendering is the one move that betrays the product. v1's promise is "student plays, app reacts." A baked video cannot react — it can't branch when the student flubs a chord, can't slow down, can't re-localize per lesson JSON. It bloats the bundle and freezes the feedback loop. We do NOT trade the core loop for a cutscene.

WHY "MOVIE-LIKE" ≠ VIDEO
Real-time engines choreograph exactly what film does: dolly/zoom via Rive transform layering, parallax via nested artboards, scene transitions via state-machine inputs, particles via Rive's shipped particle system. Multiple characters = multiple rigs on one timeline. You lose nothing you'd miss and you gain reactivity, smaller payloads, and runtime data-binding to lesson JSON. Rule 10 stays intact: hands/fingers are NEVER animated — fingering is still programmatic 2D fretboard dots. Rule 11 stays intact: no AI video gen anywhere.

TOP 3 PICKS (real repos, live star counts)
1. rive-app/rive-ios (806★; engine rive-runtime 1,130★). The native iOS runtime — already in our stack. State machines = reactive scene direction. Don't be fooled by the low star count: it's a thin native binding over a commercially-backed engine with a real editor (rive.app) and production apps shipping on it. It IS the native runtime, so there is zero native-runtime risk. This is the backbone.

2. airbnb/lottie-ios (26,808★). Already named in the stack. Vector secondary graphics — clouds, sparks, UI flourishes, ambient set-dressing that makes scenes feel alive without touching the avatar. Mature, native, zero risk.

3. greensock/GSAP (27,406★) — PROTOTYPES ONLY. Heidi's deliverables are double-clickable file:// HTML, not localhost servers. GSAP's timeline is the industry standard for cinematic sequencing in-browser, so we can fake the full "movie" feel in a prototype she opens straight from Finder. (anime.js, 71,820★, is the lighter alternative.) These web libs stay strictly in the prototype layer; the app ships Rive + Lottie.

PUSH BACK — Motion Canvas (motion-canvas/motion-canvas, 18,888★)
Tempting because it "looks cinematic," but it EMITS VIDEO (MP4/WebM) from code. That is the opposite of our constraint: it has NO iOS native runtime, so it forces pre-render, which (a) kills interactivity — the exact thing we must protect, (b) fights the audio-first feedback loop, (c) balloons app size per lesson, (d) cannot be driven by lesson JSON at runtime. 18k stars buy a great explainer-video tool, not a reactive lesson engine. Reject it for instructional content. Rule 11 already bans AI video gen; Motion Canvas is the same dead end by a different route.

BOTTOM LINE: keep v1 interactive. Rive choreographs the movie; the student stays the director.
