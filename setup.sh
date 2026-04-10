#!/bin/bash

# PMFBY Project Setup Script for Mac/Linux

echo ""
echo "===================================="
echo " PMFBY Crop Insurance System Setup"
echo "===================================="
echo ""

# Setup Backend
echo "[1/2] Setting up Backend..."
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
echo "Database initialization..."
python3 -c "from config import init_db; init_db()"
echo "Backend setup complete!"
echo ""
echo "To start backend, run:"
echo "   cd backend"
echo "   source venv/bin/activate"
echo "   python main.py"
echo ""

# Setup Frontend
cd ../frontend
echo "[2/2] Setting up Frontend..."
npm install
echo "Frontend setup complete!"
echo ""
echo "To start frontend, run:"
echo "   cd frontend"
echo "   npm run dev"
echo ""

echo "===================================="
echo "Setup Complete!"
echo "===================================="
echo ""
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:8000"
echo "Docs:     http://localhost:8000/docs"
echo ""
echo "Login with:"
echo "   Username: farmer_raj"
echo "   Password: password"
echo ""
