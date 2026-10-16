from pathlib import Path
import shutil

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session

from app.config.database import SessionLocal
from app.services.detection import predict_image
from app.models.detection_history import DetectionHistory
from app.models.user import User
from app.utils.security import get_current_user


router = APIRouter(
    prefix="/detection",
    tags=["Detection"]
)


UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


@router.post("/predict")
def predict(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):

    # Pastikan file berupa gambar
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="File harus berupa gambar"
        )

    # Simpan gambar
    file_path = UPLOAD_DIR / file.filename

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
    User.email == current_user).first()

    if user is None:
        raise HTTPException(status_code=404,detail="User tidak ditemukan")

    history = DetectionHistory(
        user_id=user.id,
        disease_id=knowledge_base["id"],
        image_path=str(file_path),
        diagnosis=knowledge_base["name"],
        confidence=round(result["confidence"] * 100, 2))

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