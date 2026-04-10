# 🌾 PMFBY - Pradhan Mantri Fasal Bima Yojana (Kerala Edition)

> **AI-Powered Crop Insurance & Damage Assessment System**

This is a **Production-Ready** full-stack web application designed for the Kerala Government's Agricultural Department. It uses Artificial Intelligence to assess crop damage from images and automates the insurance claim process for farmers.

---

## 🚀 Key Features

*   **🌱 AI Crop Diagnostics**: Automatically detects diseases and damage percentage from photos.
*   **📊 Farmer Dashboard**: Real-time tracking of claims, approvals, and payouts.
*   **🚜 Kerala-Themed UI**: Designed with the aesthetics of Kerala's paddy fields and rural culture.
*   **📱 Mobile-First Design**: Fully responsive for farmers using smartphones in the field.
*   **🔒 Secure Claims**: Role-based access (Farmer, Officer, Admin).

---

## 🛠️ Technology Stack

*   **Frontend**: React + Vite (Fast & Modern)
*   **Backend**: Python FastAPI (High Performance)
*   **Database**: SQLite (SQLAlchemy ORM) - *Production ready for this scale*
*   **AI/ML**: OpenCV, NumPy (Image Processing)
*   **Styling**: Custom CSS3 with Glassmorphism & Animations

---

## 🏃‍♂️ How to Run the Project

### Prerequisites
*   Node.js (v16+)
*   Python (v3.9+)

### 1. Backend Setup
```bash
cd backend
python -m venv venv

# Activate Virtual Environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install Dependencies
pip install -r requirements.txt

# Run Server
python main.py
```
*Server will start at `http://localhost:8000`*

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*App will open at `http://localhost:5173`*

---

## 🛂 Demo Credentials

| Role | Username | Password |
|------|----------|----------|
| **Farmer** | `farmer_raj` | `password` |
| **Officer** | `officer_amit` | `password` |
| **Admin** | `admin_user` | `password` |

---

## 🌟 Project Structure

*   **/backend**: FastAPI server, AI logic (`services/image_analyzer.py`), and Database models.
*   **/frontend**: React application with optimized components and Kerala-themed styling.

---

*Developed for Final Year Project / Hackathon Submission 2026*
