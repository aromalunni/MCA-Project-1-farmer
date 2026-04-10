from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime
import shutil
import os
from typing import Optional

from config import get_db
from models import User, FarmerProfile, LandRecord
from services.auth import auth_service

router = APIRouter(prefix="/api/farmer", tags=["farmer"])

@router.post("/register")
async def register_farmer(
    # Personal Details
    full_name: str = Form(...),
    username: str = Form(...),
    email_or_mobile: str = Form(""),
    password: str = Form(...),
    address: str = Form(None),
    village: str = Form(...),
    district: str = Form(...),
    state: str = Form("Kerala"),
    pin_code: str = Form(...),
    
    # Land Details
    survey_number: str = Form(...),
    area: float = Form(...),
    unit: str = Form("Acre"),
    crop_type: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    
    # File Uploads
    land_document: UploadFile = File(None),
    farmer_photo: UploadFile = File(None),
    
    db: Session = Depends(get_db)
):
    """
    Register a new farmer with profile and land details.
    Handles file uploads and creates User, FarmerProfile, and LandRecord entries.
    """
    
    # Check if user already exists
    existing_user = db.query(User).filter(User.username == username).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already registered")

    # Check email/mobile duplicate
    if email_or_mobile and "@" in email_or_mobile:
        existing_email = db.query(User).filter(User.email == email_or_mobile).first()
        if existing_email:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    elif email_or_mobile:
        existing_phone = db.query(User).filter(User.phone == email_or_mobile).first()
        if existing_phone:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Mobile number already registered")

    # 1. Create User - determine email and phone from contact
    is_email = "@" in email_or_mobile
    user_email = email_or_mobile if is_email else f"{username}_{int(datetime.now().timestamp())}@farmer.com"
    user_phone = email_or_mobile if not is_email else ""

    password_hash = auth_service.hash_password(password)
    new_user = User(
        username=username,
        email=user_email,
        password_hash=password_hash,
        full_name=full_name,
        role="farmer",
        phone=user_phone,
        address=f"{address}, {village}, {district}, {state} - {pin_code}",
        is_active=True # Auto-active for now, or set to False if approval needed
    )
    db.add(new_user)
    db.flush() # Get ID
    
    # 2. Handle File Uploads
    photo_url = None
    doc_url = None
    
    upload_dir = "static/uploads"
    os.makedirs(upload_dir, exist_ok=True)
    
    if farmer_photo:
        photo_filename = f"farmer_{new_user.id}_{int(datetime.now().timestamp())}_{farmer_photo.filename}"
        photo_path = os.path.join(upload_dir, photo_filename)
        with open(photo_path, "wb") as buffer:
            shutil.copyfileobj(farmer_photo.file, buffer)
        photo_url = f"/static/uploads/{photo_filename}"
        
    if land_document:
        doc_filename = f"land_{new_user.id}_{int(datetime.now().timestamp())}_{land_document.filename}"
        doc_path = os.path.join(upload_dir, doc_filename)
        with open(doc_path, "wb") as buffer:
            shutil.copyfileobj(land_document.file, buffer)
        doc_url = f"/static/uploads/{doc_filename}"

    # 3. Create Farmer Profile
    new_profile = FarmerProfile(
        user_id=new_user.id,
        village=village,
        district=district,
        state=state,
        pin_code=pin_code,
        photo_url=photo_url,
        ownership_proof_url=doc_url,
        verification_status="pending"
    )
    db.add(new_profile)
    
    # 4. Create Initial Land Record
    new_land = LandRecord(
        user_id=new_user.id,
        survey_number=survey_number,
        area=area,
        unit=unit,
        crop_type=crop_type,
        latitude=latitude,
        longitude=longitude
    )
    db.add(new_land)
    
    try:
        db.commit()
        db.refresh(new_user)
        return {
            "message": "Registration Successfully",
            "user_id": new_user.id,
            "username": new_user.username,
            "status": "pending_approval"
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

from dependencies import get_current_user
from schemas import UserResponse, FarmerProfileResponse
from typing import List
from pydantic import BaseModel

class VerificationUpdate(BaseModel):
    status: str
    reason: Optional[str] = None

@router.get("/all", response_model=List[dict])
def get_all_farmers(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all registered farmers (Admin only)"""
    if current_user.role not in ["super_admin", "state_admin", "district_admin", "officer", "admin"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    farmers = db.query(User).filter(User.role == "farmer").all()
    result = []
    for f in farmers:
        profile = db.query(FarmerProfile).filter(FarmerProfile.user_id == f.id).first()
        land = db.query(LandRecord).filter(LandRecord.user_id == f.id).first()
        
        result.append({
            "id": f.id,
            "full_name": f.full_name,
            "phone": f.phone,
            "place": profile.village if profile else "Unknown",
            "district": profile.district if profile else "Unknown",
            "land_area": land.area if land else 0,
            "verification_status": profile.verification_status if profile else "unknown",
            "photo_url": profile.photo_url if profile else None,
            "document_url": profile.ownership_proof_url if profile else None,
            "created_at": f.created_at
        })
    return result

@router.put("/{user_id}/verify")
def verify_farmer(
    user_id: int,
    update: VerificationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Verify farmer registration (Admin only)"""
    if current_user.role not in ["super_admin", "state_admin", "district_admin", "admin"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    profile = db.query(FarmerProfile).filter(FarmerProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Farmer profile not found")
        
    profile.verification_status = update.status
    db.commit()
    
    return {"message": f"Farmer status updated to {update.status}"}

@router.put("/{user_id}/update")
async def update_farmer(
    user_id: int,
    full_name: str = Form(None),
    phone: str = Form(None),
    address: str = Form(None),
    village: str = Form(None),
    district: str = Form(None),
    land_area: float = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update farmer details (Admin only)"""
    if current_user.role not in ["super_admin", "state_admin", "district_admin", "officer", "admin"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if full_name: user.full_name = full_name
    if phone: user.phone = phone
    if address: user.address = address
    
    profile = db.query(FarmerProfile).filter(FarmerProfile.user_id == user_id).first()
    if profile:
        if village: profile.village = village
        if district: profile.district = district
        
    land = db.query(LandRecord).filter(LandRecord.user_id == user_id).first()
    if land and land_area is not None:
        land.area = land_area
        
    db.commit()
    return {"message": "Farmer details updated successfully"}

@router.delete("/{user_id}")
def delete_farmer(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete farmer (Admin only)"""
    print(f"--- DELETE REQUEST for user_id: {user_id} by {current_user.username} ---")
    if current_user.role not in ["super_admin", "state_admin", "district_admin", "admin"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    try:
        # Enable foreign keys for SQLite
        db.execute(text("PRAGMA foreign_keys = ON"))
        
        # Explicitly delete related records to avoid FK constraint errors
        from models import AuditLog, Claim, LandRecord, FarmerProfile
        db.query(AuditLog).filter(AuditLog.user_id == user_id).delete()
        db.query(Claim).filter(Claim.user_id == user_id).delete()
        db.query(LandRecord).filter(LandRecord.user_id == user_id).delete()
        db.query(FarmerProfile).filter(FarmerProfile.user_id == user_id).delete()
        
        db.delete(user)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete farmer: {str(e)}")
    
    return {"message": "Farmer deleted successfully"}

