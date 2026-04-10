import sqlite3
import bcrypt

import os

# Create connection
db_path = os.path.join(os.path.dirname(__file__), "pmfby.db")
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Hash passwords properly
password = "password"
password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

# Delete old users
cursor.execute("DELETE FROM users")

# Insert new users with valid hashes
users = [
    ("lakshmi", "lakshmi@pmfby.com", bcrypt.hashpw("admin".encode('utf-8'), bcrypt.gensalt()).decode('utf-8'), "Lakshmi", "farmer", "9876543210", "Kerala"),
    ("admin", "admin@pmfby.com", bcrypt.hashpw("admin".encode('utf-8'), bcrypt.gensalt()).decode('utf-8'), "System Admin", "admin", "9876543213", "Headquarters"),
    ("officer_amit", "amit@pmfby.com", bcrypt.hashpw("password".encode('utf-8'), bcrypt.gensalt()).decode('utf-8'), "Amit Patel", "officer", "9876543212", "City Office"), 
]

for username, email, hash_pw, full_name, role, phone, address in users:
    cursor.execute(
        "INSERT INTO users (username, email, password_hash, full_name, role, phone, address) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (username, email, hash_pw, full_name, role, phone, address)
    )

conn.commit()
conn.close()
print("✅ Users created with valid passwords!")
