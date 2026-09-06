@echo off
setlocal EnableExtensions
cd /d "%~dp0..\.."
set STAMP=2026-09-02w
set OUTROOT=scripts\fate-autoplay\runs
set PASTE=%OUTROOT%\gemini-paste-2026-09-02w-t50
set STATUS=%OUTROOT%\rrr-4x-t50-02w-status.md
set DIRS=%OUTROOT%\02w-4xt50-run-dirs.txt
if not exist "%OUTROOT%" mkdir "%OUTROOT%"
if not exist "%PASTE%" mkdir "%PASTE%"

echo # 02w 4xT50 writer-only (no OpenRouter Gemini critic)> "%STATUS%"
echo [%DATE% %TIME%] start stamp=%STAMP% seed=42 turns=50 writer=default>> "%STATUS%"
echo. > "%DIRS%"

call :CELL 01-LITRPG litrpg summoned-pact cold-system
if errorlevel 1 exit /b 1
call :CELL 02-DND dnd summoned-pact chilled-gm
if errorlevel 1 exit /b 1
call :CELL 03-RPG rpg summoned-pact chilled-gm
if errorlevel 1 exit /b 1
call :CELL 04-PYOA pyoa thornferry-road army-brief
if errorlevel 1 exit /b 1

echo [%DATE% %TIME%] building Gemini paste packs>> "%STATUS%"
set PASTEARGS=
for /f "usebackq delims=" %%D in ("%DIRS%") do (
  if not "%%D"=="" set PASTEARGS=!PASTEARGS! --run-dir "%%D"
)
REM delayed expansion needed for PASTEARGS; enable now
setlocal EnableDelayedExpansion
call npm run fate-gemini-pastes -- !PASTEARGS! --out "%PASTE%"
if errorlevel 1 (
  echo [%DATE% %TIME%] FAIL paste packs>> "%STATUS%"
  exit /b 1
)
endlocal

echo [%DATE% %TIME%] ALL DONE pastes=%PASTE%>> "%STATUS%"
exit /b 0

:CELL
set LABEL=%~1
set ENGINE=%~2
set BIBLE=%~3
set PERS=%~4
set LOG=%OUTROOT%\02w-%LABEL%-t50.out.log
echo [%DATE% %TIME%] [%LABEL%] %ENGINE% %BIBLE% %PERS%>> "%STATUS%"
call npm run fate-autoplay -- --turns 50 --seed 42 --bible %BIBLE% --personality %PERS% --engine %ENGINE% --writer default > "%LOG%" 2>&1
if errorlevel 1 (
  echo [%DATE% %TIME%] FAIL %LABEL% see %LOG%>> "%STATUS%"
  exit /b 1
)
for /f "tokens=1,* delims=" %%A in ('findstr /C:"Done " "%LOG%"') do set DONELINE=%%A
echo %DONELINE%>> "%STATUS%"
for /f "tokens=2 delims==" %%P in ('findstr /C:"\"outDir\"" "%LOG%"') do (
  set RAW=%%P
)
REM parse outDir from JSON summary at end of log
powershell -NoProfile -Command "$t=Get-Content -Raw '%LOG%'; if ($t -match '\"outDir\":\s*\"([^\"]+)\"') { $m=$Matches[1] -replace '\\\\','\'; Add-Content '%DIRS%' $m; Add-Content '%STATUS%' ('  done ' + $m) } else { Write-Error 'no outDir'; exit 2 }"
if errorlevel 1 exit /b 1
exit /b 0
