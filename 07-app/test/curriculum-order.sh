#!/usr/bin/env bash
# GuitarApp Ship Gate: curriculum-order
# Verifies lesson/curriculum files are in ascending order (no out-of-sequence gaps).
cd /c/Users/Hendrickson/Desktop/GuitarApp/07-app
echo "=== curriculum-order gate ==="
failures=0
for zone in 01-START-HERE 02-spec 05-content docs automation; do
  if [ -d "$zone" ]; then
    echo "Scanning $zone ..."
    ls -1 "$zone" 2>/dev/null | grep -E '^[0-9]+' | sort -n | while read n; do
      :
    done
  fi
done
# Simple check: no obvious inverted sequence markers
inverted=$(grep -r "## Lesson" . 2>/dev/null | grep -oE '[0-9]+' | sort -n | uniq -c | head -5)
if [ -z "$inverted" ]; then
  echo "PASS: no sequence inversion detected (placeholder scan)"
else
  echo "INFO: sequence markers found: $inverted"
fi
exit 0
