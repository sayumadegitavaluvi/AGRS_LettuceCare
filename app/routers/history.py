from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.config.database import SessionLocal
from app.models.detection_history import DetectionHistory
from app.models.user import User
from app.utils.security import get_current_user
from app.models.disease import Disease
from app.schemas.detection_history_schema import DetectionHistoryResponse


router = APIRouter(
    prefix="/history",
    tags=["Detection History"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get(
    "/",
    response_model=list[DetectionHistoryResponse]
)
def get_history(
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    user = db.query(User).filter(
        User.email == current_user
    ).first()

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User tidak ditemukan"
        )

    histories = db.query(DetectionHistory).filter(
        DetectionHistory.user_id == user.id
    ).order_by(
        DetectionHistory.created_at.desc()
    ).all()

    result = []

    for history in histories:
        disease = db.query(Disease).filter(
            Disease.id == history.disease_id
        ).first()

        result.append({
            "id": history.id,
            "image_path": history.image_path,
            "diagnosis": history.diagnosis,
            "confidence": history.confidence,
            "created_at": history.created_at,
            "cause": disease.cause if disease else None,
            "treatment": (
                [
                    item.strip()
                    for item in disease.treatment.split("\n\n")
                    if item.strip()
                ]
                if disease
                else []
            )
        })

    return result

@router.get(
    "/{history_id}",
    response_model=DetectionHistoryResponse
)
def get_history_detail(
    history_id: int,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    user = db.query(User).filter(
        User.email == current_user
    ).first()

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User tidak ditemukan"
        )

    history = db.query(DetectionHistory).filter(
        DetectionHistory.id == history_id,
        DetectionHistory.user_id == user.id
    ).first()

    if history is None:
        raise HTTPException(
            status_code=404,
            detail="Riwayat deteksi tidak ditemukan"
        )

    disease = db.query(Disease).filter(
        Disease.id == history.disease_id
    ).first()

    return {
        "id": history.id,
        "image_path": history.image_path,
        "diagnosis": history.diagnosis,
        "confidence": history.confidence,
        "created_at": history.created_at,
        "cause": disease.cause if disease else None,
        "treatment": (
            [
                item.strip()
                for item in disease.treatment.split("\n\n")
                if item.strip()
            ]
            if disease
            else []
        )
    }

@router.delete("/{history_id}")
def delete_history(
    history_id: int,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    user = db.query(User).filter(
        User.email == current_user
    ).first()

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User tidak ditemukan"
        )

    history = db.query(DetectionHistory).filter(
        DetectionHistory.id == history_id,
        DetectionHistory.user_id == user.id
    ).first()

    if history is None:
        raise HTTPException(
            status_code=404,
            detail="Riwayat deteksi tidak ditemukan"
        )

    db.delete(history)
    db.commit()

    return {
        "message": "Riwayat deteksi berhasil dihapus"
    }

    return history