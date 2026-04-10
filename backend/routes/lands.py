# backend/routes/lands.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from config import get_db
from models import LandRecord, User
from schemas import LandRecordCreate, LandRecordResponse
from dependencies import get_current_user

router = APIRouter(prefix="/api/lands", tags=["lands"])

@router.get("/my", response_model=List[LandRecordResponse])
def get_my_lands(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all land records for the current user"""
    lands = db.query(LandRecord).filter(LandRecord.user_id == current_user.id).all()
    return lands

@router.post("/add", response_model=LandRecordResponse)
def add_land(
    land_data: LandRecordCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a new land record"""
    if current_user.role != "farmer":
        raise HTTPException(status_code=403, detail="Only farmers can add land records")
        
    new_land = LandRecord(
        user_id=current_user.id,
        survey_number=land_data.survey_number,
        area=land_data.area,
        unit=land_data.unit,
        crop_type=land_data.crop_type,
        irrigation_type=land_data.irrigation_type,
        latitude=land_data.latitude,
        longitude=land_data.longitude
    )
    
    db.add(new_land)
    db.commit()
    db.refresh(new_land)
    
    return new_land

@router.delete("/{land_id}")
def delete_land(
    land_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a land record"""
    land = db.query(LandRecord).filter(
        (LandRecord.id == land_id) & (LandRecord.user_id == current_user.id)
    ).first()
    
    if not land:
        raise HTTPException(status_code=404, detail="Land record not found")
        
    db.delete(land)
    db.commit()
    
    return {"message": "Land record deleted successfully"}
