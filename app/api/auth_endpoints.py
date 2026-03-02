"""
Auth endpoints:
  POST /auth/register  — create a new account (open self-signup)
  POST /auth/login     — get a JWT (OAuth2 password form)
  GET  /auth/me        — return current user info
"""
import logging

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.db.models import User
from app.schemas.auth import UserCreate, UserResponse, UserWithToken
from app.services.auth_service import (
    authenticate_user,
    create_access_token,
    get_current_user,
    get_db,
    hash_password,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserWithToken, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    """Open self-signup. First ever user automatically becomes admin."""
    # Duplicate email check
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    is_first_user = db.query(User).count() == 0

    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
        is_active=True,
        is_admin=is_first_user,  # first user gets admin
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    logger.info(f"New user registered: {user.email} (admin={user.is_admin})")

    token = create_access_token(
        {"sub": str(user.id), "email": user.email, "is_admin": user.is_admin}
    )
    return UserWithToken(access_token=token, user=UserResponse.model_validate(user))


@router.post("/login", response_model=UserWithToken)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Login with email + password. Returns a JWT."""
    user = authenticate_user(db, form.username, form.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated. Contact your administrator.",
        )

    token = create_access_token(
        {"sub": str(user.id), "email": user.email, "is_admin": user.is_admin}
    )
    logger.info(f"User logged in: {user.email}")
    return UserWithToken(access_token=token, user=UserResponse.model_validate(user))


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Return the currently authenticated user's profile."""
    return UserResponse.model_validate(current_user)
