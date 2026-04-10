from sqlalchemy.orm import Session
from config import SessionLocal, engine, Base
from models import User
from services.auth import auth_service

# Create tables if not exist
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Schema creation skipped or failed: {e}")

def seed_users():
    db = SessionLocal()
    
    # 1. Create Admin (admin/admin)
    admin_user = db.query(User).filter(User.username == "admin").first()
    if not admin_user:
        print("Creating admin user...")
        admin = User(
            username="admin",
            email="admin@gmail.com",
            full_name="System Administrator",
            role="super_admin",
            password_hash=auth_service.hash_password("admin"),
            phone="9999999999",
            address="Thiruvananthapuram, Kerala",
            is_active=True
        )
        db.add(admin)
    else:
        print("Admin user already exists. Updating details...")
        admin_user.password_hash = auth_service.hash_password("admin")
        admin_user.email = "admin@gmail.com"
        admin_user.is_active = True

    # 2. Create User Lakshmi (lakshmi@gmail.com / 9037720390 / password: admin)
    lakshmi_user = db.query(User).filter(User.username == "lakshmi").first()
    if not lakshmi_user:
        print("Creating user lakshmi...")
        lakshmi = User(
            username="lakshmi",
            email="lakshmi@gmail.com",
            full_name="Lakshmi",
            role="farmer",
            password_hash=auth_service.hash_password("admin"),
            phone="9037720390",
            address="Kuttanad, Alappuzha",
            is_active=True
        )
        db.add(lakshmi)
    else:
        print("User lakshmi already exists. Updating details...")
        lakshmi_user.password_hash = auth_service.hash_password("admin")
        lakshmi_user.email = "lakshmi@gmail.com"
        lakshmi_user.phone = "9037720390"
        lakshmi_user.full_name = "Lakshmi"
        lakshmi_user.is_active = True
    
    db.commit()
    db.close()
    print("Seeding completed successfully!")

if __name__ == "__main__":
    seed_users()
