# backend/schemas.py
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional, List

# ===================== USER SCHEMAS =====================

class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: str
    role: str = Field(..., pattern="^(farmer|officer|district_admin|state_admin|super_admin|admin)$")
    phone: Optional[str] = None
    address: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    username: str  # Can be email or phone number
    password: str
    login_type: str = "email"  # "email" or "mobile"

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

# ===================== FARMER PROFILE SCHEMAS =====================

class FarmerProfileCreate(BaseModel):
    aadhar_number: str
    bank_account: str
    village: str
    panchayat: str
    district: str
    state: str
    pin_code: str
    photo_url: Optional[str] = None
    ownership_proof_url: Optional[str] = None

class FarmerProfileResponse(FarmerProfileCreate):
    id: int
    user_id: int
    verification_status: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# ===================== LAND RECORD SCHEMAS =====================

class LandRecordCreate(BaseModel):
    survey_number: str
    area: float
    unit: str = "Acre"
    crop_type: str
    irrigation_type: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class LandRecordResponse(LandRecordCreate):
    id: int
    user_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# ===================== CROP SCHEMAS =====================

class CropCreate(BaseModel):
    crop_name: str
    crop_code: str
    season: str = Field(..., pattern="^(rabi|kharif|summer)$")
    base_rate: float

class CropResponse(CropCreate):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# ===================== CLAIM SCHEMAS =====================

class ClaimCreate(BaseModel):
    land_id: int
    crop_id: int
    damage_percentage: float
    damage_type: str
    image_url: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    claim_amount: Optional[float] = None  # Allow farmer to submit estimated amount

class ClaimUpdate(BaseModel):
    claim_status: Optional[str] = None
    claim_amount: Optional[float] = None
    officer_recommendation: Optional[str] = None
    officer_notes: Optional[str] = None
    district_admin_notes: Optional[str] = None
    rejection_reason: Optional[str] = None

class ClaimResponse(BaseModel):
    id: int
    claim_number: str
    user_id: int
    land_id: int
    crop_id: int
    sum_insured: float
    damage_percentage: float
    damage_type: Optional[str] = None
    claim_amount: float
    claim_status: str
    image_url: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    timestamp: Optional[datetime] = None
    is_fraud_suspected: Optional[bool] = False
    fraud_details: Optional[str] = None
    officer_recommendation: Optional[str] = None
    officer_notes: Optional[str] = None
    district_admin_notes: Optional[str] = None
    rejection_reason: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# ===================== INSURANCE RATE SCHEMAS =====================

class InsuranceRateCreate(BaseModel):
    crop_type: str
    rate_per_acre: float
    threshold_damage: float = 33.0

class InsuranceRateResponse(InsuranceRateCreate):
    id: int
    updated_at: datetime
    
    class Config:
        from_attributes = True

# ===================== AUDIT LOG SCHEMAS =====================

class AuditLogResponse(BaseModel):
    id: int
    user_id: int
    action: str
    resource_type: Optional[str]
    resource_id: Optional[int]
    details: Optional[str]
    ip_address: Optional[str]
    timestamp: datetime
    
    class Config:
        from_attributes = True

# ===================== DASHBOARD SCHEMAS =====================

class DashboardStatsResponse(BaseModel):
    total_claims: int
    approved_claims: int
    rejected_claims: int
    pending_claims: int
    total_claim_amount: float
    total_farmers: int
    last_updated: datetime
    
    class Config:
        from_attributes = True

