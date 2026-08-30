REPO ROOT (your workdir): C:/Users/Hendrickson/Desktop/GuitarApp
LEGAL FLOOR (never violate): Rule 5 — prose only, cite stored numbers, never invent musical opinion/praise. Rule 9 — commercial-clean + free ONLY. Rule 2 — no camera/hand tracking. Rule 8 — chord correctness 0 errors/0 warnings.

CONTEXT (already built, trust on disk): Emerald Hollow world assets present (4 FLUX stills, 3 transcoded .ogv clips, 5 Chatterbox wavs). sageCoach.js + practiceStore.js exist in 07-app/core/. Chord gate GREEN (25 lessons / 81 chords / 0 err / 0 warn).

YOUR FILE OWNERSHIP (write ONLY these, to avoid collisions): CREATE NEW FILE 07-app/core/storyMemory.js. Do NOT edit teacher.js, app.js, or any other agent's file.

TASK (ADR-0005 Layer 2 STORY MEMORY, local, BI-4): Build 07-app/core/storyMemory.js — a small (~60-90 line) module that reads Layer 1 PracticeStore numbers and DERIVES meaning from PLAYING DATA ONLY (never mood/personality inference — banned):
- Input: a PracticeStore instance (read its API: getSkillMap(), getStruggledChords(), getCleanChords(), getLearningChords(), getPendingHelpRequests(), plus streak/tries/help-request accessors visible in 07-app/core/practiceStore.js).
- Output getStoryMemory(store) returns a plain object:
    { lastActiveDays: int (days since last practice, -1 if none),
      comeback: boolean (true if lastActiveDays > 7 — the 'comeback' beat),
      nemesis: string|null (the chord with worst clean/fail ratio, i.e. most struggled),
      milestones: string[] (fact-only, e.g. 'First clean chord: Em', 'Chord G cleaned after N tries' — cite the N),
      helpPending: int (open help requests) }
- ALL strings must cite real stored numbers (Rule 5). NO invented praise ('great', 'natural', etc.).
- Export both getStoryMemory and a helper for the comeback threshold (7 days) as a named const.

SELF-TEST: 07-app/core/storyMemory.test.mjs — build a FAKE store object implementing the same methods returning well-formed numbers (including a comeback case >7 days and a nemesis case), assert:
  (a) comeback===true when lastActiveDays>7 and false otherwise,
  (b) nemesis equals the expected most-struggled chord,
  (c) every milestone string contains a digit (proves it cites a number),
  (d) no banned praise words in any output string ('great','natural','talented','gifted','prodigy').
Run with node, print PASS/FAIL, exit 0 on pass.

REPORT (verifiable handles): absolute path of storyMemory.js + test path + actual node stdout (must show PASS) + one-line note on how teacher.js CAN later call it (do not edit teacher.js).
