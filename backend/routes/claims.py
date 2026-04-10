# backend/routes/claims.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from config import get_db
from models import Claim, LandRecord, Crop, User, InsuranceRate, AuditLog
from schemas import ClaimCreate, ClaimUpdate, ClaimResponse
from services.claim_calculator import claim_calculator
from dependencies import get_current_user

router = APIRouter(prefix="/api/claims", tags=["claims"])

@router.post("/submit", response_model=ClaimResponse)
def submit_claim(
    claim_data: ClaimCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit new insurance claim (Farmer)"""
    
    # 1. Verify land ownership
    land = db.query(LandRecord).filter(
        (LandRecord.id == claim_data.land_id) & (LandRecord.user_id == current_user.id)
    ).first()
    
    if not land:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Land record not found or not owned by you"
        )
    
    # 2. Get insurance rate for the crop
    rate = db.query(InsuranceRate).filter(InsuranceRate.crop_type == land.crop_type).first()
    if not rate:
        # Fallback to crop base rate if specific rate not found
        crop = db.query(Crop).filter(Crop.id == claim_data.crop_id).first()
        rate_per_acre = crop.base_rate if crop else 50000.0
    else:
        rate_per_acre = rate.rate_per_acre
        
    # 3. Calculate sum insured and claim amount
    sum_insured = claim_calculator.calculate_sum_insured(land.area, rate_per_acre)
    calculated_amount = claim_calculator.calculate_claim_amount(sum_insured, claim_data.damage_percentage)
    
    # Use user provided amount or calculated amount
    claim_amount = claim_data.claim_amount if claim_data.claim_amount is not None else calculated_amount
    
    # 4. Geo-verification (Fraud Detection)
    is_valid_loc, loc_msg = claim_calculator.verify_location(
        land.latitude, land.longitude, claim_data.latitude, claim_data.longitude
    )
    
    # 5. Determine initial eligibility
    is_eligible, eligibility_msg = claim_calculator.determine_eligibility(claim_data.damage_percentage)
    
    # 6. Create claim
    claim = Claim(
        claim_number=claim_calculator.generate_claim_number(),
        user_id=current_user.id,
        land_id=claim_data.land_id,
        crop_id=claim_data.crop_id,
        sum_insured=sum_insured,
        damage_percentage=claim_data.damage_percentage,
        damage_type=claim_data.damage_type,
        claim_amount=claim_amount,
        claim_status="requested",
        image_url=claim_data.image_url,
        latitude=claim_data.latitude,
        longitude=claim_data.longitude,
        is_fraud_suspected=not is_valid_loc,
        fraud_details=loc_msg if not is_valid_loc else None,
        rejection_reason=eligibility_msg if not is_eligible else None
    )
    
    db.add(claim)
    
    # Audit Log
    log = AuditLog(
        user_id=current_user.id,
        action="CLAIM_SUBMITTED",
        resource_type="Claim",
        details=f"Claim submitted for land {land.survey_number}"
    )
    db.add(log)
    
    db.commit()
    db.refresh(claim)
    
    return claim

@router.get("/my-claims")
def get_my_claims(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List claims for the current user"""
    claims = db.query(Claim).filter(Claim.user_id == current_user.id).order_by(Claim.created_at.desc()).all()
    
    result = []
    for c in claims:
        l = db.query(LandRecord).filter(LandRecord.id == c.land_id).first()
        result.append({
            "id": c.id,
            "claim_number": c.claim_number,
            "user_id": c.user_id,
            "land_id": c.land_id,
            "crop_id": c.crop_id,
            "land_survey": l.survey_number if l else "N/A",
            "land_area": l.area if l else None,
            "sum_insured": c.sum_insured,
            "damage_percentage": c.damage_percentage,
            "damage_type": c.damage_type,
            "claim_amount": c.claim_amount,
            "claim_status": c.claim_status,
            "image_url": c.image_url,
            "is_fraud_suspected": c.is_fraud_suspected,
            "rejection_reason": c.rejection_reason,
            "created_at": c.created_at,
            "updated_at": c.updated_at
        })
    return result

@router.get("/all")
def get_all_claims(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """View all claims (Admin/Officer)"""
    if current_user.role not in ["super_admin", "state_admin", "district_admin", "officer", "admin"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    claims = db.query(Claim).order_by(Claim.created_at.desc()).all()
    
    # Enriched response
    result = []
    for c in claims:
        u = db.query(User).filter(User.id == c.user_id).first()
        l = db.query(LandRecord).filter(LandRecord.id == c.land_id).first()
        result.append({
            "id": c.id,
            "claim_number": c.claim_number,
            "farmer_name": u.full_name if u else "Unknown",
            "land_survey": l.survey_number if l else "N/A",
            "damage_percentage": c.damage_percentage,
            "damage_type": c.damage_type,
            "claim_amount": c.claim_amount,
            "sum_insured": c.sum_insured,
            "claim_status": c.claim_status,
            "image_url": c.image_url,
            "is_fraud_suspected": c.is_fraud_suspected,
            "fraud_details": c.fraud_details,
            "rejection_reason": c.rejection_reason,
            "officer_recommendation": c.officer_recommendation,
            "created_at": c.created_at
        })
    return result

@router.put("/{claim_id}/verify")
def verify_claim(
    claim_id: int,
    update: ClaimUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Field Officer Verification"""
    if current_user.role not in ["officer", "admin", "super_admin", "state_admin", "district_admin"]:
        raise HTTPException(status_code=403, detail="Only authorized users can verify")
        
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
        
    claim.officer_recommendation = update.officer_recommendation
    claim.officer_notes = update.officer_notes
    claim.claim_status = "verified" if update.officer_recommendation == "approve" else "rejected"
    if update.rejection_reason:
        claim.rejection_reason = update.rejection_reason
        
    db.commit()
    return {"message": "Claim verification completed"}

@router.put("/{claim_id}/approve")
def approve_claim(
    claim_id: int,
    update: ClaimUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Admin Approval"""
    if current_user.role not in ["district_admin", "admin", "super_admin", "state_admin"]:
        raise HTTPException(status_code=403, detail="Only authorized admins can approve")
        
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
        
    claim.district_admin_notes = update.district_admin_notes
    claim.claim_status = "approved" if update.claim_status == "approved" else "rejected"
    if update.claim_status == "approved" and update.claim_amount:
        claim.claim_amount = update.claim_amount
    if update.rejection_reason:
        claim.rejection_reason = update.rejection_reason
        
    db.commit()
    return {"message": "Claim approval decision saved"}

@router.get("/stats/summary")
def get_stats(db: Session = Depends(get_db)):
    """General stats for dashboard"""
    total = db.query(Claim).count()
    pending = db.query(Claim).filter(Claim.claim_status.in_(["requested", "verified"])).count()
    approved = db.query(Claim).filter(Claim.claim_status == "approved").count()
    total_amt = db.query(Claim).filter(Claim.claim_status == "approved").with_entities(Claim.claim_amount).all()
    
    return {
        "total_claims": total,
        "pending_claims": pending,
        "approved_claims": approved,
        "total_approved_amount": sum([a[0] for a in total_amt])
    }

