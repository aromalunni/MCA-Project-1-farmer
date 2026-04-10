from sqlalchemy.orm import Session
from config import SessionLocal, engine, Base
from models import User, InsuranceRate, Crop
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
    
    # 3. Create Insurance Rate (₹50,000/Acre, ₹500/Cent as per PDF)
    existing_rate = db.query(InsuranceRate).filter(InsuranceRate.crop_type == "Default").first()
    if not existing_rate:
        print("Creating default insurance rate...")
        rate = InsuranceRate(
            crop_type="Default",
            rate_per_acre=50000.0,
            rate_per_cent=500.0,
            threshold_damage=33.0
        )
        db.add(rate)
    else:
        print("Updating default insurance rate to ₹50,000/Acre...")
        existing_rate.rate_per_acre = 50000.0
        existing_rate.rate_per_cent = 500.0

    # Also update Paddy rate if exists
    paddy_rate = db.query(InsuranceRate).filter(InsuranceRate.crop_type == "Paddy (Rice)").first()
    if paddy_rate:
        paddy_rate.rate_per_acre = 50000.0
        paddy_rate.rate_per_cent = 500.0

    # 4. Create default Crop entry
    existing_crop = db.query(Crop).first()
    if not existing_crop:
        print("Creating default crop...")
        crop = Crop(
            crop_name="Paddy",
            crop_code="PADDY",
            season="kharif",
            base_rate=50000.0
        )
        db.add(crop)

    db.commit()
    db.close()
    print("Seeding completed successfully!")

if __name__ == "__main__":
    seed_users()
