# backend/config.py
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv()

# Database configuration - PostgreSQL for production, SQLite for local
DATABASE_URL = os.getenv("DATABASE_URL", "")

# Fix Render's postgres:// to postgresql://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Create engine
if DATABASE_URL and ("postgresql" in DATABASE_URL or "postgres" in DATABASE_URL):
    connect_args = {}
    if "render.com" in DATABASE_URL:
        connect_args["sslmode"] = "require"
    engine = create_engine(DATABASE_URL, echo=False, pool_pre_ping=True, connect_args=connect_args)
else:
    # Local SQLite
    engine = create_engine(
        "sqlite+pysqlite:///./pmfby.db",
        connect_args={"check_same_thread": False},
        echo=False,
        module=__import__("sqlite3")
    )

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

# Dependency for database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Initialize database
def init_db():
    """Initialize database tables from SQLAlchemy models"""
    from models import User, FarmerProfile, LandRecord, Crop, Claim, InsuranceRate, AuditLog, DashboardStats
    Base.metadata.create_all(bind=engine)
    print("✅ Database initialized successfully")
