from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from pydantic import BaseModel

from app.config.database import SessionLocal
from app.models.user import User
from app.schemas.user_schema import UserCreate
from app.utils.security import (
    hash_password,
    verify_password,
    create_access_token
)

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# =========================
# Login Schema
# =========================

class UserLogin(BaseModel):
    email: str
    password: str


# =========================
# Register
# =========================

@router.post("/register")
def register(
    user: UserCreate,
    db: Session = Depends(get_db)
):

    # Cek apakah email sudah terdaftar
    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=409,
            detail="Email sudah terdaftar"
        )

    # Hash password sebelum disimpan ke database
    hashed_password = hash_password(
        user.password
    )

    new_user = User(
        username=user.username,
        email=user.email,
        password_hash=hashed_password
    )

    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

    except IntegrityError:
        # Membatalkan transaksi jika terjadi error database
        db.rollback()

        raise HTTPException(
            status_code=409,
            detail="Email sudah terdaftar"
        )

    return {
        "message": "User berhasil dibuat",
        "username": new_user.username,
        "email": new_user.email
    }


# =========================
# Login JWT
# =========================

@router.post("/login")
def login(
    user: UserLogin,
    db: Session = Depends(get_db)
):

    # Cari user berdasarkan email
    db_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if not db_user:
        raise HTTPException(
            status_code=404,
            detail="Email tidak ditemukan"
        )

    # Periksa password
    if not verify_password(
        user.password,
        db_user.password_hash
    ):
        raise HTTPException(
            status_code=401,
            detail="Password salah"
        )

    # Buat JWT access token
    access_token = create_access_token(
        data={
            "sub": db_user.email
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }