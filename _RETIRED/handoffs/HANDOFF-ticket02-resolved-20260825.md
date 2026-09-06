# HANDOFF — Ticket 02 (Agent definition) resolved + next: Ticket 03 (Song discovery by taste) (2026-08-25)

## Where we are

**Ticket 02 (Personalized AI teaching agent — what does it mean?) is RESOLVED** in-chat via grilling, 2026-08-25. All six sub-questions answered and written to `.scratch/wayfinder/issues/02-personalized-ai-agent-definition.md` (`Status: resolved`).

The agent is now defined on disk:

- **Lesson director** — drives the student forward (picks next step, adjusts pacing, notices stuck points, sequences the five features). Not just a chat tutor waiting to be asked. The across-lesson directing is the expansion over Loop A, which already catches stuck students in-session and serves drills from lesson JSON.
- **Three-layer memory** — (1) what it saw the student struggle with (mastery + confidence), (2) what practice it assigned last time, (3) how it went when it checked back. The teacher recalls all three before the next lesson and speaks warmly ("you sound great, let's move on" / "that was great, good job") from what it actually knows.
- **Sage in Emerald Hollow** — one Chatterbox built-in voice, Godot animated world + in-app chat text, same persona (chill/warm/encouraging), new capability (lesson director). Not a new persona.
- **Brain on the device** — thinking + listening + voice on-device. PocketBase (AMENDMENT-16) keeps memory synced across devices. Audio never leaves. Heavy compute (e.g. generating music on the fly) is a separate decision when we get to that feature.
- **Fence lines (all live)** — Rule 2 (no camera/hand tracking), Rule 5 (cites stored data, no invented musical opinion — but spoken warmly in the teacher's own voice, not coldly like a spreadsheet), audio never leaves (AMENDMENT-05), only approved content (AMENDMENT-12/14 — chords/progressions/song titles, no riffs/melodies/lyrics/tabs, band names = trademarks + "not affiliated/not endorsed"), only approved tools (Rule 9 — Chatterbox/FLUX/Wan/Godot, no ElevenLabs/Midjourney/Suno). The teacher can say anything it actually knows about the student (taste, what engaged, what it remembers) — warmly, personally — but can't invent, profile the student as a personality type, or praise without basis.
- **One teacher per world, one memory per student across worlds** — within World 1 = Sage sticks with the student (one continuing teacher for that world). When the student eventually moves to a new world (World 2+, later, out of this map), a different teacher with a different personality picks up from the *same* student memory — same chords learned, same struggles, same practice history. The student's progress is continuous across worlds; the personality changes. Memory is student-owned and world-agnostic so a new teacher in a new world just uses the same foundation. For this map: one teacher (Sage) per student, within World 1. The across-world switch is a future decision but the memory architecture supports it now.

**02 unblocks 04 (call-and-response jam) and 06 (celebration moments).** 03, 05, 07 are independent of 02 and can flow in-chat in any order. The map's ordering: 03, 05, 07 first (independent of each other), then 04 and 06.

## What's DECIDED and LOCKED (per ticket 02)

| # | Question | Answer |
|---|----------|--------|
| 1 | Chat tutor or lesson director? | **Lesson director** — drives the student forward, not just waiting to be asked. |
| 2 | What does the teacher remember? | **Three layers:** observed struggle + assigned practice + outcome when it checked back. Speaks warmly from what it knows ("it seems to me you like upbeat stuff" — OK if it actually remembers the student's taste; not a cold data readout). |
| 3 | Who speaks, and how? | **Sage in Emerald Hollow** — one Chatterbox voice, Godot world + in-app chat. World 2 comes later (out of this map). |
| 4 | Where does the teacher's brain live? | **On the device** + PocketBase memory sync across devices. Audio never leaves. |
| 5 | Fence lines? | Rule 2/5/9 + AMENDMENT-05/12/14. Warm from memory, not cold data quoting; no invented praise; no student profiling. |
| 6 | One teacher per student or one per session? | **One teacher per world, one memory per student across worlds.** Within World 1 = Sage continues with the student. |

## Files on disk (all in Desktop/GuitarApp/)

| File | What it is |
|------|-----------|
| `.scratch/wayfinder/issues/02-personalized-ai-agent-definition.md` | Ticket 02 — RESOLVED with full answer (this session) |
| `.scratch/wayfinder/map.md` | Wayfinder master map — ticket 02 now resolved; 04/06 no longer blocked on 02 |
| `.scratch/wayfinder/issues/03-song-discovery-by-taste.md` | Ticket 03 — OPEN, independent of 02, next to grill |
| `docs/adr/0001-always-on-encrypted-sync.md` | Student Memory (ADR-0001) — memory source for the agent |
| `docs/adr/0004-the-teacher-world-1-emerald-hollow.md` | World 1 + Sage + performance ladder (ADR-0004) |
| `CONTEXT.md` | Glossary |
| `02-spec/guitar-app-spec-AMENDMENT-17.md` | World 1 + performance ladder spec |
| `brand-references/emerald-hollow/` | World 1 reference kit (palette lock) |

## Active next step

**Ticket 03 — Song discovery by taste (feature #1).** Independent of 02 (already cleared). Start grilling in-chat, one question at a time, plain language, redline answers.

The question (from the ticket): the student says what music they love ("songs that feel like campfires," "the stuff my grandmother played," "upbeat party music," or "nothing I can name, just pick something I'll like"), and the AI matches them to either (a) progressions/chords they already know and can play *today*, or (b) the smallest next step to unlock something they'd love.

Sub-questions to run in-chat:
1. How does the student express taste? (buttons / free-text / "surprise me"? Keep it simple for kids + older adults.)
2. What's the teacher matching against? (10-song progression catalog? chords the student has learned? both — "play today" AND "next step"?)
3. Legal boundary — only approved-track songs, or public-domain/original material in scope? (House of the Rising Sun is public domain; other 9 need the disclaimer.)
4. Does discovery feed the existing 10-song track (reorder + personalize), or extend it (new content + content-creation step)?
5. Prototype — a rough take of taste-input → match output so the owner can react.

## Palette lock (DO NOT violate — measured, not guessed; for Emerald Hollow assets)

- Brightness 75–120/255 (dark-to-moody). Saturation 0.14–0.33 (muted-to-moderate).
- Dominant: near-black #202020, mid-dark stone #404040, forest greens #204020/#406040, olive-tan #404020/#606040, fog #c0c0c0.
- Warm accents (firelight, lantern, wood) are the contrast — NOT saturated color.
- Full hex table in `brand-references/emerald-hollow/world-emerald-hollow.md`.

## What NOT to do

- Do NOT claim FLUX/Wan pipeline has run or assets exist without verifying on disk (`ls -d ~/re/flux`, `test -d assets`). As of 2026-08-25 the pipeline is NOT run; no assets in-repo.
- Do NOT claim the `07-app/godot/` scaffold exists — it did NOT survive the PC transfer.
- Do NOT re-ask the locked ticket 02 decisions — they're on disk and consistent.
- Do NOT let GuitarApp "Sage" (teacher) be confused with the team-ops "Sage" (Sherry's chief of staff) — completely separate.
- Do NOT invent musical opinions or student profiles in the ticket 03 grilling — Rule 5 still applies.

## Hard rules still live (from AGENTS.md — always on)

- Rule 5: LLM prose only; cites stored numbers only. The teacher's praise/observation lines MUST cite a stored fact — never freelanced praise or invented taste ("you're an upbeat person" = profiling = banned; "you've been working on upbeat stuff and seemed to like it" = remembering = OK).
- Rule 9: Voice license blocklist = copyright law. Chatterbox (MIT) = shipping voice. ElevenLabs blocked for paid app. Never re-propose.
- Rule 2: No camera, no hand tracking.
- AMENDMENT-14: content + teacher lines get a human lyric read-through before ship; band names = trademarks + disclaimer.

## Dependency / blocker note

- Ticket 03 is independent of 02 (02 is resolved, 03 was never blocked on it). No blockers to start.
- The **generative music decision** (ACE-Step/YuE vs pre-built library vs no generative music) is still fog (per the map) — it affects 04, 06, 07 but NOT 03 or 05 directly. So 03 can proceed without waiting on it. Flag it if 03's prototype touches any audio generation.
- The **guitar-app-spec amendment chain** — only AMENDMENT-17 is on disk in `02-spec/`. The full tree (AMENDMENT-01 through -16 + base spec) did not survive the PC transfer. The approved AI features (AMENDMENT-05's nine), the song track (AMENDMENT-12/13/14), the curriculum (AMENDMENT-15), the backend (AMENDMENT-16) are all current truth per the repo's prose — but their files are on disk as placeholders only. The map's ticket 10 (amendment survival / repo-restore scope) is the AFK research to confirm how much survived; don't let that block 03 (which only needs the spec's current truth, not the files).
