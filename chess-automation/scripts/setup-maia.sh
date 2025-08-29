#!/bin/bash

# Setup script for Maia chess weights
# This script downloads the Maia neural network weights for human-like chess play

echo "==================================="
echo "Maia Chess Engine Setup"
echo "==================================="
echo ""

# Create weights directory
echo "Creating weights directory..."
mkdir -p ./weights

# Download Maia weights
echo ""
echo "Downloading Maia weights..."
echo "This may take a few minutes depending on your connection speed."
echo ""

# Maia 1100 (Beginner level - ~1100 ELO)
if [ ! -f "./weights/maia-1100.pb.gz" ]; then
    echo "Downloading Maia 1100..."
    wget -q --show-progress https://github.com/CSSLab/maia-chess/releases/download/v1.0/maia-1100.pb.gz -P ./weights/
else
    echo "Maia 1100 already exists, skipping..."
fi

# Maia 1500 (Intermediate level - ~1500 ELO)
if [ ! -f "./weights/maia-1500.pb.gz" ]; then
    echo "Downloading Maia 1500..."
    wget -q --show-progress https://github.com/CSSLab/maia-chess/releases/download/v1.0/maia-1500.pb.gz -P ./weights/
else
    echo "Maia 1500 already exists, skipping..."
fi

# Maia 1900 (Advanced level - ~1900 ELO)
if [ ! -f "./weights/maia-1900.pb.gz" ]; then
    echo "Downloading Maia 1900..."
    wget -q --show-progress https://github.com/CSSLab/maia-chess/releases/download/v1.0/maia-1900.pb.gz -P ./weights/
else
    echo "Maia 1900 already exists, skipping..."
fi

echo ""
echo "==================================="
echo "Checking Lc0 installation..."
echo "==================================="
echo ""

# Check if lc0 is installed
if command -v lc0 &> /dev/null; then
    echo "✓ Lc0 is installed"
    lc0 --version
else
    echo "✗ Lc0 is not installed"
    echo ""
    echo "Please install Lc0 using one of these methods:"
    echo ""
    echo "Ubuntu/Debian:"
    echo "  sudo apt-get update"
    echo "  sudo apt-get install lc0"
    echo ""
    echo "macOS:"
    echo "  brew install lc0"
    echo ""
    echo "Manual installation:"
    echo "  Download from: https://github.com/LeelaChessZero/lc0/releases"
    echo "  Extract and add to PATH"
fi

echo ""
echo "==================================="
echo "Setup Complete!"
echo "==================================="
echo ""
echo "You can now use Maia engines with:"
echo "  npm start --engine maia-1100    # Beginner"
echo "  npm start --engine maia-1500    # Intermediate"
echo "  npm start --engine maia-1900    # Advanced"
echo ""
echo "Or use the Maia pool for varied play:"
echo "  npm start --pool maia"
echo "  npm start --pool maia-varied"
echo "  npm start --pool human-like"
echo ""