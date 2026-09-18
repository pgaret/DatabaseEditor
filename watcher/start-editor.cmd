@echo off
rem Starts the save watcher (hidden) if it isn't already running, then opens the editor.
cd /d "%~dp0"
curl -s -o nul -m 2 http://127.0.0.1:3000/api/latest-save/info
if errorlevel 1 (
  wscript "%~dp0start-hidden.vbs"
  echo Starting save watcher...
  for /l %%i in (1,1,30) do (
    curl -s -o nul -m 2 http://127.0.0.1:3000/api/latest-save/info && goto open
    timeout /t 1 /nobreak >nul
  )
  echo Watcher did not come up - see watcher.log
  pause
  exit /b 1
)
:open
start "" http://localhost:3000
