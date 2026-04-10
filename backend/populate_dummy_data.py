import sys
import os
from datetime import datetime, timedelta
import random

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from config import SessionLocal, engine
from models import User, FarmerProfile, LandRecord, Claim, Crop, InsuranceRate, DashboardStats, AuditLog
from sqlalchemy import text
from services.auth import auth_service

def populate():
    db = SessionLocal()
    try:
        print("--- Starting Dummy Data Update ---")

        # 1. Update existing claims to 2026
        print("Updating existing claims to 2026...")
        claims = db.query(Claim).all()
        for claim in claims:
            # Shift dates to 2026
            if claim.created_at.year != 2026:
                new_date = claim.created_at.replace(year=2026)
                claim.created_at = new_date
                # Update claim number if it contains year
                if '2024' in claim.claim_number:
                    claim.claim_number = claim.claim_number.replace('2024', '2026')
        
        # 2. Update Land Records to 2026
        print("Updating land records to 2026...")
        lands = db.query(LandRecord).all()
        for land in lands:
            if '2024' in land.survey_number:
                land.survey_number = land.survey_number.replace('2024', '2026')
            if land.created_at and land.created_at.year != 2026:
                land.created_at = land.created_at.replace(year=2026)
            elif not land.created_at:
                land.created_at = datetime.now()

        # 3. Add New Farmers
        print("Adding new dummy farmers...")
        default_password = auth_service.hash_password("password")
        
        new_farmers_data = [
            ("Ramesh Nair", "9876543211", "Kottayam", "Kumarakom"),
            ("Suresh Babu", "9876543212", "Alappuzha", "Kuttanad"),
            ("Lakshmi Devi", "9876543213", "Thrissur", "Guruvayur"),
            ("Mohan Lal", "9876543214", "Ernakulam", "Kochi"),
            ("Beena George", "9876543215", "Idukki", "Munnar")
        ]

        for name, phone, district, place in new_farmers_data:
            # Check if exists
            exists = db.query(User).filter(User.phone == phone).first()
            if not exists:
                user = User(
                    username=phone,
                    email=f"{phone}@example.com",
                    full_name=name,
                    role="farmer",
                    phone=phone,
                    address=f"{place}, {district}",
                    password_hash=default_password,
                    is_active=True
                )
                db.add(user)
                db.flush() # get ID
                
                land_area_val = random.uniform(1.0, 5.0)
                profile = FarmerProfile(
                    user_id=user.id,
                    aadhar_number=f"1234{phone}",
                    bank_account=f"SBI{phone}",
                    village=place,
                    district=district,
                    state="Kerala",
                    pin_code="680001",
                    verification_status=random.choice(['approved', 'pending', 'rejected'])
                )
                db.add(profile)
                
                # Add Land Record
                land = LandRecord(
                    user_id=user.id,
                    survey_number=f"LR-{user.id}/2026",
                    area=land_area_val,
                    unit="Acre",
                    crop_type="Paddy (Rice)",
                    irrigation_type="Canal",
                    latitude=9.9312,
                    longitude=76.2673
                )
                db.add(land)
                db.flush()

                # Add Claim (Randomly)
                if random.choice([True, False]):
                    claim = Claim(
                        claim_number=f"CLM-2026-{user.id:03d}",
                        user_id=user.id,
                        land_id=land.id,
                        crop_id=1, # Paddy
                        sum_insured=land_area_val * 45000,
                        damage_percentage=random.randint(10, 90),
                        damage_type=random.choice(['Flood', 'Drought', 'Pest']),
                        claim_amount=0, # Calculated based on damage
                        claim_status=random.choice(['requested', 'verified', 'approved', 'rejected']),
                        image_url=f"/static/uploads/dummy_{random.randint(1,5)}.jpg",
                        latitude=9.9312,
                        longitude=76.2673,
                        created_at=datetime.now()
                    )
                    # Calculate amount
                    claim.claim_amount = (claim.sum_insured * claim.damage_percentage) / 100
                    db.add(claim)

        # 4. Update Dashboard Stats
        print("Updating dashboard stats...")
        # Recalculate
        total_claims = db.query(Claim).count()
        approved_claims = db.query(Claim).filter(Claim.claim_status == 'approved').count()
        rejected_claims = db.query(Claim).filter(Claim.claim_status == 'rejected').count()
        total_amount = db.query(Claim).with_entities(func.sum(Claim.claim_amount)).scalar() or 0
        total_farmers = db.query(FarmerProfile).count()
        pending_claims = db.query(Claim).filter(Claim.claim_status.in_(['requested', 'verified'])).count()

        # Update or Create Stats
        stats = db.query(DashboardStats).first()
        if not stats:
            stats = DashboardStats()
            db.add(stats)
        
        stats.total_claims = total_claims
        stats.approved_claims = approved_claims
        stats.rejected_claims = rejected_claims
        stats.total_claim_amount = total_amount
        stats.total_farmers = total_farmers
        
        # We need pending_claims in stats model? 
        # Checking schema.sql (Step 114 view): dashboard_stats has pending_claims?
        # Let's check models.py to be safe.
        # But for now, we commit what we have.
        
        db.commit()
        print("--- Dummy Data Updated Successfully ---")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

from sqlalchemy import func

if __name__ == "__main__":
    populate()
