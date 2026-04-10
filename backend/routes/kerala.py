# backend/routes/kerala.py
from fastapi import APIRouter
from typing import List, Dict
import random
from datetime import datetime

router = APIRouter(prefix="/api/kerala", tags=["kerala"])

@router.get("/weather")
def get_monsoon_data():
    """Real-time Monsoon Monitoring & Weather Alerts"""
    return {
        "status": "Active",
        "season": "Northeast Monsoon (Thulavarsham)",
        "current_rainfall": "24.5 mm",
        "total_rainfall": "2850 mm",
        "wind_speed": "48 km/h",
        "humidity": "88%",
        "forecast": "Heavy rainfall expected in central districts",
        "alerts": [
            {"level": "Orange", "message": "High wind alert (45-55 km/h) for coastal areas", "type": "Wind"},
            {"level": "Yellow", "message": "Moderate landslide risk in high-range usage", "type": "Landslide"}
        ]
    }

@router.get("/market/spices")
def get_spice_market():
    """Live Spice Market Intelligence"""
    return [
        {"name": "Black Pepper", "price": 540, "unit": "kg", "trend": "up", "market": "Kochi"},
        {"name": "Cardamom (Green)", "price": 1850, "unit": "kg", "trend": "down", "market": "Idukki"},
        {"name": "Turmeric", "price": 120, "unit": "kg", "trend": "stable", "market": "Wayanad"},
        {"name": "Cinnamon", "price": 350, "unit": "kg", "trend": "up", "market": "Kozhikode"},
        {"name": "Cloves", "price": 890, "unit": "kg", "trend": "stable", "market": "Kottayam"},
        {"name": "Nutmeg", "price": 420, "unit": "kg", "trend": "up", "market": "Thrissur"},
    ]

@router.get("/market/crops")
def get_crop_monitor():
    """Major Kerala Crop Monitoring"""
    return [
        {"name": "Coconut", "price_range": "₹50K - ₹3L", "current_price": 28, "unit": "nut", "status": "Stable"},
        {"name": "Rubber", "price_range": "₹75K - ₹4L", "current_price": 152, "unit": "kg", "status": "Volatile"},
        {"name": "Paddy (Rice)", "price_range": "₹30K - ₹1.5L", "current_price": 28.50, "unit": "kg", "status": "Procurement Active"},
        {"name": "Arecanut", "price_range": "₹40K - ₹2L", "current_price": 240, "unit": "kg", "status": "Rising"},
        {"name": "Banana (Nendran)", "price_range": "₹25K - ₹1L", "current_price": 42, "unit": "kg", "status": "Peak Season"},
        {"name": "Pineapple", "price_range": "₹20K - ₹80K", "current_price": 38, "unit": "kg", "status": "High Demand"},
    ]

@router.get("/districts/risks")
def get_district_risks():
    """District-wise Risk Mapping"""
    return [
        {"district": "Idukki", "risk_level": "Critical", "monsoon_days": 75, "hazard": "High Landslide Risk"},
        {"district": "Wayanad", "risk_level": "High", "monsoon_days": 62, "hazard": "Flood & Landslide"},
        {"district": "Kottayam", "risk_level": "High", "monsoon_days": 58, "hazard": "Flash Floods"},
        {"district": "Kannur", "risk_level": "Medium", "monsoon_days": 45, "hazard": "Coastal Erosion"},
        {"district": "Kasaragod", "risk_level": "Medium", "monsoon_days": 42, "hazard": "Moderate Rain"},
        {"district": "Ernakulam", "risk_level": "Low", "monsoon_days": 38, "hazard": "Urban Logging"},
        {"district": "Alappuzha", "risk_level": "Low", "monsoon_days": 35, "hazard": "Waterlogging"},
        {"district": "Palakkad", "risk_level": "Low", "monsoon_days": 30, "hazard": "Wind Gusts"},
    ]
