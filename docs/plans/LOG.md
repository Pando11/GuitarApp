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

## 2026-09-11 — Wave 5: Sage speaks

Owner asked a sharp follow-up after the redline session above: when a
student asks Sage a real question, is the answer spoken or just text?
It was text only. Added a tap-to-play voice control for live coaching
answers, on both the lesson chat and practice screen, via fal.ai's hosted
Kokoro TTS (same account already proven for jam session's ACE-Step) —
verified live before building anything: ~2s synthesis, same `af_heart`
voice already used for the app's pre-recorded narration, ~1 cent/answer.

Independent verification caught a real bug before commit: the speak
control mounted next to boilerplate fallback text too, not just genuine
model answers, because the gate only checked whether there was *any*
answer text, never whether it came from the real model. Reproduced live
twice, fixed to check `source === 'model'`. Also found and fixed, while
investigating: the service worker threw an unhandled rejection on every
real `/coach`/`/coach/speak` POST in production (tried to cache a
response type the Cache API rejects) — didn't break anything a student
would see, but was firing on every single live coaching request.

**Why:** the owner's question surfaced a real, user-facing gap in what
"Sage" actually does versus what the pre-recorded narration implies. Both
follow-on bugs were caught by the same independent-verification discipline
used throughout Tier 1B, before either shipped.

## 2026-09-12 — Ultrareview + JSON parse fixes

Ran `/ultrareview ultra` (maximum-effort cloud review) against the full
repository. Found 5 bugs ranked by severity: 2 JSON parse exceptions in
`server/src/musicGen.js` and `voiceGen.js` (unhandled SyntaxError from
malformed fal.ai responses), 2 missing AbortController fallbacks in
`07-app/core/coachSurface.js` and `jamSession.js` (timeout hangs in old
runtimes), and 1 fragile async event-listener pattern in
`jamSessionView.js` (currently safe, but brittle for future changes).

Fixed the two JSON parse bugs immediately (highest impact):
- Both `musicGen.js` and `voiceGen.js` now wrap `res.json()` in try/catch
  at all three polling/fetch sites (submit, poll status, fetch result)
- Malformed responses now throw properly-typed `MusicGenError` /
  `VoiceGenError` instead of escaping as untyped `SyntaxError`
- Maintains the strict error contract: never fabricates, never silently fails
- All 117 server tests pass; zero behavior change for well-formed responses
- Commit `5a95b96` pushed to github/main

Also reviewed the full operational state (see redline text at end of this session):
- **Ship-ready:** All code complete, tests green, AMENDMENT-05 compliant
- **Deployment-blocked:** Coach service (Render signup needed), GitHub Pages deploy, 4 missing audio files
- **Next owner actions:** Pick host for coach service, enable GitHub Pages, test locally before deploy

**Why:** systematic verification before wider testing caught real edge cases
that mocked tests miss. The AbortController and async-listener issues are
lower priority (rare/fragile but not blocking), so JSON parse fixes were
prioritized to complete error handling before deployment.

**App status:** Running locally at `http://localhost:5173`. Ready for
walk-through testing on lessons 1-3 before Render + Pages setup.

## 2026-09-12 — Reset: the "vision rebuild" docs were wrong, and so was the state they described

- A same-day "vision rebuild" handoff/spec/diagram set (`HANDOFF-2026-09-12.md`,
  `SPEC-VISION-2026-09-12.md`, `ARCHITECTURE-VISUAL-2026-09-12.html`) was
  written without checking the running app first, and both described a
  codebase that didn't match reality. All three were deleted; this entry and
  a proper spec (`.scratch-spec-draft.md`, not yet published) replace them.
- Live-verified this session, not from docs: real coaching (`server/**`)
  makes genuine Claude API calls and produces model prose, not template
  fallback; the mic-based listening/tuner engine (`listenerReal.js`,
  `tuner-engine.js`) correctly reads a real synthetic 82.41Hz tone fed
  through a fake-mic browser session. Both hold up.
- Also confirmed broken, live: `worldView.js`'s "world" is a video cutscene
  + a static photo with the same 25-lesson button grid underneath, just
  relabeled — not an explorable place. `wave1-flow.js`'s "Hear
  intro/encouragement/transition" buttons call `GuitarApp.speak()`, which
  does not exist anywhere in the codebase — they do nothing audible.
  `backupButtons.js`'s "Got it/Not yet" give no visible feedback. A
  jam-session panel on the lesson page calls a coach server that wasn't
  running.
- Owner-directed reset, scoped via a full grilling session (see
  `.scratch-spec-draft.md` for the resulting spec): rebuild the experience
  layer (world, home screen, lesson-page widgets) on top of the three
  verified-working engines above. Key decisions: 2D real movement (not a
  button-grid world), no competing home screen (everything reachable
  in-world, Sage tells the student what's available), TTS-out for Sage's
  coaching (full two-way voice is the real target, deliberately deferred),
  fresh 2D art for the walkable space via the existing fal.ai FLUX pipeline,
  an original longer Em-C-G capstone arrangement (not three isolated chord
  hits), and GitHub Issues as the tracker going forward (`to-spec` →
  `to-tickets` → `implement`/`implement-spec`).
- **New non-negotiable for this rebuild:** no ticket is done on automated
  tests alone — every ticket needs a live walkthrough verified by an agent
  other than the one that built it, precisely because "tests pass" and
  "verified" were the words used to describe the broken state this entry
  is correcting.
- Two decisions are deliberately temporary and the owner asked to be
  re-asked once tried: 2D movement (may move to 3D) and TTS-out (may move
  to full two-way voice). Tracked in the assistant's cross-session memory as
  `guitarapp-movement-2d-vs-3d` and `guitarapp-voice-roadmap` — check those
  before assuming either is settled.
- **Not yet done:** the spec hasn't been published anywhere (`gh` CLI isn't
  installed on this machine — next session should install and authenticate
  it first), so no GitHub issue or tickets exist yet. Nothing described
  above has been built; this is a planning reset only, no code changed.

**Why:** the previous "vision rebuild" was written from a diagram, not the
running app, and turned out to describe a codebase that didn't exist. This
reset exists to make sure the next round of work is grounded in what was
actually verified, not what a document claimed.

---

## 2026-09-12 (second session) — Spec rewritten: teaching is the product

- **The owner corrected the reset spec's central assumption.** The first draft
  treated Emerald Hollow as the product; the owner's words: *"the world is just
  the environment — the lessons are the real reason. The AI teaching the
  student, that can personalize, so the student can learn easier and have
  fun."* `.scratch-spec-draft.md` was rewritten end to end around the teaching,
  with the world as the wrapper. Still unpublished (`gh` still not installed).
- **Emerald Hollow is a cinematic arrival, not a game level.** Owner-confirmed:
  the student does **not** control the walk. Reference given was an ambient
  fantasy-village video ("The Enchanted Celtic Village by the Ancient River"),
  explicitly *not* Stardew-style — "more real." This **deletes** player
  movement, collision, walkable level geometry, and the Godot-vs-web
  game-client decision from scope — the largest cost item in the first draft.
  The 2D-vs-3D framing is superseded, not merely deferred.
- **The metronome does not exist.** No click, no tempo UI, no audio pulse in
  `07-app/` or `server/`. `free_metronome` appears throughout lesson/practice
  JSON and **no JS reads it**; `guitar-lesson-05` already instructs students to
  "set the metronome to 72." `core/drills/metronomeLadder.js` is not a
  metronome — it is silent arithmetic driving a *simulated* student
  (`listenerSim.js`) up a fake BPM ladder. A real metronome is now a
  first-slice feature, reachable from lessons, practice and capstone (owner
  requirement). `tuner-engine.js`'s `makeTone()` gives it a proven audio path.
- **The tuner is real and free** (`tuner-engine.js` + needle UI at
  `index.html:181-193` + `listenView.js`; `app.js:41` exempts it from
  entitlement). Its only door is the home-screen hero this rebuild removes —
  **re-dooring it from Sage's dialogue is a required ticket** or a working
  feature goes unreachable.
- **Open risk, first thing to investigate next session:** `drillRunner.js:11`
  falls back to `listenerSim.js` when the mic is unavailable and the drills use
  the simulator internally regardless. Trace whether simulated numbers can
  reach stored student facts or Sage's mouth — that would break the standing
  non-negotiable that the teacher only cites stored numbers. New hard rule in
  the spec: no simulated data may ever be written as student data or be
  citable by Sage.
- **The personalization substrate already exists and is unused by the
  teacher:** `practiceStore.js` (per-chord clean/fail/unsure, recent window,
  sessions — "eleven times this week" is a derivation, not new storage),
  `fluencyStore.js` (per-pair fluency, 3-day decay), `storyMemory.js` (nemesis
  chord, comeback beat), `sageCoach.js` (number-citing lines, enforced
  banned-praise list). `05-content/VOICE-GUIDE.md` is authoritative for Sage's
  voice and is not to be reinvented in a prompt.
- **Genuinely new and required:** an **advice ledger** (every suggestion Sage
  gives, timestamped and tagged, so he never repeats a suggestion that didn't
  work and can escalate instead) and **per-pair tempo memory** (so "you were at
  60, let's try 65" is a fact). Plus a **struggle ladder**: slow down → isolate
  one finger → re-frame physically → change the exercise → only then "let's
  work on something else." **Sage must never tell the student to stop or come
  back tomorrow** — owner-specified hard ban; the student may be under a
  parent's 30-minute practice requirement, so ending the session is not the
  teacher's call.
- **Owner decisions recorded:** start at Lesson 3 (E minor) directly, not
  Lesson 1; the full cinematic plays every session, with an always-available
  "continue to the next lesson" skip (button now — voice later, with the rest
  of the deferred speech-input work); student memory stays on this machine only
  (cross-device parked, not decided).
- **Copyright question closed.** All 54 `scale-100/songs/teaching/` files were
  scanned: each is titled "Song-style: X", promises a loop *"inspired by"* the
  song, and carries the objective "this is an original practice progression
  using the same chords — not the published song." **No lyrics, no tablature,
  no notation in any of the 54.** They stay. Residual risk is marketing wording
  only, not the files.
- **Slice 1** (the only thing to build first): cinematic arrival → Sage greets
  the student from stored history → teaches E minor live and aloud → real mic
  verifies → metronome audible and Sage-settable → struggle ladder live with
  the advice ledger → the E minor practice drill real → fretboard SVG shown.
  Nothing else. No capstone, no catalog, no fresh art, **no demolition of the
  current shell until the owner has judged the slice.** Acceptance is the owner
  playing it, not a screenshot and not a green suite.
- **Not done:** nothing was built or changed in app code this session. `gh` is
  still not installed, so the spec is still unpublished.

**Why:** ~98% of the app was built and the owner's verdict was "it turned out
like nothing I wanted." The cause was specs written as file lists and absences
("not a button grid," "not a menu") that never described what Sage knows or
says — so that part was never built. This rewrite states the teaching
positively, shrinks the first deliverable to days, and makes the owner the
acceptance gate.

---

## 2026-09-12 (third session) — Spec redlined against the running code; owner grilled

- **The simulator leak is confirmed, not suspected.** `drillRunner.js:263-288`:
  the mic toggle "only marks provenance" (the code's own comment), every drill
  generates its events from `listenerSim.js`, and the result is written via
  `practiceStore.recordDrillResult(...)` unconditionally. `sageCoach.js` reads
  that store. Spec changed from "investigate" to "cut first"; existing stores
  on the owner's machine are to be wiped before Slice 1 is judged.
- **Chord listening is unproven.** The live evidence was a single 82.41 Hz
  tone; `verifyChord()` (six strings within 6 cents) has never been run on a
  real guitar strumming E minor into a real mic. Now ticket 0 of Slice 1.
- **Tuner moved into Slice 1.** Lesson 3's prerequisite is "guitar in tune";
  an out-of-tune guitar would fail verification on cents and make Sage climb
  the struggle ladder against a tuning problem. Sage checks tuning before
  E minor every session, from his own dialogue. Owner agreed.
- **Sage is a man; the configured Kokoro voice (`af_heart`) is female.** Male
  voice to be chosen. Later segments have their own worlds and teachers, mixed
  genders. Only Lesson 3 / E minor is in scope now.
- **The owner is the Slice 1 student** and does not play guitar. Acceptance =
  Sage teaches the owner E minor.
- **Owner decisions recorded in the spec:** ladder trigger five failed strums;
  3–5 s latency acceptable for round one; live model generation grounded in
  stored numbers and lesson-JSON chord facts (authored copy is reference, not
  script); optional student-entered practice timer that Sage knows about; mic
  denied → keep teaching on self-report, never simulate; arrival 1–2 min,
  music fades out at Sage and does not play under the lesson.
- **Decided by the assistant at the owner's request:** server down / offline
  → Sage degrades to `sageCoach.coachLine` + authored copy on the browser's
  built-in voice via the existing `app.js` `speak()`, says once that he can't
  think out loud today, and the lesson continues. Never stops.
- **New spec definitions:** Sage's output is structured (spoken text +
  actions: set_metronome, show_diagram, open_tuner, start_drill, log_advice);
  the rung is chosen in code, worded by the model; one attempt = one strum with
  a verdict; a suggestion "didn't work" if fewer than three of the next five
  verdicts pass, and it is off the table for three sessions on that chord;
  per-pair tempo memory extends the existing per-session
  `recordPracticeTempo`, not a new store.
- **Still open for the owner:** the Slice 1 pivot target (proposed: tuning
  check → open-string strumming with metronome → back to E minor).
- **Not done:** no app code changed. `gh` still not installed; spec still
  unpublished.

**Why:** the second-pass spec still carried three claims the code contradicts
(mic "real" for chords, simulator "open question", tuner deferrable) and left
the teacher's mechanics — trigger, rung ownership, output shape, degraded
paths — undefined. A builder would have filled those gaps with guesses again.
- **Addendum, same session:** owner confirmed the pivot target, the store
  wipe, and that Sage remembers what the student tells him (dated notes,
  quoted as the student's words, never turned into a number) — all in Slice 1.
  Spec updated. Next session: install `gh`, publish the spec, cut tickets.

---

## 2026-09-13 — gh installed, spec published, Slice 1 tickets cut

- `gh` CLI installed (winget, user scope — the default install hit a UAC
  prompt this non-interactive session couldn't answer; `--silent --scope
  user` worked). Owner authenticated via `gh auth login --web` as `Pando11`.
  Existing remote confirmed (`github.com/Pando11/GuitarApp`) — no new repo
  needed.
- Spec published as **issue #2** (`Spec: Sage Teaches — Slice 1 (E minor)`,
  full contents of `.scratch-spec-draft.md`, label `spec`), unedited.
- **Twelve Slice 1 tickets cut as issues #3–#14**, label `slice-1`, each
  carrying the required "Done means: a live walkthrough… by an agent other
  than the one that built it… owner judges the slice" line verbatim.
  Tickets 0–6 (issues #3–#9) transcribe the owner's own ticket list from the
  prior session's handoff. **Tickets 7–11 (issues #10–#14) were not in that
  list — it was truncated mid-ticket-6 when handed off — and were derived
  by this session directly from the spec's "Slice 1 — the first thing the
  owner sees" walkthrough:** cinematic arrival, Sage's opening (greet from
  history + tuning check), teach-E-minor-live integration, the real practice
  drill, and the two degraded paths (mic denied, server down). Each ticket
  records its `Depends on` issue numbers. **Not owner-reviewed yet** — worth
  a quick skim of issues #10–#14 specifically, since those five are this
  session's interpretation, not a transcription.
- `.scratch-spec-draft.md` and `.scratch-investigate3.mjs` left in place at
  repo root (untracked) since the spec's content is now also live on the
  issue; not deleted in case the owner wants a local diff against issue #2
  later.
- **Not done:** no app code changed. Ticket 0 (issue #3, real-guitar chord
  verification) is the next thing to actually build — it blocks every other
  ticket.

**Why:** the prior session ended with three explicit next actions (install
`gh`, publish the spec, cut tickets) and this session did all three so
building can start against a real tracker instead of another markdown file.

---

## 2026-09-13 (second session) — Slice 1 Wave 1 built: 5 parallel tickets, committed `8463470`

- **Owner directive:** stop trying to recover the original truncated ticket
  list (a `SendMessage` to the cloud session named as its source went out
  but cannot reply back into this session) and instead build against the
  tickets as cut, using subagents in parallel. Ticket 0 (issue #3, real
  guitar + real mic + `verifyChord()`) cannot be done by any agent — it
  needs the owner to physically play a real E minor into a real mic — and
  was not attempted.
- **Five tickets built as file-isolated parallel subagents**, per
  `docs/plans/README.md`'s orchestration contract (no two agents write the
  same file in the same wave):
  - **Metronome** (`core/metronome.js`, new): audible click, 30-240 BPM,
    start/stop, `onBeat()` callback for a UI to build a visual indicator on.
    Not wired into any UI yet. Ticket 2 / issue #5.
  - **Memory stores** (`core/adviceLedger.js`, `studentNotes.js`,
    `practiceTimer.js`, all new; `practiceStore.js` extended additively for
    per-pair tempo memory): advice ledger judges a suggestion by its next 5
    verdicts (3+ passes = worked), off the table for the rest of the
    session plus 3 more sessions on that chord if not; per-pair tempo keys
    resolve order- and alias-independent via the existing `canonPairKey`.
    Ticket 5 / issue #8.
  - **Cinematic arrival** (`core/worldView.js`, rewritten): sequences
    existing video/still/voice assets from
    `assets/worlds/emerald-hollow/` into one continuous ~75s arrival,
    Ken Burns zoom on stills, crossfades between beats. **Deletes the old
    door-grid porch entirely** (`WorldBridge.listDoors`, `#world-doors`) —
    matches the owner's "the student does not control the walk" decision.
    Always-reachable skip control (relabeled existing
    `#world-skip-coldopen` button) ends the arrival from any beat. Exposes
    `onArrivalComplete()`/`playArrival()` as the seam for a caller to
    transition to the lesson — **that wiring does not exist yet**, is not
    in this ticket's scope, and is needed before the arrival does anything
    beyond play and stop. **No ambient music asset exists anywhere in the
    repo** — the fade-out-at-Sage logic is built but is currently a no-op
    until a music file is added. Ticket 7 / issue #10.
  - **Cut the simulator leak** (`drillRunner.js`): drill results now only
    write to `practiceStore` when sourced from a real mic; the three
    sim-driven drills (`metronomeLadder.js`, `tempoLoop.js`,
    `waitToPlay.js`) are gated unconditionally and marked
    `SIMULATION-ONLY` in their headers. Added
    `practiceStore.wipeAllStoredData()` (owner runs
    `window.GuitarApp.PracticeStore.wipeAllStoredData()` in the browser
    console when ready to start Slice 1 clean). **New finding, not
    previously known:** `listenerReal.js` (the real-mic module) is fully
    built but is never imported or called anywhere in the running app —
    today, zero drills produce real mic data; they're either pure
    computation or simulator-driven. Wiring `listenerReal.js` into an
    actual drill is now a known missing piece, not an assumption. Ticket 1
    / issue #4.
  - **Male Sage voice** (`server/src/config.js`, `voiceGen.js`): added
    `FAL_KOKORO_VOICE_SAGE = 'am_adam'` additively alongside the existing
    `af_heart`; `generateSpeech(text, { speaker: 'sage' })` resolves to it.
    New `core/normalizeForTTS.js` converts chord symbols to spoken form
    ("Em" → "E minor") and strips specific AI-ism phrases. **Real Kokoro
    synthesis was not exercised** — verification is mocked-fetch unit
    tests only, trusting `am_adam`'s validity from this repo's own prior
    2026-09-10 documented live test (`server/README.md`), not a fresh
    call. Worth a real synthesis check before trusting audio actually
    comes out. Ticket 3 / issue #6.
- **Lead-agent integration:** the arrival rebuild broke
  `07-app/test/guitar-app.playwright.mjs`'s Emerald Hollow block, which
  asserted the deleted door-grid flow (click a door → open a lesson). Fixed
  in place to assert what exists now (view opens, no door grid renders, skip
  works, leaving returns to the catalog) rather than leaving it red or
  deleting coverage. Full suite green: 28/28 smoke
  (`npm run test:app-smoke`), 122/122 server (`cd server && npm test`),
  32/32 Playwright (`npm run test:playwright`). Committed `8463470`.
- **Deliberately not started this wave:** tickets 4, 6, 8, 9, 10 (issues
  #7, #9, #11, #12, #13) and 11 (issue #14) all touch the shared coaching
  pipeline (`coachSurface.js`, `chatEngine.js`, `guardrail.js`,
  `sageCoach.js`, `app.js`) or `drillRunner.js` again — running them in
  parallel with each other risks overwriting one another's edits, so they
  wait for a later wave, sequenced by their `Depends on:` links on each
  issue.
- **Not done:** ticket 0 (issue #3) — still needs the owner, physically,
  with a real guitar and a real mic. Nothing downstream of it (the
  teach-E-minor integration ticket, the real practice drill ticket) can be
  honestly called done until it passes.

**Why:** the owner explicitly said to stop chasing the missing original
ticket text and build against what exists, in parallel where safe. This
session did that while still honoring the repo's own file-ownership rule
(`docs/plans/README.md`) rather than trading speed for a corrupted merge.

---

## 2026-09-13 (third session) — Issues #10–#14 reviewed and corrected; Wave 2 built: structured coaching output + action wiring, committed `4c71cee`

- **Owner-directed mic investigation, resolved as OS-level, not app-level:** the
  owner's new mini PC couldn't use its mic in the GuitarApp or in Claude Code's
  own `/voice` dictation. Windows was checked directly: the USB mic shows
  `Status: OK`, both the global and per-app microphone privacy consent keys are
  `Allow`, and the owner confirmed the Windows input level meter moves when
  talking. Claude Code's own `/voice` dictation was confirmed working
  afterward. **What's still unconfirmed:** whether the browser has granted
  microphone permission to `http://localhost:5173` specifically (a per-site
  permission, separate from the OS-level checks done here) — that's the
  remaining likely blocker for ticket 0 (issue #3, the real-guitar test),
  which is still not done and still owner-only.
- **Issues #10–#14 (tickets 7–11, the ones derived from spec rather than
  transcribed from the owner) independently reviewed against issue #2 and this
  log's own decisions**, by an agent other than any builder. Verdict: content
  is accurate on all five — no scope creep, no missing acceptance detail,
  near-verbatim matches of spec language. **One real, repeated bug found and
  fixed on GitHub:** `Depends on:` lines and inline `(#N)` references in #11–#14
  were written using *ticket numbers* (0–11) instead of *GitHub issue numbers*
  (ticket + 3), so every such link pointed at the wrong or a nonexistent issue.
  Also found, past what the reviewing agent caught: #13's "the live teaching
  moment in #9" should have been #12 (#9 is the struggle ladder, unrelated).
  All corrected in place on GitHub (#11, #12, #13, #14) — #12's fix also
  restored a dropped dependency (Ticket 3 / issue #6, male voice + speech
  wiring, was named in #12's body text but missing from its own `Depends on:`
  line).
- **Issue #7 (Ticket 4, structured coaching output) built and wired, committed
  `4c71cee`.** Two subagents, sequential (second depended on the first's
  output shape):
  - Build: `getCoachMessage()`/`replyWithCoach()` now return
    `{text, source, actions}`. Actions (`set_metronome`, `show_diagram`,
    `open_tuner`, `start_drill`, `log_advice`) are assembled **deterministically
    in code** from real stored data (store snapshot, advice ledger, tempo
    memory) — the model never chooses an action, since that would itself be an
    invented fact. `server/src/guardrail.js` extended to reject any number/fact
    not in the new envelope sections. Files: `coachSurface.js`, `chatEngine.js`,
    `sageCoach.js`, `server/src/{schema,guardrail,modelClient}.js`.
  - Wiring: a new `07-app/core/actionHandler.js` dispatches those actions
    against the real fretboard renderer, `metronome.js`, and `adviceLedger.js`
    from both `drillRunner.js` and `lesson-runner.js`. **Live-verified with
    Playwright against the real running dev server**, not just unit tests — a
    real coaching reply actually mounted a chord diagram and started a running
    metronome in the DOM.
  - **Known gaps, reported rather than papered over:** `chatEngine.js`'s
    `replyWithCoach()` has no live UI caller yet — only `getCoachMessage()`
    (called from `drillRunner.js`/`lesson-runner.js`) is wired in. Its
    `start_drill` actions are keyed to a lesson's free-text `exercises` entries,
    a different vocabulary from `drillRunner.js`'s `DRILL_MENU_TO_ID`; no bridge
    exists, so `start_drill` handlers currently log a telemetry event rather
    than invent a mapping. `set_metronome` and `log_advice` wiring is proven
    correct in isolation but has no live producer yet — nothing in the running
    app currently calls `recordPracticeTempo()` or supplies real advice context
    outside tests.
  - 28/28 smoke, 144/144 server, 32/32 Playwright, all re-run and confirmed
    green by the lead agent before committing (not just self-reported by the
    builders).
- **Not done, per the owner's standing rule:** this wave has not yet had its
  live owner-facing walkthrough by a verification agent separate from both
  builders — that's the next step before this ticket can be called closed.
- **Next tickets, in corrected dependency order:** #9 (struggle ladder) and
  #11 (Sage's opening) are both buildable now (their dependencies — #4, #6,
  #7, #8 — are all done). #14 (degraded paths) needs #9 built first. #12 and
  #13 remain blocked on #3 (ticket 0, the owner's real-guitar test) and cannot
  be honestly closed until it passes, though code groundwork (wiring
  `listenerReal.js`) can proceed independently.

**Why:** the owner asked for issues #10–#14 checked for accuracy before more
was built on top of them, and for the coaching-actions ticket to actually
reach the running UI (not just pass isolated tests) before calling it done,
with independent verification throughout rather than self-reported success.
