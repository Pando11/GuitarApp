#!/usr/bin/env bash
# F7 gate launcher — scrubs NODE_OPTIONS BEFORE node starts (11th-pass fix).
# In-process JS cannot defend against preloads, so the scrub happens here.
# Sets the F7_GATE_CLEAN sentinel the gate requires.
unset NODE_OPTIONS
SCRIPT_DIR_POSIX="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Windows node.exe can't parse MSYS /c/... paths (mangles to C:\c\...) — convert.
SCRIPT_DIR_WIN="$(cygpath -w "$SCRIPT_DIR_POSIX" 2>/dev/null || echo "$SCRIPT_DIR_POSIX")"
F7_GATE_CLEAN=1 node "$SCRIPT_DIR_WIN\\verify-band.js"
