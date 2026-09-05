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

## Learner-type registers (`copyVariants`)

Lessons 1–5 carry a `copyVariants` object beside `avatar_coaching_copy`, keyed
`kid`, `adult-beginner`, and `returning`. All three registers teach the exact
same skill, in the exact same order, with the exact same chord data — only the
*framing and pacing language* changes. Never let a register touch musical
facts, chord fingerings, or `qa_status`; those live only in `chords` and
`exercises[].params` and are shared across all three.

- **`kid` (ages 7–12).** Short sentences, playful comparisons, exclamation
  points earned by an actual result, no jargon that isn't immediately defined.
  Physical cues become games or silly images ("wrist loose and floppy, like
  you're shaking off water"). Praise lands fast and often, but stays tied to
  what just happened.
- **`adult-beginner` (default register).** The voice already documented above
  in the 6 rules — patient, in-the-room, explains the why before the how. This
  is the fallback when a profile is absent or a variant is missing (see
  `lesson-runner.js`).
- **`returning` (a player who's done this before, or is picking the guitar
  back up).** Assume competence. Skip the beginner-feeling acknowledgment —
  they don't need it named — and compress the how into a quick refresher or a
  named checkpoint ("check the thumb — that's usually the first thing that
  slips"). Pacing is faster; the register trusts the player to self-correct.

### Two worked before/after examples

**Example 1 — L03, forming E minor (`ex1_intro`).**
- *Before (single register, adult-only):* "Bring your hand up to the neck.
  Middle finger on the A string, second fret. Ring finger right next to it on
  the D string, also second fret."
- *After, `kid`:* "Now bring your hand up: middle finger lands on the A
  string, second fret. Ring finger sits right next to it on the D string,
  same fret. Feels like a stretch? Good — that means it's working."
- *After, `returning`:* "You know this one: middle finger on the A string
  second fret, ring finger on the D string second fret, thumb relaxed behind
  the neck. Check the thumb — that's usually the first thing that slips when
  you've been away a while."

Same fingers, same frets, same chord. The kid version adds a game-like
reassurance; the returning version drops the teaching entirely and points at
the one thing most likely to have drifted.

**Example 2 — L05, closing a rhythm lesson (`wrap`).**
- *Before (single register, adult-only):* "You've strummed in time. Take that
  same loop further and keep the tempo steady — consistency here pays off in
  every lesson after this one."
- *After, `kid`:* "You strummed in time, awesome! Take that same loop and show
  it off. Keep it steady and everything else follows."
- *After, `returning`:* "Timing's solid. You're fully caught up — next
  lessons can move at a normal clip from here."

The milestone (strumming in time, ready to move on) is identical across all
three; only the register's relationship to praise and pacing changes.

## Maintainers
When Heidi drops a new instructor video, extract their spoken phrasing patterns
and fold new rules/examples in here. Re-run the lesson copy against these 6 rules.
Chord DATA is unchanged by voice work — prove with `node run-chord-check.js`
(0 errors, 0 warnings) after any copy edit.
