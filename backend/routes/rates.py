# backend/routes/rates.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from config import get_db
from models import InsuranceRate, User
from dependencies import get_current_user

router = APIRouter(prefix="/api/admin/rates", tags=["rates"])


class RateUpdate(BaseModel):
    rate_per_acre: Optional[float] = None
    rate_per_cent: Optional[float] = None
    threshold_damage: Optional[float] = None


@router.get("")
def get_rates(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all insurance rates (Admin only)"""
    if current_user.role not in ["super_admin", "admin", "state_admin", "district_admin"]:
        raise HTTPException(status_code=403, detail="Unauthorized")

    rates = db.query(InsuranceRate).all()

    # If no rates exist, create default
    if not rates:
        default = InsuranceRate(
            crop_type="Default",
            rate_per_acre=50000.0,
            rate_per_cent=500.0,
            threshold_damage=33.0
        )
        db.add(default)
        db.commit()
        db.refresh(default)
        rates = [default]

    return [
        {
            "id": r.id,
            "crop_type": r.crop_type,
            "rate_per_acre": r.rate_per_acre,
            "rate_per_cent": r.rate_per_cent or (r.rate_per_acre / 100),
            "threshold_damage": r.threshold_damage,
            "updated_at": r.updated_at.isoformat() if r.updated_at else None
        }
        for r in rates
    ]


@router.put("/{rate_id}")
def update_rate(
    rate_id: int,
    data: RateUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update insurance rate (Admin only)"""
    if current_user.role not in ["super_admin", "admin", "state_admin", "district_admin"]:
        raise HTTPException(status_code=403, detail="Unauthorized")

    rate = db.query(InsuranceRate).filter(InsuranceRate.id == rate_id).first()
    if not rate:
        raise HTTPException(status_code=404, detail="Rate not found")

    if data.rate_per_acre is not None:
        rate.rate_per_acre = data.rate_per_acre
    if data.rate_per_cent is not None:
        rate.rate_per_cent = data.rate_per_cent
    if data.threshold_damage is not None:
        rate.threshold_damage = data.threshold_damage
    rate.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(rate)

    return {
        "message": "Rate updated successfully",
        "rate": {
            "id": rate.id,
            "crop_type": rate.crop_type,
            "rate_per_acre": rate.rate_per_acre,
            "rate_per_cent": rate.rate_per_cent,
            "threshold_damage": rate.threshold_damage,
            "updated_at": rate.updated_at.isoformat() if rate.updated_at else None
        }
    }


@router.get("/public")
def get_public_rates(db: Session = Depends(get_db)):
    """Get rates for farmer claim submission (no auth needed)"""
    rates = db.query(InsuranceRate).all()

    if not rates:
        return {"rate_per_acre": 50000.0, "rate_per_cent": 500.0}

    r = rates[0]
    return {
        "rate_per_acre": r.rate_per_acre,
        "rate_per_cent": r.rate_per_cent or (r.rate_per_acre / 100)
    }
