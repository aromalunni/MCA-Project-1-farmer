# backend/routes/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta

from config import get_db
from models import User
from schemas import UserCreate, UserLogin, TokenResponse, UserResponse
from services.auth import auth_service
from dependencies import get_current_user as get_current_user_dep

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/register", response_model=UserResponse)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    
    # Check if user already exists
    existing_user = db.query(User).filter(
        (User.username == user_data.username) | (User.email == user_data.email)
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already registered"
        )
    
    # Hash password
    password_hash = auth_service.hash_password(user_data.password)
    
    # Create user
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        password_hash=password_hash,
        full_name=user_data.full_name,
        role=user_data.role,
        phone=user_data.phone,
        address=user_data.address
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user

@router.post("/login")
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """Login and get JWT token"""
    
    # Find user by email or phone based on login_type
    login_id = credentials.username.strip()
    password = credentials.password
    login_type = credentials.login_type

    if login_type == "mobile":
        user = db.query(User).filter(User.phone == login_id).first()
    else:
        user = db.query(User).filter(User.email == login_id).first()

    # Fallback: try username match for admin users
    if not user:
        user = db.query(User).filter(User.username == login_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. Please check your email/mobile and password."
        )
    
    # Verify password
    try:
        password_valid = auth_service.verify_password(password, user.password_hash)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
    
    if not password_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
    
    # Create token
    access_token_expires = timedelta(minutes=30)
    access_token = auth_service.create_access_token(
        data={
            "sub": str(user.id),
            "username": user.username,
            "role": user.role
        },
        expires_delta=access_token_expires
    )
    
    # Build user response manually to avoid serialization issues
    user_data = {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "phone": user.phone,
        "address": user.address,
        "is_active": user.is_active,
        "created_at": user.created_at.isoformat() if user.created_at else None
    }
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_data
    }

@router.get("/me")
def get_current_user(
    current_user: User = Depends(get_current_user_dep),
    db: Session = Depends(get_db)
):
    """Get current user from token with profile data"""
    user_data = UserResponse.from_orm(current_user).dict()
    
    # Add farmer profile if exists
    if current_user.role == "farmer":
        from models import FarmerProfile
        farmer_profile = db.query(FarmerProfile).filter(FarmerProfile.user_id == current_user.id).first()
        if farmer_profile:
            user_data["farmer_profile"] = {
                "village": farmer_profile.village,
                "district": farmer_profile.district,
                "state": farmer_profile.state,
                "pin_code": farmer_profile.pin_code,
                "verification_status": farmer_profile.verification_status,
                "photo_url": farmer_profile.photo_url,
                "ownership_proof_url": farmer_profile.ownership_proof_url
            }
    
    return user_data

@router.post("/refresh-token")
def refresh_token(token: str):
    """Refresh JWT token"""
    
    payload = auth_service.decode_token(token)
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    new_token = auth_service.create_access_token(
        data={
            "sub": payload.get("sub"),
            "username": payload.get("username"),
            "role": payload.get("role")
        }
    )
    
    return {
        "access_token": new_token,
        "token_type": "bearer"
    }

from pydantic import BaseModel

class ProfileUpdate(BaseModel):
    full_name: str = None
    phone: str = None
    address: str = None
    village: str = None
    district: str = None
    state: str = None

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

@router.put("/update-profile")
def update_profile(
    profile_data: ProfileUpdate,
    current_user: User = Depends(get_current_user_dep),
    db: Session = Depends(get_db)
):
    """Update user profile"""
    
    # Update user fields
    if profile_data.full_name:
        current_user.full_name = profile_data.full_name
    if profile_data.phone:
        current_user.phone = profile_data.phone
    if profile_data.address:
        current_user.address = profile_data.address
    
    # Update farmer profile if exists
    if current_user.role == "farmer":
        from models import FarmerProfile
        farmer_profile = db.query(FarmerProfile).filter(FarmerProfile.user_id == current_user.id).first()
        if farmer_profile:
            if profile_data.village:
                farmer_profile.village = profile_data.village
            if profile_data.district:
                farmer_profile.district = profile_data.district
            if profile_data.state:
                farmer_profile.state = profile_data.state
    
    db.commit()
    db.refresh(current_user)
    
    return {"message": "Profile updated successfully", "user": UserResponse.from_orm(current_user)}

@router.post("/change-password")
def change_password(
    password_data: PasswordChange,
    current_user: User = Depends(get_current_user_dep),
    db: Session = Depends(get_db)
):
    """Change user password"""
    
    # Verify current password
    if not auth_service.verify_password(password_data.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    
    # Update password
    current_user.password_hash = auth_service.hash_password(password_data.new_password)
    db.commit()
    
    return {"message": "Password changed successfully"}

class AdminPasswordReset(BaseModel):
    user_id: int
    new_password: str

@router.put("/admin/reset-password")
def admin_reset_password(
    data: AdminPasswordReset,
    current_user: User = Depends(get_current_user_dep),
    db: Session = Depends(get_db)
):
    """Admin reset user password"""
    if current_user.role not in ["admin", "super_admin", "state_admin", "district_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to reset passwords"
        )
    
    user = db.query(User).filter(User.id == data.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
        
    user.password_hash = auth_service.hash_password(data.new_password)
    db.commit()
    
    return {"message": f"Password for {user.username} reset successfully"}
