#!/usr/bin/env bash
# Adversarial proof that tools/verify-song-progressions.js actually FAILS on real defects.
# Each case mutates a copy in a temp sandbox, runs the gate, and requires exit!=0.
# The real content files are NEVER mutated (earlier version of this test did, and cwd
# drift left a corrupted shapes.json behind — hence the sandbox).
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# ── Python discovery (Windows/MSYS gotcha) ─────────────────────────────────
# Uses system Python 3.x. On Windows/MSYS, prefer python3, fall back to python.
PYTHON3=""
for p in python3 python; do
  if command -v "$p" >/dev/null 2>&1 && "$p" -c "print(1)" >/dev/null 2>&1; then
    PYTHON3="$p"
    break
  fi
done
if [ -z "$PYTHON3" ]; then
  echo "FATAL: no working python found. Please install Python 3.8+ and try again."
  echo "On Windows, use: https://www.python.org/downloads/ or 'winget install Python.Python.3.11'"
  echo "Set PYTHON3 env var to a working python path if needed and re-run."
  exit 127
fi
if ! "$PYTHON3" -c "import json; print('ok')" >/dev/null 2>&1; then
  echo "FATAL: $PYTHON3 is not a working python (Store stub or broken)."
  exit 127
fi
# ── end python discovery ────────────────────────────────────────────────────
SP="$ROOT/07-app/content/song-progressions"
# NOTE (Windows/MSYS pitfall): do NOT use `mktemp -d` here. Bash sees /tmp/... but the
# native Windows python3 that runs the mutations cannot resolve an MSYS /tmp path, so
# every mutation silently failed with FileNotFoundError and the suite reported
# "SETUP-BROKEN" for all 10 cases. Keep the sandbox inside the repo tree so both bash
# and native python3 see the same path.
SANDBOX="$ROOT/.gate-sandbox"
rm -rf "$SANDBOX"
trap 'rm -rf "$SANDBOX"' EXIT

# Mirror only what the gate reads: the content dir + the checker it requires.
mkdir -p "$SANDBOX/07-app/content/song-progressions" "$SANDBOX/tools" \
         "$SANDBOX/06-prototypes/step0/schema"
cp "$ROOT/tools/verify-song-progressions.js" "$ROOT/tools/derive-chord-prereqs.js" "$SANDBOX/tools/"
cp "$ROOT/06-prototypes/step0/schema/chord-theory-check.js" "$SANDBOX/06-prototypes/step0/schema/"
# The gate now RE-DERIVES the prereq map from the lesson manifest, so the sandbox must
# mirror the real lessons too — otherwise the control run fails for the wrong reason.
mkdir -p "$SANDBOX/07-app/content/lessons"
cp "$ROOT/07-app/content/lessons/"*.json "$SANDBOX/07-app/content/lessons/"
PRISTINE="$SANDBOX/pristine"; mkdir -p "$PRISTINE"
cp "$SP/shapes.json" "$SP/progressions.json" "$SP/chord-prereqs.json" "$PRISTINE/"

TARGET="$SANDBOX/07-app/content/song-progressions"
# Native Windows python3 cannot read MSYS-style paths (/c/Users/...). Convert once,
# with forward slashes, for use inside the python -c mutation strings.
if command -v cygpath >/dev/null 2>&1; then
  T="$(cygpath -m "$TARGET")"
else
  T="$TARGET"
fi
pass=0; fail=0

reset() { cp "$PRISTINE/shapes.json" "$PRISTINE/progressions.json" "$PRISTINE/chord-prereqs.json" "$TARGET/"; }

# expect_red <label> <python-mutation>
expect_red() {
  local label="$1"; shift
  reset
  "$PYTHON3" -c "$1" 2>/dev/null || { echo "  SETUP-BROKEN   $label"; fail=$((fail+1)); return; }
  ( cd "$SANDBOX" && node tools/verify-song-progressions.js >/dev/null 2>&1 )
  local rc=$?
  if [ "$rc" -ne 0 ]; then echo "  RED (correct)  $label"; pass=$((pass+1));
  else echo "  GREEN (BUG!)   $label — gate did not catch this"; fail=$((fail+1)); fi
}

T="$T"
expect_red "broken shape: E-major frets labelled 'E minor'" \
  "import json;p='$T/shapes.json';d=json.load(open(p));d['chords']['Em']['frets']=[0,2,2,1,0,0];json.dump(d,open(p,'w'))"
expect_red "shape with unassigned fretted string" \
  "import json;p='$T/shapes.json';d=json.load(open(p));d['chords']['Am']['fingers']=[None,0,0,3,1,0];json.dump(d,open(p,'w'))"
expect_red "progression references a shape that does not exist" \
  "import json;p='$T/progressions.json';d=json.load(open(p));d['songs'][0]['chords'].append('Xq');json.dump(d,open(p,'w'))"
expect_red "loop plays a chord never declared" \
  "import json;p='$T/progressions.json';d=json.load(open(p));d['songs'][0]['loop']='Em - C - G - Bm';json.dump(d,open(p,'w'))"
expect_red "declared chord never used in loop (content drift)" \
  "import json;p='$T/progressions.json';d=json.load(open(p));d['songs'][0]['chords'].append('Dm');json.dump(d,open(p,'w'))"
expect_red "mystery hint leaks the song title early" \
  "import json;p='$T/progressions.json';d=json.load(open(p));d['songs'][0]['mystery']['hint_1']='This is Zombie, four chords';json.dump(d,open(p,'w'))"
expect_red "reveal fails to name the song" \
  "import json;p='$T/progressions.json';d=json.load(open(p));d['songs'][0]['mystery']['reveal']='Nice work!';json.dump(d,open(p,'w'))"
expect_red "LEGAL: tab notation smuggled into a field" \
  "import json;p='$T/progressions.json';d=json.load(open(p));d['songs'][0]['teaches'].append('riff: e|-0-3-5-');json.dump(d,open(p,'w'))"
expect_red "missing honest_claim (legal boundary undocumented)" \
  "import json;p='$T/progressions.json';d=json.load(open(p));del d['songs'][0]['honest_claim'];json.dump(d,open(p,'w'))"
expect_red "absurd bpm" \
  "import json;p='$T/progressions.json';d=json.load(open(p));d['songs'][0]['bpm']=900;json.dump(d,open(p,'w'))"

# ---- unlock rule (AMENDMENT-13): mystery songs are opt-in ADVANCED content ----
expect_red "UNLOCK: song uses a chord never taught in the curriculum" \
  "import json;p='$T/chord-prereqs.json';d=json.load(open(p));d['not_yet_taught']['Feasy']='untaught';del d['first_taught']['Feasy'];json.dump(d,open(p,'w'))"
expect_red "UNLOCK: unlock_after_lesson too EARLY (song offered before its hardest chord)" \
  "import json;p='$T/progressions.json';d=json.load(open(p));d['songs'][9]['unlock_after_lesson']=3;json.dump(d,open(p,'w'))"
expect_red "UNLOCK: unlock_after_lesson too LATE (song needlessly withheld)" \
  "import json;p='$T/progressions.json';d=json.load(open(p));d['songs'][0]['unlock_after_lesson']=25;json.dump(d,open(p,'w'))"
expect_red "UNLOCK: unlock_after_lesson missing entirely" \
  "import json;p='$T/progressions.json';d=json.load(open(p));del d['songs'][0]['unlock_after_lesson'];json.dump(d,open(p,'w'))"
expect_red "UNLOCK: prereq drift — a chord's lesson number moves but unlock does not" \
  "import json;p='$T/chord-prereqs.json';d=json.load(open(p));d['first_taught']['D']=21;json.dump(d,open(p,'w'))"

# ---- TAMPER cases: the audit's CRITICAL #2. Previously the gate TRUSTED
# chord-prereqs.json, so a CONSISTENT lie across both files shipped GREEN and defeated the
# whole fairness guarantee. The gate now re-derives from the lesson manifest in-process.
expect_red "TAMPER: consistent lie — all prereqs=1 AND all unlocks=1 (audit CRITICAL #2)" \
  "import json
a='$T/chord-prereqs.json'; b='$T/progressions.json'
d=json.load(open(a)); d['first_taught']={k:1 for k in d['first_taught']}; json.dump(d,open(a,'w'))
e=json.load(open(b))
for s in e['songs']: s['unlock_after_lesson']=1
json.dump(e,open(b,'w'))"
expect_red "TAMPER: prereq map claims an untaught chord is taught" \
  "import json;p='$T/chord-prereqs.json';d=json.load(open(p));d['first_taught']['Xghost']=2;json.dump(d,open(p,'w'))"
expect_red "TAMPER: stale total_lessons in prereq map" \
  "import json;p='$T/chord-prereqs.json';d=json.load(open(p));d['total_lessons']=23;json.dump(d,open(p,'w'))"

# ---- reveal/hint robustness (audit finding 5) ----
expect_red "reveal names the song only as a coincidental substring" \
  "import json
p='$T/progressions.json'; d=json.load(open(p)); s=d['songs'][0]
s['title']='Go'; s['mystery']['reveal']=\"Let us go play it!\"
json.dump(d,open(p,'w'))"
expect_red "duplicate song id" \
  "import json
p='$T/progressions.json'; d=json.load(open(p))
import copy; d['songs'].append(copy.deepcopy(d['songs'][0]))
json.dump(d,open(p,'w'))"

# Control: pristine content must be GREEN, or the gate is just always-red.
reset
( cd "$SANDBOX" && node tools/verify-song-progressions.js >/dev/null 2>&1 )
if [ $? -eq 0 ]; then echo "  GREEN (correct) control: pristine content passes"; pass=$((pass+1));
else echo "  RED (BUG!)     control: pristine content FAILS — gate is always-red, proves nothing"; fail=$((fail+1)); fi

# Staleness guard: the sandbox mirrors the gate at startup, so a concurrent edit to the
# real gate mid-run would silently test an OLD copy and report phantom GREEN(BUG!) cases.
# (This happened for real on 2026-08-14: 4 unlock cases "failed" against a stale mirror
# while the live gate caught all 4.) Re-copy and diff at the end; if the gate changed
# under us, the run is void — rerun rather than trust the result.
if ! cmp -s "$ROOT/tools/verify-song-progressions.js" "$SANDBOX/tools/verify-song-progressions.js"; then
  echo ""
  echo "VOID: tools/verify-song-progressions.js changed while this suite was running."
  echo "      The sandbox tested a stale copy. Re-run the suite."
  exit 2
fi

echo ""
echo "$pass passed | $fail failed"
[ "$fail" -eq 0 ] && echo "GATE-PROVEN-TO-BITE" || echo "GATE IS NOT TRUSTWORTHY"
exit $([ "$fail" -eq 0 ] && echo 0 || echo 1)
