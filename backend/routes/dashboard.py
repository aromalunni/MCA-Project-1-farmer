# backend/routes/dashboard.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from config import get_db
from models import Claim, User, Crop
from schemas import CropResponse, DashboardStatsResponse
from dependencies import get_current_user

router = APIRouter(prefix="/api", tags=["dashboard"])

@router.get("/crops", response_model=List[CropResponse])
def get_all_crops(db: Session = Depends(get_db)):
    """Get all available crops"""
    crops = db.query(Crop).all()
    return crops

@router.get("/dashboard/stats", response_model=DashboardStatsResponse)
def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get dashboard statistics"""
    
    # Get all claims
    all_claims = db.query(Claim).all()
    
    total_claims = len(all_claims)
    approved_claims = len([c for c in all_claims if c.claim_status == "approved"])
    rejected_claims = len([c for c in all_claims if c.claim_status == "rejected"])
    pending_claims = len([c for c in all_claims if c.claim_status == "pending"])
    total_claim_amount = sum([c.claim_amount for c in all_claims])
    
    # Get total farmers
    total_farmers = db.query(User).filter(User.role == "farmer").count()
    
    return {
        "total_claims": total_claims,
        "approved_claims": approved_claims,
        "rejected_claims": rejected_claims,
        "pending_claims": pending_claims,
        "total_claim_amount": round(total_claim_amount, 2),
        "total_farmers": total_farmers,
        "last_updated": __import__('datetime').datetime.utcnow()
    }

@router.get("/dashboard/claims-by-status")
def get_claims_by_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get claims grouped by status"""
    
    all_claims = db.query(Claim).all()
    
    status_breakdown = {
        "pending": len([c for c in all_claims if c.claim_status == "pending"]),
        "approved": len([c for c in all_claims if c.claim_status == "approved"]),
        "rejected": len([c for c in all_claims if c.claim_status == "rejected"]),
        "paid": len([c for c in all_claims if c.claim_status == "paid"])
    }
    
    return status_breakdown

@router.get("/dashboard/recent-claims")
def get_recent_claims(
    limit: int = 5,
    db: Session = Depends(get_db),
    # Optional: if you want to protect recent claims too, uncomment below
    # current_user: User = Depends(get_current_user)
):
    """Get recent claims"""
    
    claims = db.query(Claim).order_by(Claim.created_at.desc()).limit(limit).all()
    
    result = []
    for claim in claims:
        user = db.query(User).filter(User.id == claim.user_id).first()
        crop = db.query(Crop).filter(Crop.id == claim.crop_id).first()
        
        result.append({
            "claim_number": claim.claim_number,
            "farmer_name": user.full_name if user else "Unknown",
            "crop": crop.crop_name if crop else "Unknown",
            "damage_percentage": claim.damage_percentage,
            "claim_amount": claim.claim_amount,
            "status": claim.claim_status,
            "created_at": claim.created_at
        })
    
    return result

@router.get("/dashboard/damage-statistics")
def get_damage_statistics(db: Session = Depends(get_db)):
    """Get damage level statistics"""
    
    all_claims = db.query(Claim).all()
    
    healthy = len([c for c in all_claims if c.damage_percentage < 20])
    mild = len([c for c in all_claims if 20 <= c.damage_percentage < 40])
    moderate = len([c for c in all_claims if 40 <= c.damage_percentage < 65])
    severe = len([c for c in all_claims if c.damage_percentage >= 65])
    
    return {
        "healthy": healthy,
        "mild": mild,
        "moderate": moderate,
        "severe": severe
    }

@router.get("/health")
def health_check():
    """API health check endpoint"""
    return {
        "status": "healthy",
        "message": "PMFBY Crop Insurance API is running"
    }
