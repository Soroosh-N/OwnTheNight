@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found. Install Node.js, then run this launcher again.
  pause
  exit /b 1
)
node start-game.mjs
if errorlevel 1 pause
