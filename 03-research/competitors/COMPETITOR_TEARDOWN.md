# Competitive Teardown — Top Guitar Lesson Platforms
Date: 2026-08-04 · Reverse-engineered for the Guitar School app spec/plan.

## Scope
Top 2-3 by reach + one bonus, plus what each does/does NOT do on lesson delivery and platform.
All four are closed-source; their *build* is inferred from public stack + UX. Open-source build
references are in `REVERSE_ENGINEERING_PLAYBOOK.md` (book-of-frets-x, learnhouse).

================================================================
## 1. YOUSICIAN  (audio-recognition leader)
================================================================
LESSON DELIVERY
- "Personal learning path": 10 levels, curricula authored by real music teachers.
- Thousands of lessons / exercises / videos; explore by topic and song, every level.
- Gamified: rewards, high scores, leveling up.
- **Real-time audio recognition**: listens via mic, gives instant feedback on pitch (accuracy)
  and timing. Adjustable tempo (slow down / speed up). Play-along.
- Cross-platform: iOS, Android, PC. No cables/mics required.
- 7-day Premium+ trial; subscription.

PLATFORM / BUILD (inferred)
- Proprietary on-device audio engine (pitch + onset detection). This is their core IP.
- Multi-platform native apps sharing one lesson-content pipeline.

WHAT THEY DO NOT DO
- **No front-camera / hand-tracking.** Feedback is ears-only. They never SEE your hands.
- No technique/pose correction — only "did you hit the right note at the right time."

LESSON UNIT (pattern to note)
- Bite-sized exercise → scored against expected note/timing → looped until mastered.

================================================================
## 2. FENDER PLAY  (structured video curriculum)
================================================================
LESSON DELIVERY
- **Forced structured onboarding**: quiz on skill level + genre → assigns a "Path."
- Hierarchy: **Path → Level → Course → Activity.** (e.g. Acoustic Path, Level 1, Course, Activity)
- Each Activity: video player with multi-cam views of teacher + hands, chords/tabs,
  downloadable tone presets.
- Concise lessons; structured progression; user can pick start level.
- Web + app unified experience.

PLATFORM / BUILD (inferred)
- Content-centric: long-form filmed video is the lesson unit. Light interactivity (tabs synced).
- Subscription (~$150/yr cited in reviews).

WHAT THEY DO NOT DO
- No real-time audio recognition of your playing (light/none).
- **No camera hand verification.**
- Video = filmed human (opposite of our "zero filmed footage" decision, spec §0).

================================================================
## 3. JUSTINGUITAR  (free, teacher-led, community)
================================================================
LESSON DELIVERY
- Free, **grade-based curriculum**: Grade 1 → Grade 3+, each grade = modules/lessons.
- Video lessons (YouTube-hosted), practice routines, "Nitsuj" practice assistant.
- Companion app: day-by-day lessons, progress tracking, song app.
- Teacher-led (Justin Sandercoe); huge free library; paid app/books.

PLATFORM / BUILD (inferred)
- Low-tech: WordPress + YouTube + companion app. Content = long-form video + PDFs.
- App is mostly progress tracking, not interactive recognition.

WHAT THEY DO NOT DO
- **No interactive recognition at all** (audio or camera). App = tracking/progress only.
- Proof that a solo teacher + free content can scale to 2M+ users — but no feedback engine.

================================================================
## 4. SIMPLY GUITAR (JoyTunes)  — bonus, closest audio competitor
================================================================
LESSON DELIVERY
- "Place device in front of you and play; the app recognizes what you play; feedback to improve."
- Beginner-focused, adaptive; if a chord note buzzes/mutes it suggests arpeggiating to diagnose.
- Listen-and-recognize engine (ears-only), like Yousician but simpler.

WHAT THEY DO NOT DO
- Still **ears-only. No camera.** The "diagnose" is audio, not visual hand geometry.

================================================================
## THE GAP = OUR MOAT (confirmed by this teardown)
================================================================
Across ALL FOUR incumbents:
  (a) Feedback is EARS-ONLY (audio recognition). None use the front camera.
  (b) Content = filmed human video OR song tabs. None are synthetic/avatar-led at scale.
  (c) None verify CHORD SHAPE via hand geometry.

=> Spec §1 promise — *"The only app that can SEE why your chord sounds wrong"* — is
   differentiated and **un-contested** in this set. Yousician/Simply get closest (audio),
   but never vision. Our camera arm (MediaPipe Hands 21-landmark → chord classifier, spec §3/§5)
   is the novel layer and the entire bet. This is exactly why the validation gate Q4/Q5
   (will users trust / set up the camera?) is the make-or-break (spec §7, risk R1/R3).

## Threats / what to respect
- Yousician's audio engine is mature; do NOT claim audio parity at v1. Scoping pitch/timing to
  on-device basic-pitch (CoreML) per spec §5 is the right call.
- Fender's "forced onboarding → path" improves completion; we can borrow the *structure*
  (Level→Lesson→Exercise) without the genre sprawl (we're beginner-acoustic only).
- JustinGuitar proves free/top-of-funnel + teacher trust scales — reinforces our free
  tuner+metronome funnel (spec §2/§3).

## Open-source build references (cloned, on disk)
`C:\Users\The Yoda Trader\Desktop\guitar-research\repos\`
  - book-of-frets-x : schema-driven song/chord content — the content-model pattern to steal.
  - learnhouse      : full LMS platform architecture — the platform pattern to study.
  - react-guitar    : interactive fretboard component.
  - alphaTab        : tablature/notation rendering.
See `PLATFORM_BUILD_ANALYSIS.md` for how these map to our build.
