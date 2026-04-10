#!/bin/bash

# Kill any existing processes on ports
pkill -f "uvicorn"
pkill -f "vite"

echo "Starting PMFBY Crop Insurance System..."

# Start Backend
echo "Starting Backend..."
cd backend
source venv/bin/activate
nohup python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload > backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend running (PID: $BACKEND_PID)"

# Start Frontend
echo "Starting Frontend..."
cd ../frontend
npm install # Ensure deps are there
nohup npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend running (PID: $FRONTEND_PID)"

echo "------------------------------------------------"
echo "✅ Project is running!"
echo "➡️ Frontend: http://localhost:3000"
echo "➡️ Backend: http://localhost:8000"
echo "------------------------------------------------"
echo "Logs are being written to backend/backend.log and frontend/frontend.log"
