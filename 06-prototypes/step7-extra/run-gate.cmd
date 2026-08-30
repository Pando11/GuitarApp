@echo off
REM F7 gate launcher — scrubs NODE_OPTIONS BEFORE node starts (11th-pass fix).
set NODE_OPTIONS=
set F7_GATE_CLEAN=1
node "%~dp0verify-band.js"
