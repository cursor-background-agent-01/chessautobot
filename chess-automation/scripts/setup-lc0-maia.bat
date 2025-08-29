@echo off
setlocal enabledelayedexpansion

REM Setup script for Lc0 (Leela Chess Zero) and Maia weights on Windows
REM Downloads and installs Lc0 engine and Maia neural network weights

echo ===================================
echo Lc0 and Maia Chess Engine Setup (Windows)
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
if not exist "engines\lc0" mkdir engines\lc0
if not exist "weights" mkdir weights
if not exist "weights\maia" mkdir weights\maia
if not exist "weights\lc0" mkdir weights\lc0

echo.
echo ===================================
echo Downloading Lc0 for Windows...
echo ===================================
echo.

REM Detect CPU capabilities
echo Detecting CPU capabilities...
wmic cpu get name | findstr /i "Intel" >nul 2>&1
if %errorLevel% equ 0 (
    set CPU_TYPE=Intel
) else (
    set CPU_TYPE=AMD
)

REM Check for AVX2 support
wmic cpu get name | findstr /i "AVX2" >nul 2>&1
if %errorLevel% equ 0 (
    set HAS_AVX2=1
    echo AVX2 support detected
) else (
    set HAS_AVX2=0
    echo No AVX2 support detected
)

REM Set Lc0 version and URL based on CPU capabilities
set LC0_VERSION=0.30.0

if !HAS_AVX2! equ 1 (
    set LC0_URL=https://github.com/LeelaChessZero/lc0/releases/download/v!LC0_VERSION!/lc0-v!LC0_VERSION!-windows-cpu-dnnl.zip
    set LC0_TYPE=cpu-dnnl
    echo Using optimized DNNL version for AVX2 CPUs
) else (
    set LC0_URL=https://github.com/LeelaChessZero/lc0/releases/download/v!LC0_VERSION!/lc0-v!LC0_VERSION!-windows-cpu-openblas.zip
    set LC0_TYPE=cpu-openblas
    echo Using OpenBLAS version for older CPUs
)

echo.
echo Downloading Lc0 v!LC0_VERSION! (!LC0_TYPE!)...
echo URL: !LC0_URL!
echo.

REM Download Lc0
where curl >nul 2>&1
if %errorLevel% equ 0 (
    echo Using curl to download...
    curl -L -o lc0-windows.zip "!LC0_URL!"
) else (
    echo Using PowerShell to download...
    powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '!LC0_URL!' -OutFile 'lc0-windows.zip'}"
)

if not exist lc0-windows.zip (
    echo Error: Failed to download Lc0
    goto :error
)

echo.
echo Extracting Lc0...

REM Extract using PowerShell
powershell -Command "& {Expand-Archive -Path 'lc0-windows.zip' -DestinationPath 'engines\lc0' -Force}"

if %errorLevel% neq 0 (
    echo Error: Failed to extract Lc0
    goto :error
)

REM Find the extracted executable
if exist "engines\lc0\lc0.exe" (
    echo Found Lc0 executable: engines\lc0\lc0.exe
    
    echo.
    echo Testing Lc0 installation...
    "engines\lc0\lc0.exe" --version
    if !errorLevel! equ 0 (
        echo Lc0 is working correctly!
    ) else (
        echo Warning: Lc0 test failed
    )
) else (
    echo Error: Could not find Lc0 executable
    goto :error
)

REM Clean up zip file
del lc0-windows.zip >nul 2>&1

echo.
echo ===================================
echo Downloading Maia Neural Network Weights...
echo ===================================
echo.
echo Maia provides human-like chess play at different skill levels.
echo.

REM Download Maia weights
set MAIA_BASE_URL=https://github.com/CSSLab/maia-chess/releases/download/v1.0

REM Maia 1100 (Beginner level)
if not exist "weights\maia\maia-1100.pb.gz" (
    echo Downloading Maia 1100 (Beginner ~1100 ELO)...
    where curl >nul 2>&1
    if !errorLevel! equ 0 (
        curl -L -o "weights\maia\maia-1100.pb.gz" "!MAIA_BASE_URL!/maia-1100.pb.gz"
    ) else (
        powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '!MAIA_BASE_URL!/maia-1100.pb.gz' -OutFile 'weights\maia\maia-1100.pb.gz'}"
    )
) else (
    echo Maia 1100 already exists, skipping...
)

REM Maia 1500 (Intermediate level)
if not exist "weights\maia\maia-1500.pb.gz" (
    echo Downloading Maia 1500 (Intermediate ~1500 ELO)...
    where curl >nul 2>&1
    if !errorLevel! equ 0 (
        curl -L -o "weights\maia\maia-1500.pb.gz" "!MAIA_BASE_URL!/maia-1500.pb.gz"
    ) else (
        powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '!MAIA_BASE_URL!/maia-1500.pb.gz' -OutFile 'weights\maia\maia-1500.pb.gz'}"
    )
) else (
    echo Maia 1500 already exists, skipping...
)

REM Maia 1900 (Advanced level)
if not exist "weights\maia\maia-1900.pb.gz" (
    echo Downloading Maia 1900 (Advanced ~1900 ELO)...
    where curl >nul 2>&1
    if !errorLevel! equ 0 (
        curl -L -o "weights\maia\maia-1900.pb.gz" "!MAIA_BASE_URL!/maia-1900.pb.gz"
    ) else (
        powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '!MAIA_BASE_URL!/maia-1900.pb.gz' -OutFile 'weights\maia\maia-1900.pb.gz'}"
    )
) else (
    echo Maia 1900 already exists, skipping...
)

echo.
echo ===================================
echo Downloading Standard Lc0 Network Weights...
echo ===================================
echo.

REM Download a standard strong network for Lc0
set LC0_NETWORK_URL=https://training.lczero.org/get_network?sha=b30e742bcfd905815e0e7dbd4e1bafb41ade748f85d006b8e28758f1a3107ae3
set LC0_NETWORK_FILE=weights\lc0\791556.pb.gz

if not exist "!LC0_NETWORK_FILE!" (
    echo Downloading Lc0 network 791556 (Strong network)...
    where curl >nul 2>&1
    if !errorLevel! equ 0 (
        curl -L -o "!LC0_NETWORK_FILE!" "!LC0_NETWORK_URL!"
    ) else (
        powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '!LC0_NETWORK_URL!' -OutFile '!LC0_NETWORK_FILE!'}"
    )
) else (
    echo Lc0 network already exists, skipping...
)

echo.
echo ===================================
echo Optional: GPU Support for Lc0
echo ===================================
echo.

echo Lc0 can run much faster with GPU support.
echo.
echo For NVIDIA GPUs:
echo   1. Install CUDA from: https://developer.nvidia.com/cuda-downloads
echo   2. Download GPU version of Lc0:
echo      https://github.com/LeelaChessZero/lc0/releases
echo   3. Look for: lc0-vX.XX.X-windows-gpu-nvidia-cuda.zip
echo.
echo For AMD GPUs:
echo   1. Download OpenCL version of Lc0:
echo      https://github.com/LeelaChessZero/lc0/releases
echo   2. Look for: lc0-vX.XX.X-windows-gpu-opencl.zip
echo.

echo.
echo ===================================
echo Testing Lc0 with Maia Weights...
echo ===================================
echo.

if exist "engines\lc0\lc0.exe" (
    if exist "weights\maia\maia-1100.pb.gz" (
        echo Testing Lc0 with Maia 1100 weights...
        "engines\lc0\lc0.exe" benchmark --weights="weights\maia\maia-1100.pb.gz" --backend=cpu --nodes=100 2>nul
        if !errorLevel! equ 0 (
            echo Test successful! Lc0 can use Maia weights.
        ) else (
            echo Warning: Test failed. Please check the installation.
        )
    )
)

echo.
echo ===================================
echo Creating Configuration File...
echo ===================================
echo.

REM Create a configuration file with paths
(
echo # Lc0 and Maia Configuration for Windows
echo # Generated by setup script
echo.
echo [engines]
echo lc0_path = engines\lc0\lc0.exe
echo.
echo [weights]
echo maia_1100 = weights\maia\maia-1100.pb.gz
echo maia_1500 = weights\maia\maia-1500.pb.gz
echo maia_1900 = weights\maia\maia-1900.pb.gz
echo lc0_strong = weights\lc0\791556.pb.gz
echo.
echo [settings]
echo # Backend options: cpu, cuda, opencl, dx12
echo backend = cpu
echo # Number of threads for CPU backend
echo threads = 4
echo # Batch size for GPU backends
echo batch_size = 1
) > lc0-config.ini

echo Configuration saved to lc0-config.ini

echo.
echo ===================================
echo Setup Complete!
echo ===================================
echo.
echo Lc0 and Maia have been successfully installed:
echo.
echo Engines:
echo - Lc0 executable: engines\lc0\lc0.exe
echo.
echo Weights:
echo - Maia 1100 (Beginner): weights\maia\maia-1100.pb.gz
echo - Maia 1500 (Intermediate): weights\maia\maia-1500.pb.gz
echo - Maia 1900 (Advanced): weights\maia\maia-1900.pb.gz
echo - Lc0 Strong Network: weights\lc0\791556.pb.gz
echo.
echo To use Lc0 with Maia weights:
echo   engines\lc0\lc0.exe --weights=weights\maia\maia-1100.pb.gz
echo.
echo For better performance, consider:
echo 1. Installing GPU drivers and CUDA/OpenCL
echo 2. Using GPU version of Lc0
echo 3. Adjusting batch size and threads in lc0-config.ini
echo.

goto :end

:error
echo.
echo ===================================
echo Setup Failed
echo ===================================
echo.
echo Please check the error messages above and try again.
echo Common issues:
echo 1. No internet connection
echo 2. Firewall blocking downloads
echo 3. Insufficient disk space
echo 4. Missing PowerShell or curl
echo.
echo You can also manually download:
echo - Lc0: https://github.com/LeelaChessZero/lc0/releases
echo - Maia weights: https://github.com/CSSLab/maia-chess/releases
echo.

:end
pause
endlocal