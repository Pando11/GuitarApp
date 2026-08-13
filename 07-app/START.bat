@echo off
REM START.bat - double-click to launch GuitarApp on the DESKTOP.
REM Opens the WORKING url (http://localhost:8080) which IS a secure context,
REM so the mic works with NO certificate hassle. (Do NOT open the http://192.168.1.x
REM LAN url - that is NOT secure and the mic will refuse.)
REM
REM Uses the FULL path to node so it works even when node isn't on the PATH
REM (e.g. when launched by double-clicking this .bat from Explorer).

SET "NODIR=C:\Program Files\nodejs"
SET "NODE=%NODIR%\node.exe"
IF NOT EXIST "%NODE%" (
  REM fall back to whatever node is on PATH
  SET "NODE=node"
)

cd /d "%~dp0"

REM Start the server in its own window and KEEP it running.
start "GuitarApp Server" "%NODE%" serve.mjs

REM Wait for the server to actually be listening before opening the browser,
REM so we never open a dead url.
set /a tries=0
:wait
set /a tries+=1
curl -s -o nul http://localhost:8080/ 2>nul
if %errorlevel%==0 goto opened
if %tries% GEQ 20 (
  echo Server did not start. Is Node installed? Press any key to exit.
  pause
  exit /b 1
)
timeout /t 1 >nul
goto wait

:opened
start "" http://localhost:8080/?dogfood=1
