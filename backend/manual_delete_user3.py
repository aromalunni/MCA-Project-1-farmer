from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from config import DATABASE_URL
from models import User, AuditLog, Claim, LandRecord, FarmerProfile

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

def delete_user_3():
    user_id = 3
    print(f"Deleting User {user_id}...")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        print("User 3 not found.")
        return

    try:
        db.execute(text("PRAGMA foreign_keys = ON"))
        
        db.query(AuditLog).filter(AuditLog.user_id == user_id).delete()
        db.query(Claim).filter(Claim.user_id == user_id).delete()
        db.query(LandRecord).filter(LandRecord.user_id == user_id).delete()
        db.query(FarmerProfile).filter(FarmerProfile.user_id == user_id).delete()
        db.delete(user)
        
        db.commit()
        print("User 3 DELETED SUCCESSFULLY.")
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")

if __name__ == "__main__":
    delete_user_3()
