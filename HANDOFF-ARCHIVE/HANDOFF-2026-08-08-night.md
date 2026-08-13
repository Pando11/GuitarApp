# HANDOFF — GuitarApp F7/F10 gate loop (session 2026-08-08, deep night)

Active repo: C:\Users\The Yoda Trader\Desktop\GuitarApp (git, master)
Supersedes: HANDOFF-2026-08-08-late.md, HANDOFF-2026-08-08-night.md (kept, untracked)

## State RIGHT NOW (verified live this moment via run-gate.sh)
- F7 gate `bash 06-prototypes/step7-extra/run-gate.sh` → **34/0** (exit 0) [35th check = checker-pin, so 34 behavioral + 1 meta]
- Smoke `smoke-f7-fixes.js` → **9/0**
- F10 gate `node 06-prototypes/step7-extra/verify-voice.js` → **57/0**
- Tree: CLEAN except untracked handoff files. HEAD = `6e38d90`.

## ALL commits this session (oldest → newest)
0. `52da891`  F7 LF re-pin + pristine fs/crypto bindings (7th-pass holes)
1. `2790cdf`  F10 pass-1 fixes (negation/word-boundary/clamp/tuneString-reject); 17→27
2. `31a1c6c`  F7 pass-8 hole: CORE integrity in clean child process pre-require
3. `4c2e86d`  F7 pass-10 hole: refuse NODE_OPTIONS runs + pin checker script
4. `371aa94`  F7 pass-9 hole: scrub child env (CLEAN_ENV whitelist)
5. `85cdbbf`  F10 pass-2 holes (extended negations/clamp-in-range/strict-type/dead-patterns/ignore-first); 27→32
6. `bc1bff9`  F10 pass-5 holes (String() coercion, fail-safe total, engine-output guard); 48→54
7. `2caf7be`  F10 pass-4 holes (refusals, pos sanitize, adapter guard); 48→54
8. `f525de6`  F7 pass-11 fix: wrapper-scrubbed launch (run-gate.sh/.cmd) + F7_GATE_CLEAN sentinel
9. `6e38d90`  F10 pass-6 holes (fractional total, action ?? null, XSS sink in demo); 48→57

## F7 architecture (current truth)
`run-gate.sh` / `run-gate.cmd` are the ONLY sanctioned launchers:
- `unset NODE_OPTIONS` (git-bash) / `set NODE_OPTIONS=` (cmd) BEFORE node starts
- Set `F7_GATE_CLEAN=1` sentinel
- `verify-band.js` refuses to run without it (exit 2)

This is critical: in-process JS CANNOT defend against preloads (pass 11 proved a
preload deletes process.env.NODE_OPTIONS then patches execFileSync to forge the
clean-child report). The scrub must happen outside node, in the wrapper.

verify-band.js section 0: checks NODE_OPTIONS (tripwire) → checks F7_GATE_CLEAN
sentinel → pins check-core-integrity.js vs CHECKER_PIN → spawns it with CLEAN_ENV
(whitelist: PATH, SystemRoot, WINDIR, PATHEXT, TEMP/TMP, USERPROFILE/HOME, COMSPEC)
→ parses JSON report → pins baseline file vs CORE_BASELINE_PIN → asserts 10 modules
→ then requires band-engine + runs behavioral tests (determinism, tempo, octave
oracle, corpus, negative, no-sample, no-network).

RE-PIN recipe (after ANY baseline-pinned file changes, voice-command.js OR
check-core-integrity.js OR verify-band.js):
  1. Hash the LF bytes of the changed file: sha256sum <file>
  2. Update its line in CORE-UNTOUCHED.sha256
  3. Re-hash CORE-UNTOUCHED.sha256 → update CORE_BASELINE_PIN in verify-band.js
  4. Re-run BOTH: bash run-gate.sh && node verify-voice.js
CLEAN_ENV var whitelist + execPath=absolute node are themselves pinned by the
F7_GATE_CLEAN contract (wrapper is committed).

## F10 parser contract (current truth)
- NEGATIONS (27 forms): don t/dont/do not/doesn t/doesnt/no/not/never/stop/enough/
  can t/cant/cannot/won t/wont/nope/nah/quit/skip/never mind/nevermind/cut it out/
  dontcha/don tcha/wait/hold on/hang on/give me a sec/pause/shut up/later
  — checked FIRST; 'pause' blocks a future pause intent (v2 design flag).
- IGNORE words (pizza/weather/news/call/text/email/remind me to/play music/open/
  movie/tv/shopping) — checked 2nd, before intent words.
- hasPhrase = word-boundary regex; 'against'/'nextdoor' don't match.
- whatsNext(pos, total): pos finite+trunc else 0; total coerced via Number();
  if !isFinite(t)||t<1 → refuse to advance (fail-safe); else clamp to [0,total-1].
- slower(rate): rate must be finite number else default 1; clamps at 0.5.
- tuneString(freq): typeof number + 20–5000Hz else NO SIGNAL; engine output
  validated (cents must be finite); try/catch around noteFromFreq.
- execute() wraps adapter dispatch in try/catch (adapter-threw); normalizes
  action ?? null.
- voice-demo.html: parser byte-equivalent (7 probes); act()/log() escape all
  interpolated values via esc() (DOM-XSS fixed).

## OWNER-BLOCKED
- RevenueCat live: RC_IOS_PUBLIC_KEY / RC_ANDROID_PUBLIC_KEY. Gate 43/0 stub.

## KNOWN DESIGN FLAGS (defer to v2 / Heidi)
- 'pause' sits in NEGATIONS: blocks a plausible future pause/intent. Acceptable
  until pause is a real intent; then move it to a separate REFUSAL list.
- action ?? null: now normalized; the contract is {intent, action, reason?}.
- tuneString.name: engine-validated cents only; name passed through verbatim.
  Fine today (plain-text label) but document for any future renderer.
- whatsNext totalScenes<=0 or garbage total: refuses to advance with a message —
  degenerate state, not crash. Document as player-responsibility to supply total.

## Conventions (unchanged)
- Addy Osmani order; free tier STRICT (tuner+metronome+L01, FEATURE_TIER in
  entitlementStore.js). Verification = arithmetic. Hostile re-review before "done".
- Hostile agents: NEVER git stash/checkout/reset the shared worktree. Work in
  temp copies. The pass-7 stash incident is still teaching.
- Lint "Cannot find module C:\c\..." from the patch tool is SPURIOUS.
- After ANY edit to a baseline-pinned file: re-pin line in CORE-UNTOUCHED.sha256
  + CORE_BASELINE_PIN, re-run both gates via run-gate.sh.
- F7 gate MUST be invoked via run-gate.sh (never bare `node verify-band.js` —
  that triggers the F7_GATE_CLEAN refusal).
