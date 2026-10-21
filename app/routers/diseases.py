from app.utils.knowledge_base_security import (verify_knowledge_base_key)
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.config.database import SessionLocal
from app.models.disease import Disease
from app.schemas.disease_schema import (DiseaseCreate, DiseaseResponse, DiseaseUpdate)
from sqlalchemy.exc import IntegrityError


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
    response_model=DiseaseResponse,
    dependencies=[
        Depends(verify_knowledge_base_key)
    ]
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

# =========================
# Hapus Knowledge Base
# =========================

@router.delete(
    "/{disease_id}",
    dependencies=[
        Depends(verify_knowledge_base_key)
    ]
)
def delete_disease(
    disease_id: int,
    db: Session = Depends(get_db)
):

    # Cari penyakit berdasarkan ID
    disease = db.query(Disease).filter(
        Disease.id == disease_id
    ).first()

    if not disease:
        raise HTTPException(
            status_code=404,
            detail="Data penyakit tidak ditemukan"
        )

    # Cek apakah penyakit digunakan dalam history
    from app.models.detection_history import DetectionHistory

    existing_history = db.query(DetectionHistory).filter(
        DetectionHistory.disease_id == disease_id
    ).first()

    if existing_history:
        raise HTTPException(
            status_code=409,
            detail=(
                "Penyakit tidak dapat dihapus karena "
                "sudah digunakan dalam riwayat deteksi"
            )
        )

    # Hapus data penyakit
    db.delete(disease)
    db.commit()

    return {
        "message": "Data penyakit berhasil dihapus",
        "deleted_disease_id": disease_id
    }


# =========================
# Hapus Knowledge Base
# =========================

@router.delete(
    "/{disease_id}",
    dependencies=[
        Depends(verify_knowledge_base_key)
    ]
)
def delete_disease(
    disease_id: int,
    db: Session = Depends(get_db)
):
    from app.models.detection_history import DetectionHistory

    # Cari data penyakit
    disease = db.query(Disease).filter(
        Disease.id == disease_id
    ).first()

    if disease is None:
        raise HTTPException(
            status_code=404,
            detail="Data penyakit tidak ditemukan"
        )

    # Periksa apakah penyakit digunakan dalam history
    existing_history = db.query(DetectionHistory).filter(
        DetectionHistory.disease_id == disease_id
    ).first()

    if existing_history:
        raise HTTPException(
            status_code=409,
            detail=(
                "Penyakit tidak dapat dihapus karena "
                "sudah digunakan dalam riwayat deteksi"
            )
        )

    # Hapus penyakit dari database
    db.delete(disease)
    db.commit()

    return {
        "message": "Data penyakit berhasil dihapus",
        "deleted_disease_id": disease_id
    }

# =========================
# Update Knowledge Base
# =========================

@router.patch(
    "/{disease_id}",
    response_model=DiseaseResponse,
    dependencies=[
        Depends(verify_knowledge_base_key)
    ]
)
def update_disease(
    disease_id: int,
    disease_update: DiseaseUpdate,
    db: Session = Depends(get_db)
):

    # 1. Cari penyakit berdasarkan ID
    disease = db.query(Disease).filter(
        Disease.id == disease_id
    ).first()

    if disease is None:
        raise HTTPException(
            status_code=404,
            detail="Data penyakit tidak ditemukan"
        )

    # 2. Ambil hanya field yang dikirim
    update_data = disease_update.model_dump(
        exclude_unset=True
    )

    # 3. Pastikan ada field yang diperbarui
    if not update_data:
        raise HTTPException(
            status_code=400,
            detail="Tidak ada data yang diperbarui"
        )

    # 4. Tolak nilai null
    for field, value in update_data.items():
        if value is None:
            raise HTTPException(
                status_code=422,
                detail=f"Field {field} tidak boleh null"
            )

    # 5. Perbarui field pada model
    for field, value in update_data.items():
        setattr(disease, field, value)

    # 6. Simpan perubahan database
    try:
        db.commit()
        db.refresh(disease)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=409,
            detail=(
                "Kode atau nama penyakit "
                "sudah digunakan"
            )
        )

    # 7. Kembalikan data terbaru
    return disease
