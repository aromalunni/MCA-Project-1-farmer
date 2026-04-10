# backend/services/claim_calculator.py
import uuid
from datetime import datetime
from typing import Tuple, Optional
import math

class ClaimCalculator:
    """
    Insurance claim calculation service for Government Model
    
    Logic:
    - Sum Insured = Area × Rate
    - Claim Amount = Sum Insured × (Damage % / 100)
    - Threshold: 33% (Loss < 33% -> Not Eligible)
    - Fraud Detection: Distance comparison
    """
    
    LOSS_THRESHOLD = 33.0  # Minimum damage % for claim approval
    MAX_DISTANCE_KM = 0.5  # Allowed distance between land and photo (500 meters)
    
    @staticmethod
    def generate_claim_number() -> str:
        """Generate unique claim number in format CLM-YYYY-XXXXX"""
        timestamp = datetime.now().strftime("%Y")
        unique_id = str(uuid.uuid4())[:5].upper()
        return f"CLM-{timestamp}-{unique_id}"
    
    @staticmethod
    def calculate_sum_insured(area: float, rate_per_unit: float) -> float:
        """Sum Insured = Area × Rate"""
        return round(area * rate_per_unit, 2)
    
    @staticmethod
    def calculate_claim_amount(sum_insured: float, damage_percentage: float) -> float:
        """Claim Amount = Sum Insured × (Damage % / 100)"""
        claim_amount = sum_insured * (damage_percentage / 100)
        return round(claim_amount, 2)
    
    @staticmethod
    def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Haversine formula to calculate distance in KM between two points"""
        if None in [lat1, lon1, lat2, lon2]:
            return 0.0
        
        R = 6371  # Earth radius in KM
        d_lat = math.radians(lat2 - lat1)
        d_lon = math.radians(lon2 - lon1)
        
        a = math.sin(d_lat / 2) * math.sin(d_lat / 2) + \
            math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * \
            math.sin(d_lon / 2) * math.sin(d_lon / 2)
        
        c = 2 * math.asin(math.sqrt(a))
        return R * c
    
    @staticmethod
    def verify_location(land_lat: float, land_lon: float, claim_lat: float, claim_lon: float) -> Tuple[bool, str]:
        """Verify if claim location is within allowed distance from land location"""
        distance = ClaimCalculator.calculate_distance(land_lat, land_lon, claim_lat, claim_lon)
        
        if distance > ClaimCalculator.MAX_DISTANCE_KM:
            return False, f"Fraud detected: Image taken {round(distance, 2)} km away from registered land."
        return True, "Location verified."

    @staticmethod
    def determine_eligibility(damage_percentage: float) -> Tuple[bool, str]:
        """Check if damage meets the threshold"""
        if damage_percentage >= ClaimCalculator.LOSS_THRESHOLD:
            return True, "Eligible"
        else:
            return False, f"Not Eligible (Damage {damage_percentage}% < {ClaimCalculator.LOSS_THRESHOLD}%)"

# Initialize calculator
claim_calculator = ClaimCalculator()

