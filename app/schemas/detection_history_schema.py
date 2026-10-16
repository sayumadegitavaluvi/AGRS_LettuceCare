from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class DetectionHistoryResponse(BaseModel):
    id: int
    image_path: str
    diagnosis: str
    confidence: float
    created_at: datetime
    cause: Optional[str] = None
    treatment: List[str]

    class Config:
        from_attributes = True