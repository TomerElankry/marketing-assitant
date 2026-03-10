"""
Authentication service — JWT creation/validation + password hashing.
"""
import logging
import secrets
import smtplib
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.models import User
from app.db.session import SessionLocal
from app.schemas.auth import TokenData

logger = logging.getLogger(__name__)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 token URL (used by FastAPI's Swagger UI "Authorize" button)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

ALGORITHM = "HS256"


# ---------------------------------------------------------------------------
# Password helpers
# ---------------------------------------------------------------------------

def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


# ---------------------------------------------------------------------------
# JWT helpers
# ---------------------------------------------------------------------------

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta if expires_delta else timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode["exp"] = expire
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> TokenData:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        email: str = payload.get("email")
        is_admin: bool = payload.get("is_admin", False)
        if user_id is None:
            raise ValueError("Missing sub claim")
        return TokenData(user_id=user_id, email=email, is_admin=is_admin)
    except JWTError as exc:
        raise ValueError(f"Invalid token: {exc}") from exc


# ---------------------------------------------------------------------------
# DB dependency helper
# ---------------------------------------------------------------------------

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------------------------------------------------------------------------
# FastAPI dependencies
# ---------------------------------------------------------------------------

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        token_data = decode_token(token)
    except ValueError:
        raise credentials_exc

    user = db.query(User).filter(User.id == token_data.user_id).first()
    if user is None or not user.is_active:
        raise credentials_exc
    return user


def get_current_admin_user(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user


# ---------------------------------------------------------------------------
# User helpers
# ---------------------------------------------------------------------------

RESET_TOKEN_EXPIRE_MINUTES = 30


def generate_reset_token() -> str:
    return secrets.token_urlsafe(32)


def send_reset_email(to_email: str, reset_token: str) -> None:
    from app.core.config import settings
    reset_url = f"{settings.FRONTEND_URL}?reset_token={reset_token}"

    if not settings.SMTP_HOST:
        logger.info(f"[DEV] Password reset link for {to_email}: {reset_url}")
        return

    body = (
        f"Hi,\n\nClick the link below to reset your PHIL password "
        f"(expires in {RESET_TOKEN_EXPIRE_MINUTES} minutes):\n\n{reset_url}\n\n"
        f"If you didn't request this, you can ignore this email."
    )
    msg = MIMEText(body)
    msg["Subject"] = "Reset your PHIL password"
    msg["From"] = settings.FROM_EMAIL
    msg["To"] = to_email

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as smtp:
            smtp.starttls()
            smtp.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            smtp.send_message(msg)
        logger.info(f"Password reset email sent to {to_email}")
    except Exception as exc:
        logger.error(f"Failed to send reset email to {to_email}: {exc}")
        raise


def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    user = db.query(User).filter(User.email == email).first()
    if not user or not user.hashed_password:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user
