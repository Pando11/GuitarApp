REPO ROOT (your workdir): C:/Users/Hendrickson/Desktop/GuitarApp

LEGAL FLOOR (never violate):
- Rule 5: LLM/prose writes ONLY, cites stored numbers, NEVER invents musical opinion or praise.
- Rule 9: commercial-clean + free ONLY.
- Rule 2: no camera/hand tracking.
- Rule 8: chord correctness 0 errors/0 warnings.

VERIFIED ON DISK 2026-08-30 (trust these):
- 07-app/core/ has teacher.js, practiceStore.js, chatEngine.js, voice-command.js (teacher.js is currently cosmetic + walled off from data)
- practiceStore.js = Layer 1 SKILL MEMORY: per-chord clean/fail/unsure counts, states, streaks, help requests

TASKS:
1. Read 07-app/core/teacher.js, practiceStore.js, chatEngine.js, voice-command.js to understand current shape.

2. Build 07-app/core/sageCoach.js — a Rule-5-safe generator: reads practiceStore numbers (clean/fail/unsure counts, tries, streaks, help requests) -> emits ONE forward-coaching line that cites ONLY stored numbers (example: 'your Em took 5 tries last week, 2 today'). NO invented praise, NO musical opinion, NO personality inference.

3. Wire teacher.js to call sageCoach so Sage's coaching line is derived from real numbers (today teacher.js is cosmetic + walled off — make it pull real numbers and emit the Sage line via sageCoach).

4. Ship a node self-test 07-app/core/sageCoach.test.mjs (or .js) that feeds FAKE but well-formed numbers and asserts: (a) the emitted line contains a real number taken from the input, and (b) the line contains NO freelanced opinion — banned-word scan: any occurrence of 'great musician','natural','talented','gifted','you're a star','prodigy','born to' fails the test. Print PASS/FAIL clearly. Run it with node and capture stdout.

5. Voice delivery stays on the EXISTING TTS path — do NOT regenerate wavs.

REPORT (verifiable handles):
- Absolute path of sageCoach.js + absolute path of the self-test
- Self-test stdout (must show PASS) — paste the actual node output
- One-line description of how teacher.js now calls sageCoach
