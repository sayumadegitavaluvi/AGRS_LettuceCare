from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.config.database import SessionLocal
from app.models.disease import Disease
from app.schemas.disease_schema import (
    DiseaseCreate,
    DiseaseResponse
)


router = APIRouter(
    prefix="/diseases",
    tags=["Knowledge Base"]
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


# =========================
# Tambah Knowledge Base
# =========================

@router.post(
    "/",
    response_model=DiseaseResponse
)
def create_disease(
    disease: DiseaseCreate,
    db: Session = Depends(get_db)
):

    existing = db.query(Disease).filter(
        Disease.code == disease.code
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Kode penyakit sudah ada"
        )

    new_disease = Disease(
        code=disease.code,
        name=disease.name,
        cause=disease.cause,
        treatment=disease.treatment
    )

    db.add(new_disease)
    db.commit()
    db.refresh(new_disease)

    return new_disease


# =========================
# Ambil Semua Knowledge Base
# =========================

@router.get(
    "/",
    response_model=list[DiseaseResponse]
)
def get_diseases(
    db: Session = Depends(get_db)
):

    return db.query(Disease).all()


# =========================
# Ambil Satu Knowledge Base
# =========================

@router.get(
    "/{disease_id}",
    response_model=DiseaseResponse
)
def get_disease(
    disease_id: int,
    db: Session = Depends(get_db)
):

    disease = db.query(Disease).filter(
        Disease.id == disease_id
    ).first()

    if not disease:
        raise HTTPException(
            status_code=404,
            detail="Data penyakit tidak ditemukan"
        )

    return disease