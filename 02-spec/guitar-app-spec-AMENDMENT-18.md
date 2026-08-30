# AMENDMENT-18 — Fun-Delivers-Learning: Six Build Items + De-Risk Slice (binding)

**Date:** 2026-08-29
**Status:** RATIFIED (2026-08-29 by owner Heidi)
**Supersedes:** nothing (additive). Reinforces AMENDMENT-05 (listening engine), AMENDMENT-11 (world-locked teacher + longitudinal memory + duet), ADR-0004/AMENDMENT-17 (World 1 = Emerald Hollow + Sage + performance ladder). Legal floor unchanged (Rule 2/5/8/9).
**Author:** Hermes, on owner directive during the 2026-08-29 "make the app better" session (Boris working discipline).

---

## 1. THE CLARIFIED GOAL (owner, 2026-08-29)

The thing a finished-World-1 student should say to a friend: **"I actually learned to play, and it was fun."**

- **Learning is the goal.** Real skill on a real guitar is the success test.
- **The world is the DELIVERY MECHANISM that makes learning fun** — not the point itself. The world serves the learning. A beautiful world with boring drills fails; a grind that teaches also fails. Both must be true: they got better AND they enjoyed the ride enough to keep coming back.
- **Audience: BOTH a 10-year-old and a 45-year-old** must love it (owner, 2026-08-29).

Success test for any World 1 build decision: *does this help them actually learn to play, and does it make the learning fun enough to return?*

---

## 2. SIX BUILD ITEMS (all owner-approved 2026-08-29, ranked)

### BI-1 — "Look what you can do now" proof-of-progress moment `[APPROVED — build]`
After a level (e.g. porch), Sage cites stored numbers and has the student play a real (simple) song they could NOT play before: *"Three weeks ago you couldn't hold a chord — play this now."* Makes real skill VISIBLE and undeniable. Uses stored mastery numbers (Rule 5-safe) + the existing song track. This designed "you can play now" beat is what converts invisible progress into the felt reward. **Without it, learning stays invisible and feels like a grind.**

### BI-2 — The world REACTS to progress (fun is baked into learning, not decoration) `[APPROVED — build]`
Learning happens INSIDE a place that responds to the student, so repetition itself feels like play:
- Time of day advances up the ladder (porch = morning → village = midday → capstone = golden-hour stage).
- A lantern lights per completed lesson; the village visibly "wakes up" as the student improves.
- The tavern crowd reacts (claps) when a change is nailed.
- Sage's spot/posture changes with the arc.
Cheap in Godot (scene states). This is the difference between "pretty" (wears off in a week) and "fun" (keeps them learning). **Fun must be baked into the learning loop, not bolted on as cutscenes between drills.**

### BI-3 — First 60 seconds: fastest path to one proud sound `[APPROVED — build]`
Onboarding was never spec'd. For BOTH ages, the make-or-break is time-from-open to one sound they're proud of. No menu/settings wall — Sage has them strumming something that sounds okay within ~60 seconds. Highest-leverage single item for "it was fun." Design the cold open explicitly.

### BI-4 — Emotional continuity: Sage remembers the STORY, not just numbers `[APPROVED — build]`
Extends AMENDMENT-11 memory with a thin "story memory," all derived from stored numbers (Rule 5 holds, AMENDMENT-11 Red Line 2 holds, v1 scope cap respected — no behavioral profiling):
- **Milestones:** first chord nailed, first song, longest streak.
- **Comeback flag:** returned after N days away → *"Hey, you're back — I kept your spot."*
- **Nemesis chord:** the chord that took the most tries → when finally mastered, Sage makes a moment of it.
Small build (3-4 data fields + prose templates), large emotional payoff. Makes returning fun instead of a chore — which is what gets them far enough to actually learn. **This is the differentiator no competitor has.**

### BI-5 — Two registers from ONE Sage (the 10-vs-45 problem) `[APPROVED — build]`
Same Sage, same character, same voice — but warmth-dialed-for-kid vs. peer-respect-for-adult, chosen once at onboarding ("who's learning?"). A prose-template switch (Rule 5-safe) + up to two Chatterbox emotion settings. NOT a second teacher (World 2+ scope). **Without it, the app half-pleases both ages and delights neither.**

### BI-6 — De-risk the listening engine INSIDE the beautiful slice `[APPROVED — build]`
The listening engine's real-world accuracy (cheap phone mic, noisy room, a beginner's buzzy chords) is the load-bearing wall for the whole app — coaching, jam, duet, and mystery mode all depend on it hearing correctly. If it says "wrong!" when the student played it right, learning stops being fun and the relationship dies. AMENDMENT-11 Red Line 3 already gates the duet on this. **This amendment pulls listener-accuracy verification EARLY:** the first vertical slice doubles as the real-device listener test (see §3). Find out for the price of one lesson, not the whole app.

---

## 3. THE DE-RISK VERTICAL SLICE (owner-approved recipe, 2026-08-29)

Owner chose "build the beautiful vertical slice first" + "test with 5-10 real beginners before the full build." The slice must prove **all three at once**:

1. **Real learning** — teaches ONE real chord; student can play it after.
2. **Fun world** — set in Emerald Hollow (porch), the world reacts (BI-2), fast proud-sound open (BI-3).
3. **Sage remembers** — ONE memory beat (BI-4): Sage greets the student by remembering last time.

And it secretly runs the **real-phone listening-engine test** (BI-6) on the beginners' own devices.

**Beginner-test scorecard (3 yes/no's decide if the vision holds):**
- Can they play the chord AFTER the slice? (real learning)
- Did they smile / want to keep going? (fun)
- Did Sage HEAR them correctly on their own phone? (the load-bearing risk)

If all three are yes across 5-10 beginners, the full build is de-risked. If the listener fails, that's the cheapest possible place to learn it.

---

## 4. WHAT THIS DOES / DOES NOT
- DOES: bind the clarified goal (fun delivers learning); add six build items; make the first slice a three-way proof + real-device listener test.
- DOES NOT: relax Rule 2 (no camera/hand tracking), Rule 5 (LLM prose-only, cites stored numbers), Rule 8 (chord correctness), or Rule 9 (license blocklist). All story-memory and register copy is generated FROM stored numbers, never freelanced.
- DOES NOT: add behavioral profiling (AMENDMENT-11 §4 scope cap holds).
- DOES NOT: change the bound stack (FLUX.1[schnell] + Wan2.2-I2V + Chatterbox + Kokoro + Godot + ACE-Step/YuE) or the world-building-prompt routing (AMENDMENT-17).
