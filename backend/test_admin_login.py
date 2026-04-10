#!/usr/bin/env python3
"""Test admin login credentials"""

from config import SessionLocal
from models import User
from services.auth import auth_service

db = SessionLocal()

# Get admin user
admin = db.query(User).filter(User.username == "admin").first()

if admin:
    print(f"Admin user found: {admin.username}")
    print(f"Role: {admin.role}")
    print(f"Password hash: {admin.password_hash[:50]}...")
    
    # Test password verification
    test_password = "admin123"
    is_valid = auth_service.verify_password(test_password, admin.password_hash)
    print(f"\nPassword 'admin123' verification: {is_valid}")
    
    # Also test "admin"
    test_password2 = "admin"
    is_valid2 = auth_service.verify_password(test_password2, admin.password_hash)
    print(f"Password 'admin' verification: {is_valid2}")
else:
    print("Admin user not found!")

db.close()
