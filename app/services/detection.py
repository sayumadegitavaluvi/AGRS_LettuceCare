from pathlib import Path

from PIL import Image
from ultralytics import YOLO
from sqlalchemy.orm import Session

from app.models.disease import Disease


MODEL_PATH = Path("model/best.pt")

model = YOLO(str(MODEL_PATH))


# Mapping nama kelas dari model YOLO
# ke nama yang ada di Knowledge Base
CLASS_MAPPING = {
    "Bacterial": "Bacterial",
    "Powderly_mildew_on_lettuce": "Powdery Mildew",
    "Wilt_and_leaf_blight_on_lettuce": "Fusarium Wilt",
    "fungal": "Fungal",
    "healthy": "Healthy"
}


def predict_image(
    image_path: str,
    db: Session
):

    image = Image.open(image_path).convert("RGB")

    results = model.predict(
        source=image,
        conf=0.25,
        verbose=False
    )

    result = results[0]

    if result.probs is None:
        return None

    # Ambil class ID dengan confidence tertinggi
    class_id = int(result.probs.top1)

    # Confidence
    confidence = float(result.probs.top1conf)

    # Nama kelas dari model
    class_name = model.names[class_id]

    # Cocokkan dengan Knowledge Base
    kb_name = CLASS_MAPPING.get(class_name)

    if kb_name is None:
        return {
            "class_id": class_id,
            "class_name": class_name,
            "confidence": confidence,
            "knowledge_base": None
        }

    # Cari data di database
    disease = db.query(Disease).filter(
        Disease.name == kb_name
    ).first()

    if disease is None:
        return {
            "class_id": class_id,
            "class_name": class_name,
            "confidence": confidence,
            "knowledge_base": None
        }

    return {
        "class_id": class_id,
        "class_name": class_name,
        "confidence": confidence,
        "knowledge_base": {
            "id": disease.id,
            "code": disease.code,
            "name": disease.name,
            "cause": disease.cause,
            "treatment": disease.treatment
        }
    }