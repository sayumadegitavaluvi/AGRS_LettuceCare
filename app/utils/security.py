from datetime import datetime, timedelta, timezone
import secrets
import hashlib

from passlib.context import CryptContext
from jose import jwt, JWTError

from fastapi import Depends, HTTPException
from fastapi.security import (
    HTTPBearer,
    HTTPAuthorizationCredentials
)


# =========================
# Bearer Token
# =========================

security = HTTPBearer()


# =========================
# JWT Config
# =========================

SECRET_KEY = "lettucecare-secret-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60


# =========================
# Password Hashing
# =========================

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


def hash_password(password: str):
    return pwd_context.hash(password)


def verify_password(
    plain_password,
    hashed_password
):
    return pwd_context.verify(
        plain_password,
        hashed_password
    )


# =========================
# Create JWT Token
# =========================

def create_access_token(data: dict):

    to_encode = data.copy()

    expire = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    to_encode.update({
        "exp": expire
    })

    token = jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return token


# =========================
# Validate JWT Token
# =========================

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):

    token = credentials.credentials

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        email = payload.get("sub")

        if email is None:
            raise HTTPException(
                status_code=401,
                detail="Token tidak valid"
            )

        return email

    except JWTError:

        raise HTTPException(
            status_code=401,
            detail="Token tidak valid"
        )


# =========================
# Generate OTP
# =========================

def generate_otp():
    """
    Membuat OTP 6 digit.
    """

    return f"{secrets.randbelow(1000000):06d}"


# =========================
# Hash OTP
# =========================

def hash_otp(otp: str):
    """
    Mengubah OTP menjadi SHA-256
    sebelum disimpan ke database.
    """

    return hashlib.sha256(
        otp.encode()
    ).hexdigest()


# =========================
# Verify OTP
# =========================

def verify_otp(
    otp: str,
    otp_hash: str
):
    """
    Memeriksa apakah OTP yang diberikan
    cocok dengan hash yang tersimpan.
    """

    return hash_otp(otp) == otp_hash