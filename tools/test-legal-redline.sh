#!/usr/bin/env bash
# Proves the HARDENED legal-redline detector blocks every evasion a hostile reviewer
# found on 2026-08-14 against the original toy regex
# /\b(tab|tablature|riff notation|e\|-|E\|-|\d+h\d+|\d+p\d+|--\d)/ — all 7 shipped GREEN.
# Also proves it does NOT false-positive on legitimate musical prose (time signatures,
# and the honest_claim disclaimers that must be allowed to say "the recorded riff").
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SP="$ROOT/07-app/content/song-progressions"
SANDBOX="$ROOT/.redline-sandbox"
rm -rf "$SANDBOX"; trap 'rm -rf "$SANDBOX"' EXIT
mkdir -p "$SANDBOX/07-app/content/song-progressions" "$SANDBOX/tools" "$SANDBOX/06-prototypes/step0/schema"
cp "$ROOT/tools/verify-song-progressions.js" "$ROOT/tools/derive-chord-prereqs.js" "$SANDBOX/tools/"
cp "$ROOT/06-prototypes/step0/schema/chord-theory-check.js" "$SANDBOX/06-prototypes/step0/schema/"
# The gate re-derives the prereq map from the lesson manifest, so mirror the lessons too.
mkdir -p "$SANDBOX/07-app/content/lessons"
cp "$ROOT/07-app/content/lessons/"*.json "$SANDBOX/07-app/content/lessons/"
P="$SANDBOX/pristine"; mkdir -p "$P"
cp "$SP/shapes.json" "$SP/progressions.json" "$SP/chord-prereqs.json" "$P/"
TARGET="$SANDBOX/07-app/content/song-progressions"
if command -v cygpath >/dev/null 2>&1; then T="$(cygpath -m "$TARGET")"; else T="$TARGET"; fi
pass=0; fail=0
reset(){ cp "$P/shapes.json" "$P/progressions.json" "$P/chord-prereqs.json" "$TARGET/"; }

# inject <label> <field-expr> <value>  -> expects the gate to go RED
inject(){
  local label="$1" expr="$2" val="$3"
  reset
  python3 -c "
import json;p=r'$T/progressions.json';d=json.load(open(p,encoding='utf-8'))
$expr
json.dump(d,open(p,'w',encoding='utf-8'))" 2>/dev/null || { echo "  SETUP-BROKEN   $label"; fail=$((fail+1)); return; }
  ( cd "$SANDBOX" && node tools/verify-song-progressions.js >/dev/null 2>&1 )
  if [ $? -ne 0 ]; then echo "  BLOCKED  $label"; pass=$((pass+1));
  else echo "  LEAKED!  $label — tab/riff content shipped GREEN"; fail=$((fail+1)); fi
}

echo "--- the 7 documented evasions (all shipped GREEN against the old regex) ---"
inject "E1 non-e string label: G|-3-5-7-0-"            "d['songs'][0]['teaches'].append('G|-3-5-7-0-')" ""
inject "E2 Unicode pipe U+2502: e│-3-5-7-"             "d['songs'][0]['teaches'].append('e\u2502-3-5-7-')" ""
inject "E3 uppercase word: 'See TAB for the part'"     "d['songs'][0]['teaches'].append('See TAB for the part')" ""
inject "E4 capitalised: 'Tablature below'"             "d['songs'][0]['teaches'].append('Tablature below')" ""
inject "E5 numeric-only tab: '3 5 7 0 2 3'"            "d['songs'][0]['teaches'].append('3 5 7 0 2 3')" ""
inject "E6 bare word 'riff' outside honest_claim"      "d['songs'][0]['teaches'].append('the riff goes like this')" ""
inject "E7 hidden in an unknown nested field"          "d['songs'][0]['smuggled']={'x':'G|-3-5-7-'}" ""

echo "--- additional notation forms ---"
inject "hammer-on 5h7"                                  "d['songs'][0]['feel']='play 5h7 then rest'" ""
inject "pull-off 7p5"                                   "d['songs'][0]['feel']='play 7p5 quickly'" ""
inject "bend 3b5"                                       "d['songs'][0]['feel']='3b5 on the G string'" ""
inject "slide 5/7"                                      "d['songs'][0]['feel']='slide 5/7 up the neck'" ""
inject "hyphen run into fret: --3"                      "d['songs'][0]['teaches'].append('--3--5')" ""
inject "pipe + fret run"                                "d['songs'][0]['teaches'].append('|--0--2--3')" ""
inject "lyrics reference outside honest_claim"           "d['songs'][0]['mystery']['hint_1']='the lyrics mention a season'" ""
inject "melody reference outside honest_claim"           "d['songs'][0]['teaches'].append('play the melody on top')" ""
inject "solo reference outside honest_claim"             "d['songs'][0]['teaches'].append('then the solo starts')" ""
inject "lick reference outside honest_claim"             "d['songs'][0]['teaches'].append('a quick lick here')" ""

echo "--- must NOT false-positive (legitimate content) ---"
control(){
  local label="$1" expr="$2"
  reset
  if [ -n "$expr" ]; then python3 -c "
import json;p=r'$T/progressions.json';d=json.load(open(p,encoding='utf-8'))
$expr
json.dump(d,open(p,'w',encoding='utf-8'))" 2>/dev/null || { echo "  SETUP-BROKEN   $label"; fail=$((fail+1)); return; }
  fi
  ( cd "$SANDBOX" && node tools/verify-song-progressions.js >/dev/null 2>&1 )
  if [ $? -eq 0 ]; then echo "  ALLOWED  $label"; pass=$((pass+1));
  else echo "  FALSE POSITIVE!  $label — legitimate content was blocked"; fail=$((fail+1)); fi
}
control "pristine content (incl. 4/4 and 6/8 time signatures)" ""
control "honest_claim may say 'the recorded riff stays off-limits'" \
  "d['songs'][0]['honest_claim']='We teach the chords. The recorded riff and its solo stay off-limits.'"
control "time signature 12/8 in feel" "d['songs'][0]['feel']='slow 12/8 shuffle'"
control "time signature 3/4 in feel"  "d['songs'][0]['feel']='gentle 3/4 waltz'"
control "bpm-like numbers in prose"   "d['songs'][0]['feel']='around 84 to 92 bpm, relaxed'"

echo ""
echo "$pass passed | $fail failed"
[ "$fail" -eq 0 ] && echo "REDLINE-PROVEN" || echo "REDLINE NOT TRUSTWORTHY"
exit $([ "$fail" -eq 0 ] && echo 0 || echo 1)
