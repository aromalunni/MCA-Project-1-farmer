# Windows Setup Instructions for Smart Agri System

## **Moving Project to Windows? READ THIS FIRST**
If you are copying this project from another computer (like a Mac or Linux machine), you **MUST DELETE** the following folders before running anything on Windows:
1.  `backend/venv` (This contains Mac/Linux specific files and won't work on Windows)
2.  `frontend/node_modules` (This may contain system-specific libraries)

**Delete these folders first**, then proceed with the steps below. The `RUN_WINDOWS.bat` script will recreate them correctly for Windows automatically.

---

## **Step 1: Install Software**
- **Frontend:** Node.js (React + Vite)
- **Database:** SQLite (Built-in, no installation required)

---

## **Step 1: Install Software**
Before running the project, you must install these two tools on your Windows computer:

### 1. **Install Python**
- Download Python from: [https://www.python.org/downloads/](https://www.python.org/downloads/)
- **IMPORTANT:** During installation, check the box that says **"Add Python to PATH"**. This is crucial.

### 2. **Install Node.js**
- Download Node.js (LTS Version) from: [https://nodejs.org/](https://nodejs.org/)
- Install it using the default settings.

---

## **Step 2: Start the System**
Once Python and Node.js are installed:

1.  Navigate to the project folder (`lakshmi project`).
2.  Double-click the file named **`RUN_WINDOWS.bat`**.
3.  A terminal window will open and perform automatic setup:
    - It will check for Python and Node.js.
    - It will create a virtual environment (`venv`) for the backend.
    - It will install all required Python packages (FastAPI, SQLAlchemy, etc.).
    - It will install all required Node modules for the frontend.
4.  After setup, two new command windows will open: one for the Backend and one for the Frontend.
5.  **Do not close these windows!**

---

## **Troubleshooting**

### **"Python is not recognized as an internal or external command"**
- This means you didn't check **"Add Python to PATH"** during installation. Reinstall Python and check that box.

### **"Visual C++ Build Tools Required" Error (bcrypt installation fails)**
- Sometimes `bcrypt` requires C++ tools. You can fix this by downloading and installing **Visual Studio Build Tools**.
- Ensure you select **"Desktop development with C++"** during installation.

### **Port Already in Use**
- If you see an error like "Address already in use", check if another server is running on port 8000 (Backend) or 5173 (Frontend). Close any existing terminal windows running the project.

### **Permission Denied**
- If the script fails due to permissions, right-click `RUN_WINDOWS.bat` and select **"Run as Administrator"**.

---

## **Access the Application**
- **Frontend UI:** [http://localhost:5173](http://localhost:5173)
- **Backend API Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
