#!/usr/bin/env bash
# Render build script for backend
set -o errexit

pip install --upgrade pip
pip install -r requirements.txt

# Create upload directory
mkdir -p static/uploads

# Initialize database tables and seed data
python -c "
from config import init_db
init_db()
"

python seed.py
echo '✅ Build complete'
