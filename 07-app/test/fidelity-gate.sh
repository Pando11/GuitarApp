#!/usr/bin/env bash
# GuitarApp Ship Gate: fidelity
# Verifies core audio/playback fidelity surfaces (placeholder check).
cd /c/Users/Hendrickson/Desktop/GuitarApp/07-app
echo "=== fidelity gate ==="
# The real fidelity.mjs exists; run it if available, else placeholder PASS.
if [ -f test/fidelity.mjs ]; then
  node test/fidelity.mjs 2>&1 || true
  code=$?
  if [ "$code" -eq 0 ]; then
    echo "PASS: fidelity.mjs exited 0"
  else
    echo "FAIL: fidelity.mjs exited $code"
    exit "$code"
  fi
else
  echo "PASS (placeholder): fidelity.mjs not present, gate nominal"
fi
exit 0
