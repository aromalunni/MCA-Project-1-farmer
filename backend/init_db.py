#!/usr/bin/env python3
"""
Database initialization script
Recreates the database with the correct schema and adds sample data
"""

from config import Base, engine, SessionLocal
from models import User, FarmerProfile, LandRecord, Crop, Claim, InsuranceRate
from services.auth import auth_service
from datetime import datetime

def init_database():
    """Initialize database with correct schema"""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✓ Database tables created successfully")
    
    db = SessionLocal()
    try:
        # Create admin user if not exists
        admin = db.query(User).filter(User.username == "admin").first()
        if not admin:
            admin = User(
                username="admin",
                email="admin@pmfby.gov.in",
                password_hash=auth_service.hash_password("admin123"),
                full_name="System Administrator",
                role="admin",
                phone="9999999999",
                is_active=True
            )
            db.add(admin)
            print("✓ Admin user created (username: admin, password: admin123)")
        
        # Add sample crops
        crops_data = [
            {"crop_name": "Paddy", "crop_code": "PADDY001", "season": "kharif", "base_rate": 50000},
            {"crop_name": "Coconut", "crop_code": "COCONUT001", "season": "perennial", "base_rate": 75000},
            {"crop_name": "Rubber", "crop_code": "RUBBER001", "season": "perennial", "base_rate": 60000},
            {"crop_name": "Banana", "crop_code": "BANANA001", "season": "summer", "base_rate": 40000},
            {"crop_name": "Pepper", "crop_code": "PEPPER001", "season": "perennial", "base_rate": 80000},
        ]
        
        for crop_data in crops_data:
            existing = db.query(Crop).filter(Crop.crop_code == crop_data["crop_code"]).first()
            if not existing:
                crop = Crop(**crop_data)
                db.add(crop)
        
        print("✓ Sample crops added")
        
        # Add insurance rates
        rates_data = [
            {"crop_type": "Paddy", "rate_per_acre": 50000, "threshold_damage": 33.0},
            {"crop_type": "Coconut", "rate_per_acre": 75000, "threshold_damage": 33.0},
            {"crop_type": "Rubber", "rate_per_acre": 60000, "threshold_damage": 33.0},
            {"crop_type": "Banana", "rate_per_acre": 40000, "threshold_damage": 33.0},
            {"crop_type": "Pepper", "rate_per_acre": 80000, "threshold_damage": 33.0},
        ]
        
        for rate_data in rates_data:
            existing = db.query(InsuranceRate).filter(InsuranceRate.crop_type == rate_data["crop_type"]).first()
            if not existing:
                rate = InsuranceRate(**rate_data)
                db.add(rate)
        
        print("✓ Insurance rates added")
        
        db.commit()
        print("\n✅ Database initialized successfully!")
        print("\nYou can now:")
        print("1. Login as admin (username: admin, password: admin123)")
        print("2. Register new farmers through the registration form")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error initializing database: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    init_database()
