#!/usr/bin/env bash

# Medical Scheduler - Development Script
# This script starts the app in development mode

set -e

echo "==================================="
echo "  Medical Scheduler - Dev Mode"
echo "==================================="

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo ""
    echo "[1/4] Installing dependencies..."
    npm install
else
    echo ""
    echo "[1/4] Dependencies already installed"
fi

# Clear Vite cache
echo ""
echo "[2/4] Clearing Vite cache..."
rm -rf node_modules/.vite 2>/dev/null || true

# Build main process
echo ""
echo "[3/4] Building Electron main process..."
npm run build:main

# Start both Vite and Electron
echo ""
echo "[4/4] Starting application..."
echo ""
echo "Starting Vite dev server and Electron..."
echo "Press Ctrl+C to stop"
echo ""

# Run Vite in background, then start Electron when ready
npm run dev:renderer &
VITE_PID=$!

# Wait for Vite to be ready
echo "Waiting for Vite server to start..."
while ! curl -s http://localhost:5173 > /dev/null 2>&1; do
    sleep 1
done

echo "Vite server ready, starting Electron..."
npm run start

# Cleanup on exit
trap "kill $VITE_PID 2>/dev/null" EXIT
