# Windows Setup Guide for Chess Engines

This guide provides detailed instructions for installing and configuring chess engines (Stockfish and Lc0) on Windows systems.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Quick Setup](#quick-setup)
- [Stockfish Installation](#stockfish-installation)
- [Lc0 and Maia Installation](#lc0-and-maia-installation)
- [Manual Installation](#manual-installation)
- [Troubleshooting](#troubleshooting)
- [Performance Optimization](#performance-optimization)

## Prerequisites

### System Requirements
- Windows 10 or later (Windows 7/8 may work but are not officially supported)
- At least 4GB RAM (8GB recommended for Lc0)
- 2GB free disk space
- Internet connection for downloading engines and weights

### Optional but Recommended
- PowerShell 5.0 or later (included in Windows 10+)
- Windows Terminal or PowerShell for better command-line experience
- GPU with CUDA support (for accelerated Lc0 performance)

## Quick Setup

### Automated Installation

We provide batch scripts for easy installation:

1. **Open Command Prompt or PowerShell as Administrator**
   - Press `Win + X` and select "Windows Terminal (Admin)" or "Command Prompt (Admin)"

2. **Navigate to the project directory**
   ```batch
   cd path\to\chess-automation
   ```

3. **Run the setup scripts**
   ```batch
   # Install Stockfish
   scripts\setup-stockfish.bat

   # Install Lc0 and Maia
   scripts\setup-lc0-maia.bat
   ```

## Stockfish Installation

### Method 1: Using the Batch Script (Recommended)

1. Run the provided batch script:
   ```batch
   scripts\setup-stockfish.bat
   ```

2. The script will:
   - Download the latest Stockfish binary
   - Extract it to `engines\stockfish\`
   - Download WASM version for web compatibility
   - Test the installation

### Method 2: Using Chocolatey Package Manager

1. Install Chocolatey (if not already installed):
   ```powershell
   Set-ExecutionPolicy Bypass -Scope Process -Force
   [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
   iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
   ```

2. Install Stockfish:
   ```batch
   choco install stockfish
   ```

### Method 3: Manual Download

1. Visit [Stockfish Downloads](https://stockfishchess.org/download/)
2. Download the Windows binary (choose AVX2 version for modern CPUs)
3. Extract to a folder of your choice
4. Add the folder to your system PATH

### Verifying Stockfish Installation

Test Stockfish from command line:
```batch
# If installed via script
engines\stockfish\stockfish.exe

# If installed via Chocolatey or added to PATH
stockfish

# UCI commands to test
uci
isready
quit
```

## Lc0 and Maia Installation

### Method 1: Using the Batch Script (Recommended)

1. Run the provided batch script:
   ```batch
   scripts\setup-lc0-maia.bat
   ```

2. The script will:
   - Detect your CPU capabilities (AVX2, etc.)
   - Download appropriate Lc0 version
   - Download Maia weights (1100, 1500, 1900 ELO levels)
   - Download a strong Lc0 network
   - Create configuration file
   - Test the installation

### Method 2: Manual Installation

#### Installing Lc0

1. Visit [Lc0 Releases](https://github.com/LeelaChessZero/lc0/releases)

2. Choose the appropriate version:
   - **For CPU only**: `lc0-vX.XX.X-windows-cpu-dnnl.zip` (if AVX2 supported)
   - **For older CPUs**: `lc0-vX.XX.X-windows-cpu-openblas.zip`
   - **For NVIDIA GPU**: `lc0-vX.XX.X-windows-gpu-nvidia-cuda.zip`
   - **For AMD GPU**: `lc0-vX.XX.X-windows-gpu-opencl.zip`

3. Extract to `engines\lc0\`

#### Downloading Neural Network Weights

1. **Maia Weights** (Human-like play):
   ```powershell
   # Create weights directory
   mkdir weights\maia

   # Download Maia weights
   Invoke-WebRequest -Uri "https://github.com/CSSLab/maia-chess/releases/download/v1.0/maia-1100.pb.gz" -OutFile "weights\maia\maia-1100.pb.gz"
   Invoke-WebRequest -Uri "https://github.com/CSSLab/maia-chess/releases/download/v1.0/maia-1500.pb.gz" -OutFile "weights\maia\maia-1500.pb.gz"
   Invoke-WebRequest -Uri "https://github.com/CSSLab/maia-chess/releases/download/v1.0/maia-1900.pb.gz" -OutFile "weights\maia\maia-1900.pb.gz"
   ```

2. **Standard Lc0 Networks** (Strongest play):
   - Visit [Lc0 Networks](https://lczero.org/play/networks/)
   - Download desired network to `weights\lc0\`

### Verifying Lc0 Installation

Test Lc0 with Maia weights:
```batch
# Basic test
engines\lc0\lc0.exe --version

# Test with Maia weights
engines\lc0\lc0.exe benchmark --weights=weights\maia\maia-1100.pb.gz --backend=cpu

# UCI mode
engines\lc0\lc0.exe --weights=weights\maia\maia-1100.pb.gz
uci
isready
quit
```

## Manual Installation

### Directory Structure

Create the following directory structure:
```
chess-automation\
├── engines\
│   ├── stockfish\
│   │   └── stockfish.exe
│   └── lc0\
│       └── lc0.exe
├── weights\
│   ├── maia\
│   │   ├── maia-1100.pb.gz
│   │   ├── maia-1500.pb.gz
│   │   └── maia-1900.pb.gz
│   └── lc0\
│       └── [network].pb.gz
└── scripts\
    ├── setup-stockfish.bat
    └── setup-lc0-maia.bat
```

### Environment Variables

Add engines to PATH (optional but recommended):

1. Open System Properties:
   - Press `Win + Pause` or right-click "This PC" → Properties
   - Click "Advanced system settings"
   - Click "Environment Variables"

2. Add to PATH:
   - Edit the PATH variable
   - Add: `C:\path\to\chess-automation\engines\stockfish`
   - Add: `C:\path\to\chess-automation\engines\lc0`

3. Or use command line (run as Administrator):
   ```batch
   setx /M PATH "%PATH%;C:\path\to\chess-automation\engines\stockfish"
   setx /M PATH "%PATH%;C:\path\to\chess-automation\engines\lc0"
   ```

## Troubleshooting

### Common Issues and Solutions

#### 1. "curl is not recognized as an internal or external command"

**Solution**: The script will automatically fall back to PowerShell for downloads. No action needed.

#### 2. "Access is denied" errors

**Solution**: Run the command prompt or PowerShell as Administrator.

#### 3. Download fails with SSL/TLS errors

**Solution**: Update PowerShell TLS settings:
```powershell
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
```

#### 4. Lc0 crashes or runs very slowly

**Solutions**:
- Use CPU-optimized version (dnnl for AVX2, openblas for older CPUs)
- Reduce batch size in settings
- Consider GPU version if you have a compatible graphics card

#### 5. "VCRUNTIME140.dll was not found"

**Solution**: Install Visual C++ Redistributables:
```batch
# Download and install from Microsoft
https://aka.ms/vs/17/release/vc_redist.x64.exe
```

#### 6. Antivirus blocks the executables

**Solution**: Add exceptions for:
- `engines\stockfish\stockfish.exe`
- `engines\lc0\lc0.exe`

### Checking CPU Capabilities

To check if your CPU supports AVX2:
```batch
wmic cpu get name, Manufacturer, Description, Family, Model, Stepping, MaxClockSpeed
```

Or in PowerShell:
```powershell
Get-WmiObject -Class Win32_Processor | Select-Object Name, Manufacturer, Description
```

## Performance Optimization

### For Stockfish

1. **Increase Hash Size** (for analysis):
   ```
   setoption name Hash value 1024
   ```

2. **Set Threads** (match your CPU cores):
   ```
   setoption name Threads value 8
   ```

### For Lc0

1. **GPU Acceleration** (NVIDIA):
   - Install CUDA from [NVIDIA CUDA](https://developer.nvidia.com/cuda-downloads)
   - Use GPU version of Lc0
   - Set backend to cuda:
     ```
     --backend=cuda
     ```

2. **Optimize CPU Backend**:
   ```batch
   # For modern CPUs with AVX2
   engines\lc0\lc0.exe --backend=cpu --threads=4 --batch-size=1

   # For older CPUs
   engines\lc0\lc0.exe --backend=cpu --threads=2 --batch-size=1
   ```

3. **Network Selection**:
   - Maia networks: Human-like play at specific ELO levels
   - Standard networks: Maximum strength
   - Smaller networks: Faster but weaker

### System Optimization

1. **Close unnecessary programs** to free up RAM and CPU
2. **Disable Windows Defender real-time scanning** for engine folders (add exceptions)
3. **Set High Priority** for chess engines:
   ```batch
   start /high engines\stockfish\stockfish.exe
   ```

## Integration with Chess Applications

### Using with Chess GUIs

These engines work with UCI-compatible chess GUIs:
- Arena Chess GUI
- Chessbase
- Fritz
- Scid vs. PC
- Cute Chess
- BanksiaGUI

### Configuration Example

For use in your Node.js application:
```javascript
const enginePaths = {
  stockfish: 'engines\\stockfish\\stockfish.exe',
  lc0: 'engines\\lc0\\lc0.exe'
};

const weights = {
  maia: {
    beginner: 'weights\\maia\\maia-1100.pb.gz',
    intermediate: 'weights\\maia\\maia-1500.pb.gz',
    advanced: 'weights\\maia\\maia-1900.pb.gz'
  },
  lc0: 'weights\\lc0\\791556.pb.gz'
};
```

## Additional Resources

- [Stockfish Documentation](https://github.com/official-stockfish/Stockfish)
- [Lc0 Documentation](https://github.com/LeelaChessZero/lc0/wiki)
- [Maia Chess Project](https://maiachess.com/)
- [UCI Protocol](http://wbec-ridderkerk.nl/html/UCIProtocol.html)
- [Chess Programming Wiki](https://www.chessprogramming.org/)

## Support

If you encounter issues not covered in this guide:
1. Check the [Issues](https://github.com/yourusername/chess-automation/issues) page
2. Review script output for specific error messages
3. Ensure Windows and drivers are up to date
4. Try manual installation as a fallback