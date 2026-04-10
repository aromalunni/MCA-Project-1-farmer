import sqlite3
import bcrypt

conn = sqlite3.connect("pmfby.db")
cursor = conn.cursor()

# Delete existing demo users
cursor.execute("DELETE FROM users WHERE username IN ('farmer_raj', 'officer_amit', 'admin', 'lakshmi')")

# Hash password
password_hash = bcrypt.hashpw("admin".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

# Create new users
users = [
    # Admin user
    ("admin", "admin@pmfby.gov.in", password_hash, "Administrator", "admin", None, None),
    # Farmer user (lakshmi)
    ("lakshmi", "lakshmi@farmer.in", password_hash, "Lakshmi", "farmer", "9876543210", "Kerala, India"),
]

for username, email, pwd_hash, full_name, role, phone, address in users:
    cursor.execute(
        """INSERT INTO users (username, email, password_hash, full_name, role, phone, address) 
           VALUES (?, ?, ?, ?, ?, ?, ?)""",
        (username, email, pwd_hash, full_name, role, phone, address)
    )

conn.commit()
conn.close()
print("✅ New users created successfully!")
print("   Admin: username='admin', password='admin'")
print("   Farmer: username='lakshmi', password='admin'")
