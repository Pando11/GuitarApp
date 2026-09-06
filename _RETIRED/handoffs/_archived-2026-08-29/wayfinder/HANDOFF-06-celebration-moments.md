# Handoff — GuitarApp wayfinder, point to 06 (celebration moments)

**Where the map is now (2026-08-26):**

8 of 10 tickets resolved. 2 left on the frontier:

- **06 — Celebration moments** (grilling, HITL — needs the owner in chat)
- **08 — World factory pipeline first scene** (prototype + task, prompt draft already written)

All research tickets are done (01, 09, 10). All five new AI features are either resolved (03, 04, 05, 07) or ready to grill (06).

---

## What's already decided (carry this into 06)

These are the answers that 06 depends on or inherits — read them before grinding through 06's sub-questions.

**From 02 (agent definition — resolved):**
- The agent is a **lesson director** (picks the next step, adjusts pacing, notices when the student is stuck, sequences the five features) — not just a chat tutor waiting to be asked.
- Voice = **Sage** (Chatterbox built-in voice), one persona: chill/warm/encouraging.
- Lives **on-device** (thinking + listening + voice); PocketBase (AMENDMENT-16) keeps student memory synced across devices.
- Memory: three layers — (1) what it saw the student struggle with (mastery + confidence from listening/practice data), (2) what practice it assigned last time, (3) how it went when it checked back.
- The teacher speaks warmly from what it knows, not cold data quoting, not invented praise (Rule 5), not student profiling. "It seems to me you like more upbeat stuff" is fine because the teacher actually remembers the student's taste. "You're a natural" / "I bet you'd love this song" are guesses with nothing behind them — out.
- Full fence lines: no camera/hand tracking (Rule 2), audio never leaves the device (AMENDMENT-05), only teaches what's allowed (AMENDMENT-12/14 — chords, progressions, song titles; no riffs/melodies/lyrics/tabs; band names = trademarks + disclaimer), only approved tools (Rule 9).

**From 04 (call-and-response jam — resolved this session):**
- **Generative music decision:** ACE-Step or YuE (both free + commercially clean), cloud GPU authorized (~$0.50/20-lesson set, one-time, not a subscription). The AI generates fresh phrases each time.
- **Round-trip shape:** on-device listening → facts (no audio) sent to cloud → cloud generates response → audio back to device. **Audio never leaves the device** (AMENDMENT-05 holds — only metadata goes to the cloud). If cloud drops, AI waits or falls back.
- **Path B duet moved from pre-built to generative** — same pipeline, different use (duet = sustained accompaniment that follows the student; call-and-response = phrase/response conversation).
- **This decision is SHARED with 06** — the celebration moment's backing groove uses the same generative music approach (ACE-Step/YuE, cloud, same round-trip).

**From 03 (song discovery — resolved):** per-match "why Sage picked this" notes, two-lane match (play today / next step), stays inside the 10-song track with not-affiliated disclaimer, public-domain songs flagged (House of the Rising Sun).

**From 05 (stylistic explorer — resolved):** strumming pattern + rhythm feel, one bar at a time with counts; style-as-category (no artist names); within-lesson tool; prototype built (`06-prototypes/song-styles-q5-prototype.html`).

**From 07 (practice remix — resolved):** all six framings stay; engagement-data-only sequencer (no personality inference); built on existing practice engine; reframing layer on top of adaptive practice plan (AMENDMENT-05 #4); Q5 prototype built + owner-verdicted "It all looks good."

---

## What's left — ticket 06

**File:** `.scratch/wayfinder/issues/06-celebration-moments.md`

**What it is:** After a good week, the app puts together a tiny "look what you did." The student's cleanest chord changes from that week set to a little backing groove, and Sage says something specific and personal: *"Last Tuesday you couldn't switch from G to C without stopping. This week you did it 28 times in a minute. That's real."* Something the student can feel proud of. Optionally shareable (with clear privacy controls — the student chooses).

**5 sub-questions to grill, one at a time:**

1. **What data goes in the moment?** Stored numbers only (Rule 5) — mastery per chord, confidence 0–100, 30/60 changes, weak-pair review history, lesson completions. The teacher's words cite the numbers, not invented praise. The backing groove uses the chords the student has been working on.

2. **Who triggers it?** The agent notices a good week and assembles it. Or the student opens "My Progress" and sees it. Or both.

3. **Shareable?** The student opts in to sharing (clear privacy control). What's shared — the audio moment, a Godot scene of the performance, the teacher's words? Nothing leaves the device without opt-in. How does this interact with the "no audio leaves the device" rule (AMENDMENT-05) — does a shared moment count as "leaving"? (If the student chooses to share a rendered file, that's the student's action, not the app uploading listening data — but the boundary should be explicit.)

4. **Is this part of the existing "human-feeling progress reports" (AMENDMENT-05 #8 — built)?** Or is it a new, richer form? The existing one is "progress reports" — this is a *moment* with audio + scene + personal teacher words. If it's a new form, does it replace or augment the existing one?

5. **Privacy model:** what does the student control? (Share / don't share per moment? A global share toggle? Who can see shared moments — just the student's own devices, or other students?)

**Dependencies:** Blocked on 02 (resolved — now unblocked). Shares the generative-music decision with 04 (resolved) — the backing groove uses ACE-Step/YuE, cloud GPU, on-device listening → facts-to-cloud → audio-back round-trip.

**Key constraint for 06's answers:**
- The teacher's words must cite real stored numbers, not invented praise (Rule 5). "Your G-to-C confidence went from 41 to 72 this week" is fine; "you're getting really good" without a number behind it is not.
- The backing groove uses the generative music approach from 04 (ACE-Step/YuE, cloud).
- Shared moments: the student's audio rendered into a file and shared is the student's action — but the boundary between "the app uploading listening data" and "the student choosing to share a rendered moment" should be explicit (sub-question 3).

---

## How to work 06 in the new conversation

1. **Load the map** — read `.scratch/wayfinder/map.md` for the low-res index. Read `.scratch/wayfinder/issues/06-celebration-moments.md` for the full question and 5 sub-questions.
2. **Read this handoff** — it has the context 06 needs (agent design from 02, generative music from 04, the other resolved features).
3. **Grill 06's sub-questions, one at a time**, in chat, plain language. Start with Q1 (what data goes in the moment).
4. **Record each answer** in the ticket file as you resolve it, under a `## Answer` heading. Set `Status: resolved` when all 5 are done, and append a gist + link to the map's Decisions-so-far.
5. **After 06:** the next frontier ticket is **08** (world factory pipeline). Its Part B prompt draft already exists at `.scratch/teacher/t-b1-flux-prompt-draft.md` — a palette-locked, hand-safe FLUX prompt for the Emerald Hollow porch. 08 still needs: first scene confirm, teacher character source decision, Sage's voice line, cloud GPU budget decision. Then 08's Part A (rent cloud GPU + generate the first still + set up the Godot scene).

**Re-sync rule:** if working on 06 or 08 produces a new ADR in `docs/adr/`, re-sync AGENTS.md + 01-START-HERE/README.md + HANDOFF.md before considering it live. The map lives under `.scratch/` and is not committed prose — it can be re-derived from the closed tickets.

---

## Status flag note

The ticket file for 06 currently has `Status: claimed` (set this session). When a new session picks it up, it can either keep that status or change it to `Status: claimed` again (it's just a "this session is working on it" flag). When all 5 sub-questions are resolved, set `Status: resolved` and write the `## Answer` section.

---

*This handoff is self-contained. A new session can start grilling 06's first sub-question immediately after reading the ticket file + this document.*
