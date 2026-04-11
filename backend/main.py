# backend/main.py
from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import configuration and routes
from config import init_db
from routes import auth, images, claims, dashboard, kerala, crop_info, farmer_auth, lands, rates

# Initialize database
try:
    init_db()
except Exception as e:
    print(f"Database initialization warning: {e}")

# Create FastAPI app
app = FastAPI(
    title="PMFBY Crop Insurance System",
    description="AI-based real-time crop image analytics for crop insurance",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Middleware to extract token from Authorization header
@app.middleware("http")
async def add_token_to_request(request, call_next):
    """Extract JWT token from Authorization header and add to query params"""
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[7:]  # Remove "Bearer " prefix
        # Add token to request for dependency injection
        request.state.token = token
    response = await call_next(request)
    return response

# Custom dependency for token extraction
async def get_token_from_request(authorization: str = Header(None)):
    """Extract token from Authorization header"""
    if authorization:
        parts = authorization.split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            return parts[1]
    return None

from fastapi.staticfiles import StaticFiles

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Include routers
app.include_router(auth.router)
app.include_router(farmer_auth.router)
app.include_router(lands.router)
app.include_router(images.router)
app.include_router(claims.router)
app.include_router(dashboard.router)
app.include_router(kerala.router)
app.include_router(crop_info.router)
app.include_router(rates.router)

@app.get("/")
async def root():
    """API root endpoint"""
    return {
        "message": "PMFBY Crop Insurance System API",
        "version": "1.0.0",
        "docs_url": "/docs",
        "health_url": "/api/health"
    }

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Custom HTTP exception handler"""
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Handle unexpected errors"""
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )

if __name__ == "__main__":
    import uvicorn
    
    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", 8000))
    debug = os.getenv("DEBUG", "True").lower() == "true"
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=debug,
        log_level="info"
    )
