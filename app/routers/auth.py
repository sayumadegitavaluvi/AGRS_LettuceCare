from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

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
# Register
# =========================

@router.post("/register")
def register(
    user: UserCreate,
    db: Session = Depends(get_db)
):

    hashed_password = hash_password(
        user.password
    )

    new_user = User(
        username=user.username,
        email=user.email,
        password_hash=hashed_password
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "User berhasil dibuat",
        "username": new_user.username,
        "email": new_user.email
    }


# =========================
# Login JWT OAuth2
# =========================

@router.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):

    # OAuth2 memakai username,
    # kita isi dengan email user
    db_user = db.query(User).filter(
        User.email == form_data.username
    ).first()


    if not db_user:
        raise HTTPException(
            status_code=404,
            detail="Email tidak ditemukan"
        )


    if not verify_password(
        form_data.password,
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