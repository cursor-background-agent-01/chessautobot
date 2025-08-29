@echo off
setlocal enabledelayedexpansion

REM Complete setup script for all chess engines on Windows
REM Installs Stockfish, Lc0, and downloads Maia weights

echo =====================================
echo Chess Automation - Complete Windows Setup
echo =====================================
echo.
echo This script will install:
echo - Stockfish (strongest traditional engine)
echo - Lc0 (neural network engine)
echo - Maia weights (human-like play)
echo.
echo Press any key to continue or Ctrl+C to cancel...
pause >nul

REM Check if running as administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo.
    echo =====================================
    echo WARNING: Not running as Administrator
    echo =====================================
    echo Some operations may fail. For best results,
    echo please run this script as Administrator.
    echo.
    echo Press any key to continue anyway...
    pause >nul
)

REM Get the script directory
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%\.."

echo.
echo =====================================
echo Step 1: Installing Stockfish
echo =====================================
echo.

call "%SCRIPT_DIR%\setup-stockfish.bat"

if %errorLevel% neq 0 (
    echo.
    echo Warning: Stockfish installation may have encountered issues.
    echo Continuing with other installations...
    echo.
)

echo.
echo =====================================
echo Step 2: Installing Lc0 and Maia
echo =====================================
echo.

call "%SCRIPT_DIR%\setup-lc0-maia.bat"

if %errorLevel% neq 0 (
    echo.
    echo Warning: Lc0/Maia installation may have encountered issues.
    echo.
)

echo.
echo =====================================
echo Step 3: Verifying Installation
echo =====================================
echo.

set INSTALL_SUCCESS=1

REM Check Stockfish
if exist "engines\stockfish\stockfish.exe" (
    echo [OK] Stockfish found at engines\stockfish\stockfish.exe
) else (
    echo [FAIL] Stockfish not found
    set INSTALL_SUCCESS=0
)

REM Check Lc0
if exist "engines\lc0\lc0.exe" (
    echo [OK] Lc0 found at engines\lc0\lc0.exe
) else (
    echo [FAIL] Lc0 not found
    set INSTALL_SUCCESS=0
)

REM Check Maia weights
if exist "weights\maia\maia-1100.pb.gz" (
    echo [OK] Maia 1100 weights found
) else (
    echo [FAIL] Maia 1100 weights not found
    set INSTALL_SUCCESS=0
)

if exist "weights\maia\maia-1500.pb.gz" (
    echo [OK] Maia 1500 weights found
) else (
    echo [FAIL] Maia 1500 weights not found
    set INSTALL_SUCCESS=0
)

if exist "weights\maia\maia-1900.pb.gz" (
    echo [OK] Maia 1900 weights found
) else (
    echo [FAIL] Maia 1900 weights not found
    set INSTALL_SUCCESS=0
)

echo.
echo =====================================
echo Setup Summary
echo =====================================
echo.

if !INSTALL_SUCCESS! equ 1 (
    echo All engines and weights have been successfully installed!
    echo.
    echo You can now run the chess automation with:
    echo   npm start
    echo.
    echo Or with specific engines:
    echo   npm start --engine stockfish-wasm
    echo   npm start --engine maia-1500
    echo   npm start --pool all --auto
    echo.
    echo For more information, see:
    echo   - README.md for usage instructions
    echo   - WINDOWS_SETUP.md for detailed Windows guide
) else (
    echo Some components failed to install properly.
    echo.
    echo Please check the error messages above and:
    echo 1. Try running this script as Administrator
    echo 2. Check your internet connection
    echo 3. See WINDOWS_SETUP.md for manual installation steps
    echo.
    echo You can also try installing components individually:
    echo   scripts\setup-stockfish.bat
    echo   scripts\setup-lc0-maia.bat
)

echo.
echo =====================================
echo Additional Notes
echo =====================================
echo.
echo 1. For better Lc0 performance, consider installing:
echo    - CUDA (for NVIDIA GPUs): https://developer.nvidia.com/cuda-downloads
echo    - GPU version of Lc0 from GitHub releases
echo.
echo 2. To use engines globally from command line:
echo    - Add engines\stockfish and engines\lc0 to your PATH
echo.
echo 3. For troubleshooting, see WINDOWS_SETUP.md
echo.

pause
endlocal