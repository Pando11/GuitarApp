Type: grilling
Status: resolved
Blocked by:

## Answer

**Sub-question 1 — chat tutor or lesson director?**
Lesson director. The teacher drives the student forward — picks the next step, adjusts pacing, notices when the student is stuck, sequences the five features. Not just waiting to be asked. (The in-session part already exists via Loop A / renderChat; the expansion is across-lesson directing.)

**Sub-question 2 — what does the teacher remember?**
Three layers: (1) what it saw the student struggle with (mastery + confidence from listening/practice data), (2) what practice it assigned the student last time (the drill / session / chord focus it gave), (3) how it went when it checked back (did it sound better? did the student practice hard? — from listening + practice count data). The teacher recalls all three before the next lesson: "let's try it again and see where you're at." If it sounds better: "you sound great, let's move on." If it sounds like hard practice: "that was great, good job." The teacher speaks warmly from what it knows — "it seems to me you like more upbeat stuff" is fine because the teacher actually remembers the student's taste; it doesn't sound like a cold data readout. But it can't say something it doesn't have a basis for — "you're a natural," "you're ready for a real performance," "I bet you'd love this song" are guesses with nothing behind them, and those are out (Rule 5). Memory is cited warmly in the teacher's own voice, not quoted like a spreadsheet.

**Sub-question 3 — who speaks, and how?**
World 1 (Emerald Hollow, what we're building now): one teacher (Sage), one Chatterbox built-in voice, one persona (chill/warm/encouraging). Speaks in the Godot animated world AND in the in-app chat text. Same persona, new capability (lesson director). World 2+ (different world/teacher/voice/look) is a later decision — not in this map. The agent is Sage with the director capability added — not a new persona.

**Sub-question 4 — where does the teacher's brain live?**
On the device. Thinking + listening + voice all on-device. PocketBase (AMENDMENT-16) keeps the student's memory synced across devices (so the other phone/laptop knows what this one learned). Audio never leaves the device — that stays no matter what. The split: device = teacher's thinking + listening + voice; PocketBase = memory sync. Heavy compute (e.g. generating music on the fly for call-and-response) is a separate decision when we get to that feature — not where the core teacher lives by default.

**Sub-question 5 — what's the teacher NOT allowed to do? (fence lines)**
- No made-up musical opinions (Rule 5) — only cites stored numbers / practice data, but warmly in the teacher's own voice, not coldly like a spreadsheet. "Your G-to-C confidence is at 72" said warmly is OK; "you're ready for a real performance" (no basis) not OK.
- No camera, no hand tracking (Rule 2) — stays.
- Audio never leaves the device (AMENDMENT-05) — stays.
- Only teaches what's allowed (AMENDMENT-12/14) — chords, progressions, song titles. No riffs, melodies, lyrics, tabs. Band names get a "not affiliated / not endorsed" note.
- Only uses approved tools (Rule 9) — Chatterbox for voice, FLUX/Wan for pictures if generated, Godot for the world. No ElevenLabs, no Midjourney, no Suno.
- The teacher can say anything it actually knows about the student (taste, what engaged, what it remembers) — warmly, personally, in its own voice. It can't invent ("I bet you'd love this"), profile the student as a personality type ("you're an upbeat person"), or praise without basis ("you're a natural").
^[Source for all fence lines: AGENTS.md hard rules + AMENDMENT-05/06/09/11/12/14/16 + ADR-0001/0003/0004.]

**Sub-question 6 — one teacher per student or one per session?**
One teacher per world, one memory per student across all worlds. Within World 1 (Emerald Hollow, what we're building now) = Sage sticks with the student, remembers, checks back — one continuing teacher for that world. When the student eventually moves to a new world (World 2+, later, out of this map), a different teacher with a different personality picks up from the *same* student memory — same chords learned, same struggles, same practice history. The student's progress is continuous across worlds; the personality changes. The new teacher already knows where the student's at because the memory is student-owned and carries across worlds. For this map: one teacher (Sage) per student, within World 1. The across-world teacher switch is a future decision but the memory architecture (student-owned, world-agnostic) is designed to support it now — the agent reads/writes student memory, not world-specific memory, so a new teacher in a new world just uses the same foundation.

## Context pointer

Ticket 02 resolved in-chat (grill session). All 6 sub-questions answered. The agent is: a lesson director, voiced by Sage (Chatterbox) in Emerald Hollow, living on-device with PocketBase memory sync, one teacher per world / one memory per student across worlds, with three-layer memory (observed + assigned + outcome), speaking warmly from what it knows (not cold data quoting, not invented praise, not student profiling), and the full Rule 2/5/9 + AMENDMENT fence lines. Drives how the five features (03/04/05/06/07) attach. Unblocks 04 and 06.