#!/bin/bash

# Setup script for Stockfish chess engine
# Installs both native Stockfish and downloads WASM version

echo "==================================="
echo "Stockfish Chess Engine Setup"
echo "==================================="
echo ""

# Detect OS
OS="unknown"
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
    OS="windows"
fi

echo "Detected OS: $OS"
echo ""

# Install native Stockfish based on OS
echo "==================================="
echo "Installing Native Stockfish..."
echo "==================================="
echo ""

install_stockfish_linux() {
    echo "Installing Stockfish on Linux..."
    
    # Check if apt-get is available
    if command -v apt-get &> /dev/null; then
        echo "Using apt-get..."
        sudo apt-get update
        sudo apt-get install -y stockfish
    # Check if yum is available
    elif command -v yum &> /dev/null; then
        echo "Using yum..."
        sudo yum install -y stockfish
    # Check if pacman is available (Arch)
    elif command -v pacman &> /dev/null; then
        echo "Using pacman..."
        sudo pacman -S stockfish
    else
        echo "Package manager not found. Please install Stockfish manually."
        echo "Download from: https://stockfishchess.org/download/"
        return 1
    fi
}

install_stockfish_macos() {
    echo "Installing Stockfish on macOS..."
    
    # Check if Homebrew is installed
    if command -v brew &> /dev/null; then
        echo "Using Homebrew..."
        brew install stockfish
    else
        echo "Homebrew not found. Installing Homebrew first..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        
        # Try again with brew
        if command -v brew &> /dev/null; then
            brew install stockfish
        else
            echo "Failed to install Homebrew. Please install manually."
            echo "Visit: https://brew.sh"
            return 1
        fi
    fi
}

install_stockfish_windows() {
    echo "Windows detected. Please download Stockfish manually."
    echo ""
    echo "1. Visit: https://stockfishchess.org/download/"
    echo "2. Download the Windows version"
    echo "3. Extract to a folder (e.g., C:\\stockfish)"
    echo "4. Add the folder to your PATH environment variable"
    echo ""
    echo "Or use WSL (Windows Subsystem for Linux) and run this script again."
    return 1
}

# Install based on OS
case $OS in
    linux)
        install_stockfish_linux
        ;;
    macos)
        install_stockfish_macos
        ;;
    windows)
        install_stockfish_windows
        ;;
    *)
        echo "Unknown OS. Please install Stockfish manually."
        echo "Download from: https://stockfishchess.org/download/"
        ;;
esac

# Check if Stockfish was installed successfully
echo ""
echo "==================================="
echo "Verifying Stockfish Installation..."
echo "==================================="
echo ""

if command -v stockfish &> /dev/null; then
    echo "✓ Stockfish is installed successfully!"
    echo ""
    echo "Version information:"
    stockfish version 2>/dev/null || echo "stockfish" | stockfish | head -n 1
else
    echo "✗ Stockfish is not found in PATH"
    echo ""
    echo "If you installed it manually, make sure it's in your PATH."
fi

# Download additional Stockfish variants for testing
echo ""
echo "==================================="
echo "Setting up Stockfish Variants..."
echo "==================================="
echo ""

# Create engines directory
mkdir -p ./engines

# Download Stockfish.js for browser compatibility testing (optional)
if [ ! -f "./engines/stockfish.js" ]; then
    echo "Downloading Stockfish.js (JavaScript version)..."
    wget -q --show-progress https://github.com/nmrugg/stockfish.js/releases/download/v11/stockfish.js -P ./engines/
    wget -q --show-progress https://github.com/nmrugg/stockfish.js/releases/download/v11/stockfish.wasm -P ./engines/
else
    echo "Stockfish.js already exists, skipping..."
fi

echo ""
echo "==================================="
echo "Setup Complete!"
echo "==================================="
echo ""
echo "Stockfish is ready to use with the following configurations:"
echo ""
echo "1. NATIVE STOCKFISH (Maximum Performance):"
if command -v stockfish &> /dev/null; then
    echo "   ✓ Available as 'stockfish' command"
    echo "   Use with: --engine stockfish-native-max"
else
    echo "   ✗ Not installed"
fi
echo ""
echo "2. STOCKFISH WASM (Built-in, Cross-platform):"
echo "   ✓ Automatically available via npm package"
echo "   Use with: --engine stockfish-wasm-max"
echo ""
echo "3. SKILL LEVEL VARIATIONS:"
echo "   - stockfish-wasm-10  (Skill 10)"
echo "   - stockfish-wasm-15  (Skill 15)"
echo "   - stockfish-wasm-18  (Skill 18)"
echo "   - stockfish-wasm-max (Skill 20)"
echo ""
echo "QUICK START EXAMPLES:"
echo "  npm start --engine stockfish-wasm-max    # Maximum strength"
echo "  npm start --engine stockfish-wasm-15     # Intermediate"
echo "  npm start --pool all                     # Random mix of all engines"
echo ""
echo "To see all available engines:"
echo "  npm run list:engines"
echo ""