# DESIGN REDLINE IMPLEMENTATION PLAN

**Status:** Approved direction; implementation not started  
**Created:** 2026-09-02  
**Purpose:** Turn the current catalog-style PWA into the promised Emerald Hollow experience: Sage teaches, listens, remembers, and plays alongside the student.  
**First target:** One exceptional, phone-ready Lesson 1 vertical slice.  

This plan incorporates the complete design review from 2026-09-01. It supersedes the design strategy in `BUILD-PLAN-FIRST-LESSONS.md` where that plan postpones the teacher, world, and listening experience. That older document remains historical context. This plan does not ratify a new product-spec amendment or change curriculum, licensing, backend, or music-accuracy rules.

---

## 1. Outcome

The first screen should make the product understandable without explanation:

> Enter Emerald Hollow. Sit with Sage. Learn one physical action at a time. Play it on your guitar. The app listens and responds honestly.

The experience is successful when a first-time guitarist can open the app on a phone, tune the guitar, make a first strum, understand what the app heard, and finish feeling that Sage—not a document—guided the session.

## 2. Product principles

1. **The lesson is primary; the catalog is secondary.** Open on the student's next useful action.
2. **Show the promise immediately.** Sage, Emerald Hollow, and listening must appear in the first session.
3. **One decision per screen.** Do not make a beginner scan a dashboard while holding a guitar.
4. **Demonstrate, then invite, then listen.** Every physical skill follows the same learning rhythm.
5. **Feedback must be truthful.** Below confidence threshold: “Not sure—play that again.” Never invent praise or show a false red X.
6. **The world supports instruction.** Atmosphere can never reduce diagram clarity, contrast, responsiveness, or audio control discoverability.
7. **Progress means ability, not content consumed.** Celebrate sounds made and skills demonstrated—not pages visited.
8. **Design for a guitar in both hands.** Large targets, minimal typing, short copy, voice control where reliable, and easy pause/resume.

## 3. Information architecture

Replace the current landing page plus 25-card wall with five focused surfaces:

### A. Today

- Full-bleed or framed Emerald Hollow porch scene with Sage visible.
- Primary card: **Continue / Begin Lesson 1**, duration, and specific outcome.
- Small listening affordance: “This lesson uses your microphone to help you tune.”
- One next milestone and one recent win after progress exists.
- Secondary links: Journey, Tools, Settings.

### B. Lesson player

- Sage/world stage in the upper portion.
- One active instruction beneath it.
- Contextual visual: guitar anatomy, string target, chord diagram, or rhythm pulse.
- Persistent but unobtrusive audio controls: replay, captions, pause.
- Contextual action area: Start listening, Try it, Continue, or Continue without microphone.
- Visible step progress such as **2 of 5**, not a long page of exercises.

### C. Journey

- A visual path through Emerald Hollow rather than a grid of disabled cards.
- Show the current location, the next two or three destinations, and performance milestones.
- Locked items explain the capability required, not merely “locked.”
- Full 25-lesson list remains available as an accessible compact view.

### D. Tools

- Free tuner and metronome are immediately accessible.
- Tools use the same listening language and visual system as lessons.

### E. Progress

- Skills and confidence: tuning, relaxed strum, Em, chord changes, rhythm.
- Past wins and upcoming performance invitations.
- Avoid gamification that implies accuracy the listening engine did not establish.

## 4. Lesson 1 vertical slice

Build this before redesigning all 25 lessons.

### Scene 0 — Arrival

- Fade into the tavern porch with subtle fog, leaf, smoke, and lantern motion.
- Sage is present with a guitar and delivers a short welcome.
- Primary action: **Pull up a chair**.
- Captions default to the user's accessibility preference and remain easy to enable.

### Scene 1 — Permission and microphone

- Explain the benefit before the browser permission prompt.
- Copy: “I can help you tune by listening only while this lesson is open. Your audio stays on this device.”
- Actions: **Use microphone** and **Continue without it**.
- Include clear denied, unavailable, noisy-room, and retry states.

### Scene 2 — Meet the guitar

- Sage gives the ten-second tour.
- Show an interactive, responsive guitar illustration with tap targets for headstock, tuning pegs, neck, frets, body, bridge, and strings.
- Do not require memorization or quiz every label.
- Completion action: **I've got the guitar**.

### Scene 3 — Tune six strings

- One string at a time, low E through high e.
- Large target note, string location, live pitch indicator, and plain-language direction: loosen, tighten, in tune, or not sure.
- Give immediate replay of Sage's instruction.
- Show all six strings as a compact progress rail.
- Permit skip/retry and retain access to the full tuner.

### Scene 4 — First strum

- Sage demonstrates a slow relaxed down-strum.
- Show one motion cue, not a paragraph.
- Student taps **I'm ready**, then the app listens for an attempt.
- Responses:
  - Confident detection: acknowledge the sound made.
  - Low confidence: “Not sure—give me one more slow strum.”
  - No microphone: student can self-report without being hard-blocked.

### Scene 5 — Earned close

- Celebrate the actual outcome: guitar tuned and first sound made.
- Small environmental reward: lantern brightens, porch music resolves, or Sage plays a short response.
- Save progress locally and, when available, to encrypted sync.
- Primary action: **Come back for the pick lesson**.
- Secondary action: **Strum once more**.

## 5. Visual design redlines

### Keep

- Muted forest, moss, stone, mist, and restrained warm accents.
- Editorial serif for short emotional headings.
- Calm pace and welcoming language.

### Change

- Replace the generic gradient hero with actual Emerald Hollow art or a staged world frame.
- Put Sage on screen; never introduce an unseen teacher as the main relationship.
- Rename visible branding from the placeholder-feeling “GuitarApp.” Shortlist and validate either **Emerald Hollow** as the product or a stronger master brand with “Emerald Hollow” as World 1. Do not rename code/package identifiers until the owner approves the brand.
- Establish a UI sans-serif optimized for small screens and a display serif limited to headings.
- Define a spacing scale, type scale, elevation system, and semantic color tokens.
- Reserve green for progress/success, amber for attention/listening uncertainty, and neutral surfaces for ordinary actions. Avoid orange as an implied failure state.
- Use a minimum 44×44 CSS-pixel target; prefer 52–56 pixels for play-state controls.
- Prevent horizontal overflow at 320, 360, 390, and 430 CSS-pixel widths.
- Respect safe-area insets, text zoom, reduced motion, high contrast, and screen readers.

## 6. Component plan

Create reusable components rather than one-off lesson markup:

- `WorldStage`: background, Sage placement, captions, ambient-motion controls.
- `TeacherMoment`: spoken line, replay, caption, expression/pose cue.
- `LessonStep`: one instruction, one supporting visual, one primary action.
- `ListeningPanel`: idle, permission, listening, detected, uncertain, unavailable, and retry states.
- `Tuner`: six-string progression plus standalone tool mode.
- `GuitarAnatomy`: interactive guitar map with accessible equivalents.
- `SkillVisual`: verified fretboard/string/rhythm visualization.
- `LessonProgress`: step count and resumable state.
- `JourneyMap`: current, next, milestone, completed, and locked states.
- `FeedbackActions`: contextual self-report fallback; replaces the global fixed “Got it / Not yet” bar.
- `Celebration`: restrained, earned feedback with reduced-motion behavior.

All fretboard and fingering visuals must be driven from the arithmetically verified chord data.

## 7. Loading and reliability plan

- Load the shell, current lesson metadata, and first scene before requesting the complete curriculum.
- Do not fetch all 25 lesson files before making Lesson 1 usable.
- Preload only the next lesson step and critical audio/art.
- Replace indefinite “Loading your lessons…” with skeleton content, progress, retry, and offline states.
- Cache the current lesson and core tools for interruption recovery.
- Restore the exact lesson and step after reload.
- Make microphone failure non-blocking.
- Keep the app useful with reduced motion, muted audio, slow connections, and offline cache.

## 8. Build phases

### Phase 0 — Baseline and decisions

**Work**

- Record desktop/mobile screenshots and interaction inventory.
- Confirm which restored files are real versus placeholders before editing.
- Decide the implementation surface for the vertical slice: upgraded PWA first, with Godot/world media embedded as assets where practical.
- Approve the temporary visible brand treatment.
- Define analytics events without recording raw audio.

**Exit criteria**

- Approved wireflow, state list, component map, art requirements, and technical approach.

### Phase 1 — UX prototype

**Work**

- Create phone-first wireframes for Today, Lesson 1, Journey, Tools, and Progress.
- Prototype every Lesson 1 state, including microphone denial and uncertain detection.
- Test at 320–430 pixel widths and with keyboard/screen-reader navigation.

**Exit criteria**

- A beginner can complete the prototype without explanation; no horizontal overflow; every state has a next action.

### Phase 2 — Visual foundation

**Work**

- Implement design tokens and responsive layout.
- Produce/select the porch scene and Sage assets under existing license rules.
- Establish motion, caption, focus, and sound-control behavior.

**Exit criteria**

- The first screen visibly communicates world, teacher, lesson, and listening; all assets meet palette and license gates.

### Phase 3 — Lesson 1 implementation

**Work**

- Build the step-based lesson player and Lesson 1 scenes.
- Integrate teacher voice, guitar anatomy, tuner, listening states, progress, and completion.
- Replace the fixed self-report footer with contextual fallback actions.
- Add local resume and progress persistence.

**Exit criteria**

- Complete Lesson 1 works on representative iPhone and Android viewport sizes; no dead controls or simulated detection presented as real.

### Phase 4 — Home and Journey redesign

**Work**

- Make Today the default returning-user surface.
- Replace the 25-card wall with the Journey map and compact accessible list.
- Add performance milestones and skill-based lock explanations.

**Exit criteria**

- A user can identify what to do now, what comes next, and why a future milestone matters within five seconds.

### Phase 5 — Validation and refinement

**Work**

- Test with the owner, then 3–5 true beginners holding guitars.
- Observe permission comprehension, tuning success, instruction clarity, one-handed usability, and emotional response.
- Fix blockers before extending the lesson system.
- Run existing smoke, fidelity, service-worker, curriculum, chord, and legal gates.

**Exit criteria**

- At least 4 of 5 beginners complete the first strum without outside instruction; no critical usability/accessibility defects; technical gates green.

### Phase 6 — Extend the system

**Work**

- Apply the validated pattern to Lessons 2–5.
- Add skill progress and longitudinal-memory presentation.
- Build the first porch performance invitation at the curriculum-approved gate.
- Introduce the Path B duet only after its listening/loop/wait/simplify states are fully designed.

**Exit criteria**

- Lessons 1–5 form a coherent first-week arc and culminate in a clearly earned musical moment.

## 9. Acceptance checklist

The redesign is not complete unless all statements are true:

- [ ] Sage is visible and meaningfully present throughout Lesson 1.
- [ ] Emerald Hollow is visually recognizable without explanatory copy.
- [ ] The home screen prioritizes one next action over a catalog.
- [ ] The student encounters listening in the first lesson.
- [ ] Raw microphone audio is never uploaded.
- [ ] Uncertain listening results ask for another attempt without punishment.
- [ ] Every lesson step contains one primary action.
- [ ] The tuner is real and accessible from both the lesson and Tools.
- [ ] Guitar anatomy and future fingering diagrams remain readable on a 320-pixel screen.
- [ ] There is no horizontal clipping at supported phone widths.
- [ ] The user can continue without microphone permission.
- [ ] The fixed global “Got it / Not yet” bar is removed.
- [ ] Progress survives refresh and resumes at the correct step.
- [ ] Loading, empty, offline, denied, and error states are designed—not left to browser defaults.
- [ ] Reduced-motion, captions, focus order, touch sizes, and text zoom are verified.
- [ ] No protected song material, blocked-license asset, or unverified musical claim is introduced.
- [ ] Existing automated gates pass after implementation.

## 10. Measurement plan

For early testing, measure:

- Lesson 1 start-to-completion rate.
- Microphone permission accept/decline rate.
- Time to tune each string and total tuning completion.
- Count of uncertain detections and retries.
- Continue-without-microphone usage.
- First-strum completion and repeat-strum selection.
- Step abandonment and resume success.
- Beginner test feedback: “Did this feel like a person teaching you?”

Do not optimize streaks, lesson counts, or conversion until the first learning experience works.

## 11. Explicit non-goals for the first vertical slice

- Redesigning all 25 lessons before testing Lesson 1.
- Building World 2 or multiple teachers.
- Shipping Path A live adaptive duet.
- Replacing verified curriculum or chord data.
- Finalizing the paid subscription experience.
- Uploading or retaining student audio.
- Adding ornamental animation that delays the active instruction.

## 12. Recommended first build session

When implementation begins:

1. Re-verify current disk and test state.
2. Produce a complete Lesson 1 state diagram and 390×844 wireframe.
3. Fix the mobile overflow and progressive loading architecture.
4. Build the step-player shell with placeholder-safe Sage/world slots.
5. Implement microphone permission and listening-state UI before visual polish.
6. Review the working slice on an actual phone before proceeding to the Journey map.

That order attacks the largest product risk first: whether the promised teacher-led, listening lesson feels real and usable—not whether the catalog looks polished.
