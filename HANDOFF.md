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
| F7 band (gate) | `cd step7-extra && node verify-band.js` | **18/0 but KNOWN-VACUOUS (#7/#8 below)** |
| F7 band (engine smoke) | `cd step7-extra && node smoke-f7-fixes.js` | **9/0 — REAL fixes #2-#6 proven** |
| F10 voice | `verify-voice.js` | **DOES NOT EXIST** (engine exists, gate missing) |
| RevenueCat | `cd step7 && node verify-step10-revenuecat.js` | 43/0 (stub; owner-blocked on keys) |

Git: `98c00fd` = F7 engine fixes #2-#6 committed + band-source.js regenerated. Working tree clean.

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

## F7 GATE — #7 (octave-blind) + #8 (anti-tamper) STILL OPEN — THE REAL HARDENING WORK
The DONE BAR must be rewritten before F7 can be called "clean". Concrete plan:

**#7 — make the pitch gate assert the engine's REAL output against an INDEPENDENT expected.**
- Compute expected bass freqs from a SEPARATE octave-aware table (not `B.noteToFreq`, which
  the engine also uses). A wrong-octave engine must FAIL.
- Replace the octave-blind `notesMatch` pass-band with a tight check: measured bass fundamental
  within ±1 semitone of the expected register AND within ~25 cents, using a fresh detector window
  on the bass-only slot (t0=beat0 root, t0=beat2 fifth) with chord tones excluded.
- Keep the audible-register guard (>=F_MIN) but make it fail LOUDLY on any sub-floor register.

**#8 — make anti-tamper REAL.**
- Add `06-prototypes/step2/engine/tuner-engine.js` + `06-prototypes/step6/store/practiceStore.js`
  to the CORE baseline (pin their current sha256: tuner-engine `d463d6bc…`, practiceStore `226bdf13…`).
- Fix the baseline resolver: strip the leading `*` on each line, resolve paths from the **repo root**
  (two levels above step7-extra), not step7. Then `if (!existsSync) FAIL` (no `continue`).
- Keep the 6 existing files. Re-run to confirm all 8 are byte-checked.

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
1. **F7 GATE hardening (#7 + #8)** — rewrite verify-band.js per plan above; re-run smoke + gate;
   confirm all 8 CORE files byte-checked and a wrong-octave engine now FAILS. (Engine bugs done.)
2. Build F10 `verify-voice.js` + `file://` demo, hostile-review it.
3. Wire RevenueCat live on keys.
4. After #7/#8: re-dispatch a 4th hostile agent on F7. Commit each step; update this handoff.

## CONVENTIONS (unchanged, enforced)
- Addy Osmani: spec→plan→build→test→review→simplify→ship. Never skip.
- Free tier STRICT: tuner+metronome+L01 only (`FEATURE_TIER` in entitlementStore.js). Shell
  tier removed — do not revive (verified 36/36).
- Verification is arithmetic, not human. No "unverified" warning boxes.
- Hostile re-review mandatory before "done" — once #7/#8 land, F7 needs a 4th pass; F10 needs its 1st.
