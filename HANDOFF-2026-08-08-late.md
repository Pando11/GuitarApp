# HANDOFF — GuitarApp F7/F10 gate loop (session 2026-08-08, late evening)

Active repo: C:\Users\The Yoda Trader\Desktop\GuitarApp (git, master)

## State RIGHT NOW (verified by running all gates this moment)
- F7 gate `node 06-prototypes/step7-extra/verify-band.js` → **34/0**
- Smoke `smoke-f7-fixes.js` → **9/0**
- F10 gate `verify-voice.js` → **17/0**
- Tree: 2 files modified, NOT committed:
  - `06-prototypes/step7-extra/verify-band.js`
  - `06-prototypes/step8/CORE-UNTOUCHED.sha256`

## What those uncommitted changes are (COMMIT THEM AS-IS)
1. Pass-7's HOLE-1 fix: baseline re-pin to LF bytes. My pass-6 commit pinned
   band-engine.js's CRLF-smudged worktree hash; pass 7 corrected the line to the LF
   blob hash `6683e772…` and updated CORE_BASELINE_PIN to `08477f1c…`. Gate green on
   fresh re-checkout.
2. My HOLE-2 mitigation (just applied): fs.readFileSync / fs.existsSync /
   crypto.createHash are now SNAPSHOTTED (`_readFileSync` etc.) BEFORE
   `require('./band-engine.js')`, and all tamper-check reads (section 8, lines
   ~376-411) use the pristine bindings. Pass 7 demonstrated an evil engine
   monkey-patching fs at load to serve forged bytes → 34/0 green. That attack class
   is now closed, but NO REGRESSION TEST exists for it yet.

## NEXT ACTIONS (in order)
1. `git add` those 2 files, commit (suggested msg: "F7 gate: LF re-pin + pristine
   fs/crypto bindings vs fs-monkey-patch (7th-pass holes)").
2. OPTIONAL hardening (pass-7 suggestion): add a regression test spawning a child
   process where band-engine.js patches fs at load → gate must go red. Also add
   `4sus`-class (digit-leading) cases to test 4h corpus (171/3800 divergence on
   malformed inputs only — observation, not a hole).
3. Dispatch **F7 pass 8** against the new pristine-bindings gate. If CLEAN → F7 DONE.
   (Passes so far: 4,5,6,7 all found holes; each hole class fixed + tested.)
4. **F10 — RE-APPLY the pass-1 hole fixes** (they were written, gate hit 26/0, but
   pass-7 agent's `git stash` WIPED them; recipe below). Then dispatch F10 pass 2.

## F10 pass-1 holes + fix recipe (re-apply in voice-command.js, verify-voice.js, voice-demo.html)
- HOLE 1 negation: `parseCommand("don't tune my guitar")` → fired TUNE. Fix:
  NEGATIONS = ['don t','dont','do not','doesn t','doesnt','no','not','never','stop',
  'enough'] (normalize strips apostrophes); if any hasPhrase(t,n) → intent ignore.
- HOLE 2 substring: 'against'→again, 'nextdoor'→whats-next. Fix: hasPhrase() =
  word-boundary regex `(?:^|\s)PHRASE(?:\s|$)`; replace indexOf matching. NB:
  "the next string" correctly STILL FIRES (whole-word 'next') — gate asserts this.
- HOLE 3 whatsNext overrun: defaultAdapter.whatsNext(8) → 9 of 8 scenes. Fix:
  whatsNext(pos, total) clamps at total-1, returns "last part" message; execute()
  passes state.totalScenes.
- HOLE 4 tuneString garbage: 0/NaN/-1/'abc' → "FLAT by NaN cents". Fix:
  `if (!isFinite(f)||f<=0) return {note:null,cents:null,label:'NO SIGNAL — play a
  string',invalid:true}` and pass `f` (not freq) to noteFromFreq.
- Gate additions that took it to 26/0: sections 8 (negation ×8 + spy), 9 (substring
  traps ×8 + whole-word still-fires ×5), 10 (end-clamp), 11 (invalid tuner ×8 + valid).
- voice-demo.html: sync inline parser (NEGATIONS + hasPhrase); verified byte-equivalent
  on 20 adversarial probes via eval-diff.
- AFTER re-apply: re-pin voice-command.js line in CORE-UNTOUCHED.sha256 + update
  CORE_BASELINE_PIN in verify-band.js (sed commands in transcript; hash the LF bytes).

## Conventions (unchanged)
- Addy Osmani order; free tier STRICT (tuner+metronome+L01, FEATURE_TIER in
  entitlementStore.js). Verification = arithmetic. Hostile re-review before "done".
- Hostile agents: NEVER let them git stash/checkout shared worktree mid-parent-edits
  — pass 7 wiped uncommitted F10 fixes. Worktree-dirty at dispatch = risk.
- Lint "Cannot find module C:\c\..." errors from the patch tool are SPURIOUS (path
  bug in the linter, files are fine — node runs them).

## Owner-blocked
- RevenueCat live: needs RC_IOS_PUBLIC_KEY / RC_ANDROID_PUBLIC_KEY. Gate 43/0 stub.
