# ADR-0003 — Mystery Mode: Capstone-Gated Ear-Training Lane

**Status:** Accepted
**Date:** 2026-08-22
**Decided in:** Grill #3 (grill-with-docs, Hermes + owner)

## Context

The repo already locks the *legal* shape of Mystery Mode (AMENDMENT-12/13/14):
songs only (no lyrics / riffs / tab), band names need a trademark disclaimer,
distinctive progressions need counsel sign-off before paid launch, and every
hint needs a human lyric read-through. What was NOT pinned was the *play loop*
and how Mystery Mode relates to the rest of the product.

Grill #3 settled it.

## Decision

Mystery Mode is an **advanced, opt-in lane** for students who have completed the
core 25-lesson curriculum (capstone done). It reuses three already-built pieces:
the song-progression track (AMENDMENT-12/14), the listening engine
(AMENDMENT-05), and Student Memory (ADR-0001).

**Play loop:**
1. Student picks a mystery from the pool whose chords they've all learned
   (AMENDMENT-13 prereq gate — unlearned ones show greyed with the missing
   chord named, as a goal, not hidden).
2. The app **blanks the chord names**. Primary path: the app plays the
   progression and the student **picks the chord names from a list** (pure ear
   training, **no guitar / mic required**). Bonus: they may play along and the
   listening engine verifies it — mic is a bonus layer, not required.
3. Wrong guesses get an **up to 3-step hint ladder** (chord count → one named
   chord → the key), full reveal on the 3rd miss.
4. **Reveal**: the app plays the progression AND shows the chord-name sequence +
   a one-line "why it works" (key + movement).
5. Progress (mysteries solved + success rate) writes to **Student Memory**,
   encrypted cross-device (ADR-0001) — so the teacher can say "you did really
   great on the first three, let's step it up and try the four-chord monster"
   on any device.

**Difficulty** ranked by chord count + how atypical the order is (2 = easy, 4 =
monster); drives the encouraging teacher copy.

**Legal:** the 9 trademarked songs show "not affiliated / not endorsed" on the
select card (under the title) and the reveal screen. House of the Rising Sun
(public domain) needs none. Every hint text passes a human lyric read-through
before ship (AMENDMENT-14 — a regex cannot catch a paraphrased lyric).

**Tone:** the teacher copy is encouraging, not clinical — it builds the student
up, then invites the harder challenge. Baked into the reveal + difficulty copy.

## Considered Options

- **Mic-required (play to verify):** rejected as the primary path — the
  listening engine is proven but adds friction (permission, room noise); an
  ear-training lane shouldn't gate on owning a guitar in the moment. Mic stays a
  bonus verify path.
- **Hide unlearned mysteries entirely:** rejected — greyed-with-missing-chord
  gives a motivating goal ("finish L8 to unlock this one").
- **Flat scoreboard reveal (just the names):** rejected — playing the
  progression back makes it musical, not a quiz; matches the "teacher plays it"
  world thesis.
- **Paywall the lane:** rejected — it's the reward for finishing the curriculum,
  not a upsell (no RevenueCat keys yet anyway; AMENDMENT-13 = opt-in advanced
  lane for enrolled students).

## Consequences

- Good: reuses 3 built systems, no new backend; the "teacher remembers you"
  moat (ADR-0001) now covers an advanced lane; legally clean by construction
  (disclaimer-on-card + human hint review).
- Trade-off (accepted): Mystery Mode is locked behind capstone completion, so
  beginners never see it — intended (AMENDMENT-13 advanced lane).
- Constraint carried forward: the hint-ladder copy is NOT auto-generated —
  human lyric read-through is a required ship gate (AMENDMENT-14). The
  listening-engine verify path is optional and must not block the list-pick path.
- Open for the build phase: exact "why it works" one-liner per song is
  content-authoring work, not a design decision — flag in the spec tickets.
