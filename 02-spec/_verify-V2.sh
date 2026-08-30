#!/usr/bin/env bash
# POST-V2 VERIFICATION (parent re-runs, does NOT trust child self-reports)
# Companion to SUBAGENT-EXECUTION-PATH-2026-08-30.md. Run after deleg_19575b6a returns.
set -u
REPO="C:/Users/Hendrickson/Desktop/GuitarApp"
cd "$REPO" || exit 1
echo "=== V2 VERIFY RUN $(date -u +%FT%TZ) ==="
fail=0
check() { if [ -f "$1" ]; then echo "OK   $1 ($(stat -c%s "$1") bytes)"; else echo "MISS $1"; fail=1; fi; }

echo; echo "--- V2-S Story Memory ---"
check 07-app/core/storyMemory.js
check 07-app/core/storyMemory.test.mjs
[ -f 07-app/core/storyMemory.test.mjs ] && (node 07-app/core/storyMemory.test.mjs; echo "exit=$?")

echo; echo "--- V2-P PWA shell + backup buttons ---"
check 07-app/app.js
check 07-app/manifest.webmanifest
check 07-app/service-worker.js
check 07-app/core/backupButtons.js
node --check 07-app/app.js && echo "app.js syntax OK" || { echo "app.js SYNTAX FAIL"; fail=1; }
node --check 07-app/service-worker.js && echo "sw.js syntax OK" || { echo "sw.js SYNTAX FAIL"; fail=1; }
node -e "JSON.parse(require('fs').readFileSync('07-app/manifest.webmanifest','utf8'));console.log('manifest JSON valid')" || { echo "manifest INVALID"; fail=1; }

echo; echo "--- V2-F Features ---"
for m in practiceRemix stylisticExplorer songDiscovery celebration; do
  check 07-app/core/$m.js
  check 07-app/core/$m.test.mjs
  [ -f 07-app/core/$m.test.mjs ] && (node 07-app/core/$m.test.mjs | tail -n 3; echo "exit=${PIPESTATUS[0]}")
done

echo; echo "--- V2-J Jam ---"
check 07-app/core/jamSession.js
check 07-app/core/jamSession.test.mjs
[ -f 07-app/core/jamSession.test.mjs ] && (node 07-app/core/jamSession.test.mjs | tail -n 3; echo "exit=${PIPESTATUS[0]}")
grep -n "BLOCKED" 07-app/core/jamSession.js | head -3

echo; echo "--- V2-PB PocketBase + entitlement ---"
check 07-app/core/pocketbaseSync.js
check 07-app/core/pocketbaseSync.test.mjs
check 07-app/core/pocketbaseSchema.json
check 07-app/core/entitlementStore.js
node -e "JSON.parse(require('fs').readFileSync('07-app/core/pocketbaseSchema.json','utf8'));console.log('schema JSON valid')" || { echo "schema INVALID"; fail=1; }
[ -f 07-app/core/pocketbaseSync.test.mjs ] && (node 07-app/core/pocketbaseSync.test.mjs | tail -n 4; echo "exit=${PIPESTATUS[0]}")
grep -n "BLOCKED\|fetch(" 07-app/core/pocketbaseSync.js | head -3

echo; echo "--- CHORD GATE (Rule 8) ---"
node 06-prototypes/step0/run-chord-check.js 2>&1 | tail -n 3

echo; echo "=== V2 VERIFY DONE (fail=$fail) ==="
