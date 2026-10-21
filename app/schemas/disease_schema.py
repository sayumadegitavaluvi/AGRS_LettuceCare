from pydantic import BaseModel, ConfigDict


class DiseaseCreate(BaseModel):
    code: str
    name: str
    cause: str
    treatment: str

class DiseaseUpdate(BaseModel):
    code: str | None = None
    name: str | None = None
    cause: str | None = None
    treatment: str | None = None

class DiseaseResponse(BaseModel):
    id: int
    code: str
    name: str
    cause: str
    treatment: str

    model_config = ConfigDict(from_attributes=True)