"""
Admin endpoints (require is_admin=True):
  GET   /admin/users           — list all users
  POST  /admin/users           — create a user (admin can set is_admin flag)
  PATCH /admin/users/{user_id} — update is_active / is_admin / full_name
"""
import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.models import User
from app.schemas.auth import AdminUserCreate, AdminUserUpdate, UserResponse
from app.services.auth_service import (
    get_current_admin_user,
    get_db,
    hash_password,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/users", response_model=list[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin_user),
):
    """Return all users (admin only)."""
    users = db.query(User).order_by(User.created_at.desc()).all()
    return [UserResponse.model_validate(u) for u in users]


@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: AdminUserCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin_user),
):
    """Admin creates a user directly (can set is_admin flag)."""
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
        is_active=True,
        is_admin=payload.is_admin,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    logger.info(f"Admin created user: {user.email} (admin={user.is_admin})")
    return UserResponse.model_validate(user)


@router.patch("/users/{user_id}", response_model=UserResponse)
def update_user(
    user_id: UUID,
    payload: AdminUserUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user),
):
    """Update a user's status or role (admin only)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Prevent admin from demoting themselves
    if user.id == admin.id and payload.is_admin is False:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove admin role from yourself.",
        )

    if payload.is_active is not None:
        user.is_active = payload.is_active
    if payload.is_admin is not None:
        user.is_admin = payload.is_admin
    if payload.full_name is not None:
        user.full_name = payload.full_name

    db.commit()
    db.refresh(user)
    logger.info(f"Admin updated user {user.email}: active={user.is_active}, admin={user.is_admin}")
    return UserResponse.model_validate(user)
