# Spec — Mystery Mode (from grill-with-docs, 2026-08-22)

Derived from Grill #3. Supersedes any looser "mystery song game" wording
elsewhere; the **legal floor** (Rules 5, 9, 2) and the song-progression track
(AMENDMENT-12/14) + prereq gate (AMENDMENT-13) are unchanged. See
`docs/adr/0003-mystery-mode.md`.

## Problem Statement

The repo has the song-progression track (11 songs, AMENDMENT-12/14), the
listening engine (AMENDMENT-05), and Student Memory (ADR-0001). What it does NOT
have is an **advanced, motivating way to use them** once a student finishes the
core curriculum. Mystery Mode is that lane: an ear-training game that reuses all
three systems and rewards curriculum completion with a "the teacher remembers
you" payoff — without crossing any legal line.

## Solution

An opt-in, capstone-gated **Mystery Mode** lane. The app picks from the
11-song pool (only songs whose chords are all learned), blanks the chord names,
and asks the student to ID the progression by ear. Reuses the listening engine,
the song-progression data, and Student Memory.

### Play loop (locked in grill)

1. **Select.** Student opens Mystery Mode and sees the pool. Learned-unlocked
   songs show normally; not-yet-unlocked songs show **greyed with the missing
   chord named** (a goal: "finish L8 to continue"). Each card carries the song
   title; the 9 trademarked songs also carry the **"not affiliated / not
   endorsed"** disclaimer under the title (AMENDMENT-14). House of the Rising Sun
   (public domain) carries none.
2. **Blank + play.** The app blanks the chord names and **plays the progression**
   (audio). Primary path: student **picks the chord names from a list** — pure
   ear training, **no guitar / mic required**.
3. **Bonus verify (optional).** Student MAY play along on their guitar; the
   listening engine verifies the played chords. Mic is a bonus layer, never
   required to complete a mystery.
4. **Hint ladder.** Up to 3 wrong guesses. Each miss reveals one more hint in
   order: (a) chord count, (b) one named chord, (c) the key. Full reveal on the
   3rd miss. **Every hint string passes a HUMAN lyric read-through before ship**
   (AMENDMENT-14 — a regex cannot catch a paraphrased lyric).
5. **Reveal.** The app **plays the progression again** AND shows the chord-name
   sequence + a one-line "why it works" (key + movement). Teacher copy is
   **encouraging** (see glossary): it builds the student up, then invites the
   harder challenge.
6. **Record.** Mysteries-solved count + success rate write to **Student Memory**,
   encrypted cross-device (ADR-0001). Drives the teacher's "you did really great
   on the first three — let's step it up and try the four-chord monster" line.

### Architecture decisions (locked in grill)

- **Difficulty ranking.** By chord count + how atypical the order is
  (2 chords = easy, 4 = monster). Drives encouraging-copy selection. No
  paywall — it's the reward for finishing the curriculum.
- **Reuse, don't rebuild.** Draws from `07-app/content/song-progressions/`
  (progressions.json + shapes.json), the on-device listening engine, and the
  ADR-0001 student-memory blob. No new backend.
- **Legal by construction.** Disclaimer-on-card for the 9 trademarked songs;
  human hint read-through is a ship gate; no riff/lyric/tab ever shown
  (AMENDMENT-12/14). Distinctive progressions tied to one famous recording
  (e.g. the House of the Rising Sun is public domain and unrestricted; others)
  still need counsel sign-off before paid launch — that is a legal gate, not a
  data gate.

## User Stories

1. As a capstone graduate, I want an advanced challenge that uses the songs I
   learned, so finishing the curriculum opens something new.
2. As a student, I want to ID a progression by ear without needing my guitar, so
   I can train my ear anywhere.
3. As a student, I want wrong guesses to give me gentle hints, not a fail screen,
   so I learn from the miss.
4. As a student, I want the teacher to say "you did great, let's try the
   four-chord monster," so the harder challenge feels like a high-five, not a test.
5. As a student, I want my mysteries-solved count to follow me across devices, so
   the teacher remembers my progress on phone and desktop.
6. As the owner, I want every hint and reveal to stay clear of lyrics/copyright,
   so the lane is legally safe to ship.

## Hard constraints (from AGENTS.md — non-negotiable)

- No riff / melody / lyric / tab ever shown (Rule 9 / AMENDMENT-12/14).
- Band names = trademarks: nominative use only, "not affiliated / not endorsed"
  disclaimer REQUIRED on any screen naming a song/artist. Never "Y's X".
- Human lyric read-through of every hint/reveal string before ship (AMENDMENT-14
  — cannot be automated).
- Listening (if the student opts into play-along) is on-device; audio never
  uploaded.
- Distinctive progressions tied to one recording still need counsel sign-off
  before paid launch (legal, not accuracy).
- LLM writes prose only; teacher copy cites stored Student Memory numbers (Rule 5).

## Verification

- `node tools/verify-song-progressions.js` stays 0 errors / 0 warnings (AMENDMENT-12 gate — unchanged).
- Prereq gate (AMENDMENT-13): a mystery unlocks only after every chord it uses
  is taught — confirmed by `tools/verify-song-progressions.js` re-derived prereq map.
- Trademark disclaimer present on all 9 non-public-domain song cards + reveals
  (manual UI check).
- Hint ladder verified: 3 misses → full reveal; each hint step reveals in the
  locked order (chord count → one chord → key).
- Student Memory persists mysteries-solved + success rate; edit-on-phone appears
  on desktop (always-on, no toggle — ADR-0001).
- Human lyric read-through checklist signed off per hint string before release.
