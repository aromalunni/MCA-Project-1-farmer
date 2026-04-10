from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import User
from services.auth import AuthService
import sys

def reset_admin():
    db = SessionLocal()
    try:
        username = "admin"
        password = "admin"
        
        # Check if user exists
        user = db.query(User).filter(User.username == username).first()
        
        auth_service = AuthService()
        password_hash = auth_service.hash_password(password)
        
        if user:
            print(f"User '{username}' found. Updating password...")
            user.password_hash = password_hash
            user.role = "state_admin" # Ensure correct role
            user.is_active = True
        else:
            print(f"User '{username}' not found. Creating new admin user...")
            user = User(
                username=username,
                email="admin@kerala.gov.in",
                full_name="System Administrator",
                role="state_admin",
                password_hash=password_hash,
                phone="1234567890",
                address="Secretariat, Trivandrum"
            )
            db.add(user)
            
        db.commit()
        print(f"Successfully set password for '{username}' to '{password}'")
        print("Role set to: state_admin")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    reset_admin()
