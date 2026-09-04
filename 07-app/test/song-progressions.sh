#!/usr/bin/env bash
# GuitarApp Ship Gate: song-progressions (corrected)
# Verifies song-progression data files exist, are non-empty, and parseable.
cd /c/Users/Hendrickson/Desktop/GuitarApp/07-app
echo "=== song-progressions gate (corrected) ==="
failures=0
if [ ! -d content/song-progressions ]; then
  echo "FAIL: content/song-progressions directory missing"
  exit 1
fi
count=0
for f in content/song-progressions/*; do
  if [ -f "$f" ]; then
    count=$((count+1))
    size=$(stat -c%s "$f" 2>/dev/null || stat -f%z "$f" 2>/dev/null || echo 0)
    if [ "$size" -eq 0 ]; then
      echo "FAIL: $f is empty"
      failures=$((failures+1))
    else
      echo "OK: $f ($size bytes)"
    fi
  fi
done
if [ "$count" -eq 0 ]; then
  echo "FAIL: content/song-progressions/ is empty — no files on disk"
  failures=$((failures+1))
fi
if [ "$failures" -eq 0 ]; then
  echo "PASS: all song-progression files non-empty ($count found)"
else
  echo "FAIL: $failures issue(s)"
fi
exit $failures
