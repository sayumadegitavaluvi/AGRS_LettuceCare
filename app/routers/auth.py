from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from pydantic import BaseModel

from app.config.database import SessionLocal
from app.models.user import User
from app.models.password_reset import PasswordReset

from app.schemas.user_schema import UserCreate
from app.schemas.password_reset_schema import (
    ForgotPasswordRequest,
    VerifyOTPRequest,
    ResetPasswordRequest
)

from app.utils.security import (
    hash_password,
    verify_password,
    create_access_token,
    generate_otp,
    hash_otp,
    verify_otp
)

from app.utils.email import send_otp_email


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


# =========================
# Database
# =========================

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

    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=409,
            detail="Email sudah terdaftar"
        )

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

    db_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if not db_user:
        raise HTTPException(
            status_code=404,
            detail="Email tidak ditemukan"
        )

    if not verify_password(
        user.password,
        db_user.password_hash
    ):
        raise HTTPException(
            status_code=401,
            detail="Password salah"
        )

    access_token = create_access_token(
        data={
            "sub": db_user.email
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


# =========================
# Forgot Password
# =========================

@router.post("/forgot-password")
def forgot_password(
    request: ForgotPasswordRequest,
    db: Session = Depends(get_db)
):

    # Cari user berdasarkan email
    user = db.query(User).filter(
        User.email == request.email
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="Email tidak ditemukan"
        )

    # =========================
    # Buat OTP 6 digit
    # =========================

    otp = generate_otp()

    # =========================
    # Hash OTP
    # =========================

    otp_hash = hash_otp(otp)

    # =========================
    # OTP berlaku 10 menit
    # =========================

    expires_at = datetime.utcnow() + timedelta(
        minutes=10
    )

    # =========================
    # Nonaktifkan OTP lama
    # =========================

    db.query(PasswordReset).filter(
        PasswordReset.user_id == user.id,
        PasswordReset.is_used == 0
    ).update({
        PasswordReset.is_used: 1
    })

    # =========================
    # Simpan OTP baru
    # =========================

    reset_request = PasswordReset(
        user_id=user.id,
        otp_hash=otp_hash,
        expires_at=expires_at,
        is_used=0
    )

    db.add(reset_request)

    # =========================
    # Kirim OTP ke email
    # =========================

    try:

        send_otp_email(
            recipient_email=user.email,
            otp=otp
        )

    except Exception as e:

        db.rollback()

        print(
            "Gagal mengirim OTP:",
            repr(e)
        )

        raise HTTPException(
            status_code=500,
            detail="OTP gagal dikirim ke email"
        )

    # =========================
    # Simpan perubahan database
    # =========================

    db.commit()
    db.refresh(reset_request)

    # =========================
    # Response
    # =========================

    return {
        "message": "Kode OTP telah dikirim ke email",
        "expires_in_minutes": 10
    }


# =========================
# Verify Reset OTP
# =========================

@router.post("/verify-reset-otp")
def verify_reset_otp(
    request: VerifyOTPRequest,
    db: Session = Depends(get_db)
):

    user = db.query(User).filter(
        User.email == request.email
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="Email tidak ditemukan"
        )

    # =========================
    # Cari OTP terbaru
    # =========================

    reset_request = (
        db.query(PasswordReset)
        .filter(
            PasswordReset.user_id == user.id,
            PasswordReset.is_used == 0
        )
        .order_by(
            PasswordReset.created_at.desc()
        )
        .first()
    )

    if not reset_request:
        raise HTTPException(
            status_code=400,
            detail="Kode OTP tidak ditemukan atau sudah digunakan"
        )

    # =========================
    # Cek masa berlaku OTP
    # =========================

    if datetime.utcnow() > reset_request.expires_at:
        raise HTTPException(
            status_code=400,
            detail="Kode OTP sudah kedaluwarsa"
        )

    # =========================
    # Cek OTP
    # =========================

    if not verify_otp(
        request.otp,
        reset_request.otp_hash
    ):
        raise HTTPException(
            status_code=400,
            detail="Kode OTP salah"
        )

    return {
        "message": "OTP valid",
        "email": user.email
    }


# =========================
# Reset Password
# =========================

@router.post("/reset-password")
def reset_password(
    request: ResetPasswordRequest,
    db: Session = Depends(get_db)
):

    # =========================
    # Cari user berdasarkan email
    # =========================

    user = db.query(User).filter(
        User.email == request.email
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="Email tidak ditemukan"
        )

    # =========================
    # Cari OTP terbaru
    # =========================

    reset_request = (
        db.query(PasswordReset)
        .filter(
            PasswordReset.user_id == user.id,
            PasswordReset.is_used == 0
        )
        .order_by(
            PasswordReset.created_at.desc()
        )
        .first()
    )

    if not reset_request:
        raise HTTPException(
            status_code=400,
            detail="Kode OTP tidak ditemukan atau sudah digunakan"
        )

    # =========================
    # Cek masa berlaku OTP
    # =========================

    if datetime.utcnow() > reset_request.expires_at:
        raise HTTPException(
            status_code=400,
            detail="Kode OTP sudah kedaluwarsa"
        )

    # =========================
    # Verifikasi OTP
    # =========================

    if not verify_otp(
        request.otp,
        reset_request.otp_hash
    ):
        raise HTTPException(
            status_code=400,
            detail="Kode OTP salah"
        )

    # =========================
    # Validasi password baru
    # =========================

    if len(request.new_password) < 8:
        raise HTTPException(
            status_code=400,
            detail="Password baru minimal 8 karakter"
        )

    # =========================
    # Hash password baru
    # =========================

    user.password_hash = hash_password(
        request.new_password
    )

    # =========================
    # Tandai OTP sudah digunakan
    # =========================

    reset_request.is_used = 1

    db.commit()

    return {
        "message": "Password berhasil diubah"
    }