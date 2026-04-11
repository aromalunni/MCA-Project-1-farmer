from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime
import shutil
import os
from typing import Optional

from config import get_db
from models import User, FarmerProfile, LandRecord, AuditLog, Claim
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
    
    # Free tier limit: max 7 users. Auto-delete oldest farmer (never admin/lakshmi)
    PROTECTED_USERNAMES = ["admin", "lakshmi"]
    MAX_USERS = 7

    total_users = db.query(User).count()
    if total_users >= MAX_USERS:
        # Find oldest non-protected farmer to delete
        oldest = db.query(User).filter(
            User.username.notin_(PROTECTED_USERNAMES),
            User.role == "farmer"
        ).order_by(User.created_at.asc()).first()

        if oldest:
            # Delete all related data
            db.query(AuditLog).filter(AuditLog.user_id == oldest.id).delete()
            db.query(Claim).filter(Claim.user_id == oldest.id).delete()
            db.query(LandRecord).filter(LandRecord.user_id == oldest.id).delete()
            db.query(FarmerProfile).filter(FarmerProfile.user_id == oldest.id).delete()
            db.delete(oldest)
            db.flush()

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
    
    # 2. Save files as base64 in database (persists on Render free tier)
    import base64
    photo_b64 = None
    doc_b64 = None

    if farmer_photo:
        photo_bytes = await farmer_photo.read()
        photo_b64 = f"data:{farmer_photo.content_type or 'image/jpeg'};base64,{base64.b64encode(photo_bytes).decode()}"
        photo_url = farmer_photo.filename

    if land_document:
        doc_bytes = await land_document.read()
        doc_b64 = f"data:{land_document.content_type or 'application/pdf'};base64,{base64.b64encode(doc_bytes).decode()}"
        doc_url = land_document.filename

    # 3. Create Farmer Profile
    new_profile = FarmerProfile(
        user_id=new_user.id,
        village=village,
        district=district,
        state=state,
        pin_code=pin_code,
        photo_url=photo_url,
        ownership_proof_url=doc_url,
        photo_data=photo_b64,
        document_data=doc_b64,
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
import base64

class VerificationUpdate(BaseModel):
    status: str
    reason: Optional[str] = None

@router.post("/upload-document")
async def upload_farmer_document(
    doc_type: str = Form(...),  # "photo" or "document"
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload/replace farmer photo or land document"""
    profile = db.query(FarmerProfile).filter(FarmerProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Farmer profile not found")

    # Read file and convert to base64
    file_bytes = await file.read()
    b64_data = f"data:{file.content_type or 'image/jpeg'};base64,{base64.b64encode(file_bytes).decode()}"

    if doc_type == "photo":
        profile.photo_data = b64_data
        profile.photo_url = file.filename
    elif doc_type == "document":
        profile.document_data = b64_data
        profile.ownership_proof_url = file.filename
    else:
        raise HTTPException(status_code=400, detail="doc_type must be 'photo' or 'document'")

    # Reset verification to pending when new document uploaded
    profile.verification_status = "pending"
    db.commit()

    return {"message": f"{doc_type.capitalize()} uploaded successfully. Awaiting admin approval."}

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

