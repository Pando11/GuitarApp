# LOG — append-only session log

Purpose: replace the repo's habit of creating a new root-level
`HANDOFF-*.md` / `WHAT-CHANGED-*.md` / `FIXES-APPLIED-*.md` file every
session (12 such files had accumulated at root again as of 2026-09-10,
despite `CLAUDE.md`'s standing rule against exactly this pattern — see
`docs/plans/TIER-1B-close-the-gaps.md` task 1C). Existing root-level files
are left alone; this file is where new sessions record what shipped
instead of writing a new one.

**Format:** one entry per session. Dated heading, a few bullet lines of
what shipped, one sentence of why. Append only — do not edit or delete
earlier entries.

---

## 2026-09-10 — Tier 1B kickoff

- Kicked off `docs/plans/TIER-1B-close-the-gaps.md` (Wave 1, task 1C):
  deploy the coach service, fix the placeholder-audio regression, wire in
  the four dormant Wayfinder modules, and build jam session's real
  generative half. Full plan and wave structure live in that file;
  `docs/plans/README.md` still holds the orchestration contract.
- Fixed the guardrail flake task 1C called out (`server/src/guardrail.js`):
  a chord became "known" to the invented-fact allow-list from three
  different sources (`mastery[]`, the lesson's own `lessonChords[]`, and
  the student's own typed question), but only the `lessonChords` source
  also licensed the chord's bare root letter. A beginner's very first
  message about a chord — before any mastery/lessonChords fact about it
  exists yet — is exactly the case where the question-echo path is the
  only source, so Sage's own correct answer ("Em is short for E minor")
  had its bare "E" rejected as `invented_token:E`. Fixed by sharing one
  `addChordAndRoot()` helper across all three sources; regression tests
  reproducing the original ordering added to `server/test/guardrail.test.js`
  (the guardrail's real location — see note below).
- Started this file and pointed `CLAUDE.md`'s standing rules at it.

**Why:** the guardrail bug was a real, user-visible flake (fails safe to
template text, not a wrong-answer risk, but it degrades a legitimate first
answer for no reason); the LOG.md habit change is to stop the
over-documentation problem from regenerating itself every session.

**Note for whoever reads this next:** `docs/plans/TIER-1B-close-the-gaps.md`
task 1C's `OWNS:` list names `07-app/core/guardrail.js` /
`07-app/core/guardrail.test.mjs`, but no such files exist — the guardrail
that actually runs in production lives at `server/src/guardrail.js`, tested
by `server/test/guardrail.test.js` (run via `cd server && npm test`). The
fix and its regression tests landed there instead, since that is where the
real bug and its real test suite are. Flagging this so the plan file's
OWNS list can be corrected rather than silently trusted next time.

## 2026-09-10 — Tier 1B build complete

All 9 tasks (1A/1B/1C, 2A/2B/2C, 3A/3B, 4) shipped in one session, each
independently re-verified by a second agent before committing (per the
owner's explicit instruction), one commit per task on `main`. Highlights:

- Coach service is deploy-ready for Render; the `npm start` dotenv trap
  that caused prior sessions' "looks like success, isn't" failure is fixed.
- The placeholder-audio bug was far bigger than first flagged — all 25
  lessons, not 5 — traced to a one-off 2026-09-03 debug sine-wave generator
  that silently became permanent, and fixed with real kokoro TTS speech
  found at `~/guitar-loadtest/kokoro-venv` (the repo's own `.venv-kokoro`
  can't run it). 61/65 slots fixed; 4 genuinely-missing files (lessons
  06/09/17/19) found as a separate, not-yet-scheduled gap.
- All four dormant Wayfinder feature modules (practice remix, stylistic
  explorer, celebration, jam session) are now mounted in the real UI, not
  just tested-but-unimported code.
- Jam session's generative half is real: fal.ai's hosted ACE-Step, chosen
  over RunPod after RunPod's own documented prior failure on this project
  (see `brand-references/worlds/WORLDFACTORY-DIAGNOSIS-2026-08-30.md`).
  ~$0.004/generation.
- Two more real bugs surfaced by Wave 4's own live verification and fixed
  same-session: a client/server timeout mismatch in jam session, and a
  guardrail gap rejecting real coaching answers that said "the A fret 2"
  or opened a sentence with "A buzz...".

**Why:** owner asked for a plan to finish everything the 2026-09-10 redline
found undone, to be built by subagents while the owner was away, with every
task independently re-verified rather than self-reported.

**Still open, owner-only:** the Render signup itself, a full human listen
to the regenerated audio, the 4 missing audio files, and the actual GitHub
Pages deploy. See `docs/plans/STATUS.md`'s Tier 1B section for the full
list.
