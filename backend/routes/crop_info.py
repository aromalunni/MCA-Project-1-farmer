# backend/routes/crop_info.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Dict
from config import get_db

router = APIRouter(prefix="/api/crop-info", tags=["crop-info"])

# Detailed crop information with damage detection details
CROP_DETAILS = {
    "food_grain": {
        "category": "Food Grain Crops",
        "crops": [
            {
                "id": 1,
                "name": "Paddy (Rice)",
                "code": "RICE",
                "damage_types": ["Flood", "Drought"],
                "detection_info": "Affected by flood & drought - visible water logging or dry patches",
                "season": "kharif",
                "min_cover": 40000,
                "max_cover": 100000,
                "icon": "🌾"
            },
            {
                "id": 2,
                "name": "Wheat",
                "code": "WHEAT",
                "damage_types": ["Flood", "Drought"],
                "detection_info": "Damage due to flood & drought - yellowing leaves, stunted growth",
                "season": "rabi",
                "min_cover": 35000,
                "max_cover": 90000,
                "icon": "🌾"
            },
            {
                "id": 3,
                "name": "Maize",
                "code": "MAIZE",
                "damage_types": ["Pest Attack", "Disease"],
                "detection_info": "Damage visible on leaves & cobs - brown spots, wilting",
                "season": "kharif",
                "min_cover": 30000,
                "max_cover": 80000,
                "icon": "🌽"
            }
        ]
    },
    "oilseed": {
        "category": "Oilseed Crops",
        "crops": [
            {
                "id": 4,
                "name": "Groundnut",
                "code": "GROUNDNUT",
                "damage_types": ["Leaf Disease", "Wilting"],
                "detection_info": "Leaf yellowing & wilting easy to detect - visible discoloration",
                "season": "kharif",
                "min_cover": 35000,
                "max_cover": 95000,
                "icon": "🥜"
            },
            {
                "id": 5,
                "name": "Mustard",
                "code": "MUSTARD",
                "damage_types": ["Flowering Damage", "Pod Damage"],
                "detection_info": "Clear flowering & pod damage - visible on flowers and seed pods",
                "season": "rabi",
                "min_cover": 30000,
                "max_cover": 85000,
                "icon": "🌻"
            }
        ]
    },
    "commercial": {
        "category": "Commercial / Cash Crops",
        "crops": [
            {
                "id": 6,
                "name": "Sugarcane",
                "code": "SUGARCANE",
                "damage_types": ["Flood Damage", "Pest Attack"],
                "detection_info": "Flood damage detection - waterlogged fields, stem rot",
                "season": "both",
                "min_cover": 50000,
                "max_cover": 120000,
                "icon": "🎋"
            },
            {
                "id": 7,
                "name": "Cotton",
                "code": "COTTON",
                "damage_types": ["Boll Damage", "Pest Attack"],
                "detection_info": "Boll damage detection - damaged cotton bolls, pest infestation",
                "season": "kharif",
                "min_cover": 45000,
                "max_cover": 110000,
                "icon": "🌸"
            }
        ]
    }
}

@router.get("/categories")
def get_crop_categories():
    """Get all crop categories with detailed information"""
    return {
        "categories": [
            {
                "category_id": "food_grain",
                "category_name": CROP_DETAILS["food_grain"]["category"],
                "crops": CROP_DETAILS["food_grain"]["crops"]
            },
            {
                "category_id": "oilseed",
                "category_name": CROP_DETAILS["oilseed"]["category"],
                "crops": CROP_DETAILS["oilseed"]["crops"]
            },
            {
                "category_id": "commercial",
                "category_name": CROP_DETAILS["commercial"]["category"],
                "crops": CROP_DETAILS["commercial"]["crops"]
            }
        ]
    }

@router.get("/category/{category_id}")
def get_category_crops(category_id: str):
    """Get crops for a specific category"""
    if category_id not in CROP_DETAILS:
        return {"error": "Category not found"}
    
    return {
        "category": CROP_DETAILS[category_id]["category"],
        "crops": CROP_DETAILS[category_id]["crops"]
    }

@router.get("/crop/{crop_code}")
def get_crop_details(crop_code: str):
    """Get detailed information for a specific crop"""
    for category_data in CROP_DETAILS.values():
        for crop in category_data["crops"]:
            if crop["code"] == crop_code.upper():
                return crop
    
    return {"error": "Crop not found"}

@router.get("/all")
def get_all_crops_flat():
    """Get all crops in a flat list"""
    all_crops = []
    for category_data in CROP_DETAILS.values():
        all_crops.extend(category_data["crops"])
    
    return {"crops": all_crops}

@router.get("/damage-types")
def get_all_damage_types():
    """Get all unique damage types across all crops"""
    damage_types = set()
    for category_data in CROP_DETAILS.values():
        for crop in category_data["crops"]:
            damage_types.update(crop["damage_types"])
    
    return {"damage_types": sorted(list(damage_types))}
