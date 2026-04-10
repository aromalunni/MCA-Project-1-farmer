#!/bin/bash

# PMFBY Backend Restart Script
# This script stops the current backend and restarts it

echo "🔄 Restarting PMFBY Backend..."
echo ""

# Find and kill existing Python processes running main.py
echo "📍 Stopping existing backend processes..."
pkill -f "python.*main.py" 2>/dev/null || echo "No existing backend process found"

sleep 2

# Navigate to backend directory
cd "$(dirname "$0")/backend" || exit 1

echo "🚀 Starting backend server..."
echo ""

# Start the backend
python main.py

echo ""
echo "✅ Backend restarted successfully!"
