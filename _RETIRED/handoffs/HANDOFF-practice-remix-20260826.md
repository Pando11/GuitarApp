# HANDOFF-practice-remix-20260826.md

## Where we are

Wayfinder map "AI-augmented GuitarApp" — research phase complete (01, 09, 10 all resolved), grill phase in progress. **03 — Song discovery by taste is resolved** (2026-08-26: Q1-Q4 locked earlier; Q5 prototype built against the real 10-song catalog; owner verdict "it looks great"; the map's Decisions-so-far carries the gist + link). **05 — Stylistic explorer is resolved** (2026-08-26: Q1-Q4 all resolved; prototype built showing G–D–Em–C three ways; owner verdict that the shape is right and the "teaching or gimmick" reaction is deferred to you trying the file — if it doesn't feel like teaching when you drive it, we fix it later or at another time; the map's Decisions-so-far carries the gist + link). The frontier now reads **07 — Practice remix** (open, unblocked, grilling + prototype), then 08.

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
- Q5 prototype: `06-prototypes/song-discovery-q5-prototype.html` — throwaway HTML, two-lane match with a per-match "why Sage picked this" note. Verified logic from disk; owner verdict "it looks great." Validated decision carried forward, not the file itself.

From ticket 05 (resolved, 2026-08-26):
- The three approaches are strumming pattern + rhythm feel, taught one bar at a time with counts. Folk = steady alternating strum with held beats; blues = shuffle/swing; punk = short hard downstrokes with space. Voicing/dynamics can layer in later.
- Legal: all three safe as categories — no artist names, no signature rhythms, no "Hendrix style." The "blues" label needs the most care in product copy (keep it generic: "blues rhythm"/"blues phrasing"), and the demo content must be a generic blues pattern, not any specific artist's signature (AMENDMENT-14).
- It's a within-lesson tool, not a feed into the existing niche packs (Blues/Country/Fingerstyle/Spanish). Can refer outward, but that's a referral, not its job.
- Q4 prototype: `06-prototypes/song-styles-q5-prototype.html` — G–D–Em–C shown three ways, each with pattern + counts + "why this feels like X" note + "Sage says" line. Shapes from the verified `shapes.json` on disk. No audio, no artist names, no signature rhythms. The "teaching or gimmick" reaction is deferred to you trying it — if it doesn't feel like teaching when you drive it, we fix it later or at another time. The shape is verified right regardless.

## Active ticket — what it needs to proceed

- **07 — Practice remix** (grilling + prototype, open, unblocked): the AI takes the *same* weak spots the student has and frames them six different ways: as a rhythm game, as a call-and-response, as a "play along with this groove," as a tempo challenge, as a "show me you can do it" performance moment, as a calm slow version. Same skill, six flavors. The student's preferred-format data (video/sheet/replay, consent-based) picks which flavor shows up when.

  Sub-questions (one at a time, grilling style):
  1. **The six framings** — are these six fixed framings, or a smaller set the owner picks? (Current list: rhythm game, call-and-response, play-along groove, tempo challenge, performance moment, calm slow. Does that list feel right, or is it too many / too few?)
  2. **How does the sequencer pick a framing?** Preferred format (video/sheet/replay, consent-based — from CONTEXT.md glossary) is one input. What else? (What engaged the student last time? What framings they've already done? Random for variety? The teacher's read on the student's mood — but that's getting close to a personality label, which is banned; keep it to *engagement data*, not inference.)
  3. **Is this built on the existing practice engine** (06-prototypes/practice-engine/ — 30/60 sensor, weak-pair review, the §5.2 drill menu: Chord-Perfect, Air Changes, 1-Min Changes, Tempo-Scaled Loop, Wait-To-Play, Anchor, Spider, Metronome ladder, Weak-Pair Review, Muted strum, Count-out-loud)? The remix is *framing existing drills*, so it should reuse the drill menu and the engine. Does the six-framing idea map onto the existing drill menu, or are some framings new drill types?
  4. **Is "practice remix" the same as "adaptive practice plan" (AMENDMENT-05 #4 — approved, practice engine exists)?** The adaptive plan is "build a practice session around this student's weak spots" — the remix is "same weak spots, six framings." They're close. Is the remix a new dimension on top of the adaptive plan, or a different name for a refinement of it?
  5. **Prototype:** a rough take of one weak spot shown three of the six framings, so the owner can react.

  **Dependencies:** independent of 02 (resolved), 03 (resolved), 05 (resolved). Can flow in-chat in parallel with 08.

## Files on disk

|| File | What it is |
||------|-----------|
|| `.scratch/wayfinder/map.md` | Wayfinder map — index, Decisions-so-far, tickets, frontier, fog, out-of-scope |
|| `.scratch/wayfinder/issues/07-practice-remix.md` | Ticket 07 — open, Q1-Q5 stub (no answers yet) |
|| `06-prototypes/song-discovery-q5-prototype.html` | Q3's throwaway prototype (reference for the two-lane + per-match "why" pattern, not to reuse as-is) |
|| `06-prototypes/song-styles-q5-prototype.html` | Q5's throwaway prototype (reference for the pattern-count + "why this feels like X" + "Sage says" structure, not to reuse as-is) |
|| `06-prototypes/practice-engine/` | The existing practice engine (30/60 sensor, weak-pair review, the §5.2 drill menu) — source of truth for Q3's "is it built on the existing engine?" question |
|| `07-app/content/song-progressions/progressions.json` | The 10-song progression catalog — real content if any prototype needs it |
|| `03-research/curriculum/CURRICULUM-AND-PRACTICE-STRUCTURE.md` | Source of truth for owner-locked curriculum directives (§5), including the §5.2 drill menu |
|| `02-spec/guitar-app-spec-AMENDMENT-17.md` | Current amendment — World 1 teacher + performance ladder (proposed, not yet ratified) |
|| `docs/adr/0001-always-on-encrypted-sync.md` | Student memory ADR (the agent's memory source) |
|| `docs/adr/0004-the-teacher-world-1-emerald-hollow.md` | World 1 + Sage + performance ladder + Path A/B + animated production |
|| `brand-references/emerald-hollow/world-emerald-hollow.md` | Measured palette (brightness 75–120/255, saturation 0.14–0.33, muted/earthy) + teacher placement + scene composition |

## Palette lock / constraints that must NOT drift

- **Legal floor applies.** Rule 5 (LLM prose-only, cites stored numbers, no invented musical opinion), Rule 9 (license blocklist = copyright law — Chatterbox, FLUX/Wan, Godot are the commercial-clean set; no ElevenLabs/Midjourney/Suno), Rule 2 (no camera, no hand tracking).
- **AMENDMENT-05 #4** is the operative document on the adaptive practice plan ("build a practice session around this student's weak spots") — Q4 is explicitly whether practice remix is a new dimension on top of it or a different name for a refinement.
- **AMENDMENT-05 §5.2** (via `CURRICULUM-AND-PRACTICE-STRUCTURE.md` §5.2) is the source of truth for the existing drill menu — Q3 is explicitly whether the six framings map onto it or are new drill types.
- **The "no personality inference" line from 05's Q2 reasoning carries over** — the sequencer picks framings from *engagement data*, not from inferring a personality label or a mood. "What engaged the student last time" is engagement data; "the teacher's read on the student's mood" is close to a banned personality label and should stay as engagement data (what actually held their attention), not inference.
- **This is a practice-framing feature, not a world visual feature** — the measured palette lock (brightness 75–120/255, saturation 0.14–0.33, muted/earthy) does NOT apply to the practice-remix prototype itself. But any Godot scene used to *demonstrate* a framing in the prototype must still respect that palette if it's framed as Emerald Hollow.
- **Prototype must be grounded.** If the prototype shows a specific weak spot, it should be a real weak spot a student could plausibly have (e.g. a specific chord-pair change that's slow), not a vague "you're bad at G" — and the framing should reuse real drill-menu content where possible, not invent new drill types unless Q3 calls for it.
- **Preference data is consent-based** (from CONTEXT.md glossary — video/sheet/replay). The sequencer using preferred-format data is fine; don't invent a new preference-collection surface in the prototype.

## What NOT to do

- **Don't re-grill 02, 03, or 05.** They're resolved. Don't reopen the agent definition, the song-discovery design, or the stylistic-explorer design.
- **Don't skip the prototype for Q5.** The wayfinder says HITL tickets with a prototype sub-question call the prototype skill. Q5 is explicitly "a rough take of one weak spot shown three of the six framings, so the owner can react." That's a prototype, not a prose answer.
- **Don't resolve more than one ticket this session.** One ticket per session — 07 only. If the session wants to also touch 08, stop at 07 and leave it for later.
- **Don't assert the practice engine exists or what's in it without checking.** The install-state discipline from 01 still applies. Q3 explicitly asks "is this built on the existing practice engine" — verify `06-prototypes/practice-engine/` is on disk and what's in it before answering Q3, don't just trust the prose.
- **Don't invent a new preference surface.** Preferred-format data (video/sheet/replay) is consent-based and already in the CONTEXT.md glossary. The prototype can show it being used, but shouldn't invent a new way to collect it.
- **Don't let the sequencer drift toward personality inference.** Q2 is explicitly about this. The sequencer picks framings from engagement data (what engaged the student last time, what they've already done, preferred format, variety) — not from inferring "this student is an upbeat person" or "this student is in a calm mood." Keep it to *what actually held their attention*, not inference.

## Resume cue

To resume: open ticket 07, grill it one question at a time (Q1 first — do the six framings list feel right, or a smaller set?), offer suggestions, redline every answer. When a sub-question lands, record under `## Answer` in the ticket file. Q5 (the prototype) calls the **prototype skill** to make a rough take of one weak spot shown three of the six framings, so the owner can react. When Q5 is answered and the owner has reacted, set `Status: resolved`, and append the gist + link to the map's Decisions-so-far (`.scratch/wayfinder/map.md` — after the 05 entry). Then the frontier moves to 08 — World factory pipeline first scene.

## The one-ticket-per-session rule

This handoff exists so the next session can pick up 07 cold without re-asking anything. The next session should:
1. Skip the handoff preamble and go straight to Q1.
2. Grill one question at a time, plain language, offer suggestions, redline every answer.
3. When Q5 (prototype) comes up, call the prototype skill.
4. Record answers under `## Answer`, resolve the ticket, append to the map (after the 05 entry, before the `---`), then stop — leave 08 for a later session.
5. Verify the practice engine exists on disk before answering Q3 (install-state discipline).
