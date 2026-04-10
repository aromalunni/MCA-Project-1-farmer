# backend/services/image_analyzer.py
import cv2
import numpy as np
from PIL import Image
import requests
from io import BytesIO
import logging
import os

logger = logging.getLogger(__name__)

class CropImageAnalyzer:
    """
    Rule-based crop damage assessment system
    
    This analyzer uses image color analysis (HSV color space) to estimate
    crop health and damage percentage. It analyzes:
    - Green pixel ratio (healthy crops have higher green)
    - Brown/yellow pixels (indicates stress/disease)
    - Texture and color variance
    
    Academic Justification:
    - Green color is a proxy for chlorophyll presence (plant health)
    - Brown/yellow indicates senescence or stress
    - This approach is transparent, explainable, and suitable for
      demonstrating AI concepts in agricultural tech
    """
    
    def __init__(self):
        self.damage_classes = {
            "Healthy": {"min_green": 70, "max_green": 100, "damage": 5},
            "Mild": {"min_green": 50, "max_green": 70, "damage": 20},
            "Moderate": {"min_green": 30, "max_green": 50, "damage": 40},
            "Severe": {"min_green": 0, "max_green": 30, "damage": 65}
        }
    
    def download_image(self, image_url: str) -> np.ndarray:
        """Download image from URL or read from local filesystem"""
        try:
            # Check if it's a local file path
            if "localhost" in image_url and "/static/" in image_url:
                # Extract path after /static/
                file_path = image_url.split("/static/")[-1]
                local_path = os.path.join("static", file_path)
                
                if os.path.exists(local_path):
                    img = Image.open(local_path)
                    return cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
                else:
                    raise ValueError(f"Local file not found: {local_path}")
            
            elif image_url.startswith("/static/"):
                # Relative path starting with /static/
                local_path = image_url.lstrip("/")
                if os.path.exists(local_path):
                    img = Image.open(local_path)
                    return cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
                else:
                    raise ValueError(f"Local file not found: {local_path}")
            
            elif image_url.startswith("file://"):
                local_path = image_url.replace("file://", "")
                if os.path.exists(local_path):
                    img = Image.open(local_path)
                    return cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
                else:
                    raise ValueError(f"Local file not found: {local_path}")
            
            # Otherwise, download from external URL
            response = requests.get(image_url, timeout=15)
            response.raise_for_status()
            img = Image.open(BytesIO(response.content))
            return cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
        except requests.exceptions.RequestException as e:
            logger.error(f"Error downloading image: {e}")
            raise ValueError(f"Could not download image from: {image_url}. Error: {str(e)}")
        except Exception as e:
            logger.error(f"Error loading image: {e}")
            raise ValueError(f"Could not load image from: {image_url}. Error: {str(e)}")
    
    def calculate_green_ratio(self, image: np.ndarray) -> float:
        """
        Calculate the percentage of green pixels in the image
        
        Green detection in HSV:
        - H (Hue): 35-85 degrees (green range in HSV)
        - S (Saturation): > 40 (vibrant colors)
        - V (Value): > 40 (sufficient brightness)
        """
        # Convert BGR to HSV
        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        
        # Define green color range in HSV
        lower_green = np.array([35, 40, 40])
        upper_green = np.array([85, 255, 255])
        
        # Create mask for green pixels
        green_mask = cv2.inRange(hsv, lower_green, upper_green)
        
        # Calculate green ratio
        green_pixels = cv2.countNonZero(green_mask)
        total_pixels = image.shape[0] * image.shape[1]
        green_ratio = (green_pixels / total_pixels) * 100
        
        return green_ratio
    
    def calculate_brown_ratio(self, image: np.ndarray) -> float:
        """
        Calculate percentage of brown/yellow pixels (damage indicators)
        
        Brown/Yellow detection in HSV:
        - H (Hue): 10-25 degrees (yellow-brown range)
        - S (Saturation): > 30 (visible color)
        - V (Value): > 40 (brightness)
        """
        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        
        # Define brown/yellow range
        lower_brown = np.array([10, 30, 40])
        upper_brown = np.array([25, 255, 255])
        
        brown_mask = cv2.inRange(hsv, lower_brown, upper_brown)
        brown_pixels = cv2.countNonZero(brown_mask)
        total_pixels = image.shape[0] * image.shape[1]
        brown_ratio = (brown_pixels / total_pixels) * 100
        
        return brown_ratio
    
    def calculate_color_variance(self, image: np.ndarray) -> float:
        """
        Calculate color variance (texture roughness indicator)
        Higher variance suggests disease/damage patterns
        """
        # Convert to grayscale and calculate Laplacian variance
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        laplacian_variance = cv2.Laplacian(gray, cv2.CV_64F).var()
        return laplacian_variance
    
    def classify_health_status(self, green_ratio: float, brown_ratio: float) -> tuple:
        """
        Classify crop health based on color analysis
        
        Returns: (health_status, damage_percentage, damage_type)
        """
        # Normalize green ratio (cap at 100)
        green_ratio = min(green_ratio, 100)
        
        # Determine health status
        if green_ratio >= 70:
            health_status = "Healthy"
            damage_percentage = 5
            damage_type = "None"
        elif green_ratio >= 50:
            health_status = "Mild"
            damage_percentage = 20
            damage_type = "Water Stress / Nutrient Deficiency"
        elif green_ratio >= 30:
            health_status = "Moderate"
            damage_percentage = 40
            # Determine damage type based on brown ratio
            if brown_ratio > 15:
                damage_type = "Pest / Disease"
            else:
                damage_type = "Water Stress / Drought"
        else:
            health_status = "Severe"
            damage_percentage = 65
            if brown_ratio > 20:
                damage_type = "Severe Pest / Disease"
            else:
                damage_type = "Severe Drought / Flood Damage"
        
        return health_status, damage_percentage, damage_type
    
    def is_crop_image(self, image: np.ndarray) -> tuple:
        """
        Validate if the image is likely a crop/field/outdoor vegetation image.

        Checks:
        1. Skin tone detection (reject selfies/people photos)
        2. Color diversity (real fields have multiple color zones, not uniform)
        3. Texture complexity (outdoor scenes have high texture variance)
        4. Natural content presence

        Returns: (is_valid, reason)
        """
        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        total_pixels = image.shape[0] * image.shape[1]

        # 1. Check for skin tone (reject selfies)
        lower_skin = np.array([0, 30, 60])
        upper_skin = np.array([20, 150, 255])
        skin_mask = cv2.inRange(hsv, lower_skin, upper_skin)
        skin_ratio = (cv2.countNonZero(skin_mask) / total_pixels) * 100

        if skin_ratio > 30:
            return False, "This appears to be a photo of a person, not a crop field. Please upload a photo of your affected crop/land."

        # 2. Calculate color zones
        # Green
        lower_green = np.array([25, 25, 25])
        upper_green = np.array([95, 255, 255])
        green_mask = cv2.inRange(hsv, lower_green, upper_green)
        green_ratio = (cv2.countNonZero(green_mask) / total_pixels) * 100

        # Brown/earth
        lower_earth = np.array([5, 20, 30])
        upper_earth = np.array([30, 255, 255])
        earth_mask = cv2.inRange(hsv, lower_earth, upper_earth)
        earth_ratio = (cv2.countNonZero(earth_mask) / total_pixels) * 100

        # Blue sky
        lower_sky = np.array([95, 40, 40])
        upper_sky = np.array([130, 255, 255])
        sky_mask = cv2.inRange(hsv, lower_sky, upper_sky)
        sky_ratio = (cv2.countNonZero(sky_mask) / total_pixels) * 100

        natural_content = green_ratio + earth_ratio + sky_ratio

        # 3. Check color diversity - count how many distinct color zones are present
        color_zones = 0
        if green_ratio > 5: color_zones += 1
        if earth_ratio > 5: color_zones += 1
        if sky_ratio > 5: color_zones += 1

        # 4. Texture complexity - real outdoor scenes have high Laplacian variance
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()

        # 5. Check for dominant single color (uniform objects like t-shirt, wall, etc)
        # Split image into quadrants and check if hue is too uniform
        h_channel = hsv[:, :, 0]
        hue_std = np.std(h_channel)

        # 6. Check saturation diversity - natural scenes have varied saturation
        s_channel = hsv[:, :, 1]
        sat_std = np.std(s_channel)

        # --- Rejection rules ---

        # Too uniform in color (single colored object like t-shirt, paper, etc.)
        if hue_std < 15 and sat_std < 30:
            return False, "This image appears to be a single-colored object, not a crop field. Please upload a photo of your farmland."

        # One color dominates >85% - not a natural scene
        if green_ratio > 85 or earth_ratio > 85:
            if laplacian_var < 500:
                return False, "This image looks like a solid colored object. A real crop photo has varied textures. Please upload an actual field photo."

        # Not enough natural outdoor content
        if natural_content < 15:
            return False, "This does not appear to be a crop or field photo. Please upload a clear photo of your affected crop/farmland."

        # Indoor/artificial scenes
        lower_grey = np.array([0, 0, 100])
        upper_grey = np.array([180, 30, 255])
        grey_mask = cv2.inRange(hsv, lower_grey, upper_grey)
        grey_ratio = (cv2.countNonZero(grey_mask) / total_pixels) * 100

        if grey_ratio > 55 and natural_content < 20:
            return False, "This appears to be an indoor photo. Please upload an outdoor photo of your crop/farmland."

        # Very low texture + single zone = likely not a field
        if laplacian_var < 200 and color_zones <= 1:
            return False, "This image does not look like a crop field. Please upload a clear outdoor photo of your farmland."

        return True, "Valid crop image"

    def analyze_image(self, image_url: str) -> dict:
        """
        Main analysis function

        Returns dict with:
        - health_status: Classification (Healthy/Mild/Moderate/Severe)
        - damage_percentage: Estimated damage %
        - damage_type: Type of damage detected
        - confidence_score: Confidence in analysis (0-1)
        - analysis_details: Detailed metrics
        - is_valid_crop: Whether the image is a valid crop photo
        """
        try:
            # Download and prepare image
            image = self.download_image(image_url)

            # Resize for consistent analysis
            image = cv2.resize(image, (400, 400))

            # Validate if this is a crop image
            is_valid, validation_msg = self.is_crop_image(image)
            if not is_valid:
                return {
                    "is_valid_crop": False,
                    "error": validation_msg,
                    "health_status": "Unknown",
                    "damage_percentage": 0,
                    "damage_type": "Invalid Image",
                    "confidence_score": 0,
                    "analysis_details": {
                        "green_ratio": 0,
                        "brown_ratio": 0,
                        "color_variance": 0,
                        "method": "Image validation failed"
                    }
                }

            # Calculate metrics
            green_ratio = self.calculate_green_ratio(image)
            brown_ratio = self.calculate_brown_ratio(image)
            color_variance = self.calculate_color_variance(image)

            # Classify
            health_status, damage_percentage, damage_type = self.classify_health_status(
                green_ratio, brown_ratio
            )

            # Calculate confidence score
            confidence_score = min(0.95, 0.5 + (abs(green_ratio - 50) / 100))
            confidence_score = max(0.65, confidence_score)

            return {
                "is_valid_crop": True,
                "health_status": health_status,
                "damage_percentage": damage_percentage,
                "damage_type": damage_type,
                "confidence_score": round(confidence_score, 2),
                "analysis_details": {
                    "green_ratio": round(green_ratio, 2),
                    "brown_ratio": round(brown_ratio, 2),
                    "color_variance": round(color_variance, 2),
                    "method": "HSV color space analysis"
                }
            }

        except Exception as e:
            logger.error(f"Error analyzing image: {e}")
            raise ValueError(f"Could not analyze image: {str(e)}")

# Initialize analyzer
image_analyzer = CropImageAnalyzer()
