Type: grilling
Status: resolved
Blocked by: 02

## Question

The AI plays a two-bar phrase using the chords the student knows; the student answers with their own phrase; the AI responds back. No single right answer — creative play inside the chords the student has, but the AI keeps it musical (stays in key, respects tempo, doesn't play something way over the student's head).

## Answer

**Q1 — Generative music model: generate fresh (A), cloud GPU authorized.**
ACE-Step or YuE (both free + commercially clean, verified 2026-08-17), cloud GPU (~$0.50 per 20-lesson set, one-time, authorized). The AI generates a fresh two-bar phrase each time using the chords in the student's current set. This decision is shared with 06 (celebration moments — backing groove) and 07 (practice remix — play-along groove): all generative-music features in the app use the same approach.

**Q2 — Input/grading: the AI grades what it hears, against what it knows the student has.**
The student's answer comes in through the existing on-device listening engine (constrained target-matching — it checks what was played against what it expects, no open-ended transcription). The AI then grades the phrase against the chords it knows the student has been taught: did they stay in key, did they use chords from their current set, did they respect the tempo. It responds meaningfully — "nice, you stayed in Em the whole time" — but only cites real data. If it can't hear something clearly, it says so: "I'm not sure I caught that, play it again." No invented praise (Rule 5), no made-up musical opinions. Still creative play — no single right answer — but the AI pays attention and responds.

**Q3 — On-device vs cloud: the round-trip shape.**
On-device listening → the listening engine hears the student's answer on-device and figures out what it can (which chords were played, did they match the student's current set, did they stay in key) → the agent on-device sends *only* those facts (no audio) to the cloud → the cloud generates a two-bar response phrase in the right key using the student's chords → the audio comes back to the device and plays through the speaker. **Audio never leaves the device** (AMENDMENT-05 holds — only metadata goes to the cloud). If the cloud connection is slow or drops, the AI waits or falls back: "I'll play something when we're back online."

**Q4 — Scope: weaves into regular lessons, not a separate mode.**
Call-and-response is part of the lesson flow. Sage plays a phrase during a normal lesson and waits for the student to answer — "Your turn — answer this with the chords you know." The student doesn't opt into a separate "jam" mode; the teacher uses it naturally as part of learning. (Could become a dedicated mode later if it makes sense, but v1 is woven into lessons.)

**Q5 — Relation to Path B duet: both use the generative music approach.**
Path B duet was pre-built accompaniment (loop/wait/simplify, built per performance ahead of time). It's now generative, using the same pipeline as call-and-response (ACE-Step/YuE, cloud GPU, on-device listening, facts-to-cloud round-trip, audio-back). They share the generation approach but use it differently:
- **Call-and-response:** generate a two-bar phrase, play it, listen to the student's answer, generate a response back — a musical conversation.
- **Duet:** generate accompaniment that follows the student's playing as they play — a sustained groove that rides along, not one phrase and a response.
Duet is no longer "pre-built and done" — it's now generative, same pipeline, different use of it. The generation approach (ACE-Step/YuE, cloud, round-trip) is the app's standard for *any* generative music going forward.

**Dependencies:** 02 (resolved — agent design). 04, 06, and 07 all share the generative-music decision (Q1). 04 is the first feature to bring it in.

---
