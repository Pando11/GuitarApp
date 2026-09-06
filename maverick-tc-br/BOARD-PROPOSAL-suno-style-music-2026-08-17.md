# BOARD-PROPOSAL — Suno-style student song-creation (2026-08-17)

**Status:** OPEN — awaiting board decision (this fire: 2026-08-26).
**Source:** `03-research/ai-features-20-monetization-ideas.md` item #22 +
`PROPOSED-FEATURES.md` §22.

## The pitch (from owner + board context)

Owner saw Suno ads and wants a Suno-*like* experience inside GuitarApp. The board
proposal (item #22 in the monetization brainstorm) scopes two phases:

- **Phase 1 — "Hum a song → instant lesson."** Student hums or records a tune; the app
  matches it to chords the student has already learned and turns it into a lesson. Near-zero
  authoring cost for new songs. Overlaps + extends monetization item #2 (unblocked 2026-08-16
  when owner deleted Rule 4 + Rule 7 bans).
- **Phase 2 — "App generates original practice backing tracks / full songs."** AI generates
  backing-band play-alongs and full songs for practice. Needs cloud GPU (like #5/FLUX pipeline).
  Proposed engine: **ACE-Step (MIT) / YuE (Apache-2.0)** — licenses verified at source 2026-08-17.

## What we must NOT do (hard rules from AGENTS.md)

- **Do NOT use Suno** — paid subscription, free tier non-commercial, copyright-lawsuit history.
  Violates the free+clean rule (no subscription-fee creative tools; Rule 9).
- **Do NOT propose MusicGen** — CC BY-NC = non-commercial, disqualified for a paid app (AMCOMMENT-12 §NOTE, item #11 caveat).
- **Do NOT generate riffs / melodies / lyrics / TAB** — AMENDMENT-12 explicitly outlaws these.
  Phase 1 "match to known chords" is OK; phase 2 "full songs" must stay inside the chord-progression
  lane only.
- **Do NOT open-ended audio transcription** — constrained target-matching only (the old ban was
  deleted 2026-08-16, but the accuracy rationale stands; AGENTS.md §3).
- **Voice/image models must be commercially licensed (Apache-2.0/MIT) or paid per-call.**
  Phase 2 cloud GPU is a cost, not a subscription-fee creative tool — that's the line.

## Licensing position (verified at source 2026-08-17)

|| Candidate | License | Commercial-safe for paid app? | Notes |
||-----------|---------|-------------------------------|-------|
|| ACE-Step | MIT | YES | Verified at source 2026-08-17. Candidate for phase-2 backing tracks. |
|| YuE | Apache-2.0 | YES | Verified at source 2026-08-17. Candidate for phase-2. |
|| Suno | Paid + non-commercial free tier | NO | Blocked. Lawsuit history. Violates free+clean rule. |
|| MusicGen | CC BY-NC | NO | Non-commercial. Disqualified. |

## Board questions

(a) **Approve the "hum a song → lesson" direction?** Phase 1 stays inside AMENDMENT-12's chord-progression
lane, uses only chords the student has learned, and matches monetization item #2 (already unblocked).
No new model needed — it's a constrained matcher, not a generator.

(b) **Budget a small cloud-GPU trial for phase-2 backing tracks?** Phase 2 needs cloud GPU (no VRAM on
mini-PC). ACE-Step/YuE are free + commercial-clean, but the run cost is real (cloud GPU, not a subscription).
The board must decide whether to spend on a trial or defer phase 2 to after phase 1 ships + proves retention ROI.

(c) **Any music-IP concern to route to counsel before ship?** AMENDMENT-14 is explicit: distinctive
progressions tied to one famous recording are NOT a safe harbour (cf. *Williams v. Gaye*) and need
counsel sign-off before paid launch. If phase 1 lets a student hum *any* tune and the app matches it to
a progression, there's a surface where the matched progression could be distinctive to a copyrighted song.
The gate proves mechanics; it does NOT prove legal safety. Counsel sign-off is a legal gate, not an
accuracy gate.

## What's NOT in scope

- Generating riffs, melodies, lyrics, or TAB (AMENDMENT-12 hard ban).
- Using Suno, MusicGen, or any non-commercial / subscription-fee model (Rule 9 + free+clean rule).
- Open-ended audio-to-MIDI transcription (constrained matching only).
- Anything that would generate a copyrighted song or a distinctive signature progression without counsel sign-off.

## Dependencies

- Phase 1 depends on: (1) a constrained hum-to-chord-matcher that only matches against the known
  chord set the student has learned (not free inference), (2) the 10-song progression catalog as the
  target space, (3) AMENDMENT-12/14 legal posture (progressions OK, riffs/lyrics NOT).
- Phase 2 depends on: (1) cloud GPU access (not on this machine — no VRAM on mini-PC), (2) ACE-Step
  or YuE installed + verified, (3) gating on the song-progression track (no riffs/lyrics/TAB), (4)
  counsel sign-off on any distinctive-progression risk before paid launch.
