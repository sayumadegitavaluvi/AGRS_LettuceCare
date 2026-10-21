from pathlib import Path
import shutil
from uuid import uuid4

from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.orm import Session

from app.config.database import SessionLocal
from app.services.detection import predict_image
from app.models.detection_history import DetectionHistory
from app.models.user import User
from app.utils.security import get_current_user
from enum import Enum


router = APIRouter(
    prefix="/detection",
    tags=["Detection"]
)


# Folder uploads berada di root project backend
UPLOAD_DIR = Path(__file__).resolve().parents[2] / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

class PlantAge(str, Enum):
    AGE_8_14 = "8–14 hari"
    AGE_15_30 = "15–30 hari"
    AGE_ABOVE_30 = "> 30 hari"


class PlantCondition(str, Enum):
    HEALTHY = "Daun sehat"
    SPOTS = "Bercak cokelat atau kehitaman pada daun"
    WHITE_LAYER = "Lapisan putih seperti tepung"
    WILTING = "Daun layu atau menguning"
    ROTTEN = "Daun busuk atau rusak"
    HOLES = "Lubang pada daun"
    OTHER = "Gejala lainnya"

def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


@router.post("/predict")
def predict(
    file: UploadFile = File(...),
    plant_age: PlantAge | None = Form(None),
    plant_condition: PlantCondition | None = Form(None),
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):

    # Pastikan file berupa gambar
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="File harus berupa gambar"
        )

    # Simpan gambar menggunakan nama unik
    extension = Path(file.filename or "").suffix.lower() or ".jpg"
    filename = f"{uuid4().hex}{extension}"
    file_path = UPLOAD_DIR / filename

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Jalankan deteksi
    result = predict_image(
        str(file_path),
        db
    )

    if result is None:
        raise HTTPException(
            status_code=400,
            detail="Gambar tidak dapat dideteksi"
        )

    knowledge_base = result.get("knowledge_base")

    if knowledge_base is None:
        raise HTTPException(
            status_code=404,
            detail="Data penyakit tidak ditemukan di Knowledge Base"
        )

    user = db.query(User).filter(
        User.email == current_user
    ).first()

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User tidak ditemukan"
        )

    history = DetectionHistory(
        user_id=user.id,
        disease_id=knowledge_base["id"],
        image_path=f"/uploads/{filename}",
        plant_age=plant_age.value if plant_age else None,
        plant_condition=plant_condition.value if plant_condition else None,
        diagnosis=knowledge_base["name"],
        confidence=round(result["confidence"] * 100, 2)
    )

    db.add(history)
    db.commit()
    db.refresh(history)

    # Pisahkan treatment berdasarkan baris baru
    treatment = [
        item.strip()
        for item in knowledge_base["treatment"].split("\n\n")
        if item.strip()
    ]

    return {
        "diagnosis": knowledge_base["name"],
        "confidence": round(
            result["confidence"] * 100,
            2
        ),
        "cause": knowledge_base["cause"],
        "treatment": treatment
    }