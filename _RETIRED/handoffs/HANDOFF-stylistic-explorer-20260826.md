# HANDOFF-stylistic-explorer-20260826.md

## Where we are

Wayfinder map "AI-augmented GuitarApp" — research phase complete (01, 09, 10 all resolved), grill phase in progress. **03 — Song discovery by taste is resolved** (Q1-Q4 locked earlier; Q5 prototype built against the real 10-song catalog and owner-verdicted "it looks great" on 2026-08-26). The frontier now reads **05 — Stylistic explorer** (open, unblocked, grilling + prototype), then 07, then 08.

## What's decided and locked

From ticket 02 (resolved):
- The agent is a **lesson director** (not just a chat tutor) — picks the next step, adjusts pacing, notices when the student is stuck, sequences the five features.
- What the teacher remembers: **three layers** — (1) what it saw the student struggle with (mastery + confidence from listening/practice data), (2) what practice it assigned last time, (3) how it went when it checked back. Speaks warmly from what it knows — "it seems to me you like more upbeat stuff" is OK; "you're a natural," "you're ready for a real performance," "I bet you'd love this song" are guesses with nothing behind them (Rule 5).
- Who speaks: **Sage** (World 1 = Emerald Hollow), one Chatterbox built-in voice (MIT, no cloning), one persona (chill/warm/encouraging). Same persona in Godot animated world AND in-app chat text. Agent is Sage-extended, not a new persona.
- Where the teacher's brain lives: **on the device** — thinking + listening + voice all on-device. PocketBase (AMENDMENT-16) keeps student memory synced across devices. Audio never leaves the device (AMENDMENT-05).
- Constraint boundary (fence lines): no made-up musical opinions (Rule 5), no camera/hand tracking (Rule 2), audio never leaves device (AMENDMENT-05), only teaches what's allowed (AMENDMENT-12/14 — chords, progressions, song titles; no riffs/melodies/lyrics/tabs; band names = trademarks + disclaimer), only uses approved tools (Rule 9 — Chatterbox, FLUX/Wan, Godot; no ElevenLabs/Midjourney/Suno).
- One teacher per world, one memory per student across all worlds.

From ticket 03 (resolved, 2026-08-26):
- Taste input = voice-primary, buttons as fallback.
- Matching against = both the 10-song catalog AND cumulative chords taught (two lanes: play today + next step).
- Legal = stays inside the approved track, progressions + titles only, band-name disclaimer.
- Feeds = existing 10-song catalog, reorder + personalization layer.
- Q5 prototype: `06-prototypes/song-discovery-q5-prototype.html` — throwaway HTML, two-lane match with a per-match "why Sage picked this" note. Verified logic from disk; owner verdict: "it looks great." Validated decision carried forward, not the file itself.

## Active ticket — what it needs to proceed

- **05 — Stylistic explorer** (grilling + prototype, open, unblocked): the student learns a chord progression, and the AI shows them *approaches* — "here's how a folk player would strum this, here's how a blues player would, here's how a punk player would." Teaching tools, not copying any specific artist.

  Sub-questions (one at a time, grilling style):
  1. What does "folk / blues / punk approach" mean as **teaching content**? Strumming patterns? Voicing choices? Rhythm feel? Dynamics? One bar of each? The animated teacher (Godot) demonstrates it, or the fretboard diagram (chord-theory-check.js data) shows the voicing, or both?
  2. Legal boundary: **no copying specific artists** (AMENDMENT-14 — distinctive progressions tied to one famous recording need counsel sign-off; no "Hendrix style"). The AI teaches *styles as categories*, not artist clones. Does that distinction hold in the product copy, or does "blues approach" get close enough to a style associated with a living artist to be risky?
  3. Does the stylistic explorer feed the **niche branches** already in the spec (Blues/Country/Fingerstyle/Spanish packs — AMENDMENT-05 #7, built)? Or is it a new surface on top of them? If it feeds them, is it a "here are different ways to play what you're learning" tool inside regular lessons, or a separate "explore styles" mode?
  4. Prototype: a rough take of one progression shown three ways, so the owner can react to whether it feels like teaching or like a gimmick.

  **Dependencies:** independent of 02 (resolved) and 03 (resolved). Can flow in-chat in parallel with 07, 08.

## Files on disk

|| File | What it is |
||------|-----------|
|| `.scratch/wayfinder/map.md` | Wayfinder map — index, Decisions-so-far, tickets, frontier, fog, out-of-scope |
|| `.scratch/wayfinder/issues/05-stylistic-explorer.md` | Ticket 05 — open, Q1-Q4 stub (no answers yet) |
|| `07-app/content/song-progressions/progressions.json` | The 10-song progression catalog — real content for any prototype |
|| `07-app/content/song-progressions/shapes.json` | 11 chord shapes (arithmetic, verified) |
|| `07-app/content/song-progressions/chord-prereqs.json` | Which lesson first teaches each chord |
|| `06-prototypes/song-discovery-q5-prototype.html` | Q3's throwaway prototype (reference for the two-lane + per-match "why" pattern, not to reuse as-is) |
|| `02-spec/guitar-app-spec-AMENDMENT-17.md` | Current amendment — World 1 teacher + performance ladder (proposed, not yet ratified) |
|| `docs/adr/0004-the-teacher-world-1-emerald-hollow.md` | World 1 + Sage + performance ladder + Path A/B + animated production |
|| `brand-references/emerald-hollow/world-emerald-hollow.md` | Measured palette (brightness 75–120/255, saturation 0.14–0.33, muted/earthy) + teacher placement + scene composition |

## Palette lock / constraints that must NOT drift

- **Legal floor applies.** Rule 5 (LLM prose-only, cites stored numbers, no invented musical opinion), Rule 9 (license blocklist = copyright law — Chatterbox, FLUX/Wan, Godot are the commercial-clean set; no ElevenLabs/Midjourney/Suno), Rule 2 (no camera, no hand tracking).
- **AMENDMENT-14** is the operative legal document on the song track: lyrics/riffs/melodies/tabs are NOT teachable; band names = trademarks, nominative use + disclaimer; distinctive progressions tied to one famous recording need counsel sign-off before paid launch; no "Hendrix style" / no artist clones.
- **AMENDMENT-12/13** on song-progression track + Mystery Mode: progressions + song titles teachable; chord prereqs enforced.
- **AMENDMENT-06** overrides any older cartoon-only / fingering-demo-ban language — real/photoreal avatars + Chatterbox IN SCOPE.
- This is a **teaching-content feature**, not a world visual feature — the measured palette lock (brightness 75–120/255, saturation 0.14–0.33, muted/earthy) does NOT apply to the stylistic-explorer prototype itself, but any Godot-animated teacher demo in it must still respect that palette if it's framed as Emerald Hollow.
- **Don't invent teaching content that isn't grounded.** The prototype can show a strumming pattern / rhythm feel as a teaching tool, but it must be a real, explainable pattern (e.g. "down-down-up-up-down-up" with the counts), not a vague "folk feel" that can't be taught.

## What NOT to do

- **Don't re-grill 02 or 03.** They're resolved. Don't reopen the agent definition or the song-discovery design.
- **Don't skip the prototype for Q4.** The wayfinder says HITL tickets with a prototype sub-question call the prototype skill. Q4 is explicitly "a rough take of one progression shown three ways, so the owner can react to whether it feels like teaching or like a gimmick." That's a prototype, not a prose answer.
- **Don't resolve more than one ticket this session.** One ticket per session — 05 only. If the session wants to also touch 07 or 08, stop at 05 and leave the rest for later.
- **Don't assert FLUX/Godot/whatever exist on disk without checking.** The install-state discipline from 01 still applies. (For 05 it's less likely to come up, but the discipline holds — and if the prototype involves a Godot teacher demo, check the scaffold first.)
- **Don't blur "style as category" into "artist clone."** Q2 is explicitly about this. If any of the three approaches you prototype starts sounding like "copy Bruce Springsteen's strum" or "play like Stevie Ray Vaughan," stop and surface it — that's the legal line Q2 is testing.

## Resume cue

To resume: open ticket 05, grill it one question at a time (Q1 first — what does "folk / blues / punk approach" actually mean as teachable content?), offer suggestions, redline every answer. When a sub-question lands, record under `## Answer` in the ticket file. Q4 (the prototype) calls the **prototype skill** to make a rough take of one progression shown three ways, using real content from `progressions.json`. When Q4 is answered and the owner has reacted, set `Status: resolved`, and append the gist + link to the map's Decisions-so-far (`.scratch/wayfinder/map.md`). Then the frontier moves to 07 — Practice remix.

## The one-ticket-per-session rule

This handoff exists so the next session can pick up 05 cold without re-asking anything. The next session should:
1. Skip the handoff preamble and go straight to Q1.
2. Grill one question at a time, plain language, offer suggestions, redline every answer.
3. When Q4 (prototype) comes up, call the prototype skill.
4. Record answers under `## Answer`, resolve the ticket, append to the map.
5. Stop at 05 — leave 07 and 08 for later sessions.
