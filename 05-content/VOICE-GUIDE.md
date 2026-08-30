# VOICE-GUIDE.md — How the app's instructor talks

This guide is the source of truth for ALL lesson coaching copy (`coaching`,
`avatar_coaching_copy`, `one_line_promise`, exercise purpose/name). It was
distilled from real beginner-guitar YouTube instructors (Andy Crowley's 10-day
challenge, Lauren Bateman's absolute-beginner lesson, and a spider-exercise
tutorial) so the app sounds like a patient human in the room, not a manual.

> Why this exists: owner (Heidi) flagged the original copy as too abrupt — e.g.
> lesson 1 opened with "Pick it up. Sit down." with no warmth or reason. The fix
> is TONE, not just word choice. An emotional TTS (Chatterbox) delivers the
> feeling at runtime; this guide delivers the words. Both must match.

## The 6 rules (apply to every line of spoken/coaching copy)

1. **Second person, in the room.** "Bring your hand up." "That's a real chord,
   I promise." Never "the student should." The teacher is speaking TO the user.
2. **Name the beginner feeling, then release it.** Acknowledge the fear/awkwardness
   out loud, then normalize it. "If this feels like a weird stretch at first,
   that's totally normal." / "Your fingers will fumble the first few times.
   That's normal." Do NOT skip the acknowledgment.
3. **Explain the WHY before the HOW.** Andy's rule: "If it's not in tune it
   doesn't matter where you put your fingers." Lead with the reason a beginner
   cares ("get it in tune and everything after gets easier"), then the steps.
4. **Normalize struggle as data, not failure.** Borrowed mantras:
   - "Practice doesn't make perfect, it makes progress." (Lauren)
   - "The problem isn't your fingers, it's that they haven't learned how to move
     independently yet." (V3)
   - "Go slow enough that you're not repeating mistakes, because your brain
     remembers what you do the most." (V3)
   - "Even I make mistakes." (Lauren) — okay to show the teacher is human.
5. **Concrete physical imagery, not abstractions.** "Loose wrist, like you're
   brushing crumbs off a table." "Press up against the metal, not in the middle
   of the fret." "Thumb rests behind the neck, don't choke it from the top."
6. **Earned encouragement only.** Specific to the action just done ("If you can
   hold E minor and strum it clean, you have officially played a chord"), not
   generic "great job." Warmth must be tied to a real milestone.

## Voice DON'Ts
- No robotic commands with no reason ("Pick it up. Sit down.").
- No AI-isms: "Furthermore," "Moreover," "It is important to note," "Simply."
- No bare chord symbols in SPOKEN text (TTS reads "Em" as "m"). Write "E minor."
  On-screen captions may keep "Em" — only the spoken string is expanded.
- No fear-based pressure ("you must," "don't fail"). Frame struggle as normal.

## Quick tone check (ask before shipping a lesson)
- [ ] Does it speak to "you" in the room?
- [ ] Does it name the awkward beginner feeling before fixing it?
- [ ] Is there a "why" before the first "do"?
- [ ] Is struggle normalized, not shamed?
- [ ] Is there one concrete physical picture (wrist / thumb / fret-side)?
- [ ] Is the encouragement earned and specific, not generic?

## Maintainers
When Heidi drops a new instructor video, extract their spoken phrasing patterns
and fold new rules/examples in here. Re-run the lesson copy against these 6 rules.
Chord DATA is unchanged by voice work — prove with `node run-chord-check.js`
(0 errors, 0 warnings) after any copy edit.
