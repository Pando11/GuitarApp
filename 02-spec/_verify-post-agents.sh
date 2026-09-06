#!/usr/bin/env bash
# POST-AGENT VERIFICATION (parent re-runs, does NOT trust child self-reports)
# Companion to SUBAGENT-EXECUTION-PATH-2026-08-30.md section 4.
# Run from repo root: bash 02-spec/_verify-post-agents.sh
set -u
REPO="C:/Users/Hendrickson/Desktop/GuitarApp"
cd "$REPO" || exit 1
echo "=== VERIFY RUN $(date -u +%FT%TZ) ==="

echo; echo "--- [AGENT-1] ogv files produced ---"
for b in B00_walkin B01_meetsage B02_twoshot; do
  f="07-app/assets/worlds/emerald-hollow/clips/${b}.ogv"
  if [ -f "$f" ]; then
    sz=$(stat -c%s "$f" 2>/dev/null || wc -c < "$f")
    echo "OK  $f  ${sz} bytes"
    [ "$sz" -lt 1000 ] && echo "WARN $f suspiciously small"
  else
    echo "MISSING $f"
  fi
done

echo; echo "--- [AGENT-1] godot binary presence (note: godot.exe name absent, real binaries present) ---"
ls -1 C:/Users/Hendrickson/godot/*.exe 2>/dev/null | sed 's/^/found /'
[ -f "C:/Users/Hendrickson/godot/godot.exe" ] && echo "godot.exe present" || echo "godot.exe (exact name) ABSENT — but real binaries above exist"

echo; echo "--- [AGENT-1] manifest still references blocked placeholder? ---"
grep -n "assets/lessons/L01-open-c" 07-app/godot/data/lesson_manifest.json && echo "(above refs should be flagged TODO, not fabricated)" || echo "no unresolved L01-open-c ref (good)"
grep -n "TODO(BLOCKED)" 07-app/godot/data/lesson_manifest.json || true
grep -n "emerald-hollow/clips/B.._twoshot.ogv\|emerald-hollow/clips/B00_walkin.ogv\|emerald-hollow/clips/B01_meetsage.ogv" 07-app/godot/data/lesson_manifest.json || echo "no emerald-hollow ogv refs found in manifest"

echo; echo "--- [AGENT-2] prototype exists ---"
if [ -f "06-prototypes/practice-engine/practice-remix-q5-prototype.html" ]; then
  echo "OK practice-remix-q5-prototype.html $(stat -c%s 06-prototypes/practice-engine/practice-remix-q5-prototype.html) bytes"
else
  echo "MISSING practice-remix-q5-prototype.html"
fi
echo "--- [AGENT-2] lesson counts ---"
echo "authoring 05-content:        $(find 05-content -maxdepth 2 -name '*.json' 2>/dev/null | wc -l)"
echo "shipping 07-app/content/lessons: $(find 07-app/content/lessons -maxdepth 1 -name '*.json' 2>/dev/null | wc -l)"

echo; echo "--- [AGENT-3] sageCoach module + self-test re-run (independent) ---"
if [ -f "07-app/core/sageCoach.js" ]; then
  echo "OK sageCoach.js $(stat -c%s 07-app/core/sageCoach.js) bytes"
else
  echo "MISSING sageCoach.js"
fi
if [ -f "07-app/core/sageCoach.test.mjs" ]; then
  echo "--- re-running self-test ---"
  node 07-app/core/sageCoach.test.mjs; echo "exit=$?"
elif [ -f "07-app/core/sageCoach.test.js" ]; then
  echo "--- re-running self-test ---"
  node 07-app/core/sageCoach.test.js; echo "exit=$?"
else
  echo "MISSING sageCoach.test.*"
fi

echo; echo "--- CHORD GATE re-run (Rule 8: must be 0 err / 0 warn) ---"
node 06-prototypes/step0/run-chord-check.js 2>&1 | tail -n 5

echo; echo "=== VERIFY DONE ==="
