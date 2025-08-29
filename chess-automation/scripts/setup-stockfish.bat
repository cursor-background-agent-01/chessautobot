@echo off
setlocal enabledelayedexpansion

REM Setup script for Stockfish chess engine on Windows
REM Installs Stockfish and downloads WASM version

echo ===================================
echo Stockfish Chess Engine Setup (Windows)
echo ===================================
echo.

REM Check if running as administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Warning: Not running as administrator. Some operations may fail.
    echo Consider running this script as administrator.
    echo.
)

REM Create directories
echo Creating required directories...
if not exist "engines" mkdir engines
if not exist "engines\stockfish" mkdir engines\stockfish
if not exist "wasm" mkdir wasm

echo.
echo ===================================
echo Downloading Stockfish for Windows...
echo ===================================
echo.

REM Set Stockfish version
set STOCKFISH_VERSION=16.1
set STOCKFISH_URL=https://github.com/official-stockfish/Stockfish/releases/download/sf_%STOCKFISH_VERSION%/stockfish-windows-x86-64-avx2.zip

echo Downloading Stockfish %STOCKFISH_VERSION%...
echo URL: %STOCKFISH_URL%
echo.

REM Check if curl is available
where curl >nul 2>&1
if %errorLevel% equ 0 (
    echo Using curl to download...
    curl -L -o stockfish-windows.zip "%STOCKFISH_URL%"
) else (
    REM Try PowerShell as fallback
    echo Using PowerShell to download...
    powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '%STOCKFISH_URL%' -OutFile 'stockfish-windows.zip'}"
)

if not exist stockfish-windows.zip (
    echo Error: Failed to download Stockfish
    goto :error
)

echo.
echo Extracting Stockfish...

REM Extract using PowerShell (built-in to Windows)
powershell -Command "& {Expand-Archive -Path 'stockfish-windows.zip' -DestinationPath 'engines\stockfish' -Force}"

if %errorLevel% neq 0 (
    echo Error: Failed to extract Stockfish
    goto :error
)

REM Find the extracted executable
for /r "engines\stockfish" %%i in (stockfish*.exe) do (
    set STOCKFISH_EXE=%%i
    goto :found_exe
)

:found_exe
if defined STOCKFISH_EXE (
    echo Found Stockfish executable: !STOCKFISH_EXE!
    
    REM Copy to a standard location
    copy "!STOCKFISH_EXE!" "engines\stockfish\stockfish.exe" >nul 2>&1
    
    echo.
    echo Testing Stockfish installation...
    "engines\stockfish\stockfish.exe" bench 16 1 13 default depth >nul 2>&1
    if !errorLevel! equ 0 (
        echo Stockfish is working correctly!
    ) else (
        echo Warning: Stockfish test failed
    )
) else (
    echo Error: Could not find Stockfish executable
    goto :error
)

REM Clean up zip file
del stockfish-windows.zip >nul 2>&1

echo.
echo ===================================
echo Downloading Stockfish WASM version...
echo ===================================
echo.

set WASM_FILES[0]=stockfish.js
set WASM_FILES[1]=stockfish.wasm
set WASM_FILES[2]=stockfish.worker.js

set WASM_BASE_URL=https://raw.githubusercontent.com/nmrugg/stockfish.js/master/src

for /l %%i in (0,1,2) do (
    set FILE=!WASM_FILES[%%i]!
    echo Downloading !FILE!...
    
    where curl >nul 2>&1
    if !errorLevel! equ 0 (
        curl -L -o "wasm\!FILE!" "!WASM_BASE_URL!/!FILE!"
    ) else (
        powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '!WASM_BASE_URL!/!FILE!' -OutFile 'wasm\!FILE!'}"
    )
    
    if not exist "wasm\!FILE!" (
        echo Warning: Failed to download !FILE!
    )
)

echo.
echo ===================================
echo Optional: Installing Stockfish globally
echo ===================================
echo.

REM Check if Chocolatey is installed
where choco >nul 2>&1
if %errorLevel% equ 0 (
    echo Chocolatey detected. You can install Stockfish globally with:
    echo   choco install stockfish
    echo.
    echo Would you like to install Stockfish globally using Chocolatey? (y/n)
    set /p INSTALL_CHOCO=
    if /i "!INSTALL_CHOCO!"=="y" (
        choco install stockfish -y
    )
) else (
    echo Chocolatey not found. You can install it from https://chocolatey.org/
    echo Then run: choco install stockfish
)

echo.
echo ===================================
echo Adding Stockfish to PATH (optional)
echo ===================================
echo.

set STOCKFISH_PATH=%CD%\engines\stockfish
echo Stockfish is located at: !STOCKFISH_PATH!
echo.
echo To add Stockfish to your PATH permanently:
echo 1. Open System Properties (Win + Pause)
echo 2. Click "Advanced system settings"
echo 3. Click "Environment Variables"
echo 4. Edit the PATH variable
echo 5. Add: !STOCKFISH_PATH!
echo.
echo Or run this command in an elevated command prompt:
echo   setx /M PATH "%%PATH%%;!STOCKFISH_PATH!"

echo.
echo ===================================
echo Setup Complete!
echo ===================================
echo.
echo Stockfish has been successfully installed:
echo - Native executable: engines\stockfish\stockfish.exe
echo - WASM version: wasm\stockfish.js
echo.
echo You can now use Stockfish in your chess application!
echo.
echo To test Stockfish, run:
echo   engines\stockfish\stockfish.exe
echo Then type "uci" to see UCI commands
echo.

goto :end

:error
echo.
echo ===================================
echo Setup Failed
echo ===================================
echo.
echo Please check the error messages above and try again.
echo You may need to:
echo 1. Run this script as administrator
echo 2. Check your internet connection
echo 3. Install required tools (curl or PowerShell)
echo.

:end
pause
endlocal