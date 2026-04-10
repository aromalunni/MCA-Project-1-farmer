#!/usr/bin/env python3
"""
Update admin password to 'admin' and ensure database is properly configured
"""

from config import SessionLocal
from models import User
from services.auth import auth_service

db = SessionLocal()

try:
    # Update admin password to 'admin'
    admin = db.query(User).filter(User.username == "admin").first()
    
    if admin:
        admin.password_hash = auth_service.hash_password("admin")
        db.commit()
        print("✓ Admin password updated to 'admin'")
        
        # Verify it works
        is_valid = auth_service.verify_password("admin", admin.password_hash)
        print(f"✓ Password verification test: {is_valid}")
    else:
        print("❌ Admin user not found!")
        
except Exception as e:
    print(f"❌ Error: {e}")
    db.rollback()
finally:
    db.close()
