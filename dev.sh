#!/usr/bin/env bash

# Medical Scheduler - Development Script
# This script starts the app in development mode

set -e

# Cleanup background processes on exit
cleanup() {
    if [ -n "$VITE_PID" ]; then
        kill "$VITE_PID" 2>/dev/null || true
    fi
}
trap cleanup EXIT INT TERM

echo "==================================="
echo "  Medical Scheduler - Dev Mode"
echo "==================================="

# Detect NixOS and check for Electron
if [ -f /etc/NIXOS ]; then
    if [ -z "$ELECTRON_OVERRIDE_DIST_PATH" ]; then
        echo ""
        echo "NixOS detected. You need to run this inside nix-shell:"
        echo ""
        echo "  nix-shell --run ./dev.sh"
        echo ""
        echo "Or enter the shell first:"
        echo ""
        echo "  nix-shell"
        echo "  ./dev.sh"
        echo ""
        exit 1
    fi
    echo ""
    echo "NixOS detected - using Nix-provided Electron"
fi

# Kill any leftover Vite process on port 5173
if lsof -ti:5173 > /dev/null 2>&1; then
    echo ""
    echo "Killing existing process on port 5173..."
    kill $(lsof -ti:5173) 2>/dev/null || true
    sleep 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo ""
    echo "[1/5] Installing dependencies..."
    npm install
else
    echo ""
    echo "[1/5] Dependencies already installed"
fi

# Rebuild native modules for Electron
echo ""
echo "[2/5] Rebuilding native modules for Electron..."
npx electron-rebuild 2>/dev/null || npm rebuild better-sqlite3 --build-from-source 2>/dev/null || true

# Clear Vite cache
echo ""
echo "[3/5] Clearing Vite cache..."
rm -rf node_modules/.vite 2>/dev/null || true

# Build main process
echo ""
echo "[4/5] Building Electron main process..."
npm run build:main

# Start both Vite and Electron
echo ""
echo "[5/5] Starting application..."
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Run Vite in background
npm run dev:renderer &
VITE_PID=$!

# Wait for Vite to be ready
echo "Waiting for Vite server..."
for i in $(seq 1 30); do
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        break
    fi
    sleep 1
done

if ! curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "ERROR: Vite server failed to start after 30s"
    exit 1
fi

echo "Vite ready. Launching Electron..."

# Use Nix electron if available, otherwise use npm
if [ -n "$ELECTRON_OVERRIDE_DIST_PATH" ]; then
    electron .
else
    npx electron .
fi
