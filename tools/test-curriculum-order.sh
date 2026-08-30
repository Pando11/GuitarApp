#!/usr/bin/env bash
# Adversarial proof that tools/verify-curriculum-order.js actually FAILS on real ordering
# defects. Each case mutates a copy in a temp sandbox, runs the gate, and requires exit!=0.
# The real content files are NEVER mutated (a prior bug left cwd drift that corrupted a
# content file — hence the sandbox). Mirror of test-song-progression-gate.sh, but for ORDER.
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# ── Python discovery (Windows/MSYS gotcha) ─────────────────────────────────
# `python3` in MSYS bash often resolves to a Microsoft Store stub that fails on every
# invocation. The real Python lives in the Hermes venv. Probe in order, fall back to
# the last resort.
PYTHON3=""
for p in \
  /c/Users/Hendrickson/AppData/Local/hermes/hermes-agent/venv/Scripts/python \
  python3 \
  python \
  ; do
  if command -v "$p" >/dev/null 2>&1 && "$p" -c "print(1)" >/dev/null 2>&1; then
    PYTHON3="$p"
    break
  fi
done
if [ -z "$PYTHON3" ]; then
  echo "FATAL: no working python found. Tried: python3, python, venv python."
  echo "Set PYTHON3 env var to a working python path and re-run."
  exit 127
fi
# Verify it can actually run Python (not the Store stub)
if ! "$PYTHON3" -c "import json,shutil,os; print('ok')" >/dev/null 2>&1; then
  echo "FATAL: $PYTHON3 is not a working python (Store stub or broken)."
  exit 127
fi
# ── end python discovery ────────────────────────────────────────────────────
rm -rf "$SANDBOX"
trap 'rm -rf "$SANDBOX"' EXIT

# Mirror only what the gate reads: the lessons tree + the gate itself.
mkdir -p "$SANDBOX/tools" "$SANDBOX/07-app/content/lessons"
cp "$ROOT/tools/verify-curriculum-order.js" "$SANDBOX/tools/"
cp "$ROOT/07-app/content/lessons/"*.json "$SANDBOX/07-app/content/lessons/"
PRISTINE="$SANDBOX/pristine-lessons"; mkdir -p "$PRISTINE"
cp "$SANDBOX/07-app/content/lessons/"*.json "$PRISTINE/"

TARGET="$SANDBOX/07-app/content/lessons"
# Native Windows python3 cannot read MSYS-style paths (/c/Users/...). Convert once, forward
# slashes, for use inside the python -c mutation strings.
if command -v cygpath >/dev/null 2>&1; then
  T="$(cygpath -m "$TARGET")"
else
  T="$TARGET"
fi
pass=0; fail=0

reset() { rm -f "$TARGET"/*.json; cp "$PRISTINE/"*.json "$TARGET/"; }

# expect_red <label> <python-mutation>
expect_red() {
  local label="$1"; shift
  reset
  "$PYTHON3" -c "$1" 2>/dev/null || { echo "  SETUP-BROKEN   $label"; fail=$((fail+1)); return; }
  ( cd "$SANDBOX" && node tools/verify-curriculum-order.js >/dev/null 2>&1 )
  local rc=$?
  if [ "$rc" -ne 0 ]; then echo "  RED (correct)  $label"; pass=$((pass+1));
  else echo "  GREEN (BUG!)   $label — gate did not catch this"; fail=$((fail+1)); fi
}

T="$T"
# 1. append an absolute-beginner lesson after the capstone (the AMENDMENT-15 defect class)
expect_red "append absolute-beginner lesson after the capstone" \
  "import json,shutil,os
L='$T'
src=os.path.join(L,'guitar-lesson-02-holding-the-pick.json')
dst=os.path.join(L,'guitar-lesson-26-extra-beginner.json')
shutil.copy(src,dst)
d=json.load(open(dst)); d['lesson']['id']='L26-extra-beginner'; json.dump(d,open(dst,'w'),indent=2)
m=json.load(open(os.path.join(L,'manifest.json')))
m['files'].append('guitar-lesson-26-extra-beginner.json')
json.dump(m,open(os.path.join(L,'manifest.json'),'w'),indent=2)"

# 2. move the capstone off the end (swap last two in the manifest)
expect_red "move the capstone off the end (last two swapped)" \
  "import json
L='$T'
m=json.load(open(L+'/manifest.json'))
m['files'][-1],m['files'][-2]=m['files'][-2],m['files'][-1]
json.dump(m,open(L+'/manifest.json','w'),indent=2)"

# 3. a prerequisite points FORWARD to a later lesson
expect_red "prerequisite points forward to a later lesson" \
  "import json
L='$T'
p=L+'/guitar-lesson-03-first-chord-em.json'
d=json.load(open(p))
d['lesson']['prerequisites'].append('needs L17 before this')
json.dump(d,open(p,'w'),indent=2)"

# 4. filename number desynced from manifest position (keep at pos 5, rename file to 09)
expect_red "filename number desynced from manifest position" \
  "import json,os
L='$T'
old='guitar-lesson-05-strumming-in-time.json'; new='guitar-lesson-09-strumming-in-time.json'
os.rename(L+'/'+old, L+'/'+new)
m=json.load(open(L+'/manifest.json'))
m['files']=[new if f==old else f for f in m['files']]
json.dump(m,open(L+'/manifest.json','w'),indent=2)"

# 5. internal lesson.id desynced from position (filename 05, pos 5, but id claims L09)
expect_red "internal lesson.id desynced from position" \
  "import json
L='$T'
p=L+'/guitar-lesson-05-strumming-in-time.json'
d=json.load(open(p))
d['lesson']['id']='L09-strumming-in-time'
json.dump(d,open(p,'w'),indent=2)"

# 6. A7 placed BEFORE A major (ordering invariant new-chord-a < new-chord-a7 violated)
expect_red "A7 placed before A major" \
  "import json
L='$T'
m=json.load(open(L+'/manifest.json')); f=m['files']
ia=f.index('guitar-lesson-11-new-chord-a.json'); ib=f.index('guitar-lesson-19-new-chord-a7.json')
f[ia],f[ib]=f[ib],f[ia]; m['files']=f
json.dump(m,open(L+'/manifest.json','w'),indent=2)"

# 7. F placed AFTER the capstone (ordering invariant new-chord-f < consolidation-performance)
expect_red "F placed after the capstone" \
  "import json,os
L='$T'
src=L+'/guitar-lesson-17-new-chord-f.json'; dst=L+'/guitar-lesson-26-new-chord-f.json'
os.rename(src,dst)
d=json.load(open(dst)); d['lesson']['id']='L26-new-chord-f'; json.dump(d,open(dst,'w'),indent=2)
m=json.load(open(L+'/manifest.json'))
m['files']=[x for x in m['files'] if x!='guitar-lesson-17-new-chord-f.json']
m['files'].append('guitar-lesson-26-new-chord-f.json')
json.dump(m,open(L+'/manifest.json','w'),indent=2)"

# 8. out-of-range Lnn reference (L99 does not exist)
expect_red "out-of-range Lnn reference (L99)" \
  "import json
L='$T'
p=L+'/guitar-lesson-03-first-chord-em.json'
d=json.load(open(p))
d['lesson']['prerequisites'].append('see lesson L99 for context')
json.dump(d,open(p,'w'),indent=2)"

# Control: pristine content must be GREEN, or the gate is just always-red (proves nothing).
reset
( cd "$SANDBOX" && node tools/verify-curriculum-order.js >/dev/null 2>&1 )
if [ $? -eq 0 ]; then echo "  GREEN (correct) control: pristine order passes"; pass=$((pass+1));
else echo "  RED (BUG!)     control: pristine order FAILS — gate is always-red, proves nothing"; fail=$((fail+1)); fi

# Staleness guard: the sandbox mirrors the gate at startup; if the live gate changed mid-run
# the sandbox tested a stale copy. (Happened for real on 2026-08-14 for the song gate.)
if ! cmp -s "$ROOT/tools/verify-curriculum-order.js" "$SANDBOX/tools/verify-curriculum-order.js"; then
  echo ""
  echo "VOID: tools/verify-curriculum-order.js changed while this suite was running."
  echo "      The sandbox tested a stale copy. Re-run the suite."
  exit 2
fi

echo ""
echo "$pass passed | $fail failed"
[ "$fail" -eq 0 ] && echo "ORDER-GATE-PROVEN-TO-BITE" || echo "ORDER GATE IS NOT TRUSTWORTHY"
exit $([ "$fail" -eq 0 ] && echo 0 || echo 1)
