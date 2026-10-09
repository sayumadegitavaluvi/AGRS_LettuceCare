from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from datetime import datetime

from app.config.database import Base


class DetectionHistory(Base):
    __tablename__ = "detection_history"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    disease_id = Column(
        Integer,
        ForeignKey("diseases.id"),
        nullable=False
    )

    image_path = Column(
        String(255),
        nullable=False
    )

    diagnosis = Column(
        String(100),
        nullable=False
    )

    confidence = Column(
        Float,
        nullable=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )