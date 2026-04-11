# backend/models.py
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, CheckConstraint, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from config import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, nullable=False)  # farmer, officer, district_admin, state_admin, super_admin
    phone = Column(String)
    address = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    farmer_profile = relationship("FarmerProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    lands = relationship("LandRecord", back_populates="user", cascade="all, delete-orphan")
    claims = relationship("Claim", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="performed_by", cascade="all, delete-orphan")

class FarmerProfile(Base):
    __tablename__ = "farmer_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    aadhar_number = Column(String, unique=True)
    bank_account = Column(String)
    village = Column(String)
    panchayat = Column(String)
    district = Column(String)
    state = Column(String)
    pin_code = Column(String)
    photo_url = Column(String)
    ownership_proof_url = Column(String)
    photo_data = Column(Text)  # base64 encoded photo
    document_data = Column(Text)  # base64 encoded document
    verification_status = Column(String, default="pending")  # pending, approved, rejected
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="farmer_profile")

class LandRecord(Base):
    __tablename__ = "land_records"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    survey_number = Column(String, nullable=False)
    area = Column(Float, nullable=False)
    unit = Column(String, default="Acre")  # Acre, Cent
    crop_type = Column(String, nullable=False)
    irrigation_type = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="lands")
    claims = relationship("Claim", back_populates="land")

class Crop(Base):
    __tablename__ = "crops"
    
    id = Column(Integer, primary_key=True, index=True)
    crop_name = Column(String, unique=True, nullable=False)
    crop_code = Column(String, unique=True, nullable=False)
    season = Column(String, nullable=False)  # rabi, kharif, summer, perennial
    base_rate = Column(Float, nullable=False)  # Rate per unit (Acre)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    claims = relationship("Claim", back_populates="crop")

class Claim(Base):
    __tablename__ = "claims"
    
    id = Column(Integer, primary_key=True, index=True)
    claim_number = Column(String, unique=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    land_id = Column(Integer, ForeignKey("land_records.id"), nullable=False)
    crop_id = Column(Integer, ForeignKey("crops.id"), nullable=False)
    sum_insured = Column(Float, nullable=False)
    damage_percentage = Column(Float, nullable=False)
    damage_type = Column(String)  # Flood, Drought, Pest, Storm
    claim_amount = Column(Float, nullable=False)
    claim_status = Column(String, default="requested")  
    # requested -> verified (by Officer) -> approved (by District) -> processing -> completed
    
    image_url = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    is_fraud_suspected = Column(Boolean, default=False)
    fraud_details = Column(String)
    
    officer_recommendation = Column(String)  # approve, reject
    officer_notes = Column(Text)
    district_admin_notes = Column(Text)
    rejection_reason = Column(String)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="claims")
    land = relationship("LandRecord", back_populates="claims")
    crop = relationship("Crop", back_populates="claims")

class InsuranceRate(Base):
    __tablename__ = "insurance_rates"

    id = Column(Integer, primary_key=True, index=True)
    crop_type = Column(String, unique=True, nullable=False)
    rate_per_acre = Column(Float, nullable=False)
    rate_per_cent = Column(Float, default=500.0)
    threshold_damage = Column(Float, default=33.0)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String, nullable=False)
    resource_type = Column(String)  # Claim, User, Land
    resource_id = Column(Integer)
    details = Column(Text)
    ip_address = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    performed_by = relationship("User", back_populates="audit_logs")

class DashboardStats(Base):
    __tablename__ = "dashboard_stats"
    
    id = Column(Integer, primary_key=True, index=True)
    total_claims = Column(Integer, default=0)
    approved_claims = Column(Integer, default=0)
    rejected_claims = Column(Integer, default=0)
    total_claim_amount = Column(Float, default=0)
    total_farmers = Column(Integer, default=0)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

