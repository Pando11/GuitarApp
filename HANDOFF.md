# HANDOFF — GuitarApp (2026-08-08, evening) — WHAT NEEDS TO BE DONE

Single pointer file (per owner preference). Source of truth: `02-spec/FEATURES-LOCKED-v1-2026-08-07.md` + `PLAN-from-locked-spec-2026-08-07.md`.
STALE (never use): `guitar-build-plan.md`, `PLAN-app-plus-youtube-4500-2026-08-07.md`.

## VERIFIED STATE RIGHT NOW (re-run this session, real output)
| Gate | Command | Result |
|---|---|---|
| step0 chords | `cd step0 && node run-chord-check.js` | 11 chords, 0 err, 0 warn |
| step5 listening (F2) | `cd step5 && node verify-step5.js` | 30/30 |
| step7 paywall (F12) | `cd step7 && node verify-step7.js` | 36/36 |
| step8 packs | `cd step8 && node verify-step8.js` | 94/94 |
| step9 YouTube | `cd step9 && node verify-step9.js` | 33/33 |
| step6 store | `cd step6 && node verify-step6-store.js` | 22/22 |
| F7 band (gate) | `cd step7-extra && node verify-band.js` | 18/18 |
| F10 voice | `verify-voice.js` | **DOES NOT EXIST** |

Git: repo initialized this session, working tree clean, 5 commits. Vendored clones excluded.

## F7 — DONE (built + double hostile-reviewed) BUT GATE IS WEAK — MUST HARDEN
F7 shipped and two hostile agents reviewed it. They AGREE the gate (18/18) is weak and
masks real defects. The engine works but has unaddressed bugs the reviewers proved by
running code. **None of these are fixed in the committed code.** List of what needs doing:

1. **Bass fifth octave** — committed engine emits the fifth at shift −1 (line 152,
   `noteToFreq(fifth,-1)`), i.e. B1≈62Hz, an octave below the root and frequently
   BELOW the detector's F_MIN=55 (G→37Hz, A→41Hz, default C→49Hz). Inaudible on phone
   speakers. Reviewer #2 confirmed it's a real BLOCKER (measured `B1@62.0`). FIX: change
   to shift 0 so root+fifth share a register.
2. **NaN poisoning from bad frets** — `frets:['x']` / `NaN` / `{}` → `Math.pow(2,fret/12)=NaN`
   → ~20% NaN samples in the buffer. Reviewer proved 11,760 NaN of 58,800. FIX: skip
   non-numeric frets in the chord-stab loop.
3. **Crash on non-string chord name** — `chordCycle:[7]` → `TypeError` (chordRootName
   calls `.replace` on a number). FIX: validate chord names are strings up front; throw
   a clear error.
4. **Unbounded `bars` (DoS)** — `bars:200` → 423 MB buffer / 3.2s; larger → 60s hang /
   RangeError. FIX: cap bars (e.g. 64).
5. **`chordRootName` flat bug** — `'Bb'` parsed as `'B'` (semitone sharp bass). FIX: parse
   flats/sharps correctly.
6. **Gain ignored** — `tone()` passed a 4th gain arg to `makeStringTone` which ignores it;
   bass/chord gains (0.5/0.22) silently dropped, soft-clipper saturates. FIX: apply gain
   inside `tone()`.
7. **Gate is octave-blind / vacuous** — the stem checks assert constants, not the engine's
   real output; they pass even if the bass is silent or wrong-octave. FIX: derive expected
   from the engine's ACTUAL call, measure bass in a window with no chord tones, and make
   the "audible" check test the engine's emitted register.
8. **Anti-tamper gaps** — `CORE-UNTOUCHED` check passes on deleted files and doesn't cover
   `practiceStore.js` / `tuner-engine.js`. FIX: fail on missing listed files; add the two
   reused/modified files to the baseline.
9. **`recordPracticeTempo([63])` accepted** — `Number([63])` coerces. Minor; tighten validation.

A fresh hostile agent should re-run after fixes. Do NOT mark F7 "clean" until the gate is
honest and a third hostile pass is green.

## F10 — VOICE CONTROLS — IN PROGRESS, NOT DONE
- Built: `06-prototypes/step7-extra/voice-command.js` (text→intent: slower/again/whats-next/
  tune-my-guitar + out-of-scope reject; reuses step2 tuner for tune). 6/6 mapping self-test.
- **What needs doing:** (a) write `verify-voice.js` DONE BAR (intent mapping incl. adversarial
  phrases, guardrail rejection, determinism, Ban 5); (b) wire a `file://` demo (tap-to-talk
  button → recognized text → engine → player intents); (c) hand to a FRESH hostile agent for
  re-review before marking done. The STT/mic capture is a device boundary (Web Speech API),
  stubbed — the engine only takes recognized text, so it's testable now without a mic.

## REVENUECAT (owner-blocked)
- Step 10 gate 43/43 in stub mode. Live wiring needs `appl_…`/`goog_…` public keys (not `sk_`).
- On keys: `export RC_IOS_PUBLIC_KEY=… RC_ANDROID_PUBLIC_KEY=… && node verify-step10-revenuecat.js`.
  Adapter flips to live, no code change.

## OTHER CARRY-FORWARD
- Step 5 live mic calibration on a real strummed chord — logic proven, in-room sign-off pending.
- No YouTube channel name/handle yet.
- Two chord gates (step0 / step8) overlap — unify when convenient.
- Flutter-vs-RN spike, teacher art, SMS cadence caps — open items, not blocking.

## NEXT ACTIONS (priority order)
1. Fix F7 engine bugs #1–#6, harden gate #7–#8 (verify-band.js), re-run, regenerate
   band-source.js, re-dispatch a THIRD hostile agent. (F7 is the only feature with known
   unaddressed BLOCKERs — do this first.)
2. Build F10 `verify-voice.js` + `file://` demo, hostile-review it.
3. Wire RevenueCat live on keys.
4. Commit each step; update this handoff.

## CONVENTIONS (unchanged, enforced)
- Addy Osmani: spec→plan→build→test→review→simplify→ship. Never skip.
- Free tier STRICT: tuner+metronome+L01 only (`FEATURE_TIER` in entitlementStore.js). Shell
  tier removed — do not revive (verified 36/36).
- Verification is arithmetic, not human. No "unverified" warning boxes.
- Hostile re-review mandatory before "done" — F7 needs a 3rd pass; F10 needs its 1st.
