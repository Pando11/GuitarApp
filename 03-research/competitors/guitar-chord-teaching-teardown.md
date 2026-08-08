# Competitive Teardown: How Free YouTube Guitar Creators Teach & "Verify" Chord Shapes
Scope: JustinGuitar, Andy Guitar, Marty Music, GuitarLessons365, Your Guitar Academy, Paul Davids, Music Is Win, The Groovy Guitar Dude, TrueFire, Signals Music Studio.
Purpose: inform a camera-based chord-shape verification feature.

---

## 1. CHORD DIAGRAMS — near-universal, highly standardized

| Creator | On-screen diagram | Style notes |
|---|---|---|
| JustinGuitar | Yes, always | Proprietary "chord boxes": vertical fretboard grid, black dots with **finger numbers 1–4 inside the dot**, X/O above muted/open strings, sometimes note-function numbers under the box. Dedicated lesson **"How To Read Chord Boxes"** (https://www.youtube.com/watch?v=8gcjbOBWpSA) — teaching the *notation* before the chord. Chord images served as static PNGs (e.g. `jtgt-static.b-cdn.net/images/chords/OG-G-chord.png`). |
| Andy Guitar | Yes | Simple boxes overlaid in-video + PDF/website mirrors (andyguitar.co.uk lesson pages). |
| Marty Music | Light / inconsistent | Marty is talk-and-demonstrate first; chord charts often relegated to a free downloadable PDF ("Get my FREE Guitar Guide PDF—packed with chords, scales, triads") rather than persistent on-screen overlay. |
| GuitarLessons365 (Carl Brown) | Yes, plus **synced tab** | Carl's Patreon explicitly cites investment in "better quality cameras with simultaneous multiple angles" (https://www.patreon.com/GuitarLessons365/about). |
| Your Guitar Academy | Yes | 30 Day Beginner Challenge series uses clean overlays + website chord sheets. |
| Paul Davids | Yes, high production | Animated fretboard/tab overlays, color-coded, cinematic; diagrams appear as motion graphics not static boxes. |
| Music Is Win | Sparse | Tab overlay more than chord boxes; entertainment-forward format. |
| Groovy Guitar Dude | Yes, prominent | Song-tutorial format; chord boxes persistently on-screen while playing along (e.g. "As It Was" tutorial names G, C, Am, D). Also Shorts-format single-chord series ("How To Play 'A Major' Guitar Chord // Beginner Guitar Chord Series #1"). |
| TrueFire | Yes + **fretboard animation** | Interactive player with synced tab/notation, looping, slow-mo, **fretboard animation** (truefire.com/faq). |
| Signals Music Studio | Diagram-heavy but theory-oriented | Jake Lizzio uses whiteboard/graphic overlays to explain *why* a shape works; reviewers praise "the visuals of what's happening" (signalsmusic.studio testimonials). |

**Convention to inherit:** vertical grid, dots numbered 1–4, X/O row on top. This is the de-facto lingua franca — a camera feature should render results *in this exact notation* (e.g. highlight the offending dot red).

---

## 2. HAND VISUALS

- **Baseline (Andy Guitar, Marty Music, Groovy Guitar Dude, Your Guitar Academy):** two-shot editing — talking head + a mirrored/over-the-shoulder close-up of the fretting hand, cut to as needed. Rarely simultaneous.
- **Multi-angle leaders:** GuitarLessons365 (Carl Brown advertises *simultaneous* multiple angles), TrueFire (viewer can **switch camera angles at will** in-player — see In The Jam series, e.g. Eric Gales j211, Keith Wyatt j146), Paul Davids (macro close-ups, overhead, slow-mo).
- **Mirrored / "player's-eye" framing** is common so students don't have to mentally flip.
- **Strumming hand** gets far less close-up time than the fretting hand across all channels — a known blind spot.
- **Nobody offers a true first-person POV rig as standard**; TrueFire's angle-switching is the closest thing to giving the learner control of viewpoint.

---

## 3. TROUBLESHOOTING / "COMMON MISTAKES" — the verification analog

This is where creators do their *human* verification work — by pre-empting mistakes verbally, because they cannot see the student.

- **JustinGuitar, "The F Chord"** (https://www.justinguitar.com/guitar-lessons/the-f-chord-b2-901 / YT: "The Easiest F Chord Guitar Lesson You'll Find :)"): explicitly enumerates **thumb position, wrist position, hand rotation**, plus **6 tips**, opening with "TIP 1 – Curve your first finger". Closing checklist reads almost like a rubric: *"Check your wrist angle! / Pull back slightly with your arm to get pressure. / Check the thumb position and explore the lever effect. / Regularly relax your arm to find the perfect finger position for your anatomy."*
- **JustinGuitar "F Chord Cheats"**: names precise failure modes — "Use your 3rd finger to help mute the 5th string", "be careful not to mute the thinnest string with your 1st finger."
- **JustinGuitar "Chord Perfect Practice"** (Module 1 routine, https://www.justinguitar.com/guitar-lessons/module-1-practice-routine-b1-116): the canonical self-check ritual — form chord, strum, **pick each string individually to find dead/buzzing notes**, remove hand, reform. This is *exactly* the manual procedure a camera feature automates.
- **Marty Music, "The Beginner Mistake That's Killing Your Chord Changes"** (https://www.youtube.com/watch?v=94bp9XLN5kw).
- **Barre-chord mistake videos** are their own genre: "FFF… Frustrating! 7 Tips for the F Bar Chord" (https://www.youtube.com/watch?v=T50g6Eh-h6c), "Fail-Proof Guide To Easy Barre Chords on Guitar" (https://www.youtube.com/watch?v=IxXG5S8vSd8 — "the common mistakes you're probably making, and how to fix them"), "F Barre Chord Exercise for Acoustic Guitar" (https://www.youtube.com/watch?v=9htsZmzU-fw — "clean and buzz free").
- Recurring canonical mistake list across all channels: **flat/collapsed fingers muting adjacent strings; fingers too far from the fret wire (buzz); thumb wrapped over or too high; wrist not dropped; not enough arm pull; strumming the wrong bass string (e.g. low E on a C or D chord).**

**Key insight:** every creator has already written the diagnostic taxonomy. A camera feature does not need to invent error classes — it should detect the ones the whole ecosystem already names.

---

## 4. PROGRESSION OF CHORDS

- **JustinGuitar (Grade 1, most rigorous / most copied):** Module 0 basics + chord boxes → **Module 1: A, D** → **Module 2: E** → **Module 3: minor chords (Em, Am)** + capo → **Module 4: Dm** → **Module 5: C** → **Module 6: G ("hack the G chord")** → Module 7: consolidation of **"The 8 Essential Beginner Chords: A, D, E, C, G, Am, Dm, Em"** (https://www.justinguitar.com/guitar-lessons/the-8-essential-beginner-chords-ch-110). Then **Grade 2 Module 9: F chord** (first barre). Notably Justin starts with **A and D**, *not* Em — because A→D is the fastest route to a playable 2-chord song.
- **Andy Guitar (10 Day Starter Course):** "FIRST Chord to learn on guitar — **E major**" → "SECOND Chord — **A major**" → 2-chord song by Lesson 2 → first riff by Lesson 4. (https://www.youtube.com/playlist?list=PL-RYb_OMw7GfG6MS0WBO1v2qvtomUkZci)
- **Marty Music:** Lesson 1 = **E minor / E**, Lesson 2 = **A major**, ... Lesson 6 = **C major** (https://www.youtube.com/watch?v=HNSaXAe8tyg, https://www.youtube.com/watch?v=TRZilL-BDbI).
- **Your Guitar Academy:** 30 Day Beginner Challenge, day-numbered drip; two-chord song early ("Easy Chords To Play On Guitar – Full Song With Just Two Chords").
- **Groovy Guitar Dude:** song-first — chords are introduced by whatever the trending song needs (G, C, Am, D cluster dominates).

**Consensus sequence:** Em/E → A → D → (Am, Dm) → C → G → **F/barre last**, with the CAGED-adjacent cluster G-C-D-Em-Am being the "play real songs" core. Design implication: a chord-check curriculum should ship the 8-chord open set first, gated in roughly this order, with F/Bm as an explicitly later, separately-scaffolded tier.

---

## 5. VERIFICATION GAP — the headline finding

**No free YouTube creator verifies anything. It is 100% watch-and-copy, plus self-diagnosis by ear.**

- Even the paid apps from these creators do **not** check the student. JustinGuitar community threads are explicit: *"the app does not listen to your performance; it's up to you to judge if you did it right"* and *"chord perfect exercise is not designed to hear your sounds, it's just a timer"* (https://community.justinguitar.com/t/my-concern-with-the-way-the-app-works/75193 , https://community.justinguitar.com/t/how-do-i-properly-use-the-chord-perfect-practice-on-the-app/200534). Users complain about this as a felt deficiency versus Yousician.
- **Where audio-based verification exists it is shallow:** Yousician "listens to you play and gives instant feedback on your accuracy and timing" (yousician.com) — and even *it* is criticized for saying nothing about the body: *"It doesn't show you or tell you anything about hand placement or the proper finger [position]"* (https://www.reddit.com/r/guitarlessons/comments/1bmmf3f/). Audio detection is also setup-fragile ("works so-so with some guitar setups"). JustinGuitar app chord recognition failures are a live complaint thread (https://community.justinguitar.com/t/frustrated-with-the-lesson-app-1-minute-changes-no-longer-recognises-my-chords/314552).
- **TrueFire** is the most technically advanced (multi-angle, fretboard animation, slow-mo, looping) but it is still **one-way playback** — no student-state sensing.
- Camera-based fingering recognition exists only in research/hobby form: Burns & Wanderley, *"Computer Vision Method for Guitarist Fingering Retrieval"* (http://smc.afim-asso.org/smc06/papers/1-Burns.pdf), NVIDIA Jetson chord-detection demo (https://developer.nvidia.com/embedded/community/jetson-projects/guitar_chord_detection), and hobby repos like https://github.com/nathanchiu05/Computer-Vision-Guitar-Tutor. **Zero commercial mainstream product.**

### The gap your feature fills
1. **Audio can tell you a chord is wrong; only vision can tell you *why*.** "Your 3rd finger is flat and muting the B string" is unreachable by pitch detection.
2. **It automates JustinGuitar's own "Chord Perfect Practice" ritual** — the string-by-string dead-note hunt every teacher prescribes and no product performs.
3. **It closes the physical-form loop teachers verbally gesture at** — thumb position, finger curvature, wrist angle, distance from fret wire — which every creator lists as the top failure modes and none can observe.
4. **It works silently and pre-strum**, i.e. can verify a shape *before* the student plays it, which audio fundamentally cannot.
5. **Differentiator vs. Yousician's known weakness** (no hand-placement feedback) — that critique is already the loudest user complaint in the category.

---

## 6. BARRE CHORD (F / Bm) TEACHING

Universal pattern: **delay it, then substitute, then scaffold.**

- **JustinGuitar** — deliberately places F early in *Grade 2* ("the sooner you start, the better"), frames it as an E-shape moved up one fret with 2/3/4 fingers, warns it takes "weeks, if not months". Teaches via **thumb/wrist/rotation/lever effect** and 6 tips starting with "curve your first finger". Then immediately offers **"F Chord Cheats"** (https://www.justinguitar.com/guitar-lessons/f-chord-cheats-b2-902 , YT: "3 F Chord Variations You Need to Know"): **Fmaj7**, **Fmaj7/C**, and the **Mini F** (mini barre with 1st finger, thin 4 strings only) — explicitly "get-out-of-jail chords". Separate lesson: "The Dreaded F Chord" — *barre higher up the neck first, where it's easier*. Plus "Easy Barre Chords For Beginners" (https://www.youtube.com/watch?v=ZYbxYoG6Mo0).
- **Novel techniques seen across the set:**
  - **Partial / mini barre** (top 3–4 strings) before full 6-string barre.
  - **Roll the index finger onto its bony outside edge** so string grooves fall between joints.
  - **Start at fret 5–7** (lower tension, wider frets) and walk *down* to fret 1.
  - **Arm pull / lever effect** — pressure from the elbow pulling back, not thumb squeeze.
  - **Substitutions:** Fmaj7, Fmaj7/C, Mini F, Fsus2; Bm → Bm7 or the 4-string Bm (x-x-4-4-3-2).
  - **Derive the barre from a known open shape** — "barre chords are developed from our common open chords" (https://www.youtube.com/watch?v=qPJKtFi2PmQ).
  - **Buzz-free drills** — play the barre string-by-string, then a play-along exercise (https://www.youtube.com/watch?v=9htsZmzU-fw).

**Product implication:** barre chords are the single highest-value target for camera verification — the failure is almost always *geometric* (index finger flat-on-pad, joint over a string, thumb too high, wrist not dropped, finger behind the fret), i.e. precisely what a camera sees and a microphone cannot diagnose. Ship graded barre scaffolding: mini-F → high-fret barre → fret-1 F, with per-string pass/fail and a specific geometric callout on failure.

---

## Summary table — feature conventions to match vs. gaps to exploit

| Convention | Match it | Beat it |
|---|---|---|
| Vertical chord box, numbered dots, X/O | ✅ render results in this notation | Color the *specific* wrong finger |
| Mirrored fretting-hand close-up | ✅ camera framing guidance | Live overlay on the student's own hand |
| Verbal common-mistake lists | ✅ reuse taxonomy as error classes | Detect + attribute automatically |
| "Chord Perfect Practice" string-by-string check | ✅ same ritual | Automate & log it over time |
| A/E → D → Am/Em/Dm → C → G → F progression | ✅ curriculum gating | Gate on *verified* shape, not self-report |
| Audio feedback (Yousician) | — | Vision explains *why*, works pre-strum |
