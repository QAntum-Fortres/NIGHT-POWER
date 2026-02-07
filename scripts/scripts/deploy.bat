@echo off
REM ═══════════════════════════════════════════════════════════════════════════════
REM AUTO-SYNC DEPLOYMENT - Double-Click Launcher (Windows)
REM ═══════════════════════════════════════════════════════════════════════════════
REM
REM Usage: deploy.bat [password]
REM If password is not provided, it will prompt for it
REM

setlocal enabledelayedexpansion

REM Get script directory
cd /d "%~dp0"

echo.
echo ╔═══════════════════════════════════════════════════════════════════════════════╗
echo ║  AUTO-SYNC DEPLOYMENT - QUICK LAUNCHER                                         ║
echo ╚═══════════════════════════════════════════════════════════════════════════════╝
echo.

REM Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Error: Node.js is not installed
    echo    Please install Node.js (https://nodejs.org) and try again.
    pause
    exit /b 1
)

REM Get password
if "%~1"=="" (
    echo 🔐 Enter deployment password:
    set /p PASSWORD=
) else (
    set PASSWORD=%~1
)

REM Get source directory
if "%~2"=="" (
    set SOURCE_DIR=%~dp0..
) else (
    set SOURCE_DIR=%~2
)

echo 🚀 Starting deployment...
echo.

REM Run deployment
node "%~dp0auto-sync-deploy.js" -p "%PASSWORD%" -s "%SOURCE_DIR%"
set EXIT_CODE=%ERRORLEVEL%

echo.
if %EXIT_CODE% EQU 0 (
    echo ✅ Deployment completed successfully!
) else (
    echo ❌ Deployment failed with exit code: %EXIT_CODE%
)

REM Keep window open on double-click
if "%~1"=="" (
    echo.
    pause
)

exit /b %EXIT_CODE%
