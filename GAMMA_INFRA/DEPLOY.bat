@echo off
REM ═══════════════════════════════════════════════════════════════════════════════
REM GAMMA DEPLOYMENT - DOUBLE-CLICK LAUNCHER (Windows)
REM ═══════════════════════════════════════════════════════════════════════════════

echo ╔═══════════════════════════════════════════════════════════════╗
echo ║         GAMMA DEPLOYMENT SYSTEM - QUICK LAUNCHER             ║
echo ╚═══════════════════════════════════════════════════════════════╝

REM Set paths
set SOURCE_PATH=%~dp0
set TARGET_PATH=C:\GAMMA_DEPLOYED

REM Compile TypeScript
echo [1/3] Compiling deployment script...
call npx ts-node "%SOURCE_PATH%gamma-deploy.ts" 96-01-07-0443 "%SOURCE_PATH%.." "%TARGET_PATH%"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ DEPLOYMENT SUCCESSFUL!
    echo 📍 Location: %TARGET_PATH%
    echo.
    echo Press any key to open deployment folder...
    pause >nul
    explorer "%TARGET_PATH%"
) else (
    echo.
    echo ❌ DEPLOYMENT FAILED!
    echo Check the error messages above.
    pause
)
