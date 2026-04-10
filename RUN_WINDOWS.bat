@echo off
TITLE Smart Agri System Launcher (Windows)
COLOR 0A

echo ===================================================
echo      Starting Smart Agri System (Windows)
echo ===================================================

:: Check for Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH.
    echo Please install Python from https://www.python.org/downloads/
    echo IMPORTANT: Check "Add Python to PATH" during installation.
    pause
    exit
)

:: Check for Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit
)

echo.
echo [1/3] Setting up Backend...
cd backend
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

echo Activating virtual environment...
if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
) else (
    echo [ERROR] Virtual environment scripts not found at venv\Scripts\activate.bat
    echo Please delete the 'backend\venv' folder and try again.
    pause
    exit
)

echo Installing dependencies (this may take a while)...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo [WARNING] Some dependencies failed to install.
    echo If bcrypt fails, you may need Visual C++ Build Tools.
    pause
)

echo.
echo [2/3] Setting up Frontend...
cd ../frontend
if not exist "node_modules" (
    echo Installing Node modules (this may take a few minutes)...
    call npm install
)

echo.
echo [3/3] Launching Servers...

:: Start Backend in new window from ROOT/backend
:: Accessing from frontend folder requires going up one level
start "Smart Agri Backend" cmd /k "cd ../backend && call venv\Scripts\activate.bat && python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"

:: Start Frontend in new window
start "Smart Agri Frontend" cmd /k "npm run dev"

echo.
echo ===================================================
echo      System is Starting!
echo      Backend API: http://localhost:8000/docs
echo      Frontend UI: http://localhost:5173
echo ===================================================
echo.
echo Servers are running in separate popup windows. Do not close them!
echo.
pause
