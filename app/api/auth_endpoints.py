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
from app.schemas.auth import UserCreate, UserResponse, UserWithToken, GoogleTokenPayload
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


@router.post("/google", response_model=UserWithToken)
def google_login(payload: GoogleTokenPayload, db: Session = Depends(get_db)):
    """
    Verify a Google ID token issued by the frontend (GSI / @react-oauth/google).
    Finds or creates the user, then returns a JWT identical to /login.
    """
    from google.oauth2 import id_token as google_id_token
    from google.auth.transport import requests as google_requests
    from app.core.config import settings

    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Google OAuth is not configured on this server.",
        )

    try:
        id_info = google_id_token.verify_oauth2_token(
            payload.credential,
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Google token: {exc}",
        )

    google_sub: str = id_info["sub"]
    email: str = id_info.get("email", "")
    full_name: str | None = id_info.get("name")

    # 1) look up by google_id
    user = db.query(User).filter(User.google_id == google_sub).first()

    # 2) look up by email (link accounts)
    if not user and email:
        user = db.query(User).filter(User.email == email).first()
        if user:
            user.google_id = google_sub
            db.commit()

    # 3) create new user
    if not user:
        is_first_user = db.query(User).count() == 0
        user = User(
            email=email,
            hashed_password="",  # Google users never use password login
            full_name=full_name,
            google_id=google_sub,
            is_active=True,
            is_admin=is_first_user,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        logger.info(f"New Google user created: {user.email}")

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated. Contact your administrator.",
        )

    token = create_access_token(
        {"sub": str(user.id), "email": user.email, "is_admin": user.is_admin}
    )
    logger.info(f"Google login: {user.email}")
    return UserWithToken(access_token=token, user=UserResponse.model_validate(user))
