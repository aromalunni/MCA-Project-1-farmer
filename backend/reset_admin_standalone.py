import os
import sys

# Ensure this script can import from current directory
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
import bcrypt
from models import User, Base

# Adjust connection string based on your environment or duplicate from config.py
DATABASE_URL = "sqlite:///./pmfby.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_password_hash(password):
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def reset_admin():
    db = SessionLocal()
    try:
        username = "admin"
        password = "admin"
        
        # Check if user exists
        user = db.query(User).filter(User.username == username).first()
        
        password_hash = get_password_hash(password)
        
        if user:
            print(f"User '{username}' found. Updating password...")
            user.password_hash = password_hash
            user.role = "admin" 
            user.is_active = True
        else:
            print(f"User '{username}' not found. Creating new admin user...")
            user = User(
                username=username,
                email="admin@kerala.gov.in",
                full_name="System Administrator",
                role="admin",
                password_hash=password_hash,
                phone="1234567890",
                address="Secretariat, Trivandrum"
            )
            # Ensure tables exist
            Base.metadata.create_all(bind=engine)
            db.add(user)
            
        db.commit()
        print(f"Successfully set password for '{username}' to '{password}'")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    reset_admin()
