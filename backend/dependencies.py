# backend/dependencies.py
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt
from sqlalchemy.orm import Session

from config import get_db, SECRET_KEY, ALGORITHM
from models import User
from services.auth import auth_service

# This specifies that the client should send the token in the Authorization header
# using the Bearer scheme. The tokenUrl is used for the Swagger UI.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """
    Dependency to get the current authenticated user from the JWT token.
    This works with the 'Authorization: Bearer <token>' header.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # We manually decode or use auth_service if it exposes a cleaner method
        # But auth_service.decode_token returns payload or None
        payload = auth_service.decode_token(token)
        if payload is None:
            raise credentials_exception
            
        username: str = payload.get("username")
        user_id: int = payload.get("sub")
        
        if username is None or user_id is None:
            raise credentials_exception
            
    except jwt.PyJWTError: # pyjwt base exception
        raise credentials_exception
        
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise credentials_exception
        
    return user

def get_current_active_user(current_user: User = Depends(get_current_user)):
    """
    Dependency to get the current active user.
    """
    # If you have an 'is_active' field, check it here.
    return current_user

def get_current_user_with_role(required_roles: list):
    """
    Factory for role-based access control.
    Example: Depends(get_current_user_with_role(["admin"]))
    """
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in required_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Operation not permitted"
            )
        return current_user
    return role_checker
