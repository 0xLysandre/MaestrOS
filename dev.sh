#!/usr/bin/env bash

# Medical Scheduler - Development Script
# This script starts the app in development mode

set -e

NIXPKGS_URL="https://github.com/NixOS/nixpkgs/archive/nixos-unstable.tar.gz"

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

# Detect NixOS and auto-enter nix-shell if needed
if [ -f /etc/NIXOS ]; then
    if [ -z "$ELECTRON_OVERRIDE_DIST_PATH" ]; then
        echo ""
        echo "NixOS detected - entering nix-shell automatically..."
        exec nix-shell -I "nixpkgs=$NIXPKGS_URL" --run "$0"
    fi
    echo ""
    echo "NixOS detected - using Nix-provided Electron"
fi

# Kill any leftover process on port 5173
echo ""
echo "Checking for leftover processes on port 5173..."
if command -v lsof &>/dev/null; then
    PIDS=$(lsof -ti:5173 2>/dev/null || true)
    if [ -n "$PIDS" ]; then
        echo "Killing PIDs: $PIDS"
        echo "$PIDS" | xargs kill 2>/dev/null || true
        sleep 2
    fi
elif command -v fuser &>/dev/null; then
    fuser -k 5173/tcp 2>/dev/null || true
    sleep 2
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
echo "  (better-sqlite3 must match Electron's Node version)"

# Clean stale build artifacts to prevent version mismatch issues
if [ -d "node_modules/better-sqlite3/build" ]; then
    echo "  Cleaning stale better-sqlite3 build artifacts..."
    rm -rf node_modules/better-sqlite3/build
fi
if [ -d "node_modules/better-sqlite3/prebuilds" ]; then
    echo "  Cleaning old prebuilds..."
    rm -rf node_modules/better-sqlite3/prebuilds
fi

# Detect the actual Electron version we'll be running
ELECTRON_VER=""
if [ -n "$ELECTRON_OVERRIDE_DIST_PATH" ] && command -v electron &>/dev/null; then
    ELECTRON_VER=$(electron --version 2>/dev/null | sed 's/^v//' || true)
    echo "  Nix-provided Electron version: $ELECTRON_VER"
fi
if [ -z "$ELECTRON_VER" ] && [ -f node_modules/electron/package.json ]; then
    ELECTRON_VER=$(node -p "require('./node_modules/electron/package.json').version" 2>/dev/null || true)
    echo "  npm Electron version: $ELECTRON_VER"
fi

set +e
if [ -n "$ELECTRON_VER" ]; then
    # Use the correct binary name 'electron-rebuild' (not the package name '@electron/rebuild')
    echo "  Running: npx electron-rebuild -f -w better-sqlite3 -v $ELECTRON_VER"
    npx electron-rebuild -f -w better-sqlite3 -v "$ELECTRON_VER" 2>&1
    REBUILD_EXIT=$?
else
    echo "  Running: npx electron-rebuild -f -w better-sqlite3"
    npx electron-rebuild -f -w better-sqlite3 2>&1
    REBUILD_EXIT=$?
fi
set -e

if [ $REBUILD_EXIT -eq 0 ]; then
    echo "  electron-rebuild succeeded"
else
    echo "  electron-rebuild failed (exit $REBUILD_EXIT), trying npm rebuild with Electron headers..."
    if [ -n "$ELECTRON_VER" ]; then
        # Rebuild against Electron's Node headers (not system Node)
        set +e
        npm_config_runtime=electron \
        npm_config_target="$ELECTRON_VER" \
        npm_config_disturl=https://electronjs.org/headers \
        npm rebuild better-sqlite3 --build-from-source 2>&1
        NPM_REBUILD_EXIT=$?
        set -e
    else
        set +e
        npm rebuild better-sqlite3 --build-from-source 2>&1
        NPM_REBUILD_EXIT=$?
        set -e
    fi
    if [ $NPM_REBUILD_EXIT -eq 0 ]; then
        echo "  npm rebuild with Electron headers succeeded"
    else
        echo "  WARNING: native module rebuild failed (exit $NPM_REBUILD_EXIT)"
        echo "  The app may not work correctly with SQLite."
    fi
fi

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
