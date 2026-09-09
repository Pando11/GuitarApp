# Sage actually answers now — 2026-09-08

Written after the machine restarted mid-session. Nothing was lost; the work
in the tree was intact. This file records what was verified, what was broken,
and what changed.

## The headline

Before today, **the coaching service never once reached the student.** Every
lesson question and every practice nudge was answered by canned template
prose. The app looked like it worked, which is why this survived so long.
It now serves real model answers end to end, measured against the live API.

## What was wrong, in the order it bit

**1. The latency budget was under the cost of a call.** The server gave an
unprompted coaching nudge 2300 ms. Real Haiku calls measured 1.9 s and 2.3 s
before HTTP framing, so the call was cut off essentially every time and the
handler fell back to template text. The repo's own live smoke test had been
recording this failure. Budgets are now 6000 ms server-side
(`server/src/config.js`) and 7000 ms client-side (`07-app/core/chatEngine.js`),
raised together as their comments require.

**2. The guardrail rejected answers about the lesson's own subject.**
`guardrail.js` enforces Rule 5 by refusing any chord name or number that is
not in the facts envelope. The envelope carried only the student's *recorded
mastery*. A beginner opening lesson 3 has none — so Sage could not say "Em",
the entire subject of that lesson, without being rejected and replaced by an
apology. Asking "What does Em mean?" against the running server produced
exactly that.

**3. Sage taught the chord wrong.** Once the name was allowed through, the
model was asked how to make Em sound clean and answered *"third fret of the D
string."* Em is the second fret. The guardrail could not catch it: it
deliberately does not scan spelled-out numbers, and no fret numbers were in
the envelope to check against. The lesson JSON has held the verified shape
all along — `frets: [0,2,2,0,0,0]`, `fingers: [0,2,3,0,0,0]` — it was simply
never sent. **The fix is not a better checker. It is not making the model
guess something the lesson already knows.**

**4. A deployed copy could never reach a coach at all.** The service URL was
the hardcoded loopback address `http://127.0.0.1:8787/coach`, correct only on
the machine running the server. Any phone or friend's browser would have
silently served template prose.

## What changed

- **New envelope field, `lessonChords`.** The verified chord shapes the open
  lesson teaches: `{chord, frets, fingers}`, six entries low E to high e,
  null meaning muted. Read straight off the lesson's own `chords` block by
  `lesson-runner.js`, validated in `server/src/schema.js`, and used for two
  distinct jobs — the guardrail allows those names, and the prompt states
  those fingerings so the model has nothing to invent.
- **The guardrail learned three things a teacher actually says.** A lesson's
  own chord and its root letter ("Em is short for E minor"). The lesson's own
  fret numbers. Plural and Oxford-comma string references — "the G, B, and
  high e strings" was being read as three invented chords. It also stopped
  rejecting the model for saying which lesson the student is in.
- **The coach URL is configurable.** `globalThis.GUITARAPP_COACH_URL`, set by
  a one-line script in `07-app/index.html` and read by `defaultCoachUrl()`.
  Local development needs no configuration. **A deploy must set it**, or the
  deployed app will look like it works while serving canned text.

The guardrail was widened only where the model was echoing the envelope back.
It still rejects a chord the lesson does not teach, a fret the shape does not
contain, a number about the student that was never recorded, and a different
lesson's number. Tests cover each of those refusals.

## Verified live, not just in tests

Eight beginner questions against lesson 3, real API, real HTTP server:

| | |
|---|---|
| Served a real model answer | 7 of 8 |
| Served canned template text | 1 of 8 |

Before the changes, the same path served template text every time. The
fingering Sage now gives matches the lesson's verified shape: middle finger
on the A string at fret 2, ring finger on the D string at fret 2.

The one remaining fallback is the system working as designed. When the
guardrail is unsure, the student gets a safe generic line rather than a
confident invention. That is the correct trade.

## Test counts after

| Suite | Result |
|---|---|
| Coach server | 73 passed |
| App smoke | 28 passed |
| Playwright end to end | 35 passed |
| Core unit suites | all passed |

Server tests went from 49 to 73. The new ones are adversarial: they prove the
guardrail still refuses what it should.

## The model

Sage runs on **Haiku 4.5** (`claude-haiku-4-5-20251001`), confirmed by the
owner on 2026-09-08. `server/src/config.js` is the source of truth. The Tier 1
plan document used to specify Opus 5 with adaptive thinking; that line has
been corrected in place so nobody swaps it back by reading the plan. Haiku
rejects `thinking` and `output_config` with a 400 — do not send them.

## The five-friend gate is waived

`docs/plans/STATUS.md` gated every tier on five outside testers opening the
app. None are available, so the owner waived it on 2026-09-08. It is retired,
not passed.

What that gate was protecting against is now unguarded: shipping on the
author's own judgement of what a beginner needs. Nobody who is new to guitar
has tried these lessons. Every claim in this repo about how the first lessons
*feel* is untested. Re-open the gate the day a tester exists.

## Still open

- **Nothing is deployed.** The static app has a GitHub Pages workflow ready
  and the coach service has no host at all. The coach is the only process
  holding the API key, so it cannot go on Pages.
- **`GUITARAPP_COACH_URL` must be set at deploy time.** This is the failure
  that will look like success.
- **Prompt caching never hits.** Known and accepted: the prompt is ~655
  tokens and Haiku's cacheable-prefix floor is higher than that. The live
  smoke test still reports it as a FAIL line. It costs a little money, not
  correctness.
- **`app-refactored.js`** is ~1500 dead lines nothing loads.
- **Service worker precaches ten files**, not `lesson-runner.js`, no lesson
  JSON, no audio. A weak connection gets a shell with no lesson in it.
- **`drill_result` telemetry** still has no real end-to-end data behind it.
