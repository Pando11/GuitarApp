REPO ROOT (your workdir): C:/Users/Hendrickson/Desktop/GuitarApp
LEGAL FLOOR (never violate): Rule 5 — cites stored facts only. Rule 9 — commercial-clean + free ONLY. Rule 2 — no camera/hand tracking. Rule 8 — chord correctness 0 errors/0 warnings.

YOUR FILE OWNERSHIP (write ONLY these): CREATE NEW FILE 07-app/core/jamSession.js (+ 07-app/core/jamSession.test.mjs). Do NOT edit other agents' files.

CONTEXT: Call-and-response jam (A4.2) is the ONE feature that needs cloud GPU for the generative round-trip (ACE-Step / YuE) — there is NO GPU and NO RunPod pod available in this session, so the GENERATIVE half is BLOCKED. Your job is to build the ON-DEVICE half that CAN be done here, and SCAFFOLD + clearly FLAG the blocked half.

BUILD jamSession.js with TWO clearly separated parts:
PART A — ON-DEVICE (buildable + testable here):
- function gradeStudentPhrase(heardChords, knownChords): grades the student's played phrase against the lesson's known chord set. Returns {matched: [...], missed: [...], accuracy: float 0..1} using only chord-name arithmetic (no audio inference engine needed — take the chord labels as input; you may read 07-app/core/listening-engine.js and chord-theory-check.js for the chord vocabulary but do NOT require a live mic).
- function emitFacts(grade): converts the grade into FACTS (never audio) to be sent to the cloud: e.g. {chordsMatched, chordsMissed, accuracy}. This is the facts-to-cloud payload (audio never leaves device — AMENDMENT-05 holds).
- Self-test (node, .test.mjs, prints PASS, exit 0): feed known=[C,G,Em], heard=[C,G,Em] -> accuracy 1.0; heard=[C,G,Am] -> missed [Am], accuracy 2/3; assert emitFacts returns only the fact object.

PART B — GENERATIVE (scaffold + FLAGGED BLOCKED):
- Export an async function generateResponse(facts) that is clearly STUBBED: it throws/returns a BLOCKED marker with a comment explaining it requires ACE-Step/YuE on a cloud GPU (RunPod), which is unavailable this session. Include the intended contract (input: facts, output: audio blob URL) as a comment.
- At top of file, a prominent comment: // BLOCKED: generative audio round-trip needs cloud GPU (ACE-Step/YuE on RunPod). On-device grading + facts done; generation pending GPU.

REPORT (verifiable handles): jamSession.js path + test path + actual node stdout (PART A tests PASS) + explicit BLOCKED statement for PART B with the reason (no GPU/RunPod this session).
