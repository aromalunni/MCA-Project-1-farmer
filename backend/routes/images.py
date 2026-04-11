# backend/routes/images.py
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from sqlalchemy.orm import Session
from pydantic import BaseModel
import shutil
import os
import uuid
import logging

from models import User
from dependencies import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/images", tags=["images"])

from fastapi import Request

@router.post("/upload-file")
async def upload_image_file(
    request: Request,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload an image file and get the URL"""
    
    upload_dir = "static/uploads"
    os.makedirs(upload_dir, exist_ok=True)

    # Free tier: keep max 20 images, delete oldest when full
    MAX_IMAGES = 20
    existing_files = sorted(
        [f for f in os.listdir(upload_dir) if f != '.gitkeep'],
        key=lambda f: os.path.getmtime(os.path.join(upload_dir, f))
    )
    while len(existing_files) >= MAX_IMAGES:
        oldest = existing_files.pop(0)
        try:
            os.remove(os.path.join(upload_dir, oldest))
        except:
            pass

    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(upload_dir, unique_filename)

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Could not save file: {str(e)}"
        )

    # Use request's base URL so it works on any host
    base_url = str(request.base_url).rstrip('/')
    return {"url": f"{base_url}/static/uploads/{unique_filename}", "filename": unique_filename}

class AnalyzeRequest(BaseModel):
    image_url: str

@router.post("/analyze")
def analyze_crop_image(
    data: AnalyzeRequest,
    current_user: User = Depends(get_current_user)
):
    """Analyze a crop image for damage using AI-based color analysis"""
    try:
        from services.image_analyzer import image_analyzer
        result = image_analyzer.analyze_image(data.image_url)
        return result
    except ValueError as e:
        logger.error(f"Image analysis ValueError: {e}")
        # Fallback: return a reasonable estimate if image analysis fails
        return {
            "health_status": "Moderate",
            "damage_percentage": 35.0,
            "damage_type": "Could not determine - manual review needed",
            "confidence_score": 0.3,
            "analysis_details": {
                "green_ratio": 0,
                "brown_ratio": 0,
                "color_variance": 0,
                "method": "Fallback (image analysis failed)",
                "error": str(e)
            }
        }
    except Exception as e:
        logger.error(f"Image analysis error: {e}")
        return {
            "health_status": "Moderate",
            "damage_percentage": 35.0,
            "damage_type": "Could not determine - manual review needed",
            "confidence_score": 0.3,
            "analysis_details": {
                "green_ratio": 0,
                "brown_ratio": 0,
                "color_variance": 0,
                "method": "Fallback (image analysis failed)",
                "error": str(e)
            }
        }

# Legacy upload endpoint
@router.post("/upload")
def upload_crop_image():
    raise HTTPException(status_code=status.HTTP_410_GONE, detail="This endpoint is deprecated. Use /upload-file instead.")

