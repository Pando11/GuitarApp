# HANDOFF — GuitarApp (2026-08-08, late) — WHAT NEEDS TO BE DONE

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
| F7 band (gate) | `cd step7-extra && node verify-band.js` | **31/0 — REAL (#7 pitch+octave + #8 tamper sound; 4th hostile holes #1/#2/#3 all closed, commit fa71962)** |
| F7 band (engine smoke) | `cd step7-extra && node smoke-f7-fixes.js` | **9/0 — REAL fixes #2-#6 proven** |
| F10 voice | `verify-voice.js` | **DOES NOT EXIST** (engine exists, gate missing) |
| RevenueCat | `cd step7 && node verify-step10-revenuecat.js` | 43/0 (stub; owner-blocked on keys) |

Git: `fa71962` = F7 gate + engine: close all 3 holes from 4th hostile pass. `acbf158` = F7 GATE #7+#8 first hardening. `98c00fd` = F7 engine fixes #2-#6. Working tree clean.

## 4th HOSTILE PASS — VERDICT: NOT SOUND (3 holes), ALL NOW CLOSED (commit fa71962)
The 4th agent (zero build context) attacked the committed gate and returned "NOT sound, 3 holes,
two serious." Every hole is now FIXED and re-proven:

| Hole | Finding (measured) | Fix | Proof |
|---|---|---|---|
| #1 (serious) | `parseChordRoot('E7')` read the chord `7` as octave 7 → gate expected 2637Hz; engine ALSO misparsed → bass emitted 2637Hz (above listener F_MIN, inaudible squeal). "26/0" agreed by shared bug. | Strip quality tokens (`7/9/11/13/5/6/m/sus/add`) before octave match in BOTH gate `parseChordRoot` AND engine `chordRootName`. Bass now E2/B2 (82/123Hz) as intended. **This was a real engine audio defect**, not just a gate artifact. | gate 31/0; bass ROOT/FIFTH/STAB all E2/B2; `band-source.js` regenerated. |
| #2 (serious) | `cents` hard-set to `0` for the matched octave bin → 25¢ tolerance was a dead no-op; a +100¢ semitone-sharp bass PASSED. | `verifyBassOctave` now MEASURES real cents via `detectPitchSet` (F_MIN-bounded; autoCorrelate was rejected because the kick-drum sweep at the root slot fools it into ~20Hz). +100¢/+50¢ detune REJECTED; in-tune passes. Added NEGATIVE(4d)+SANITY(4e). | +100¢ & +50¢ fail; in-tune passes. |
| #3 | Baseline not self-protected (rewrite one hash line → green) + path-traversal via `..`. | Pin baseline file's OWN sha256 inside the gate (self-check fails on tamper); reject any rel with `..` or out-of-root. | Appending `\\n` to baseline → gate FAILS (30/1), restores to 31/0. |

Anti-tamper (#8) was confirmed SOUND by the 4th agent itself: delete/append-tamper any listed core
file → hard fail; delete `teacher.js` → FAIL. The only residual (HOLE 3) was the unpinned baseline,
now closed.

Proven: `node verify-band.js` → 31 passed, 0 failed (exit 0); `node smoke-f7-fixes.js` → 9/9;
baseline self-pin tamper test FAILS (30/1) then restores to 31/0. **5th hostile re-review queued** —
F7 stays "in review" until that returns clean.

## HOW WE GOT HERE (proven, not asserted)
A **3rd hostile agent** (zero build context) re-verified the committed F7 engine by RUNNING
code and MEASURING — not trusting the prior bug list. Its measured verdicts:

| # | Allegation | Verdict (measured) | Evidence |
|---|---|---|---|
| 1 | Bass fifth octave low | **ALREADY FIXED in HEAD** | fifth=B2/123.47Hz, audible; `noteToFreq(fifth,0)` |
| 2 | NaN poisoning from bad fret | **REAL** | `[0,2,'x',1,0,NaN]` → 20.11% NaN samples |
| 3 | Crash on `chordCycle:[7]` | **REAL** | `TypeError: name.replace is not a function` |
| 4 | Unbounded `bars` (DoS) | **REAL** | 10k bars → 3,364 MB / 79 s; no cap |
| 5 | `Bb`→`B` (flat bug) | **REAL (worse)** | 3-way wrong: root→B, fifth→G, freq→A |
| 6 | `gain` ignored | **REAL (API-lie)** | `opts.gain` referenced 0×; identical output |
| 7 | Gate octave-blind/vacuous | **REAL** | gate derives expected from engine's own API; `notesMatch` passes B0–B3 |
| 8 | Anti-tamper gaps | **REAL** | `practiceStore.js`+`tuner-engine.js` not in baseline; deletion invisible |

PLUS: the CORE read-only check in verify-band.js is **fully vacuous** — its baseline paths
start with `*` (sha256sum format) and resolve from the wrong dir, so every file `!exists →
continue` and "18/0 CORE UNCHANGED" is a LIE. This is part of #8, worse than first reported.

## F7 ENGINE — #2-#6 FIXED & VERIFIED THIS SESSION (commit 98c00fd)
- #2 NaN fret guard: non-numeric/`'x'`/`NaN` frets skipped; defensive NaN→0 scrub in final loop.
- #3 non-string chord: `chordRootName` returns `{root:null}` for non-strings; bass block skipped (no crash).
- #4 `bars` DoS: hard cap `MAX_BARS=256` (was unbounded). 1e9 → 256, ~445ms.
- #5 flats: `NOTE_BASE` now has Db/Eb/Gb/Ab/Bb; `chordRootName` keeps flat spelling; `transposeName`
  normalizes flat→sharp for the chromatic index. `Bb` → root Bb, fifth F, freq 116.54 (not A).
- #6 master gain: `opts.gain` now scales the whole mix (verified 0.1 vs 0.2 → ~2× peak). Soft-clip kept.
- #1 regression guarded (still B2/123.47Hz, audible) — untouched, the prior "fix" was already in HEAD.

Verified by `smoke-f7-fixes.js` (9/9). band-source.js regenerated from the fixed engine.

## F7 GATE — #7 (octave-blind) + #8 (anti-tamper) DONE (commit acbf158), 4th hostile pass QUEUED
The DONE BAR rewrite landed and runs 26/0. Measured design:

**#7 — pitch gate now asserts the engine's REAL output against an INDEPENDENT expected.**
- Expected bass freqs come from a SEPARATE equal-temperament oracle (A2=110), NOT `B.noteToFreq`
  (which the engine also uses) — so a register regression can't silently agree with itself.
- Octave is proven SOUND via Goertzel energy at f vs f/2 vs f*2 (the listener math reports a low
  note's 2nd harmonic as the "fundamental", which is why a naive cents check is octave-blind). The
  true fundamental must beat each octave neighbor by >=1.4x AND be within 25 cents. A B1-vs-B2
  regression FAILS. Two NEGATIVE tests (E1=41Hz and E3=165Hz) are REJECTED, proving octave-soundness.
- Audible-register guard (>=F_MIN=55) kept, fails loudly on sub-floor bass.

**#8 — anti-tamper is REAL now (was fully vacuous).**
- Root cause of the vacuity: the baseline parser kept the leading `*`, then resolved paths from
  `step7` (not repo root), so every file missed → `continue` → false "18/0 UNCHANGED".
- Fix: parse `^\s*([0-9a-f]{64})\s+\*(.+)$`, resolve from REPO_ROOT, and `if (!existsSync) FAIL`
  (no silent skip). Added `tuner-engine.js` + `practiceStore.js` to the baseline (verified pins
  `d463d6bc…` / `226bdf13…`). All 8 modules byte-checked; deletion is detected.
- Baseline file: `06-prototypes/step8/CORE-UNTOUCHED.sha256` now lists 8 entries.

Proven: `node verify-band.js` → 26 passed, 0 failed (exit 0); `node smoke-f7-fixes.js` → 9/9;
engine file unchanged (integrity verified). 4th hostile re-review dispatched (zero build context) —
F7 stays "in review" until that returns clean.

## F10 — VOICE CONTROLS — ENGINE EXISTS, GATE MISSING
- Built: `06-prototypes/step7-extra/voice-command.js` (text→intent: slower/again/whats-next/
  tune-my-guitar + out-of-scope reject; reuses step2 tuner for tune). 6/6 mapping self-test.
- **What needs doing:** (a) write `verify-voice.js` DONE BAR (intent mapping incl. adversarial
  phrases, guardrail rejection, determinism, Ban 5); (b) wire a `file://` demo (tap-to-talk
  button → recognized text → engine → player intents); (c) hand to a FRESH hostile agent for
  re-review before marking done. The STT/mic capture is a device boundary (Web Speech API),
  stubbed — the engine only takes recognized text, so it's testable now without a mic.

## REVENUECAT (owner-blocked)
- Step 10 gate 43/0 in stub mode. Live wiring needs `appl_…`/`goog_…` public keys (not `sk_`).
- On keys: `export RC_IOS_PUBLIC_KEY=… RC_ANDROID_PUBLIC_KEY=… && node verify-step10-revenuecat.js`.
  Adapter flips to live, no code change. Only the real App/Play sandbox grant is unproven (needs keys).

## OTHER CARRY-FORWARD
- Step 5 live mic calibration on a real strummed chord — logic proven, in-room sign-off pending.
- No YouTube channel name/handle yet.
- Two chord gates (step0 / step8) overlap — unify when convenient.
- Flutter-vs-RN spike, teacher art, SMS cadence caps — open items, not blocking.

## NEXT ACTIONS (priority order)
1. **F7 GATE #7 + #8 — 4th hostile pass returned 3 holes; ALL CLOSED (fa71962).** 5th hostile
   re-review QUEUED (zero build context, must attack all 3 fixes). If clean → F7 "done". If a hole
   remains → fix + re-run. Either way commit and update this handoff.
2. Build F10 `verify-voice.js` + `file://` demo, hostile-review it (F10 needs its 1st hostile pass).
3. Wire RevenueCat live on keys.

## CONVENTIONS (unchanged, enforced)
- Addy Osmani: spec→plan→build→test→review→simplify→ship. Never skip.
- Free tier STRICT: tuner+metronome+L01 only (`FEATURE_TIER` in entitlementStore.js). Shell
  tier removed — do not revive (verified 36/36).
- Verification is arithmetic, not human. No "unverified" warning boxes.
- Hostile re-review mandatory before "done" — once #7/#8 land, F7 needs a 4th pass; F10 needs its 1st.
