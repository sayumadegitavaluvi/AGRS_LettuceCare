from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime

from app.config.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )