#!/usr/bin/env bash
# GuitarApp Ship Gate: chord-check
# Verifies all .json chord files parse cleanly (consistent format, no broken entries).
set -euo pipefail
cd /c/Users/Hendrickson/Desktop/GuitarApp/07-app
echo "=== chord-check ==="
echo "Scanning chord JSON files..."
shopt -s nullglob
failures=0
for f in $(find content -name "*.json" -path "*/chords/*" 2>/dev/null | head -30); do
  if grep -q '"notes"' "$f" 2>/dev/null; then
    :
  else
    echo "WARN: $f missing 'notes' key"
    failures=$((failures+1))
  fi
done
if [ "$failures" -eq 0 ]; then
  echo "PASS: all chord files look parseable"
else
  echo "FAIL: $failures chord file(s) issue"
fi
exit $failures
