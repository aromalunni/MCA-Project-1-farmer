
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import User
from services.auth import auth_service
import os

# Use the same connection string as config.py or reset_admin_standalone.py
# Based on reset_admin_standalone.py which worked:
DATABASE_URL = "sqlite:///./pmfby.db"

if not os.path.exists("./pmfby.db"):
    print("❌ Error: pmfby.db not found in current directory")
    exit(1)

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def verify_login(username, password):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.username == username).first()
        if not user:
            print(f"❌ User '{username}' not found.")
            return

        print(f"User found: {user.username}, Role: {user.role}")
        print(f"Stored Hash: {user.password_hash}")
        
        is_valid = auth_service.verify_password(password, user.password_hash)
        
        if is_valid:
            print(f"✅ Login successful for {username}/{password}")
        else:
            print(f"❌ Password verification failed for {username}/{password}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    verify_login("admin", "admin")
