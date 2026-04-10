from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from config import DATABASE_URL
from models import User, AuditLog, Claim, LandRecord, FarmerProfile

# Setup
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

def debug_user(user_id):
    print(f"\n--- DEBUG USER {user_id} ---")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        print(f"User {user_id} NOT FOUND.")
        return

    print(f"User Found: {user.full_name} (Role: {user.role})")
    
    # Check relations
    logs = db.query(AuditLog).filter(AuditLog.user_id == user_id).count()
    claims = db.query(Claim).filter(Claim.user_id == user_id).count()
    lands = db.query(LandRecord).filter(LandRecord.user_id == user_id).count()
    profile = db.query(FarmerProfile).filter(FarmerProfile.user_id == user_id).first()
    
    print(f"Relations: AuditLogs={logs}, Claims={claims}, Lands={lands}, Profile={'Yes' if profile else 'No'}")
    
    # Try Delete (Validation)
    try:
        print("Attempting validation delete (Rollback)...")
        # Enable FK
        db.execute(text("PRAGMA foreign_keys = ON"))
        
        # Manual clean like endpoint
        db.query(AuditLog).filter(AuditLog.user_id == user_id).delete()
        db.query(Claim).filter(Claim.user_id == user_id).delete()
        db.query(LandRecord).filter(LandRecord.user_id == user_id).delete()
        db.query(FarmerProfile).filter(FarmerProfile.user_id == user_id).delete()
        db.delete(user)
        
        print("Delete VALIDATION SUCCESS (No Commit)")
        db.rollback() 
    except Exception as e:
        print(f"Delete VALIDATION FAILED: {str(e)}")
        db.rollback()

if __name__ == "__main__":
    debug_user(3)
